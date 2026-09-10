(function () {
  'use strict';

  document.documentElement.classList.add('js-ready');

  const DESKTOP_GAP = 14;
  const TABLET_GAP = 12;
  const MOBILE_GAP = 10;

  function getColumns() {
    if (window.innerWidth <= 640) return 1;
    if (window.innerWidth <= 900) return 2;
    return 3;
  }

  function getGap() {
    if (window.innerWidth <= 640) return MOBILE_GAP;
    if (window.innerWidth <= 900) return TABLET_GAP;
    return DESKTOP_GAP;
  }

  function getOrientation(img) {
    const w = img.naturalWidth || 1;
    const h = img.naturalHeight || 1;
    const ratio = w / h;
    if (ratio > 1.05) return 'landscape';
    if (ratio < 0.95) return 'portrait';
    return 'square';
  }

  function preferredSpan(type, index, columns) {
    if (columns < 2) return 1;
    // Irregular editorial rhythm. Wide images are occasional, not systematic.
    if (type === 'landscape') return [false, true, false, false, true, false, true, false][index % 8] ? 2 : 1;
    if (type === 'portrait') return [false, false, false, true, false, false, true][index % 7] ? 2 : 1;
    if (type === 'square') return index % 6 === 4 ? 2 : 1;
    return 1;
  }

  function placementCost(candidate, heights, columns, preferred) {
    const next = heights.slice();
    const bottom = candidate.top + candidate.height + candidate.gap;
    for (let c = candidate.start; c < candidate.start + candidate.span; c++) next[c] = bottom;

    const maxAfter = Math.max.apply(null, next);
    const minAfter = Math.min.apply(null, next);
    const spreadAfter = maxAfter - minAfter;

    // Primary objective: keep the skyline compact, so no column is left far behind.
    let cost = maxAfter * 1.0 + spreadAfter * 0.35;

    // Slight preference for the intended span, without forcing it.
    if (candidate.span !== preferred) cost += candidate.height * 0.10;

    // Prefer filling the currently lowest column/pair.
    cost += candidate.top * 0.12;

    // Very small deterministic variation for a less mechanical composition.
    cost += ((candidate.start + 1) * 7) % 5;

    return { cost, next };
  }

  function placeGallery(gallery) {
    const items = Array.from(gallery.querySelectorAll('.gallery__item'));
    if (!items.length || !gallery.clientWidth) return;

    const columns = getColumns();
    const gap = getGap();
    const width = gallery.clientWidth;
    const colWidth = (width - gap * (columns - 1)) / columns;
    const heights = new Array(columns).fill(0);

    gallery.style.position = 'relative';
    gallery.style.display = 'block';
    gallery.style.height = '0px';

    items.forEach(function (item, index) {
      const img = item.querySelector('img');
      if (!img || !img.naturalWidth || !img.naturalHeight) return;

      const type = getOrientation(img);
      const preferred = preferredSpan(type, index, columns);
      const candidateList = [];
      const spans = columns === 1 ? [1] : (preferred === 2 ? [2, 1] : [1, 2]);

      spans.forEach(function (span) {
        if (span > columns) return;
        const itemWidth = colWidth * span + gap * (span - 1);
        const itemHeight = itemWidth * (img.naturalHeight / img.naturalWidth);

        for (let start = 0; start <= columns - span; start++) {
          let top = 0;
          for (let c = start; c < start + span; c++) top = Math.max(top, heights[c]);
          candidateList.push({
            span,
            start,
            top,
            width: itemWidth,
            height: itemHeight,
            gap
          });
        }
      });

      let chosen = null;
      let best = Infinity;

      candidateList.forEach(function (candidate) {
        const result = placementCost(candidate, heights, columns, preferred);
        if (result.cost < best) {
          best = result.cost;
          chosen = { candidate, next: result.next };
        }
      });

      if (!chosen) return;

      const c = chosen.candidate;
      item.dataset.orientation = type;
      item.dataset.span = String(c.span);
      item.classList.add('is-' + type);
      item.style.position = 'absolute';
      item.style.width = c.width + 'px';
      item.style.left = (c.start * (colWidth + gap)) + 'px';
      item.style.top = c.top + 'px';

      for (let col = 0; col < columns; col++) heights[col] = chosen.next[col];
    });

    gallery.style.height = Math.max(0, Math.max.apply(null, heights) - gap) + 'px';
  }

  function layoutAll() {
    document.querySelectorAll('.gallery').forEach(placeGallery);
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

    document.querySelectorAll('.gallery img').forEach(function (img) {
      const relayout = function () {
        requestAnimationFrame(layoutAll);
      };
      if (img.complete && img.naturalWidth) relayout();
      img.addEventListener('load', relayout, { once: true });
      img.addEventListener('error', relayout, { once: true });
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
