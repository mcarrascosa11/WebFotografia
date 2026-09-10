(function () {
  'use strict';

  document.documentElement.classList.remove('no-js');
  document.documentElement.classList.add('js-ready');

  const ROW_PX = 8;
  const GAP_PX = 12;

  function detectOrientation(img) {
    const w = img.naturalWidth;
    const h = img.naturalHeight;
    if (!w || !h) return 'square';
    const r = w / h;
    if (r > 1.12) return 'landscape';
    if (r < 0.88) return 'portrait';
    return 'square';
  }

  function chooseSpan(fig, orientation) {
    const gallery = fig.parentElement;
    const items = Array.from(gallery.children);
    const index = items.indexOf(fig);

    // Base editorial rhythm:
    // landscape alternates between 2 and 1 columns;
    // portraits are usually 1 column, with occasional 2-column emphasis;
    // squares stay at 1 column.
    if (orientation === 'landscape') return index % 3 === 0 ? 1 : 2;
    if (orientation === 'portrait') return index % 5 === 2 ? 2 : 1;
    return 1;
  }

  function sizeItem(fig) {
    const img = fig.querySelector('img');
    if (!img || !img.naturalWidth || !img.naturalHeight) return;

    const orientation = img.dataset.orientation || detectOrientation(img);
    const span = Number(fig.dataset.span || chooseSpan(fig, orientation));
    fig.dataset.orientation = orientation;
    fig.dataset.span = String(span);

    // The image keeps its natural ratio. We only tell CSS how many grid
    // columns it occupies, then reserve exactly its rendered height in rows.
    requestAnimationFrame(function () {
      const height = img.getBoundingClientRect().height;
      const rowSpan = Math.max(1, Math.ceil((height + GAP_PX) / (ROW_PX + GAP_PX)));
      fig.style.gridRowEnd = 'span ' + rowSpan;
    });
  }

  function processImage(img) {
    const fig = img.closest('.gallery__item');
    if (!fig) return;
    fig.dataset.orientation = detectOrientation(img);
    fig.dataset.span = String(chooseSpan(fig, fig.dataset.orientation));
    sizeItem(fig);
  }

  // Recalculate after responsive width changes.
  function resizeAll() {
    document.querySelectorAll('.gallery__item').forEach(sizeItem);
  }

  const reveal = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
        reveal.unobserve(entry.target);
      }
    });
  }, { rootMargin: '0px 0px -5% 0px', threshold: 0.01 });

  // Background + mode indicator
  const modeEl = document.getElementById('modeIndicator');
  const digitalSection = document.getElementById('digital');
  const analogueSection = document.getElementById('analogica');
  let currentMode = 'digital';

  function setMode(mode) {
    if (mode === currentMode) return;
    currentMode = mode;
    document.body.classList.toggle('mode-analogue', mode === 'analogue');
    if (modeEl) modeEl.textContent = mode === 'analogue' ? 'ANALÓGICA' : 'DIGITAL';
  }

  const sectionObserver = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      if (entry.target.id === 'analogica') setMode('analogue');
      if (entry.target.id === 'digital') setMode('digital');
    });
  }, { rootMargin: '-35% 0px -35% 0px', threshold: 0 });

  function initGallery(gallery) {
    const images = gallery.querySelectorAll('img');

    images.forEach(function (img) {
      const loaded = function () {
        processImage(img);
      };
      if (img.complete && img.naturalWidth > 0) loaded();
      else {
        img.addEventListener('load', loaded, { once: true });
        img.addEventListener('error', function () {
          const fig = img.closest('.gallery__item');
          if (fig) {
            fig.dataset.orientation = 'square';
            fig.dataset.span = '1';
          }
        }, { once: true });
      }

      const fig = img.closest('.gallery__item');
      if (fig) reveal.observe(fig);
    });
  }

  function init() {
    document.querySelectorAll('.gallery').forEach(initGallery);
    if (digitalSection) sectionObserver.observe(digitalSection);
    if (analogueSection) sectionObserver.observe(analogueSection);
    if (modeEl) setTimeout(function () { modeEl.classList.add('visible'); }, 500);

    if ('ResizeObserver' in window) {
      const ro = new ResizeObserver(function () { resizeAll(); });
      document.querySelectorAll('.gallery').forEach(function (gallery) { ro.observe(gallery); });
    } else {
      window.addEventListener('resize', resizeAll, { passive: true });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
