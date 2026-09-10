(function () {
  'use strict';

  document.documentElement.classList.add('js-ready');

  const GAP = 14;
  const RAIL = 150;

  function orientation(img) {
    const w = img.naturalWidth || 1;
    const h = img.naturalHeight || 1;
    const r = w / h;
    if (r > 1.08) return 'landscape';
    if (r < 0.92) return 'portrait';
    return 'square';
  }

  function prefersTwoCols(index, type) {
    // Ritmo deliberadamente irregular: no se repite una alternancia fija.
    const pattern = [1, 2, 1, 2, 1, 1, 2, 1, 2, 1, 1, 2, 1];
    const value = pattern[index % pattern.length] === 2;
    if (type === 'portrait') return index % 7 === 3 || index % 11 === 8;
    if (type === 'square') return index % 6 === 4;
    return value;
  }

  function visibleColumns() {
    if (window.innerWidth <= 640) return 1;
    if (window.innerWidth <= 900) return 2;
    return 3;
  }

  function placeGallery(gallery) {
    const figures = Array.from(gallery.querySelectorAll('.gallery__item'));
    const columnsCount = visibleColumns();
    const width = gallery.clientWidth;
    if (!width || !figures.length) return;

    const gap = window.innerWidth <= 640 ? 10 : (window.innerWidth <= 900 ? 12 : GAP);
    const colWidth = (width - gap * (columnsCount - 1)) / columnsCount;
    const heights = new Array(columnsCount).fill(0);

    // En móvil hacemos una columna continua. En escritorio/tablet usamos
    // posicionamiento absoluto para ocupar los huecos disponibles de verdad.
    if (columnsCount === 1) {
      let y = 0;
      figures.forEach((fig, index) => {
        const img = fig.querySelector('img');
        if (!img || !img.naturalWidth) return;
        const type = orientation(img);
        const isPortrait = type === 'portrait';
        const itemWidth = isPortrait ? Math.min(width * .78, 520) : width;
        const itemHeight = itemWidth * (img.naturalHeight / img.naturalWidth);
        fig.style.width = itemWidth + 'px';
        fig.style.left = ((index % 2 === 0) ? 0 : width - itemWidth) + 'px';
        fig.style.top = y + 'px';
        y += itemHeight + gap * 5;
      });
      gallery.style.height = Math.max(0, y - gap * 5) + 'px';
      return;
    }

    figures.forEach((fig, index) => {
      const img = fig.querySelector('img');
      if (!img || !img.naturalWidth || !img.naturalHeight) return;

      const type = orientation(img);
      const wantedSpan = prefersTwoCols(index, type) ? 2 : 1;
      const possibleSpans = columnsCount === 2 ? [1, 2] : [wantedSpan, wantedSpan === 2 ? 1 : 2];
      const candidates = [];

      possibleSpans.forEach(span => {
        if (span > columnsCount) return;
        const itemWidth = colWidth * span + gap * (span - 1);
        const itemHeight = itemWidth * (img.naturalHeight / img.naturalWidth);
        for (let start = 0; start <= columnsCount - span; start++) {
          let y = 0;
          for (let c = start; c < start + span; c++) y = Math.max(y, heights[c]);
          candidates.push({ span, start, y, itemWidth, itemHeight });
        }
      });

      candidates.sort((a, b) => {
        if (Math.abs(a.y - b.y) > 1) return a.y - b.y;
        if (a.span !== b.span) return a.span === wantedSpan ? -1 : 1;
        const center = (columnsCount - a.span) / 2;
        const centerA = Math.abs(a.start - center);
        const centerB = Math.abs(b.start - center);
        return centerA - centerB;
      });

      const chosen = candidates[0];
      fig.dataset.orientation = type;
      fig.dataset.span = String(chosen.span);
      fig.style.width = chosen.itemWidth + 'px';
      fig.style.left = (chosen.start * (colWidth + gap)) + 'px';
      fig.style.top = chosen.y + 'px';

      const newBottom = chosen.y + chosen.itemHeight + gap;
      for (let c = chosen.start; c < chosen.start + chosen.span; c++) {
        heights[c] = newBottom;
      }
    });

    gallery.style.height = Math.max(0, Math.max.apply(null, heights) - gap) + 'px';
  }

  function layoutAll() {
    document.querySelectorAll('.gallery').forEach(placeGallery);
  }

  const reveal = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
        reveal.unobserve(entry.target);
      }
    });
  }, { rootMargin: '0px 0px -5% 0px', threshold: 0.01 });

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

  const sectionObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      if (entry.target.id === 'analogica') setMode('analogue');
      if (entry.target.id === 'digital') setMode('digital');
    });
  }, { rootMargin: '-35% 0px -35% 0px', threshold: 0 });

  function init() {
    document.querySelectorAll('.gallery__item').forEach(fig => reveal.observe(fig));

    document.querySelectorAll('.gallery img').forEach(img => {
      const ready = () => {
        placeGallery(img.closest('.gallery'));
      };
      if (img.complete && img.naturalWidth) ready();
      img.addEventListener('load', ready, { once: true });
      img.addEventListener('error', ready, { once: true });
    });

    if (digitalSection) sectionObserver.observe(digitalSection);
    if (analogueSection) sectionObserver.observe(analogueSection);
    if (modeEl) setTimeout(() => modeEl.classList.add('visible'), 500);

    let resizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(layoutAll, 80);
    }, { passive: true });

    layoutAll();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
