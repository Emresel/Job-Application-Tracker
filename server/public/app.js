const API_BASE = "/api/v1";

const storage = {
  get token() {
    return localStorage.getItem("jat_token");
  },
  set token(v) {
    if (!v) localStorage.removeItem("jat_token");
    else localStorage.setItem("jat_token", v);
  },
};

function $(sel) {
  return document.querySelector(sel);
}

function $all(sel) {
  return Array.from(document.querySelectorAll(sel));
}

function showToast(msg, ms = 2500) {
  const el = $("#toast");
  el.textContent = msg;
  el.style.display = "block";
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => {
    el.style.display = "none";
  }, ms);
}

async function api(path, opts = {}) {
  const headers = new Headers(opts.headers || {});
  headers.set("content-type", "application/json");
  if (storage.token) headers.set("authorization", `Bearer ${storage.token}`);
  const res = await fetch(`${API_BASE}${path}`, { ...opts, headers });
  const isJson = (res.headers.get("content-type") || "").includes("application/json");
  const data = isJson ? await res.json().catch(() => null) : await res.text();
  if (!res.ok) {
    const msg = (data && data.error) || `HTTP ${res.status}`;
    throw new Error(msg);
  }
  return data;
}

function setActiveNav(route) {
  $all(".navlink").forEach((a) => a.classList.toggle("active", a.dataset.route === route));
}

function showView(viewId) {
  $all(".view").forEach((v) => (v.style.display = "none"));
  $(`#view-${viewId}`).style.display = "block";
}

function statusPill(status) {
  const s = String(status || "");
  const cls =
    s === "Offer" || s === "Accepted"
      ? "good"
      : s === "Interview"
        ? "warn"
        : s === "Rejected" || s === "Rejection"
          ? "bad"
          : "";
  return `<span class="pill ${cls}">${escapeHtml(s)}</span>`;
}

