const BASE_URL =
  "https://script.google.com/macros/s/AKfycbz0hhGxhstl2xdyUBM5qtfN2VXP2oVKoSwZ8elcP6dkETdz-_yECOsNIOPNmwjur4A0/exec";

/* ================= CACHE ================= */

let PEOPLE = {};
let PROJECTS = {};

/* ================= API ================= */

async function apiGet(path) {
  const res = await fetch(`${BASE_URL}?path=${encodeURIComponent(path)}`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

/* ================= LOADERS ================= */

async function loadPeople() {
  if (Object.keys(PEOPLE).length) return;
  const data = await apiGet("people");
  data.forEach(p => {
    PEOPLE[p.id] = `${p.first_name} ${p.last_name}`.trim();
  });
}

async function loadProjects() {
  const data = await apiGet("projects");
  data.forEach(p => {
    PROJECTS[p.id] = p.title;
  });

  const sel = document.getElementById("projectSelect");
  sel.innerHTML = `<option value="">Select project</option>`;
  Object.entries(PROJECTS).forEach(([id, name]) => {
    sel.innerHTML += `<option value="${id}">${name}</option>`;
  });
}

/* ================= HELPERS ================= */

function person(id) {
  return PEOPLE[id] || id || "-";
}

function assignedList(ids) {
  if (!ids?.length) return "-";
  return ids.map(person).join(", ");
}

/* ================= RENDER ================= */

function renderTopics(topics) {
  const tbody = document.getElementById("topicsBody");
  tbody.innerHTML = "";

  if (!topics.length) {
    tbody.innerHTML = `<tr><td colspan="8" class="text-center text-muted">No discussions found</td></tr>`;
    return;
  }

  topics.forEach(t => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td class="expand" onclick="toggle(this)">+</td>
      <td>${t.title}</td>
      <td>${t.pinned ? "Yes" : "No"}</td>
      <td>${t.private ? "Yes" : "No"}</td>
      <td>${t.archived ? "Yes" : "No"}</td>
      <td>${t.comments?.count ?? 0}</td>
      <td>${t.created_at}</td>
      <td>${t.updated_at}</td>
    `;

    const details = document.createElement("tr");
    details.className = "expanded d-none";
    details.innerHTML = `
      <td colspan="8">
        <div class="row g-2">
          <div class="col-md-4">
            <div class="label">Assigned</div>
            <div class="value">${assignedList(t.assigned)}</div>
          </div>
          <div class="col-md-4">
            <div class="label">Creator</div>
            <div class="value">${person(t.creator?.id)}</div>
          </div>
          <div class="col-md-4">
            <div class="label">Updated By</div>
            <div class="value">${person(t.updated_by)}</div>
          </div>
          <div class="col-md-12 mt-2">
            <div class="label">Description</div>
            <div class="value">${t.description || "-"}</div>
          </div>
          <div class="col-md-12 mt-2">
            <div class="label">Reply Email</div>
            <div class="value">${t.reply_email}</div>
          </div>
        </div>
      </td>
    `;

    tbody.appendChild(row);
    tbody.appendChild(details);
  });
}

/* ================= ACTION ================= */

async function fetchTopics() {
  const projectId = document.getElementById("projectSelect").value;
  if (!projectId) return alert("Select a project");

  await loadPeople();

  const res = await apiGet(`projects/${projectId}/topics`);

  // 🔧 FIX: handle both array & object responses
  let topics = [];

  if (Array.isArray(res)) {
    topics = res;
  } else if (Array.isArray(res.topics)) {
    topics = res.topics;
  }

  renderTopics(topics);

  document.getElementById("countText").textContent =
    `Total discussions: ${topics.length}`;
}

/* ================= INIT ================= */

document.addEventListener("DOMContentLoaded", loadProjects);
