    ///////////////VALIDATE ACCOUNT FORM (SIGN UP PAGE)//////////////////
    
document.getElementById("accForm").addEventListener("submit", validateForm);

function validateForm(event) {
  let vUser = document.forms["accForm"]["user"].value;
  if (vUser == "") {
    alert("Username must be filled out.");
    event.preventDefault();
    return;
  }
  let vPass = document.forms["accForm"]["pass"].value;
  if (vPass == "") {
    alert("Password must be filled out.");
    event.preventDefault();
    return;
  } else if (vPass.length <= 7) {
    alert("Password must be 8 characters long.")
    event.preventDefault();
    return;
  } 
}