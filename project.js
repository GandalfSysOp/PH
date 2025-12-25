const BASE_URL =
  "https://script.google.com/macros/s/AKfycbz0hhGxhstl2xdyUBM5qtfN2VXP2oVKoSwZ8elcP6dkETdz-_yECOsNIOPNmwjur4A0/exec";

/* ================= PEOPLE CACHE ================= */

let PEOPLE_MAP = {};

/* ================= API ================= */

async function apiGet(path) {
  const res = await fetch(`${BASE_URL}?path=${encodeURIComponent(path)}`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

/* ================= LOAD PEOPLE ================= */

async function loadPeopleMap() {
  if (Object.keys(PEOPLE_MAP).length) return;

  const people = await apiGet("people");
  people.forEach(p => {
    PEOPLE_MAP[p.id] = `${p.first_name} ${p.last_name}`.trim();
  });
}

function personName(id) {
  return PEOPLE_MAP[id]
    ? `${PEOPLE_MAP[id]} (${id})`
    : id;
}

/* ================= HELPERS ================= */

function formatValue(value) {
  if (value === null || value === undefined) return "-";

  // Arrays (assigned, tabs, projects)
  if (Array.isArray(value)) {
    return value.length
      ? value.map(v => personName(v)).join(", ")
      : "-";
  }

  // Objects (creator, manager, status, category)
  if (typeof value === "object") {
    if ("id" in value) {
      return personName(value.id);
    }

    return Object.entries(value)
      .map(([k, v]) => `${k}: ${formatValue(v)}`)
      .join(", ");
  }

  return value.toString();
}

/* ================= JSON FORMAT ================= */

function formatJsonPretty(obj) {
  const json = JSON.stringify(obj, null, 2);
  return json
    .replace(/"(.*?)":/g, '<span class="json-key">"$1"</span>:')
    .replace(/: "(.*?)"/g, ': <span class="json-string">"$1"</span>')
    .replace(/: (\d+)/g, ': <span class="json-number">$1</span>')
    .replace(/: (true|false)/g, ': <span class="json-boolean">$1</span>')
    .replace(/: null/g, ': <span class="json-null">null</span>');
}

/* ================= RENDER ================= */

function renderProject(project) {
  const container = document.getElementById("projectDetails");
  container.innerHTML = "";

  Object.keys(project).forEach(key => {
    const row = document.createElement("div");
    row.className = "field-row";
    row.innerHTML = `
      <div class="label">${key.replace(/_/g, " ")}</div>
      <div class="value">${formatValue(project[key])}</div>
    `;
    container.appendChild(row);
  });

  document.getElementById("output").innerHTML =
    `<pre style="line-height:1.6">${formatJsonPretty(project)}</pre>`;
}

/* ================= ACTION ================= */

async function getProject() {
  const id = document.getElementById("projectIdInput").value.trim();
  if (!id) return alert("Enter a Project ID");

  await loadPeopleMap(); // 🔑 key line

  const json = await apiGet(`projects/${id}`);
  renderProject(json);
}
