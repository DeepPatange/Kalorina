/**
 * Admin routes — login, dashboard, projects CRUD, users CRUD.
 */
const path    = require('path');
const fs      = require('fs');
const express = require('express');
const bcrypt  = require('bcryptjs');
const multer  = require('multer');

const { users, projects } = require('../db');
const { requireLogin, requireSuper, redirectIfLoggedIn } = require('../middleware/auth');

const router = express.Router();
const ROOT = path.resolve(__dirname, '..', '..');

/* =========================================================
   MULTER — image upload configuration
   Uploaded files go to  assets/projects/<slug>/<timestamp>-<name>
   Admin must provide the project slug on the upload URL.
   ========================================================= */
function uploadStorageFor(slug) {
  return multer.diskStorage({
    destination: (req, file, cb) => {
      const dir = path.join(ROOT, 'assets', 'projects', slug);
      fs.mkdirSync(dir, { recursive: true });
      cb(null, dir);
    },
    filename: (req, file, cb) => {
      const safe = file.originalname.replace(/[^\w.\- ]+/g, '').replace(/\s+/g, '-');
      cb(null, `${Date.now()}-${safe}`);
    }
  });
}

function imageFilter(req, file, cb) {
  if (/^(image|video)\//.test(file.mimetype)) return cb(null, true);
  cb(new Error('Only image or video files are allowed.'));
}

/* =========================================================
   SLUG HELPER
   ========================================================= */
function slugify(s) {
  return (s || '')
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

/* =========================================================
   LOGIN / LOGOUT
   ========================================================= */
router.get('/login', redirectIfLoggedIn, (req, res) => {
  res.render('admin/login', {
    next: req.query.next || '/admin',
    error: null
  });
});

router.post('/login', redirectIfLoggedIn, (req, res) => {
  const { email, password, next } = req.body;
  const user = users.findByEmail((email || '').toLowerCase().trim());
  if (!user || !bcrypt.compareSync(password || '', user.password_hash)) {
    return res.status(401).render('admin/login', {
      next: next || '/admin',
      error: 'Invalid email or password.'
    });
  }
  req.session.user = { id: user.id, email: user.email, name: user.name, role: user.role };
  res.redirect(next && next.startsWith('/admin') ? next : '/admin');
});

router.post('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/admin/login'));
});

/* =========================================================
   DASHBOARD
   ========================================================= */
router.get('/', requireLogin, (req, res) => {
  const list = projects.all();
  res.render('admin/dashboard', { projects: list, userCount: users.count() });
});

/* =========================================================
   PROJECTS — list, new, edit, save, delete
   ========================================================= */
router.get('/projects', requireLogin, (req, res) => {
  res.render('admin/projects-list', { projects: projects.all() });
});

router.get('/projects/new', requireLogin, (req, res) => {
  res.render('admin/project-form', {
    project: {},
    images: [],
    isNew: true
  });
});

router.post('/projects', requireLogin, (req, res) => {
  const body = req.body;
  const slug = slugify(body.slug || body.name);
  if (!slug || !body.name) {
    req.session.flash = { type: 'error', text: 'Name and slug are required.' };
    return res.redirect('/admin/projects/new');
  }
  if (projects.findBySlug(slug)) {
    req.session.flash = { type: 'error', text: `Slug "${slug}" already exists. Pick another.` };
    return res.redirect('/admin/projects/new');
  }

  const result = projects.create({
    ...normalize(body),
    slug
  });
  req.session.flash = { type: 'success', text: 'Project created.' };
  res.redirect(`/admin/projects/${result.lastInsertRowid}/edit`);
});

router.get('/projects/:id/edit', requireLogin, (req, res) => {
  const p = projects.findById(req.params.id);
  if (!p) return res.redirect('/admin/projects');
  const imgs = projects.images.forProject(p.id);
  res.render('admin/project-form', { project: p, images: imgs, isNew: false });
});

router.post('/projects/:id', requireLogin, (req, res) => {
  const p = projects.findById(req.params.id);
  if (!p) return res.redirect('/admin/projects');

  const body = req.body;
  const slug = slugify(body.slug || body.name);
  const other = projects.findBySlug(slug);
  if (other && other.id !== p.id) {
    req.session.flash = { type: 'error', text: `Slug "${slug}" is already in use.` };
    return res.redirect(`/admin/projects/${p.id}/edit`);
  }

  projects.update(p.id, { ...normalize(body), slug });
  req.session.flash = { type: 'success', text: 'Project updated.' };
  res.redirect(`/admin/projects/${p.id}/edit`);
});

router.delete('/projects/:id', requireLogin, (req, res) => {
  projects.remove(req.params.id);
  req.session.flash = { type: 'success', text: 'Project deleted.' };
  res.redirect('/admin/projects');
});

/* =========================================================
   COVER / HERO VIDEO upload — tied to a project
   ========================================================= */
router.post('/projects/:id/cover', requireLogin, (req, res, next) => {
  const p = projects.findById(req.params.id);
  if (!p) return res.redirect('/admin/projects');

  const upload = multer({ storage: uploadStorageFor(p.slug), fileFilter: imageFilter }).single('cover');
  upload(req, res, (err) => {
    if (err) { req.session.flash = { type: 'error', text: err.message }; return res.redirect(`/admin/projects/${p.id}/edit`); }
    if (!req.file) { req.session.flash = { type: 'error', text: 'No file received.' }; return res.redirect(`/admin/projects/${p.id}/edit`); }
    const rel = `assets/projects/${p.slug}/${req.file.filename}`;
    const field = req.body.field === 'hero_video' ? 'hero_video' : 'cover_image';
    projects.update(p.id, { ...p, [field]: rel });
    req.session.flash = { type: 'success', text: `${field === 'hero_video' ? 'Hero video' : 'Cover image'} uploaded.` };
    res.redirect(`/admin/projects/${p.id}/edit`);
  });
});

