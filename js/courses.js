// Asynchronously fetches course listings and injects them into the DOM
let allCourses = [];

document.addEventListener("DOMContentLoaded", () => {
  const activeUser = checkAuth();
  if (activeUser) {
    loadCourseCatalog();
  }
});

async function loadCourseCatalog() {
  const loadingIndicator = document.getElementById("loadingIndicator");

  try {
    const response = await fetch("./data/courses.json");
    if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
    
    allCourses = await response.json();
    if (loadingIndicator) loadingIndicator.style.display = "none";
    renderCourses(allCourses);
  } catch (error) {
    console.error("Course Loading Error:", error);
    if (loadingIndicator) {
      loadingIndicator.textContent = "Failed to load courses. Run application via a local server.";
      loadingIndicator.classList.add("alert-error");
    }
  }
}

function filterCourses(query = "") {
  const q = query.trim().toLowerCase();
  if (!q) {
    renderCourses(allCourses);
    return;
  }
  const filtered = allCourses.filter((course) =>
    (course.title + " " + course.code + " " + course.instructor + " " + (course.syllabus || "")).toLowerCase().includes(q)
  );
  renderCourses(filtered);
}

function renderCourses(courses) {
  const gridContainer = document.getElementById("coursesGrid");
  if (!gridContainer) return;
  gridContainer.innerHTML = "";

  if (!courses || courses.length === 0) {
    gridContainer.innerHTML = '<p class="muted" style="grid-column: 1 / -1; text-align: center; padding: 2rem;">No course records found matching criteria.</p>';
    return;
  }

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
}

function viewCourseDetails(courseId) {
  alert(`Navigating to Course Detail Context: ${courseId}`);
}

// Dynamic card injection with error boundary handling enabled
// Error boundary: fetch failure shows inline alert-error div
