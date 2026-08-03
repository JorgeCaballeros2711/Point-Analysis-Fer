// ZOOM MAP
let compMapScale=1,compMapX=0,compMapY=0,isDragging=false,dragStartX=0,dragStartY=0;
function loadCompMap(input){
  const f=input.files[0];if(!f)return;
  const reader=new FileReader();
  reader.onload=e=>{
    const src=e.target.result;
    const inner=document.getElementById('comp-map-inner');
    const wrap=document.getElementById('comp-map-wrap');
    inner.innerHTML='';
    const img=document.createElement('img');img.src=src;
    img.style.cssText='max-width:100%;max-height:500px;display:block;pointer-events:none';
    img.onload=()=>{inner.style.transform='';compMapScale=1;compMapX=0;compMapY=0;};
    inner.appendChild(img);wrap.classList.add('has-img');
    document.getElementById('comp-zoom-controls').style.display='flex';
    document.getElementById('comp-map-change').style.display='block';
    initZoomEvents();
    // Save to IMG_STORE per point (renderCompMap reads from here)
    if(CURRENT_POINT&&CURRENT_POINT._mapKey){
      IMG_STORE[CURRENT_POINT._mapKey+'__comp-map']=src;
      if(!CTX_STORE[CURRENT_POINT._mapKey])CTX_STORE[CURRENT_POINT._mapKey]={};
      CTX_STORE[CURRENT_POINT._mapKey].compMapSrc=src;
    }
  };
  reader.readAsDataURL(f);
}
function initZoomEvents(){
  const wrap=document.getElementById('comp-map-wrap');
  wrap.addEventListener('wheel',e=>{e.preventDefault();compMapScale=Math.max(0.5,Math.min(8,compMapScale*(e.deltaY>0?0.9:1.1)));applyTransform();},{passive:false});
  wrap.addEventListener('mousedown',e=>{isDragging=true;dragStartX=e.clientX-compMapX;dragStartY=e.clientY-compMapY;wrap.style.cursor='grabbing';});
  window.addEventListener('mousemove',e=>{if(!isDragging)return;compMapX=e.clientX-dragStartX;compMapY=e.clientY-dragStartY;applyTransform();});
  window.addEventListener('mouseup',()=>{isDragging=false;const w=document.getElementById('comp-map-wrap');if(w)w.style.cursor='grab';});
  let ltd=0;
  wrap.addEventListener('touchstart',e=>{if(e.touches.length===2)ltd=Math.hypot(e.touches[0].clientX-e.touches[1].clientX,e.touches[0].clientY-e.touches[1].clientY);else if(e.touches.length===1){isDragging=true;dragStartX=e.touches[0].clientX-compMapX;dragStartY=e.touches[0].clientY-compMapY;}},{passive:true});
  wrap.addEventListener('touchmove',e=>{if(e.touches.length===2){const d=Math.hypot(e.touches[0].clientX-e.touches[1].clientX,e.touches[0].clientY-e.touches[1].clientY);compMapScale=Math.max(0.5,Math.min(8,compMapScale*(d/ltd)));ltd=d;applyTransform();}else if(e.touches.length===1&&isDragging){compMapX=e.touches[0].clientX-dragStartX;compMapY=e.touches[0].clientY-dragStartY;applyTransform();}},{passive:true});
  wrap.addEventListener('touchend',()=>{isDragging=false;});
}
function applyTransform(){const inner=document.getElementById('comp-map-inner');if(inner)inner.style.transform='translate('+compMapX+'px,'+compMapY+'px) scale('+compMapScale+')';}
function zoomMap(f){compMapScale=Math.max(0.5,Math.min(8,compMapScale*f));applyTransform();}
function resetZoom(){compMapScale=1;compMapX=0;compMapY=0;applyTransform();}



// ── TOGGLE SECTIONS ──
function toggleSection(sectionId, tabId, show){
  const sec=document.getElementById(sectionId);
  const tab=document.getElementById(tabId);
  if(sec) sec.style.display=show?'':'none';
  if(tab) tab.style.display=show?'':'none';
  // If hiding active section, go to Contexto
  if(!show && sec && sec.classList.contains('active')){
    showSection('s-contexto', document.querySelector('.nav-tab'));
  }
}

