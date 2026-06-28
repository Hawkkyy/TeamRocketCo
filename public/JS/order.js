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
        
        // Find matching card record from backend response data (handles string or number match)
        const cardData = inventory.find(item => item.card_id == cardId);

        if (cardData) {
            // Set dynamic text display inside your order HTML fields
            document.getElementById("order-card-name").innerText = cardData.poke_name.toUpperCase();
            document.getElementById("order-price").innerText = `₱${cardData.base_price}`;
            
            // Set the dropdown menu selection to match the item button they clicked from inventory
            const dropdown = document.getElementById("transactionType");
            if (dropdown) {
                dropdown.value = actionParam.toUpperCase();
            }

            // Optional structural layout fallback element support
            const legacyActionText = document.getElementById("order-action-type");
            if (legacyActionText) legacyActionText.innerText = actionParam.toUpperCase();
            
            // Call the function to handle the interactive workflow
            bindOrderFormSubmission(cardData);
        } else {
            alert("Selected card could not be found in the current inventory database.");
            window.location.href = "inventory.html";
        }
    } catch (err) {
        console.error("Error managing order setup workflow:", err);
    }
};

/**
 * Handles the multi-step order confirmation workflow before submitting to database.
 */
function bindOrderFormSubmission(cardData) {
    const formElement = document.getElementById("orderForm");
    const proceedBtn = document.getElementById("proceedBtn");
    const confirmWindow = document.getElementById("confirmWindow");
    const confirmText = document.getElementById("confirmText");
    const finalConfirmBtn = document.getElementById("finalConfirmBtn");

    if (!formElement) return;

    // Step 1: User clicks "Submit Transaction Order" -> Show the Confirmation Summary window
    formElement.addEventListener("submit", (e) => {
        e.preventDefault(); // Stop standard form submit redirection
        
        const dropdown = document.getElementById("transactionType");
        const activeAction = dropdown ? dropdown.value : "BUY";
        
        const quantityInput = document.getElementById("order-qty");
        const quantity = quantityInput ? parseInt(quantityInput.value) : 1;
        const totalPrice = cardData.base_price * quantity;

        // Populate the dynamic review window with the current dropdown choice value!
        confirmText.innerHTML = `
            You are choosing to <strong>${activeAction}</strong> 
            <strong>${quantity}x</strong> 
            <strong>${cardData.poke_name.toUpperCase()}</strong> card(s).<br>
            <strong>Total Amount: ₱${totalPrice.toLocaleString()}</strong>
        `;

        // Hide the initial submission button and show the hidden confirmation window box
        proceedBtn.style.display = "none";
        confirmWindow.style.display = "block";
    });

    // Step 2: User clicks "Confirm Transaction" inside the confirmation box -> Send to Database Tables
    if (finalConfirmBtn) {
        finalConfirmBtn.addEventListener("click", async () => {
            const dropdown = document.getElementById("transactionType");
            const activeAction = dropdown ? dropdown.value : "BUY";

            const quantityInput = document.getElementById("order-qty");
            const quantity = quantityInput ? parseInt(quantityInput.value) : 1;
            const totalPrice = cardData.base_price * quantity;
            
            const userId = localStorage.getItem("userId");
                if(!userId){
                    alert("Please log in first.");
                    window.location.href="login.html";
                    return;
                }

            const orderPayload = {
                userId: parseInt(userId),
                cardId: parseInt(cardData.card_id),
                orderType: activeAction, // Reads directly from select input dropdown element state
                qty: quantity,
                totalPrice: totalPrice
            };

            // Disable button feedback state to prevent double clicking database records
            finalConfirmBtn.disabled = true;
            finalConfirmBtn.innerText = "Processing Transaction...";

            try {
                const response = await fetch(`${BACKEND_URL}/transaction`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(orderPayload)
                });

                if (response.ok) {
                    const successText = await response.text();
                    alert(successText);
                    window.location.href = "inventory.html";
                } else {
                    // FIX: Safely read plain text errors directly sent by server.js
                    const errorText = await response.text();
                    alert("Transaction failed: " + errorText);
                    
                    // Reset button if failed
                    finalConfirmBtn.disabled = false;
                    finalConfirmBtn.innerText = "Confirm Transaction";
                }
            } catch (error) {
                console.error("Network error communicating with transaction backend:", error);
                alert("Network connection issue. Check server status.");
                
                finalConfirmBtn.disabled = false;
                finalConfirmBtn.innerText = "Confirm Transaction";
            }
        });
    }
}