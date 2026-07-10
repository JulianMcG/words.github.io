export const generateDocTitle = async (contentText) => {
  const endpoint = `/api/buddy`;
  const snippet = contentText.slice(0, 600);

  const payload = {
    contents: [
      {
        role: "user",
        parts: [{
          text: `Give this document a short title (2-5 words). Content: "${snippet}". Reply with ONLY the title, nothing else.`
        }]
      }
    ],
    generationConfig: {
      maxOutputTokens: 12,
    }
  };

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    if (!response.ok) return null;
    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    return text || null;
  } catch (err) {
    console.error("Doc title generation failed:", err);
    return null;
  }
};

export const generateFolderName = async (docTitles) => {
  const endpoint = `/api/buddy`;
  const titlesText = docTitles.filter(Boolean).join(', ') || 'misc';

  const payload = {
    contents: [
      {
        role: "user",
        parts: [{
          text: `Name this folder in 1-2 words based on these document titles: ${titlesText}. Reply with ONLY the name, nothing else.`
        }]
      }
    ],
    generationConfig: {
      maxOutputTokens: 8,
    }
  };

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    if (!response.ok) return null;
    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    return text || null;
  } catch (err) {
    console.error("Folder name generation failed:", err);
    return null;
  }
};

export const generateAIResponse = async (userPrompt, context, referenceDocs = []) => {
  const endpoint = `/api/buddy`;

  const referenceSection = referenceDocs && referenceDocs.length > 0
    ? `\n\n### ATTACHED REFERENCE DOCUMENTS ###\nThe user has explicitly @-mentioned the following documents. Use their content when relevant:\n${referenceDocs.map(d => `[DOCUMENT TITLE: ${d.title}]\n${d.content}`).join('\n\n')}\n### END REFERENCE DOCUMENTS ###`
    : "";

  const systemPromptText = `You are Buddy, a fast and precise AI writing assistant built into the Words editor. Your job is to help users write, edit, and think about their documents.

## YOUR FOUR OPERATIONS

You must always respond with exactly one of these four operations. Choose based on what the user is asking and what context they have provided:

**replace_selection**: The user has highlighted specific text and wants it changed. Use this for targeted word, sentence, or paragraph edits. Receive the selection and modify only that.

**replace_document**: The user wants the whole document rewritten, restructured, or heavily transformed. Use this when the request clearly applies to the entire document (e.g. "rewrite this", "make this more formal", "clean this up", "fix my grammar") AND full document context has been provided.

**insert_at_cursor**: The user has a collapsed cursor (no selection) and wants new content generated at that position. Use this for "write a paragraph about X", "add an introduction", "continue this", "make a checklist", "create a to-do list", etc.

**chat**: The user is asking a question, requesting advice, or making a conversational request that does not require directly modifying the document. Use this for "what should I change?", "how do I improve this?", "explain X". Also use chat when the user's intent is ambiguous.

## OPERATION DECISION RULES

- Selection provided + edit command → replace_selection
- Full document provided + global transformation command → replace_document
- Collapsed cursor + generation command → insert_at_cursor
- Question / advice / ambiguous intent → chat
- When in doubt between an edit and chat, prefer chat

## HTML FORMATTING RULES

When generating content (any operation except chat), output only valid semantic HTML. NEVER use Markdown — no **bold**, no # headers, no - bullet hyphens, no backticks, and absolutely NO [ ] or [x] checkbox syntax (those are markdown and render as literal text).

**Allowed block elements**: <p>, <h1>, <h2>, <h3>, <blockquote>, <ul>, <ol> (always with <li> children)
**Allowed inline elements**: <strong>, <em>, <u>, <s>, <a href="..." target="_blank" rel="noopener noreferrer">
**Forbidden**: <div>, <span>, <font>, inline styles, any CSS class except class="checklist" on <ul>, IDs, [ ] checkbox syntax, any element not listed above

**List vs checklist — use judgment**:
- Ideas, notes, bullet points, brainstorming → plain <ul><li>…</li></ul>
- Tasks, to-dos, action items, things to check off, checklists → <ul class="checklist"><li>…</li></ul>

The class="checklist" renders each <li> as a real interactive checkbox in the editor. Use it when the content is something the user will want to tick off. Never use [ ] — that is markdown and will show as literal text.

**Critical rule**: Every text node MUST be inside a block element. Never output bare text outside of a <p> or heading tag. Each distinct paragraph or thought = its own <p> block.

**Style matching**: Match the formatting level of the existing document. If the document uses plain <p> tags, do not invent headings or bullet points unless explicitly asked. If the document has rich structure, match and preserve it.

**Precision rule**: Only change what the user asked for. Do not restructure, reformat, or add content that was not requested.

**Poetry and verse rule**: When writing poems, song lyrics, or any verse, NEVER use <ul>, <ol>, or <li> tags. Each line of verse goes in its own <p> tag. Each stanza is a separate group of <p> tags.

## RESPONSE FORMAT

Always output a valid JSON object. Never wrap it in markdown code fences.

For replace_selection, replace_document, insert_at_cursor: populate "generated_html" with the complete HTML output.
For chat: populate "conversational_reply" with plain text (newlines OK, no HTML tags). Never end a conversational_reply with instructions about commands, hotkeys, or prompts for the user to type something.${referenceSection}`;

  const userMessageText = `${context}\n\nUser request: ${userPrompt}`;

  const payload = {
    systemInstruction: {
      parts: [{ text: systemPromptText }]
    },
    contents: [
      {
        role: "user",
        parts: [{ text: userMessageText }]
      }
    ],
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: {
        type: "OBJECT",
        required: ["operation"],
        properties: {
          operation: {
            type: "STRING",
            enum: ["replace_selection", "replace_document", "insert_at_cursor", "chat"],
            description: "The operation Buddy is performing."
          },
          generated_html: {
            type: "STRING",
            description: "The HTML content for replace_selection, replace_document, or insert_at_cursor operations."
          },
          conversational_reply: {
            type: "STRING",
            description: "A conversational text response for the chat operation, or an accompanying note for content operations."
          }
        }
      }
    }
  };

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      // Read the body once as text, then try to parse it — reading .json() and
      // .text() in sequence throws "body stream already read"
      let errorData = "Unknown HTTP Error";
      try {
        const raw = await response.text();
        try { errorData = JSON.parse(raw); } catch { errorData = raw; }
      } catch { /* keep default */ }
      let errMsg = `HTTP ${response.status}: Unknown Error`;
      if (typeof errorData === 'object' && errorData.error?.message) {
        errMsg = `API Error: ${errorData.error.message}`;
        if (errMsg.includes("Quota exceeded") && errMsg.includes("FreeTier")) {
          errMsg = "You have exhausted your Google API free-tier quota for this model today!";
        }
      } else if (typeof errorData === 'string') {
        errMsg = errorData;
      }
      throw new Error(errMsg);
    }

    const data = await response.json();
    const candidate = data?.candidates?.[0];
    const resultText = candidate?.content?.parts?.[0]?.text;

    if (resultText === undefined || resultText === null) {
      throw new Error(`API generated no text. Body: ${JSON.stringify(data)}`);
    }

    try {
      return JSON.parse(resultText);
    } catch (e) {
      console.error("JSON Parsing failed against Buddy response", e);
      return { operation: "chat", conversational_reply: "I encountered an error constructing my response. Please try again." };
    }
  } catch (err) {
    console.error("Words AI API Error:", err);
    throw err;
  }
};

