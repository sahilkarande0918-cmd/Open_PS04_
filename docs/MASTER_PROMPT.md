REEL STUDIO — NATIONAL HACKATHON MASTER DEVELOPMENT PROMPT
YOUR ROLE AND OPERATING INSTRUCTIONS
You are the lead software architect, senior full-stack engineer, AI/ML engineer, video-processing engineer, DevOps engineer, QA engineer and technical project manager for Reel Studio.
You are building a serious, professional, functional AI-powered educational video production SaaS for a 24-hour national-level hackathon.
Your mission is to build the complete problem statement, including its optional social publishing and analytics features, while also implementing an advanced editor and SaaS management features.
This is NOT a landing-page-only project, a clickable mockup, an AI chatbot wrapper, or a collection of disconnected prototypes.
Build a working, integrated product with a professional UI, real processing capabilities, reliable exports, meaningful tests, a public GitHub development history, and a working deployment link for judges.
Immediately begin Phase 00 after reading this prompt. Do not stop after generating a plan.
NON-NEGOTIABLE RULES

1. Total mandatory infrastructure and API cost must be ₹0.
2. Never enable paid services, billing upgrades, or billable API calls without explicit owner authorization.
3. Use real open-source AI processing locally wherever practical.
4. Build all mandatory requirements in the original PS.
5. Include all optional PS capabilities: social publishing, scheduling, analytics and performance feedback.
6. Include the separately requested advanced timeline editor, user accounts, subscriptions and SaaS management.
7. Work inside the existing GitHub repository provided below.
8. First invite the specified real team members as GitHub collaborators.
9. NEVER add Claude, Anthropic, an AI assistant, an agent or any bot as a project team member, Git contributor, commit co-author, README contributor, credited developer or commit author.
10. Preserve genuine human-authored Git identities and genuine commit timestamps. Never fabricate contributions or rewrite timestamps to influence judging.
11. Development must be broken into the detailed phases in this document.
12. Make meaningful Git commits as functionality is completed. Do not generate empty or meaningless commits.
13. Keep documentation continuously updated so work survives Claude context compaction.
14. Save this full master prompt unchanged inside the repository.
15. Do not claim functionality works without testing it.
16. Do not silently replace blocked features with fake responses or decorative buttons.
17. Do not expose credentials in Git, logs, frontend code or screenshots.
18. Keep the Vercel deployment working throughout development.
19. Maintain software quality, security, accessibility and responsive layouts.
20. Do not ask unnecessary approval questions. Proceed independently except when credentials, authentication, external account approval, financial commitments or genuine architectural blockers require user action.

The goal is to maximize our real hackathon competitiveness through execution, technical quality, practical usefulness and reliability.
SECTION 1 — OFFICIAL GITHUB REPOSITORY AND TEAM
1.1 Existing Repository
Repository URL:
https://github.com/sahilkarande0918-cmd/Reel-Studio.git
GitHub owner:
`sahilkarande0918-cmd`
Repository:
`Reel-Studio`
Visibility:
PUBLIC
Default branch:
`main`
The repository is initially empty.
Do not create a separate GitHub repository or replace this repository with a fork.
Clone and develop within this exact repository.
Verify the remote URL before beginning work.
1.2 FIRST ACTION — Invite All Team Members
Before implementing application code, invite these three GitHub users as repository collaborators:

1. `sahillokhande5841-cmyk`
https://github.com/sahillokhande5841-cmyk
2. `Atharva486dherange`
https://github.com/Atharva486dherange
3. `SK999CodingWorld`
https://github.com/SK999CodingWorld

The owner, `sahilkarande0918-cmd`, is the fourth team member.
Use the authenticated GitHub CLI or official GitHub REST API to send invitations.
First execute:
`gh auth status`
Verify that the authenticated user has the necessary repository administration privileges.
For this personal-account repository, GitHub's official collaborator endpoint is:
`PUT /repos/sahilkarande0918-cmd/Reel-Studio/collaborators/{username}`
Send invitations to all three users through the appropriate authenticated GitHub CLI calls.
For a personal-account repository, use its supported collaborator invitation permissions rather than assuming organization-specific permission roles are available.
Verify the returned invitation status. Check pending invitations and existing collaborators. Distinguish between:

* Invitation sent
* Invitation pending
* Invitation accepted
* Existing collaborator
* Invitation failed

If the authenticated environment cannot send invitations, immediately explain the exact blocker and provide the owner the corresponding GitHub Settings → Collaborators procedure.
Do not falsely claim invitations were successful.
Invitations may require recipients to accept them manually.
CRITICAL CONTRIBUTOR ATTRIBUTION POLICY
Only the following accounts should be credited as team members:

* `sahilkarande0918-cmd`
* `sahillokhande5841-cmyk`
* `Atharva486dherange`
* `SK999CodingWorld`

Never add `Co-Authored-By: Claude`, `Co-Authored-By: Anthropic`, or equivalent AI attribution trailers.
Do not configure a fake human identity for Git commits.
Use the authenticated human operator's existing legitimate Git identity when the operator commits, and preserve each teammate's real identity on work they independently contribute.
Do not impersonate teammates or create commits on their behalf to make the team appear more active.
GitHub's contributor graph is based on actual attributed commits. Inviting teammates and showing their usernames in the README does not itself make them commit contributors.
Include a professional team section in the README listing these four GitHub accounts.
If hackathon rules require disclosure of AI-assisted coding, comply with those rules in the appropriate disclosure section without adding Claude as a repository contributor or co-author.
SECTION 2 — ORIGINAL OFFICIAL PROBLEM STATEMENT
PS4: REEL STUDIO
Problem
Short-form video on Instagram and YouTube has become the main way education businesses reach new students, yet producing it remains slow and manual.
Editing a single good 60-second reel takes hours, and most institutes cannot afford a dedicated editor.
Meanwhile, hundreds of hours of recorded classes contain clear, engaging teaching moments that are never seen outside the classroom.
General-purpose editing tools cannot help: they do not understand code-mixed Hinglish speech, misspell every technical term, and crop a screen share so badly that the code on it becomes unreadable.
What to Build
An AI video studio that turns raw class recordings and simple topic prompts into polished, branded, ready-to-publish vertical videos in minutes.
Given a long class recording — a screen share with the instructor's voice — the system should transcribe code-mixed speech with word-level timing, then detect highlight moments of 30 to 60 seconds that are engaging and make complete sense on their own, using the transcript, the energy in the instructor's voice and changes on screen.
Every clip must begin and end on a complete thought.
Each clip should be reframed to 9:16 by intelligently following the active region of the screen — the code being typed, the cursor, the diagram being explained — rather than applying a fixed centre crop.
Captions should be synchronised word by word, spell technical terms such as "Kubernetes", "useEffect" and "@Autowired" correctly, and render code as formatted text.
The institute's brand kit — colours, fonts, logo, intro and outro — should be applied automatically, and a simple timeline editor should let a human adjust any clip's boundaries and re-render instantly.
In a second mode, a user should be able to type a topic such as "JSON vs XML" and receive a complete 45-second explainer: a script, code that animates as it is typed and changed, a voiceover and captions.
Optionally, the system should schedule and publish videos directly to social platforms, track their performance, and feed that performance back into how future highlights are selected.
Interpretation
Every requirement above is part of our development scope.
Do not omit optional features merely because they are optional.
The explicitly requested advanced editing and SaaS management features are additional scope, not substitutes for the original PS.
Keep the original judge-facing requirements clearly separated from additional SaaS features in documentation and testing.
SECTION 3 — PRODUCT VISION
Build a professional platform called:
Reel Studio
Positioning:
The AI video studio built for technical educators.
The platform helps institutes, programming instructors, technology trainers and educational creators turn existing lessons into social media content without spending hours editing.
It must support two primary production modes.
Mode A: Recording to Reels
Upload a recorded class and automatically obtain professionally edited 30–60-second vertical clips.
Mode B: Topic to Video
Enter a topic and automatically create a complete approximately 45-second educational explainer with animated code, narration, captions and branding.
Both modes must connect to the same editing, rendering, publishing and analytics systems.
The overall user journey is:
Create account → Create institute/workspace → Configure brand kit → Upload recording OR enter topic → AI generation → Review proposed clips → Edit timeline → Render final MP4 → Download OR schedule/publish → Track analytics → Improve future recommendations.
This user journey must work end to end.
SECTION 4 — MANDATORY TECHNOLOGY STACK
Use this architecture unless a verified incompatibility requires a justified change.
4.1 Frontend

