// builds the dashboard from courses, assignments and announcements
document.addEventListener("DOMContentLoaded", async () => {
  const user = checkAuth();
  if (!user) return;

  const firstName = user.name.replace(/^(Prof\.|Dr\.)\s*/, "").split(" ")[0];
  document.getElementById("welcome").textContent = "Welcome back, " + firstName;
  document.getElementById("roleLine").textContent =
    user.role.charAt(0).toUpperCase() + user.role.slice(1) + " account" + (user.semester ? ", " + user.semester : "");
  document.getElementById("today").textContent = new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  try {
    const [courses, assignments, notices, users] = await Promise.all([
      fetch("./data/courses.json").then(r => r.json()),
      fetch("./data/assignments.json").then(r => r.json()),
      fetch("./data/announcements.json").then(r => r.json()),
      fetch("./data/users.json").then(r => r.json())
    ]);
    showStats(user, courses, assignments, users);
    showDeadlines(user, courses, assignments);
    showNotices(notices);
  } catch (err) {
    console.error("Dashboard error:", err);
    document.getElementById("stats").innerHTML = '<div class="alert-error">Could not load dashboard data. Use a local server.</div>';
  }
});

function statBox(value, label) {
  return '<div class="stat"><b>' + value + '</b><span>' + label + '</span></div>';
}

function showStats(user, courses, assignments, users) {
  const subs = getSubmissions();
  const submitted = assignments.filter(a => subs[submissionKey(a.id)]).length;
  const overdue = assignments.filter(a => !subs[submissionKey(a.id)] && daysLeft(a.dueDate) < 0).length;
  let html = "";

  if (user.role === "student") {
    html = statBox(courses.length, "Enrolled courses") + statBox(assignments.length - submitted, "Pending assignments") +
           statBox(submitted, "Submitted") + statBox(overdue, "Overdue");
  } else if (user.role === "teacher") {
    const mine = courses.filter(c => c.instructor === user.name);
    const students = mine.reduce((sum, c) => sum + c.activeEnrolled, 0);
    html = statBox(mine.length, "Courses you teach") + statBox(students, "Students across courses") +
           statBox(assignments.length, "Assignments posted");
  } else {
    html = statBox(users.length, "Registered users") + statBox(courses.length, "Active courses") +
           statBox(assignments.length, "Assignments posted");
  }
  document.getElementById("stats").innerHTML = html;
}

function showDeadlines(user, courses, assignments) {
  const subs = getSubmissions();
  const box = document.getElementById("deadlines");
  const list = assignments
    .filter(a => user.role !== "student" || !subs[submissionKey(a.id)])
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

  if (list.length === 0) {
    box.innerHTML = '<p class="muted">Nothing pending. You are all caught up.</p>';
    return;
  }
  box.innerHTML = list.map(a => {
    const d = daysLeft(a.dueDate);
    const cls = d < 0 ? "badge-red" : d <= 3 ? "badge-orange" : "badge-grey";
    const text = d < 0 ? "Overdue" : d === 0 ? "Due today" : d + " days left";
    return '<div class="list-row"><div><strong>' + a.title + '</strong><br><span class="muted">' + a.courseId + ' | ' + a.dueDate + '</span></div><span class="badge ' + cls + '">' + text + '</span></div>';
  }).join("");
}

function showNotices(notices) {
  document.getElementById("notices").innerHTML = notices.map(n =>
    '<div class="list-row" style="display:block"><strong>' + n.title + '</strong><br><span class="muted">' + n.date + '</span><p style="font-size:0.9rem">' + n.text + '</p></div>'
  ).join("");
}