/* =========================================================
   GALLERY — add / delete / reorder / caption
   ========================================================= */
router.post('/projects/:id/gallery', requireLogin, (req, res) => {
  const p = projects.findById(req.params.id);
  if (!p) return res.redirect('/admin/projects');

  const upload = multer({ storage: uploadStorageFor(p.slug), fileFilter: imageFilter }).array('images', 20);
  upload(req, res, (err) => {
    if (err) { req.session.flash = { type: 'error', text: err.message }; return res.redirect(`/admin/projects/${p.id}/edit`); }
    const existing = projects.images.forProject(p.id).length;
    (req.files || []).forEach((f, i) => {
      projects.images.add({
        project_id: p.id,
        path: `assets/projects/${p.slug}/${f.filename}`,
        caption: '',
        display_order: existing + i
      });
    });
    req.session.flash = { type: 'success', text: `${req.files?.length || 0} image(s) added to gallery.` };
    res.redirect(`/admin/projects/${p.id}/edit`);
  });
});

router.delete('/projects/:id/gallery/:imageId', requireLogin, (req, res) => {
  const img = projects.images.findById(req.params.imageId);
  if (img) {
    // delete file from disk (best-effort)
    const abs = path.join(ROOT, img.path);
    fs.unlink(abs, () => {});
    projects.images.remove(img.id);
  }
  res.redirect(`/admin/projects/${req.params.id}/edit`);
});

router.post('/projects/:id/gallery/:imageId/caption', requireLogin, (req, res) => {
  projects.images.updateCaption(req.params.imageId, req.body.caption || null);
  res.redirect(`/admin/projects/${req.params.id}/edit`);
});

/* =========================================================
   USERS — super-admin only
   ========================================================= */
router.get('/users', requireSuper, (req, res) => {
  res.render('admin/users', { list: users.all() });
});

router.get('/users/new', requireSuper, (req, res) => {
  res.render('admin/user-form', { user: {}, isNew: true });
});

router.post('/users', requireSuper, (req, res) => {
  const { email, name, role, password } = req.body;
  if (!email || !password) {
    req.session.flash = { type: 'error', text: 'Email and password are required.' };
    return res.redirect('/admin/users/new');
  }
  if (users.findByEmail(email.toLowerCase())) {
    req.session.flash = { type: 'error', text: 'A user with that email already exists.' };
    return res.redirect('/admin/users/new');
  }
  users.create({
    email: email.toLowerCase().trim(),
    password_hash: bcrypt.hashSync(password, 10),
    name: name || null,
    role: role === 'super' ? 'super' : 'editor'
  });
  req.session.flash = { type: 'success', text: 'User created.' };
  res.redirect('/admin/users');
});

router.get('/users/:id/edit', requireSuper, (req, res) => {
  const u = users.findById(req.params.id);
  if (!u) return res.redirect('/admin/users');
  res.render('admin/user-form', { user: u, isNew: false });
});

router.post('/users/:id', requireSuper, (req, res) => {
  const u = users.findById(req.params.id);
  if (!u) return res.redirect('/admin/users');
  users.update(u.id, {
    name: req.body.name || null,
    role: req.body.role === 'super' ? 'super' : 'editor'
  });
  if (req.body.password && req.body.password.length >= 6) {
    users.updatePassword(u.id, bcrypt.hashSync(req.body.password, 10));
  }
  req.session.flash = { type: 'success', text: 'User updated.' };
  res.redirect('/admin/users');
});

router.delete('/users/:id', requireSuper, (req, res) => {
  const id = Number(req.params.id);
  if (id === req.session.user.id) {
    req.session.flash = { type: 'error', text: 'You cannot delete your own account.' };
    return res.redirect('/admin/users');
  }
  users.remove(id);
  req.session.flash = { type: 'success', text: 'User deleted.' };
  res.redirect('/admin/users');
});

/* =========================================================
   HELPERS
   ========================================================= */
function normalize(body) {
  const intOrNull = (v) => v === '' || v == null ? 0 : (v === '1' || v === 'on' || v === 1 ? 1 : 0);
  return {
    name: body.name,
    tagline: body.tagline || null,
    location: body.location || null,
    region: body.region || null,
    architect: body.architect || null,
    status: body.status || null,
    bhk: body.bhk || null,
    builtup_sqft: body.builtup_sqft || null,
    plot_sqft: body.plot_sqft || null,
    pool: body.pool || null,
    orientation: body.orientation || null,
    bedrooms: body.bedrooms || null,
    bathrooms: body.bathrooms || null,
    parking: body.parking || null,
    ready_date: body.ready_date || null,
    typology: body.typology || null,
    description: body.description || null,
    cover_image: body.cover_image || null,
    hero_video: body.hero_video || null,
    featured: intOrNull(body.featured),
    published: intOrNull(body.published),
    display_order: Number(body.display_order) || 0
  };
}

module.exports = router;
