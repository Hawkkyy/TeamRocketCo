

    ///////////////VALIDATE ACCOUNT FORM (LOGIN PAGE)//////////////////
document.getElementById("loginForm").addEventListener("submit", validateForm);

function validateForm(event) {
  let vUser = document.forms["loginForm"]["user"].value;
  if (vUser == "") {
    alert("Username must be filled out.");
    event.preventDefault();
    return;
  }
  let vPass = document.forms["loginForm"]["pass"].value;
  if (vPass == "") {
    alert("Password must be filled out.");
    event.preventDefault();
    return;
  } 
}