* Next.js with App Router
* React
* TypeScript
* Tailwind CSS
* Accessible React UI primitives
* Zustand where appropriate for editor state
* TanStack Query or an equivalent request-state solution
* Lucide icons
* Motion animations only where useful
* Responsive desktop-first editor design

Do not install multiple overlapping UI systems unnecessarily.
4.2 Backend

* Python
* FastAPI
* Pydantic schemas
* Typed service modules
* Supabase PostgreSQL
* Supabase Authentication
* Supabase Realtime where useful
* Supabase Storage for controlled small assets and selected final outputs
* Local filesystem for raw recordings and intermediate processing
* Local durable background worker
* FFmpeg

Avoid running long AI tasks directly inside synchronous HTTP request handlers.
4.3 AI and Media Processing

* Hyperframes as the principal professional video generation/rendering system
* FFmpeg and FFprobe for editing, extraction, metadata and transcoding
* faster-whisper for efficient local speech transcription
* WhisperX for word-level alignment where reliable
* OpenCV for screen analysis and tracking
* PySceneDetect for visual scene-change information
* OCR through a suitable free local library such as Tesseract
* Ollama and a hardware-compatible open-weight LLM for semantic analysis and script generation
* Kokoro or Kokoro FastAPI for local voiceover generation

Prefer models that operate reliably with the available hardware rather than simply choosing the largest model.
Check model licenses before integrating them.
Keep transcription, alignment, semantic analysis, code detection, TTS and rendering as independently testable services.
4.4 Hosting
Frontend:
Vercel Hobby, using the existing GitHub repository.
Database/authentication/limited assets:
Supabase Free.
Heavy processing:
Local FastAPI + local GPU + local worker.
Connectivity:
A secure, free HTTPS tunnel or another genuinely zero-cost route between Vercel and the local backend.
Verify tunnel limits and availability. Do not assume a temporary tunnel is continuously accessible.
Use environment-specific backend URLs.
Build clear handling for backend offline states.
Do not deploy FFmpeg, WhisperX, Ollama or heavy GPU processing inside Vercel Functions.
Vercel Hobby must be used only within its permitted non-commercial scope.
4.5 Cost Policy
Do not require:

* Paid OpenAI API
* Paid Anthropic API
* Paid speech-to-text API
* Paid text-to-speech API
* Paid video generation API
* Paid render cloud
* Paid object storage subscription
* Paid production database
* Paid hosting subscription

Free software does not mean free computation or unlimited capacity.
Document local GPU requirements, storage limits, quotas and dependency restrictions honestly.
Do not introduce a paid service without explicitly flagging the requirement and obtaining owner approval.
SECTION 5 — APPROVED GITHUB REPOSITORIES
Inspect the actual README, license, current versions and architecture of these repositories before integration.
Do not blindly copy them.
5.1 HYPERFRAMES — MANDATORY VIDEO ENGINE
https://github.com/heygen-com/hyperframes
Primary purpose:

* Professional video generation
* HTML/CSS-driven video compositions
* Motion graphics
* Animated typography
* Scene transitions
* Video overlays
* Brand intros/outros
* Code animations
* Final MP4 rendering

The repository is Apache 2.0 licensed.
Integrate it as the principal rendering engine.
Relevant Hyperframes capabilities and skills to inspect:

* Hyperframes core
* Animation
* Keyframes
* Creative direction
* Media use
* Audio
* Embedded captions
* Faceless explainer
* Talking-head recut
* General video
* CLI preview/render workflows

Verify the actual installed API/CLI behavior before implementing an adapter.
Do not assume the Hyperframes skills by themselves provide automatic highlight selection, speech transcription or screen tracking.
Those features must be implemented separately.
Prefer local CLI rendering. Avoid paid cloud-rendering features.
5.2 PONYTAIL — MANDATORY ENGINEERING SKILL
https://github.com/DietrichGebert/ponytail
Install for Claude Code following the current upstream instructions.
Its purpose:

* Reduce overengineering
* Prefer existing implementations
* Improve code simplicity
* Improve test discipline
* Audit risky changes
* Remove unnecessary complexity
* Keep implementation maintainable

Ponytail is mandatory.
Use its review and audit capabilities at appropriate milestones.
However, never interpret simplification as permission to omit required PS features.
5.3 TASTE SKILL
https://github.com/Leonxlnx/taste-skill
Use for:

* Premium frontend design
* Sophisticated typography
* Better spacing and visual hierarchy
* Professional landing page
* Clean SaaS application design

Use its minimalist/product-oriented guidance for the editor and dashboard instead of applying marketing-page compositions indiscriminately.
5.4 HALLMARK
https://github.com/Nutlope/hallmark
Use especially for:

* Reviewing frontend design
* Detecting generic AI-looking layout patterns
* Improving design consistency
* Checking typography and spacing
* Avoiding repetitive generic component structures

Do not allow conflicting design-agent instructions to continually redesign completed interfaces.
Use Taste Skill for initial design direction and Hallmark for targeted audits.
5.5 21ST MCP / MAGIC MCP
https://github.com/21st-dev/magic-mcp
Optional design discovery tool.
The old Magic MCP has been replaced by the unified 21st MCP interface.
Free access to component discovery may be useful, but hosted AI generation and some component retrieval features may have access restrictions.
Do not rely on paid generation capabilities.
Only enable it if zero-cost access is confirmed.
5.6 INSPIRA UI
https://github.com/unovue/inspira-ui
Reference only.
It is primarily Vue/Nuxt based.
Because Reel Studio uses React/Next.js, do not add a Vue runtime just to use its components.
5.7 VIDEO EDITOR REFERENCES
Primary reference:
https://github.com/OpenCut-app/opencut-classic
Inspect its MIT license, editing architecture and timeline approaches.
It is archived, so treat it as a reference and selectively reuse compatible code rather than importing its entire architecture.
Additional evaluation candidates:
https://github.com/opencutvideo/Opencut
https://github.com/openvideodev/react-video-editor
Important:
OpenVideo Editor has custom licensing conditions. Do not adopt restricted components without verifying that our specific use is permitted.
Do not assume a public GitHub repository automatically allows unrestricted commercial reuse.
Prefer a custom React timeline built with permissively licensed components over a complex licensing dependency.
5.8 TRANSCRIPTION
https://github.com/SYSTRAN/faster-whisper
https://github.com/m-bain/whisperX
Use for transcription and word-level alignment.
5.9 SCENE ANALYSIS
https://github.com/Breakthrough/PySceneDetect
Use for scene transitions and visual activity features.
5.10 LOCAL LANGUAGE MODELS
https://github.com/ollama/ollama
Use a suitable local model for:

