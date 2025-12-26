const GAS_URL =
  "https://script.google.com/macros/s/AKfycbw4ek_vcqZEHEOuwlEGXneYDtVKv8MyhyuJ6nZ3y8N0-3E8JwpDiqTV8hoNffrhzwtR/exec";

// simple cache (optional)
const PEOPLE = {};

/* ---------- API ---------- */
async function apiGet(path) {
  const url = `${GAS_URL}?path=${encodeURIComponent(path)}`;
  const res = await fetch(url);
  return res.json();
}

/* ---------- MAIN ---------- */
async function fetchTasks() {
  const projectId = document.getElementById("projectId").value.trim();
  const tasklistId = document.getElementById("tasklistId").value.trim();

  if (!projectId || !tasklistId) {
    alert("Please enter both Project ID and Tasklist ID");
    return;
  }

  const path = `projects/${projectId}/todolists/${tasklistId}/tasks`;
  const response = await apiGet(path);

  console.log("RAW RESPONSE", response);

  // 🔥 IMPORTANT FIX: response IS AN ARRAY
  const tasks = Array.isArray(response) ? response : [];

  renderTasks(tasks);
}

/* ---------- RENDER ---------- */
function renderTasks(tasks) {
  const tbody = document.getElementById("taskTable");
  tbody.innerHTML = "";

  if (!tasks.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="19" class="text-center muted">
          No tasks found
        </td>
      </tr>`;
    return;
  }

  tasks.forEach(t => {
    tbody.innerHTML += `
      <tr>
        <td><strong>${t.ticket || "—"}</strong></td>
        <td>${t.title || "—"}</td>
        <td>${stripHtml(t.description)}</td>

        <td>${t.project_name || t.project?.name || "—"}</td>
        <td>${t.list_name || t.list?.name || "—"}</td>
        <td>${t.workflow_name || t.workflow?.name || "—"}</td>
        <td>${t.stage_name || t.stage?.name || "—"}</td>

        <td>${t.creator?.id || t.creator || "—"}</td>
        <td>${formatArray(t.assigned)}</td>

        <td>${t.start_date || "—"}</td>
        <td>${t.due_date || "—"}</td>

        <td>${t.completed ? "Yes" : "No"}</td>
        <td>${t.percent_progress ?? 0}%</td>

        <td>${t.estimated_hours ?? "—"}</td>
        <td>${t.logged_hours ?? "—"}</td>

        <td>${t.by_me ? "Yes" : "No"}</td>
        <td>${t.timesheet_id ?? "—"}</td>

        <td>${t.created_at || "—"}</td>
        <td>${t.updated_at || "—"}</td>
      </tr>
    `;
  });
}

/* ---------- HELPERS ---------- */
function stripHtml(html) {
  if (!html) return "—";
  return html.replace(/<[^>]*>/g, "").trim();
}

function formatArray(arr) {
  if (!Array.isArray(arr) || !arr.length) return "—";
  return arr.join(", ");
}
