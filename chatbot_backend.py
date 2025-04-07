import google.generativeai as genai
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import pandas as pd
import os
import logging
from dotenv import load_dotenv
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.responses import HTMLResponse

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

load_dotenv()

# Load the data
menu_df = pd.read_csv('menuCafe.csv')
ingredients_df = pd.read_csv('MenuStore.csv')

# Create knowledge base context
menu_context = menu_df.to_string()
ingredients_context = ingredients_df.to_string()

# Define the base prompt template
PROMPT_TEMPLATE = """
You are a helpful cafe assistant. You have access to our menu and ingredients information.

Menu Information:
{menu_context}

Ingredients Information:
{ingredients_context}

Previous conversation:
{chat_history}
"""

# Initialize FastAPI app
app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add this after app initialization
app.mount("/static", StaticFiles(directory="static"), name="static")
app.mount("/images", StaticFiles(directory="static/images"), name="images")

# Define ChatInput model
class ChatInput(BaseModel):
    message: str


# Mount static files and configure templates
app.mount("/static", StaticFiles(directory=os.path.join(os.path.dirname(__file__), "static")), name="static")
templates = Jinja2Templates(directory="templates")

# Modify the root endpoint
@app.get("/", response_class=HTMLResponse)
async def root():
    return templates.TemplateResponse("index.html", {"request": {}})

@app.head("/")
async def root_head():
    return

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

# Add after the PROMPT_TEMPLATE definition:

# Configure Gemini API
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
genai.configure(api_key=GEMINI_API_KEY)

