# Karolina — Backend & Admin Panel

A Node.js / Express / SQLite backend with a login-protected admin panel
to manage villa projects (details, specs, hero image, gallery, video).

## Quick start

```bash
# 1. Install dependencies
npm install

# 2. Create env file
cp .env.example .env
# edit .env — especially SESSION_SECRET and ADMIN_PASSWORD

# 3. Seed the database (creates super-admin + imports existing 8 villas)
npm run seed

# 4. Start the server
npm start              # production
npm run dev            # auto-restart on file changes (Node 18.11+)
```

Open **http://localhost:3000** — your static site runs as before.
Open **http://localhost:3000/admin** — login with the admin credentials from `.env`.

## What you get

| URL | What |
|---|---|
| `/` | The static site (index.html, all existing pages served as-is) |
| `/admin/login` | Admin login |
| `/admin` | Dashboard — list all projects, quick edit |
| `/admin/projects/new` | Add a new villa |
| `/admin/projects/:id/edit` | Edit a villa + manage gallery images |
| `/admin/users` | Manage admin users (super-admin only) |
| `/api/projects` | JSON list of all published projects (public read) |
| `/api/projects/:slug` | JSON single project by slug |
| `/assets/projects/<slug>/...` | Uploaded images |

## Roles

- `super` — full access incl. user management
- `editor` — can create/edit/delete projects but cannot manage other users

## Folder layout

```
server/
├── index.js              Express entry
├── db.js                 SQLite schema + helpers
├── seed.js               Initial admin + 8 existing villas
├── middleware/auth.js    Session auth + role gates
├── routes/
│   ├── admin.js          Login, dashboard, projects CRUD, users
│   └── api.js            Public read-only JSON API
├── views/admin/          EJS templates for admin UI
└── public/admin.css      Admin panel styles
server/data/karolina.db   SQLite database (gitignored)
assets/projects/<slug>/   Uploaded images (organised per villa)
```

## Connecting the static site to the API (optional next step)

The static HTML currently has project data hardcoded. To make the home
page and `projects.html` read from the admin-managed database, add a
small `<script>` that fetches `/api/projects` and renders the cards
dynamically. I can wire that up after you're comfortable with the admin
panel — just say the word.