* Highlight semantic scoring
* Topic scripts
* Caption correction
* Storyboarding
* Feedback analysis

5.11 TEXT-TO-SPEECH
https://github.com/hexgrad/kokoro
https://github.com/remsky/Kokoro-FastAPI
Use a suitable locally runnable voice model.
5.12 INSTAGRAM MCP
Preferred reference:
https://github.com/adelaidasofia/instagram-mcp
Scheduled-publishing panel reference:
https://github.com/Burak-cell-max/instagram-mcp-panel
These repositories use the official Instagram API.
Inspect their authentication requirements, token-handling security and publishing flow before reuse.
Use the official Instagram API as the application's underlying publishing integration.
Use the MCP server as an optional adapter/development tool, not as a substitute for implementing the application's own scheduling infrastructure.
5.13 ADDITIONAL TOOLS
Use official documentation and permissively licensed libraries for:

* Supabase
* Vercel
* Google OAuth
* YouTube Data API
* YouTube Analytics API
* OpenCV
* FFmpeg
* Playwright
* Pytest
* Vitest or an equivalent TypeScript test runner

Avoid adding dependencies without a clear purpose.
Maintain a third-party dependency and license inventory.
SECTION 6 — UI/UX DESIGN REQUIREMENTS
The interface must feel like a serious modern creator SaaS, not a generic student hackathon website.
Visual direction:

* Premium
* Professional
* Minimal
* High information density where appropriate
* Well-organized
* Smooth interactions
* Clear typography
* Functional, not decorative

Avoid generic blue/purple AI gradients, excessive glowing blobs, random glassmorphism and repeated AI-generated card patterns.
Prefer a restrained neutral-dark editing workspace with a controlled warm or editorial accent.
Maintain readable contrast and accessible navigation.
Use responsive layouts.
Main Application Pages

1. Public landing page
2. Login/sign-up
3. Dashboard
4. Projects library
5. Recording-to-Reels studio
6. Topic-to-Video studio
7. AI processing/progress view
8. Highlight selection screen
9. Advanced video editor
10. Brand kit manager
11. Media and asset library
12. Publishing calendar
13. Connected social accounts
14. Analytics dashboard
15. Subscription and usage management
16. Institute/workspace settings
17. Team management
18. User profile/settings

Design a consistent navigation structure.
Do not build pages with attractive but nonfunctional controls.
All meaningful buttons must have real behavior, validation, or a truthful unavailable state.
Use actual progress indicators for background jobs.
Use thumbnail previews and visual comparisons wherever they meaningfully improve usability.
The editor should be desktop-first, while the dashboard, library, settings and publishing screens should adapt well to mobile.
SECTION 7 — PRIMARY MODE A: RECORDING TO REELS
Implement the following complete processing pipeline.
7.1 Recording Ingestion
Users must be able to:

* Upload supported video formats
* View upload progress
* View file metadata
* Name the project
* Select the institute/workspace
* Select brand kit
* Select output settings
* Start processing
* Review processing progress
* Retry failed operations

Use FFprobe to inspect input metadata.
Validate file types, real media content, duration, dimensions and size.
Do not buffer massive recordings inside Vercel Functions.
Large recordings should be streamed/resumably transferred to the local processing backend or another genuinely free, verified storage path.
Keep ownership boundaries and cleanup rules.
7.2 Audio Processing
Extract and normalize audio using FFmpeg.
Run speech recognition locally.
Support code-mixed Hindi and English as a primary use case.
Extract word-level timing.
Preserve original spoken language, including mixed-language words.
Do not silently convert Hinglish into English.
Create transcript segments including:

* Start timestamp
* End timestamp
* Word
* Language if reasonably detectable
* Confidence or uncertainty indicators where available
* Speaker identifier where possible

Handle silence, background noise and recording interruptions.
7.3 Technical Vocabulary Correction
Build a specialized correction layer for educational technical terms.
Examples:

* Kubernetes
* useEffect
* @Autowired
* JavaScript
* TypeScript
* React
* Docker
* JSON
* XML
* API
* SQL
* Python
* C++
* Node.js

Use:

* A technical vocabulary dictionary
* Contextual correction
* Institute-provided glossary
* Screen OCR evidence
* Relevant code tokens
* Optional user corrections

Preserve spelling, casing, symbols and syntax.
Do not use unverified semantic guesses to rewrite technical expressions into incorrect code.
Keep raw transcript and corrected transcript separately for debugging.
7.4 Voice Energy and Engagement Features
Extract relevant audio features such as:

* Energy/RMS
* Loudness variation
* Silence and pauses
* Speech rate
* Emphasis changes
* Pitch/prosodic variation where reliable

Combine these with transcript meaning and screen changes.
A sudden volume increase alone is not sufficient evidence of a good highlight.
7.5 Screen Activity Analysis
Sample frames at an appropriate rate.
Detect:

* Significant screen changes
* Code typing
* Cursor activity
* Scroll activity
* Window switching
* Slide/diagram transitions
* Active code regions
* Text-heavy frames

Use PySceneDetect and OpenCV.
Avoid expensive frame-by-frame analysis when cheaper sampling or temporal tracking can achieve the same result.
7.6 Intelligent Highlight Detection
Generate multiple candidate clips, generally 30–60 seconds.
Rank them using:

* Semantic completeness
* Explanation clarity
* Educational usefulness
* Standalone context
* Voice engagement
* Screen activity
* Topic relevance
* Avoidance of duplicate content

Every selected clip must begin and end on a complete thought.
Avoid beginning halfway through an example or ending before the instructor reaches the explanation's conclusion.
Prefer topic boundaries, pauses and semantically complete sentences.
Generate clear reasons for why a clip was selected.
Give users multiple ranked highlights where possible.
Include clip:

* Title
* Summary
* Start/end timestamps
* Duration
* Highlight score
* Transcript excerpt
* Selection reasoning
* Editing status

Do not invent a mathematically validated confidence score from arbitrary heuristic values.
If using a heuristic score, label it appropriately.
SECTION 8 — CODE-AWARE SMART REFRAMING
This is a major differentiator.
A basic center crop is unacceptable.
Convert source recordings to 9:16 while preserving the important visual teaching content.
Implement:

1. Active-region tracking
2. Cursor tracking
3. Code-editor region detection
4. Scroll-aware framing
5. Diagram focus
6. Temporal smoothing
7. Safe margins
8. Caption-safe regions
9. Readable code composition
10. Crop preview and adjustment

Use frame analysis, OCR, cursor/region heuristics and screen-change information.
When the code is too wide or too small for a portrait crop, use an intelligent composition strategy instead of simply zooming until essential information disappears.
Possible strategies:

* Focused code region plus context panel
* Magnified active code block
* Vertical code panel reconstruction
* Picture-in-picture
* Smooth position transitions
* Background fill with a clear foreground region

Preserve technical meaning.
Ensure highlighted lines of code are visible during the instructor's explanation.
Allow manual override of crop position and region.
Store reframing instructions as time-based metadata instead of permanently destroying the original recording.
Test against at least:

* A static coding screen
* Rapid cursor movement
* Long code lines
* Vertical scrolling
* A changing diagram
* Switching between code and slides

SECTION 9 — AI CAPTION SYSTEM
Generate synchronized word-by-word captions.
Required functionality:

* Accurate word timestamps
* Hinglish support
* Proper technical vocabulary
* Capitalization preservation
* Special characters
* Subtitle preview
* Subtitle editing
* Multiple caption styles
* Caption positioning
* Font selection
* Colour selection
* Word emphasis
* Safe-zone handling

