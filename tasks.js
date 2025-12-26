const GAS_URL =
  "https://script.google.com/macros/s/AKfycbw4ek_vcqZEHEOuwlEGXneYDtVKv8MyhyuJ6nZ3y8N0-3E8JwpDiqTV8hoNffrhzwtR/exec";

let PEOPLE = {};
let PROJECTS = {};

/* ---------------- helpers ---------------- */

function stripHtml(html) {
  if (!html) return "—";
  return html.replace(/<[^>]*>/g, "").trim();
}

function normalizeArray(res) {
  if (Array.isArray(res)) return res;
  if (Array.isArray(res.todos)) return res.todos;
  if (Array.isArray(res.data)) return res.data;
  return [];
}

async function apiGet(path) {
  const res = await fetch(
    `${GAS_URL}?path=${encodeURIComponent(path)}`
  );
  return res.json();
}

/* ---------------- preload people ---------------- */

async function loadPeople() {
  const res = await apiGet("v3/people");
  const people = Array.isArray(res) ? res : res.data || [];
  people.forEach(p => {
    PEOPLE[p.id] = `${p.first_name} ${p.last_name}`.trim();
  });
}

/* ---------------- preload projects ---------------- */

async function loadProjects() {
  const res = await apiGet("v3/projects");
  const projects = Array.isArray(res) ? res : res.projects || [];

  const select = document.getElementById("projectSelect");
  select.innerHTML = `<option value="">Select a project</option>`;

  projects.forEach(p => {
    PROJECTS[p.id] = p.title;

    const opt = document.createElement("option");
    opt.value = p.id;
    opt.textContent = `${p.title} (${p.id})`;
    select.appendChild(opt);
  });
}

/* ---------------- fetch tasks ---------------- */

async function fetchTasks() {
  const projectId = document.getElementById("projectSelect").value;
  const tasklistId = document.getElementById("tasklistId").value.trim();

  if (!projectId || !tasklistId) {
    alert("Please select a project and enter a tasklist ID");
    return;
  }

  // ✅ CORRECT ENDPOINT (tasklist-scoped)
  const res = await apiGet(
    `v3/projects/${projectId}/todolists/${tasklistId}/tasks`
  );

  // normalize response
  const tasks = Array.isArray(res.todos) ? res.todos : [];

  renderTasks(tasks);
}

/* ---------------- render ---------------- */

function renderTasks(tasks) {
  const tbody = document.getElementById("taskTable");
  tbody.innerHTML = "";

  if (!Array.isArray(tasks) || !tasks.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="19" class="text-center muted">No tasks found</td>
      </tr>`;
    return;
  }

  tasks.forEach(t => {
    const estimate =
      t.estimated_hours || t.estimated_mins
        ? `${t.estimated_hours || 0}h ${t.estimated_mins || 0}m`
        : "—";

    const logged =
      t.logged_hours || t.logged_mins
        ? `${t.logged_hours || 0}h ${t.logged_mins || 0}m`
        : "—";

    const assigned =
      Array.isArray(t.assigned) && t.assigned.length
        ? t.assigned.join(", ")
        : "—";

    tbody.innerHTML += `
      <tr>
        <td><strong>${t.ticket}</strong> – ${t.title}</td>
        <td class="desc">${stripHtml(t.description)}</td>
        <td>${t.start_date || "—"}</td>
        <td>${t.due_date || "—"}</td>
        <td>${t.completed ? "Yes" : "No"}</td>
        <td>${t.percent_progress ?? 0}</td>
        <td>${t.sub_tasks ?? 0}</td>
        <td>${estimate}</td>
        <td>${logged}</td>

        <td>${t.project?.name || "—"}</td>
        <td>${t.list?.name || "—"}</td>
        <td>${t.workflow?.name || "—"}</td>
        <td>${t.stage?.name || "—"}</td>

        <td>${PEOPLE[t.creator?.id] || t.creator?.id || "—"}</td>
        <td>${assigned}</td>
        <td>${t.time_tracking ? "Yes" : "No"}</td>
        <td>${t.by_me ? "Yes" : "No"}</td>
        <td>${t.created_at}</td>
        <td>${t.updated_at}</td>
      </tr>
    `;
  });
}

/* ---------------- init ---------------- */

(async function init() {
  await loadPeople();
  await loadProjects();
})();
