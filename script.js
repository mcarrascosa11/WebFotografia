(function () {
  'use strict';

  document.documentElement.classList.add('js-ready');

  /*
   * GALERÍA JUSTIFICADA
   * -------------------
   * No usamos masonry por columnas: es lo que estaba provocando los huecos.
   * Cada fila se calcula como una composición completa:
   * - todas las fotos de la fila tienen exactamente la misma altura;
   * - sus anchos se calculan según su proporción real;
   * - la suma de anchos + separaciones ocupa exactamente todo el ancho.
   *
   * Resultado: no hay agujeros verticales ni separaciones que cambien de
   * tamaño. La composición sigue teniendo juego porque cada fila puede tener
   * 2 o 3 fotografías y las proporciones cambian continuamente.
   */

  function columns() {
    if (window.innerWidth <= 640) return 2;
    if (window.innerWidth <= 900) return 2;
    return 3;
  }

  function gap() {
    if (window.innerWidth <= 640) return 10;
    if (window.innerWidth <= 900) return 12;
    return 14;
  }

  function targetHeight() {
    if (window.innerWidth <= 640) return 190;
    if (window.innerWidth <= 900) return 230;
    return 300;
  }

  function aspect(img) {
    return img.naturalWidth / img.naturalHeight;
  }

  function rowHeight(items, start, count, width, g) {
    let ratios = 0;
    for (let i = start; i < start + count; i++) {
      ratios += aspect(items[i].querySelector('img'));
    }
    return (width - g * (count - 1)) / ratios;
  }

  function chooseRowCount(items, start, maxCount, width, g) {
    const remaining = items.length - start;

    if (remaining === 1) return 1;

    const candidates = [];

    // En escritorio alternamos 2/3 fotos por fila. En móvil mantenemos
    // dos columnas, pero seguimos justificando la fila completa.
    const min = maxCount === 2 ? 2 : 2;
    const max = Math.min(maxCount, remaining);

    for (let n = min; n <= max; n++) {
      // Evita dejar una última fila de una sola foto cuando hay otra
      // combinación posible.
      const left = remaining - n;
      if (left === 1 && remaining > n) continue;

      const h = rowHeight(items, start, n, width, g);
      const deviation = Math.abs(h - targetHeight());

      // Penalización suave para filas exageradamente altas o bajas.
      const penalty = h > targetHeight() * 1.65
        ? (h - targetHeight() * 1.65) * 3
        : h < targetHeight() * 0.55
          ? (targetHeight() * 0.55 - h) * 2
          : 0;

      // Pequeña preferencia alterna para que no termine siendo siempre
      // 3 + 3 + 3 + 3.
      const rhythm = (Math.floor(start / 2) % 2 === 0)
        ? (n === 2 ? 0 : 8)
        : (n === 3 ? 0 : 8);

      candidates.push({
        n,
        score: deviation + penalty + rhythm
      });
    }

    candidates.sort((a, b) => a.score - b.score);
    return candidates[0].n;
  }

  function layout(gallery) {
    const items = Array.from(gallery.querySelectorAll('.gallery__item'));
    const g = gap();
    const width = gallery.clientWidth;

    if (!width || !items.length) return;

    const maxPerRow = columns();
    let y = 0;
    let start = 0;

    gallery.style.position = 'relative';
    gallery.style.height = '0px';

    while (start < items.length) {
      // Si todavía hay imágenes sin cargar, no inventamos dimensiones.
      // Esperamos al evento load y recalculamos toda la composición.
      const available = items.slice(start, start + maxPerRow);
      if (available.some(item => {
        const img = item.querySelector('img');
        return !img || !img.naturalWidth || !img.naturalHeight;
      })) {
        return;
      }

      const count = chooseRowCount(items, start, maxPerRow, width, g);
      const rowItems = items.slice(start, start + count);

      let ratioSum = 0;
      rowItems.forEach(item => {
        ratioSum += aspect(item.querySelector('img'));
      });

      const rowHeight = (width - g * (count - 1)) / ratioSum;
      let x = 0;

      rowItems.forEach((item, index) => {
        const img = item.querySelector('img');
        const ratio = aspect(img);

        // El último elemento absorbe cualquier error de redondeo para que
        // la fila termine exactamente en el borde derecho.
        let itemWidth;
        if (index === rowItems.length - 1) {
          itemWidth = width - x;
        } else {
          itemWidth = ratio * rowHeight;
        }

        item.dataset.row = String(Math.floor(start / maxPerRow));
        item.dataset.orientation =
          ratio > 1.05 ? 'landscape' :
          ratio < 0.95 ? 'portrait' : 'square';

        item.style.position = 'absolute';
        item.style.left = x + 'px';
        item.style.top = y + 'px';
        item.style.width = itemWidth + 'px';
        item.style.height = rowHeight + 'px';

        x += itemWidth + g;
      });

      y += rowHeight + g;
      start += count;
    }

    gallery.style.height = Math.max(0, y - g) + 'px';
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
    document.querySelectorAll('.gallery__item').forEach(function (item) {
      reveal.observe(item);
    });

    document.querySelectorAll('.gallery img').forEach(function (img) {
      const redraw = function () {
        layout(img.closest('.gallery'));
      };

      if (img.complete && img.naturalWidth) {
        redraw();
      } else {
        img.addEventListener('load', redraw, { once: true });
      }
    });

    if (digital) sectionObserver.observe(digital);
    if (analogue) sectionObserver.observe(analogue);
    if (modeEl) setTimeout(function () {
      modeEl.classList.add('visible');
    }, 400);

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