Render technical code as formatted text when appropriate.
Use syntax highlighting for displayed code blocks.
Do not make actual code unreadable by blindly converting it into decorative animated captions.
Use deterministic timing to ensure preview and export remain synchronized.
Support common caption line-breaking rules and readability thresholds.
Export embedded/burned captions in final MP4s.
Where useful, also support SRT/VTT output.
SECTION 10 — BRAND KIT SYSTEM
Each institute/workspace must be able to create and manage a brand kit.
Features:

* Institute name
* Logo
* Primary colour
* Secondary colour
* Accent colour
* Fonts
* Caption style
* Intro template
* Outro template
* Social handle
* Default video settings
* Optional watermark
* Reusable presets

Apply the selected brand kit automatically in both video-generation modes.
Users must be able to preview and edit branding before rendering.
Brand-kit changes must be versioned or snapshotted sufficiently so existing projects can be re-rendered predictably.
SECTION 11 — MODE B: TOPIC TO EXPLAINER
Given a prompt such as:
`JSON vs XML`
Generate a finished, approximately 45-second educational video.
Required pipeline

1. Understand the topic
2. Generate an accurate educational outline
3. Generate an engaging, concise script
4. Generate code examples where relevant
5. Validate code examples where executable
6. Produce a timed storyboard
7. Generate voiceover
8. Determine speech timing
9. Animate code typing/modification
10. Add visuals and transitions
11. Generate synchronized captions
12. Apply branding
13. Render 9:16 MP4
14. Allow editing/exporting/publishing

Topic Generation Requirements
Scripts should be clear, human-sounding and educational.
Avoid generic filler and excessive marketing language.
Where technically relevant, show a concept using a sequence:
Problem → Explanation → Example → Conclusion.
Allow the user to specify:

* Topic
* Target audience
* Language
* Tone
* Difficulty
* Brand kit
* Narration voice
* Duration preference
* Visual style

The PS's default target remains approximately 45 seconds.
Code Animation
Code must animate as it is:

* Typed
* Modified
* Compared
* Highlighted
* Replaced
* Explained

For example, `JSON vs XML` should show meaningful JSON and XML structures with visually understandable differences.
Use Hyperframes for final video compositions.
Keep code syntax accurate.
Do not render random typing effects unrelated to the explanation.
Voiceover
Use local TTS.
Provide voice selection based on available voices.
Test natural pronunciation of technical terms.
Synchronize captions with the generated audio.
If a requested language or voice is not reliably supported, provide a truthful supported alternative.
SECTION 12 — ADVANCED VIDEO EDITOR
Although the PS requires a simple clip-boundary editor, our target is a more capable editing system.
Core Editor Features

* Multi-track timeline
* Video tracks
* Audio tracks
* Text/caption tracks
* Images/overlays
* Clip trimming
* Clip splitting
* Drag-and-drop arrangement
* Timeline zoom
* Snapping
* Playback controls
* Playhead seeking
* Undo/redo
* Property inspector
* Canvas preview
* Text overlays
* Text styles
* Caption editing
* Audio gain
* Audio fades
* Transitions
* Basic visual effects
* Positioning
* Scaling
* Cropping
* Reframing adjustment
* Brand elements
* Export controls
* Project saving

Implement architecture that allows additional effects later.
Canonical Timeline Model
Use one shared timeline data representation across:

* AI generation
* UI editor
* Local preview
* Export service
* Project persistence

Timeline entries should support:

* Unique ID
* Asset reference
* Track
* Source start/end
* Timeline start/duration
* Position/scale/crop
* Effect parameters
* Animation keyframes
* Captions
* Audio properties
* Brand references

Avoid separate inconsistent timeline formats between the editor and renderer.
Provide schema validation and migrations for future changes.
Preview/Export Consistency
The final rendered MP4 should closely match the editor's preview.
Preserve exact timing and positioning.
When a user edits clip boundaries:

* Persist the edit
* Update preview immediately
* Reuse cached analysis when safe
* Re-render only the necessary pipeline stages
* Show actual render progress

Never claim a full video rendered instantly if processing is still underway.
The PS requires fast re-rendering; prioritize low latency and caching.
SECTION 13 — SOCIAL MEDIA INTEGRATION
Implement Instagram and YouTube integration as actual product capabilities.
13.1 Instagram
Use official Meta/Instagram APIs.
Support:

* Professional account connection
* OAuth/token handling appropriate to the selected API flow
* Account details
* Reel publishing
* Caption/description
* Cover/thumbnail where supported
* Publishing status
* Scheduled publishing
* Failed publishing retry
* Post identifiers
* Recent published content
* Insights retrieval

Review:
https://github.com/adelaidasofia/instagram-mcp
and
https://github.com/Burak-cell-max/instagram-mcp-panel
Verify the current official Meta permissions, account eligibility and authentication flow.
Do not use unofficial login automation, stored Instagram passwords, browser scraping, or bypass methods.
Instagram must be able to retrieve videos through a valid HTTPS URL.
Use short-lived or appropriately scoped asset URLs with sufficient availability for media ingestion.
Respect platform publishing limits and processing status.
13.2 YouTube
Use official:

* YouTube Data API
* YouTube Analytics API

Support:

* Google OAuth
* YouTube channel connection
* Video upload
* Metadata configuration
* Privacy settings
* Scheduling
* Publishing status
* Video IDs
* Analytics retrieval

Implement Shorts-compatible video exports. YouTube determines Shorts eligibility based on its current requirements; do not assume adding a hashtag alone guarantees classification.
Respect quotas, OAuth consent restrictions and account requirements.
13.3 Scheduler
Build a real durable scheduling system.
Store:

* Video/project reference
* Destination platform
* Connected account
* Scheduled UTC timestamp
* Requested local timezone
* Publication metadata
* Job state
* Attempts
* Errors
* Platform post ID

Use a local persistent worker, not an in-memory timer that disappears when the app restarts.
Support:

* Scheduled
* Processing
* Publishing
* Published
* Failed
* Cancelled

Use idempotency and locking to prevent double publishing.
Retry recoverable errors with backoff.
Never claim successful publishing before the platform confirms it.
13.4 Connectivity Limitations
Some platform actions may require external developer approval, verified accounts or additional permissions.
Do not fabricate successful production publishing.
Implement the genuine OAuth/API code and test against authorized development accounts.
Clearly differentiate:

* Tested live integration
* Integration implemented but awaiting approval
* Sandbox/test mode
* Unavailable external permission

Document exact blockers in the repository.
SECTION 14 — ANALYTICS AND AI PERFORMANCE FEEDBACK
Implement real data retrieval where platform permissions permit.
14.1 Analytics Dashboard
Support relevant available metrics including:

* Views
* Reach
* Impressions where available
* Likes
* Comments
* Shares
* Saves
* Watch time where available
* Engagement
* Published date
* Platform
* Clip comparisons
* Performance trends

Do not invent unsupported metrics.
Handle API differences between Instagram and YouTube explicitly.
Never substitute fabricated engagement data while labeling it live.
Demo datasets may exist, but must be clearly marked synthetic.
14.2 Performance Feedback Loop
Use actual performance information to improve future highlight recommendations.
Pipeline:
Published clips → Platform analytics → Normalized performance data → Content feature comparison → Ranking adjustment → Future highlight recommendations.
Features may include:

* Topic
* Clip duration
* Opening hook type
* Transcript content
* Engagement signals
* Screen activity
* Caption style
* Post timing
* Retention where available

