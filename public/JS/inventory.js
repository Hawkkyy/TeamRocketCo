// MAKE SURE YOUR FRONTEND IS FETCHING REQS FROM RENDER LIKE THIS:
const BACKEND_URL = "https://teamrocketco.onrender.com";

async function loadInventory() {
    try {
        const response = await fetch(`${BACKEND_URL}/inventory`);
        const data = await response.json();
        
        // This is where your code updates your inventory elements/table cards
        console.log("Database cards loaded successfully:", data);
    } catch (error) {
        console.error("Error loading inventory from database pool:", error);
    }
}


async function setupInventoryClicks() {
    try {
        // 1. Fetch real-time data from Railway MySQL instance
        const response = await fetch(`${BACKEND_URL}/inventory`);
        const dbInventory = await response.json();
        
        // 2. Select all images inside your original HTML table
        const cardImages = document.querySelectorAll("main table img");
        const modal = document.getElementById("details-modal");

        cardImages.forEach(img => {
            // Make individual images responsive to hover styling via JS cursor indication
            img.style.cursor = "pointer";

            img.addEventListener("click", () => {
                const pokemonName = img.getAttribute("alt").toLowerCase();
                
                // Find matching card record from the backend join payload
                const cardData = dbInventory.find(item => item.poke_name.toLowerCase() === pokemonName);

                // Update information dynamically inside the popup modal
                document.getElementById("modal-img").src = img.src;
                document.getElementById("modal-name").innerText = img.getAttribute("alt").toUpperCase();

                if (cardData) {
                    document.getElementById("modal-price").innerText = `₱${cardData.base_price}`;
                    document.getElementById("modal-stock").innerText = cardData.stock_qty;
                    
                    // Route to the order page when the action triggers
                    document.getElementById("modal-buy-btn").onclick = () => {
                        window.location.href = `order.html?cardId=${cardData.card_id}&action=buy`;
                    };
                } else {
                    // Fallback block if the database hasn't populated this specific card record yet
                    document.getElementById("modal-price").innerText = "Not Available";
                    document.getElementById("modal-stock").innerText = "0";
                    document.getElementById("modal-buy-btn").onclick = null;
                }

                // Show modal overlay
                modal.style.display = "flex";
            });
        });
    } catch (error) {
        console.error("Error setting up table database connections:", error);
    }
}

window.onload = setupInventoryClicks;


// ADD TO THE BOTTOM OF INVENTORY.JS
// This attaches an Order Button click redirect handler directly to your project's active modal structure

// =========================================================================
// DYNAMIC MODAL REDIRECT HOOK - PASTE AT THE BOTTOM OF INVENTORY.JS
// =========================================================================
document.addEventListener("DOMContentLoaded", () => {
    const modal = document.getElementById("details-modal");
    if (modal) {
        const orderBtn = document.createElement("button");
        orderBtn.innerText = "Proceed to Buy / Sell / Trade";
        orderBtn.style.cssText = "margin-top: 15px; width: 50%; padding: 12px; background: #d40000; color: white; border: none; font-weight: bold; cursor: pointer; border-radius: 4px; text-transform: uppercase; font-family: 'Mulish', sans-serif;";
        
        const infoBlock = modal.querySelector(".modal-info") || modal;
        infoBlock.appendChild(orderBtn);

        orderBtn.addEventListener("click", () => {
            const currentName = document.getElementById("modal-name")?.innerText?.toLowerCase();
            if (currentName) {
                fetch(`${BACKEND_URL}/inventory`)
                    .then(res => res.json())
                    .then(inventory => {
                        const found = inventory.find(i => i.poke_name.toLowerCase() === currentName);
                        if (found) {
                            window.location.href = `order.html?cardId=${found.card_id}`;
                        } else {
                            alert("Card matching error. Could not redirect.");
                        }
                    })
                    .catch(err => console.error("Error matching modal to card_id:", err));
            } else {
                alert("Please click and select a card first!");
            }
        });
    }
});
