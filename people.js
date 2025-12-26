const BASE_URL =
  "https://script.google.com/macros/s/AKfycbz0hhGxhstl2xdyUBM5qtfN2VXP2oVKoSwZ8elcP6dkETdz-_yECOsNIOPNmwjur4A0/exec";

/* ================= API ================= */

async function apiGet(path) {
  const res = await fetch(`${BASE_URL}?path=${encodeURIComponent(path)}`);
  const text = await res.text();
  if (!res.ok) throw new Error(text);
  return JSON.parse(text);
}

/* ================= LOOKUP MAPS ================= */

let ROLE_MAP = {};
let GROUP_MAP = {};
let PROJECT_MAP = {};

/* ================= LOADERS ================= */

async function loadRoles() {
  if (Object.keys(ROLE_MAP).length) return;
  const roles = await apiGet("roles");
  roles.forEach(r => {
    ROLE_MAP[r.id] = r.name;
  });
}

async function loadGroups() {
  if (Object.keys(GROUP_MAP).length) return;
  const groups = await apiGet("groups");
  groups.forEach(g => {
    GROUP_MAP[g.id] = g.name;
  });
}

async function loadProjects() {
  if (Object.keys(PROJECT_MAP).length) return;
  const projects = await apiGet("projects");
  projects.forEach(p => {
    PROJECT_MAP[p.id] = p.title;
  });
}

/* ================= FORMATTERS ================= */

function roleName(id) {
  return ROLE_MAP[id] ? `${ROLE_MAP[id]} (${id})` : id || "—";
}

function groupNames(ids) {
  if (!Array.isArray(ids) || !ids.length) return "—";
  return ids
    .map(id => GROUP_MAP[id] ? `${GROUP_MAP[id]} (${id})` : id)
    .join("<br>");
}

function projectNames(ids) {
  if (!Array.isArray(ids) || !ids.length) return "—";
  return ids
    .map(id => PROJECT_MAP[id] ? `${PROJECT_MAP[id]} (${id})` : id)
    .join("<br>");
}

/* ================= ACTION ================= */

async function fetchPeople() {
  const container = document.getElementById("peopleContainer");
  container.innerHTML = "Loading…";

  await Promise.all([
    loadRoles(),
    loadGroups(),
    loadProjects()
  ]);

  const people = await apiGet("people");
  renderPeople(people);
}

/* ================= RENDER ================= */

function renderPeople(people) {
  const container = document.getElementById("peopleContainer");

  if (!Array.isArray(people) || !people.length) {
    container.innerHTML = "<p>No people found</p>";
    return;
  }

  let html = `
    <table>
      <thead>
        <tr>
          <th>ID</th>
          <th>Name</th>
          <th>Email</th>
          <th>Role</th>
          <th>Groups</th>
          <th>Projects</th>
          <th>Verified</th>
          <th>Last Active</th>
        </tr>
      </thead>
      <tbody>
  `;

  people.forEach(p => {
    html += `
      <tr>
        <td>${p.id}</td>
        <td>${p.first_name} ${p.last_name}</td>
        <td>${p.email}</td>
        <td>${roleName(p.role?.id)}</td>
        <td>${groupNames(p.groups)}</td>
        <td>${projectNames(p.projects)}</td>
        <td>${p.verified === "2" ? "Yes" : "No"}</td>
        <td>${p.last_active || "—"}</td>
      </tr>
    `;
  });

  html += `
      </tbody>
    </table>
  `;

  container.innerHTML = html;
}
