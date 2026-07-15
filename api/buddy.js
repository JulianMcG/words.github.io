import Anthropic from "@anthropic-ai/sdk";

// Buddy's brain now runs on Claude Haiku. The front-end still speaks the
// Gemini wire format it always has (contents/systemInstruction/generationConfig
// in, candidates[0].content.parts[0].text out) — this function translates both
// directions, so no client code had to change.

const MODEL = "claude-haiku-4-5";

// Gemini responseSchema (UPPERCASE types) → JSON Schema for structured outputs.
// Structured outputs require additionalProperties: false and an explicit
// required list on every object; optional fields come back as empty strings,
// which the client already treats as absent.
function toJsonSchema(geminiSchema) {
  if (!geminiSchema || typeof geminiSchema !== "object") return undefined;
  const type = String(geminiSchema.type || "").toLowerCase();
  const out = { type };
  if (geminiSchema.description) out.description = geminiSchema.description;
  if (geminiSchema.enum) out.enum = geminiSchema.enum;
  if (type === "object") {
    out.properties = {};
    for (const [key, value] of Object.entries(geminiSchema.properties || {})) {
      out.properties[key] = toJsonSchema(value);
    }
    out.required = Object.keys(out.properties);
    out.additionalProperties = false;
  }
  if (type === "array" && geminiSchema.items) {
    out.items = toJsonSchema(geminiSchema.items);
  }
  return out;
}

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Read the hidden key dynamically from Vercel's secure environment.
  // No 'VITE_' prefix — this never reaches the browser.
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    return res.status(500).json({
      error: { message: "Server misconfiguration: Missing ANTHROPIC_API_KEY environment variable in Vercel." },
    });
  }

  try {
    const client = new Anthropic({ apiKey });
    const body = req.body || {};

    const system = (body.systemInstruction?.parts || [])
      .map((p) => p?.text)
      .filter(Boolean)
      .join("\n");

    const messages = (body.contents || []).map((c) => ({
      role: c.role === "model" ? "assistant" : "user",
      content: (c.parts || []).map((p) => p?.text).filter(Boolean).join("\n"),
    }));

    const gen = body.generationConfig || {};
    const wantsJson = gen.responseMimeType === "application/json" && gen.responseSchema;
    const schema = wantsJson ? toJsonSchema(gen.responseSchema) : undefined;

    // Gemini's tiny token budgets (title = 12) are too tight for Claude's
    // tokenizer — give them headroom; full Buddy replies default to 2048.
    const maxTokens = gen.maxOutputTokens
      ? Math.max(64, gen.maxOutputTokens * 4)
      : 2048;

    const response = await client.messages.create({
      model: MODEL,
      max_tokens: maxTokens,
      ...(system ? { system } : {}),
      ...(schema ? { output_config: { format: { type: "json_schema", schema } } } : {}),
      messages,
    });

    if (response.stop_reason === "refusal") {
      // Keep the wire shape valid; for Buddy's JSON flow, surface a chat reply
      const text = wantsJson
        ? JSON.stringify({ operation: "chat", conversational_reply: "Sorry — I can't help with that one." })
        : "";
      return res.status(200).json({ candidates: [{ content: { parts: [{ text }] } }] });
    }

    const text = response.content
      .filter((block) => block.type === "text")
      .map((block) => block.text)
      .join("");

    return res.status(200).json({ candidates: [{ content: { parts: [{ text }] } }] });
  } catch (error) {
    const status = Number.isInteger(error?.status) ? error.status : 500;
    return res.status(status).json({ error: { message: error?.message || "Claude request failed" } });
  }
}
