/**
 * Public JSON API — read-only for now.
 * Used by the static HTML to hydrate project data from the admin panel.
 */
const express = require('express');
const { projects } = require('../db');

const router = express.Router();

/* All published projects (admin-ordered) */
router.get('/projects', (req, res) => {
  const onlyFeatured = req.query.featured === '1';
  const list = onlyFeatured ? projects.featured() : projects.all({ publishedOnly: true });
  res.json({
    count: list.length,
    projects: list.map(p => ({
      ...p,
      images: projects.images.forProject(p.id)
    }))
  });
});

/* Single project by slug, with gallery */
router.get('/projects/:slug', (req, res) => {
  const p = projects.findBySlug(req.params.slug);
  if (!p || !p.published) return res.status(404).json({ error: 'Project not found' });
  res.json({
    ...p,
    images: projects.images.forProject(p.id)
  });
});

module.exports = router;
