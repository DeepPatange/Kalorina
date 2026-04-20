/**
 * Public server-rendered pages: /villa/:slug
 * (Renders a detail page for any villa added via the admin panel.)
 */
const express = require('express');
const path    = require('path');

const { projects } = require('../db');

const router = express.Router();

router.get('/villa/:slug', (req, res) => {
  const p = projects.findBySlug(req.params.slug);
  if (!p || !p.published) return res.status(404).send('<h1>Villa not found</h1><a href="/projects.html">← Portfolio</a>');

  // Related — up to 3 other published villas, excluding this one
  const allPublished = projects.all({ publishedOnly: true });
  const related = allPublished.filter(x => x.id !== p.id).slice(0, 3);

  res.render('villa-detail', {
    project: p,
    images: projects.images.forProject(p.id),
    related
  });
});

module.exports = router;
