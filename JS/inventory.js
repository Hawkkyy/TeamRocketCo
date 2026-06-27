const BACKEND_URL = "https://teamrocketco.onrender.com"; 

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
                // Get the HTML alt text, convert to lowercase, and trim trailing/leading spaces
                const pokemonName = img.getAttribute("alt").toLowerCase().trim(); 
                
                // Find matching card record from the backend payload with a resilient matching approach 
                const cardData = dbInventory.find(item => {
                    if (!item.poke_name) return false;
                    
                    const dbName = item.poke_name.toLowerCase().trim();
                    
                    // Match if they are identical, or if one string completely contains the other 
                    // (e.g., "Mewtwo" matches "Mewtwo EX", or extra database spaces are ignored)
                    return dbName === pokemonName || dbName.includes(pokemonName) || pokemonName.includes(dbName);
                });

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