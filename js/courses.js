// loads the course list and handles searching
let allCourses = [];

document.addEventListener("DOMContentLoaded", () => {
  if (checkAuth()) {
    loadCourseCatalog();
    const searchBox = document.getElementById("searchBox");
    if (searchBox) {
      searchBox.addEventListener("input", filterCourses);
      searchBox.addEventListener("keydown", (e) => {
        if (e.key === "Escape") {
          clearCourseSearch();
        }
      });
    }
  }
});

async function loadCourseCatalog() {
  const loading = document.getElementById("loadingIndicator");
  try {
    const response = await fetch("./data/courses.json");
    if (!response.ok) throw new Error("HTTP error " + response.status);
    allCourses = await response.json();
    if (loading) loading.style.display = "none";
    renderCourses(allCourses);
  } catch (error) {
    console.error("Course loading error:", error);
    if (loading) {
      loading.textContent = "Failed to load courses. Run the project through a local server.";
      loading.classList.add("alert-error");
    }
  }
}

function clearCourseSearch() {
  const searchBox = document.getElementById("searchBox");
  if (searchBox) {
    searchBox.value = "";
    filterCourses();
    searchBox.focus();
  }
}

function filterCourses() {
  const searchBox = document.getElementById("searchBox");
  const q = searchBox ? searchBox.value.trim().toLowerCase() : "";
  const matches = allCourses.filter(c =>
    (c.title + " " + c.code + " " + c.instructor + " " + (c.syllabus || "")).toLowerCase().includes(q)
  );
  renderCourses(matches);
}

function renderCourses(list) {
  const grid = document.getElementById("coursesGrid");
  const countEl = document.getElementById("resultCount");
  if (!grid) return;

  const total = allCourses.length;
  if (countEl) {
    countEl.textContent = `Showing ${list.length} of ${total} course${total === 1 ? "" : "s"}`;
  }
  grid.innerHTML = "";

  if (list.length === 0) {
    grid.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 2rem;">
        <p class="muted">No courses found matching your criteria.</p>
        <button class="btn-ghost" onclick="clearCourseSearch()" style="margin-top: 0.5rem; width: auto;">Reset Search</button>
      </div>
    `;
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
  if (!c) {
    alert("Course details could not be found.");
    return;
  }

  const details = [
    `${c.code}: ${c.title}`,
    "----------------------------------------",
    `Instructor: ${c.instructor}`,
    `Credits: ${c.credits} | Enrolled: ${c.activeEnrolled}`,
    "",
    "Syllabus & Course Outline:",
    c.syllabus
  ].join("\n");

  alert(details);
}
