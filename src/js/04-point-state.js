function saveCtxState(pName){
  if(!pName)return;
  // Save overlap table rows (all rows including default)
  const ovlRows=[];
  document.querySelectorAll('#overlap-tbody tr').forEach(function(tr){
    const tds=tr.querySelectorAll('td input');
    if(tds.length>=3) ovlRows.push({tienda:tds[0].value,dist:tds[1].value,vis:tds[2].value});
  });
  CTX_STORE[pName]={
    desc:(function(){const el=document.getElementById('ctx-descripcion');const t=el?el.textContent.trim():'';if(!t||t.includes('Generando contexto')||t.includes('Cargando contexto'))return '';return el?el.innerHTML:'';})()||'',
    fuente:   document.getElementById('ctx-fuente')?.value||'',
    accDesc:  document.getElementById('acc-descripcion')?.innerHTML||'',
    trbConc:  document.getElementById('trabajo-concentracion')?.innerHTML||'',
    domConc:  document.getElementById('domicilio-concentracion')?.innerHTML||'',
    trbComp:  document.getElementById('trabajo-comp-input')?.value||'',
    domComp:  document.getElementById('domicilio-comp-input')?.value||'',
    genConc:  document.getElementById('general-concentracion')?.innerHTML||'',
    rutConc:  document.getElementById('rutas-concentracion')?.innerHTML||'',
    genComp:  document.getElementById('general-comp-input')?.value||'',
    rutComp:  document.getElementById('rutas-comp-input')?.value||'',
    compDesc: document.getElementById('comparables-desc')?.textContent||'',
    ovlDesc:  document.getElementById('overlap-desc')?.innerHTML||'',
    ovlPct:   document.getElementById('overlap-pct')?.value||'',
    ovlVis:   document.getElementById('overlap-vis')?.value||'',
    ovlRows:  ovlRows,
    ovlVisible: document.getElementById('s-overlap')?.style.display!=='none',
    calScore: document.getElementById('cal-score')?.value||'',
    calDesc:  document.getElementById('cal-desc')?.innerHTML||'',
    calVisible: document.getElementById('s-calificacion')?.style.display!=='none',
    hall:     document.getElementById('hallazgos-texto')?.innerHTML||'',
    compCount: COMP_COUNT,
    compMins:  COMP_MINS,
    manualSel: MANUAL_SELECTED ? Array.from(MANUAL_SELECTED) : null,
    cmpTable: (function(){var el=document.getElementById('comparables-table');return el?el.innerHTML:'';})(),
    compMapSrc: (CURRENT_POINT&&CURRENT_POINT._mapKey)?IMG_STORE[CURRENT_POINT._mapKey+'__comp-map']||null:null,
    cumplEdits: JSON.parse(JSON.stringify(CUMPL_EDITS||{})),
    puntoEdits: (CURRENT_POINT&&CURRENT_POINT._mapKey)?JSON.parse(JSON.stringify(PUNTO_EDITS[CURRENT_POINT._mapKey]||{})):{},
    cumplImgs: (function(){var r={};[15,20,30].forEach(function(m){var mk=CURRENT_POINT&&CURRENT_POINT._mapKey;if(mk&&IMG_STORE[mk+'__cumpl-'+m])r[m]=IMG_STORE[mk+'__cumpl-'+m];});return r;})(),
    imgOverlap: (CURRENT_POINT&&CURRENT_POINT._mapKey)?IMG_STORE[CURRENT_POINT._mapKey+'__map-overlap-1']||null:null,
    calEdits: (CURRENT_POINT&&CURRENT_POINT._mapKey)?JSON.parse(JSON.stringify(CAL_EDITS[CURRENT_POINT._mapKey]||{})):null,
  };
}


