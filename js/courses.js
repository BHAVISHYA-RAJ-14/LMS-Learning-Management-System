// loads the course list and handles searching
let allCourses = [];

document.addEventListener("DOMContentLoaded", () => {
  if (checkAuth()) {
    loadCourseCatalog();
    document.getElementById("searchBox").addEventListener("input", filterCourses);
  }
});

async function loadCourseCatalog() {
  const loading = document.getElementById("loadingIndicator");
  try {
    const response = await fetch("./data/courses.json");
    if (!response.ok) throw new Error("HTTP error " + response.status);
    allCourses = await response.json();
    loading.style.display = "none";
    renderCourses(allCourses);
  } catch (error) {
    console.error("Course loading error:", error);
    loading.textContent = "Failed to load courses. Run the project through a local server.";
    loading.classList.add("alert-error");
  }
}

function filterCourses() {
  const q = document.getElementById("searchBox").value.trim().toLowerCase();
  const matches = allCourses.filter(c =>
    (c.title + " " + c.code + " " + c.instructor).toLowerCase().includes(q)
  );
  renderCourses(matches);
}

function renderCourses(list) {
  const grid = document.getElementById("coursesGrid");
  document.getElementById("resultCount").textContent = list.length + " of " + allCourses.length + " courses";
  grid.innerHTML = "";

  if (list.length === 0) {
    grid.innerHTML = '<p class="muted">No course matches that search.</p>';
    return;
  }

  list.forEach(course => {
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
        <span style="font-size: 0.85rem;"><strong>Credits:</strong> ${course.credits} &nbsp; <strong>Enrolled:</strong> ${course.activeEnrolled}</span>
        <button class="btn-primary" onclick="viewCourseDetails('${course.id}')" style="font-size: 0.85rem; padding: 0.4rem 0.8rem; width: auto;">View Module</button>
      </div>
    `;
    grid.appendChild(card);
  });
}

function viewCourseDetails(courseId) {
  const c = allCourses.find(x => x.id === courseId);
  alert(c.code + " - " + c.title + "\n\nInstructor: " + c.instructor + "\nSyllabus: " + c.syllabus);
}