function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result.split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

// Upload a large blob to the Gemini File API via our server proxy to avoid CORS.
// Chunks are 1 MB each (multiple of 256 KB as required by Google's resumable upload API).
async function uploadBlobToFileApi(blob) {
  const mimeType = blob.type || 'audio/webm';

  const startRes = await fetch('/api/start-upload', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mimeType, size: blob.size }),
  });
  if (!startRes.ok) throw new Error('Failed to start upload session');
  const { uploadUrl } = await startRes.json();

  const CHUNK_SIZE = 1 * 1024 * 1024; // 1 MB — multiple of 256 KB
  let offset = 0;

  while (offset < blob.size) {
    const end = Math.min(offset + CHUNK_SIZE, blob.size);
    const chunk = blob.slice(offset, end);
    const isLast = end >= blob.size;

    const chunkBase64 = await blobToBase64(chunk);

    const chunkRes = await fetch('/api/upload-chunk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uploadUrl, chunkBase64, offset, isLast }),
    });
    if (!chunkRes.ok) throw new Error('Audio chunk upload failed');

    if (isLast) {
      const data = await chunkRes.json();
      return data.fileUri;
    }

    offset = end;
  }
}

// Basic fallback transcription using gemini-2.0-flash-lite — separate from Buddy,
// used when the main formatting pipeline fails.
export const transcribeAudioBasic = async (audioBlob) => {
  const mimeType = audioBlob.type || 'audio/webm';

  const FILE_API_THRESHOLD = 3 * 1024 * 1024;
  let audioPart;

  if (audioBlob.size > FILE_API_THRESHOLD) {
    const fileUri = await uploadBlobToFileApi(audioBlob);
    audioPart = { fileData: { mimeType, fileUri } };
  } else {
    const base64 = await blobToBase64(audioBlob);
    audioPart = { inlineData: { mimeType, data: base64 } };
  }

  const payload = {
    contents: [{
      role: "user",
      parts: [
        audioPart,
        { text: "Transcribe this audio word for word. Remove only filler words (um, uh, like, you know). Output plain text only — no formatting, no headings, no bullet points." }
      ]
    }],
    generationConfig: { maxOutputTokens: 8192 }
  };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 270000);
  let response;
  try {
    response = await fetch('/api/basic-transcribe', {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeoutId);
  }

  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
  if (!text) throw new Error("Empty transcription");

  return text
    .split(/\n+/)
    .filter(p => p.trim())
    .map(p => `<p>${p.trim()}</p>`)
    .join('');
};

