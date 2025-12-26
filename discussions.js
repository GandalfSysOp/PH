const BASE_URL =
  "https://script.google.com/macros/s/AKfycbz0hhGxhstl2xdyUBM5qtfN2VXP2oVKoSwZ8elcP6dkETdz-_yECOsNIOPNmwjur4A0/exec";

/* ================= GLOBAL STORES ================= */

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

  const select = document.getElementById("projectSelect");
  if (!select) return;

  select.innerHTML = `<option value="">Select project</option>`;

  data.forEach(p => {
    PROJECTS[p.id] = p.name;
    select.insertAdjacentHTML(
      "beforeend",
      `<option value="${p.id}">${p.name}</option>`
    );
  });
}

/* ================= HELPERS ================= */

function person(id) {
  return PEOPLE[id] || id || "-";
}

/* ================= TOGGLE (GLOBAL) ================= */

window.toggle = function (id) {
  const row = document.getElementById(id);
  const icon = document.getElementById(`icon-${id}`);
  if (!row) return;

  const open = row.style.display === "table-row";
  row.style.display = open ? "none" : "table-row";
  icon.textContent = open ? "+" : "−";
};

/* ================= FETCH TOPICS ================= */

async function fetchTopics() {
  const projectId = document.getElementById("projectSelect")?.value;
  if (!projectId) return alert("Select a project");

  await loadPeople();

  const res = await apiGet(`projects/${projectId}/topics`);

  let topics = [];
  if (Array.isArray(res)) topics = res;
  else if (Array.isArray(res.topics)) topics = res.topics;

  renderTopics(topics);

  document.getElementById("countText").textContent =
    `Total discussions: ${topics.length}`;
}

/* ================= RENDER ================= */

function renderTopics(topics) {
  const tbody = document.getElementById("topicsBody");
  if (!tbody) return;

  tbody.innerHTML = "";

  if (!topics.length) {
    tbody.innerHTML =
      `<tr><td colspan="7" class="text-center text-muted">No discussions found</td></tr>`;
    return;
  }

  topics.forEach(t => {
    const expandId = `expand-${t.id}`;

    tbody.insertAdjacentHTML("beforeend", `
      <tr>
        <td onclick="toggle('${expandId}')" style="cursor:pointer;width:30px">
          <span id="icon-${expandId}">+</span>
        </td>
        <td>${t.title}</td>
        <td>${t.private ? "Yes" : "No"}</td>
        <td>${t.pinned ? "Yes" : "No"}</td>
        <td>${t.comments?.count ?? 0}</td>
        <td>${t.created_at || "-"}</td>
        <td>${person(t.creator?.id)}</td>
      </tr>

      <tr id="${expandId}" style="display:none;background:#f8fafc">
        <td colspan="7">
          <div style="padding:12px;font-size:12px">

            <div><b>Description:</b><br>${t.description || "-"}</div><br>

            <div><b>Assigned:</b>
              ${(t.assigned || []).map(id => person(id)).join(", ") || "-"}
            </div>

            <div><b>By Me:</b> ${t.by_me ? "Yes" : "No"}</div>
            <div><b>Reply Email:</b> ${t.reply_email || "-"}</div>
            <div><b>Updated By:</b> ${person(t.updated_by)}</div>
            <div><b>Updated At:</b> ${t.updated_at || "-"}</div>
            <div><b>Archived:</b> ${t.archived ? "Yes" : "No"}</div>

          </div>
        </td>
      </tr>
    `);
  });
}

/* ================= INIT ================= */

document.addEventListener("DOMContentLoaded", async () => {
  try {
    await loadProjects();
  } catch (err) {
    console.error("Init failed:", err);
  }
});
