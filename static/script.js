const responses = {
    "menu": "We offer a variety of coffee drinks, pastries, and light meals. Our specialties include Cappuccino, Latte, and homemade croissants.",
    "hours": "We're open Monday to Friday from 7 AM to 8 PM, and weekends from 8 AM to 6 PM.",
    "location": "We're located at 123 Coffee Street, Downtown Area.",
    "wifi": "Yes, we offer free WiFi to all our customers!",
    "reservation": "For reservations, please call us at (555) 123-4567.",
};

// Send message to backend API with fallback to local processing
async function sendMessageToBackend(message) {
    try {
        // Use the current domain instead of hardcoded localhost URL
        const apiUrl = window.location.origin + '/chat';
        
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ message: message })
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Clean the response text
        if (data.response && typeof data.response === 'string') {
            return data.response.replace(/```/g, '').replace(/Bot:/g, '').trim();
        } else if (data.response && data.response.text) {
            return data.response.text.replace(/```/g, '').replace(/Bot:/g, '').trim();
        }
        
        return data.response;
    } catch (error) {
        console.error('Error:', error);
        return processMessage(message); // Fallback to local processing
    }
}

// Handle sending messages
async function sendMessage() {
    const input = document.getElementById('userInput');
    const message = input.value.trim();
    
    if (message === '') return;
    
    // Add user message
    addMessage(message, 'user');
    input.value = '';
    
    try {
        // Check for local responses first
        const localResponse = processMessage(message);
        if (localResponse) {
            addMessage(localResponse, 'bot');
        } else {
            // If no local response, try backend
            const response = await sendMessageToBackend(message);
            addMessage(response, 'bot');
        }
        
        // Scroll to bottom after adding message
        const chatMessages = document.getElementById('chatMessages');
        if (chatMessages) {
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }
    } catch (error) {
        console.error('Error:', error);
        addMessage(responses["default"], 'bot');
    }
}

