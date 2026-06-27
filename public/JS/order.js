const BACKEND_URL = "https://teamrocketco.onrender.com";

// Find out which card ID was passed to this page from the inventory click
const urlParams = new URLSearchParams(window.location.search);
const cardId = urlParams.get('cardId');

let currentCard = null;

document.addEventListener("DOMContentLoaded", async () => {
    if (!cardId) {
        alert("No card selected! Redirecting back to inventory.");
        window.location.href = "inventory.html";
        return;
    }

    // Fetch the active database cards to find our details
    try {
        const response = await fetch(`${BACKEND_URL}/inventory`);
        const inventory = await response.json();
        currentCard = inventory.find(item => item.card_id == cardId);

        if (!currentCard) {
            alert("Card details could not be found.");
            return;
        }

        // Show card values dynamically on screen
        document.getElementById("order-card-name").innerText = currentCard.poke_name;
        document.getElementById("order-card-price").innerText = `₱${currentCard.base_price}`;
        document.getElementById("order-card-stock").innerText = currentCard.stock_qty;
    } catch (err) {
        console.error("Error loading ordering metadata:", err);
    }
});

// "Confirm" display handler for Buy, Sell, and Trade
document.getElementById("orderForm").addEventListener("submit", (e) => {
    e.preventDefault();
    if (!currentCard) return;

    const action = document.getElementById("transactionType").value;
    const qty = parseInt(document.getElementById("orderQty").value);

    // Stop them if they try to buy more cards than we have in stock
    if (action === "buy" && qty > currentCard.stock_qty) {
        alert(`Error: Not enough stock! We only have ${currentCard.stock_qty} available.`);
        return;
    }

    const totalCost = currentCard.base_price * qty;
    let message = "";

    // Dynamic text configurations matching Mariele's assignment goals
    if (action === "buy") {
        message = `You are about to <strong>BUY</strong> ${qty}x ${currentCard.poke_name.toUpperCase()}. <br>Total Cost: ₱${totalCost.toFixed(2)}`;
    } else if (action === "sell") {
        message = `You are about to <strong>SELL</strong> ${qty}x ${currentCard.poke_name.toUpperCase()} back to our shop. <br>Estimated Payout: ₱${(totalCost * 0.7).toFixed(2)}`;
    } else if (action === "trade") {
        message = `You are submitting a request to <strong>TRADE</strong> ${qty}x ${currentCard.poke_name.toUpperCase()}. Our shop admins will review the swap details.`;
    }

    // Show the confirmation box step
    document.getElementById("confirmText").innerHTML = message;
    document.getElementById("confirmWindow").style.display = "block";
    document.getElementById("proceedBtn").style.display = "none";
});

// Final Action execution handler connecting to backend
document.getElementById("finalConfirmBtn").addEventListener("click", async () => {
    const action = document.getElementById("transactionType").value;
    const qty = parseInt(document.getElementById("orderQty").value);

    try {
        const response = await fetch(`${BACKEND_URL}/process-order`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ cardId, action, qty })
        });

        if (response.ok) {
            alert("Success! Transaction confirmed and database updated.");
            window.location.href = "inventory.html"; // Go back when finished!
        } else {
            const errorMsg = await response.text();
            alert(`Order Failed: ${errorMsg}`);
        }
    } catch (err) {
        alert("Network error processing your order.");
    }
});