Normalize performance carefully.
A newly published video with little data should not be treated as a proven failure.
Avoid making false causal claims from limited engagement data.
Persist recommendations and explain why ranking weights change.
Provide a dashboard explaining the feedback process.
SECTION 15 — SAAS MANAGEMENT
Build multi-user and multi-workspace capability.
Authentication
Supabase Auth.
Support:

* Registration
* Login
* Logout
* Session management
* Password reset
* Protected routes

Implement OAuth providers only when their credentials are configured.
Organizations
Each institute should have:

* Workspace profile
* Members
* Roles
* Brand kits
* Video projects
* Media assets
* Connected social accounts
* Usage statistics

Implement secure organizational isolation.
Subscription Management
Build:

* Free plan
* Higher plan definitions
* Feature entitlements
* Usage tracking
* Export limits
* Processing credits
* Subscription status
* Billing history model

Because the hackathon must cost ₹0, use a clearly identified billing sandbox/test environment.
Do not activate live charges without owner authorization.
Stripe test mode can be evaluated if compatible with the requirements and access constraints.
A real paid subscription gateway is additional SaaS functionality, not a condition for satisfying the official PS.
Never pretend sandbox transactions are real charges.
SECTION 16 — SUPABASE DATABASE AND SECURITY
Use Supabase PostgreSQL as the application's main database.
Create version-controlled SQL migrations.
Proposed table groups:
Identity

* profiles
* organizations
* organization_members

Projects

* projects
* source_recordings
* media_assets
* transcripts
* transcript_words
* technical_glossaries
* highlight_candidates
* highlight_clips

Editing

* timelines
* timeline_revisions
* render_jobs
* brand_kits
* export_assets

Social Media

* social_accounts
* publish_jobs
* published_posts
* platform_metrics
* analytics_snapshots
* feedback_recommendations

Billing

* subscription_plans
* subscriptions
* usage_records

Operations

* job_events
* audit_events

Adjust table names and normalization based on actual design requirements.
Do not create redundant tables simply to match the list.
Mandatory Security

* Enable Row Level Security for exposed tables.
* Enforce organization ownership and membership.
* Use secure server-side authorization.
* Never expose Supabase service-role/secret keys in frontend code.
* Encrypt external OAuth tokens server-side.
* Use private storage by default.
* Use signed URLs where required.
* Enforce file access permissions.
* Validate inputs and uploaded media.
* Apply rate limits and processing quotas.
* Avoid command injection in FFmpeg executions.
* Never execute untrusted uploaded code.
* Protect local processing endpoints from anonymous public abuse.
* Require authentication on render/upload/publish operations.
* Validate OAuth redirect destinations.
* Implement appropriate CORS restrictions.

Before database implementation, consult current Supabase documentation and changelog.
Use official Supabase migration tooling.
Check database security and RLS policies before deployment.
SECTION 17 — MONOREPO STRUCTURE
Create a clean repository with approximately this architecture:

```
Reel-Studio/
├── README.md
├── LICENSE
├── .gitignore
├── .env.example
├── CLAUDE.md
├── AGENTS.md
├── package.json
├── pnpm-workspace.yaml
├── pnpm-lock.yaml
│
├── apps/
│   ├── web/
│   │   ├── app/
│   │   ├── components/
│   │   │   ├── layout/
│   │   │   ├── dashboard/
│   │   │   ├── studio/
│   │   │   ├── editor/
│   │   │   ├── publishing/
│   │   │   └── analytics/
│   │   ├── features/
│   │   ├── hooks/
│   │   ├── lib/
│   │   ├── stores/
│   │   ├── types/
│   │   ├── public/
│   │   └── tests/
│   │
│   └── api/
│       ├── app/
│       │   ├── main.py
│       │   ├── api/
│       │   ├── core/
│       │   ├── schemas/
│       │   ├── services/
│       │   │   ├── transcription/
│       │   │   ├── highlights/
│       │   │   ├── screen_analysis/
│       │   │   ├── captions/
│       │   │   ├── generation/
│       │   │   ├── rendering/
│       │   │   ├── publishing/
│       │   │   └── analytics/
│       │   ├── workers/
│       │   └── integrations/
│       ├── tests/
│       └── requirements/
│
├── packages/
│   ├── shared-types/
│   ├── timeline-schema/
│   ├── video-templates/
│   └── ui/
│
├── supabase/
│   ├── migrations/
│   └── seed.sql
│
├── scripts/
├── tests/
│   ├── e2e/
│   ├── integration/
│   └── fixtures/
│
├── docs/
│   ├── MASTER_PROMPT.md
│   ├── ORIGINAL_PS.md
│   ├── PHASES.md
│   ├── ARCHITECTURE.md
│   ├── DATA_MODEL.md
│   ├── API_CONTRACTS.md
│   ├── DECISIONS.md
│   ├── CURRENT_TASK.md
│   ├── HANDOFF.md
│   ├── TEST_STATUS.md
│   ├── DEPLOYMENT.md
│   ├── ENVIRONMENT.md
│   ├── THIRD_PARTY_LICENSES.md
│   └── JUDGE_DEMO.md
│
└── .github/
    ├── workflows/
    ├── ISSUE_TEMPLATE/
    └── pull_request_template.md
```

The structure is a starting architectural contract.
Refine it when necessary, but document structural changes.
Avoid duplicate business logic across services.
Keep source files appropriately modular.
Do not put secrets or large video binaries into Git.
Use Git LFS only if necessary and if its limits are compatible with our ₹0 requirement.
SECTION 18 — INTERNAL API CONTRACTS
Before implementing independent modules, define common schemas.
At minimum:
Processing Job

* job_id
* organization_id
* project_id
* job_type
* status
* progress
* current_stage
* error
* created_at
* updated_at

Transcript Word

* id
* start
* end
* raw_text
* corrected_text
* confidence
* metadata

Highlight Candidate

* id
* source_recording_id
* start
* end
* duration
* score
* explanation
* selected

Crop Keyframe

* timestamp
* region
* crop_x
* crop_y
* crop_width
* crop_height
* transition_mode

Video Composition

* id
* duration
* fps
* resolution
* aspect_ratio
* tracks
* assets
* captions
* brand_snapshot
* render_settings

Published Video

* id
* project_id
* platform
* platform_media_id
* published_at
* status
* metrics_reference

Use versioned schemas for cross-language API contracts.
Create typed client bindings where practical.
All long-running API operations should return a job ID and support progress polling or subscriptions.
SECTION 19 — COMPLETE DEVELOPMENT PHASES
We will work in phases to produce a genuine, traceable development history.
Every phase must have:

* Clear objectives
* Specific implementation tasks
* Working vertical slices
* Tests
* Commits
* Documentation updates
* Integration verification
* Completion criteria

Do not postpone all tests and integration until the final phase.
Develop in parallel where appropriate, but keep shared contracts stable.
PHASE 00 — REPOSITORY, CONTRIBUTORS AND PROJECT FOUNDATION
Tasks

1. Authenticate GitHub.
2. Verify repository ownership and remote.
3. Invite the three specified collaborators.
4. Verify invitation results.
5. Clone the empty repository.
6. Initialize project files.
7. Save this exact master prompt to `docs/MASTER_PROMPT.md`.
8. Save the original PS to `docs/ORIGINAL_PS.md`.
9. Create `CLAUDE.md` and `AGENTS.md`.
10. Install Ponytail.
11. Set up applicable design skills.
12. Create phase documentation.
13. Set up `.gitignore`, `.env.example` and README.
14. Define the preliminary architecture.
15. Define a third-party license inventory.
16. Create GitHub issue labels and phase tracking where available.
17. Establish the code review and branching workflow.

