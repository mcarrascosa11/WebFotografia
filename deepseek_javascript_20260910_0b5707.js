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

  function applyOrientation(fig){
    const img=fig.querySelector('img');
    if(!img||!img.naturalWidth)return;
    fig.classList.remove('is-landscape','is-portrait','is-square');
    fig.classList.add('is-'+orientation(img));
  }

  function layoutPairs(gallery){
    const items=[...gallery.querySelectorAll('.gallery__item')];
    for(let i=0;i<items.length;i+=2){
      const a=items[i];
      const b=items[i+1];
      if(!a||!b)continue;
      const ai=a.querySelector('img');
      const bi=b.querySelector('img');
      if(!ai||!bi||!ai.naturalWidth||!bi.naturalWidth)continue;
      const ao=orientation(ai);
      const bo=orientation(bi);

      let aSpan=1,bSpan=2;
      if(ao==='landscape'&&bo!=='landscape'){aSpan=2;bSpan=1;}
      else if(ao!=='landscape'&&bo==='landscape'){aSpan=1;bSpan=2;}
      else if(ao==='square'&&bo!=='square'){aSpan=1;bSpan=2;}
      else if(bo==='square'&&ao!=='square'){aSpan=2;bSpan=1;}
      else if((i/2)%2===1){aSpan=2;bSpan=1;}
      if(ao==='portrait'&&bo==='portrait'&&i>0&&(i/2)%3===0){aSpan=2;bSpan=1;}

      a.dataset.span=String(aSpan);
      b.dataset.span=String(bSpan);
    }
  }

  function setupGallery(gallery){
    const items=[...gallery.querySelectorAll('.gallery__item')];
    items.forEach(fig=>{
      const img=fig.querySelector('img');
      if(!img)return;
      const classify=()=>{applyOrientation(fig);layoutPairs(gallery);};
      if(img.complete&&img.naturalWidth>0)classify();
      img.addEventListener('load',classify,{once:true});
    });
    window.addEventListener('load',()=>layoutPairs(gallery),{once:true});
  }

  document.querySelectorAll('.gallery').forEach(setupGallery);

  const reveal=new IntersectionObserver(entries=>entries.forEach(entry=>{
    if(entry.isIntersecting){entry.target.classList.add('revealed');reveal.unobserve(entry.target);}
  }),{rootMargin:'0px 0px -6% 0px',threshold:.02});
  document.querySelectorAll('.gallery__item').forEach(item=>reveal.observe(item));

  const modeEl=document.getElementById('modeIndicator');
  const digital=document.getElementById('digital');
  const analogue=document.getElementById('analogica');
  function setMode(name){
    const isAnalogue=name==='analogue';
    document.body.classList.toggle('mode-analogue',isAnalogue);
    if(modeEl)modeEl.textContent=isAnalogue?'ANALÓGICA':'DIGITAL';
  }
  const sectionObs=new IntersectionObserver(entries=>entries.forEach(entry=>{
    if(entry.isIntersecting)setMode(entry.target.id==='analogica'?'analogue':'digital');
  }),{rootMargin:'-40% 0px -40% 0px',threshold:0});
  if(digital)sectionObs.observe(digital);
  if(analogue)sectionObs.observe(analogue);
  setMode('digital');
  setTimeout(()=>modeEl?.classList.add('visible'),300);
})();
