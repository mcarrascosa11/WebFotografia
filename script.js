(function () {
  'use strict';

  document.documentElement.classList.add('js-ready');

  const DESKTOP_GAP = 14;
  const MOBILE_GAP = 10;

  /*
   * MOSAICO EDITORIAL MODULAR
   * -------------------------
   * La retícula manda y las fotografías se adaptan a ella.
   * No hay posiciones absolutas ni masonry: cada bloque es una composición
   * cerrada de CSS Grid, de modo que no aparecen huecos verticales.
   */

  const templatesDesktop = [
    // 5 fotos: horizontal protagonista + cuatro apoyos.
    [
      { c: 1, r: 1, cs: 2, rs: 1 },
      { c: 3, r: 1, cs: 1, rs: 1 },
      { c: 1, r: 2, cs: 1, rs: 1 },
      { c: 2, r: 2, cs: 1, rs: 1 },
      { c: 3, r: 2, cs: 1, rs: 1 }
    ],
    // 5 fotos: vertical protagonista + cuatro apoyos.
    [
      { c: 1, r: 1, cs: 1, rs: 2 },
      { c: 2, r: 1, cs: 1, rs: 1 },
      { c: 3, r: 1, cs: 1, rs: 1 },
      { c: 2, r: 2, cs: 1, rs: 1 },
      { c: 3, r: 2, cs: 1, rs: 1 }
    ],
    // 6 fotos: dos piezas de dos columnas + dos pequeñas abajo.
    [
      { c: 1, r: 1, cs: 1, rs: 1 },
      { c: 2, r: 1, cs: 2, rs: 1 },
      { c: 1, r: 2, cs: 2, rs: 1 },
      { c: 3, r: 2, cs: 1, rs: 1 },
      { c: 1, r: 3, cs: 1, rs: 1 },
      { c: 2, r: 3, cs: 2, rs: 1 }
    ],
    // 5 fotos: composición desplazada.
    [
      { c: 1, r: 1, cs: 1, rs: 1 },
      { c: 2, r: 1, cs: 2, rs: 1 },
      { c: 1, r: 2, cs: 2, rs: 1 },
      { c: 3, r: 2, cs: 1, rs: 1 },
      { c: 1, r: 3, cs: 3, rs: 1 }
    ],
    // 5 fotos: gran horizontal abajo.
    [
      { c: 1, r: 1, cs: 1, rs: 1 },
      { c: 2, r: 1, cs: 1, rs: 1 },
      { c: 3, r: 1, cs: 1, rs: 1 },
      { c: 1, r: 2, cs: 1, rs: 1 },
      { c: 2, r: 2, cs: 2, rs: 1 }
    ]
  ];

  const blockCounts = [5, 5, 6, 5, 6]; // 27 digitales

  function isMobile() {
    return window.innerWidth <= 640;
  }

  function gap() {
    return isMobile() ? MOBILE_GAP : DESKTOP_GAP;
  }

  function getTemplate(index, count) {
    if (isMobile()) return null;
    return templatesDesktop[index % templatesDesktop.length].slice(0, count);
  }

  function clearBlocks(gallery) {
    const items = Array.from(gallery.querySelectorAll('.gallery__item'));
    items.forEach(function (item) {
      item.removeAttribute('style');
      item.removeAttribute('data-block');
      item.removeAttribute('data-orientation');
      item.classList.remove('gallery__block-item');
    });
    gallery.querySelectorAll('.gallery__block').forEach(function (block) {
      block.replaceWith(...Array.from(block.children));
    });
    return items;
  }

  function makeBlocks(gallery) {
    const items = clearBlocks(gallery);
    const fragment = document.createDocumentFragment();
    let cursor = 0;
    let blockIndex = 0;

    if (isMobile()) {
      // En móvil: 2 columnas, ritmo sencillo y sin huecos. El último elemento
      // de una pareja impar ocupa toda la fila.
      const block = document.createElement('div');
      block.className = 'gallery__block gallery__block--mobile';
      items.forEach(function (item, index) {
        const img = item.querySelector('img');
        const ratio = img.naturalWidth / img.naturalHeight;
        item.classList.add('gallery__block-item');
        item.dataset.orientation = ratio > 1.05 ? 'landscape' : ratio < 0.95 ? 'portrait' : 'square';
        if (index === items.length - 1 && items.length % 2 === 1) {
          item.style.gridColumn = '1 / -1';
        }
        block.appendChild(item);
      });
      fragment.appendChild(block);
      gallery.appendChild(fragment);
      return;
    }

    while (cursor < items.length) {
      let count = blockCounts[blockIndex % blockCounts.length];
      count = Math.min(count, items.length - cursor);

      // El bloque final se completa con una plantilla válida siempre que sea
      // posible. Para 1–2 fotografías usamos una composición de ancho total.
      const template = getTemplate(blockIndex, count);
      const block = document.createElement('div');
      block.className = 'gallery__block gallery__block--desktop';
      block.dataset.block = String(blockIndex);

      if (template) {
        block.style.gridTemplateRows = template.some(t => t.r === 3)
          ? 'repeat(3, minmax(190px, 26vw))'
          : 'repeat(2, minmax(210px, 28vw))';
      }

      for (let i = 0; i < count; i++) {
        const item = items[cursor + i];
        const img = item.querySelector('img');
        const ratio = img.naturalWidth / img.naturalHeight;
        item.classList.add('gallery__block-item');
        item.dataset.block = String(blockIndex);
        item.dataset.orientation = ratio > 1.05 ? 'landscape' : ratio < 0.95 ? 'portrait' : 'square';

        const placement = template && template[i];
        if (placement) {
          item.style.gridColumn = placement.c + ' / span ' + placement.cs;
          item.style.gridRow = placement.r + ' / span ' + placement.rs;
        } else {
          item.style.gridColumn = '1 / -1';
        }

        block.appendChild(item);
      }

      fragment.appendChild(block);
      cursor += count;
      blockIndex += 1;
    }

    gallery.appendChild(fragment);
  }

  function layoutAll() {
    document.querySelectorAll('.gallery').forEach(makeBlocks);
    document.documentElement.classList.add('gallery-ready');
  }

  const reveal = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
        reveal.unobserve(entry.target);
      }
    });
  }, { rootMargin: '0px 0px -4% 0px', threshold: 0.01 });

  const digital = document.getElementById('digital');
  const analogue = document.getElementById('analogica');

  const sectionObserver = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      document.body.classList.toggle('mode-analogue', entry.target.id === 'analogica');
    });
  }, { rootMargin: '-35% 0px -35% 0px', threshold: 0 });

  function waitForImages() {
    const images = Array.from(document.querySelectorAll('.gallery img'));
    return Promise.all(images.map(function (img) {
      if (img.complete && img.naturalWidth) return Promise.resolve();
      return new Promise(function (resolve) {
        img.addEventListener('load', resolve, { once: true });
        img.addEventListener('error', resolve, { once: true });
      });
    }));
  }

  function init() {
    waitForImages().then(function () {
      layoutAll();
      document.querySelectorAll('.gallery__item').forEach(function (item) {
        reveal.observe(item);
      });
    });

    if (digital) sectionObserver.observe(digital);
    if (analogue) sectionObserver.observe(analogue);

    let resizeTimer;
    window.addEventListener('resize', function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () {
        document.documentElement.classList.remove('gallery-ready');
        layoutAll();
        document.querySelectorAll('.gallery__item').forEach(function (item) {
          reveal.observe(item);
        });
      }, 150);
    }, { passive: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
