export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { uploadUrl, chunkBase64, offset, isLast } = req.body;
  if (!uploadUrl || chunkBase64 == null || offset == null) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const buffer = Buffer.from(chunkBase64, 'base64');
  const command = isLast ? 'upload, finalize' : 'upload';

  try {
    const response = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        'X-Goog-Upload-Offset': String(offset),
        'X-Goog-Upload-Command': command,
      },
      body: buffer,
    });

    if (!response.ok) {
      const text = await response.text();
      return res.status(response.status).json({ error: text });
    }

    if (isLast) {
      const data = await response.json();
      return res.json({ fileUri: data.file.uri });
    }

    return res.json({ ok: true });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
