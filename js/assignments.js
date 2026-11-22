// ============================================================
// assignments.js - Assignments Tracker, Submission Workflow & Progress
// ============================================================

let assignmentList = [];
let activeUser = null;
let currentFilter = "all";
let pendingAsnId = null;

document.addEventListener("DOMContentLoaded", async () => {
  activeUser = checkAuth();
  if (!activeUser) return;

  setupFilterTabs();
  buildSubmissionModal();
  await loadAssignments();
});

async function loadAssignments() {
  const container = document.getElementById("assignmentsList") || document.getElementById("asnList");
  try {
    const res = await fetch("./data/assignments.json");
    if (!res.ok) throw new Error("Could not access assignments database");
    assignmentList = await res.json();
    renderAssignments();
  } catch (err) {
    console.error(err);
    if (container) {
      container.innerHTML = '<div class="alert-error">Failed to load assignment records. Please run via a local HTTP server.</div>';
    }
  }
}

function setupFilterTabs() {
  const tabs = document.querySelectorAll(".asn-filter-tab");
  tabs.forEach(tab => {
    tab.addEventListener("click", () => {
      tabs.forEach(t => t.classList.remove("active"));
      tab.classList.add("active");
      currentFilter = tab.dataset.filter || "all";
      renderAssignments();
    });
  });
}

