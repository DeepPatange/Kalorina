/**
 * SQLite database layer — one file, no DB server required.
 */
const path = require('path');
const fs   = require('fs');
const Database = require('better-sqlite3');

const DATA_DIR = path.join(__dirname, 'data');
const DB_PATH  = path.join(DATA_DIR, 'karolina.db');

fs.mkdirSync(DATA_DIR, { recursive: true });

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

/* =========================================================
   SCHEMA
   ========================================================= */
function init() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      email         TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name          TEXT,
      role          TEXT NOT NULL DEFAULT 'editor',  -- 'super' | 'editor'
      created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at    DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS projects (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      slug          TEXT UNIQUE NOT NULL,
      name          TEXT NOT NULL,
      tagline       TEXT,
      location      TEXT,
      region        TEXT,
      architect     TEXT,
      status        TEXT,        -- Under Construction | Completed | In Development
      bhk           TEXT,
      builtup_sqft  TEXT,
      plot_sqft     TEXT,
      pool          TEXT,
      orientation   TEXT,
      bedrooms      TEXT,
      bathrooms     TEXT,
      parking       TEXT,
      ready_date    TEXT,
      typology      TEXT,
      description   TEXT,        -- long-form overview (markdown/plain)
      cover_image   TEXT,        -- relative URL, e.g. assets/projects/moonstone/hero.jpg
      hero_video    TEXT,        -- optional relative URL
      featured      INTEGER NOT NULL DEFAULT 0,  -- 1 = show on home
      published     INTEGER NOT NULL DEFAULT 1,  -- 0 = draft
      display_order INTEGER NOT NULL DEFAULT 0,
      created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at    DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS project_images (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id    INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      path          TEXT NOT NULL,        -- relative URL
      caption       TEXT,
      display_order INTEGER NOT NULL DEFAULT 0,
      created_at    DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_projects_slug      ON projects(slug);
    CREATE INDEX IF NOT EXISTS idx_projects_published ON projects(published, display_order);
    CREATE INDEX IF NOT EXISTS idx_pimg_project       ON project_images(project_id, display_order);
  `);
}

/* =========================================================
   USERS
   ========================================================= */
const users = {
  findByEmail: (email) =>
    db.prepare('SELECT * FROM users WHERE email = ?').get(email),
  findById:    (id) =>
    db.prepare('SELECT id, email, name, role, created_at FROM users WHERE id = ?').get(id),
  all: () =>
    db.prepare('SELECT id, email, name, role, created_at FROM users ORDER BY created_at DESC').all(),
  create: ({ email, password_hash, name, role }) =>
    db.prepare(`INSERT INTO users (email, password_hash, name, role)
                VALUES (?, ?, ?, ?)`).run(email, password_hash, name, role || 'editor'),
  update: (id, { name, role }) =>
    db.prepare(`UPDATE users SET name=?, role=?, updated_at=CURRENT_TIMESTAMP WHERE id=?`)
      .run(name, role, id),
  updatePassword: (id, password_hash) =>
    db.prepare(`UPDATE users SET password_hash=?, updated_at=CURRENT_TIMESTAMP WHERE id=?`)
      .run(password_hash, id),
  remove: (id) => db.prepare('DELETE FROM users WHERE id=?').run(id),
  count:  () => db.prepare('SELECT COUNT(*) AS n FROM users').get().n
};

/* =========================================================
   PROJECTS
   ========================================================= */
const projects = {
  all: (opts = {}) => {
    const where = opts.publishedOnly ? 'WHERE published = 1' : '';
    return db.prepare(`
      SELECT * FROM projects
      ${where}
      ORDER BY display_order ASC, created_at DESC
    `).all();
  },

  featured: () =>
    db.prepare(`
      SELECT * FROM projects
      WHERE published = 1 AND featured = 1
      ORDER BY display_order ASC, created_at DESC
    `).all(),

  findById: (id) => db.prepare('SELECT * FROM projects WHERE id = ?').get(id),
  findBySlug: (slug) => db.prepare('SELECT * FROM projects WHERE slug = ?').get(slug),

  create: (data) => {
    const cols = [
      'slug','name','tagline','location','region','architect','status',
      'bhk','builtup_sqft','plot_sqft','pool','orientation','bedrooms',
      'bathrooms','parking','ready_date','typology','description',
      'cover_image','hero_video','featured','published','display_order'
    ];
    // Default integer fields (featured/published/display_order) to 0/1 so NOT NULL is satisfied
    const defaults = { featured: 0, published: 1, display_order: 0 };
    const values = cols.map(c => data[c] ?? defaults[c] ?? null);
    const stmt = db.prepare(`
      INSERT INTO projects (${cols.join(',')})
      VALUES (${cols.map(() => '?').join(',')})
    `);
    return stmt.run(...values);
  },

  update: (id, data) => {
    const cols = [
      'slug','name','tagline','location','region','architect','status',
      'bhk','builtup_sqft','plot_sqft','pool','orientation','bedrooms',
      'bathrooms','parking','ready_date','typology','description',
      'cover_image','hero_video','featured','published','display_order'
    ];
    const setClause = cols.map(c => `${c}=?`).join(', ');
    const values = cols.map(c => data[c] ?? null);
    return db.prepare(`
      UPDATE projects SET ${setClause}, updated_at=CURRENT_TIMESTAMP
      WHERE id=?
    `).run(...values, id);
  },

  remove: (id) => db.prepare('DELETE FROM projects WHERE id=?').run(id),

  images: {
    forProject: (project_id) =>
      db.prepare(`
        SELECT * FROM project_images
        WHERE project_id = ?
        ORDER BY display_order ASC, created_at ASC
      `).all(project_id),

    add: ({ project_id, path, caption, display_order }) =>
      db.prepare(`
        INSERT INTO project_images (project_id, path, caption, display_order)
        VALUES (?, ?, ?, ?)
      `).run(project_id, path, caption || null, display_order || 0),

    remove: (id) => db.prepare('DELETE FROM project_images WHERE id = ?').run(id),
    findById: (id) => db.prepare('SELECT * FROM project_images WHERE id = ?').get(id),

    reorder: (id, display_order) =>
      db.prepare('UPDATE project_images SET display_order=? WHERE id=?').run(display_order, id),

    updateCaption: (id, caption) =>
      db.prepare('UPDATE project_images SET caption=? WHERE id=?').run(caption, id)
  }
};

module.exports = { db, init, users, projects };
