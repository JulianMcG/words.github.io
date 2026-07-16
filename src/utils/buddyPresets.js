// One-click Buddy actions shared by the corner widget and the caret UI.
// These are user-voice prompts sent through the normal Buddy pipeline.
export const buddyPresetPrompt = (id, hasSelection = false) => {
  switch (id) {
    case "finish":
      return "Finish my current sentence or thought from exactly where my cursor is. If the sentence is mid-flight, complete it; if it just ended, add at most one short sentence to round off the thought. Match my voice, tone, and style. Output only the continuation — nothing else. Keep it brief.";
    case "suggest":
      return "Read this and give me 2-3 short, specific suggestions that would make the writing better. Just ideas, warmly and concretely — don't rewrite it for me. Structure your reply: give each suggestion a short <h3> heading (a few words) followed by a sentence or two in <p> tags.";
    case "apply":
      return "Apply the suggestions you just made to my document. Rework only what the suggestions call for — keep my voice, meaning, and everything else untouched — and return the complete updated document.";
    case "clean":
      return hasSelection
        ? "Clean up this text: fix spelling, grammar, punctuation, and awkward phrasing. Keep my meaning, tone, and formatting exactly as they are."
        : "Clean up my document: fix spelling, grammar, punctuation, and awkward phrasing throughout. Keep my meaning, tone, structure, and formatting — don't add or remove ideas.";
    default:
      return "";
  }
};

export const buddyPresetLabel = (id) => ({
  finish: "Finishing your thought…",
  suggest: "Reading your words…",
  apply: "Applying suggestions…",
  clean: "Tidying up your words…",
}[id] || "Thinking it over…");
