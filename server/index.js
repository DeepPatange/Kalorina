/**
 * Karolina Corporation — Express server
 *
 * Serves the existing static site AND a login-protected admin panel
 * that manages villa projects (details + images) via SQLite.
 */
require('dotenv').config();

const path       = require('path');
const express    = require('express');
const session    = require('express-session');
const SqliteStore = require('connect-sqlite3')(session);
const helmet     = require('helmet');
const methodOverride = require('method-override');

const db = require('./db');
db.init(); // ensure tables exist on startup

const adminRoutes  = require('./routes/admin');
const apiRoutes    = require('./routes/api');
const publicRoutes = require('./routes/public');

const app = express();
const PORT = process.env.PORT || 3000;
const ROOT = path.resolve(__dirname, '..');

/* ---------- view engine ---------- */
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

/* ---------- body parsers ---------- */
app.use(express.urlencoded({ extended: true, limit: '2mb' }));
app.use(express.json({ limit: '2mb' }));
app.use(methodOverride('_method')); // allows <form method="POST" action="?_method=DELETE">

/* ---------- security (relaxed so existing inline styles + external tiles work) ---------- */
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));

/* ---------- session ---------- */
const dataDir = path.join(__dirname, 'data');
require('fs').mkdirSync(dataDir, { recursive: true });

app.use(session({
  store: new SqliteStore({ db: 'sessions.db', dir: dataDir, table: 'sessions' }),
  secret: process.env.SESSION_SECRET || 'dev-only-change-me',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 1000 * 60 * 60 * 24 * 14 // 14 days
  }
}));

/* ---------- make `user` + flash available in every view ---------- */
app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  res.locals.flash = req.session.flash || null;
  delete req.session.flash;
  next();
});

/* ---------- admin-panel CSS ---------- */
app.use('/admin-static', express.static(path.join(__dirname, 'public')));

/* ---------- admin + API + public server-rendered routers ---------- */
app.use('/admin', adminRoutes);
app.use('/api', apiRoutes);
app.use('/', publicRoutes);   // /villa/:slug

/* ---------- serve the existing static site from project root ---------- */
app.use(express.static(ROOT, {
  extensions: ['html'],
  index: 'index.html',
  maxAge: process.env.NODE_ENV === 'production' ? '1d' : 0
}));

/* ---------- 404 ---------- */
app.use((req, res) => {
  if (req.path.startsWith('/admin') || req.path.startsWith('/api')) {
    return res.status(404).json({ error: 'Not found' });
  }
  res.status(404).send('<h1>404 — page not found</h1><a href="/">Return home</a>');
});

/* ---------- error handler ---------- */
app.use((err, req, res, next) => {
  console.error(err);
  if (req.path.startsWith('/api')) {
    return res.status(500).json({ error: err.message || 'Server error' });
  }
  res.status(500).render('admin/error', { message: err.message || 'Server error' });
});

app.listen(PORT, () => {
  console.log(`\n  Karolina  ▸  http://localhost:${PORT}`);
  console.log(`  Admin     ▸  http://localhost:${PORT}/admin\n`);
});
