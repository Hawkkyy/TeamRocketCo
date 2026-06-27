const BACKEND_URL = "https://teamrocketco.onrender.com"; // Keep consistent with inventory.js

// Extract card details and pre-selected action from URL string query bounds
const urlParams = new URLSearchParams(window.location.search);
const cardId = urlParams.get('cardId');
const defaultAction = urlParams.get('action') || 'buy';

let activeCardData = null;

document.addEventListener("DOMContentLoaded", async () => {
    if (!cardId) {
        alert("No valid card selection detected. Returning to inventory view.");
        window.location.href = "inventory.html";
        return;
    }

    // Pre-populate drop-down selection from context intent rules
    document.getElementById("transactionType").value = defaultAction;

    // Fetch master inventory payload list to resolve details locally
    try {
        const response = await fetch(`${BACKEND_URL}/inventory`);
        const inventory = await response.json();
        activeCardData = inventory.find(item => item.card_id == cardId);

        if (!activeCardData) {
            alert("Card ledger item could not be retrieved from current stocks.");
            return;
        }

        // Render target values to view elements
        document.getElementById("card-name-display").innerText = activeCardData.poke_name.toUpperCase();
        document.getElementById("card-meta-display").innerText = `Condition: ${activeCardData.condition_id} | Variant: ${activeCardData.variant_id}`;
        document.getElementById("card-price-display").innerText = `₱${activeCardData.base_price}`;
        document.getElementById("card-stock-display").innerText = activeCardData.stock_qty;
    } catch (err) {
        console.error("Failed to set up card order configuration metadata context: ", err);
    }
});

// Step 2A: Handle First "Proceed to Confirmation" Step
document.getElementById("orderForm").addEventListener("submit", (e) => {
    e.preventDefault();
    if (!activeCardData) return;

    const action = document.getElementById("transactionType").value;
    const qty = parseInt(document.getElementById("orderQty").value);

    if (action === "buy" && qty > activeCardData.stock_qty) {
        alert("Transaction Aborted: Requested volume exceeds available inventory holdings.");
        return;
    }

    const priceImpact = activeCardData.base_price * qty;
    let actionLabel = "";
    let consequenceDisclaimer = "";

    if (action === "buy") {
        actionLabel = "BUYING";
        consequenceDisclaimer = `You will purchase ${qty} copy/copies. Total deduction estimate: ₱${priceImpact.toFixed(2)}. Inventory levels will decrement.`;
    } else if (action === "sell") {
        actionLabel = "SELLING";
        consequenceDisclaimer = `You are offering to sell ${qty} copy/copies to our stores. Estimated payout credit: ₱${(priceImpact * 0.7).toFixed(2)} (70% store appraisal standard value). Inventory counts will increment.`;
    } else if (action === "trade") {
        actionLabel = "TRADING";
        consequenceDisclaimer = `You are filing a trade swap proposal notice for ${qty} unit(s). Handlers will appraise verification profiles before executing final card modifications.`;
    }

    // Present confirmation pane window component
    document.getElementById("confirmationText").innerHTML = `<strong>Action Intent:</strong> ${actionLabel}<br><strong>Item Target:</strong> ${activeCardData.poke_name}<br><strong>Disclaimer Notes:</strong> ${consequenceDisclaimer}`;
    document.getElementById("confirmationBox").style.display = "block";
    document.getElementById("initiateOrderBtn").style.display = "none";
});

// Step 2B: Process final action endpoint communication hook upon confirm event click tracking
document.getElementById("finalConfirmBtn").addEventListener("click", async () => {
    const action = document.getElementById("transactionType").value;
    const qty = parseInt(document.getElementById("orderQty").value);

    try {
        const payload = { cardId: cardId, action: action, qty: qty };
        const response = await fetch(`${BACKEND_URL}/process-order`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        const outcomeText = await response.text();
        if (response.ok) {
            alert(`Success! ${outcomeText}`);
            window.location.href = "inventory.html";
        } else {
            alert(`Transaction Failure Notice: ${outcomeText}`);
        }
    } catch (err) {
        console.error("Order completion interface network fault: ", err);
        alert("Network execution failure occurred processing target transaction endpoints.");
    }
});