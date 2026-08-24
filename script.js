/* =========================================================
       EARLY VIEWPORT SAFEGUARD
       Beberapa in-app browser / doc-viewer (mis. previewer file
       dari aplikasi chat) kadang tidak menghormati meta viewport
       dengan baik sehingga halaman ter-render dalam mode "desktop"
       yang diperkecil. Script ini berjalan sedini mungkin (sebelum
       CSS di-parse) untuk menandai <html> dengan atribut ukuran
       layar aktual, dipakai sebagai jaring pengaman tambahan oleh
       CSS di bawah selain @media query standar.
       ========================================================= */
(function () {
  function markViewport() {
    var w = window.innerWidth || document.documentElement.clientWidth;
    document.documentElement.setAttribute(
      "data-viewport",
      w <= 900 ? "compact" : "wide"
    );
  }
  markViewport();
  window.addEventListener("resize", markViewport);
  window.addEventListener("orientationchange", markViewport);
  document.addEventListener("DOMContentLoaded", markViewport);
})();

"use strict";


/* =========================================================
   ORGANOGRAM — EXPAND/COLLAPSE KADIV & WAKADIV
   ========================================================= */

const orgBidangButtons = document.querySelectorAll(".org-bidang-btn");

orgBidangButtons.forEach((btn) => {
  const panel = document.getElementById(btn.getAttribute("aria-controls"));

  if (!panel) {
    return;
  }

  btn.addEventListener("click", () => {
    const isOpen = btn.getAttribute("aria-expanded") === "true";

    orgBidangButtons.forEach((otherBtn) => {
      if (otherBtn === btn) {
        return;
      }

      const otherPanel = document.getElementById(
        otherBtn.getAttribute("aria-controls")
      );

      otherBtn.setAttribute("aria-expanded", "false");

      if (otherPanel) {
        otherPanel.style.maxHeight = "";
      }
    });

    btn.setAttribute("aria-expanded", String(!isOpen));
    panel.style.maxHeight = isOpen ? "" : panel.scrollHeight + "px";
  });
});


/* =========================================================
   MOBILE NAVIGATION
   ========================================================= */

const menuToggle = document.getElementById("menuToggle");
const navMenu = document.getElementById("navMenu");
const navLinks = document.querySelectorAll(
  ".nav-link:not(.nav-dropdown-trigger)"
);

function setMenuState(isOpen) {
  menuToggle.classList.toggle("active", isOpen);
  navMenu.classList.toggle("active", isOpen);

  menuToggle.setAttribute(
    "aria-expanded",
    String(isOpen)
  );

  menuToggle.setAttribute(
    "aria-label",
    isOpen
      ? "Tutup menu navigasi"
      : "Buka menu navigasi"
  );

  document.body.style.overflow = isOpen ? "hidden" : "";

  if (!isOpen) {
    closeAllDropdowns();
  }
}

menuToggle.addEventListener("click", () => {
  const isOpen = navMenu.classList.contains("active");
  setMenuState(!isOpen);
});

navLinks.forEach((link) => {
  link.addEventListener("click", () => {
    setMenuState(false);
  });
});

window.addEventListener("resize", () => {
  if (window.innerWidth > 900) {
    setMenuState(false);
  }
});


/* =========================================================
   NAV DROPDOWNS (TENTANG GERAKAN / KAJIAN & PETA)
   ========================================================= */

const dropdownItems = document.querySelectorAll(".nav-item-dropdown");

function closeAllDropdowns(except) {
  dropdownItems.forEach((item) => {
    if (item === except) {
      return;
    }

    item.classList.remove("open");

    const trigger = item.querySelector(".nav-dropdown-trigger");
    if (trigger) {
      trigger.setAttribute("aria-expanded", "false");
    }
  });
}

dropdownItems.forEach((item) => {
  const trigger = item.querySelector(".nav-dropdown-trigger");

  if (!trigger) {
    return;
  }

  trigger.addEventListener("click", (event) => {
    event.stopPropagation();

    const isOpen = item.classList.contains("open");
    closeAllDropdowns(item);
    item.classList.toggle("open", !isOpen);
    trigger.setAttribute("aria-expanded", String(!isOpen));
  });

  item.querySelectorAll(".nav-dropdown-link").forEach((link) => {
    link.addEventListener("click", () => {
      closeAllDropdowns();
      setMenuState(false);
    });
  });
});

document.addEventListener("click", (event) => {
  const clickedInsideDropdown = event.target.closest(
    ".nav-item-dropdown"
  );

  if (!clickedInsideDropdown) {
    closeAllDropdowns();
  }
});


/* =========================================================
   SINGLE-FILE ROUTER / NAVIGATION
   - Semua halaman tetap berada dalam satu HTML.
   - Back/Forward browser bekerja dengan popstate.
   - Hash untuk section biasa tetap mengarah ke beranda.
   ========================================================= */

