const BACKEND_URL = "https://teamrocketco.onrender.com";

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

        // Handle fallback calculations if final_price column is empty
        const activeDisplayPrice = currentCard.final_price || currentCard.base_price || 0;

        document.getElementById("order-card-name").innerText = currentCard.poke_name;
        document.getElementById("order-card-price").innerText = `₱${parseFloat(activeDisplayPrice).toFixed(2)}`;
        document.getElementById("order-card-stock").innerText = currentCard.stock_qty;
    } catch (err) {
        console.error("Error fetching inventory data mapping structure:", err);
    }
});

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
        message = `You are about to <strong>BUY</strong> ${qty}x ${currentCard.poke_name.toUpperCase()}. <br>Total Cost: ₱${totalCost.toFixed(2)}`;
    } else if (action === "sell") {
        message = `You are about to <strong>SELL</strong> ${qty}x ${currentCard.poke_name.toUpperCase()} to our shop. <br>Total Payout: ₱${totalCost.toFixed(2)}`;
    } else if (action === "trade") {
        message = `You are submitting an offer to <strong>TRADE</strong> ${qty}x ${currentCard.poke_name.toUpperCase()}. The request will be registered in our logs for admin approval.`;
    }

    document.getElementById("confirmText").innerHTML = message;
    document.getElementById("confirmWindow").style.display = "block";
    document.getElementById("proceedBtn").style.display = "none";
});

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
            alert("Success! Your transaction has been successfully completed and recorded in the Transaction history logs.");
            window.location.href = "inventory.html";
        } else {
            const errorMsg = await response.text();
            alert(`Order Failed: ${errorMsg}`);
        }
    } catch (err) {
        alert("A network connection fault interrupted your order submission.");
    }
});