export const formatBrainDumpFromAudio = async (audioBlob) => {
  const MAX_ATTEMPTS = 3;
  let lastErr;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      return await _formatBrainDumpAttempt(audioBlob);
    } catch (err) {
      lastErr = err;
      if (attempt < MAX_ATTEMPTS) {
        await new Promise(r => setTimeout(r, 2000 * attempt));
      }
    }
  }
  throw lastErr;
};

async function _formatBrainDumpAttempt(audioBlob) {
  const endpoint = `/api/transcribe`;
  const mimeType = audioBlob.type || 'audio/webm';

  // Files > 3 MB go via the File API (direct browser → Google upload).
  // At 16 kbps that's roughly 25+ minutes. Smaller files stay inline.
  const FILE_API_THRESHOLD = 3 * 1024 * 1024;
  let audioPart;

  if (audioBlob.size > FILE_API_THRESHOLD) {
    const fileUri = await uploadBlobToFileApi(audioBlob);
    audioPart = { fileData: { mimeType, fileUri } };
  } else {
    const base64 = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result.split(',')[1]);
      reader.onerror = reject;
      reader.readAsDataURL(audioBlob);
    });
    audioPart = { inlineData: { mimeType, data: base64 } };
  }

  const systemPromptText = `You are Buddy, a formatting assistant inside the Words editor. The user recorded a voice note — a meeting, brain dump, template request, or general notes.

ABSOLUTE RULE — CHECK THIS BEFORE ANYTHING ELSE:
If ANY of the following are true, output ONLY the word NO_AUDIO and nothing else — no HTML, no explanation, no guesses:
- The audio is silent or contains only background noise
- The audio is very short (a few seconds or less)
- The audio contains only non-verbal sounds (screams, laughs, coughs, etc.) with no spoken words
- The audio is too muffled or unclear to reliably transcribe
- There is not enough spoken content to form a meaningful document
DO NOT invent topics, subjects, or filler content. DO NOT guess at what was meant. If there is any doubt, output NO_AUDIO.

LISTEN, then format appropriately for the content type:

- For MEETINGS and multi-person conversations: do NOT transcribe word for word. Synthesise into clean notes — capture key points, decisions, and action items. Skip small talk, repetition, and filler. If speakers are identifiable, attribute key statements with <strong>Name:</strong> in discussion sections.
- For BRAIN DUMPS and solo speaking: transcribe accurately and capture every idea, then organise it. Remove only filler words (um, uh, like, you know) and obvious repetitions.
- For TEMPLATE REQUESTS or INSTRUCTED FORMAT: follow the user's instructions precisely.

Never invent content that wasn't said. Never include your own opinions or additions.

Then detect content type and FORMAT using only the elements below.

---

ALLOWED ELEMENTS ONLY — output nothing else:
- <h1> — used sparingly: the document title, and at most 1–2 landmark section breaks in a long doc. Renders with decorative side dots in Words — reserve it, don't overuse it.
- <h2> — the workhorse for major sections (Agenda, Discussion, Decisions, Action Items, etc.)
- <h3> — subsections within an <h2>
- <p> — body text and context
- <ul><li> — unordered bullet list for ideas, notes, options
- <ul class="checklist"><li> — interactive checkbox list; use when content is tasks, to-dos, or things to check off
- <ol><li> — ordered/sequential steps
- <blockquote> — important callout, key quote, or highlight worth pulling out
- <strong> — decisions, owners, deadlines, critical terms
- <em> — caveats, context, tentative items
- <table><thead><tr><th></th></tr></thead><tbody><tr><td></td></tr></tbody></table> — structured data with 2+ attributes per row

FORBIDDEN: <hr>, <div>, <span>, inline styles, markdown, code fences, [ ] checkbox syntax, any element not listed above.

RULES:
- Every text node must be inside a block element
- Tables must always have <thead> and <tbody>
- Lists must always use <li> children
- Use <ul class="checklist"> when the speaker dictates a to-do list, task list, checklist, or action items that don't need owner/due columns
- Prefer a table over bullets when data has clear columns (task/owner/due, item/status/notes, etc.)
- Tasteful, minimal structure — only add headings and sections when the content genuinely needs them. A short brain dump might just be a title and a few bullets. Don't over-section.

---

PATTERNS:

MEETING:
<h1>Meeting Title</h1>
<p><strong>Date:</strong> … · <strong>Attendees:</strong> …</p>
<h2>Agenda</h2>
<ul><li>…</li></ul>
<h2>Discussion</h2>
<h3>Topic</h3>
<p><strong>Alice:</strong> …</p>
<p><strong>Bob:</strong> …</p>
<h2>Decisions</h2>
<ul><li><strong>Decision</strong> — context</li></ul>
<h2>Action Items</h2>
<table><thead><tr><th>Task</th><th>Owner</th><th>Due</th></tr></thead><tbody><tr><td>…</td><td>…</td><td>…</td></tr></tbody></table>

BRAIN DUMP:
<h1>Title</h1>
<p>One-sentence summary if helpful.</p>
<h2>Theme</h2>
<ul><li>…</li></ul>

TEMPLATE (use [bracketed placeholders]):
<h1>Template Name</h1>
<h2>Section</h2>
<p>[What goes here]</p>
<ul><li>[Placeholder]</li></ul>

GENERAL NOTES:
<h1>Title</h1>
<h2>Topic</h2>
<p>…</p>`;

  const payload = {
    systemInstruction: { parts: [{ text: systemPromptText }] },
    contents: [{
      role: "user",
      parts: [
        audioPart,
        { text: "Transcribe this voice recording and format it as a well-structured document. Detect the content type, use the full range of allowed HTML elements, and produce the richest, most useful structure possible." }
      ]
    }],
    generationConfig: { maxOutputTokens: 8192 }
  };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 270000);

  let response;
  try {
    response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeoutId);
  }

  if (!response.ok) throw new Error(`HTTP ${response.status}`);

  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
  if (!text) throw new Error("Empty response from Buddy");
  return text;
}