class CafeBot:
    def __init__(self, api_key):
        try:
            genai.configure(api_key=api_key)
            self.model = genai.GenerativeModel('gemini-2.0-flash-thinking-exp-01-21')
            self.chat_history = []  # Add chat history list
            self.current_order = None  # Track current order
            self.drink_images = {
                "cappuccino": "/images/cappuccino.jpg",
                "latte": "/images/latte.jpg",
                "espresso": "/images/espresso.jpg",
                "mocha": "/images/mocha.jpg",
                "cold mocha": "/images/cold-mocha.jpg",
                "white mocha": "/images/white-mocha.jpg",
                "cold coffee": "/images/cold-coffee.jpg",
                "flat white": "/images/flat-white.jpg",
                "hot chocolate": "/images/hot-chocolate.jpg",
                "caramel macchiato": "/images/caramel-macchiato.jpg",
                "lemonade": "/images/lemonade.jpg",
                "iced tea": "/images/iced-tea.jpg",
                "green tea": "/images/green-tea.jpg",
            }
            self.best_sellers = ["cold coffee", "mocha", "green tea"]
            self.prompt = f"""
            You are a friendly and knowledgeable cafe assistant. Use the following menu and ingredients information to help customers.
            Always use ₹ (Indian rupees) as the currency symbol.
            Be short, discriptive, conversational and helpful. If asked about prices, mention both sizes if available.
            If someone orders a drink, confirm their order and ask about the size preference.
            
            MENU ITEMS:
            {menu_context}

            INGREDIENTS:
            {ingredients_context}

            Additional Instructions:
            - Recommend similar drinks if asked
            - Mention ingredients when asked about specific drinks
            - Be helpful with dietary information
            - If asked about unavailable items, politely explain they're not on the menu
            - Maintain a friendly, professional tone
            - When asked about best sellers, highlight Cold Coffee, Mocha, and Green Tea
            """
        except Exception as e:
            logger.error(f"Failed to initialize bot: {e}")
            raise

        # Add order tracking
        self.order_state = {
            "current_step": None,  # greeting, category_selection, item_selection, confirmation, payment
            "selected_category": None,
            "selected_items": [],
            "total_amount": 0
        }
        
        # Add workflow prompts
        self.workflow_prompts = {
            "greeting": "Welcome to our café! 😊 Would you like to order beverages or food?",
            "category_selection": "Please select a category:\n1. Beverages (Coffee, Other Drinks)\n2. Food (Quick Bites, Cake, Soup)",
            "confirmation": "Your order: {items}\nTotal: ₹{total}\nWould you like to confirm this order?",
            "payment": "Please select your payment method:\n1. Cash\n2. Card\n3. UPI",
            "completion": "Thank you! Your order #{order_id} is being prepared. Estimated time: {time} minutes."
        }

    def get_response(self, user_input):
        try:
            # Add user input to chat history
            self.chat_history.append({"role": "user", "content": user_input})
            
            # Create conversation context
            conversation_context = "\n".join([
                f"{'Bot' if msg['role'] == 'assistant' else 'Customer'}: {msg['content']}"
                for msg in self.chat_history[-5:]  # Keep last 5 messages for context
            ])
            
            full_prompt = f"{self.prompt}\n\nPrevious conversation:\n{conversation_context}\n\nCustomer: {user_input}"
            response = self.model.generate_content(full_prompt)
            
            # Clean the response text by removing markdown backticks and "Bot:" prefix
            cleaned_response = response.text.replace('```', '').replace('Bot:', '').strip()
            
            # Add bot response to chat history
            self.chat_history.append({"role": "assistant", "content": cleaned_response})
            
            response_data = {
                "text": cleaned_response,
                "type": "text"
            }
            
            # Check for order-related queries
            ordered_drink = self.check_for_drink_order(user_input.lower())
            if ordered_drink:
                self.current_order = {
                    "drink": ordered_drink,
                    "size": None,
                    "confirmed": False
                }
            
            # Handle size confirmation if there's a pending order
            if self.current_order and not self.current_order["confirmed"]:
                if "medium" in user_input.lower() or "large" in user_input.lower():
                    self.current_order["size"] = "Medium" if "medium" in user_input.lower() else "Large"
                    self.current_order["confirmed"] = True
            
            response_data = {
                "text": response.text,
                "type": "text"
            }
            
            # Add order information to response if relevant
            if self.current_order:
                response_data["order"] = self.current_order
                if self.current_order["confirmed"]:
                    closing_message = "\n\nThank you for your order! 😊 We hope you enjoy your drink. Please visit us again soon! Is there anything else I can help you with?"
                    response_data["text"] += closing_message
                    self.current_order = None  # Reset after confirmation
            
            is_best_sellers_request = "best seller" in user_input.lower() or "popular" in user_input.lower() or "recommend" in user_input.lower()
            
            if is_best_sellers_request:
                # Create best sellers showcase
                best_sellers_data = []
                for drink in self.best_sellers:
                    best_sellers_data.append({
                        "name": drink.title(),
                        "image": self.drink_images.get(drink.lower(), ""),
                        "sizes": self.get_drink_sizes(drink),
                        "price": self.get_drink_price(drink)
                    })
                
                response_data = {
                    "text": response.text,
                    "type": "best_sellers",
                    "products": best_sellers_data
                }
            elif ordered_drink:
                response_data = {
                    "text": response.text,
                    "type": "order",
                    "drink": ordered_drink,
                    "image": self.drink_images.get(ordered_drink.lower(), ""),
                    "options": {
                        "sizes": self.get_drink_sizes(ordered_drink),
                        "price": self.get_drink_price(ordered_drink)
                    }
                }
            return response_data
            
        except Exception as e:
            logger.error(f"Error generating response: {e}")
            return {
                "text": "I apologize, but I'm having trouble processing your request. Please try again.",
                "type": "error"
            }

    def check_for_drink_order(self, input_text):
        drinks = menu_df['item_name'].unique()
        for drink in drinks:
            if drink.lower() in input_text:
                return drink
        return None

    def get_drink_sizes(self, drink):
        sizes = menu_df[menu_df['item_name'] == drink]['item_size'].unique()
        return [size for size in sizes if size != 'N/A']

    def get_drink_price(self, drink):
        try:
            prices = menu_df[menu_df['item_name'] == drink]['item_price'].unique()
            return {
                "Medium": float(prices[0]) if len(prices) > 0 else 0,
                "Large": float(prices[1]) if len(prices) > 1 else 0
            }
        except Exception as e:
            logger.error(f"Price lookup error: {e}")
            return {"Medium": 0, "Large": 0}

# Update the chat endpoint
# Add this line at the top level of your file, after the imports
bot = CafeBot(GEMINI_API_KEY)

# Add the missing chat endpoint
@app.post("/chat")
async def chat(request: ChatInput):
    try:
        response_data = bot.get_response(request.message)
        
        # Clean the response if it's a string
        if isinstance(response_data, dict) and 'text' in response_data:
            response_data['text'] = response_data['text'].replace('```', '').replace('Bot:', '').strip()
        
        return {"response": response_data}
    except Exception as e:
        logger.error(f"Error in chat endpoint: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    try:
        uvicorn.run(
            app, 
            host="0.0.0.0",  # Changed from 0.0.0.0 to localhost
            port=5000,         # Changed from 8000 to 5000
            log_level="info"
        )
    except Exception as e:
        logger.error(f"Failed to start server: {e}")
