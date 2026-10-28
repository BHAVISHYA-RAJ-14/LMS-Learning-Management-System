// renders assignments, deadline badges, progress and the upload dialog
let assignmentList = [];
let activeUser = null;
let pendingId = null;

document.addEventListener("DOMContentLoaded", () => {
  activeUser = checkAuth();
  if (activeUser) {
    buildModal();
    loadAssignments();
  }
});

function deadlineBadge(asn, submitted) {
  if (submitted) return '<span class="badge badge-green">Submitted</span>';
  const d = daysLeft(asn.dueDate);
  if (d < 0) return '<span class="badge badge-red">Overdue by ' + Math.abs(d) + ' days</span>';
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
    box.innerHTML = '<div class="alert-error">Failed to load assignment data.</div>';
  }
}

function render() {
  const box = document.getElementById("assignmentsList");
  const subs = getSubmissions();
  const isStudent = activeUser.role === "student";
  let done = 0;
  box.innerHTML = "";

  assignmentList.forEach(asn => {
    const sub = subs[submissionKey(asn.id)];
    if (sub) done++;

    let action = '<p class="muted">Only students can submit solutions.</p>';
    if (isStudent) {
      action = sub
        ? '<p class="muted">File: ' + sub.filename + ' (' + new Date(sub.timestamp).toLocaleDateString() + ')</p>'
        : '<button class="btn-primary" style="width: auto;" onclick="openModal(\'' + asn.id + '\')">Submit Solution</button>';
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
  document.getElementById("progressBox").innerHTML = isStudent
    ? '<div class="card" style="margin-bottom: 1rem;"><strong>' + done + ' of ' + assignmentList.length + ' assignments submitted (' + pct + '%)</strong><div class="progress"><div style="width:' + pct + '%"></div></div></div>'
    : "";
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
        <label for="fileInput">Choose your file</label>
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
}

function openModal(id) {
  pendingId = id;
  const asn = assignmentList.find(a => a.id === id);
  document.getElementById("modalTitle").textContent = asn.title;
  document.getElementById("fileInput").value = "";
  document.getElementById("modalError").style.display = "none";
  document.getElementById("modalBg").classList.add("open");
}

function closeModal() {
  document.getElementById("modalBg").classList.remove("open");
}

function confirmSubmit() {
  const file = document.getElementById("fileInput").files[0];
  if (!file) {
    document.getElementById("modalError").style.display = "block";
    return;
  }
  const subs = getSubmissions();
  subs[submissionKey(pendingId)] = { filename: file.name, timestamp: new Date().toISOString() };
  localStorage.setItem("lms_submissions", JSON.stringify(subs));
  closeModal();
  render();
}
