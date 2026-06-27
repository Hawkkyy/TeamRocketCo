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



document.getElementById("orderForm").addEventListener("submit", async function(event) {
    event.preventDefault(); 

    const cardId = document.getElementById("card").value;
    const orderType = document.getElementById("type").value;
    const qtyAdmin = parseInt(document.getElementById("qtyAdmin").value) || 0;
    const qtyCust = parseInt(document.getElementById("qtyCust").value) || 0;

    const isConfirmed = confirm(`Are you sure you want to confirm this ${orderType} order?`);
    if (!isConfirmed) {
        return; 
    }

    try {
        const response = await fetch('http://localhost:3000/api/order', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                cardId: cardId,
                orderType: orderType,
                qtyAdmin: qtyAdmin,
                qtyCust: qtyCust
            })
        });

        const outcome = await response.json();
        
        if (response.ok) {
            alert("Order Processed and Confirmed Successfully!");
            window.location.href = "inventory.html"; // Redirect back to see updated stock
        } else {
            alert("Failed to update inventory: " + outcome.error);
        }
    } catch (err) {
        console.error("Communication error with backend:", err);
        alert("Could not reach backend server.");
    }
});