// ============================================================
// course-detail.js - Full-Page Course Module Interface
// Displays Completion Time, Modules, Enrolled Students, & Direct Assignment Handoff
// ============================================================

let currentCourse = null;
let allAssignments = [];
let allCourses = [];
let currentUser = null;

document.addEventListener("DOMContentLoaded", async () => {
  currentUser = checkAuth([], true); // Allow guest viewing
  
  const urlParams = new URLSearchParams(window.location.search);
  const courseId = urlParams.get("id") || "CRS-001";

  await loadCourseDetails(courseId);
});

async function loadCourseDetails(courseId) {
  const container = document.getElementById("courseDetailContainer");

  try {
    const [coursesRes, asnRes] = await Promise.all([
      fetch("./data/courses.json"),
      fetch("./data/assignments.json")
    ]);

    if (!coursesRes.ok || !asnRes.ok) throw new Error("Network error loading academic data");

    allCourses = await coursesRes.json();
    allAssignments = await asnRes.json();

    currentCourse = allCourses.find(c => c.id === courseId) || allCourses[0];

    renderCoursePage(currentCourse, allAssignments);
  } catch (err) {
    console.error("Detail load error:", err);
    if (container) {
      container.innerHTML = `
        <div class="alert-error" style="margin: 2rem 0; padding: 1.5rem;">
          <h3>Could not load course details</h3>
          <p>Please ensure you are viewing this project via an active HTTP server (e.g., VS Code Live Server or Python http.server).</p>
          <a href="courses.html" class="btn-primary" style="display:inline-block;margin-top:1rem;text-decoration:none;">← Return to Courses</a>
        </div>
      `;
    }
  }
}

