# PS4: REEL STUDIO — Original Official Problem Statement

> Preserved verbatim from the hackathon brief. This is the judge-facing product contract.

## Problem
Short-form video on Instagram and YouTube has become the main way education businesses reach new students, yet producing it remains slow and manual.
Editing a single good 60-second reel takes hours, and most institutes cannot afford a dedicated editor.
Meanwhile, hundreds of hours of recorded classes contain clear, engaging teaching moments that are never seen outside the classroom.
General-purpose editing tools cannot help: they do not understand code-mixed Hinglish speech, misspell every technical term, and crop a screen share so badly that the code on it becomes unreadable.

## What to Build
An AI video studio that turns raw class recordings and simple topic prompts into polished, branded, ready-to-publish vertical videos in minutes.

Given a long class recording — a screen share with the instructor's voice — the system should transcribe code-mixed speech with word-level timing, then detect highlight moments of 30 to 60 seconds that are engaging and make complete sense on their own, using the transcript, the energy in the instructor's voice and changes on screen.

Every clip must begin and end on a complete thought.

Each clip should be reframed to 9:16 by intelligently following the active region of the screen — the code being typed, the cursor, the diagram being explained — rather than applying a fixed centre crop.

Captions should be synchronised word by word, spell technical terms such as "Kubernetes", "useEffect" and "@Autowired" correctly, and render code as formatted text.

The institute's brand kit — colours, fonts, logo, intro and outro — should be applied automatically, and a simple timeline editor should let a human adjust any clip's boundaries and re-render instantly.

In a second mode, a user should be able to type a topic such as "JSON vs XML" and receive a complete 45-second explainer: a script, code that animates as it is typed and changed, a voiceover and captions.

Optionally, the system should schedule and publish videos directly to social platforms, track their performance, and feed that performance back into how future highlights are selected.

## Judge-facing requirement checklist
| # | Requirement | Phase |
|---|-------------|-------|
| PS-1 | Transcribe code-mixed Hinglish with word-level timing | 02 |
| PS-2 | Detect 30–60 s highlights from transcript + voice energy + screen changes | 03 |
| PS-3 | Every clip begins and ends on a complete thought | 03 |
| PS-4 | 9:16 reframing that follows the active screen region (no fixed centre crop) | 03 |
| PS-5 | Word-by-word synced captions, correct technical terms, code as formatted text | 02 / 04 |
| PS-6 | Brand kit (colours, fonts, logo, intro, outro) applied automatically | 04 |
| PS-7 | Timeline editor to adjust clip boundaries and re-render fast | 04 / 06 |
| PS-8 | Topic → ~45 s explainer: script, animated code, voiceover, captions | 05 |
| PS-9 (opt) | Schedule and publish to social platforms | 07 |
| PS-10 (opt) | Track performance | 08 |
| PS-11 (opt) | Feed performance back into highlight selection | 08 |

Additional (non-PS) scope — advanced multi-track editor, accounts, workspaces, teams, subscriptions,
usage — is tracked separately in `docs/PHASES.md`.