// Process messages locally
function processMessage(message) {
    message = message.toLowerCase();
    
    // Check for working hours related queries
    if (message.includes('working hours') || 
        message.includes('opening hours') || 
        message.includes('business hours') ||
        message.includes('what time') ||
        message.includes('hours') ||
        (message.includes('when') && message.includes('open'))) {
        return responses["hours"];
    }

    // Check for WiFi related queries
    if (message.includes('wifi') || 
        message.includes('internet') || 
        message.includes('wireless')) {
        return responses["wifi"];
    }

    // Check for reservation related queries
    if (message.includes('reservation') || 
        message.includes('book') || 
        message.includes('reserve') ||
        message.includes('booking')) {
        return responses["reservation"];
    }

    // Check for specific drink requests
    const drinkKeywords = ['want', 'like', 'get', 'order', 'buy'];
    const isDrinkRequest = drinkKeywords.some(keyword => message.includes(keyword));
    
    if (isDrinkRequest) {
        const drinkHTML = createDrinkDisplay(message.replace(/i want|i'd like|can i get|i want to order|give me|get me|a |an /gi, '').trim());
        if (drinkHTML) {
            return { type: 'drink', html: drinkHTML };
        }
    }
    
    if (message.includes('menu') || message.includes('what do you offer') || message.includes('what can i order')) {
        return {
            type: 'menu',
            html: createMenuDisplay()
        };
    }
    
    if (message.includes('order') || message.includes('buy')) {
        return "I'd be happy to take your order!";
    } else if (message.includes('thank')) {
        return "You're welcome! Is there anything else I can help you with?";
    } else if (message.includes('bye') || message.includes('goodbye')) {
        return "Thank you for chatting with us! Have a great day!";
    } else if (message.includes('location') || message.includes('address') || message.includes('where')) {
        return responses["location"];
    } else if (message.includes('price') || message.includes('cost') || message.includes('how much')) {
        return "Our prices range from ₹110 to ₹210 depending on the item and size. You can check our menu for specific prices.";
    } else if (message.includes('cart')) {
        viewCart();
        return null;
    }
    
    return null;
}

// Add message to chat
function addMessage(text, sender) {
    const chatMessages = document.getElementById('chatMessages');
    if (chatMessages) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}`;
        
        if (typeof text === 'object') {
            if (text.html) {
                messageDiv.innerHTML = text.html;
            } else {
                messageDiv.textContent = text.response || text.text || JSON.stringify(text);
            }
        } else {
            messageDiv.textContent = text;
        }
        
        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
}

// Create drink display
function createDrinkDisplay(drinkName) {
    const drinks = {
        'cold coffee': { name: 'Cold Coffee', price: 'Medium ₹150 | Large ₹180' },
        'cappuccino': { name: 'Cappuccino', price: 'Medium ₹150 | Large ₹180' },
        'latte': { name: 'Latte', price: 'Medium ₹140 | Large ₹170' },
        'espresso': { name: 'Espresso', price: 'Medium ₹120' },
        'mocha': { name: 'Mocha', price: 'Medium ₹160 | Large ₹190' },
        'cold mocha': { name: 'Cold Mocha', price: 'Medium ₹170 | Large ₹200' },
        'white mocha': { name: 'White Mocha', price: 'Medium ₹170 | Large ₹200' },
        'flat white': { name: 'Flat White', price: 'Medium ₹150' },
        'caramel macchiato': { name: 'Caramel Macchiato', price: 'Medium ₹180 | Large ₹210' },
        'hot chocolate': { name: 'Hot Chocolate', price: 'Medium ₹140' },
        'lemonade': { name: 'Lemonade', price: 'Medium ₹120' },
        'iced tea': { name: 'Iced Tea', price: 'Medium ₹110' }
    };

    const drink = drinks[drinkName.toLowerCase()];
    if (!drink) return null;

    return `
        <div class="menu-container">
            <div class="menu-item">
                <img src="static/images/${drinkName.toLowerCase().replace(/\s+/g, '-')}.jpg" alt="${drink.name}" class="menu-image" style="width: 100px; height: 100px; object-fit: cover;">
                <div class="menu-item-details">
                    <h5>${drink.name}</h5>
                    <p class="price">${drink.price}</p>
                    <div class="menu-item-actions">
                        <button class="order-btn" onclick="orderProduct('${drink.name}')">Order Now</button>
                        <button class="cart-btn" onclick="addToCart('${drink.name}')">Add to Cart</button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Create menu display
function createMenuDisplay() {
    const menuItems = {
        coffee: [
            { name: 'Cappuccino', price: 'Medium ₹150, Large ₹180' },
            { name: 'Latte', price: 'Medium ₹140, Large ₹170' },
            { name: 'Espresso', price: 'Medium ₹120' },
            { name: 'Mocha', price: 'Medium ₹160, Large ₹190' },
            { name: 'Cold Mocha', price: 'Medium ₹170, Large ₹200' },
            { name: 'White Mocha', price: 'Medium ₹170, Large ₹200' },
            { name: 'Cold Coffee', price: 'Medium ₹150, Large ₹180' },
            { name: 'Flat White', price: 'Medium ₹150' },
            { name: 'Caramel Macchiato', price: 'Medium ₹180, Large ₹210' }
        ],
        beverages: [
            { name: 'Hot Chocolate', price: 'Medium ₹140' },
            { name: 'Lemonade', price: 'Medium ₹120' },
            { name: 'Iced Tea', price: 'Medium ₹110' }
        ]
    };

    return `
        <div class="menu-container">
            <h3>Our Menu</h3>
            <div class="menu-section">
                <h4>Coffee</h4>
                <div class="menu-grid">
                    ${menuItems.coffee.map(item => `
                        <div class="menu-item">
                            <img src="static/images/${item.name.toLowerCase().replace(/\s+/g, '-')}.jpg" alt="${item.name}" class="menu-image">
                            <h5>${item.name}</h5>
                            <p class="price">${item.price}</p>
                            <div class="menu-item-actions">
                                <button class="order-btn" onclick="orderProduct('${item.name}')">Order Now</button>
                                <button class="cart-btn" onclick="addToCart('${item.name}')">Add to Cart</button>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
            <div class="menu-section">
                <h4>Beverages</h4>
                <div class="menu-grid">
                    ${menuItems.beverages.map(item => `
                        <div class="menu-item">
                            <img src="static/images/${item.name.toLowerCase().replace(/\s+/g, '-')}.jpg" alt="${item.name}" class="menu-image">
                            <h5>${item.name}</h5>
                            <p class="price">${item.price}</p>
                            <div class="menu-item-actions">
                                <button class="order-btn" onclick="orderProduct('${item.name}')">Order Now</button>
                                <button class="cart-btn" onclick="addToCart('${item.name}')">Add to Cart</button>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
    `;
}

// Order product
function orderProduct(productName) {
    const message = ``; //this messege is to give user input
    document.getElementById('userInput').value = message;
    sendMessage();
    
    setTimeout(() => {
        addMessage("Would you like anything else with your order? (Yes/No)", 'bot');
        const confirmationButtons = `
            <div class="confirmation-buttons">
                <button onclick="completeOrder('yes')">Yes</button>
                <button onclick="completeOrder('no')">No</button>
            </div>
        `;
        addMessage({ html: confirmationButtons }, 'bot');
    }, 1000);
}

// Complete order
function completeOrder(response) {
    if (response.toLowerCase() === 'yes') {
        addMessage("What else would you like to order?", 'bot');
    } else {
        const paymentOptions = `
            <div class="payment-options">
                <h4>Please select your payment method:</h4>
                <div class="payment-buttons">
                    <button class="payment-btn" onclick="selectPayment('cash')">
                        <i class="fas fa-money-bill-wave"></i>
                        Cash
                    </button>
                    <button class="payment-btn" onclick="selectPayment('upi')">
                        <i class="fas fa-mobile-alt"></i>
                        UPI
                    </button>
                    <button class="payment-btn" onclick="selectPayment('card')">
                        <i class="fas fa-credit-card"></i>
                        Card
                    </button>
                </div>
            </div>
        `;
        addMessage({ html: paymentOptions }, 'bot');
    }
}

// Select payment method
function selectPayment(method) {
    let paymentMessage = '';
    switch(method) {
        case 'cash':
            paymentMessage = "Please pay at the counter when collecting your order.";
            break;
        case 'upi':
            paymentMessage = "UPI ID: cafebot@upi\nPlease show your payment confirmation at the counter.";
            break;
        case 'card':
            paymentMessage = "Card payment can be made at the counter.";
            break;
    }
    
    addMessage(paymentMessage, 'bot');
    
    setTimeout(() => {
        const thankYouMessage = `
            <div class="order-completion">
                <h4>Thank you for your order!</h4>
                <p>Your order has been confirmed.</p>
                <p>Payment method: ${method.toUpperCase()}</p>
                <p>Have a nice day! 😊</p>
            </div>
        `;
        addMessage({ html: thankYouMessage }, 'bot');
    }, 1000);
}

// Cart management functions
function addToCart(productName) {
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    cart.push({
        name: productName,
        quantity: 1
    });
    localStorage.setItem('cart', JSON.stringify(cart));
    addMessage(`Added ${productName} to your cart!`, 'bot');
}

function viewCart() {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    if (cart.length === 0) {
        addMessage("Your cart is empty", 'bot');
        return;
    }

    const cartHTML = `
        <div class="cart-summary">
            <h4>Your Cart</h4>
            ${cart.map(item => `
                <div class="cart-item">
                    <span>${item.name}</span>
                    <span>Quantity: ${item.quantity}</span>
                    <button onclick="removeFromCart('${item.name}')">Remove</button>
                </div>
            `).join('')}
            <button onclick="checkout()">Checkout</button>
        </div>
    `;
    addMessage({ html: cartHTML }, 'bot');
}

function removeFromCart(productName) {
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    cart = cart.filter(item => item.name !== productName);
    localStorage.setItem('cart', JSON.stringify(cart));
    viewCart();
}

function checkout() {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    if (cart.length === 0) {
        addMessage("Your cart is empty", 'bot');
        return;
    }
    
    addMessage("Please proceed to the counter with your order number to complete your purchase.", 'bot');
    localStorage.removeItem('cart'); // Clear cart after checkout
}

// Add suggested messages
function addSuggestedMessages() {
    const suggestedMessages = [
        "Menu",
        "What are your hours?",
        "Do you have WiFi?",
        "Make a reservation"
    ];
    
    const container = document.createElement('div');
    container.className = 'chat-suggested-messages-buttons';
    
    suggestedMessages.forEach(msg => {
        const button = document.createElement('button');
        button.className = 'suggested-message-btn';
        button.textContent = msg;
        button.onclick = () => {
            document.getElementById('userInput').value = msg;
            sendMessage();
        };
        container.appendChild(button);
    });
    
    document.querySelector('.chat-container').appendChild(container);
}

// Initialize chat
document.addEventListener('DOMContentLoaded', function() {
    const chatIcon = document.querySelector('.chat-icon');
    const chatContainer = document.querySelector('.chat-container');
    const closeBtn = document.querySelector('.close-btn');
    const userInput = document.getElementById('userInput');
    const sendBtn = document.getElementById('sendBtn');

    // Initialize chat widget visibility
    if (chatContainer) {
        chatContainer.style.display = 'none';
    }

    // Toggle chat container when chat icon is clicked
    if (chatIcon) {
        chatIcon.addEventListener('click', function() {
            if (chatContainer) {
                chatContainer.style.display = chatContainer.style.display === 'none' ? 'block' : 'none';
                chatContainer.classList.toggle('active');
                if (chatContainer.style.display === 'block') {
                    userInput.focus();
                }
            }
        });
    }

    // Close chat container when close button is clicked
    if (closeBtn) {
        closeBtn.addEventListener('click', function() {
            if (chatContainer) {
                chatContainer.style.display = 'none';
                chatContainer.classList.remove('active');
            }
        });
    }

    // Send message when send button is clicked
    if (sendBtn) {
        sendBtn.addEventListener('click', sendMessage);
    }

    // Send message when Enter key is pressed
    if (userInput) {
        userInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                sendMessage();
            }
        });
    }

    // Add welcome message
    addMessage("Hello! Welcome to our cafe. How can I help you today?", 'bot');
    
    // Initialize suggested messages
    addSuggestedMessages();
});
