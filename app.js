const BASE_URL = "https://script.google.com/macros/s/AKfycbz0hhGxhstl2xdyUBM5qtfN2VXP2oVKoSwZ8elcP6dkETdz-_yECOsNIOPNmwjur4A0/exec";

async function apiGet(path) {
    const url = `${BASE_URL}?path=${encodeURIComponent(path)}`;

    const res = await fetch(url);
    if (!res.ok) {
        throw new Error(`API ${res.status}: ${await res.text()}`);
    }
    return res.json();
}

async function fetchProjects() {
    try {
        const data = await apiGet("projects");

        // Show raw JSON
        document.getElementById("rawJson").innerHTML = syntaxHighlight(JSON.stringify(data, null, 2));

        // Build table
        const table = document.getElementById("projectsTable");
        table.innerHTML = "";

        if (!Array.isArray(data) || data.length == 0) {
            table.innerHTML = `<tr><td colspan="13">No projects found.</td></tr>`;
            return;
        }

        data.forEach(project => {
            const assignedDisplay = (project.assigned || []).map(id => `<div>${id}</div>`).join("");
            const status = project.status?.id || "";
            const categoryId = project.category?.id || "";

            table.innerHTML += `
            <tr>
                <td>${project.id}</td>
                <td>${project.title || ""}</td>
                <td>${project.description || ""}</td>
                <td>${project.start_date || ""}</td>
                <td>${project.end_date || ""}</td>
                <td>${status}</td>
                <td>${assignedDisplay}</td>
                <td>${categoryId}</td>
                <td>${project.category_name || ""}</td>
                <td>${project.creator?.id || ""}</td>
                <td>${project.manager?.id || ""}</td>
                <td>${project.created_at || ""}</td>
                <td>${project.updated_at || ""}</td>
            </tr>
            `;
        });

    } catch (err) {
        alert("Error: " + err.message);
        console.error(err);
    }
}

// Pretty color-coded JSON
function syntaxHighlight(json) {
    return json
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(
            /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,
            match => {
                let cls = "number";
                if (/^"/.test(match)) {
                    if (/:$/.test(match)) {
                        cls = "key";
                    } else {
                        cls = "string";
                    }
                } else if (/true|false/.test(match)) {
                    cls = "boolean";
                } else if (/null/.test(match)) {
                    cls = "null";
                }
                return `<span class="${cls}">${match}</span>`;
            }
        );
}

// JSON Color Classes
const style = document.createElement("style");
style.innerHTML = `
    .string { color: #ce8453; }
    .number { color: #44aaff; }
    .boolean { color: #ff5c33; }
    .null { color: #999; }
    .key { color: #7ec699; }
`;
document.head.appendChild(style);
