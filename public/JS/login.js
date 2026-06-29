document.getElementById("loginForm").addEventListener("submit", async function(event) {
    event.preventDefault(); // Stop page from reloading or submitting the old way

    // Get input values directly
    const userField = document.querySelector('input[name="user"]');
    const passField = document.querySelector('input[name="pass"]');

    const vUser = userField ? userField.value.trim() : "";
    const vPass = passField ? passField.value.trim() : "";

    if (vUser === "") {
        alert("Username must be filled out.");
        return;
    }
    if (vPass === "") {
        alert("Password must be filled out.");
        return;
    }

    try {
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
            // Force standard relative redirection paths
            if (data.role === "admin") {
                window.location.href = "a-dashboard.html";
            } else {
                window.location.href = "inventory.html";
            }
        } else {
            alert(data.message || "Login failed");
        }

    } catch (error) {
        console.error("Connection error:", error);
        alert("Unable to connect to the server. Is your Render backend spinning up?");
    }
});