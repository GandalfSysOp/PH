const BASE_URL =
  "https://script.google.com/macros/s/AKfycbz0hhGxhstl2xdyUBM5qtfN2VXP2oVKoSwZ8elcP6dkETdz-_yECOsNIOPNmwjur4A0/exec";

/* ================= API ================= */

async function apiGet(path) {
  const res = await fetch(`${BASE_URL}?path=${encodeURIComponent(path)}`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

/* ================= PROJECT FINDER ================= */

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

/* ================= HELPERS ================= */

const formatDate = d => (d ? new Date(d).toLocaleDateString() : "-");

function formatAssigned(a) {
  if (!Array.isArray(a) || !a.length) return "-";
  return `
    <div class="assigned-grid">
      ${a.map(id => `<div class="assigned-id">${id}</div>`).join("")}
    </div>
  `;
}

function formatCategory(p) {
  if (p.category_name && p.category_name.trim()) return p.category_name;
  if (p.category?.id) return `Category ID: ${p.category.id}`;
  return "-";
}

/* ================= RENDER ================= */

function renderTable(projects) {
  const table = document.getElementById("projectsTable");
  table.innerHTML = "";

  projects.forEach(p => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${p.id}</td>
      <td>${p.title}</td>
      <td class="col-desc">${p.description || "-"}</td>
      <td class="col-dates">${formatDate(p.start_date)}</td>
      <td class="col-dates">${formatDate(p.end_date)}</td>
      <td class="col-status">${p.status?.id ?? "-"}</td>
      <td class="col-assigned">${formatAssigned(p.assigned)}</td>
      <td class="col-category">${formatCategory(p)}</td>
    `;
    table.appendChild(row);
  });
}

/* ================= COLUMN TOGGLE ================= */

function toggleCol(name) {
  document.querySelectorAll(`.col-${name}`).forEach(el =>
    el.classList.toggle("col-hidden")
  );
}

/* ================= JSON ================= */

function setOutput(data) {
  const json = JSON.stringify(data, null, 2)
    .replace(/"(.*?)":/g, '<span class="json-key">"$1"</span>:')
    .replace(/: "(.*?)"/g, ': <span class="json-string">"$1"</span>')
    .replace(/: (\d+)/g, ': <span class="json-number">$1</span>')
    .replace(/: (true|false)/g, ': <span class="json-boolean">$1</span>')
    .replace(/: null/g, ': <span class="json-null">null</span>');

  document.getElementById("output").innerHTML = json;
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
