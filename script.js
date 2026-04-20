/* =========================================================
   Karolina — simple interactions
   ========================================================= */
(() => {
  "use strict";

  /* Nav toggle (mobile) */
  const navToggle = document.querySelector(".nav-toggle");
  if (navToggle) {
    navToggle.addEventListener("click", () => {
      document.querySelector(".menu").classList.toggle("open");
    });
  }

  /* Fade-in on scroll */
  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("in");
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15, rootMargin: "0px 0px -40px 0px" });

  document.querySelectorAll(
    ".section h1, .section h2, .section .eyebrow, .section .sub, " +
    ".value, .member, .partner, .step, .mv-card, .project, .feature-strip .cell"
  ).forEach(el => {
    el.classList.add("reveal");
    io.observe(el);
  });

  /* Reveal on scroll — gallery, team bios, founder feature */
  const revealIO = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("in");
        revealIO.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });

  document.querySelectorAll(
    ".gallery-reveal figure, .bio-split, .founder-feature, .portfolio-card"
  ).forEach((el, i) => {
    // Staggered reveal for portfolio cards
    if (el.classList.contains("portfolio-card")) {
      el.style.transitionDelay = ((i % 4) * 0.08) + "s";
    }
    revealIO.observe(el);
  });

  /* ========================================================
     Mersi-style continuous scroll parallax — images drift
     vertically as their frame moves through the viewport.
     ======================================================== */
  const parallaxTargets = document.querySelectorAll(
    ".gallery-reveal figure img"
  );
  if (parallaxTargets.length && matchMedia("(prefers-reduced-motion: no-preference)").matches) {
    let ticking = false;
    const updateParallax = () => {
      const vh = window.innerHeight;
      parallaxTargets.forEach(img => {
        const host = img.parentElement;
        const rect = host.getBoundingClientRect();
        // Skip off-screen elements to save CPU
        if (rect.bottom < -200 || rect.top > vh + 200) return;
        const midpoint = rect.top + rect.height / 2;
        const progress = (midpoint - vh / 2) / vh; // -0.5..0.5 through viewport centre
        const clamped = Math.max(-0.6, Math.min(0.6, progress));
        const ty = (clamped * -28).toFixed(2); // +/- ~17px parallax range
        img.style.setProperty("--py", ty + "px");
      });
      ticking = false;
    };
    window.addEventListener("scroll", () => {
      if (!ticking) { requestAnimationFrame(updateParallax); ticking = true; }
    }, { passive: true });
    window.addEventListener("resize", updateParallax, { passive: true });
    updateParallax();
  }

  /* Footer year */
  const yr = document.getElementById("yr");
  if (yr) yr.textContent = new Date().getFullYear();
})();
