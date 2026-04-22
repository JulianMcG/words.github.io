const PROJECT_ID = "words-1cf98";

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export default async function handler(req, res) {
  const { id } = req.query;

  if (!id) {
    res.redirect("/");
    return;
  }

  let title = "New Page";
  let description = "";

  try {
    const firestoreUrl = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/shared_documents/${encodeURIComponent(id)}`;
    const response = await fetch(firestoreUrl);

    if (response.ok) {
      const data = await response.json();
      title = data.fields?.title?.stringValue || "New Page";
      const rawContent = data.fields?.content?.stringValue || "";
      description = rawContent.replace(/<[^>]+>/g, "").slice(0, 150);
    }
  } catch (_) {
    // fall through with defaults
  }

  const proto = req.headers["x-forwarded-proto"] || "https";
  const host = req.headers["x-forwarded-host"] || req.headers.host;
  const appUrl = `${proto}://${host}/?share=${encodeURIComponent(id)}&title=${encodeURIComponent(title)}`;

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.send(`<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>${escapeHtml(title)}</title>
  <meta property="og:title" content="${escapeHtml(title)}" />
  <meta property="og:description" content="${escapeHtml(description)}" />
  <meta property="og:type" content="article" />
  <script>window.location.replace(${JSON.stringify(appUrl)});</script>
</head>
<body>
  <noscript><a href="${escapeHtml(appUrl)}">Open document</a></noscript>
</body>
</html>`);
}
