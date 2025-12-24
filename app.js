const BASE_URL =
  "https://script.google.com/macros/s/AKfycbz0hhGxhstl2xdyUBM5qtfN2VXP2oVKoSwZ8elcP6dkETdz-_yECOsNIOPNmwjur4A0/exec";

/* ================= API ================= */

async function apiGet(path) {
  const res = await fetch(`${BASE_URL}?path=${encodeURIComponent(path)}`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

/* ================= PROJECT FINDER (STABLE) ================= */

function findProjectsDeep(data) {
  const results = [];
  const seen = new Set();

  function walk(node) {
    if (!node || typeof node !== "object") return;

    if (
      typeof node.id === "number" &&
      typeof node.title === "string" &&
      !seen.has(node.id)
    ) {
      seen.add(node.id);
      results.push(node);
    }

    if (Array.isArray(node)) {
      node.forEach(walk);
    } else {
      Object.values(node).forEach(walk);
    }
  }

  walk(data);
  return results;
}

/* ================= FORMATTERS ================= */

const formatDate = d => (d ? new Date(d).toLocaleDateString() : "-");

function formatAssigned(a) {
  if (!Array.isArray(a) || !a.length) return "-";
  return `
    <div class="assigned-grid">
      ${a.map(id => `<div class="assigned-id">${id}</div>`).join("")}
    </div>
  `;
}

/* 🔑 FIXED CATEGORY NAME (robust fallback) */
function formatCategoryName(p) {
  if (p.category_name && p.category_name.trim()) return p.category_name;
  if (p.category?.name) return p.category.name;
  if (p.category?.id) return `Category ID: ${p.category.id}`;
  return "-";
}

/* ================= JSON OUTPUT ================= */

function setOutput(data) {
  const json = JSON.stringify(data, null, 2)
    .replace(/"(.*?)":/g, '<span class="json-key">"$1"</span>:')
    .replace(/: "(.*?)"/g, ': <span class="json-string">"$1"</span>')
    .replace(/: (\d+)/g, ': <span class="json-number">$1</span>')
    .replace(/: (true|false)/g, ': <span class="json-boolean">$1</span>')
    .replace(/: null/g, ': <span class="json-null">null</span>');

  document.getElementById("output").innerHTML = json;
}

/* ================= RENDER TABLE ================= */

function renderTable(projects) {
  const table = document.getElementById("projectsTable");
  table.innerHTML = "";

  projects.forEach(p => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${p.id}</td>
      <td>${p.title}</td>
      <td>${p.description || "-"}</td>
      <td>${formatDate(p.start_date)}</td>
      <td>${formatDate(p.end_date)}</td>
      <td>${p.status?.id ?? "-"}</td>
      <td>${formatAssigned(p.assigned)}</td>
      <td>${p.category?.id ?? "-"}</td>
      <td>${p.creator?.id ?? "-"}</td>
      <td>${p.manager?.id ?? "-"}</td>
      <td>${formatCategoryName(p)}</td>
      <td>${formatDate(p.created_at)}</td>
      <td>${formatDate(p.updated_at)}</td>
    `;
    row.onclick = () => setOutput(p);
    table.appendChild(row);
  });
}

/* ================= ACTIONS ================= */

async function fetchProjects() {
  const json = await apiGet("projects");
  const projects = findProjectsDeep(json);
  renderTable(projects);
  setOutput(json);
}

async function fetchProjectById() {
  const id = document.getElementById("projectIdInput").value.trim();
  if (!id) return alert("Enter Project ID");

  const json = await apiGet(`projects/${id}`);
  const projects = findProjectsDeep(json);
  renderTable(projects);
  setOutput(json);
}
