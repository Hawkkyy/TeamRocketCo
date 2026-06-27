const BACKEND_URL = "https://teamrocketco.onrender.com"; // Adjust to your running backend domain

// 1. Get query string parameters from URL path
const urlParams = new URLSearchParams(window.location.search);
const cardId = urlParams.get('cardId');
const actionParam = urlParams.get('action') || 'BUY'; // default to BUY

window.onload = async () => {
    if (!cardId) {
        alert("No card chosen to complete an order.");
        window.location.href = "inventory.html";
        return;
    }

    try {
        // Fetch current catalog items to present descriptions to the user
        const res = await fetch(`${BACKEND_URL}/inventory`);
        const inventory = await res.json();
        const cardData = inventory.find(item => item.card_id == cardId);

        if (cardData) {
            // Set dynamic text display inside your order HTML fields
            document.getElementById("order-card-name").innerText = cardData.poke_name.toUpperCase();
            document.getElementById("order-action-type").innerText = actionParam.toUpperCase();
            document.getElementById("order-price").innerText = `₱${cardData.base_price}`;
            
            // Listen to order submission form action
            document.getElementById("orderForm").addEventListener("submit", async (e) => {
                e.preventDefault();
                
                const quantity = parseInt(document.getElementById("order-qty").value);
                const totalPrice = cardData.base_price * quantity;
                
                // Assuming session data provides user_id, or defaulting to a test account user_id = 1
                const userId = 1; 

                const orderPayload = {
                    userId: userId,
                    cardId: parseInt(cardId),
                    orderType: actionParam.toUpperCase(), // "BUY", "SELL", or "TRADE"
                    qty: quantity,
                    totalPrice: totalPrice
                };

                // Post transaction structure directly to backend route endpoint
                const response = await fetch(`${BACKEND_URL}/transaction`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(orderPayload)
                });

                if (response.ok) {
                    alert(`Success! Transaction (${actionParam.toUpperCase()}) completed and logged.`);
                    window.location.href = "inventory.html";
                } else {
                    const errorText = await response.text();
                    alert("Transaction failed: " + errorText);
                }
            });
        }
    } catch (err) {
        console.error("Error managing order setup workflow:", err);
    }
};

// ==========================================
// PASTE THIS AT THE VERY BOTTOM OF YOUR order.js FILE:
// ==========================================
function bindOrderFormSubmission(cardData, actionParam) {
    const formElement = document.getElementById("orderForm");
    if (!formElement) return;

    formElement.addEventListener("submit", async (e) => {
        e.preventDefault();
        
        const quantityInput = document.getElementById("order-qty");
        const quantity = quantityInput ? parseInt(quantityInput.value) : 1;
        const totalPrice = cardData.base_price * quantity;
        
        // Pass the default mock user_id context (e.g., User ID = 1) until your full auth state session is up
        const userId = 1; 

        const orderPayload = {
            userId: userId,
            cardId: parseInt(cardData.card_id),
            orderType: actionParam.toUpperCase(), // "BUY", "SELL", or "TRADE"
            qty: quantity,
            totalPrice: totalPrice
        };

        try {
            const response = await fetch(`${BACKEND_URL}/transaction`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(orderPayload)
            });

            if (response.ok) {
                alert(`Success! Transaction (${actionParam.toUpperCase()}) completed and logged to database.`);
                window.location.href = "inventory.html";
            } else {
                const errorText = await response.text();
                alert("Transaction failed: " + errorText);
            }
        } catch (error) {
            console.error("Network error communicating with transaction backend:", error);
            alert("Network connection issue. Check server status.");
        }
    });
}