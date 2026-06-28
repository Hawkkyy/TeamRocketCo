const BACKEND_URL = "http://localhost:3000";

const modal = document.getElementById("cardModal");
const openBtn = document.getElementById("openModalBtn");
const closeBtn = document.getElementById("closeModalBtn");
const BACKEND_URL = "http://localhost:3000";

// 1. Open Modal (Change display style to absolute flex container layout)
openBtn.addEventListener("click", () => {
  modal.style.display = "flex";
});

// 2. Close Modal when clicking the (X)
closeBtn.addEventListener("click", () => {
  modal.style.display = "none";
});

// 3. Close Modal if the user clicks anywhere outside of the form box
window.addEventListener("click", (e) => {
  if (e.target === modal) {
    modal.style.display = "none";
  }
});

// 4. Handle Form Submission to Express Backend API
document.getElementById("addCardForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const cardData = {
    poke_id: parseInt(document.getElementById("pokeId").value),
    condition_id: document.getElementById("conditionId").value,
    variant_id: document.getElementById("variantId").value,
    stock_qty: parseInt(document.getElementById("stockQty").value),
    final_price: parseFloat(document.getElementById("finalPrice").value)
  };

  try {
    const response = await fetch(`${BACKEND_URL}/inventory/add`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(cardData)
    });

    const data = await response.json();
    if (response.ok) {
      alert(data.message);
      modal.style.display = "none"; // Hide popup modal window framework
      location.reload();            // Dynamic grid inventory display refresh
    } else {
      alert("Error: " + data.error);
    }
  } catch (err) {
    console.error("Network communication error:", err);
    alert("Failed to reach live target API server connection.");
  }
});










// Handle Add Card Form Submit Action Linkages
document.getElementById("addCardForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const cardData = {
    poke_id: parseInt(document.getElementById("pokeId").value),
    condition_id: document.getElementById("conditionId").value,
    variant_id: document.getElementById("variantId").value,
    stock_qty: parseInt(document.getElementById("stockQty").value),
    final_price: parseFloat(document.getElementById("finalPrice").value)
  };

  try {
    const response = await fetch(`${BACKEND_URL}/inventory/add`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(cardData)
    });

    const data = await response.json();
    if (response.ok) {
      alert(data.message);
      location.reload(); // Reload dashboard view grid dynamically
    } else {
      alert("Error: " + data.error);
    }
  } catch (err) {
    console.error("Add operation network error:", err);
    alert("Failed to communicate with inventory cluster.");
  }
});

// Handle Delete Card Row Verification Operations
async function deleteCard(cardId) {
  if (!cardId) return alert("Cannot complete deletion: Missing tracking ID");
  
  if (confirm(`Are you completely sure you want to drop Card Record ID [${cardId}]?`)) {
    try {
      const response = await fetch(`${BACKEND_URL}/inventory/delete/${cardId}`, {
        method: "DELETE"
      });

      const data = await response.json();
      if (response.ok) {
        alert(data.message);
        location.reload(); // Drop target row item instantly from active array UI
      } else {
        alert("Error: " + data.error);
      }
    } catch (err) {
      console.error("Delete operation network error:", err);
      alert("Failed to reach live target API pipeline endpoint.");
    }
  }
}

