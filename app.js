/* ===========================
   GLOBAL HELPERS
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

/**
 * Normalize ProofHub responses into array
 */
function extractArray(json, keys = []) {
  if (Array.isArray(json)) return json;
  if (Array.isArray(json.data)) return json.data;

  for (const k of keys) {
    if (Array.isArray(json.data?.[k])) {
      return json.data[k];
    }
  }
  return [];
}

/**
 * Base GET call via Netlify backend
 */
async function apiGet(path) {
  const res = await fetch(`/api/${path}`);
  if (!res.ok) {
    throw new Error(`API error ${res.status}`);
  }
  return res.json();
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
    alert(err.message);
  }
}

async function fetchProjectById() {
  try {
    const id = document.getElementById("projectIdInput").value;
    if (!id) return alert("Enter Project ID");

    const json = await apiGet(`projects/${id}`);
    setOutput(json.data || json);

  } catch (err) {
    alert(err.message);
  }
}

/* ===========================
   TASKS
=========================== */

async function fetchTasklists() {
  try {
    const projectId =
      document.getElementById("taskProjectId").value;

    if (!projectId) return alert("Enter Project ID");

    const json = await apiGet(
      `projects/${projectId}/todolists`
    );

    setOutput(json);

  } catch (err) {
    alert(err.message);
  }
}

async function fetchTasks() {
  try {
    const projectId =
      document.getElementById("taskProjectId").value;
    const tasklistId =
      document.getElementById("tasklistId").value;

    if (!projectId || !tasklistId) {
      return alert("Enter Project ID & Tasklist ID");
    }

    const json = await apiGet(
      `projects/${projectId}/todolists/${tasklistId}/tasks`
    );

    setOutput(json);

  } catch (err) {
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
    alert(err.message);
  }
}

async function fetchPersonById() {
  try {
    const id = document.getElementById("peopleId").value;
    if (!id) return alert("Enter Person ID");

    const json = await apiGet(`people/${id}`);
    setOutput(json);

  } catch (err) {
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
    alert(err.message);
  }
}
