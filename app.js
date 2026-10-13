// Loan Application System
// Academic demonstration using browser localStorage.

const $ = (id) => document.getElementById(id);

const defaultUsers = [
  {
    name: "Demo Customer",
    email: "customer@example.com",
    password: "demo123",
    role: "customer"
  },
  {
    name: "Administrator",
    email: "admin@example.com",
    password: "admin123",
    role: "admin"
  }
];

function loadData(key, fallback) {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : fallback;
  } catch {
    return fallback;
  }
}

let users = loadData("loanUsers", defaultUsers);
let applications = loadData("loanApplications", []);
let currentUser = null;

function saveData() {
  localStorage.setItem("loanUsers", JSON.stringify(users));
  localStorage.setItem("loanApplications", JSON.stringify(applications));
}

function showMessage(text) {
  $("message").textContent = text;
}

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char]);
}

function money(value) {
  return Number(value).toLocaleString("en-IN");
}

function statusLabel(status) {
  return `<p>Status: <span class="status">${escapeHTML(status)}</span></p>`;
}

// MODULE 1: LOGIN

$("loginForm").addEventListener("submit", function (event) {
  event.preventDefault();

  const email = $("loginEmail").value.trim().toLowerCase();
  const password = $("loginPassword").value;

  const user = users.find(
    (item) =>
      item.email.toLowerCase() === email &&
      item.password === password
  );

  if (!user) {
    showMessage("Invalid email or password.");
    return;
  }

  currentUser = user;
  $("authSection").classList.add("hidden");
  $("appSection").classList.remove("hidden");
  $("welcome").textContent = `Welcome, ${currentUser.name}`;

  $("adminBtn").classList.toggle(
    "hidden",
    currentUser.role !== "admin"
  );

  showMessage("Login successful.");
  showDashboard();
});

// MODULE 1: REGISTRATION

$("registerForm").addEventListener("submit", function (event) {
  event.preventDefault();

  const name = $("regName").value.trim();
  const email = $("regEmail").value.trim().toLowerCase();
  const password = $("regPassword").value;

  if (password.length < 6) {
    showMessage("Password must contain at least 6 characters.");
    return;
  }

  if (users.some((user) => user.email.toLowerCase() === email)) {
    showMessage("This email is already registered.");
    return;
  }

  users.push({
    name,
    email,
    password,
    role: "customer"
  });

  saveData();
  $("registerForm").reset();
  showMessage("Registration successful. Please log in.");
});

// MODULE 2: CUSTOMER DASHBOARD

function showDashboard() {
  $("dashboard").classList.remove("hidden");
  $("loanSection").classList.add("hidden");
  $("adminSection").classList.add("hidden");

  const myApplications = applications.filter(
    (app) => app.email === currentUser.email
  );

  $("appCount").textContent = myApplications.length;

  if (myApplications.length === 0) {
    $("customerApplications").innerHTML =
      "<p>You have not submitted any loan applications yet.</p>";
    return;
  }

  $("customerApplications").innerHTML = myApplications.map((app) => `
    <div class="application">
      <h3>${escapeHTML(app.type)}</h3>
      <p>Application ID: ${escapeHTML(app.id)}</p>
      <p>Amount: ₹${money(app.amount)}</p>
      <p>Repayment: ${app.period} months</p>
      <p>Date: ${escapeHTML(app.date)}</p>
      ${statusLabel(app.status)}
    </div>
  `).join("");
}

// MODULE 3: LOAN APPLICATION

$("loanForm").addEventListener("submit", function (event) {
  event.preventDefault();

  const amount = Number($("loanAmount").value);
  const income = Number($("monthlyIncome").value);

  if (amount < 1000 || income < 0) {
    showMessage("Please enter valid loan and income amounts.");
    return;
  }

  const application = {
    id: "LN-" + Date.now().toString().slice(-8),
    name: currentUser.name,
    email: currentUser.email,
    type: $("loanType").value,
    amount,
    income,
    period: Number($("loanPeriod").value),
    date: new Date().toLocaleDateString("en-IN"),
    status: "Submitted"
  };

  applications.push(application);
  saveData();

  $("loanForm").reset();
  showMessage("Loan application submitted successfully.");
  showDashboard();
});

function showLoanForm() {
  $("dashboard").classList.add("hidden");
  $("adminSection").classList.add("hidden");
  $("loanSection").classList.remove("hidden");
  $("loanName").value = currentUser.name;
}

// MODULE 4: ADMIN DASHBOARD

function showAdminDashboard() {
  if (!currentUser || currentUser.role !== "admin") {
    showMessage("Access denied. Admin login required.");
    return;
  }

  $("dashboard").classList.add("hidden");
  $("loanSection").classList.add("hidden");
  $("adminSection").classList.remove("hidden");

  if (applications.length === 0) {
    $("adminApplications").innerHTML =
      "<p>No loan applications submitted yet.</p>";
    return;
  }

  $("adminApplications").innerHTML = applications.map((app) => `
    <div class="application">
      <h3>${escapeHTML(app.name)}</h3>
      <p>Application ID: ${escapeHTML(app.id)}</p>
      <p>Email: ${escapeHTML(app.email)}</p>
      <p>Loan type: ${escapeHTML(app.type)}</p>
      <p>Loan amount: ₹${money(app.amount)}</p>
      <p>Monthly income: ₹${money(app.income)}</p>
      <p>Repayment: ${app.period} months</p>
      ${statusLabel(app.status)}
      ${
        app.status === "Submitted"
          ? `<button class="approve"
               onclick="updateStatus('${app.id}', 'Approved')">
               Approve
             </button>
             <button class="reject"
               onclick="updateStatus('${app.id}', 'Rejected')">
               Reject
             </button>`
          : ""
      }
    </div>
  `).join("");
}

function updateStatus(id, newStatus) {
  if (!currentUser || currentUser.role !== "admin") {
    showMessage("Access denied.");
    return;
  }

  const application = applications.find((app) => app.id === id);

  if (!application || application.status !== "Submitted") {
    showMessage("Application not found or already reviewed.");
    return;
  }

  application.status = newStatus;
  saveData();

  showMessage(`Application ${id}: ${newStatus}.`);
  showAdminDashboard();
}

// NAVIGATION BETWEEN THE FOUR MODULES

$("dashboardBtn").addEventListener("click", showDashboard);
$("applyBtn").addEventListener("click", showLoanForm);
$("adminBtn").addEventListener("click", showAdminDashboard);

// LOGOUT

$("logoutBtn").addEventListener("click", function () {
  currentUser = null;
  $("appSection").classList.add("hidden");
  $("authSection").classList.remove("hidden");
  $("loginForm").reset();
  $("registerForm").reset();
  showMessage("You have logged out.");
});