function restoreCtxState(pName){
  const s=CTX_STORE[pName];
  if(!s){
    // Reset overlap to 0 for fresh point
    const _p=document.getElementById('overlap-pct');if(_p)_p.value='0';
    const _v=document.getElementById('overlap-vis');if(_v)_v.value='0';
    const _pd=document.getElementById('overlap-pct-display');if(_pd)_pd.textContent='0%';
    const _vd=document.getElementById('overlap-vis-display');if(_vd)_vd.textContent='0%';
    const _tb=document.getElementById('overlap-tbody');if(_tb){_tb.innerHTML='';addOverlapRow('','','');}
    drawGauge(0,0);
    return;
  }
  if(s.desc)    {const el=document.getElementById('ctx-descripcion');if(el)el.innerHTML=s.desc;}
  if(s.fuente)  {const el=document.getElementById('ctx-fuente');if(el)el.value=s.fuente;}
  if(s.accDesc) {const el=document.getElementById('acc-descripcion');if(el)el.innerHTML=s.accDesc;}
  if(s.trbConc) {const el=document.getElementById('trabajo-concentracion');if(el)el.innerHTML=s.trbConc;}
  if(s.domConc) {const el=document.getElementById('domicilio-concentracion');if(el)el.innerHTML=s.domConc;}
  if(s.trbComp) {const el=document.getElementById('trabajo-comp-input');if(el){el.value=s.trbComp;updateTags('trabajo',s.trbComp);}}
  if(s.domComp) {const el=document.getElementById('domicilio-comp-input');if(el){el.value=s.domComp;updateTags('domicilio',s.domComp);}}
  if(s.genConc) {const el=document.getElementById('general-concentracion');if(el)el.innerHTML=s.genConc;}
  if(s.rutConc) {const el=document.getElementById('rutas-concentracion');if(el)el.innerHTML=s.rutConc;}
  if(s.genComp) {const el=document.getElementById('general-comp-input');if(el){el.value=s.genComp;updateTags('general',s.genComp);}}
  if(s.rutComp) {const el=document.getElementById('rutas-comp-input');if(el){el.value=s.rutComp;updateTags('rutas',s.rutComp);}}
  if(s.compDesc){const el=document.getElementById('comparables-desc');if(el)el.textContent=s.compDesc;}
  if(s.ovlDesc) {const el=document.getElementById('overlap-desc');if(el)el.innerHTML=s.ovlDesc;}
  const _pctEl=document.getElementById('overlap-pct');if(_pctEl)_pctEl.value=s.ovlPct||'0';
  const _visEl=document.getElementById('overlap-vis');if(_visEl)_visEl.value=s.ovlVis||'0';
  const _pctDisp=document.getElementById('overlap-pct-display');if(_pctDisp)_pctDisp.textContent=(s.ovlPct||'0')+'%';
  const _visDisp=document.getElementById('overlap-vis-display');if(_visDisp)_visDisp.textContent=(s.ovlVis||'0')+'%';
  // Always clear overlap table and restore saved rows
  const _ovlTb=document.getElementById('overlap-tbody');
  if(_ovlTb){
    _ovlTb.innerHTML='';
    if(s.ovlRows&&s.ovlRows.length){
      s.ovlRows.forEach(function(r){
        addOverlapRow(r.tienda,r.dist,r.vis);
      });
    } else {
      addOverlapRow('','','');
    }
  }
  // Show/hide overlap and calificacion per point
  const _ovlVis=s.ovlVisible!==false;
  const _calVis=s.calVisible!==false;
  toggleSection('s-overlap','tab-overlap',_ovlVis);
  toggleSection('s-calificacion','tab-calificacion',_calVis);
  const togOvl=document.getElementById('tog-overlap');if(togOvl)togOvl.checked=_ovlVis;
  const togCal=document.getElementById('tog-cal');if(togCal)togCal.checked=_calVis;
  if(s.calScore){const el=document.getElementById('cal-score');if(el){el.value=s.calScore;updateScoreDisplay();}}
  if(s.cumplEdits){ CUMPL_EDITS=JSON.parse(JSON.stringify(s.cumplEdits)); }
  if(s.puntoEdits&&pName){ if(!PUNTO_EDITS[pName])PUNTO_EDITS[pName]={}; Object.assign(PUNTO_EDITS[pName],s.puntoEdits); }
  if(s.calEdits&&pName){ CAL_EDITS[pName]=JSON.parse(JSON.stringify(s.calEdits)); }
  if(typeof updateCalTable==='function') setTimeout(updateCalTable, 0);
  if(s.cumplImgs&&pName){ Object.keys(s.cumplImgs).forEach(function(m){ IMG_STORE[pName+'__cumpl-'+m]=s.cumplImgs[m]; }); }
  if(s.puntoEdits&&pName){ if(!PUNTO_EDITS[pName])PUNTO_EDITS[pName]={}; Object.assign(PUNTO_EDITS[pName],s.puntoEdits); }
  // Restore comparables state per point
  if(s.compCount!==undefined) COMP_COUNT=s.compCount;
  if(s.compMins!==undefined)  COMP_MINS=s.compMins;
  MANUAL_SELECTED=s.manualSel?new Set(s.manualSel):null;
  // Sync comp-map image to IMG_STORE
  if(s.compMapSrc&&pName) IMG_STORE[pName+'__comp-map']=s.compMapSrc;
  // Inject saved comparables table (skips buildComparables when no Excel)
  if(s.cmpTable){
    var _ct=document.getElementById('comparables-table');
    if(_ct) _ct.innerHTML=s.cmpTable;
    if(s.manualSel&&s.manualSel.length){
      var _pk=document.getElementById('comp-store-picker');
      if(_pk){ _pk.innerHTML='';
        s.manualSel.forEach(function(nm){
          var b=document.createElement('button');b.textContent=nm;b.dataset.name=nm;
          b.className='comp-btn active';
          b.onclick=function(){toggleComp(this.dataset.name);};
          _pk.appendChild(b);
        });
      }
    }
  if(s.imgOverlap&&pName){ IMG_STORE[pName+'__map-overlap-1']=s.imgOverlap; var _ovImg=document.getElementById('map-overlap-1');if(_ovImg&&typeof renderImg==='function') renderImg('map-overlap-1',pName+'__map-overlap-1',document.getElementById('img-mapa-overlap-1')); }
    renderCompMap(pName);
  } else {
    buildComparables();
  }
  // comp map handled by renderCompMap via IMG_STORE
  if(s.calDesc) {const el=document.getElementById('cal-desc');if(el)el.innerHTML=s.calDesc;}
  if(s.hall)    {const el=document.getElementById('hallazgos-texto');if(el)el.innerHTML=s.hall;}
  // Redraw gauge with saved values
  const _gPct=parseFloat(s.ovlPct)||0;
  const _gVis=parseFloat(s.ovlVis)||0;
  drawGauge(_gPct,_gVis);
}



