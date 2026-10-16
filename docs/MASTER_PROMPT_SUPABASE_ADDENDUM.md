ADDITIONAL INSTRUCTION — SUPABASE SETUP FOR REEL STUDIO
This instruction supplements the complete Reel Studio master prompt. Follow all original project requirements, phases, GitHub collaboration rules, deployment instructions and ₹0 cost restrictions.
1. Supabase account situation
We are using my friend's Supabase account, NOT my personal Supabase account.
My friend has already created a Supabase organization and invited my Supabase account with the Developer role.
My personal Supabase environment contains a separate SaaS project. You must NEVER access, inspect, modify, migrate or connect to that project.
The only Supabase project you are allowed to work with is the dedicated Reel-Studio hackathon project under my friend's organization.
2. First verify the setup
Before configuring Supabase:

1. Verify that I have accepted the organization invitation.
2. Authenticate with Supabase CLI using my authorized Developer account.
3. List accessible organizations and projects if permitted.
4. Identify the correct organization owned by my friend.
5. Check whether a project named `Reel-Studio` already exists.
6. If the project exists, reuse it. Do NOT create a duplicate.
7. If the project does not exist, guide us through creating it on the Free plan.
8. If my Developer role cannot perform a required operation, tell me exactly what my friend must do using the Owner account.
9. Before applying database migrations, verify that the selected project reference ID belongs to Reel Studio.

Do not automatically select the first Supabase project returned by any CLI or connected tool.
3. Credentials you need to configure
Guide me through obtaining and securely configuring these values:
Required frontend configuration:

* `NEXT_PUBLIC_SUPABASE_URL`
* `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

Required project identification:

* Supabase Project Reference ID

Backend configuration, only when required:

* `SUPABASE_URL`
* `SUPABASE_SECRET_KEY`

Database management, when required:

* Supabase CLI authentication
* Database connection credentials or password if the operation requires them

Explain exactly where each setting is located in the Supabase dashboard.
The project URL, project reference and publishable key may be shared as configuration information.
Never ask me to paste secret API keys, personal access tokens, database passwords or account passwords into Claude chat.
Instead, instruct me to place them directly in ignored environment files, authenticated CLI sessions or secure deployment environment settings.
4. Configure Supabase completely
Set up:

* Supabase Authentication
* PostgreSQL database
* Required SQL tables and migrations
* Row Level Security
* Organization-based permissions
* Project and video metadata
* Transcripts and generated clips
* Timeline and rendering-job records
* Brand kits
* Social media account metadata
* Scheduled publishing records
* Analytics records
* Subscription and usage records
* Supabase Realtime for job status where appropriate
* Supabase Storage for selected small assets and outputs

Use local processing/storage for large recordings and heavy video-rendering files.
Ensure RLS is enabled on all application tables exposed through the Supabase API and create proper ownership/membership policies.
Do not disable RLS to fix an access error.
Never expose a Supabase secret or service-role key to the browser.
5. Integrate with Reel Studio
Connect the application architecture as follows:

* Next.js frontend deployed on Vercel
* Supabase Auth for users and sessions
* Supabase PostgreSQL for application data
* Supabase Realtime for processing updates
* Supabase Storage for suitable assets
* FastAPI running locally for AI/video processing
* Local worker for background jobs and scheduling

Configure appropriate Supabase authentication redirect URLs for local development and the actual Vercel production domain.
No direct GitHub-to-Supabase integration is required. The code remains in my GitHub repository:
https://github.com/sahilkarande0918-cmd/Reel-Studio
Maintain Supabase SQL migrations in that repository.
6. Verification and documentation
Before marking Supabase integration complete, verify:

1. The application connects to the correct Supabase project.
2. User authentication works.
3. Database migrations succeed.
4. Project data can be created and retrieved.
5. RLS blocks unauthorized cross-user and cross-organization access.
6. Realtime updates function where implemented.
7. Storage access policies are correct.
8. No sensitive credentials appear in Git history or the browser bundle.
9. The Vercel frontend uses the correct Supabase project.

Create or update `docs/ENVIRONMENT.md` and `docs/DEPLOYMENT.md` with setup instructions, but never include actual secret values.
Maintain the project handoff documentation established by the master prompt.
Important: Do not interrupt Phase 00's GitHub team invitation requirements. Complete the original Phase 00 instructions, then perform the appropriate Supabase setup as part of Phase 01. You may prepare configuration documentation earlier.
If any credential or account permission is missing, request only the exact necessary action from me. Otherwise continue implementing Reel Studio.
Our entire project must remain on the ₹0 development stack.
Do not add Claude as a GitHub contributor, commit co-author, credited team member or repository author.
Proceed according to the original master prompt.