function renderAssignments() {
  const container = document.getElementById("assignmentsList") || document.getElementById("asnList");
  const progressText = document.getElementById("asnProgress");
  const pbar = document.getElementById("pbar");
  const subs = getSubmissions();

  const isStudent = activeUser.role === "student";

  // Calculate submission stats
  const total = assignmentList.length;
  const submittedCount = assignmentList.filter(a => subs[submissionKey(a.id)]).length;
  const pct = total > 0 ? Math.round((submittedCount / total) * 100) : 0;

  if (progressText) {
    progressText.innerHTML = `<strong>${submittedCount} of ${total} assignments submitted</strong> (${pct}% completed)`;
  }
  if (pbar) {
    pbar.style.width = pct + "%";
  }

  // Filter list
  let displayed = assignmentList.filter(a => {
    const sub = subs[submissionKey(a.id)];
    const d = daysLeft(a.dueDate);
    const isOverdue = !sub && d < 0;

    if (currentFilter === "submitted") return !!sub;
    if (currentFilter === "pending") return !sub && !isOverdue;
    if (currentFilter === "overdue") return isOverdue;
    return true; // all
  });

  if (!container) return;

  if (displayed.length === 0) {
    container.innerHTML = `
      <div class="card" style="text-align:center;padding:2.5rem 1rem;">
        <div style="font-size:2rem;margin-bottom:0.5rem;">🎉</div>
        <h4>No assignments in this category</h4>
        <p class="muted">Check the other filter tabs or relax—you have no pending tasks here.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = displayed.map((a, i) => {
    const sub = subs[submissionKey(a.id)];
    const d = daysLeft(a.dueDate);
    const isOverdue = !sub && d < 0;
    const badgeCls = sub ? "badge-green" : isOverdue ? "badge-red" : d <= 3 ? "badge-orange" : "badge-grey";
    const badgeText = sub ? "✓ Submitted" : isOverdue ? `Overdue by ${Math.abs(d)} days` : d === 0 ? "Due Today" : `${d} days left`;

    let actionBtn = "";
    if (isStudent) {
      if (sub) {
        actionBtn = `
          <div style="text-align:right;">
            <span class="badge badge-green" style="font-size:0.85rem;padding:0.4rem 0.8rem;">Submitted &bull; ${sub.date}</span>
            <p class="muted" style="font-size:0.8rem;margin-top:0.25rem;">File: ${sub.file}</p>
          </div>
        `;
      } else {
        actionBtn = `
          <button class="btn-primary" onclick="openSubmitModal('${a.id}', '${a.title.replace(/'/g, "\\'")}')" style="white-space:nowrap;">
            Submit Solution →
          </button>
        `;
      }
    } else {
      actionBtn = `<span class="badge badge-grey">Faculty View Mode</span>`;
    }

    return `
      <div class="card assignment-item-card animate-in" style="animation-delay:${i * 0.07}s;margin-bottom:1rem;">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:0.75rem;">
          <div style="flex:1;min-width:280px;">
            <div style="display:flex;align-items:center;gap:0.6rem;flex-wrap:wrap;">
              <span class="badge badge-grey">${a.courseId}</span>
              <span class="badge ${badgeCls}">${badgeText}</span>
            </div>
            <h3 style="margin-top:0.5rem;font-size:1.2rem;color:var(--text);">${a.title}</h3>
            <p style="font-size:0.95rem;color:var(--text-secondary);margin:0.5rem 0;line-height:1.5;">${a.description}</p>
            <div class="muted" style="font-size:0.85rem;">
              Due Date: <strong>${a.dueDate}</strong> &bull; Maximum Evaluation: <strong>${a.maxMarks || 50} Marks</strong>
            </div>
          </div>
          <div style="display:flex;align-items:center;justify-content:flex-end;">
            ${actionBtn}
          </div>
        </div>
      </div>
    `;
  }).join("");
}

function buildSubmissionModal() {
  let modal = document.getElementById("submissionModal");
  if (!modal) {
    modal = document.createElement("div");
    modal.id = "submissionModal";
    modal.className = "modal-overlay";
    modal.style.display = "none";
    document.body.appendChild(modal);
  }

  modal.innerHTML = `
    <div class="modal-box animate-in">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem;">
        <h3 id="modalAsnTitle" style="color:var(--primary);font-size:1.25rem;">Submit Assignment Solution</h3>
        <button class="btn-ghost" onclick="closeSubmitModal()" style="padding:0.2rem 0.6rem;font-size:1.2rem;">&times;</button>
      </div>

      <div class="form-group">
        <label for="fileNameInput">Deliverable File Name / Git Repo URL</label>
        <input type="text" id="fileNameInput" placeholder="e.g., LabAssignment1_2415000441.pdf or github.com/..." required />
      </div>

      <div class="form-group">
        <label for="remarksInput">Submission Notes / Remarks (Optional)</label>
        <textarea id="remarksInput" rows="3" placeholder="Add any notes for the faculty instructor..."></textarea>
      </div>

      <div id="submitModalError" class="alert-error" style="display:none;margin-top:0.5rem;"></div>

      <div class="modal-actions" style="margin-top:1.5rem;">
        <button class="btn-ghost" onclick="closeSubmitModal()">Cancel</button>
        <button class="btn-primary" id="confirmSubmitBtn" onclick="confirmAssignmentSubmission()">Upload Deliverable</button>
      </div>
    </div>
  `;
}

function openSubmitModal(id, title) {
  pendingAsnId = id;
  const modal = document.getElementById("submissionModal");
  const titleEl = document.getElementById("modalAsnTitle");
  const fileInput = document.getElementById("fileNameInput");
  const remarksInput = document.getElementById("remarksInput");
  const errBox = document.getElementById("submitModalError");

  if (titleEl) titleEl.textContent = "Submit: " + title;
  if (fileInput) fileInput.value = "";
  if (remarksInput) remarksInput.value = "";
  if (errBox) errBox.style.display = "none";

  if (modal) modal.style.display = "flex";
}

function closeSubmitModal() {
  const modal = document.getElementById("submissionModal");
  if (modal) modal.style.display = "none";
}

function confirmAssignmentSubmission() {
  const fileInput = document.getElementById("fileNameInput");
  const remarksInput = document.getElementById("remarksInput");
  const errBox = document.getElementById("submitModalError");

  const fileName = fileInput ? fileInput.value.trim() : "";
  if (!fileName) {
    if (errBox) {
      errBox.textContent = "Please specify a deliverable file name or link.";
      errBox.style.display = "block";
    }
    return;
  }

  const subs = getSubmissions();
  subs[submissionKey(pendingAsnId)] = {
    file: fileName,
    remarks: remarksInput ? remarksInput.value.trim() : "",
    date: new Date().toLocaleDateString("en-IN")
  };

  localStorage.setItem("lms_submissions", JSON.stringify(subs));
  closeSubmitModal();
  alert("🎉 Assignment deliverable recorded successfully!");
  renderAssignments();
}
// localStorage persistence layer for submission state across sessions

// localStorage persistence: lms_submissions key tracks all student submissions
