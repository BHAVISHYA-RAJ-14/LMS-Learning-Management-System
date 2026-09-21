// Handles authentication verification and session management
async function handleLogin(event) {
  event.preventDefault();
  const emailInput = document.getElementById("email").value.trim();
  const passwordInput = document.getElementById("password").value.trim();
  const errorMessage = document.getElementById("error-msg");

  try {
    const response = await fetch("./data/users.json");
    if (!response.ok) throw new Error("Could not access user directory");
    const users = await response.json();

    const matchedUser = users.find(
      (u) => u.username === emailInput && u.password === passwordInput
    );

    if (matchedUser) {
      sessionStorage.setItem("currentUser", JSON.stringify(matchedUser));
      sessionStorage.setItem("userRole", matchedUser.role);
      window.location.href = "courses.html";
    } else {
      errorMessage.textContent = "Invalid academic credentials. Please re-check.";
      errorMessage.style.display = "block";
    }
  } catch (err) {
    console.error("Auth Exception:", err);
    errorMessage.textContent = "Authentication service temporarily unavailable.";
    errorMessage.style.display = "block";
  }
}

function checkAuth(allowedRoles = []) {
  const user = JSON.parse(sessionStorage.getItem("currentUser"));
  if (!user) {
    window.location.href = "index.html";
    return null;
  }
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    alert("Access restricted for your account tier.");
    window.location.href = "courses.html";
    return null;
  }
  return user;
}

function handleLogout() {
  sessionStorage.clear();
  window.location.href = "index.html";
}

// Route guard and logout lifecycle - fully wired
