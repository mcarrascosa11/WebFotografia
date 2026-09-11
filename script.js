(function(){
'use strict';

const templates={
  a:[['s1',1,1,8,7],['s2',9,1,4,7],['s3',1,8,5,5],['s4',6,8,7,5]],
  b:[['s1',1,1,4,12],['s2',5,1,4,4],['s3',9,1,4,4],['s4',5,5,8,8]],
  c:[['s1',1,1,4,5],['s2',5,1,4,5],['s3',9,1,4,8],['s4',1,6,8,7],['s5',9,9,4,4]],
  d:[['s1',1,1,5,5],['s2',7,1,6,4],['s3',1,7,4,6],['s4',6,6,7,6]]
};

let galleryImages=[];
let currentIndex=-1;
let touchStartX=0;
let touchStartY=0;
let scrollAnimation=null;

function renderZone(zone,index){
  const section=document.createElement('section');
  section.className='gallery-zone';
  section.dataset.template=zone.template;
  section.dataset.zone=String(index+1);
  const grid=document.createElement('div');
  grid.className='zone-grid zone-grid--'+zone.template;

  const defs=Object.fromEntries(templates[zone.template].map(d=>[d[0],d]));
  Object.entries(zone.slots||{}).forEach(([slotId,data])=>{
    const def=defs[slotId];
    if(!def||!data||!data.src)return;
    const figure=document.createElement('figure');
    figure.className='zone__item';
    const mobile=window.matchMedia('(max-width: 640px)').matches;
    if(mobile){
      const start=def[1], end=def[1]+def[3]-1;
      const mobileStart=Math.floor((start-1)/4)+1;
      const mobileEnd=Math.ceil(end/4);
      figure.style.gridColumn=`${mobileStart} / ${mobileEnd+1}`;
    }else{
      figure.style.gridColumn=`${def[1]} / span ${def[3]}`;
    }
    figure.style.gridRow=`${def[2]} / span ${def[4]}`;
    figure.dataset.photoSrc=data.src;

    const img=document.createElement('img');
    img.src=data.src;
    img.alt='Fotografía de boda';
    img.loading='lazy';
    img.decoding='async';
    const x=Number.isFinite(data.x)?data.x:50;
    const y=Number.isFinite(data.y)?data.y:50;
    const zoom=Number.isFinite(data.zoom)?data.zoom:1;
    img.style.objectPosition=`${x}% ${y}%`;
    img.style.transform=`scale(${zoom})`;
    figure.appendChild(img);
    grid.appendChild(figure);
  });

  section.appendChild(grid);
  return section;
}

function updateMode(){
  const a=document.getElementById('analogica');
  if(!a)return;
  const rect=a.getBoundingClientRect();
  document.body.classList.toggle('mode-analogue',rect.top < window.innerHeight*.55);
}

function buildLightbox(){
  const overlay=document.createElement('div');
  overlay.className='lightbox';
  overlay.setAttribute('aria-hidden','true');
  overlay.innerHTML=`
    <button class="lightbox__close" type="button" aria-label="Cerrar">×</button>
    <button class="lightbox__prev" type="button" aria-label="Anterior">‹</button>
    <figure class="lightbox__frame">
      <img class="lightbox__image" alt="Fotografía ampliada">
    </figure>
    <button class="lightbox__next" type="button" aria-label="Siguiente">›</button>
    <div class="lightbox__counter" aria-live="polite"></div>
  `;
  document.body.appendChild(overlay);

  overlay.querySelector('.lightbox__close').addEventListener('click',closeLightbox);
  overlay.querySelector('.lightbox__prev').addEventListener('click',()=>showLightbox(currentIndex-1));
  overlay.querySelector('.lightbox__next').addEventListener('click',()=>showLightbox(currentIndex+1));
  overlay.addEventListener('click',e=>{
    if(e.target===overlay)closeLightbox();
  });
  overlay.addEventListener('touchstart',e=>{
    const t=e.changedTouches[0];
    touchStartX=t.clientX;
    touchStartY=t.clientY;
  },{passive:true});
  overlay.addEventListener('touchend',e=>{
    const t=e.changedTouches[0];
    const dx=t.clientX-touchStartX;
    const dy=t.clientY-touchStartY;
    if(Math.abs(dx)>50 && Math.abs(dx)>Math.abs(dy)){
      showLightbox(currentIndex+(dx<0?1:-1));
    }
  },{passive:true});
}

function collectGalleryImages(){
  galleryImages=Array.from(document.querySelectorAll('.zone__item img'));
  galleryImages.forEach((img,index)=>{
    img.dataset.galleryIndex=String(index);
    img.closest('.zone__item').addEventListener('click',e=>{
      e.preventDefault();
      showLightbox(index);
    });
  });
}

function showLightbox(index){
  if(!galleryImages.length)return;
  currentIndex=(index+galleryImages.length)%galleryImages.length;
  const overlay=document.querySelector('.lightbox');
  const source=galleryImages[currentIndex];
  const image=overlay.querySelector('.lightbox__image');
  image.src=source.currentSrc||source.src;
  image.alt=source.alt||'Fotografía ampliada';
  overlay.querySelector('.lightbox__counter').textContent=`${currentIndex+1} / ${galleryImages.length}`;
  overlay.classList.add('is-open');
  overlay.setAttribute('aria-hidden','false');
  document.body.classList.add('lightbox-open');
}

function closeLightbox(){
  const overlay=document.querySelector('.lightbox');
  if(!overlay)return;
  overlay.classList.remove('is-open');
  overlay.setAttribute('aria-hidden','true');
  document.body.classList.remove('lightbox-open');
}

function onKeydown(e){
  const overlay=document.querySelector('.lightbox');
  if(!overlay||!overlay.classList.contains('is-open'))return;
  if(e.key==='Escape')closeLightbox();
  if(e.key==='ArrowLeft')showLightbox(currentIndex-1);
  if(e.key==='ArrowRight')showLightbox(currentIndex+1);
}

function fastScrollTo(target){
  if(scrollAnimation)cancelAnimationFrame(scrollAnimation);
  const start=window.scrollY;
  const destination=Math.max(0,start+target.getBoundingClientRect().top);
  const distance=destination-start;
  const duration=Math.min(650,Math.max(350,Math.abs(distance)*0.45));
  const startTime=performance.now();

  function easeOutCubic(t){return 1-Math.pow(1-t,3);}
  function step(now){
    const progress=Math.min(1,(now-startTime)/duration);
    window.scrollTo(0,start+distance*easeOutCubic(progress));
    if(progress<1)scrollAnimation=requestAnimationFrame(step);
    else scrollAnimation=null;
  }
  scrollAnimation=requestAnimationFrame(step);
}

function init(){
  buildLightbox();
  fetch('gallery-config.json',{cache:'no-store'})
    .then(r=>{
      if(!r.ok)throw new Error('No se pudo cargar la composición');
      return r.json();
    })
    .then(config=>{
      const digital=document.getElementById('digital');
      const analogue=document.getElementById('analogica');
      (config.zones||[]).forEach((zone,i)=>{
        const target=zone.type==='analogue'?analogue:digital;
        if(target)target.appendChild(renderZone(zone,i));
      });
      collectGalleryImages();
      updateMode();
    })
    .catch(err=>{
      console.error(err);
      document.body.classList.add('config-error');
    });

  document.querySelectorAll('.header__mode-link').forEach(link=>{
    link.addEventListener('click',e=>{
      const target=document.querySelector(link.getAttribute('href'));
      if(!target)return;
      e.preventDefault();
      fastScrollTo(target);
      history.replaceState(null,'',link.getAttribute('href'));
    });
  });

  window.addEventListener('scroll',updateMode,{passive:true});
  document.addEventListener('keydown',onKeydown);
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
else init();
})();
