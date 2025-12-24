const BASE_URL =
  "https://script.google.com/macros/s/AKfycbz0hhGxhstl2xdyUBM5qtfN2VXP2oVKoSwZ8elcP6dkETdz-_yECOsNIOPNmwjur4A0/exec";

/* API */
async function apiGet(path) {
  const res = await fetch(`${BASE_URL}?path=${encodeURIComponent(path)}`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

/* Project finder */
function findProjectsDeep(data) {
  const results = [];
  const seen = new Set();

  function walk(node) {
    if (!node || typeof node !== "object") return;
    if (node.id && node.title && !seen.has(node.id)) {
      seen.add(node.id);
      results.push(node);
    }
    Object.values(node).forEach(walk);
  }

  walk(data);
  return results;
}

/* Helpers */
const formatDate = d => d ? new Date(d).toLocaleDateString() : "-";

function formatAssigned(a) {
  if (!Array.isArray(a) || !a.length) return "-";
  return `<div class="assigned-grid">${a.map(id => `<div class="assigned-id">${id}</div>`).join("")}</div>`;
}

function formatCategory(p) {
  if (p.category_name && p.category_name.trim()) return p.category_name;
  if (p.category?.id) return `ID: ${p.category.id}`;
  return "-";
}

/* Render */
function renderTable(projects) {
  document.getElementById("totalProjects").textContent = projects.length;

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
      <td>${formatCategory(p)}</td>
    `;
    row.onclick = () => {
      document.getElementById("output").textContent =
        JSON.stringify(p, null, 2);
    };
    table.appendChild(row);
  });
}

/* Actions */
async function fetchProjects() {
  const json = await apiGet("projects");
  const projects = findProjectsDeep(json);
  renderTable(projects);
  document.getElementById("output").textContent =
    JSON.stringify(json, null, 2);
}

async function fetchProjectById() {
  const id = document.getElementById("projectIdInput").value.trim();
  if (!id) return alert("Enter Project ID");

  const json = await apiGet(`projects/${id}`);
  const projects = findProjectsDeep(json);
  renderTable(projects);
  document.getElementById("output").textContent =
    JSON.stringify(json, null, 2);
}
