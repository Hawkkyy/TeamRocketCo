/////////////// ORDER FORM VALIDATION ///////////////

function validateForm() {
    if (!validateCard()) {
        return false;
    }

    if (!validateAmount()) {
        return false;
    }

    return true;
}

function validateCard() {
    let card = document.forms["orderForm"]["card"].value;

    if (card.trim() === "") {
        alert("Please select a card.");
        return false;
    }
    return true;
}

function validateAmount() {
    let amount = document.forms["orderForm"]["tAmount"].value;

    if (amount.trim() === "") {
        alert("Total Amount is required.");
        return false;
    }

    if (isNaN(amount) || Number(amount) < 0) {
        alert("Total Amount must be a valid number.");
        return false;
    }

    return true;
}

/////////////////////// TOTAL AMOUNT COMPUTATION ///////////////////////////////
  
const prices = {
    Pikachu: 300,
    Charizard: 1500,
    Blastoise: 1200,
    Venusaur: 1200,
    Mewtwo: 2000, 
    Alakazam: 1000 
};

document.getElementById("card").addEventListener("input", updateTotal);
document.getElementById("type").addEventListener("change", updateTotal); 
document.getElementById("qtyCust").addEventListener("input", updateTotal);
document.getElementById("qtyAdmin").addEventListener("input", updateTotal);

function updateTotal() {
    let card = document.getElementById("card").value;
    let type = document.getElementById("type").value;

    let qtyCust = Number(document.getElementById("qtyCust").value) || 0;
    let qtyAdmin = Number(document.getElementById("qtyAdmin").value) || 0;

    let price = prices[card] || 0;
    let total = 0;

    if (type === "Buy") {
        total = price * qtyAdmin;
    } 
    else if (type === "Sell") {
        total = price * qtyCust;
    } 
    else if (type === "Trade") {
        let customerValue = price * qtyCust;
        let storeValue = price * qtyAdmin;
        total = Math.abs(customerValue - storeValue);
    }

    document.getElementById("tAmount").value = total;
}


// === ORDER HANDLING FRONT-END LOGIC ===

// 1. Run initialization tasks as soon as the HTML document is fully loaded
window.addEventListener("DOMContentLoaded", () => {
    const urlParams = new URLSearchParams(window.location.search);
    const action = urlParams.get("action");         // Retrieves 'buy', 'sell', or 'trade'
    const cardName = urlParams.get("cardName");     // Retrieves the card name if passed

    // If an action parameter was passed from the inventory click, pre-select it in your dropdown
    if (action) {
        const typeDropdown = document.getElementById("type");
        if (typeDropdown) {
            typeDropdown.value = action.charAt(0).toUpperCase() + action.slice(1);
        }
    }

    // Pre-populate the card input/dropdown if available
    if (cardName) {
        const cardInput = document.getElementById("card");
        if (cardInput) {
            cardInput.value = cardName;
        }
    }
});

// 2. Intercept the form submission to process Buy / Sell / Trade records
document.getElementById("orderForm").addEventListener("submit", async (event) => {
    event.preventDefault(); // Stop the browser from automatically forcing a page refresh

    // Capture standard form fields
    const cardName = document.getElementById("card").value;
    const orderType = document.getElementById("type").value;
    const qtyAdmin = parseInt(document.getElementById("qtyAdmin").value) || 0;
    const qtyCust = parseInt(document.getElementById("qtyCust").value) || 0;
    const orderTotal = parseFloat(document.getElementById("tAmount").value) || 0;

    // Validate that form input values meet requirements
    if (!cardName) {
        alert("Please select or enter a valid Pokémon card.");
        return;
    }
    if (qtyAdmin <= 0 && qtyCust <= 0) {
        alert("Please specify a valid quantity for Admin or Customer transaction slots.");
        return;
    }

    // Format data payload structure for database entry matching
    const orderPayload = {
        cardName,
        orderType,
        qtyAdmin,
        qtyCust,
        orderTotal
    };

    try {
        // Swap with your live backend Render/Railway endpoint
        const BACKEND_URL = "https://teamrocketco.onrender.com"; 
        
        const response = await fetch(`${BACKEND_URL}/order`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(orderPayload)
        });

        if (response.ok) {
            alert("Transaction order submitted and processed successfully!");
            window.location.href = "inventory.html"; // Redirect user back to inventory menu
        } else {
            const errorDetails = await response.json();
            alert(`Order creation failed: ${errorDetails.error}`);
        }
    } catch (err) {
        console.error("Network interface connection error:", err);
        alert("Unable to communicate with the transaction server.");
    }
});