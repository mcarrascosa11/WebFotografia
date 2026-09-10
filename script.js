(function () {
  'use strict';

  document.documentElement.classList.add('js-ready');

  /*
   * MOSAICO EDITORIAL
   * -----------------
   * La galería vuelve a una retícula de 3 columnas en escritorio, pero ya no
   * se fuerza a filas perfectamente alineadas. Cada fotografía conserva su
   * proporción real y puede ocupar 1 o 2 columnas. El algoritmo busca siempre
   * la posición con menor altura final para aprovechar el espacio y mantener
   * una composición irregular pero controlada.
   *
   * Importante: no se maqueta nada hasta que TODAS las imágenes estén cargadas.
   * Así nunca se ve la pila inicial de fotos unas encima de otras.
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

  function aspect(img) {
    return img.naturalWidth / img.naturalHeight;
  }

  function preferredSpan(type, index, count) {
    if (count < 2) return 1;

    // Alternancia deliberada: algunos horizontales se convierten en piezas
    // protagonistas de dos columnas; las verticales mantienen normalmente
    // una columna para conservar variedad de ritmo.
    if (type === 'landscape' && index % 6 === 1) return 2;
    if (type === 'landscape' && index % 9 === 5) return 2;
    if (type === 'portrait' && index % 13 === 8) return 2;
    return 1;
  }

  function candidatesFor(span, start, heights, colWidth, g, img) {
    const count = heights.length;
    const candidates = [];

    for (let c = 0; c <= count - span; c++) {
      const top = Math.max.apply(null, heights.slice(c, c + span));
      const spread = Math.max.apply(null, heights.slice(c, c + span)) -
        Math.min.apply(null, heights.slice(c, c + span));
      const width = colWidth * span + g * (span - 1);
      const height = width / aspect(img);

      // Un span de 2 columnas solo entra cuando no crea un salto enorme sobre
      // la columna vecina. El umbral permite dinamismo sin grandes huecos.
      if (span === 2 && spread > Math.max(70, g * 5)) continue;

      const next = heights.slice();
      const bottom = top + height + g;
      for (let i = c; i < c + span; i++) next[i] = bottom;

      candidates.push({
        span,
        start: c,
        top,
        width,
        height,
        maxAfter: Math.max.apply(null, next),
        spreadAfter: Math.max.apply(null, next) - Math.min.apply(null, next)
      });
    }

    return candidates;
  }

  function layout(gallery) {
    const items = Array.from(gallery.querySelectorAll('.gallery__item'));
    const count = columns();
    const g = gap();
    const width = gallery.clientWidth;
    if (!width || !items.length) return false;

    const colWidth = (width - g * (count - 1)) / count;
    const heights = new Array(count).fill(0);

    gallery.style.position = 'relative';
    gallery.style.height = '0px';

    for (let index = 0; index < items.length; index++) {
      const item = items[index];
      const img = item.querySelector('img');

      if (!img || !img.naturalWidth || !img.naturalHeight) {
        return false;
      }

      const type = aspect(img) > 1.05 ? 'landscape' : aspect(img) < 0.95 ? 'portrait' : 'square';
      const wanted = preferredSpan(type, index, count);
      const options = [];

      // Primero valoramos el span buscado y después siempre dejamos disponible
      // el de una columna como alternativa de emergencia.
      if (wanted === 2) options.push(...candidatesFor(2, index, heights, colWidth, g, img));
      options.push(...candidatesFor(1, index, heights, colWidth, g, img));

      if (!options.length) return false;

      options.sort(function (a, b) {
        // Preferimos que la foto termine en la menor altura global posible.
        if (Math.abs(a.maxAfter - b.maxAfter) > 1) return a.maxAfter - b.maxAfter;

        // A igualdad, preferimos el span buscado para mantener el ritmo.
        if (a.span !== b.span) return a.span === wanted ? -1 : 1;

        // Y después, la opción que deje más equilibradas las columnas.
        if (Math.abs(a.spreadAfter - b.spreadAfter) > 1) return a.spreadAfter - b.spreadAfter;
        return a.start - b.start;
      });

      const chosen = options[0];
      item.dataset.orientation = type;
      item.dataset.span = String(chosen.span);
      item.style.position = 'absolute';
      item.style.left = (chosen.start * (colWidth + g)) + 'px';
      item.style.top = chosen.top + 'px';
      item.style.width = chosen.width + 'px';
      item.style.height = 'auto';

      const bottom = chosen.top + chosen.height + g;
      for (let c = chosen.start; c < chosen.start + chosen.span; c++) {
        heights[c] = bottom;
      }
    }

    gallery.style.height = Math.max(0, Math.max.apply(null, heights) - g) + 'px';
    return true;
  }

  function layoutAll() {
    let ok = true;
    document.querySelectorAll('.gallery').forEach(function (gallery) {
      if (!layout(gallery)) ok = false;
    });
    return ok;
  }

  const reveal = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
        reveal.unobserve(entry.target);
      }
    });
  }, { rootMargin: '0px 0px -5% 0px', threshold: 0.01 });

  const digital = document.getElementById('digital');
  const analogue = document.getElementById('analogica');

  const sectionObserver = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      document.body.classList.toggle('mode-analogue', entry.target.id === 'analogica');
    });
  }, { rootMargin: '-35% 0px -35% 0px', threshold: 0 });

  function init() {
    document.querySelectorAll('.gallery__item').forEach(function (item) {
      reveal.observe(item);
    });

    // Esperamos a que estén cargadas TODAS las fotografías antes de mostrar
    // la galería. El usuario nunca ve el estado de fotos apiladas.
    const images = Array.from(document.querySelectorAll('.gallery img'));
    const pending = images.map(function (img) {
      if (img.complete && img.naturalWidth) return Promise.resolve();
      return new Promise(function (resolve) {
        img.addEventListener('load', resolve, { once: true });
        img.addEventListener('error', resolve, { once: true });
      });
    });

    Promise.all(pending).then(function () {
      if (layoutAll()) {
        document.documentElement.classList.add('gallery-ready');
      }
    });

    if (digital) sectionObserver.observe(digital);
    if (analogue) sectionObserver.observe(analogue);

    let resizeTimer;
    window.addEventListener('resize', function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () {
        layoutAll();
      }, 120);
    }, { passive: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
