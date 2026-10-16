/** Plain-language versions of worker/API failures; the raw text stays available under "Technical details". */
const RULES: [RegExp, string, string][] = [
  [/could not produce a valid storyboard|storyboard/i, "The AI couldn't write a usable script this time.", "Try again, or rephrase the topic more specifically (for example “JSON vs XML with one example”)."],
  [/ollama|11434|connection refused|connecterror|connect timeout/i, "The local AI model isn't running.", "Start Ollama on the processing machine, then try again."],
  [/kokoro|narration failed|tts/i, "The voiceover couldn't be recorded.", "Try again. If it keeps failing, restart the processing machine."],
  [/align|recognised|measured speech/i, "Captions couldn't be synchronised with the voiceover.", "Try again, or simplify unusual words in the narration."],
  [/invalid (json|xml|python) syntax|syntax/i, "One of the code examples has a syntax error.", "Fix the highlighted code in the script editor and render again."],
  [/hyperframes|render|ffmpeg|ffprobe/i, "The video couldn't be rendered.", "Try again. Drafts render faster if time is short."],
  [/cancel/i, "This job was cancelled.", "Start it again whenever you're ready."],
  [/not signed in|401|jwt/i, "Your session has expired.", "Sign in again to continue."],
  [/failed to fetch|network|timeout|offline/i, "The processing machine can't be reached.", "Check that it is online, then try again."],
];

export function friendlyError(raw: string): { title: string; hint: string } {
  for (const [re, title, hint] of RULES) if (re.test(raw)) return { title, hint };
  return { title: "Something went wrong.", hint: "Please try again. Your project and earlier versions are safe." };
}