const viewPanels = {
  home: document.getElementById("view-home"),
  organogram: document.getElementById("view-organogram-arah-gerak"),
  galeri: document.getElementById("view-galeri")
};

const specialHashes = {
  "#organogram-arah-gerak": "organogram",
  "#galeri": "galeri"
};

function closeNavigationUI() {
  closeAllDropdowns();
  setMenuState(false);
}

function setActiveNav(route) {
  document.querySelectorAll(".nav-link").forEach((link) => {
    link.removeAttribute("data-view-active");
    link.classList.remove("active");
  });

  if (route === "organogram") {
    const link = document.querySelector('.nav-link[href="#organogram-arah-gerak"]');
    if (link) {
      link.classList.add("active");
      link.setAttribute("data-view-active", "true");
    }
    return;
  }

  if (route === "galeri") {
    const link = document.querySelector('.nav-link[href="#galeri"]');
    if (link) {
      link.classList.add("active");
      link.setAttribute("data-view-active", "true");
    }
    return;
  }

  const homeLink = document.querySelector('.nav-link[href="#beranda"]');
  if (homeLink) {
    homeLink.classList.add("active");
    homeLink.setAttribute("data-view-active", "true");
  }
}

function activateView(route) {
  const active = viewPanels[route] ? route : "home";

  Object.entries(viewPanels).forEach(([key, panel]) => {
    const isActive = key === active;
    panel.classList.toggle("is-active", isActive);
    panel.setAttribute("aria-hidden", String(!isActive));
  });

  setActiveNav(active);
  return active;
}

function scrollHomeTo(targetId, behavior = "smooth") {
  requestAnimationFrame(() => {
    const target = document.getElementById(targetId);
    if (target) {
      target.scrollIntoView({ behavior, block: "start" });
    } else {
      window.scrollTo({ top: 0, behavior });
    }
  });
}

function routeToHash(hash, {
  push = true,
  behavior = "smooth"
} = {}) {
  const normalized = hash && hash.startsWith("#") ? hash : "#beranda";

  if (specialHashes[normalized]) {
    activateView(specialHashes[normalized]);
    closeNavigationUI();

    if (push) {
      history.pushState({ route: normalized }, "", normalized);
    }

    window.scrollTo({ top: 0, behavior });
    return;
  }

  activateView("home");
  closeNavigationUI();

  if (push) {
    history.pushState({ route: normalized }, "", normalized);
  }

  if (normalized === "#beranda") {
    window.scrollTo({ top: 0, behavior });
  } else {
    scrollHomeTo(normalized.slice(1), behavior);
  }
}

document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
  anchor.addEventListener("click", (event) => {
    const href = anchor.getAttribute("href");

    if (!href || href === "#") {
      return;
    }

    if (
      href === "#organogram-arah-gerak" ||
      href === "#galeri" ||
      href === "#beranda" ||
      document.getElementById(href.slice(1))
    ) {
      event.preventDefault();
      routeToHash(href, { push: true, behavior: "smooth" });
    }
  });
});

function syncFromLocation(behavior = "auto") {
  const hash = window.location.hash || "#beranda";

  if (specialHashes[hash]) {
    activateView(specialHashes[hash]);
    closeNavigationUI();
    window.scrollTo({ top: 0, behavior });
    return;
  }

  activateView("home");

  if (hash === "#beranda") {
    window.scrollTo({ top: 0, behavior });
    return;
  }

  scrollHomeTo(hash.slice(1), behavior);
}

window.addEventListener("popstate", () => {
  syncFromLocation("auto");
});

syncFromLocation("auto");


/* =========================================================
   SCROLL REVEAL — INTERSECTION OBSERVER
   ========================================================= */

const revealElements = document.querySelectorAll(".hidden");

const revealObserver = new IntersectionObserver(
  (entries, observer) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) {
        return;
      }

      entry.target.classList.add("show");
      observer.unobserve(entry.target);
    });
  },
  {
    threshold: 0.12,
    rootMargin: "0px 0px -40px 0px"
  }
);

revealElements.forEach((element) => {
  revealObserver.observe(element);
});


/* =========================================================
   ACCESSIBILITY: KEYBOARD ESCAPE FOR MOBILE MENU
   ========================================================= */

document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape") {
    return;
  }

  if (navMenu.classList.contains("active")) {
    setMenuState(false);
    menuToggle.focus();
    return;
  }

  closeAllDropdowns();
});


/* =========================================================
   INITIALIZATION
   ========================================================= */

document.documentElement.classList.add("js-ready");

console.log(
  "RAKSHABENA 26 — WebGIS frontend initialized."
);
