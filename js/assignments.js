// renders assignments, deadline badges, progress and the upload dialog
let assignmentList = [];
let activeUser = null;
let pendingId = null;

const ALLOWED_EXTENSIONS = [".pdf", ".doc", ".docx", ".zip", ".txt"];
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB limit

document.addEventListener("DOMContentLoaded", () => {
  activeUser = checkAuth();
  if (activeUser) {
    buildModal();
    loadAssignments();
  }
});

function formatFileSize(bytes) {
  if (!bytes || bytes <= 0) return "";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return (bytes / Math.pow(1024, i)).toFixed(1) + " " + units[i];
}

function formatSubmissionDate(dateStr) {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) +
      " at " + d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch {
    return dateStr;
  }
}

function deadlineBadge(asn, submitted) {
  if (submitted) return '<span class="badge badge-green">Submitted</span>';
  const d = daysLeft(asn.dueDate);
  if (d < 0) return '<span class="badge badge-red">Overdue by ' + Math.abs(d) + ' days</span>';
  if (d === 0) return '<span class="badge badge-orange">Due today</span>';
  if (d <= 3) return '<span class="badge badge-orange">Due in ' + d + ' days</span>';
  return '<span class="badge badge-grey">Due in ' + d + ' days</span>';
}

async function loadAssignments() {
  const box = document.getElementById("assignmentsList");
  try {
    const res = await fetch("./data/assignments.json");
    if (!res.ok) throw new Error("Unable to fetch assignment records");
    assignmentList = await res.json();
    render();
  } catch (err) {
    if (box) {
      box.innerHTML = '<div class="alert-error">Failed to load assignment data. Run through a local web server.</div>';
    }
  }
}

function render() {
  const box = document.getElementById("assignmentsList");
  if (!box) return;
  const subs = getSubmissions();
  const isStudent = activeUser && activeUser.role === "student";
  let done = 0;
  box.innerHTML = "";

  if (assignmentList.length === 0) {
    box.innerHTML = '<p class="muted">No academic assignments currently scheduled.</p>';
    return;
  }

  assignmentList.forEach(asn => {
    const sub = subs[submissionKey(asn.id)];
    if (sub) done++;

    let action = '<p class="muted">Only students can submit solutions.</p>';
    if (isStudent) {
      if (sub) {
        const sizeInfo = sub.size ? ` (${formatFileSize(sub.size)})` : "";
        action = `<p class="muted">Submitted: <strong>${sub.filename}</strong>${sizeInfo} on ${formatSubmissionDate(sub.timestamp)}</p>`;
      } else {
        action = `<button class="btn-primary" style="width: auto;" onclick="openModal('${asn.id}')">Submit Solution</button>`;
      }
    }

    const card = document.createElement("div");
    card.className = "card";
    card.style.marginBottom = "1rem";
    card.innerHTML = `
      <div>
        <div style="display: flex; justify-content: space-between; align-items: center; gap: 1rem;">
          <h3>${asn.title}</h3>
          ${deadlineBadge(asn, !!sub)}
        </div>
        <p style="font-size: 0.9rem; margin: 0.5rem 0;">${asn.description}</p>
        <p class="muted">Course: ${asn.courseId} | Due: ${asn.dueDate} | Max marks: ${asn.maxMarks}</p>
      </div>
      <div style="margin-top: 1rem;">${action}</div>
    `;
    box.appendChild(card);
  });

  const pct = assignmentList.length ? Math.round((done / assignmentList.length) * 100) : 0;
  const progressBox = document.getElementById("progressBox");
  if (progressBox) {
    progressBox.innerHTML = isStudent
      ? '<div class="card" style="margin-bottom: 1rem;"><strong>' + done + ' of ' + assignmentList.length + ' assignments submitted (' + pct + '%)</strong><div class="progress"><div style="width:' + pct + '%"></div></div></div>'
      : "";
  }
}

function buildModal() {
  const bg = document.createElement("div");
  bg.className = "modal-bg";
  bg.id = "modalBg";
  bg.innerHTML = `
    <div class="modal">
      <h3>Submit solution</h3>
      <p class="muted" id="modalTitle"></p>
      <div class="form-group" style="margin-top: 1rem;">
        <label for="fileInput">Choose your file (.pdf, .doc, .docx, .zip, .txt, max 10MB)</label>
        <input type="file" id="fileInput" accept=".pdf,.doc,.docx,.zip,.txt">
      </div>
      <div id="modalError" class="alert-error" style="display: none;">Please choose a file first.</div>
      <div class="row">
        <button class="btn-primary" id="confirmBtn">Upload</button>
        <button class="btn-ghost" id="cancelBtn">Cancel</button>
      </div>
    </div>`;
  document.body.appendChild(bg);
  document.getElementById("cancelBtn").onclick = closeModal;
  document.getElementById("confirmBtn").onclick = confirmSubmit;
  bg.addEventListener("click", e => { if (e.target === bg) closeModal(); });

  // Escape key closes modal
  document.addEventListener("keydown", e => {
    if (e.key === "Escape" && bg.classList.contains("open")) {
      closeModal();
    }
  });
}

function openModal(id) {
  pendingId = id;
  const asn = assignmentList.find(a => a.id === id);
  if (!asn) return;
  document.getElementById("modalTitle").textContent = asn.title;
  const fileInput = document.getElementById("fileInput");
  if (fileInput) fileInput.value = "";
  const modalErr = document.getElementById("modalError");
  if (modalErr) modalErr.style.display = "none";
  document.getElementById("modalBg").classList.add("open");
}

function closeModal() {
  const modalBg = document.getElementById("modalBg");
  if (modalBg) modalBg.classList.remove("open");
}

function confirmSubmit() {
  const fileInput = document.getElementById("fileInput");
  const file = fileInput ? fileInput.files[0] : null;

  if (!file) {
    showModalError("Please choose a file to upload.");
    return;
  }

  // Validate extension
  const ext = "." + file.name.split(".").pop().toLowerCase();
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    showModalError("Unsupported file type. Please upload a .pdf, .doc, .docx, .zip, or .txt file.");
    return;
  }

  // Validate size
  if (file.size > MAX_FILE_SIZE_BYTES) {
    showModalError("File exceeds the 10MB size limit. Please choose a smaller file.");
    return;
  }

  const subs = getSubmissions();
  subs[submissionKey(pendingId)] = {
    filename: file.name,
    size: file.size,
    timestamp: new Date().toISOString()
  };
  localStorage.setItem("lms_submissions", JSON.stringify(subs));
  closeModal();
  render();
}

function showModalError(msg) {
  const err = document.getElementById("modalError");
  if (err) {
    err.textContent = msg;
    err.style.display = "block";
  }
}
