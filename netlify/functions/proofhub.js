export async function handler(event) {
  try {
    /*
      event.path examples:
      /.netlify/functions/proofhub
      /.netlify/functions/proofhub/projects
      /.netlify/functions/proofhub/projects/6607/todolists
    */

    let path = event.path
      .replace("/.netlify/functions/proofhub", "")
      .replace(/^\/+/, ""); // remove leading slash

    // If using redirect /api/*
    if (path.startsWith("api/")) {
      path = path.replace("api/", "");
    }

    if (!path) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: "Missing API path",
          hint: "Expected /api/projects or similar"
        })
      };
    }

    const url = `https://projects.proofhub.com/api/v3/${path}`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "x-api-key": process.env.PROOFHUB_API_KEY,
        "x-comp-url": "projects.proofhub.com",
        "Ver": "lite",
        "Content-Type": "application/json"
      }
    });

    const body = await response.text();

    return {
      statusCode: response.status,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      },
      body
    };

  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
}
