function renderImg(cid, key, inputEl){
  const cont=document.getElementById(cid);
  if(!cont)return;
  const src=IMG_STORE[key];
  cont.querySelectorAll('img,button.chg-btn,.ri-zoom-ctrl').forEach(function(el){el.remove();});
  cont.querySelectorAll('p,small,span').forEach(function(el){el.style.display='';});
  if(!src) return;
  cont.querySelectorAll('p,small,span').forEach(function(el){el.style.display='none';});
  cont.style.overflow='hidden';
  var sc=1,ox=0,oy=0,dr=false,sx=0,sy=0;
  const img=document.createElement('img');
  img.src=src;
  img.style.cssText='position:absolute;top:0;left:0;width:100%;height:100%;object-fit:cover;display:block;cursor:grab;transform-origin:0 0;user-select:none';
  function applyT(){img.style.transform='translate('+ox+'px,'+oy+'px) scale('+sc+')';}
  img.addEventListener('mousedown',function(e){dr=true;sx=e.clientX-ox;sy=e.clientY-oy;img.style.cursor='grabbing';e.preventDefault();});
  document.addEventListener('mousemove',function(e){if(!dr)return;ox=e.clientX-sx;oy=e.clientY-sy;applyT();});
  document.addEventListener('mouseup',function(){if(dr){dr=false;img.style.cursor='grab';}});
  img.addEventListener('wheel',function(e){e.preventDefault();var d=e.deltaY<0?1.1:0.9;sc=Math.max(0.3,Math.min(8,sc*d));applyT();},{passive:false});
  cont.appendChild(img);
  var zc=document.createElement('div');
  zc.className='ri-zoom-ctrl';
  zc.style.cssText='position:absolute;bottom:.5rem;right:.5rem;display:flex;flex-direction:column;gap:.25rem;z-index:10';
  ['+','-','↺'].forEach(function(sym,idx){
    var b=document.createElement('button');
    b.textContent=sym;
    b.title=idx===0?'Acercar':idx===1?'Alejar':'Restablecer';
    b.style.cssText='background:rgba(29,26,116,.85);color:white;border:none;border-radius:6px;width:28px;height:28px;font-size:.9rem;cursor:pointer;font-weight:700;line-height:1';
    b.onclick=function(e){e.stopPropagation();if(idx===0){sc=Math.min(8,sc*1.25);}else if(idx===1){sc=Math.max(0.3,sc/1.25);}else{sc=1;ox=0;oy=0;}applyT();};
    zc.appendChild(b);
  });
  cont.appendChild(zc);
  var btn=document.createElement('button');
  btn.className='chg-btn';
  btn.textContent='🔄';
  btn.title='Cambiar imagen';
  btn.style.cssText='position:absolute;top:.4rem;right:.4rem;background:rgba(29,26,116,.8);color:white;border:none;border-radius:6px;padding:.25rem .5rem;font-size:.75rem;cursor:pointer;z-index:11';
  btn.onclick=function(ev){ev.stopPropagation();if(inputEl)inputEl.click();};
  cont.appendChild(btn);
}


function renderCompMap(pName){
  const key=pName+'__comp-map';
  const src=IMG_STORE[key];
  const inner=document.getElementById('comp-map-inner');
  const wrap=document.getElementById('comp-map-wrap');
  if(!inner||!wrap)return;
  inner.innerHTML='';
  compMapScale=1;compMapX=0;compMapY=0;
  if(!src){
    wrap.classList.remove('has-img');
    document.getElementById('comp-zoom-controls').style.display='none';
    document.getElementById('comp-map-change').style.display='none';
    inner.innerHTML='<div class="zoom-map-placeholder" onclick="document.getElementById(\'comp-map-file\').click()"><span style="font-size:2rem;opacity:.4">🗺</span><span>Haz clic para subir imagen</span><span style="font-size:.75rem;color:var(--muted)">Usa la rueda del ratón para hacer zoom</span></div>';
    return;
  }
  const img=document.createElement('img');
  img.src=src;
  img.style.cssText='max-width:100%;max-height:500px;display:block;pointer-events:none';
  img.onload=()=>{inner.style.transform='';};
  inner.appendChild(img);
  wrap.classList.add('has-img');
  document.getElementById('comp-zoom-controls').style.display='flex';
  document.getElementById('comp-map-change').style.display='block';
  initZoomEvents();
}


