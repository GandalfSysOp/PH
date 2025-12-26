const GAS_URL =
  "https://script.google.com/macros/s/AKfycbw4ek_vcqZEHEOuwlEGXneYDtVKv8MyhyuJ6nZ3y8N0-3E8JwpDiqTV8hoNffrhzwtR/exec";

/* =======================
   GLOBAL LOOKUP CACHES
======================= */
const PEOPLE = {};
const LABELS = {};

/* =======================
   SAFE API CALL
======================= */
async function apiGet(path) {
  if (!path) throw new Error("Missing API path");

  const url = `${GAS_URL}?path=${encodeURIComponent(path)}`;
  const res = await fetch(url);
  const text = await res.text();

  try {
    return JSON.parse(text);
  } catch {
    console.error("Non-JSON response from GAS:", text);
    throw new Error(text);
  }
}

/* =======================
   INIT
======================= */
document.addEventListener("DOMContentLoaded", init);

async function init() {
  await loadPeople();
  await loadLabels();
  await loadProjects();
}

/* =======================
   LOAD PEOPLE
======================= */
async function loadPeople() {
  const data = await apiGet("v3/people");
  data.forEach(p => {
    PEOPLE[p.id] = `${p.first_name} ${p.last_name}`.trim();
  });
}

/* =======================
   LOAD LABELS
======================= */
async function loadLabels() {
  const data = await apiGet("v3/labels");
  data.forEach(l => {
    LABELS[l.id] = l.name;
  });
}

/* =======================
   LOAD PROJECTS
======================= */
async function loadProjects() {
  const select = document.getElementById("projectSelect");
  select.innerHTML = `<option value="">Select project</option>`;

  const projects = await apiGet("v3/projects");
  projects.forEach(p => {
    select.innerHTML += `<option value="${p.id}">${p.title}</option>`;
  });
}

/* =======================
   FETCH TASKS
======================= */
async function fetchTasks() {
  const projectId = document.getElementById("projectSelect").value;
  const tasklistId = document.getElementById("tasklistId").value.trim();

  if (!projectId || !tasklistId) {
    alert("Select project and enter tasklist ID");
    return;
  }

  const path = `v3/projects/${projectId}/todolists/${tasklistId}/tasks`;

  const response = await apiGet(path);

  const tasks = Array.isArray(response) ? response : [];

  document.getElementById("taskCount").innerText = tasks.length;

  renderTasks(tasks);
}

/* =======================
   RENDER TASKS
======================= */
function renderTasks(tasks) {
  const tbody = document.getElementById("taskTable");
  tbody.innerHTML = "";

  if (!tasks.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="10" class="text-center text-muted">
          No tasks found
        </td>
      </tr>`;
    return;
  }

  tasks.forEach((t, index) => {
    const creatorId = t.creator?.id || t.creator;
    const creatorName = PEOPLE[creatorId] || creatorId || "—";

    const assignedNames =
      (t.assigned || []).map(id => PEOPLE[id] || id).join(", ") || "—";

    const rowId = `expand-${index}`;

    /* MAIN ROW */
    tbody.innerHTML += `
      <tr>
        <td>
          <button class="btn btn-sm btn-outline-secondary"
            onclick="toggleRow('${rowId}')">+</button>
        </td>

        <td class="wrap"><strong>${t.title || "—"}</strong></td>
        <td class="wrap">${stripHtml(t.description)}</td>
        <td>${assignedNames}</td>
        <td>${t.start_date || "—"}</td>
        <td>${t.due_date || "—"}</td>
        <td>${t.percent_progress ?? 0}%</td>
        <td>${t.completed ? "Yes" : "No"}</td>
        <td>${creatorName}</td>
        <td>${t.created_at || "—"}</td>
      </tr>

      <!-- EXPANDED ROW -->
      <tr id="${rowId}" style="display:none;background:#fafafa;">
        <td colspan="10">
          <div class="p-2">

            <div><strong>Ticket ID:</strong> ${t.ticket || "—"}</div>
            <div><strong>Archived:</strong> ${t.task_archived ? "Yes" : "No"}</div>
            <div><strong>Parent ID:</strong> ${t.parent_id || "—"}</div>
            <div><strong>Subtasks:</strong> ${t.sub_tasks ?? 0}</div>

            <div><strong>Attachments:</strong> ${(t.attachments || []).length}</div>
            <div><strong>Comments:</strong> ${t.comments ?? 0}</div>

            <div><strong>Updated At:</strong> ${t.updated_at || "—"}</div>
            <div><strong>Updated By:</strong>
              ${PEOPLE[t.updated_by] || t.updated_by || "—"}
            </div>

            <div class="mt-2">
              <strong>Custom Fields:</strong><br/>
              ${renderCustomFields(t.custom_fields)}
            </div>

          </div>
        </td>
      </tr>
    `;
  });
}

/* =======================
   HELPERS
======================= */
function toggleRow(id) {
  const row = document.getElementById(id);
  row.style.display = row.style.display === "none" ? "table-row" : "none";
}

function stripHtml(html) {
  if (!html) return "—";
  return html.replace(/<[^>]*>/g, "").trim();
}

function renderCustomFields(fields) {
  if (!Array.isArray(fields) || !fields.length) return "—";

  return fields
    .map(f => `<span class="badge bg-light text-dark me-1">${f.title}</span>`)
    .join(" ");
}
