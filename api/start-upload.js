export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: { message: 'Missing GEMINI_API_KEY' } });

  const { mimeType, size } = req.body;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/upload/v1beta/files?uploadType=resumable&key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Upload-Protocol': 'resumable',
          'X-Goog-Upload-Command': 'start',
          'X-Goog-Upload-Header-Content-Length': String(size),
          'X-Goog-Upload-Header-Content-Type': mimeType,
        },
        body: JSON.stringify({ file: { displayName: 'buddy-recording' } }),
      }
    );

    if (!response.ok) {
      const err = await response.text();
      return res.status(response.status).json({ error: err });
    }

    const uploadUrl = response.headers.get('x-goog-upload-url');
    if (!uploadUrl) return res.status(500).json({ error: 'No upload URL returned' });

    res.json({ uploadUrl });
  } catch (error) {
    res.status(500).json({ error: { message: error.message } });
  }
}
