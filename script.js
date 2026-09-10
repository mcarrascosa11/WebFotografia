(function () {
  'use strict';

  document.documentElement.classList.add('js-ready');

  const DESKTOP_GAP = 14;
  const TABLET_GAP = 12;

  function columns() {
    if (window.innerWidth <= 640) return 1;
    if (window.innerWidth <= 900) return 2;
    return 3;
  }

  function gap() {
    if (window.innerWidth <= 640) return 10;
    if (window.innerWidth <= 900) return TABLET_GAP;
    return DESKTOP_GAP;
  }

  function typeOf(img) {
    const r = img.naturalWidth / img.naturalHeight;
    if (r > 1.05) return 'landscape';
    if (r < 0.95) return 'portrait';
    return 'square';
  }

  function preferredSpan(type, index, count) {
    if (count < 2) return 1;
    // Wide images are occasional. Portraits can also become a deliberate
    // two-column statement, but only when the masonry algorithm can do it
    // without leaving a vertical hole.
    if (index % 7 === 2) return 2;
    if (type === 'landscape' && index % 5 === 1) return 2;
    if (type === 'portrait' && index % 9 === 6) return 2;
    return 1;
  }

  function layout(gallery) {
    const items = Array.from(gallery.querySelectorAll('.gallery__item'));
    const count = columns();
    const g = gap();
    const width = gallery.clientWidth;
    if (!width || !items.length) return;

    const colWidth = (width - g * (count - 1)) / count;
    const heights = new Array(count).fill(0);

    gallery.style.position = 'relative';
    gallery.style.height = '0px';

    items.forEach(function (item, index) {
      const img = item.querySelector('img');
      if (!img || !img.naturalWidth || !img.naturalHeight) return;

      const type = typeOf(img);
      const wanted = preferredSpan(type, index, count);
      const candidates = [];

      // First try a two-column composition only where the two columns have
      // virtually the same skyline. This is the key to avoiding blank holes.
      if (wanted === 2) {
        for (let start = 0; start <= count - 2; start++) {
          const h0 = heights[start];
          const h1 = heights[start + 1];
          const spread = Math.abs(h0 - h1);
          if (spread > g * 2) continue;
          const w = colWidth * 2 + g;
          const h = w * img.naturalHeight / img.naturalWidth;
          candidates.push({ span: 2, start, top: Math.max(h0, h1), width: w, height: h });
        }
      }

      // One-column placement always goes into the shortest column. This is
      // true masonry: the next photograph fills the lowest available space.
      for (let start = 0; start < count; start++) {
        candidates.push({
          span: 1,
          start,
          top: heights[start],
          width: colWidth,
          height: colWidth * img.naturalHeight / img.naturalWidth
        });
      }

      candidates.sort(function (a, b) {
        if (Math.abs(a.top - b.top) > 1) return a.top - b.top;
        if (a.span !== b.span) return a.span === wanted ? -1 : 1;
        return a.start - b.start;
      });

      const chosen = candidates[0];
      item.dataset.orientation = type;
      item.dataset.span = String(chosen.span);
      item.classList.add('is-' + type);
      item.style.position = 'absolute';
      item.style.width = chosen.width + 'px';
      item.style.left = (chosen.start * (colWidth + g)) + 'px';
      item.style.top = chosen.top + 'px';

      const bottom = chosen.top + chosen.height + g;
      for (let c = chosen.start; c < chosen.start + chosen.span; c++) {
        heights[c] = bottom;
      }
    });

    gallery.style.height = Math.max(0, Math.max.apply(null, heights) - g) + 'px';
  }

  function layoutAll() {
    document.querySelectorAll('.gallery').forEach(layout);
  }

  const reveal = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
        reveal.unobserve(entry.target);
      }
    });
  }, { rootMargin: '0px 0px -5% 0px', threshold: 0.01 });

  const modeEl = document.getElementById('modeIndicator');
  const digital = document.getElementById('digital');
  const analogue = document.getElementById('analogica');
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
      setMode(entry.target.id === 'analogica' ? 'analogue' : 'digital');
    });
  }, { rootMargin: '-35% 0px -35% 0px', threshold: 0 });

  function init() {
    document.querySelectorAll('.gallery__item').forEach(function (item) { reveal.observe(item); });

    // Never wait for lazy images outside the viewport. Reflow after each image
    // becomes available, so the visible gallery is always laid out.
    document.querySelectorAll('.gallery img').forEach(function (img) {
      const redraw = function () { layout(img.closest('.gallery')); };
      if (img.complete && img.naturalWidth) redraw();
      else img.addEventListener('load', redraw, { once: true });
    });

    if (digital) sectionObserver.observe(digital);
    if (analogue) sectionObserver.observe(analogue);
    if (modeEl) setTimeout(function () { modeEl.classList.add('visible'); }, 400);

    let resizeTimer;
    window.addEventListener('resize', function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(layoutAll, 100);
    }, { passive: true });

    layoutAll();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
