/* ============================================================
   LaST-HD project page interactions
   - active section highlight in the nav
   - scroll progress bar
   - scroll-reveal animations (respects reduced motion)
   - copy BibTeX
   - lightbox for zoomable figures
   ============================================================ */

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ---------- Active section highlight ---------- */
const navLinks = Array.from(document.querySelectorAll(".nav-links a"));
const sections = navLinks
  .map((link) => document.querySelector(link.getAttribute("href")))
  .filter(Boolean);

if ("IntersectionObserver" in window && sections.length) {
  const observer = new IntersectionObserver(
    (entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

      if (!visible) return;

      navLinks.forEach((link) => {
        link.classList.toggle("active", link.getAttribute("href") === `#${visible.target.id}`);
      });
    },
    {
      rootMargin: "-20% 0px -55% 0px",
      threshold: [0.1, 0.2, 0.4, 0.6],
    }
  );

  sections.forEach((section) => observer.observe(section));
}

/* ---------- Scroll progress bar ---------- */
const progressBar = document.getElementById("progress-bar");

if (progressBar) {
  let ticking = false;
  const updateProgress = () => {
    const scrollable = document.documentElement.scrollHeight - window.innerHeight;
    const ratio = scrollable > 0 ? window.scrollY / scrollable : 0;
    progressBar.style.width = `${Math.min(100, Math.max(0, ratio * 100))}%`;
    ticking = false;
  };

  window.addEventListener(
    "scroll",
    () => {
      if (!ticking) {
        window.requestAnimationFrame(updateProgress);
        ticking = true;
      }
    },
    { passive: true }
  );
  updateProgress();
}

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
  ".bibtex-block",
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

/* ---------- Copy to clipboard ---------- */
document.addEventListener("click", async (event) => {
  const button = event.target.closest("[data-copy-target]");
  if (!button) return;

  const target = document.getElementById(button.dataset.copyTarget);
  if (!target) return;

  const label = button.querySelector("span") ? null : button;
  const originalHTML = button.innerHTML;

  try {
    await navigator.clipboard.writeText(target.textContent.trim());
    button.innerHTML = "Copied";
    window.setTimeout(() => {
      button.innerHTML = originalHTML;
    }, 1500);
  } catch {
    button.innerHTML = "Copy failed";
    window.setTimeout(() => {
      button.innerHTML = originalHTML;
    }, 1500);
  }
  void label;
});

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