function escapeHtml(str) {
  return String(str ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

async function refreshMe() {
  const badge = $("#meBadge");
  const logoutBtn = $("#logoutBtn");
  if (!storage.token) {
    badge.textContent = "Signed out (guest)";
    badge.classList.add("muted");
    logoutBtn.style.display = "none";
    return null;
  }
  try {
    const me = await api("/users/me", { method: "GET" });
    badge.textContent = `${me.name} • ${me.role}${me.userTypes ? ` • ${me.userTypes}` : ""}`;
    badge.classList.remove("muted");
    logoutBtn.style.display = "inline-block";
    return me;
  } catch (e) {
    storage.token = null;
    badge.textContent = "Invalid token (guest)";
    badge.classList.add("muted");
    logoutBtn.style.display = "none";
    return null;
  }
}

async function loadDashboard() {
  const d = await api("/dashboard", { method: "GET" });
  $("#dashTotal").textContent = d.totalApplications ?? "-";
  $("#dashInterviews").textContent = d.interviewsScheduled ?? "-";
  $("#dashOffers").textContent = d.offersReceived ?? "-";
  $("#dashRejections").textContent = d.rejections ?? "-";
}

function renderTimeseries(rows) {
  const el = $("#timeseries");
  if (!Array.isArray(rows) || rows.length === 0) {
    el.innerHTML = `<div class="muted small">No data.</div>`;
    return;
  }
  const max = Math.max(...rows.map((r) => Number(r.count) || 0), 1);
  el.innerHTML = rows
    .map((r) => {
      const pct = Math.round(((Number(r.count) || 0) / max) * 100);
      return `
        <div class="barrow">
          <div class="muted small">${escapeHtml(r.date)}</div>
          <div class="bar"><div style="width:${pct}%"></div></div>
          <div class="small">${escapeHtml(r.count)}</div>
        </div>
      `;
    })
    .join("");
}

async function loadTimeseries() {
  const from = $("#tsFrom").value;
  const to = $("#tsTo").value;
  const rows = await api(`/dashboard/timeseries?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`, {
    method: "GET",
  });
  renderTimeseries(rows);
}

function renderTable(containerSel, columns, rows, extraHeader = "") {
  const container = $(containerSel);
  const thead = `
    <thead>
      <tr>
        ${columns.map((c) => `<th>${escapeHtml(c.label)}</th>`).join("")}
        ${extraHeader}
      </tr>
    </thead>`;
  const tbody = `
    <tbody>
      ${
        rows.length
          ? rows
              .map(
                (r) => `<tr>
          ${columns.map((c) => `<td>${c.render ? c.render(r) : escapeHtml(r[c.key])}</td>`).join("")}
          ${cActionCell(r) || ""}
        </tr>`,
              )
              .join("")
          : `<tr><td colspan="${columns.length + (extraHeader ? 1 : 0)}" class="muted">No data.</td></tr>`
      }
    </tbody>`;

  function cActionCell(r) {
    if (!container.dataset.actionCol) return "";
    if (container.dataset.actionCol === "applications") {
      return `<td>
        <button class="btn ghost" data-action="history" data-id="${r.appID}">History</button>
        <button class="btn ghost" data-action="delete" data-id="${r.appID}">Delete</button>
      </td>`;
    }
    if (container.dataset.actionCol === "reminders") {
      return `<td>
        <button class="btn ghost" data-action="delete-reminder" data-id="${r.reminderID}">Delete</button>
      </td>`;
    }
    return "";
  }

  container.innerHTML = `<table>${thead}${tbody}</table>`;
}

async function loadCompanies() {
  const rows = await api("/companies", { method: "GET" });
  renderTable(
    "#companiesTable",
    [
      { key: "companyID", label: "ID" },
      { key: "name", label: "Name" },
      { key: "industry", label: "Industry" },
      { key: "location", label: "Location" },
    ],
    rows,
  );
}

async function loadCategories() {
  const rows = await api("/categories", { method: "GET" });
  renderTable(
    "#categoriesTable",
    [
      { key: "categoryID", label: "ID" },
      { key: "name", label: "Name" },
      { key: "description", label: "Description" },
      { key: "managerID", label: "ManagerID" },
      { key: "managerName", label: "Manager" },
    ],
    rows,
  );
}

async function loadApplications() {
  const status = $("#appStatusFilter").value;
  const q = $("#appSearch").value.trim();
  const qs = new URLSearchParams();
  if (status) qs.set("status", status);
  if (q) qs.set("q", q);
  const data = await api(`/applications?${qs.toString()}`, { method: "GET" });

  // Demo returns array; authed returns {items:...}
  const rows = Array.isArray(data) ? data : data.items || [];

  const container = $("#applicationsTable");
  container.dataset.actionCol = "applications";
  renderTable(
    "#applicationsTable",
    [
      { key: "appID", label: "ID" },
      { key: "company", label: "Company" },
      { key: "position", label: "Position" },
      { key: "status", label: "Status", render: (r) => statusPill(r.status) },
      { key: "appliedDate", label: "Applied" },
      { key: "priority", label: "Priority" },
    ],
    rows,
    `<th>Actions</th>`,
  );
}

async function loadReminders() {
  const rows = await api("/reminders", { method: "GET" });
  const container = $("#remindersTable");
  container.dataset.actionCol = "reminders";
  renderTable(
    "#remindersTable",
    [
      { key: "reminderID", label: "ID" },
      { key: "appID", label: "AppID" },
      { key: "reminderDate", label: "Date" },
      { key: "message", label: "Message" },
    ],
    rows,
    `<th>Actions</th>`,
  );
}

async function showHistory(appID) {
  const rows = await api(`/applications/${appID}/history`, { method: "GET" });
  const lines = rows
    .slice(0, 10)
    .map((h) => `- ${h.updateDate}: ${h.statusChange}${h.feedback ? ` (${h.feedback})` : ""}`)
    .join("\n");
  alert(`History (top 10)\n\n${lines || "(empty)"}`);
}

function routeFromHash() {
  const h = location.hash || "#/dashboard";
  const route = h.replace("#/", "").split("?")[0] || "dashboard";
  return route;
}

async function navigate() {
  const route = routeFromHash();
  setActiveNav(route);
  showView(route);

  // Opportunistic refreshes
  if (route === "dashboard") {
    await loadDashboard().catch((e) => showToast(e.message));
    if (storage.token) await loadTimeseries().catch(() => {});
  }
  if (route === "companies") await loadCompanies().catch((e) => showToast(e.message));
  if (route === "categories") await loadCategories().catch((e) => showToast(e.message));
  if (route === "applications") await loadApplications().catch((e) => showToast(e.message));
  if (route === "reminders") await loadReminders().catch((e) => showToast(e.message));
}

// Events
window.addEventListener("hashchange", navigate);

$("#logoutBtn").addEventListener("click", async () => {
  storage.token = null;
  await refreshMe();
  showToast("Signed out.");
  location.hash = "#/dashboard";
});

$("#refreshDashboardBtn").addEventListener("click", () => loadDashboard().catch((e) => showToast(e.message)));
$("#loadTimeseriesBtn").addEventListener("click", () => loadTimeseries().catch((e) => showToast(e.message)));

$("#loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const fd = new FormData(e.target);
  try {
    const out = await api("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email: fd.get("email"), password: fd.get("password") }),
    });
    storage.token = out.token;
    await refreshMe();
    showToast("Signed in.");
    location.hash = "#/dashboard";
  } catch (err) {
    showToast(err.message);
  }
});

