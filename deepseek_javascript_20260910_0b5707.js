(function(){
  'use strict';
  const root=document.documentElement;
  root.classList.remove('no-js');

  function orientation(img){
    const w=img.naturalWidth;
    const h=img.naturalHeight;
    if(!w||!h)return 'square';
    const r=w/h;
    if(r>1.08)return 'landscape';
    if(r<0.92)return 'portrait';
    return 'square';
  }

  function classifyAll(gallery){
    const items=[...gallery.querySelectorAll('.gallery__item')];
    const ready=items.filter(fig=>{
      const img=fig.querySelector('img');
      return img && img.complete && img.naturalWidth>0;
    });
    if(ready.length<items.length)return;

    items.forEach(fig=>{
      const img=fig.querySelector('img');
      const o=orientation(img);
      fig.classList.remove('is-landscape','is-portrait','is-square');
      fig.classList.add('is-'+o);
    });

    // La composición se construye por parejas que completan exactamente 3 columnas.
    // Una pareja siempre suma 3 columnas: 1+2. Se conserva el orden original.
    for(let i=0;i<items.length;i+=2){
      const a=items[i], b=items[i+1];
      if(!a)continue;
      a.dataset.span='1';
      if(!b)continue;
      b.dataset.span='2';

      const ao=a.classList.contains('is-landscape');
      const bo=b.classList.contains('is-landscape');
      const ap=a.classList.contains('is-portrait');
      const bp=b.classList.contains('is-portrait');

      // Si hay una horizontal y una vertical, la horizontal ocupa 2 y la vertical 1.
      if(ao&&!bo){a.dataset.span='2';b.dataset.span='1';}
      else if(!ao&&bo){a.dataset.span='1';b.dataset.span='2';}
      // En parejas homogéneas alternamos 1/2 para mantener ritmo.
      else if(i%4!==0){a.dataset.span='2';b.dataset.span='1';}
      // Cuadradas se quedan siempre en 1 columna cuando sea posible.
      if(a.classList.contains('is-square')&&b.dataset.span==='1'){a.dataset.span='1';b.dataset.span='2';}
      if(b.classList.contains('is-square')&&a.dataset.span==='2'){a.dataset.span='2';b.dataset.span='1';}

      // En una pareja vertical+vertical permitimos ocasionalmente una vertical a 2 columnas.
      if(ap&&bp&&i%6===0){a.dataset.span='2';b.dataset.span='1';}
    }
  }

  function setupGallery(gallery){
    const images=[...gallery.querySelectorAll('img')];
    const ready=()=>classifyAll(gallery);
    images.forEach(img=>{
      if(img.complete&&img.naturalWidth>0)img.decode?.().catch(()=>{}).finally(ready);
      else img.addEventListener('load',ready,{once:true});
    });
    // Fallback para caché y lazy-load.
    window.addEventListener('load',ready,{once:true});
    setTimeout(ready,1200);
  }

  document.querySelectorAll('.gallery').forEach(setupGallery);

  // Revelado suave. La imagen nunca queda oculta si JS falla.
  const reveal=new IntersectionObserver(entries=>entries.forEach(entry=>{
    if(entry.isIntersecting){entry.target.classList.add('revealed');reveal.unobserve(entry.target);}
  }),{rootMargin:'0px 0px -6% 0px',threshold:.02});
  document.querySelectorAll('.gallery__item').forEach(item=>reveal.observe(item));

  // Cambio automático de fondo y etiqueta entre DIGITAL y ANALÓGICA.
  const modeEl=document.getElementById('modeIndicator');
  const digital=document.getElementById('digital');
  const analogue=document.getElementById('analogica');

  function setMode(name){
    const analogueMode=name==='analogue';
    document.body.classList.toggle('mode-analogue',analogueMode);
    if(modeEl)modeEl.textContent=analogueMode?'ANALÓGICA':'DIGITAL';
  }

  const observer=new IntersectionObserver(entries=>{
    entries.forEach(entry=>{
      if(entry.isIntersecting)setMode(entry.target.id==='analogica'?'analogue':'digital');
    });
  },{rootMargin:'-40% 0px -40% 0px',threshold:0});

  if(digital)observer.observe(digital);
  if(analogue)observer.observe(analogue);
  setMode('digital');
  setTimeout(()=>modeEl?.classList.add('visible'),300);
})();