function renderCoursePage(course, assignments) {
  const container = document.getElementById("courseDetailContainer");
  if (!container) return;

  const purchasedList = JSON.parse(localStorage.getItem("lms_purchased") || "[]");
  const enrolledList = JSON.parse(localStorage.getItem("lms_enrolled") || "[\"CRS-001\"]");
  const isPurchased = purchasedList.includes(course.id);
  const isEnrolled = enrolledList.includes(course.id);

  // Filter assignments for this course
  const relatedAssignments = assignments.filter(a => a.courseId === course.id || a.courseId === course.code);

  // Compute realistic time estimation
  const moduleList = course.modules || [];
  const hoursPerModule = 9;
  const totalHours = moduleList.length * hoursPerModule;
  const weeks = course.duration || `${Math.ceil(totalHours / 4)} weeks`;

  // Enrolled students list
  const students = course.enrolledStudents || [
    "Bhavishya Raj", "Aarav Sharma", "Priya Verma", "Ananya Singh",
    "Vikram Patel", "Sneha Agarwal", "Arjun Mehta", "Kavya Joshi"
  ];

  container.innerHTML = `
    <!-- Top Breadcrumb & Next Navigation -->
    <nav class="breadcrumb-bar animate-in">
      <div class="breadcrumb-links">
        <a href="courses.html">Courses</a> &rsaquo; 
        <span class="muted">${course.code}</span> &rsaquo; 
        <strong>${course.title}</strong>
      </div>
      <div class="nav-shortcut-btns">
        <a href="courses.html" class="btn-ghost" style="text-decoration:none;font-size:0.85rem;">← Course Catalog</a>
        <a href="assignments.html" class="btn-primary" style="text-decoration:none;font-size:0.85rem;">Assignments Portal →</a>
      </div>
    </nav>

    <!-- Course Hero Section -->
    <header class="course-detail-hero animate-in">
      <div class="hero-content">
        <div class="hero-badges">
          <span class="badge badge-green">${course.code}</span>
          <span class="badge badge-grey">Department of Computer Engineering</span>
          ${course.popular ? '<span class="badge badge-orange">🔥 Popular Pick</span>' : ''}
        </div>
        <h1 class="hero-title">${course.title}</h1>
        <p class="hero-lead">${course.description || "In-depth university curriculum designed to build practical engineering mastery."}</p>

        <div class="hero-faculty-info">
          <div class="instructor-pill">
            <span class="avatar-sm">👨‍🏫</span>
            <div>
              <strong>${course.instructor}</strong>
              <p class="muted" style="font-size:0.8rem;">Course Lead &bull; GLA University</p>
            </div>
          </div>
        </div>

        <!-- Quick Stats Row -->
        <div class="hero-metrics-grid">
          <div class="metric-card">
            <span class="metric-label">Estimated Completion</span>
            <strong class="metric-val">⏱ ${weeks}</strong>
            <span class="metric-sub">~${totalHours} total learning hrs</span>
          </div>
          <div class="metric-card">
            <span class="metric-label">Academic Credits</span>
            <strong class="metric-val">⚡ ${course.credits} Credits</strong>
            <span class="metric-sub">University Approved</span>
          </div>
          <div class="metric-card">
            <span class="metric-label">Enrolled Students</span>
            <strong class="metric-val">👥 ${students.length} Learners</strong>
            <span class="metric-sub"><a href="#students-section" style="color:var(--primary);text-decoration:underline;">View student roster</a></span>
          </div>
          <div class="metric-card">
            <span class="metric-label">Course Access</span>
            <strong class="metric-val" style="color:var(--primary);">₹${(course.price || 4999).toLocaleString("en-IN")}</strong>
            <span class="metric-sub">Lifetime syllabus access</span>
          </div>
        </div>

        <!-- Action CTAs -->
        <div class="hero-actions-bar">
          ${isEnrolled ? `
            <button class="btn-primary" disabled style="background:#166534;cursor:default;">
              ✓ You are Enrolled in this Course
            </button>
          ` : `
            <button class="btn-primary" onclick="handleDetailEnroll('${course.id}')">
              Enroll in Course Now
            </button>
          `}

          ${isPurchased ? `
            <button class="btn-ghost" disabled style="color:var(--primary);font-weight:600;">
              ✓ Full License Purchased
            </button>
          ` : `
            <button class="btn-buy" onclick="handleDetailBuy('${course.id}')">
              💳 Buy Course (₹${(course.price || 4999).toLocaleString("en-IN")})
            </button>
          `}

          <a href="#assignments-section" class="btn-ghost" style="text-decoration:none;">
            Jump to Assignments (${relatedAssignments.length}) ↓
          </a>
        </div>
      </div>
    </header>

    <!-- Estimated Finish Time & Study Pace Guide -->
    <section class="card time-estimation-card animate-in">
      <div class="time-card-header">
        <div style="font-size:2rem;line-height:1;">⏳</div>
        <div>
          <h3>Estimated Time to Complete & Learning Schedule</h3>
          <p class="muted">Based on average student completion speed in 5th Semester B.Tech CSE</p>
        </div>
      </div>

      <div class="time-breakdown-grid">
        <div class="time-box">
          <span class="time-box-num">${weeks}</span>
          <span class="time-box-desc">Overall Course Duration</span>
        </div>
        <div class="time-box">
          <span class="time-box-num">~${hoursPerModule} Hours</span>
          <span class="time-box-desc">Average per Module</span>
        </div>
        <div class="time-box">
          <span class="time-box-num">4-5 Hrs / Wk</span>
          <span class="time-box-desc">Recommended Pace</span>
        </div>
        <div class="time-box">
          <span class="time-box-num">${relatedAssignments.length} Tasks</span>
          <span class="time-box-desc">Evaluations Included</span>
        </div>
      </div>

      <div class="pace-tip-box" style="margin-top:1.25rem;background:var(--surface-alt);border-radius:8px;padding:0.9rem 1.2rem;border-left:4px solid var(--accent);">
        <strong>💡 Faculty Recommendation:</strong> Dedicate 45 minutes daily or 4 hours every weekend. Once you finish reviewing the modules below, proceed directly to the required course assignment to validate your credits.
      </div>
    </section>

    <!-- Dedicated Modules Timeline Interface -->
    <section class="card modules-section animate-in">
      <div class="section-title-row">
        <div>
          <h2>Course Curriculum & Modules (${moduleList.length} Units)</h2>
          <p class="muted">Sequential syllabus outline with unit objectives and estimated hours</p>
        </div>
        <span class="badge badge-green">Zero-Popup Full Interface</span>
      </div>

      <div class="module-timeline-list">
        ${moduleList.map((modTitle, idx) => {
          return `
            <div class="module-timeline-item">
              <div class="module-step-badge">${idx + 1}</div>
              <div class="module-item-content">
                <div class="module-item-header">
                  <h4>Unit ${idx + 1}: ${modTitle}</h4>
                  <span class="module-hours-tag">~${hoursPerModule} hrs study time</span>
                </div>
                <p class="muted" style="margin-top:0.4rem;font-size:0.95rem;">
                  Comprehensive concepts, lecture notes, architecture diagrams, and laboratory practical exercises.
                </p>
                <div class="module-resource-pills">
                  <span class="pill">📄 Lecture Slides</span>
                  <span class="pill">💻 Code Examples</span>
                  <span class="pill">🧪 Lab Sheet</span>
                  <span class="pill">✅ Self-Check Quiz</span>
                </div>
              </div>
            </div>
          `;
        }).join("")}
      </div>
    </section>

    <!-- Specific Course Enrolled Students Section -->
    <section id="students-section" class="card enrolled-students-section animate-in">
      <div class="section-title-row">
        <div>
          <h2>Enrolled Students in this Course (${students.length})</h2>
          <p class="muted">Active classmates registered under ${course.instructor} for Fall 2026</p>
        </div>
        <span class="badge badge-grey">Live Class Roster</span>
      </div>

      <div class="students-grid">
        ${students.map((studentName, i) => {
          const initials = studentName.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
          const roll = "2415000" + (440 + i);
          return `
            <div class="student-profile-chip">
              <div class="student-avatar-circle">${initials}</div>
              <div class="student-info">
                <strong>${studentName}</strong>
                <span class="muted">${roll} &bull; CSE-3A</span>
              </div>
            </div>
          `;
        }).join("")}
      </div>
    </section>

    <!-- Direct Transition to Assignments Section -->
    <section id="assignments-section" class="card assignments-handoff-section animate-in" style="border:2px solid var(--primary);box-shadow:var(--shadow-glow);">
      <div class="section-title-row">
        <div>
          <span class="badge badge-orange" style="margin-bottom:0.4rem;display:inline-block;">Direct Next Step</span>
          <h2>Course Assessments & Assignments</h2>
          <p class="muted">After completing your module study, review deadlines and submit your deliverables directly</p>
        </div>
        <a href="assignments.html" class="btn-primary" style="text-decoration:none;">Open Full Assignments Portal →</a>
      </div>

      ${relatedAssignments.length > 0 ? `
        <div class="related-assignments-list" style="margin-top:1.25rem;">
          ${relatedAssignments.map(asn => {
            const subs = getSubmissions();
            const sub = subs[submissionKey(asn.id)];
            const d = daysLeft(asn.dueDate);
            const badgeCls = sub ? "badge-green" : d < 0 ? "badge-red" : d <= 3 ? "badge-orange" : "badge-grey";
            const badgeText = sub ? "Submitted" : d < 0 ? "Overdue" : d === 0 ? "Due Today" : `${d} days left`;

            return `
              <div class="assignment-handoff-item">
                <div style="flex:1;">
                  <div style="display:flex;align-items:center;gap:0.75rem;flex-wrap:wrap;">
                    <strong style="font-size:1.1rem;">${asn.title}</strong>
                    <span class="badge ${badgeCls}">${badgeText}</span>
                  </div>
                  <p class="muted" style="margin-top:0.4rem;font-size:0.95rem;">${asn.description || "Academic laboratory assessment."}</p>
                  <p class="muted" style="font-size:0.85rem;margin-top:0.25rem;">
                    Due Date: <strong>${asn.dueDate}</strong> &bull; Max Marks: <strong>${asn.maxMarks || 50}</strong>
                  </p>
                </div>
                <div>
                  <a href="assignments.html" class="btn-primary" style="text-decoration:none;white-space:nowrap;">
                    ${sub ? "View Submission" : "Submit Deliverable →"}
                  </a>
                </div>
              </div>
            `;
          }).join("")}
        </div>
      ` : `
        <div style="text-align:center;padding:2rem;">
          <p class="muted">No pending assignments currently scheduled for this module.</p>
          <a href="assignments.html" class="btn-primary" style="display:inline-block;margin-top:1rem;text-decoration:none;">Go to All Assignments</a>
        </div>
      `}

      <!-- Large Next Page Banner -->
      <div class="next-step-banner" style="margin-top:2rem;background:linear-gradient(135deg,var(--primary-dark),var(--primary));color:#fff;border-radius:12px;padding:1.5rem 2rem;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:1rem;">
        <div>
          <h3 style="color:#fff;font-size:1.4rem;">Finished reviewing ${course.code}?</h3>
          <p style="color:#e6f2e9;margin-top:0.2rem;font-size:0.95rem;">Jump directly to the university submissions portal to complete and submit your lab project.</p>
        </div>
        <a href="assignments.html" class="btn-ghost" style="background:#fff;color:var(--primary-dark);font-weight:700;padding:0.75rem 1.5rem;text-decoration:none;border-radius:8px;">
          Proceed to Assignments →
        </a>
      </div>
    </section>

    <!-- Next Page Bottom Navigation Bar -->
    <div class="bottom-page-nav animate-in">
      <a href="courses.html" class="btn-ghost" style="text-decoration:none;">
        ← Back to All Courses
      </a>
      <a href="dashboard.html" class="btn-ghost" style="text-decoration:none;">
        🏠 Student Dashboard
      </a>
      <a href="assignments.html" class="btn-primary" style="text-decoration:none;">
        Next Page: Assignments Portal →
      </a>
    </div>
  `;
}

