const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const SCOPES = 'https://www.googleapis.com/auth/drive.file';

let tokenClient = null;
let cachedToken = null;

function loadGIS() {
  return new Promise((resolve) => {
    if (window.google?.accounts?.oauth2) { resolve(); return; }
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.onload = resolve;
    document.head.appendChild(script);
  });
}

async function getToken() {
  await loadGIS();
  if (!tokenClient) {
    tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: SCOPES,
      callback: () => {},
    });
  }
  return new Promise((resolve, reject) => {
    tokenClient.callback = (response) => {
      if (response.error) reject(new Error(response.error_description || response.error));
      else { cachedToken = response.access_token; resolve(response.access_token); }
    };
    tokenClient.requestAccessToken({ prompt: cachedToken ? '' : 'consent' });
  });
}

export async function exportToGoogleDocs(title, htmlContent) {
  const token = await getToken();

  const metadata = {
    name: title || 'Untitled Document',
    mimeType: 'application/vnd.google-apps.document',
  };

  const boundary = 'words_gdocs_' + Math.random().toString(36).slice(2);
  const body = [
    `--${boundary}`,
    'Content-Type: application/json; charset=UTF-8',
    '',
    JSON.stringify(metadata),
    `--${boundary}`,
    'Content-Type: text/html; charset=UTF-8',
    '',
    htmlContent,
    `--${boundary}--`,
  ].join('\r\n');

  const response = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body,
    }
  );

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error?.message || 'Export failed');
  }

  const data = await response.json();
  return `https://docs.google.com/document/d/${data.id}/edit`;
}

