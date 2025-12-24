console.log("app.js loaded");

/* ========= UI ========= */

function showSection(id) {
  document.querySelectorAll(".section").forEach(s => s.classList.remove("active"));
  document.getElementById(id).classList.add("active");

  document.querySelectorAll(".nav-btn").forEach(b => b.classList.remove("active"));
  event.target.classList.add("active");
}

function copyOutput() {
  navigator.clipboard.writeText(
    document.getElementById("output").innerText
  );
}

/* ========= API ========= */

async function apiGet(path) {
  const res = await fetch(`/.netlify/functions/proofhub/${path}`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

/* ========= FORMATTERS ========= */

function formatDate(date) {
  return date ? new Date(date).toLocaleDateString() : "-";
}

function formatStatus(status) {
  return status?.id ?? "-";
}

function formatAssigned(assigned) {
  if (!Array.isArray(assigned) || !assigned.length) return "-";
  return assigned.map(id => `<div class="assigned-id">${id}</div>`).join("");
}

function formatCategory(category) {
  return category?.id ?? "-";
}

function formatUser(user) {
  return user?.id ?? "-";
}

/* ========= JSON HIGHLIGHT ========= */

function setOutput(data) {
  const json = JSON.stringify(data, null, 2)
    .replace(/"(.*?)":/g, '<span class="json-key">"$1"</span>:')
    .replace(/: "(.*?)"/g, ': <span class="json-string">"$1"</span>')
    .replace(/: (\d+)/g, ': <span class="json-number">$1</span>')
    .replace(/: (true|false)/g, ': <span class="json-boolean">$1</span>')
    .replace(/: null/g, ': <span class="json-null">null</span>');

  document.getElementById("output").innerHTML = json;
}

/* ========= PROJECTS ========= */

async function fetchProjects() {
  const json = await apiGet("projects");
  const projects = json.data?.projects || json.projects || [];

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
      <td>${formatStatus(p.status)}</td>
      <td>${formatAssigned(p.assigned)}</td>
      <td>${formatCategory(p.category)}</td>
      <td>${formatUser(p.creator)}</td>
      <td>${formatUser(p.manager)}</td>
      <td>${p.category_name || "-"}</td>
      <td>${formatDate(p.created_at)}</td>
      <td>${formatDate(p.updated_at)}</td>
    `;
    row.onclick = () => setOutput(p);
    table.appendChild(row);
  });

  setOutput(json);
}

async function fetchProjectById() {
  const id = document.getElementById("projectIdInput").value;
  if (!id) return alert("Enter Project ID");
  const json = await apiGet(`projects/${id}`);
  setOutput(json.data || json);
}