$("#registerForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const fd = new FormData(e.target);
  try {
    await api("/auth/register", {
      method: "POST",
      body: JSON.stringify({ name: fd.get("name"), email: fd.get("email"), password: fd.get("password") }),
    });
    showToast("Account created. You can sign in now.");
    location.hash = "#/login";
  } catch (err) {
    showToast(err.message);
  }
});

$("#refreshCompaniesBtn").addEventListener("click", () => loadCompanies().catch((e) => showToast(e.message)));
$("#companyForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const fd = new FormData(e.target);
  try {
    await api("/companies", {
      method: "POST",
      body: JSON.stringify({
        name: fd.get("name"),
        industry: fd.get("industry"),
        location: fd.get("location"),
      }),
    });
    e.target.reset();
    showToast("Company created.");
    await loadCompanies();
  } catch (err) {
    showToast(err.message);
  }
});

$("#refreshCategoriesBtn").addEventListener("click", () => loadCategories().catch((e) => showToast(e.message)));
$("#categoryForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const fd = new FormData(e.target);
  try {
    await api("/categories", {
      method: "POST",
      body: JSON.stringify({
        name: fd.get("name"),
        description: fd.get("description"),
        managerID: Number(fd.get("managerID")),
      }),
    });
    e.target.reset();
    showToast("Category created.");
    await loadCategories();
  } catch (err) {
    showToast(err.message);
  }
});

$("#refreshApplicationsBtn").addEventListener("click", () => loadApplications().catch((e) => showToast(e.message)));
$("#applyAppFiltersBtn").addEventListener("click", () => loadApplications().catch((e) => showToast(e.message)));

$("#applicationForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const fd = new FormData(e.target);
  const payload = {
    companyID: fd.get("companyID") ? Number(fd.get("companyID")) : undefined,
    company: fd.get("company"),
    position: fd.get("position"),
    status: fd.get("status"),
    appliedDate: fd.get("appliedDate"),
    priority: fd.get("priority") ? Number(fd.get("priority")) : 0,
    deadline: fd.get("deadline") || undefined,
    categoryID: fd.get("categoryID") ? Number(fd.get("categoryID")) : undefined,
    notes: fd.get("notes") || undefined,
  };
  try {
    await api("/applications", { method: "POST", body: JSON.stringify(payload) });
    showToast("Application created.");
    await loadApplications();
    e.target.reset();
  } catch (err) {
    showToast(err.message);
  }
});

$("#applicationsTable").addEventListener("click", async (e) => {
  const btn = e.target.closest("button[data-action]");
  if (!btn) return;
  const action = btn.dataset.action;
  const id = Number(btn.dataset.id);
  try {
    if (action === "history") {
      await showHistory(id);
    }
    if (action === "delete") {
      if (!confirm(`Delete application #${id}?`)) return;
      await api(`/applications/${id}`, { method: "DELETE" });
      showToast("Deleted.");
      await loadApplications();
    }
  } catch (err) {
    showToast(err.message);
  }
});

$("#refreshRemindersBtn").addEventListener("click", () => loadReminders().catch((e) => showToast(e.message)));
$("#reminderForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const fd = new FormData(e.target);
  const payload = {
    appID: fd.get("appID") ? Number(fd.get("appID")) : undefined,
    reminderDate: fd.get("reminderDate"),
    message: fd.get("message"),
  };
  try {
    await api("/reminders", { method: "POST", body: JSON.stringify(payload) });
    showToast("Reminder created.");
    await loadReminders();
    e.target.reset();
  } catch (err) {
    showToast(err.message);
  }
});

$("#remindersTable").addEventListener("click", async (e) => {
  const btn = e.target.closest("button[data-action]");
  if (!btn) return;
  if (btn.dataset.action !== "delete-reminder") return;
  const id = Number(btn.dataset.id);
  try {
    if (!confirm(`Delete reminder #${id}?`)) return;
    await api(`/reminders/${id}`, { method: "DELETE" });
    showToast("Deleted.");
    await loadReminders();
  } catch (err) {
    showToast(err.message);
  }
});

// Boot
(async () => {
  await refreshMe();
  if (!location.hash) location.hash = "#/dashboard";
  await navigate();
})();

