export const generateAIResponse = async (userPrompt, editorContent, referenceDocs = []) => {
  // securely hits our hidden Vercel backend proxy
  const endpoint = `/api/buddy`;

  const referenceContext = referenceDocs && referenceDocs.length > 0
    ? `\n\n### ATTACHED REFERENCE DOCUMENTS ###\nThe user has explicitly @-mentioned the following documents. Prioritize utilizing their content contextually if the user refers to them:\n${referenceDocs.map(d => `[DOCUMENT TITLE: ${d.title}]\n${d.content}`).join('\\n\\n')}\n####################################`
    : "";

  const systemInstruction = `You are Buddy, a sleek, intelligent writing and editing assistant.
The user is working on a document, and here is their current plaintext/HTML content for context:
---
${editorContent || "(The document is currently empty)"}
---${referenceContext}
CRITICAL REQUIRED PROTOCOL: You must ONLY output a valid JSON structure!
- INQUIRY RULE: If the user explicitly asks an interrogative conversational question (e.g. "what should I change?"), respond with direct conversational advice mapping to the "conversational_reply" JSON string field. 
- TASK RULE: If the user commands you to alter, polish, rewrite, generate, format, fix, or modify the text, you must output the ENTIRE REWRITTEN BLOCK directly inside the "generated_html" string field!
- EXACT REPLACEMENT: You are no longer providing surgical string-matches. If the user highlighted a paragraph, your "generated_html" will COMPLETELY OVERWRITE that paragraph. If the user asked you to rewrite the whole document, output the newly formulated document entirely!
- NO MARKDOWN SYNTAX: You MUST output pure HTML tags. NEVER output markdown syntax like **bold** or # headings.
- SUPPORTED FORMATTING OPTIONS: The user's editor natively supports and renders the following HTML tags: <h1>, <h2>, <h3>, <blockquote>, <ul>, <ol>, <li>, <b>, <strong>, <i>, <em>, <u>. You have full permission to use these formatting features ONLY if explicitly asked by the user to format, structure, or stylize the text. 
- DEFAULT PLAIN TEXT: If the user just asks to "fix grammar", "rewrite", or provides plain unformatted text, you MUST return unformatted plain text. Do not invent your own arbitrary bolding!
- CSS STRUCTURAL INTEGRITY (CRITICAL): Every single block of continuous text MUST be wrapped in generic <p>...</p> tags! If you output unstyled raw text nodes or wrap them in <div> tags, you will completely break the editor's line-height and typography CSS. Always bind your sentences inside <p> blocks.
- DO NOT wrap your JSON in markdown code blocks (\`\`\`).`;

  const payload = {
    contents: [
      {
        role: "user",
        parts: [
          { text: systemInstruction },
          { text: `User request: ${userPrompt}` }
        ]
      }
    ],
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: {
         type: "OBJECT",
         properties: {
            conversational_reply: { type: "STRING", description: "Your conversational response if the user asked a question." },
            generated_html: { type: "STRING", description: "The completely rewritten, fully DOM-ready HTML block that will directly overwrite the user's targeted text or document." }
         }
      }
    }
  };

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      let errorData = "Unknown HTTP Error";
      try {
        errorData = await response.json();
      } catch (e) {
        errorData = await response.text();
      }
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
      return { conversational_reply: "I encountered an error trying to construct the code changes." };
    }
  } catch (err) {
    console.error("Words AI API Error:", err);
    throw err;
  }
};
