const BASE_URL =
  "https://script.google.com/macros/s/AKfycbz0hhGxhstl2xdyUBM5qtfN2VXP2oVKoSwZ8elcP6dkETdz-_yECOsNIOPNmwjur4A0/exec";

let PEOPLE = {};
let PROJECTS = {};
let CURRENT_TASKS = [];

async function apiGet(path, params = {}) {
  const qs = new URLSearchParams(params).toString();
  const url = `${BASE_URL}?path=${encodeURIComponent(
    path + (qs ? "?" + qs : "")
  )}`;
  const res = await fetch(url);
  return res.json();
}

function normalizeAllTodoResponse(res) {
  if (Array.isArray(res)) return { todos: res };
  if (res.todos) return res;
  if (res.data?.todos) return res.data;
  return { todos: [] };
}

async function loadPeople() {
  const res = await apiGet("people");
  const data = res.data || res;
  const sel = document.getElementById("assignedFilter");

  data.forEach(p => {
    PEOPLE[p.id] = `${p.first_name} ${p.last_name}`.trim();
    const opt = document.createElement("option");
    opt.value = p.id;
    opt.textContent = PEOPLE[p.id];
    sel.appendChild(opt);
  });
}

async function loadProjects() {
  const res = await apiGet("projects");
  const sel = document.getElementById("projectFilter");

  (function walk(o) {
    if (!o || typeof o !== "object") return;
    if (o.id && o.title) {
      PROJECTS[o.id] = o.title;
      const opt = document.createElement("option");
      opt.value = o.id;
      opt.textContent = o.title;
      sel.appendChild(opt);
    }
    Object.values(o).forEach(walk);
  })(res.data || res);
}

async function fetchTasks() {
  let start = Number(document.getElementById("startInput").value || 0);
  let limit = Number(document.getElementById("limitInput").value || 100);

  if (limit > 100) {
    limit = 100;
    document.getElementById("limitInput").value = 100;
  }

  const assigned = document.getElementById("assignedFilter").value;
  const project = document.getElementById("projectFilter").value;
  const completed = document.getElementById("completedFilter").value;
  const subtasks = document.getElementById("subtaskFilter").value;

  const params = { start, limit };

  if (assigned === "all_assigned") {
    params.assigned = "all_assigned";
  } else if (assigned) {
    params.assigned = assigned;
  }

  if (project) {
    params.projects = project;
  }

  // ✅ CORRECT completed logic
  if (completed === "true") {
    params.completed = true;
  } else if (completed === "false") {
    params.completed = false;
  }
  // if empty → do NOT send completed (All)

  if (subtasks === "false") {
    params.include_subtasks = false;
  }

  console.log("FINAL REQUEST PARAMS →", params);

  const res = await apiGet("alltodo", params);
  const { todos } = normalizeAllTodoResponse(res);

  CURRENT_TASKS = todos;
  renderTasks();
}

function renderTasks() {
  const tbody = document.getElementById("tasksTable");
  tbody.innerHTML = "";

  if (!CURRENT_TASKS.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="10" class="text-center text-muted">
          No tasks found
        </td>
      </tr>`;
    return;
  }

  CURRENT_TASKS.forEach((t, i) => {
    const assigned =
      t.assigned?.map(id => PEOPLE[id] || id).join(", ") || "—";
    const creator =
      PEOPLE[t.creator?.id] || t.creator?.id || "—";

    tbody.innerHTML += `
      <tr>
        <td><button class="btn btn-link btn-sm" onclick="toggleDetails(${i})">+</button></td>
        <td>${t.ticket}</td>
        <td>${t.title}</td>
        <td>${t.project?.name || "—"}</td>
        <td>${assigned}</td>
        <td>${creator}</td>
        <td>${t.start_date || "—"}</td>
        <td>${t.due_date || "—"}</td>
        <td>${t.completed ? "Completed" : "Open"}</td>
        <td>${t.by_me ? "Yes" : "No"}</td>
      </tr>
    `;
  });
}

function toggleDetails(i) {
  const row = document.getElementById(`details-${i}`);
  if (row) row.style.display =
    row.style.display === "none" ? "table-row" : "none";
}

(async function init() {
  await loadPeople();
  await loadProjects();
})();
