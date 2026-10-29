// Handles authentication verification and session management
function getCurrentUser() {
  try {
    const raw = sessionStorage.getItem("currentUser");
    return raw ? JSON.parse(raw) : null;
  } catch (err) {
    console.error("Error parsing current user session:", err);
    return null;
  }
}

async function handleLogin(event) {
  event.preventDefault();
  const emailInput = document.getElementById("email").value.trim();
  const passwordInput = document.getElementById("password").value.trim();
  const errorMessage = document.getElementById("error-msg");
  const submitBtn = event.target.querySelector("button[type='submit']");

  if (errorMessage) {
    errorMessage.style.display = "none";
    errorMessage.textContent = "";
  }

  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.dataset.originalText = submitBtn.textContent;
    submitBtn.textContent = "Authenticating...";
  }

  try {
    const response = await fetch("./data/users.json");
    if (!response.ok) throw new Error("Could not access user directory");
    const users = await response.json();

    const matchedUser = users.find(
      (u) => u.username.toLowerCase() === emailInput.toLowerCase() && u.password === passwordInput
    );

    if (matchedUser) {
      sessionStorage.setItem("currentUser", JSON.stringify(matchedUser));
      sessionStorage.setItem("userRole", matchedUser.role);
      window.location.href = "dashboard.html";
    } else {
      if (errorMessage) {
        errorMessage.textContent = "Invalid academic credentials. Please re-check.";
        errorMessage.style.display = "block";
      }
    }
  } catch (err) {
    console.error("Auth Exception:", err);
    if (errorMessage) {
      errorMessage.textContent = "Authentication service temporarily unavailable.";
      errorMessage.style.display = "block";
    }
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = submitBtn.dataset.originalText || "Authenticate";
    }
  }
}

function checkAuth(allowedRoles = []) {
  const user = getCurrentUser();
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
  li.innerHTML = '<button class="btn-ghost" id="themeBtn" aria-label="Toggle theme"></button>';
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
  const user = getCurrentUser();
  return (user ? user.id : "guest") + ":" + asnId;
}

function getSubmissions() {
  try {
    return JSON.parse(localStorage.getItem("lms_submissions") || "{}");
  } catch (err) {
    console.error("Error reading submissions from localStorage:", err);
    return {};
  }
}

function daysLeft(dateStr) {
  const targetDate = new Date(dateStr);
  if (isNaN(targetDate.getTime())) return 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((targetDate - today) / 86400000);
}
