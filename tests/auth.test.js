const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const authScript = fs.readFileSync(
  path.join(__dirname, "..", "js", "auth.js"),
  "utf8"
);

function createStorage(initialValues = {}) {
  const values = new Map(Object.entries(initialValues));

  return {
    getItem(key) {
      return values.has(key) ? values.get(key) : null;
    },
    setItem(key, value) {
      values.set(key, String(value));
    },
    removeItem(key) {
      values.delete(key);
    },
    clear() {
      values.clear();
    },
    has(key) {
      return values.has(key);
    }
  };
}

function loadAuth(sessionValues = {}, inputValues = {}) {
  const sessionStorage = createStorage(sessionValues);
  const localStorage = createStorage();
  const alerts = [];
  const errors = [];
  const elements = {
    email: { value: inputValues.email || "" },
    password: { value: inputValues.password || "" },
    "error-msg": { textContent: "", style: { display: "none" } }
  };
  const context = {
    sessionStorage,
    localStorage,
    window: { location: { href: "" } },
    document: {
      documentElement: { setAttribute() {} },
      addEventListener() {},
      getElementById(id) {
        return elements[id];
      },
      querySelector() {
        return null;
      }
    },
    fetch: async () => ({
      ok: true,
      json: async () => [
        {
          id: "USR-100",
          username: "student@gla.ac.in",
          password: "student@password123",
          role: "student"
        }
      ]
    }),
    console: { error: (...args) => errors.push(args) },
    alert: (message) => alerts.push(message),
    Date,
    Math
  };

  vm.runInNewContext(authScript, context);
  return { context, sessionStorage, alerts, errors, elements };
}

test("checkAuth redirects users with no session to the login page", () => {
  const { context } = loadAuth();

  assert.equal(context.checkAuth(), null);
  assert.equal(context.window.location.href, "index.html");
});

test("checkAuth removes malformed session data and redirects to login", () => {
  const { context, sessionStorage, errors } = loadAuth({
    currentUser: "{invalid",
    userRole: "student"
  });

  assert.equal(context.checkAuth(), null);
  assert.equal(context.window.location.href, "index.html");
  assert.equal(sessionStorage.getItem("currentUser"), null);
  assert.equal(sessionStorage.getItem("userRole"), null);
  assert.equal(errors.length, 1);
});

test("checkAuth rejects users whose role is not allowed", () => {
  const user = { id: "USR-002", role: "teacher" };
  const { context, alerts } = loadAuth({
    currentUser: JSON.stringify(user)
  });

  assert.equal(context.checkAuth(["student"]), null);
  assert.equal(context.window.location.href, "courses.html");
  assert.equal(alerts.length, 1);
});

test("checkAuth returns a logged-in user with an allowed role", () => {
  const user = { id: "USR-100", role: "student" };
  const { context } = loadAuth({
    currentUser: JSON.stringify(user)
  });

  assert.deepEqual(JSON.parse(JSON.stringify(context.checkAuth(["student"]))), user);
});

test("submissionKey uses a guest key when session data is invalid", () => {
  const { context, sessionStorage } = loadAuth({
    currentUser: "not-json",
    userRole: "student"
  });

  assert.equal(context.submissionKey("ASN-001"), "guest:ASN-001");
  assert.equal(sessionStorage.getItem("currentUser"), null);
});

test("handleLogin stores valid credentials and opens the dashboard", async () => {
  const { context, sessionStorage } = loadAuth({}, {
    email: "student@gla.ac.in",
    password: "student@password123"
  });

  await context.handleLogin({ preventDefault() {} });

  assert.equal(JSON.parse(sessionStorage.getItem("currentUser")).role, "student");
  assert.equal(sessionStorage.getItem("userRole"), "student");
  assert.equal(context.window.location.href, "dashboard.html");
});

test("handleLogin displays an error for invalid credentials", async () => {
  const { context, elements, sessionStorage } = loadAuth({}, {
    email: "student@gla.ac.in",
    password: "wrong-password"
  });

  await context.handleLogin({ preventDefault() {} });

  assert.equal(elements["error-msg"].style.display, "block");
  assert.equal(elements["error-msg"].textContent, "Invalid academic credentials. Please re-check.");
  assert.equal(sessionStorage.getItem("currentUser"), null);
});
