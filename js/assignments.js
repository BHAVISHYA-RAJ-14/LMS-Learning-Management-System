// Handles assessment rendering and simulates client-side submission state
document.addEventListener("DOMContentLoaded", () => {
  const activeUser = checkAuth();
  if (activeUser) {
    loadAssignments();
  }
});

async function loadAssignments() {
  const listContainer = document.getElementById("assignmentsList");
  
  try {
    const res = await fetch("./data/assignments.json");
    if (!res.ok) throw new Error("Unable to fetch assignment records");
    const assignments = await res.json();

    listContainer.innerHTML = "";
    const submissions = JSON.parse(localStorage.getItem("lms_submissions") || "{}");

    assignments.forEach((asn) => {
      const isSubmitted = submissions[asn.id] ? true : false;
      const card = document.createElement("div");
      card.className = "card";
      card.style.marginBottom = "1rem";
      
      card.innerHTML = `
        <div>
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <h3>${asn.title}</h3>
            <span style="font-size: 0.8rem; font-weight: 700; color: ${isSubmitted ? '#0b6623' : '#b45309'};">
              ${isSubmitted ? "Status: Submitted" : "Status: Pending"}
            </span>
          </div>
          <p style="font-size: 0.9rem; margin: 0.5rem 0;">${asn.description}</p>
          <p style="font-size: 0.8rem; color: var(--text-muted);">Due Date: ${asn.dueDate} | Max Marks: ${asn.maxMarks}</p>
        </div>
        <div style="margin-top: 1rem;">
          ${isSubmitted 
            ? `<button class="btn-primary" style="background-color: var(--text-muted); cursor: not-allowed;" disabled>Submitted</button>`
            : `<button class="btn-primary" onclick="submitAssignment('${asn.id}')">Submit Solution</button>`
          }
        </div>
      `;
      listContainer.appendChild(card);
    });
  } catch (err) {
    listContainer.innerHTML = `<div class="alert-error">Failed to load assignment data.</div>`;
  }
}

function submitAssignment(asnId) {
  const fileInput = prompt("Simulate File Submission (Enter your submitted file name e.g., solution_v1.pdf):");
  if (fileInput && fileInput.trim() !== "") {
    const submissions = JSON.parse(localStorage.getItem("lms_submissions") || "{}");
    submissions[asnId] = {
      filename: fileInput.trim(),
      timestamp: new Date().toISOString()
    };
    localStorage.setItem("lms_submissions", JSON.stringify(submissions));
    alert("Assignment submitted successfully!");
    loadAssignments();
  }
}

// localStorage persistence layer for submission state across sessions
