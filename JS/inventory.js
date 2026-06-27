// frontend
const TCGdex = require('@tcgdex/sdk').default;
const tcgdex = new TCGdex('en');

async function loadCard(cardId) {
    try {
        // 1. Fetch data from the public TCGdex API (Name and Image)
        const data = await tcgdex.fetch('sets', 'base1', cardId);
        document.getElementById("name").innerText = data.name;
        document.getElementById("image").src = data.image;

        // 2. Fetch business data (stock and price) from your group's Node.js backend
        // (Make sure to change URL if your team hosts the backend on Railway or a different port)
        const res = await fetch(`http://localhost:3000/api/inventory/${cardId}`);
        const dbData = await res.json();

        // 3. Display the stock quantity and base price in your HTML
        if (dbData) {
            document.getElementById("stock_qty").innerText = `In Stock: ${dbData.stock_qty}`;
            document.getElementById("base_price").innerText = `Base Price: $${dbData.base_price}`;
        }
    } catch (error) {
        console.error("Error loading inventory card data:", error);
    }
}

// Automatically loads a default card when the page opens (e.g., Alakazam base1-1 or Charizard base1-4)
window.onload = function() {
    loadCard('base1-4'); 
};