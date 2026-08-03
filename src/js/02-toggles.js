function toggleComp(name){
  if(!MANUAL_SELECTED) MANUAL_SELECTED=new Set();
  if(MANUAL_SELECTED.has(name)) MANUAL_SELECTED.delete(name);
  else MANUAL_SELECTED.add(name);
  buildComparables();
}


function toggleOverlap(show){
  toggleSection('s-overlap','tab-overlap',show);
  if(CURRENT_POINT&&CURRENT_POINT._mapKey){
    if(!CTX_STORE[CURRENT_POINT._mapKey])CTX_STORE[CURRENT_POINT._mapKey]={};
    CTX_STORE[CURRENT_POINT._mapKey].ovlVisible=show;
  }
}


function toggleCal(show){
  toggleSection('s-calificacion','tab-calificacion',show);
  if(CURRENT_POINT&&CURRENT_POINT._mapKey){
    if(!CTX_STORE[CURRENT_POINT._mapKey])CTX_STORE[CURRENT_POINT._mapKey]={};
    CTX_STORE[CURRENT_POINT._mapKey].calVisible=show;
  }
}


function deleteRoute(i,pName){
  if(!pName)pName=CURRENT_POINT?CURRENT_POINT[PT.punto]:'';
  saveRouteState(pName);
  delete IMG_STORE[pName+'_acc_'+i];
  for(var j=i+1;j<(ROUTES[pName]||[]).length;j++){
    const ok=pName+'_acc_'+j,nk=pName+'_acc_'+(j-1);
    if(IMG_STORE[ok]){IMG_STORE[nk]=IMG_STORE[ok];delete IMG_STORE[ok];}
  }
  if(ROUTES[pName])ROUTES[pName].splice(i,1);
  renderRoutes(pName);
}


function saveRouteState(pName){
  const list=ROUTES[pName]||[];
  const grid=document.getElementById('acceso-grid');
  if(!grid)return;
  list.forEach(function(r,i){
    const hdr=grid.querySelector('[data-route-name="'+i+'"]');
    if(hdr) r.name=hdr.textContent.trim()||r.name;
    const desc=grid.querySelector('[data-route-desc="'+i+'"]');
    if(desc) r.desc=desc.innerHTML||r.desc;
  });
}


