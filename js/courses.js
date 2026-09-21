// Asynchronously fetches course listings and injects them into the DOM
document.addEventListener("DOMContentLoaded", () => {
  const activeUser = checkAuth();
  if (activeUser) {
    loadCourseCatalog();
  }
});

async function loadCourseCatalog() {
  const gridContainer = document.getElementById("coursesGrid");
  const loadingIndicator = document.getElementById("loadingIndicator");

  try {
    const response = await fetch("./data/courses.json");
    if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
    
    const courses = await response.json();
    loadingIndicator.style.display = "none";
    gridContainer.innerHTML = "";

    courses.forEach((course) => {
      const card = document.createElement("div");
      card.className = "card";
      card.innerHTML = `
        <div>
          <span style="font-size: 0.75rem; color: var(--text-muted); font-weight: 700;">${course.code}</span>
          <h3>${course.title}</h3>
          <p style="font-size: 0.9rem; margin-bottom: 0.5rem;"><strong>Instructor:</strong> ${course.instructor}</p>
          <p style="font-size: 0.85rem; color: var(--text-muted);">${course.syllabus}</p>
        </div>
        <div style="margin-top: 1rem; display: flex; justify-content: space-between; align-items: center;">
          <span style="font-size: 0.85rem;"><strong>Credits:</strong> ${course.credits}</span>
          <button class="btn-primary" onclick="viewCourseDetails('${course.id}')" style="font-size: 0.85rem; padding: 0.4rem 0.8rem; width: auto;">View Module</button>
        </div>
      `;
      gridContainer.appendChild(card);
    });
  } catch (error) {
    console.error("Course Loading Error:", error);
    loadingIndicator.textContent = "Failed to load courses. Run application via a local server.";
    loadingIndicator.classList.add("alert-error");
  }
}

function viewCourseDetails(courseId) {
  alert(`Navigating to Course Detail Context: ${courseId}`);
}

// Dynamic card injection with error boundary handling enabled