Acceptance Criteria

* Correct repository initialized
* Collaborator invitations sent or exact blocker documented
* Master prompt preserved
* Clear source structure
* Initial documentation committed
* No secrets committed
* Correct remote configured

Create genuine initialization commits.
PHASE 01 — FRONTEND, AUTHENTICATION, DATABASE AND DEPLOYMENT
Tasks

1. Initialize Next.js application.
2. Configure TypeScript and Tailwind.
3. Create foundational UI components.
4. Create premium application layout.
5. Configure Supabase client and SSR authentication.
6. Implement registration/login/logout.
7. Implement protected routes.
8. Implement workspace model.
9. Create initial SQL migrations.
10. Add Row Level Security.
11. Create FastAPI service.
12. Create API health endpoint.
13. Configure frontend/backend communication.
14. Add local environment setup.
15. Configure Vercel deployment.
16. Connect GitHub repository to Vercel.
17. Add deployment documentation.
18. Implement frontend handling when the GPU backend is offline.

Acceptance Criteria

* Landing page deployed
* Login works
* Workspace creation works
* Dashboard renders authenticated data
* API health checks pass
* Supabase authorization is tested
* Public Vercel URL exists and is documented

PHASE 02 — RECORDING INGESTION AND TRANSCRIPTION
Tasks

1. Build recording-upload UI.
2. Implement backend media ingestion.
3. Validate inputs.
4. Extract metadata.
5. Extract and normalize audio.
6. Implement faster-whisper.
7. Integrate WhisperX alignment.
8. Store transcript with timestamps.
9. Implement technical glossary correction.
10. Create transcript editor.
11. Implement progress updates.
12. Add failure handling and retries.
13. Benchmark transcription performance.

Acceptance Criteria

* Real recording uploads successfully
* Audio extraction works
* Hinglish transcript produced
* Word timings available
* Technical terms can be corrected
* Transcript is stored persistently
* User sees genuine processing status

PHASE 03 — HIGHLIGHT SELECTION AND SCREEN INTELLIGENCE
Tasks

1. Build speech-energy analysis.
2. Detect silence and pauses.
3. Detect major screen changes.
4. Analyze code/screen activity.
5. Generate semantic highlight candidates.
6. Score complete-thought boundaries.
7. Rank multiple clips.
8. Detect duplicate highlights.
9. Build clip selection UI.
10. Implement smart active-region detection.
11. Implement code-aware reframing.
12. Add temporal smoothing.
13. Provide crop preview/override controls.
14. Test representative judge-style screen recordings.

Acceptance Criteria

* Highlights are genuinely derived from source recording
* Clips are generally 30–60 seconds
* Clip boundaries are semantically coherent
* Screen-aware reframing changes based on content
* Code remains meaningfully readable
* Clip selection is editable and persisted

PHASE 04 — CAPTIONS, BRANDING AND HYPERFRAMES RENDERING
Tasks

1. Integrate Hyperframes.
2. Build rendering adapter.
3. Create synchronized caption compositions.
4. Add technical vocabulary styling.
5. Add code formatting.
6. Add automatic brand-kit integration.
7. Create reusable intro/outro templates.
8. Build video export pipeline.
9. Implement MP4 quality settings.
10. Add thumbnails and previews.
11. Optimize render performance.
12. Add caching for re-rendering.
13. Verify timing consistency.
14. Test complete recording-to-video workflow.

Acceptance Criteria
A user can upload a recorded programming class and export a real, professional-looking 9:16 educational reel with:

* Selected meaningful highlight
* Intelligent framing
* Accurate captions
* Branded visuals
* Audio synchronization

PHASE 05 — TOPIC-TO-VIDEO GENERATION
Tasks

1. Build topic input UI.
2. Implement local LLM script generation.
3. Implement storyboard generation.
4. Generate technical code examples.
5. Validate code examples where possible.
6. Generate code animations.
7. Integrate local TTS.
8. Calculate narration timing.
9. Generate word-level captions.
10. Apply branding.
11. Render final video with Hyperframes.
12. Support editing and exporting.
13. Test multiple topics.

Acceptance Criteria
Entering `JSON vs XML` produces a real approximately 45-second video with:

* Accurate script
* Meaningful code animation
* Voiceover
* Synchronized captions
* Professional visual design
* Valid downloadable MP4

PHASE 06 — ADVANCED TIMELINE EDITOR
Tasks

1. Implement canonical timeline data model.
2. Build multi-track UI.
3. Add video tracks.
4. Add audio tracks.
5. Add captions/text tracks.
6. Add drag-and-drop editing.
7. Add split/trim operations.
8. Add transitions.
9. Add property inspector.
10. Add position/crop adjustment.
11. Add undo/redo.
12. Add live preview.
13. Add autosave.
14. Add efficient re-rendering.
15. Preserve AI-generated clip metadata.
16. Test preview/export consistency.

Acceptance Criteria
Users can meaningfully edit either AI-generated video type and export the modified result.
A boundary change must alter the actual rendered video.
PHASE 07 — INSTAGRAM AND YOUTUBE PUBLISHING
Tasks

1. Integrate official Instagram authorization.
2. Implement account connection.
3. Integrate official YouTube OAuth.
4. Store tokens securely.
5. Implement publishing services.
6. Build publishing calendar.
7. Build scheduled-job system.
8. Implement retry and status handling.
9. Add upload/public-media delivery.
10. Support multiple connected accounts.
11. Record platform post identifiers.
12. Test with authorized developer accounts.
13. Document permission limitations.

Acceptance Criteria

* Connected accounts are securely stored
* Scheduling jobs persist
* Publishing is attempted through real official APIs
* Actual platform responses determine status
* Successful authorized live tests are recorded
* External approval blockers are clearly documented

PHASE 08 — ANALYTICS, FEEDBACK AND SAAS MANAGEMENT
Tasks

1. Retrieve available Instagram analytics.
2. Retrieve available YouTube analytics.
3. Normalize provider data.
4. Build performance dashboard.
5. Compare videos.
6. Generate data-backed insights.
7. Implement feedback-based highlight ranking.
8. Build organization/team settings.
9. Implement subscription models.
10. Implement usage limits.
11. Implement test-mode billing workflow.
12. Build audit/usage history.
13. Test organizational data isolation.

Acceptance Criteria

* Analytics show real retrieved data where authorized
* Synthetic fixtures are labeled
* Feedback produces measurable recommendation changes
* User/workspace data isolation holds
* Subscription entitlements function without requiring real charges

PHASE 09 — FINAL INTEGRATION, TESTING AND HACKATHON SUBMISSION
Tasks

1. Audit every official PS requirement.
2. Audit every requested extra capability.
3. Run full end-to-end tests.
4. Test fresh registration.
5. Test recording ingestion.
6. Test transcription.
7. Test generated highlights.
8. Test smart reframing.
9. Test caption synchronization.
10. Test code formatting.
11. Test brand kit.
12. Test timeline editing.
13. Test topic-to-video.
14. Test exports.
15. Test social scheduling.
16. Test available live publishing integration.
17. Test analytics and feedback.
18. Verify Supabase security.
19. Verify deployment environment.
20. Review UI responsiveness and accessibility.
21. Run Ponytail code review.
22. Run Hallmark frontend audit.
23. Fix critical issues.
24. Prepare judge demonstration.
25. Update final documentation.
26. Verify the deployed frontend and real backend connectivity.
27. Prepare the final GitHub and Vercel links.

