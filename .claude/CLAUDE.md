# Full-Stack Blog Platform Project Guide

## Project Context
A modern, full-stack personal blog platform. Includes a public-facing reader view and a secured admin dashboard for creating and modifying posts. Built with Vite, React, and Supabase for authentication and database management.

## Current Status
- **Completed this session:**
  - ✅ Rich text editor (Tiptap v3) with headings, bold, italic, lists, links, blockquotes, code blocks, image upload
  - ✅ Image upload via Supabase Storage (`post-images` bucket, auth-only uploads, public reads)
  - ✅ DOMPurify-sanitized HTML rendering on public BlogPost page (with legacy plain-text fallback)
  - ✅ Server-side pagination (7 posts/page, `.range()` + `{ count: 'exact' }`)
  - ✅ Search bar on Home page (client-side filter by title/excerpt)
  - ✅ 404 Not Found page (unmatched routes + invalid blog slugs)
  - ✅ Dark mode toggle in navbar (manual override via `data-theme` attr + localStorage, system fallback)

- **Next Steps (pick up here):**
  - Add post tags / categories and filtering on the Home page
  - Add SEO meta tags (react-helmet-async) and Open Graph images
  - Improve the admin dashboard — post preview, draft/publish states
  - Write tests (Vitest + React Testing Library)
  - Run `database.db` Storage SQL in Supabase Dashboard if not done yet

## Tech Stack
- **Frontend:** React (Functional components, Hooks)
- **Routing:** React Router
- **Backend/Database:** Supabase (PostgreSQL, Supabase Auth, Supabase Storage)
- **Styling:** Vanilla CSS (CSS custom properties in `index.css`) + Tailwind CSS v4 (available for new components)
- **Rich Text:** Tiptap v3 (`@tiptap/react`, `@tiptap/starter-kit`, `@tiptap/extension-image`)
- **HTML Sanitization:** DOMPurify
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
  App.jsx                    — Root component with Layout wrapper + React Router (catch-all 404 route)
  main.jsx                   — Entry point, imports index.css
  index.css                   — All styles (CSS variables, components, pages, responsive, dark mode)
  lib/
    supabaseClient.js        — Supabase client init (null-safe if credentials missing)
  components/
    Navbar.jsx               — Sticky nav + Home/Dashboard/Logout or Login + dark mode toggle
    Footer.jsx               — Site footer with copyright + links
    ArticleCard.jsx          — Clickable card (title, excerpt, slug, date) → /blog/:slug
    ProtectedRoute.jsx       — Auth guard, redirects to /login if no session
    RichTextEditor.jsx       — Tiptap rich text editor: toolbar, link dialog, image upload via Supabase Storage
  pages/
    Home.jsx                 — Paginated post list (7/page), search bar, ArticleCard grid
    BlogPost.jsx             — Fetches single post by slug, renders sanitized HTML via DOMPurify
    Login.jsx                — Email/password form via supabase.auth.signInWithPassword
    AdminDashboard.jsx       — Full CRUD: list, create, edit, delete posts (modal form with RichTextEditor)
    NotFound.jsx             — 404 page (big code, title, back-to-home link)
database.db                  — SQL schema for Supabase (posts table + RLS + Storage bucket + policies)
vercel.json                  — SPA rewrite rule (all routes → index.html)
.env.local                   — Supabase credentials (gitignored)
```

## Code & Architecture Guidelines
- **JavaScript Preferences:** Heavily utilize modern ES6+ syntax. Make robust use of object/array destructuring, closures, async/await for database calls, and callback functions.
- **State Management:** Use standard React Hooks (`useState`, `useEffect`, `useMemo`, `useRef`, `useCallback`). Keep state close to where it's used.
- **CSS:** Primary styles in `src/index.css` using CSS custom properties defined in `:root`. Tailwind CSS v4 is installed and available (`@import "tailwindcss"` at top of index.css) for new components that benefit from utility classes. Responsive breakpoint at 640px.
- **Dark Mode:** Three-layer system on `<html>`: `data-theme="dark"` (manual), `data-theme="light"` (manual override of system dark), `@media (prefers-color-scheme: dark)` on `:root:not([data-theme])` (system fallback). Navbar `useTheme()` hook manages `localStorage` + `data-theme` attribute.
- **Content Storage:** Posts store HTML in the `content TEXT` column (from Tiptap's `getHTML()`). Old plain-text posts auto-detected and wrapped in `<p>` tags on render. DOMPurify sanitizes with a strict tag/attribute whitelist.

## Supabase & Security Guidelines
- **Authentication:** Use `@supabase/supabase-js` for handling admin login sessions. `ProtectedRoute` component wraps `/admin` — redirects to `/login` if no active session exists.
- **Storage:** Post images stored in Supabase Storage bucket `post-images` (public: true). RLS policies: authenticated users can upload/delete, public can read. Max 5MB per upload.
- **Client Safety:** `supabaseClient.js` exports `null` if credentials are missing (not configured). All components guard against `supabase` being null before calling `.auth.*`, `.from('*')`, or `.storage.*`.
- **Environment Variables:** Never hardcode API keys. Always rely on `import.meta.env.VITE_SUPABASE_URL` and `import.meta.env.VITE_SUPABASE_ANON_KEY`. Set these in Vercel project settings for deployment.
- **Data Fetching:** Isolate database calls in page components. Use async/await with error handling. Always destructure `{ data, error }` from Supabase responses. Pagination uses `.range(from, to)` with `{ count: 'exact' }`.

## Database Schema
Defined in `database.db`. Key table:
- **`posts`**: `id` (UUID PK), `slug` (unique), `title`, `excerpt`, `content`, `created_at` (TIMESTAMPTZ)
- RLS enabled: public read, authenticated users can manage (insert/update/delete)

Storage bucket:
- **`post-images`**: public bucket, RLS for authenticated upload/delete, public read

## Deployment Notes
- **Vercel:** Import the GitHub repo. Vercel auto-detects Vite. Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in project Settings → Environment Variables.
- **SPA Routing:** `vercel.json` contains a rewrite rule so all paths serve `index.html` — required for React Router to work on direct URL visits.
