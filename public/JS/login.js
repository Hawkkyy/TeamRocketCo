document.getElementById("loginForm").addEventListener("submit", validateForm);

async function validateForm(event) {
  event.preventDefault(); // Stop standard HTML submission to prevent Render redirect chains

  let form = document.forms["loginForm"];
  let vUser = form["user"].value.trim();
  let vPass = form["pass"].value.trim();

  if (vUser === "") {
    alert("Username must be filled out.");
    return;
  }
  if (vPass === "") {
    alert("Password must be filled out.");
    return;
  }

  try {
    // Send request via fetch instead
    const response = await fetch("https://teamrocketco.onrender.com/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ user: vUser, pass: vPass })
    });

    if (!response.ok) {
      const errText = await response.text();
      alert(errText || "Invalid username or password");
      return;
    }

    const data = await response.json();

    if (data.success) {
      // Redirects relatively within your GitHub Pages domain cleanly
      window.location.href = data.redirectUrl; 
    } else {
      alert(data.message || "Login failed");
    }

  } catch (error) {
    console.error("Error logging in:", error);
    alert("Unable to connect to login server. Please try again later.");
  }
}