Acceptance Criteria

* Core workflows function end to end
* Judge-style test pack has reproducible results
* Critical bugs are resolved
* No exposed secrets
* No fake claims
* Git history is genuine and understandable
* README explains setup and usage
* Deployment link is accessible
* Final demo is rehearsable and documented

SECTION 20 — GIT AND COLLABORATION WORKFLOW
Create genuine continuous development history through actual work.
Branching
Use:

* `main` for verified integrated code
* `feature/<name>` for isolated features
* `fix/<name>` for bug fixes

Feature branches should use focused pull requests where appropriate.
Preserve the actual authorship of teammate commits.
Do not squash away meaningful collaborative history unnecessarily.
Commits
Use clear conventional commit messages such as:

* `chore: initialize reel studio monorepo`
* `feat(auth): implement supabase authentication`
* `feat(transcription): add local speech processing`
* `feat(highlights): implement candidate clip selection`
* `feat(editor): add multi-track timeline`
* `fix(render): correct caption timing offset`
* `test(api): cover publishing job retries`
* `docs: update deployment instructions`

Commit after meaningful verified changes.
Do not postpone all commits until the entire project is finished.
Do not make artificial commits merely to increase commit count.
Do not modify Git author dates, commit timestamps or identities to create a misleading project history.
Before pushing, review:

* Git status
* Changed files
* Tracked secrets
* Tests
* Build status

Avoid force-pushing shared branches.
Collaboration
Make tasks and module ownership clear through GitHub issues.
Allow team members to work in parallel on independent parts of the system.
Use actual pull requests for integration.
Do not attribute another person's work to a teammate who did not perform it.
Vercel Hobby Collaboration
Vercel Hobby may reject Git-triggered deployments when the commit author is not the owner of the connected Hobby project.
Do not spoof commit authors to bypass this.
Preserve genuine Git history and use an authorized owner-operated Vercel deployment workflow when necessary.
Keep the public deployed site updated after verified integration milestones.
SECTION 21 — CREDENTIALS AND OWNER INTERACTION
You are permitted to ask the project owner for credentials and account configuration when necessary.
However, NEVER ask the owner to paste private tokens directly into a public repository, issue, PR, documentation file, or frontend source.
Prefer CLI authentication, secure environment files, Supabase configuration, Vercel environment secrets and authorized OAuth flows.
Credentials/Accounts That May Be Required
GitHub:

* Authenticated GitHub CLI session
* Repository administrative access

Supabase:

* Supabase project URL
* Supabase publishable key
* Secure server-side secret configuration
* Supabase project access

Vercel:

* Authorized Vercel CLI account
* Correct GitHub integration
* Environment configuration

Instagram:

* Meta developer application
* Eligible professional Instagram account
* Appropriate publishing permissions
* OAuth credentials
* Authorized test account

YouTube:

* Google Cloud project
* YouTube Data API
* YouTube Analytics API
* OAuth client configuration
* Authorized YouTube channel

Billing sandbox:

* Test-mode provider setup only if implemented

Tunnel:

* Free approved HTTPS tunnel configuration

Credential Request Protocol
When credentials become necessary:

1. Explain which service needs configuration.
2. Explain why.
3. State whether the information is public configuration or a secret.
4. Guide the owner to enter secrets through the correct local/dashboard interface.
5. Do not echo sensitive values back.
6. Do not print secrets in logs.
7. Continue work on unblocked modules.

Batch related setup requirements whenever appropriate.
Ask for genuinely missing credentials, not previously supplied information.
Do not claim account access you do not have.
SECTION 22 — QUALITY ENGINEERING AND TESTING
Use:

* TypeScript linting and type checks
* Python formatting/linting
* Pytest
* Frontend unit tests
* API integration tests
* Playwright E2E tests
* FFmpeg/FFprobe media verification
* Database/RLS tests
* Editor timeline serialization tests
* Background job tests

Specific Test Scenarios
Hinglish
Use mixed Hindi-English recordings with technical vocabulary.
Test correct spelling and timing.
Clip Completeness
Ensure clips do not cut mid-sentence or omit essential conclusions.
Technical Terms
Test:

* Kubernetes
* useEffect
* @Autowired
* Docker
* JSON
* XML

Code Reframing
Test:

* Scrolling code
* Cursor movement
* Diagrams
* Small fonts
* Long lines
* Screen switching

Editor
Test:

* Split
* Trim
* Reorder
* Save/reopen
* Undo/redo
* Render modified clip

Publishing
Test:

* Valid account
* Invalid token
* Upload failure
* Retry
* Cancellation
* Duplicate scheduling
* Published state

Analytics
Test:

* Empty metrics
* Delayed metrics
* Available metrics
* Missing provider metrics
* Cross-platform normalization

Security
Test:

* Unauthorized project access
* Cross-organization access
* Invalid uploads
* Oversized uploads
* Token exposure
* Invalid ownership
* Failed authentication

Never label unrun tests as passed.
Keep a test status document listing verified, failed, blocked and untested cases.
SECTION 23 — PERFORMANCE AND RELIABILITY
Optimize for realistic local hardware.
Do not overload the GPU with multiple concurrent large AI models.
Use:

* Job concurrency limits
* Model memory management
* Video frame sampling
* Cached OCR results
* Cached transcription
* Cached scene analysis
* Reusable intermediate media
* Incremental rendering where practical
* Temporary-file cleanup
* Retry limits
* Timeouts
* Progress reporting

Persist job state so workers can recover from crashes.
A backend restart must not silently mark unfinished jobs as completed.
Use consistent identifiers and idempotent task execution.
Document realistic processing times from measured benchmarks rather than promises.
SECTION 24 — MASTER PROMPT AND CONTEXT PERSISTENCE
This is mandatory.
Claude Code will eventually encounter context limits.
The repository itself must serve as durable project memory.
24.1 Save Original Master Prompt
Create:
`docs/MASTER_PROMPT.md`
Paste the entire original master prompt into this file without omitting sections or summarizing it.
Do this during Phase 00.
Do not include live credentials or secret values in this document.
24.2 Persistent Instruction Files
Create:
`CLAUDE.md`
This file must include:

* Project identity
* Main development rules
* Non-negotiable requirements
* Technology decisions
* Repository conventions
* No-Claude-contributor policy
* Phase workflow
* Mandatory reading order
* Required testing procedure
* Documentation update requirements

Create:
`AGENTS.md`
Keep compatible project-wide engineering rules there, without conflicting duplicate instructions.
24.3 Progress Documentation
Maintain:
`docs/PHASES.md`

* Current phase
* Phase objectives
* Completed requirements
* Remaining requirements
* Dependencies
* Acceptance results

`docs/CURRENT_TASK.md`

* Current exact task
* Files being modified
* Goal
* Known blockers
* Next action

`docs/HANDOFF.md`

* Current verified system state
* Work completed
* Unfinished work
* Last successful tests
* Last failed tests
* Environment dependencies
* Important decisions
* Next implementation actions

`docs/ARCHITECTURE.md`

* Overall architecture
* Data flow
* Service contracts
* Rendering pipeline
* Deployment architecture

`docs/DECISIONS.md`

* Significant technical decisions
* Alternatives considered
* Reasons
* Trade-offs

`docs/TEST_STATUS.md`

* Actual test status
* Commands run
* Known failures
* Unverified features

`docs/DEPLOYMENT.md`

* Vercel deployment
* Backend setup
* Supabase configuration
* Tunnel setup
* Environment configuration
* Known limitations

