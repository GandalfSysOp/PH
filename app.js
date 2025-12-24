console.log("app.js loaded");

/* ===========================
   UI HELPERS
=========================== */

function showSection(id) {
  document.querySelectorAll(".section")
    .forEach(s => s.classList.remove("active"));

  document.getElementById(id).classList.add("active");

  document.querySelectorAll(".sidebar button")
    .forEach(b => b.classList.remove("active"));

  event.target.classList.add("active");
}

function setOutput(data) {
  document.getElementById("output").textContent =
    JSON.stringify(data, null, 2);
}

function copyOutput() {
  navigator.clipboard.writeText(
    document.getElementById("output").textContent
  );
}

/* ===========================
   API HELPERS
=========================== */

/**
 * Base GET call via Netlify backend
 * Example: apiGet("projects")
 *          apiGet("projects/123/todolists")
 */
async function apiGet(path) {
  const res = await fetch(`/api/${path}`);

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API ${res.status}: ${text}`);
  }

  return res.json();
}

/**
 * Normalize ProofHub list responses
 */
function extractArray(json, keys = []) {
  if (Array.isArray(json)) return json;
  if (Array.isArray(json.data)) return json.data;

  for (const key of keys) {
    if (Array.isArray(json.data?.[key])) {
      return json.data[key];
    }
  }

  return [];
}

/* ===========================
   PROJECTS
=========================== */

async function fetchProjects() {
  try {
    const json = await apiGet("projects");
    const projects = extractArray(json, ["projects"]);

    const table = document.getElementById("projectsTable");
    table.innerHTML = "";

    if (!projects.length) {
      table.innerHTML =
        `<tr><td colspan="4">No projects found</td></tr>`;
    }

    projects.forEach(p => {
      const row = document.createElement("tr");

      row.innerHTML = `
        <td>${p.id}</td>
        <td>${p.title || "-"}</td>
        <td>${p.status?.title || "-"}</td>
        <td>${p.manager?.name || "-"}</td>
      `;

      row.onclick = () => {
        document.getElementById("projectIdInput").value = p.id;
        setOutput(p);
      };

      table.appendChild(row);
    });

    setOutput(json);

  } catch (err) {
    console.error(err);
    alert(err.message);
  }
}

async function fetchProjectById() {
  try {
    const id = document.getElementById("projectIdInput").value.trim();
    if (!id) return alert("Enter Project ID");

    const json = await apiGet(`projects/${id}`);
    setOutput(json.data || json);

  } catch (err) {
    console.error(err);
    alert(err.message);
  }
}

/* ===========================
   TASKS
=========================== */

async function fetchTasklists() {
  try {
    const projectId =
      document.getElementById("taskProjectId").value.trim();

    if (!projectId) return alert("Enter Project ID");

    const json = await apiGet(
      `projects/${projectId}/todolists`
    );

    setOutput(json);

  } catch (err) {
    console.error(err);
    alert(err.message);
  }
}

async function fetchTasks() {
  try {
    const projectId =
      document.getElementById("taskProjectId").value.trim();
    const tasklistId =
      document.getElementById("tasklistId").value.trim();

    if (!projectId || !tasklistId) {
      return alert("Enter Project ID and Tasklist ID");
    }

    const json = await apiGet(
      `projects/${projectId}/todolists/${tasklistId}/tasks`
    );

    setOutput(json);

  } catch (err) {
    console.error(err);
    alert(err.message);
  }
}

/* ===========================
   PEOPLE
=========================== */

async function fetchPeople() {
  try {
    const json = await apiGet("people");
    setOutput(json);
  } catch (err) {
    console.error(err);
    alert(err.message);
  }
}

async function fetchPersonById() {
  try {
    const id = document.getElementById("peopleId").value.trim();
    if (!id) return alert("Enter Person ID");

    const json = await apiGet(`people/${id}`);
    setOutput(json);

  } catch (err) {
    console.error(err);
    alert(err.message);
  }
}

/* ===========================
   MANAGE
=========================== */

async function callApi(path) {
  try {
    const json = await apiGet(path);
    setOutput(json);
  } catch (err) {
    console.error(err);
    alert(err.message);
  }
}

/* ===========================
   EXPLORER
=========================== */

async function callCustomPath() {
  try {
    const path =
      document.getElementById("customPath").value.trim();

    if (!path) return alert("Enter API path");

    const json = await apiGet(path);
    setOutput(json);

  } catch (err) {
    console.error(err);
    alert(err.message);
  }
}
