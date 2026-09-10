(function () {
  'use strict';

  document.documentElement.classList.add('js-ready');

  const DESKTOP_GAP = 14;
  const TABLET_GAP = 12;

  function getColumns() {
    if (window.innerWidth <= 640) return 1;
    if (window.innerWidth <= 900) return 2;
    return 3;
  }

  function getGap() {
    if (window.innerWidth <= 640) return 10;
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

  function canUseTwoColumns(type, index, heights, start) {
    if (type === 'portrait' && index % 6 !== 2) return false;
    if (type === 'square' && index % 5 !== 1) return false;
    if (type === 'landscape' && index % 4 !== 1) return false;

    const a = heights[start];
    const b = heights[start + 1];
    const spread = Math.abs(a - b);
    const skyline = Math.max(a, b);
    return spread < Math.max(180, skyline * 0.28 + 120);
  }

  function layoutGallery(gallery) {
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
      let wantedSpan = 1;

      if (columns > 1) {
        for (let start = 0; start <= columns - 2; start++) {
          if (canUseTwoColumns(type, index, heights, start)) {
            const twoColHeight = (colWidth * 2 + gap) * (img.naturalHeight / img.naturalWidth);
            const oneColBest = Math.min.apply(null, heights);
            const twoColTop = Math.max(heights[start], heights[start + 1]);

            // Only create a wide image when doing so is genuinely competitive
            // with the shortest available column. This prevents giant blanks.
            if (twoColTop <= oneColBest + twoColHeight * 0.42) {
              wantedSpan = 2;
              break;
            }
          }
        }
      }

      const candidates = [];
      const spans = wantedSpan === 2 ? [2, 1] : [1];

      spans.forEach(function (span) {
        if (span > columns) return;
        const itemWidth = colWidth * span + gap * (span - 1);
        const itemHeight = itemWidth * (img.naturalHeight / img.naturalWidth);

        for (let start = 0; start <= columns - span; start++) {
          let y = 0;
          for (let c = start; c < start + span; c++) y = Math.max(y, heights[c]);
          candidates.push({ span, start, y, itemWidth, itemHeight });
        }
      });

      candidates.sort(function (a, b) {
        if (Math.abs(a.y - b.y) > 1) return a.y - b.y;
        if (a.span !== b.span) return a.span === wantedSpan ? -1 : 1;
        // Small deterministic variation avoids a repetitive visual cadence.
        const pa = (index * 7 + a.start * 11) % 17;
        const pb = (index * 7 + b.start * 11) % 17;
        return pa - pb;
      });

      const chosen = candidates[0];

      item.dataset.orientation = type;
      item.dataset.span = String(chosen.span);
      item.classList.add('is-' + type);
      item.style.position = 'absolute';
      item.style.width = chosen.itemWidth + 'px';
      item.style.left = (chosen.start * (colWidth + gap)) + 'px';
      item.style.top = chosen.y + 'px';

      const bottom = chosen.y + chosen.itemHeight + gap;
      for (let c = chosen.start; c < chosen.start + chosen.span; c++) {
        heights[c] = bottom;
      }
    });

    gallery.style.height = Math.max(0, Math.max.apply(null, heights) - gap) + 'px';
  }

  function layoutAll() {
    document.querySelectorAll('.gallery').forEach(layoutGallery);
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

    const images = Array.from(document.querySelectorAll('.gallery img'));
    let pending = images.length;

    function ready() {
      pending -= 1;
      if (pending <= 0) layoutAll();
    }

    images.forEach(function (img) {
      if (img.complete && img.naturalWidth > 0) ready();
      else {
        img.addEventListener('load', ready, { once: true });
        img.addEventListener('error', ready, { once: true });
      }
    });

    if (!images.length) layoutAll();

    if (digital) sectionObserver.observe(digital);
    if (analogue) sectionObserver.observe(analogue);
    if (modeEl) setTimeout(function () { modeEl.classList.add('visible'); }, 400);

    let resizeTimer;
    window.addEventListener('resize', function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(layoutAll, 100);
    }, { passive: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
