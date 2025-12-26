/* ================= CONFIG ================= */

const BASE_URL =
  "https://script.google.com/macros/s/AKfycbz0hhGxhstl2xdyUBM5qtfN2VXP2oVKoSwZ8elcP6dkETdz-_yECOsNIOPNmwjur4A0/exec";

/* ================= CACHES ================= */

let PEOPLE_MAP = {};

/* ================= API ================= */

async function apiGet(path) {
  const res = await fetch(`${BASE_URL}?path=${encodeURIComponent(path)}`);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text);
  }
  return res.json();
}

/* ================= LOADERS ================= */

async function loadPeople() {
  if (Object.keys(PEOPLE_MAP).length) return;

  const people = await apiGet("people");
  people.forEach(p => {
    PEOPLE_MAP[p.id] = `${p.first_name} ${p.last_name}`.trim();
  });
}

async function loadProjects() {
  const data = await apiGet("projects");

  const select = document.getElementById("projectSelect");
  select.innerHTML = `<option value="">Select project</option>`;

  data.forEach(project => {
    const opt = document.createElement("option");
    opt.value = project.id;
    opt.textContent = project.title; // ✅ IMPORTANT FIX
    select.appendChild(opt);
  });
}

/* ================= HELPERS ================= */

function personName(id) {
  return PEOPLE_MAP[id] || id || "-";
}

function assignedList(ids) {
  if (!Array.isArray(ids) || !ids.length) return "-";
  return ids.map(id => personName(id)).join(", ");
}

function toggle(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.style.display = el.style.display === "none" ? "block" : "none";
}

/* ================= RENDER ================= */

function renderTopics(topics) {
  const container = document.getElementById("topicsContainer");
  container.innerHTML = "";

  if (!topics.length) {
    container.innerHTML = `<div class="alert alert-warning">No discussions found</div>`;
    return;
  }

  topics.forEach((t, idx) => {
    const expandId = `expand-${idx}`;

    const card = document.createElement("div");
    card.className = "card p-3 mb-3";

    card.innerHTML = `
      <div class="d-flex justify-content-between align-items-center">
        <div>
          <strong>${t.title}</strong>
          ${t.pinned ? `<span class="badge bg-warning ms-2">Pinned</span>` : ""}
        </div>
        <button class="btn btn-sm btn-outline-primary" onclick="toggle('${expandId}')">
          Details
        </button>
      </div>

      <div class="text-muted small mt-1">
        Comments: ${t.comments?.count ?? 0} |
        Private: ${t.private ? "Yes" : "No"} |
        Archived: ${t.archived ? "Yes" : "No"}
      </div>

      <div id="${expandId}" style="display:none;margin-top:12px;">
        <div class="field-row"><div class="label">ID</div><div class="value">${t.id}</div></div>
        <div class="field-row"><div class="label">Description</div><div class="value">${t.description || "-"}</div></div>
        <div class="field-row"><div class="label">Assigned</div><div class="value">${assignedList(t.assigned)}</div></div>
        <div class="field-row"><div class="label">By Me</div><div class="value">${t.by_me}</div></div>
        <div class="field-row"><div class="label">Reply Email</div><div class="value">${t.reply_email || "-"}</div></div>
        <div class="field-row"><div class="label">Created At</div><div class="value">${t.created_at}</div></div>
        <div class="field-row"><div class="label">Updated At</div><div class="value">${t.updated_at}</div></div>
        <div class="field-row"><div class="label">Updated By</div><div class="value">${personName(t.updated_by)}</div></div>
      </div>
    `;

    container.appendChild(card);
  });
}

/* ================= ACTION ================= */

async function fetchTopics() {
  const projectId = document.getElementById("projectSelect").value;
  if (!projectId) return alert("Select a project");

  await loadPeople();

  const res = await apiGet(`projects/${projectId}/topics`);
  const topics = res.topics || [];

  renderTopics(topics);
}

/* ================= INIT ================= */

document.addEventListener("DOMContentLoaded", async () => {
  await loadProjects();
});
