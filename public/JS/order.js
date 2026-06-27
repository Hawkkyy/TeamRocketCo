const BACKEND_URL = "https://teamrocketco.onrender.com";

// Pull chosen cardId context from current address link bounds
const urlParams = new URLSearchParams(window.location.search);
const cardId = urlParams.get('cardId');
let currentCard = null;

document.addEventListener("DOMContentLoaded", async () => {
    if (!cardId) {
        alert("No card selected! Redirecting back to inventory.");
        window.location.href = "inventory.html";
        return;
    }

    try {
        const response = await fetch(`${BACKEND_URL}/inventory`);
        const inventory = await response.json();
        currentCard = inventory.find(item => item.card_id == cardId);

        if (!currentCard) {
            alert("Card details could not be found.");
            return;
        }

        // Rely on final_price, fall back to base_price if necessary
        const activeDisplayPrice = currentCard.final_price || currentCard.base_price || 0;

        document.getElementById("order-card-name").innerText = currentCard.poke_name;
        document.getElementById("order-card-price").innerText = `₱${parseFloat(activeDisplayPrice).toFixed(2)}`;
        document.getElementById("order-card-stock").innerText = currentCard.stock_qty;
    } catch (err) {
        console.error("Error setting up order page fields:", err);
    }
});

// Show the 'Confirm' step screen layout on form submission
document.getElementById("orderForm").addEventListener("submit", (e) => {
    e.preventDefault();
    if (!currentCard) return;

    const action = document.getElementById("transactionType").value;
    const qty = parseInt(document.getElementById("orderQty").value);

    if (action === "buy" && qty > currentCard.stock_qty) {
        alert(`Error: Not enough stock! We only have ${currentCard.stock_qty} available.`);
        return;
    }

    const pricePerUnit = currentCard.final_price || currentCard.base_price || 0;
    const totalCost = pricePerUnit * qty;
    let message = "";

    if (action === "buy") {
        message = `You are about to <strong>BUY</strong> ${qty}x ${currentCard.poke_name.toUpperCase()}. <br>Total Order Cost: ₱${totalCost.toFixed(2)}`;
    } else if (action === "sell") {
        message = `You are about to <strong>SELL</strong> ${qty}x ${currentCard.poke_name.toUpperCase()} back to our shop. <br>Total Payout Estimate: ₱${totalCost.toFixed(2)}`;
    } else if (action === "trade") {
        message = `You are submitting an offer to <strong>TRADE</strong> ${qty}x ${currentCard.poke_name.toUpperCase()}. This transaction will be logged for admin verification.`;
    }

    document.getElementById("confirmText").innerHTML = message;
    document.getElementById("confirmWindow").style.display = "block";
    document.getElementById("proceedBtn").style.display = "none";
});

// Send order details to the backend to create the database records
document.getElementById("finalConfirmBtn").addEventListener("click", async () => {
    const action = document.getElementById("transactionType").value;
    const qty = parseInt(document.getElementById("orderQty").value);

    try {
        const response = await fetch(`${BACKEND_URL}/process-order`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
                cardId: cardId, 
                action: action, 
                qty: qty 
            })
        });

        if (response.ok) {
            alert("Success! Transaction completed and added to database logs.");
            window.location.href = "inventory.html";
        } else {
            const errorMsg = await response.text();
            alert(`Order Failed: ${errorMsg}`);
        }
    } catch (err) {
        alert("A network connection fault interrupted your request.");
    }
});