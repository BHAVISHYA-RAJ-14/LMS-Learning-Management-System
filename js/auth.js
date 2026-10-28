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
      window.location.href = "dashboard.html";
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



// theme handling, remembered between visits
function applyTheme(mode) {
  document.documentElement.setAttribute("data-theme", mode);
  localStorage.setItem("lms_theme", mode);
}

applyTheme(localStorage.getItem("lms_theme") || "light");

document.addEventListener("DOMContentLoaded", () => {
  const links = document.querySelector(".nav-links");
  if (!links) return;
  const li = document.createElement("li");
  li.innerHTML = '<button class="btn-ghost" id="themeBtn"></button>';
  links.insertBefore(li, links.lastElementChild);
  const btn = document.getElementById("themeBtn");
  const label = () => (btn.textContent = document.documentElement.dataset.theme === "dark" ? "Light mode" : "Dark mode");
  label();
  btn.addEventListener("click", () => {
    applyTheme(document.documentElement.dataset.theme === "dark" ? "light" : "dark");
    label();
  });
});

// submissions are stored per user so accounts do not share status
function submissionKey(asnId) {
  const user = JSON.parse(sessionStorage.getItem("currentUser"));
  return (user ? user.id : "guest") + ":" + asnId;
}

function getSubmissions() {
  return JSON.parse(localStorage.getItem("lms_submissions") || "{}");
}

function daysLeft(dateStr) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((new Date(dateStr) - today) / 86400000);
}