Update these as development progresses.
24.4 Mandatory Session Reading Order
At the beginning of a new or compacted Claude session, read:

1. `CLAUDE.md`
2. `docs/MASTER_PROMPT.md`
3. `docs/ORIGINAL_PS.md`
4. `docs/PHASES.md`
5. `docs/ARCHITECTURE.md`
6. `docs/DECISIONS.md`
7. `docs/CURRENT_TASK.md`
8. `docs/HANDOFF.md`
9. `docs/TEST_STATUS.md`
10. `docs/DEPLOYMENT.md`
11. Recent Git log
12. Git status
13. Relevant source files for the current task

Do not blindly reload the entire repository if only a subset of code is needed.
Do not rely on remembered assumptions when repository documentation or Git history provides authoritative evidence.
24.5 Before Context Compaction
When instructed by the owner to prepare for compaction:

1. Stop beginning new features.
2. Inspect Git status.
3. Review uncommitted changes.
4. Run relevant available tests.
5. Commit completed meaningful work under the genuine human operator identity.
6. Do not hide or discard unfinished modifications.
7. Update phase status.
8. Update current task.
9. Update handoff.
10. Update test status.
11. Record deployment state.
12. Record environment blockers without exposing secrets.
13. Record exact next actions.
14. Push verified commits when safe.
15. Summarize the resulting commit SHAs and any uncommitted changes.

Never commit secrets.
Never state the tree is clean unless verified.
Do not claim unfinished work is complete.
24.6 After Context Compaction
When resumed:

1. Read the mandatory documents in order.
2. Inspect recent commits and working tree.
3. Reconstruct current project state.
4. Check whether any unfinished work conflicts with committed code.
5. Continue from the documented current task.
6. Avoid rebuilding completed functionality.
7. Run necessary checks before editing.
8. Preserve all previous architecture decisions unless clearly superseded.

The project must remain understandable and maintainable even if conversational history is lost.
SECTION 25 — README AND HACKATHON PRESENTATION
Build a professional GitHub README that explains:

* Problem statement
* Our solution
* Major capabilities
* Architecture
* Technology stack
* AI workflow
* Demo images
* Installation instructions
* Configuration
* Local backend setup
* Deployment link
* Usage guide
* Testing
* Limitations
* Team members
* Third-party acknowledgments

Only list real functionality as complete.
Clearly distinguish between fully working integrations and capabilities blocked by external approvals.
Include attribution and notices required by reused dependencies.
Do not add Claude or Anthropic to the contributor/team section.
Judge Presentation
Prepare a reproducible live demonstration.
Demo 1
Upload a real programming class recording.
Show:

* Hinglish transcript
* Corrected technical terms
* Word timings
* AI highlight selection
* Complete thought boundaries
* Active code-region tracking
* Vertical reframing
* Final polished reel
* Downloaded MP4

Demo 2
Enter:
`JSON vs XML`
Show:

* Generated script
* Animated code
* Generated voiceover
* Captions
* 45-second finished video

Demo 3
Modify a generated clip in the timeline.
Show the actual re-rendered result.
Demo 4
Show:

* Social account connection
* Scheduled publishing
* Publishing status
* Available analytics
* Performance-informed future highlight recommendations

Demo 5
Show:

* Organization/workspace
* Brand-kit application
* Projects library
* Subscription/usage management

Use genuine results.
Do not create misleading pre-recorded demonstrations that pretend to be live processing.
Prepared sample recordings and cached outputs are acceptable as performance safeguards if identified honestly.
Maintain a judge test pack with known inputs, expected outputs and reproducible verification steps.
SECTION 26 — ACCEPTANCE GATES AND PRIORITIZATION
The complete requested product remains in scope.
However, prioritize engineering in dependency order.
Priority hierarchy:

1. Official PS core functionality
2. End-to-end export reliability
3. Accurate Hinglish and technical code handling
4. Intelligent reframing
5. Editing
6. Topic-generation mode
7. Social publishing
8. Analytics feedback
9. Additional SaaS management
10. Additional visual polish

This hierarchy determines engineering sequencing, not permission to omit later modules.
Never mark a phase complete merely because its screens exist.
Each phase passes only when its acceptance criteria are verified.
If external approvals cannot be completed within the hackathon:

* Implement the official integration properly.
* Test everything permitted.
* Record the external approval blocker.
* Clearly distinguish unverified live operations.
* Continue other work.

For severe time pressure, favor completing integrated vertical slices rather than generating disconnected features.
SECTION 27 — EXPECTED WORKING STYLE
Act as an autonomous but disciplined senior engineering team.
Before implementing each phase:

* Read relevant existing files.
* Identify integration dependencies.
* Select minimal suitable libraries.
* Define interfaces.
* Implement.
* Test.
* Review.
* Commit.
* Update documentation.

Do not spend the entire development window repeatedly generating plans.
Do not perform unnecessary rewrites.
Do not silently introduce architecture drift.
Use Ponytail's engineering guidance to prefer simple verified solutions.
Be skeptical of claims that a repository or library solves more than it actually does.
Evaluate security and licensing before importing external code.
Use real error handling and loading states.
Avoid hardcoded fake production data.
Create design-consistent, accessible, useful interfaces.
Use GitHub issues and pull requests for real collaborative work.
Keep the product deployable after each integration milestone.
SECTION 28 — IMMEDIATE EXECUTION INSTRUCTIONS
Begin NOW.
STEP 1
Verify GitHub authentication and the existing Reel Studio repository.
Invite:

* `sahillokhande5841-cmyk`
* `Atharva486dherange`
* `SK999CodingWorld`

Verify invitation status and report any blocker.
STEP 2
Clone:
https://github.com/sahilkarande0918-cmd/Reel-Studio.git
Inspect the repository.
STEP 3
Initialize project documentation and save this entire master prompt to:
`docs/MASTER_PROMPT.md`
Create:

* `CLAUDE.md`
* `AGENTS.md`
* `docs/ORIGINAL_PS.md`
* `docs/PHASES.md`
* `docs/ARCHITECTURE.md`
* `docs/CURRENT_TASK.md`
* `docs/HANDOFF.md`
* `docs/DECISIONS.md`
* `docs/TEST_STATUS.md`
* `docs/DEPLOYMENT.md`

STEP 4
Install Ponytail for Claude Code.
Verify its installation.
Prepare the selected design tooling.
STEP 5
Review the mandatory external repositories and validate licensing, versions and integration points.
STEP 6
Initialize the actual monorepo, backend and frontend foundation.
STEP 7
Make the first genuine development commits and push them to the correct remote when safe.
STEP 8
Start Phase 01.
Request Supabase or Vercel account authentication only when needed.
Work on independent tasks while awaiting credentials.
STEP 9
Deploy the frontend early and maintain its deployment through later phases.
STEP 10
Continue phase by phase with real code, real tests, real commits and updated handoffs.
FINAL INSTRUCTIONS
You are not being asked to generate a roadmap and stop.
You are being asked to build Reel Studio.
Use the complete original PS as the core product contract.
Use all agreed technologies and appropriately licensed repositories.
Preserve the ₹0 requirement.
Prioritize genuine working code and a strong live demonstration.
Maintain authentic Git history and team collaboration.
Never add Claude as a repository contributor, co-author or team member.
Preserve this prompt and the project state for future context handoffs.
When a real blocker requires owner action, describe that blocker precisely and request only the necessary action.
Otherwise continue implementing autonomously.
START WITH PHASE 00: GITHUB COLLABORATOR INVITATIONS, REPOSITORY INITIALIZATION AND MASTER PROMPT PRESERVATION.
