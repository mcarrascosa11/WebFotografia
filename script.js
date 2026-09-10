(function(){
'use strict';

const templates={
  a:[['s1',1,1,8,7],['s2',9,1,4,7],['s3',1,8,5,5],['s4',6,8,7,5]],
  b:[['s1',1,1,4,12],['s2',5,1,4,4],['s3',9,1,4,4],['s4',5,5,8,8]],
  c:[['s1',1,1,4,5],['s2',5,1,4,5],['s3',9,1,4,8],['s4',1,6,8,7],['s5',9,9,4,4]],
  d:[['s1',1,1,5,5],['s2',7,1,6,4],['s3',1,7,4,6],['s4',6,6,7,6]]
};

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
    figure.style.gridColumn=`${def[1]} / span ${def[3]}`;
    figure.style.gridRow=`${def[2]} / span ${def[4]}`;
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
  const active=rect.top < window.innerHeight*.55;
  document.body.classList.toggle('mode-analogue',active);
}

function init(){
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
      target.scrollIntoView({behavior:'smooth',block:'start'});
    });
  });

  window.addEventListener('scroll',updateMode,{passive:true});
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
else init();
})();
