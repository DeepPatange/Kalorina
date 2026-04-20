/**
 * Karolina — client-side hydration.
 *
 * When the home-page portfolio grid carries
 * `data-karolina-portfolio="all|featured"`, this script fetches
 * projects from `/api/projects` and rebuilds the cards with the
 * admin-managed data.
 *
 * If the API is unreachable (viewing via file://), the existing
 * hardcoded cards stay in place — graceful degradation.
 */
(function () {
  "use strict";

  var target = document.querySelector('[data-karolina-portfolio]');
  if (!target) return;

  var mode = target.getAttribute('data-karolina-portfolio');
  var url  = mode === 'featured' ? '/api/projects?featured=1' : '/api/projects';

  fetch(url, { credentials: 'same-origin' })
    .then(function (r) {
      if (!r.ok) throw new Error('API ' + r.status);
      return r.json();
    })
    .then(function (data) {
      var list = data.projects || [];
      if (!list.length) return; // keep static fallback
      renderPortfolio(target, list);
    })
    .catch(function (err) {
      console.warn('[Karolina] portfolio hydration skipped:', err.message);
    });

  function renderPortfolio(mount, projects) {
    var html = projects.map(function (p, i) {
      // Bookend magazine layout: 1st and last card = full-width hero
      var isBookend = i === 0 || i === projects.length - 1;
      var size = isBookend ? 'size-full' : 'size-half';
      var href = detailLinkFor(p);
      var img  = absolutize(p.cover_image);
      var tag  = p.status ? '<span class="p-tag">' + esc(p.status) + '</span>' : '';

      // Every card gets a sub line — use tagline, or build one from specs
      var sub = p.tagline || p.description || '';
      if (!sub) {
        var bits = [];
        if (p.bhk)       bits.push(esc(p.bhk));
        if (p.typology)  bits.push(esc(p.typology));
        if (p.architect) bits.push('Architect · ' + esc(p.architect));
        sub = bits.join(' · ');
      }
      var subHtml = sub
        ? '<span class="p-sub">' + esc(sub.split('\n')[0]) + '</span>'
        : '';

      var linkLabel = (p.status === 'Under Construction') ? 'Explore'
                    : (isDedicated(p.slug) ? 'View Details' : 'Explore Villa');

      return ''
        + '<article class="portfolio-card ' + size + '">'
          + '<a href="' + esc(href) + '">'
            + '<img src="' + encodeAssetPath(img) + '" alt="' + esc(p.name) + '" loading="lazy" />'
            + '<span class="p-num">' + pad(i + 1) + '</span>'
            + tag
            + '<div class="p-body">'
              + '<span class="p-loc">' + esc(p.location || p.region || '') + '</span>'
              + '<span class="p-name">' + esc(p.name) + '</span>'
              + subHtml
              + '<span class="p-link">' + linkLabel + ' <span class="arrow">&rarr;</span></span>'
            + '</div>'
          + '</a>'
        + '</article>';
    }).join('');

    mount.innerHTML = html;

    // --- Trigger the reveal on freshly rendered cards ---------------
    // The original cards were observed by script.js's IntersectionObserver,
    // but our replacements weren't. Re-observe them so the fade-up plays.
    var cards = mount.querySelectorAll('.portfolio-card');
    if ('IntersectionObserver' in window) {
      var obs = new IntersectionObserver(function (entries) {
        entries.forEach(function (e, i) {
          if (e.isIntersecting) {
            e.target.classList.add('in');
            obs.unobserve(e.target);
          }
        });
      }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
      cards.forEach(function (c, i) {
        c.style.transitionDelay = ((i % 4) * 0.08) + 's';
        obs.observe(c);
      });
    } else {
      // IO not supported — just show everything.
      cards.forEach(function (c) { c.classList.add('in'); });
    }
  }

  var DEDICATED = {
    'moonstone-villa': 'moonstone-villa.html',
    'villa-guirim-a':  'villa-guirim-a.html',
    'villa-guirim-b':  'villa-guirim-b.html'
  };
  function detailLinkFor(p) { return DEDICATED[p.slug] || ('/villa/' + p.slug); }
  function isDedicated(slug) { return !!DEDICATED[slug]; }

  function absolutize(src) {
    if (!src) return '';
    if (src.startsWith('http') || src.startsWith('/')) return src;
    return '/' + src;
  }

  // Encode spaces and special chars in asset paths, preserving "/" separators + query strings.
  function encodeAssetPath(src) {
    if (!src) return '';
    // External URLs: leave alone (they're already encoded)
    if (/^https?:\/\//.test(src)) return src;
    // Split off query string, encode each path segment, rejoin
    var hashSplit = src.split('#');
    var quSplit   = hashSplit[0].split('?');
    var path      = quSplit[0];
    var query     = quSplit[1] ? '?' + quSplit[1] : '';
    var hash      = hashSplit[1] ? '#' + hashSplit[1] : '';
    var encoded   = path.split('/').map(function (seg) {
      return seg ? encodeURIComponent(seg) : seg;
    }).join('/');
    return encoded + query + hash;
  }

  function esc(s) {
    return (s || '').replace(/[&<>"']/g, function (c) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]);
    });
  }
  function pad(n) { return n < 10 ? '0' + n : '' + n; }
})();
