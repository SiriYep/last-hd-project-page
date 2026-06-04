/* ============================================================
   LaST-HD project page interactions
   - active section highlight in the nav
   - scroll progress bar
   - scroll-reveal animations (respects reduced motion)
   - lightbox for zoomable figures
   ============================================================ */

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ---------- Active nav highlight + scroll progress ----------
   Position-based scrollspy (not intersection-ratio): we mark the last section
   whose top has crossed a line ~33% down the viewport. This stays correct for
   very tall sections like Results, where a ratio-based observer never reaches
   its threshold and the highlight fails to advance. */
const navLinks = Array.from(document.querySelectorAll(".nav-links a"));
const sections = navLinks
  .map((link) => document.querySelector(link.getAttribute("href")))
  .filter(Boolean);
const progressBar = document.getElementById("progress-bar");

function updateOnScroll() {
  const scrollY = window.scrollY;
  const viewportH = window.innerHeight;
  const docH = document.documentElement.scrollHeight;

  if (progressBar) {
    const scrollable = docH - viewportH;
    const ratio = scrollable > 0 ? scrollY / scrollable : 0;
    progressBar.style.width = `${Math.min(100, Math.max(0, ratio * 100))}%`;
  }

  if (sections.length) {
    const line = viewportH * 0.33;
    let current = null;
    for (const section of sections) {
      if (section.getBoundingClientRect().top <= line) current = section;
    }
    // Near the very bottom, ensure the final tracked section stays highlighted.
    if (scrollY + viewportH >= docH - 2) current = sections[sections.length - 1];
    const activeId = current ? current.id : null;
    navLinks.forEach((link) => {
      link.classList.toggle("active", link.getAttribute("href") === `#${activeId}`);
    });
  }
}

let scrollTicking = false;
function requestScrollUpdate() {
  if (!scrollTicking) {
    scrollTicking = true;
    window.requestAnimationFrame(() => {
      updateOnScroll();
      scrollTicking = false;
    });
  }
}
window.addEventListener("scroll", requestScrollUpdate, { passive: true });
window.addEventListener("resize", requestScrollUpdate);
updateOnScroll();

/* ---------- Scroll reveal ---------- */
const revealSelectors = [
  ".section-heading",
  ".hero-figure",
  ".abstract-body",
  ".metric-card",
  ".content-card",
  ".figure-shell",
  ".step-card",
  ".split-copy",
  ".result-summary article",
  ".table-wrap",
  ".media-slot",
];

if (!prefersReducedMotion && "IntersectionObserver" in window) {
  const revealEls = Array.from(document.querySelectorAll(revealSelectors.join(",")));

  // Stagger items that share a direct parent (grids) for a cascade effect.
  const groupCount = new Map();
  revealEls.forEach((el) => {
    el.classList.add("reveal");
    const parent = el.parentElement;
    const index = groupCount.get(parent) || 0;
    if (index > 0 && index <= 3) {
      el.classList.add(`delay-${index}`);
    }
    groupCount.set(parent, index + 1);
  });

  const revealObserver = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("in");
          obs.unobserve(entry.target);
        }
      });
    },
    { rootMargin: "0px 0px -8% 0px", threshold: 0.08 }
  );

  revealEls.forEach((el) => revealObserver.observe(el));
}

/* ---------- Lightbox ---------- */
(() => {
  const zoomables = Array.from(document.querySelectorAll("[data-zoom] img"));
  if (!zoomables.length) return;

  const overlay = document.createElement("div");
  overlay.className = "lightbox";
  overlay.setAttribute("role", "dialog");
  overlay.setAttribute("aria-modal", "true");
  overlay.setAttribute("aria-label", "Enlarged figure");
  overlay.innerHTML =
    '<button class="lightbox-close" type="button" aria-label="Close">&times;</button><img alt="">';
  document.body.appendChild(overlay);

  const overlayImg = overlay.querySelector("img");
  const closeBtn = overlay.querySelector(".lightbox-close");
  let lastFocused = null;

  const open = (src, alt) => {
    overlayImg.src = src;
    overlayImg.alt = alt || "Enlarged figure";
    lastFocused = document.activeElement;
    overlay.classList.add("open");
    document.body.style.overflow = "hidden";
    closeBtn.focus();
  };

  const close = () => {
    overlay.classList.remove("open");
    document.body.style.overflow = "";
    if (lastFocused && typeof lastFocused.focus === "function") lastFocused.focus();
  };

  zoomables.forEach((img) => {
    img.addEventListener("click", () => open(img.currentSrc || img.src, img.alt));
  });

  overlay.addEventListener("click", (event) => {
    if (event.target !== overlayImg) close();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && overlay.classList.contains("open")) close();
  });
})();
