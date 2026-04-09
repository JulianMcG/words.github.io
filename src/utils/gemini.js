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

**insert_at_cursor**: The user has a collapsed cursor (no selection) and wants new content generated at that position. Use this for "write a paragraph about X", "add an introduction", "continue this", etc.

**chat**: The user is asking a question, requesting advice, or making a conversational request that does not require directly modifying the document. Use this for "what should I change?", "how do I improve this?", "explain X". Also use chat when the user's intent is ambiguous.

## OPERATION DECISION RULES

- Selection provided + edit command → replace_selection
- Full document provided + global transformation command → replace_document
- Collapsed cursor + generation command → insert_at_cursor
- Question / advice / ambiguous intent → chat
- When in doubt between an edit and chat, prefer chat

## HTML FORMATTING RULES

When generating content (any operation except chat), output only valid semantic HTML. NEVER use Markdown syntax — no **bold**, no # headers, no - bullet hyphens, no backticks.

**Allowed block elements**: <p>, <h1>, <h2>, <h3>, <blockquote>, <ul>, <ol> (always with <li> children)
**Allowed inline elements**: <strong>, <em>, <u>, <s>, <a href="..." target="_blank" rel="noopener noreferrer">
**Forbidden**: <div>, <span>, <font>, inline styles, CSS classes, IDs, any element not listed above

**Critical rule**: Every text node MUST be inside a block element. Never output bare text outside of a <p> or heading tag. Each distinct paragraph or thought = its own <p> block.

**Style matching**: Match the formatting level of the existing document. If the document uses plain <p> tags, do not invent headings or bullet points unless explicitly asked. If the document has rich structure, match and preserve it.

**Precision rule**: Only change what the user asked for. Do not restructure, reformat, or add content that was not requested.

## RESPONSE FORMAT

Always output a valid JSON object. Never wrap it in markdown code fences.

For replace_selection, replace_document, insert_at_cursor: populate "generated_html" with the complete HTML output.
For chat: populate "conversational_reply" with plain text (newlines OK, no HTML tags).
You may include both fields to show content AND add a brief explanatory note.${referenceSection}`;

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
      return { operation: "chat", conversational_reply: "I encountered an error constructing my response. Please try again." };
    }
  } catch (err) {
    console.error("Words AI API Error:", err);
    throw err;
  }
};