function handleDetailEnroll(courseId) {
  if (!isLoggedIn()) {
    sessionStorage.setItem("lms_redirect", `course-detail.html?id=${courseId}`);
    alert(`Please login to your GLA account to enroll in "${currentCourse.title}". Redirecting to login page...`);
    window.location.href = "login.html";
    return;
  }

  const enrolled = JSON.parse(localStorage.getItem("lms_enrolled") || "[]");
  if (!enrolled.includes(courseId)) {
    enrolled.push(courseId);
    localStorage.setItem("lms_enrolled", JSON.stringify(enrolled));
  }
  alert(`🎉 Success! You have enrolled in "${currentCourse.title}".`);
  renderCoursePage(currentCourse, allAssignments);
}

function handleDetailBuy(courseId) {
  if (!isLoggedIn()) {
    sessionStorage.setItem("lms_redirect", `course-detail.html?id=${courseId}`);
    alert(`Please login to purchase "${currentCourse.title}". Redirecting to login page...`);
    window.location.href = "login.html";
    return;
  }

  // Trigger checkout simulation modal
  if (typeof openCheckoutModal === "function") {
    openCheckoutModal(currentCourse);
  } else {
    const confirmed = confirm(`Proceed with simulated payment of ₹${(currentCourse.price || 4999).toLocaleString("en-IN")} for "${currentCourse.title}"?`);
    if (confirmed) {
      const purchased = JSON.parse(localStorage.getItem("lms_purchased") || "[]");
      if (!purchased.includes(courseId)) {
        purchased.push(courseId);
        localStorage.setItem("lms_purchased", JSON.stringify(purchased));
      }
      const enrolled = JSON.parse(localStorage.getItem("lms_enrolled") || "[]");
      if (!enrolled.includes(courseId)) {
        enrolled.push(courseId);
        localStorage.setItem("lms_enrolled", JSON.stringify(enrolled));
      }
      alert("🎉 Payment Successful! Full course access granted.");
      renderCoursePage(currentCourse, allAssignments);
    }
  }
}
