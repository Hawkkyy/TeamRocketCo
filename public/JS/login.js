document.getElementById("loginForm").addEventListener("submit", async function (e) {
    e.preventDefault();

    const user = document.forms["loginForm"]["user"].value;
    const pass = document.forms["loginForm"]["pass"].value;

    const response = await fetch("https://teamrocketco.onrender.com/login", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ user, pass })
    });

    const data = await response.json();

    if (!response.ok) {
        alert(data.message);
        return;
    }

    localStorage.setItem("userId", data.userId);
    localStorage.setItem("username", data.username);
    localStorage.setItem("role", data.role);

    if (data.role === "admin") {
        window.location.href = "adminsection/a-dashboard.html";
    } else {
        window.location.href = "inventory.html";
    }
});