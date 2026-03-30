export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Read the hidden key dynamically from Vercel's secure environment
  // Notice there is NO 'VITE_' prefix, meaning this is successfully hidden from the browser!
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    return res.status(500).json({ 
      error: { message: "Server misconfiguration: Missing GEMINI_API_KEY environment variable in Vercel." } 
    });
  }

  try {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${apiKey}`;

    // Pass the payload transparently from the user's browser straight to Google
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(req.body) // The body is constructed securely in your front-end gemini.js!
    });

    const data = await response.json();
    
    // Pass Google's exact response back to the browser
    return res.status(response.status).json(data);
  } catch (error) {
    return res.status(500).json({ error: { message: error.message } });
  }
}
