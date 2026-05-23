const PROJECT_ID = "words-1cf98";
const API_KEY = "AIzaSyAB-oPKIuSNcHVEufy0JlUkPlfxVb2UAgM";

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
  let emoji = "";

  try {
    const firestoreUrl = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/shared_documents/${encodeURIComponent(id)}?key=${API_KEY}`;
    const response = await fetch(firestoreUrl);

    if (response.ok) {
      const data = await response.json();
      title = data.fields?.title?.stringValue || "New Page";
      const rawEmoji = data.fields?.emoji?.stringValue;
      const hasCustomEmoji = data.fields?.hasCustomEmoji?.booleanValue;
      if (rawEmoji && !hasCustomEmoji) emoji = rawEmoji;
      const rawContent = data.fields?.content?.stringValue || "";
      description = rawContent.replace(/<[^>]+>/g, "").slice(0, 150);
    }
  } catch (_) {
    // fall through with defaults
  }

  const proto = req.headers["x-forwarded-proto"] || "https";
  const host = req.headers["x-forwarded-host"] || req.headers.host;
  const baseUrl = `${proto}://${host}`;
  const appUrl = `${baseUrl}/documents?share=${encodeURIComponent(id)}`;
  const ogImage = `${baseUrl}/api/og?e=${encodeURIComponent(emoji)}&t=${encodeURIComponent(title)}`;
  const shareUrl = `${baseUrl}/share/${encodeURIComponent(id)}`;

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.send(`<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>${escapeHtml(title)}</title>
  <meta property="og:site_name" content="Words" />
  <meta property="og:title" content="${escapeHtml(title)}" />
  <meta property="og:description" content="${escapeHtml(description)}" />
  <meta property="og:type" content="article" />
  <meta property="og:url" content="${escapeHtml(shareUrl)}" />
  <meta property="og:image" content="${escapeHtml(ogImage)}" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${escapeHtml(title)}" />
  <meta name="twitter:description" content="${escapeHtml(description)}" />
  <meta name="twitter:image" content="${escapeHtml(ogImage)}" />
  <script>window.location.replace(${JSON.stringify(appUrl)});</script>
</head>
<body>
  <noscript><a href="${escapeHtml(appUrl)}">Open document</a></noscript>
</body>
</html>`);
}
