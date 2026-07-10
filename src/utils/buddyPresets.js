// One-click Buddy actions shared by the corner widget and the caret UI.
// These are user-voice prompts sent through the normal Buddy pipeline.
export const buddyPresetPrompt = (id, hasSelection = false) => {
  switch (id) {
    case "finish":
      return "Continue writing from exactly where my cursor is. Write the natural next sentence or two in my voice, tone, and style, continuing my train of thought. Output only the continuation — nothing else.";
    case "suggest":
      return "Read this and give me 2-3 short, specific suggestions that would make the writing better. Just ideas, warmly and concretely — don't rewrite it for me.";
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
  clean: "Tidying up your words…",
}[id] || "Thinking it over…");
