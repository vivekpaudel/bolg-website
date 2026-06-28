# Full-Stack Blog Platform Project Guide

## Project Context
A modern, full-stack personal blog platform. Includes a public-facing reader view and a secured admin dashboard for creating and modifying posts. Built with Vite, React, and Supabase for authentication and database management.

## Current Status
- **Next Steps (pick up here):**
  - Add a rich-text / Markdown editor for post content in AdminDashboard
  - Add image upload via Supabase Storage for post hero images
  - Add post tags / categories and filtering on the Home page
  - Add pagination or "load more" for the Home page post list
  - Add a 404 Not Found page for unmatched routes
  - Add dark mode toggle (CSS variables already in place via prefers-color-scheme)
  - Add SEO meta tags (react-helmet-async) and Open Graph images
  - Add Supabase real-time subscriptions for live post updates
  - Improve the admin dashboard — post preview, draft/publish states
  - Write tests (Vitest + React Testing Library)

## Tech Stack
- **Frontend:** React (Functional components, Hooks)
- **Routing:** React Router
- **Backend/Database:** Supabase (PostgreSQL, Supabase Auth)
- **Styling:** Vanilla CSS (CSS custom properties in `index.css`)
- **Language:** JavaScript (No TypeScript)
- **Deployment:** Vercel (auto-detects Vite)

## Core Commands
- **Development Server:** `npm run dev`
- **Build Project:** `npm run build`
- **Preview Build:** `npm run preview`

## Workspace Skills & Extensions
- **Skill Utilization:** Actively leverage the custom workspace skills and workflows defined in the `.claude/` directory and tracked in `skills-lock.json`.
- Before executing complex tasks (such as database migrations or code reviews), check if a specialized workspace skill is available.

## File Structure
```
src/
  App.jsx                    — Root component with Layout wrapper + React Router
  main.jsx                   — Entry point, imports index.css
  index.css                   — All styles (CSS variables, components, pages, responsive)
  lib/
    supabaseClient.js        — Supabase client init (null-safe if credentials missing)
  components/
    Navbar.jsx               — Sticky nav, shows Home + conditional Dashboard/Logout or Login
    Footer.jsx               — Site footer with copyright + links
    ArticleCard.jsx          — Clickable card (title, excerpt, slug, date) → /blog/:slug
    ProtectedRoute.jsx       — Auth guard, redirects to /login if no session
  pages/
    Home.jsx                 — Fetches all posts from Supabase, renders ArticleCard grid
    BlogPost.jsx             — Fetches single post by slug, renders full article
    Login.jsx                — Email/password form via supabase.auth.signInWithPassword
    AdminDashboard.jsx       — Full CRUD: list, create, edit, delete posts (modal form)
database.db                  — SQL schema for Supabase (posts table + RLS policies)
vercel.json                  — SPA rewrite rule (all routes → index.html)
.env.local                   — Supabase credentials (gitignored)
```

## Code & Architecture Guidelines
- **JavaScript Preferences:** Heavily utilize modern ES6+ syntax. Make robust use of object/array destructuring, closures, async/await for database calls, and callback functions.
- **State Management:** Use standard React Hooks (`useState`, `useEffect`). Keep state close to where it's used.
- **CSS:** All styles live in `src/index.css` using CSS custom properties defined in `:root`. No component-level CSS files. Responsive breakpoint at 640px.

## Supabase & Security Guidelines
- **Authentication:** Use `@supabase/supabase-js` for handling admin login sessions. `ProtectedRoute` component wraps `/admin` — redirects to `/login` if no active session exists.
- **Client Safety:** `supabaseClient.js` exports `null` if credentials are missing (not configured). All components guard against `supabase` being null before calling `.auth.*` or `.from('*')`.
- **Environment Variables:** Never hardcode API keys. Always rely on `import.meta.env.VITE_SUPABASE_URL` and `import.meta.env.VITE_SUPABASE_ANON_KEY`. Set these in Vercel project settings for deployment.
- **Data Fetching:** Isolate database calls in page components. Use async/await with error handling. Always destructure `{ data, error }` from Supabase responses.

## Database Schema
Defined in `database.db`. Key table:
- **`posts`**: `id` (UUID PK), `slug` (unique), `title`, `excerpt`, `content`, `created_at` (TIMESTAMPTZ)
- RLS enabled: public read, authenticated users can manage (insert/update/delete)

## Deployment Notes
- **Vercel:** Import the GitHub repo. Vercel auto-detects Vite. Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in project Settings → Environment Variables.
- **SPA Routing:** `vercel.json` contains a rewrite rule so all paths serve `index.html` — required for React Router to work on direct URL visits.
