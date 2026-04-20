/**
 * Session-based auth middleware + role gates.
 */

function requireLogin(req, res, next) {
  if (!req.session.user) {
    return res.redirect('/admin/login?next=' + encodeURIComponent(req.originalUrl));
  }
  next();
}

function requireSuper(req, res, next) {
  if (!req.session.user) return res.redirect('/admin/login');
  if (req.session.user.role !== 'super') {
    req.session.flash = { type: 'error', text: 'Super-admin access required.' };
    return res.redirect('/admin');
  }
  next();
}

function redirectIfLoggedIn(req, res, next) {
  if (req.session.user) return res.redirect('/admin');
  next();
}

module.exports = { requireLogin, requireSuper, redirectIfLoggedIn };
