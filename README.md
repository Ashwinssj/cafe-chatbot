# Cafe Chatbot API

A FastAPI-based chatbot for cafe ordering assistance, powered by Google's Gemini AI.

## Features

- Interactive chatbot interface for cafe ordering
- Menu and ingredient information integration
- Order tracking and confirmation workflow
- Best sellers showcase with images and pricing
- Multi-size drink options (Medium/Large)
- Conversation history context

## Prerequisites

- Python 3.8+
- Google Gemini API key
- Python virtual environment (recommended)

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/cafe-chatbot.git
cd cafe-chatbot
```

2. Create and activate a virtual environment:
```bash
python -m venv venv
venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Create a `.env` file in the project root with your Gemini API key:
```env
GEMINI_API_KEY=your_api_key_here
```

5. Place your menu data files (`menuCafe.csv` and `MenuStore.csv`) in the project root.

## Running the Application

Start the FastAPI server:
```bash
uvicorn chatbot_backend:app --host 127.0.0.1 --port 5000
```

The API will be available at `http://127.0.0.1:5000`

## API Endpoints

- `GET /` - Health check endpoint
- `GET /health` - Service health status
- `POST /chat` - Main chatbot endpoint (accepts JSON with `message` field)

## Example Request

```bash
curl -X POST "http://127.0.0.1:5000/chat" \
-H "Content-Type: application/json" \
-d '{"message":"What are your best sellers?"}'
```

## Response Format

```json
{
  "response": {
    "text": "Our best sellers are...",
    "type": "best_sellers",
    "products": [
      {
        "name": "Cold Coffee",
        "image": "/images/cold-coffee.jpg",
        "sizes": ["Medium", "Large"],
        "price": {
          "Medium": 150,
          "Large": 180
        }
      }
    ]
  }
}
```

## Project Structure

```
chatbot/
├── chatbot_backend.py       # Main FastAPI application
├── menuCafe.csv             # Menu items data
├── MenuStore.csv            # Ingredients data
├── requirements.txt         # Python dependencies
├── README.md                # This file
└── .env                     # Environment variables
```

## Frontend Integration

To integrate with a frontend, ensure CORS is configured properly (already set in the code). Example frontend code can make POST requests to `/chat` with user messages.

## License

MIT License - see [LICENSE](LICENSE) file (create one if needed)
```

This README provides:
1. Clear project description
2. Installation and setup instructions
3. API usage examples
4. Response format documentation
5. Project structure overview
6. Frontend integration notes

You can customize it further by adding:
- Screenshots of your frontend
- Deployment instructions
- Additional API endpoint details
- Contribution guidelines
'''
