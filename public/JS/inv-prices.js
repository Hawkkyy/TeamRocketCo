const BACKEND_URL = "https://teamrocketco.onrender.com";
const modal = document.getElementById("cardModal");
const openBtn = document.getElementById("openModalBtn");
const closeBtn = document.getElementById("closeModalBtn");

// 1. Open Modal popup
if (openBtn) {
  openBtn.addEventListener("click", () => {
    modal.style.display = "flex";
  });
}

// 2. Close Modal using the (X) button
if (closeBtn) {
  closeBtn.addEventListener("click", () => {
    modal.style.display = "none";
  });
}

// 3. Close Modal if the user clicks anywhere outside of the form card
window.addEventListener("click", (e) => {
  if (e.target === modal) {
    modal.style.display = "none";
  }
});

// 4. Handle Form Submission to insert a new card record
const addForm = document.getElementById("addCardForm");
if (addForm) {
  addForm.addEventListener("submit", async (e) => {
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
        modal.style.display = "none"; 
        addForm.reset();
        if (typeof displayCards === "function") displayCards(); // Reload view grid dynamically
      } else {
        alert("Error: " + data.error);
      }
    } catch (err) {
      console.error("Network communication error:", err);
      alert("Failed to communicate with inventory cluster.");
    }
  });
}

// 5. Handle Delete Card operations
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
        if (typeof displayCards === "function") displayCards(); // Refresh display grid instantly
      } else {
        alert("Error: " + data.error);
      }
    } catch (err) {
      console.error("Delete operation network error:", err);
      alert("Failed to reach live target API pipeline endpoint.");
    }
  }
}