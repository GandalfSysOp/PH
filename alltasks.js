const BASE_URL =
  "https://script.google.com/macros/s/AKfycbz0hhGxhstl2xdyUBM5qtfN2VXP2oVKoSwZ8elcP6dkETdz-_yECOsNIOPNmwjur4A0/exec";

/* ================= STATE ================= */

let start = 0;
let limit = 100;
let total = 0;

let ALL_TASKS = [];
let FILTERED_TASKS = [];

let PEOPLE = {};

/* ================= API ================= */

async function apiGet(path) {
  const url = `${BASE_URL}?path=${encodeURIComponent(
    `${path}?start=${start}&limit=${limit}`
  )}`;
  const res = await fetch(url);
  return res.json();
}

/* ================= NORMALIZE ================= */

function normalizeAllTodoResponse(res) {
  if (Array.isArray(res)) {
    return { todos: res, total_count: res.length };
  }
  if (res.todos) {
    return { todos: res.todos, total_count: res.total_count };
  }
  if (res.data?.todos) {
    return { todos: res.data.todos, total_count: res.data.total_count };
  }
  return { todos: [], total_count: 0 };
}

/* ================= LOAD PEOPLE ================= */

async function loadPeople() {
  const res = await apiGet("people");
  const people = res.data || res;

  const assignedSelect = document.getElementById("assignedFilter");

  people.forEach(p => {
    PEOPLE[p.id] = `${p.first_name} ${p.last_name}`.trim();

    const opt = document.createElement("option");
    opt.value = p.id;
    opt.textContent = PEOPLE[p.id];
    assignedSelect.appendChild(opt);
  });
}

/* ================= FETCH TASKS ================= */

async function fetchTasks() {
  await loadPeople();

  const res = await apiGet("alltodo");
  const { todos, total_count } = normalizeAllTodoResponse(res);

  ALL_TASKS = todos;
  FILTERED_TASKS = todos;
  total = total_count;

  populateProjectFilter();
  applyFilters();
  renderPageInfo();
}

/* ================= FILTERS ================= */

function populateProjectFilter() {
  const select = document.getElementById("projectFilter");
  select.innerHTML = `<option value="">All</option>`;

  const projects = [...new Set(ALL_TASKS.map(t => t.project?.id).filter(Boolean))];

  projects.forEach(pid => {
    const name = ALL_TASKS.find(t => t.project?.id === pid)?.project?.name;
    const opt = document.createElement("option");
    opt.value = pid;
    opt.textContent = name || pid;
    select.appendChild(opt);
  });
}

function applyFilters() {
  const project = document.getElementById("projectFilter").value;
  const assigned = document.getElementById("assignedFilter").value;
  const completed = document.getElementById("completedFilter").value;

  FILTERED_TASKS = ALL_TASKS.filter(t => {
    if (project && t.project?.id != project) return false;
    if (assigned && !t.assigned?.includes(Number(assigned))) return false;
    if (completed && String(t.completed) !== completed) return false;
    return true;
  });

  renderTasks(FILTERED_TASKS);
}

/* ================= RENDER ================= */

function renderTasks(tasks) {
  const tbody = document.getElementById("tasksTable");
  tbody.innerHTML = "";

  if (!tasks.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" class="text-center text-muted">No tasks found</td>
      </tr>`;
    return;
  }

  tasks.forEach(t => {
    const assignedNames =
      t.assigned?.map(id => PEOPLE[id] || id).join(", ") || "—";

    const creatorName = PEOPLE[t.creator?.id] || t.creator?.id || "—";

    tbody.innerHTML += `
      <tr>
        <td>${t.ticket}</td>
        <td>${t.title}</td>
        <td>${t.project?.name || "—"}</td>
        <td>${assignedNames}</td>
        <td>${creatorName}</td>
        <td>${t.completed ? "Completed" : "Open"}</td>
        <td>${t.due_date || "—"}</td>
      </tr>`;
  });
}

function renderPageInfo() {
  const from = total ? start + 1 : 0;
  const to = Math.min(start + limit, total);
  document.getElementById("pageInfo").textContent =
    `Showing ${from}–${to} of ${total}`;
}

/* ================= PAGINATION ================= */

function nextPage() {
  start += limit;
  fetchTasks();
}

function prevPage() {
  start = Math.max(0, start - limit);
  fetchTasks();
}
