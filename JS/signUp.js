    ///////////////VALIDATE ACCOUNT FORM (SIGNUP PAGE)//////////////////
document.getElementById("signUpForm").addEventListener("submit", validateForm);

function validateForm(event) {
  let vUser = document.forms["signUpForm"]["user"].value;
  if (vUser == "") {
    alert("Username must be filled out.");
    event.preventDefault();
    return;
  }
  let vPass = document.forms["signUpForm"]["fname"].value;
  if (vPass == "") {
    alert("First Name must be filled out.");
    event.preventDefault();
    return;
  } 
  let vPass = document.forms["signUpForm"]["lname"].value;
  if (vPass == "") {
    alert("Last Name must be filled out.");
    event.preventDefault();
    return;
  } 
  let vPass = document.forms["signUpForm"]["cont"].value;
  if (vPass == "") {
    alert("Contact Number must be filled out.");
    event.preventDefault();
    return;
  } 
  let vPass = document.forms["signUpForm"]["area"].value;
  if (vPass == "") {
    alert("Area Code must be filled out.");
    event.preventDefault();
    return;
  } 
  let vPass = document.forms["signUpForm"]["pass"].value;
  if (vPass == "") {
    alert("Password must be filled out.");
    event.preventDefault();
    return;
  } 
}