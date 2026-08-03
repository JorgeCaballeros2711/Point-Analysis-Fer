// SWITCH POINT
function switchPoint(name){
  // Save current point's editable content before switching
  if(CURRENT_POINT){
    // Use CURRENT_POINT data to get the previous name — NOT point-select (already changed)
    const _prevName=CURRENT_POINT._mapKey||String(CURRENT_POINT[PT.punto]||CURRENT_POINT['PUNTO']||CURRENT_POINT['Punto']||'').trim();
    if(_prevName){
      saveCtxState(_prevName);
      saveRouteState(_prevName);
    }
  }
  // POINT_MAP[name] = array of rows (one per isocrona)
  const rows=POINT_MAP[name]||[];
  if(!rows.length)return;
  // Store all rows; use first as base for non-time-specific data
  CURRENT_POINT=rows[0];
  CURRENT_POINT._allRows=rows; // keep all isocronas
  CURRENT_POINT._mapKey=name; // store exact POINT_MAP key for saving
  const p=CURRENT_POINT;
  const ptName=p[PT.punto]||'Punto';
  document.getElementById('ctx-nombre').textContent=ptName;
  document.getElementById('ctx-subtitulo').textContent=(p[PT.tipo]||'')+(p[PT.metodo]?' · '+p[PT.metodo]:'');

  const lat=p[PT.lat]||'',lng=p[PT.lng]||'';
  const meta=[];
  if(lat&&lng)meta.push(`${parseFloat(lat).toFixed(4)}, ${parseFloat(lng).toFixed(4)}`);
  if(p[PT.metodo])meta.push(p[PT.metodo]);
  // Add clasificacion if found
  const muniKey=String(p['Municipio']||'').toLowerCase();
  const clasifLabel=CLASIF_MAP[muniKey];
  if(clasifLabel) meta.push(clasifLabel.charAt(0).toUpperCase()+clasifLabel.slice(1));
  document.getElementById('hero-meta').innerHTML=meta.map(m=>`<span class="hero-chip">${m}</span>`).join('');

  // Competitors
  // Each COMPETIDOR cell is one full competitor name — don't split by comma
  const comps=[PT.c1,PT.c2,PT.c3,PT.c4,PT.c5]
    .map(k=>String(p[k]||'').trim()).filter(Boolean);
  // Store as pipe-separated to avoid comma confusion, display as tags
  const cs=comps.join('|');
  document.getElementById('trabajo-comp-input').value=cs;
  document.getElementById('domicilio-comp-input').value=cs;
  updateTags('trabajo',cs);updateTags('domicilio',cs);
  // New heat-map style sections: reset to defaults (restoreCtxState will override if saved)
  (function(){
    var gi=document.getElementById('general-comp-input'); if(gi){gi.value='';}
    var ri=document.getElementById('rutas-comp-input'); if(ri){ri.value='';}
    updateTags('general','');updateTags('rutas','');
    var gc=document.getElementById('general-concentracion'); if(gc) gc.innerHTML='Describe aquí las concentraciones del mapa de calor.';
    var rc=document.getElementById('rutas-concentracion'); if(rc) rc.innerHTML='Describe aquí las rutas calientes de la zona.';
  })();

  // Restore images for this point (or clear if none)
  var imgSlots={
    'map-main':'img-mapa-main','map-main2':'img-mapa-main2',
    'map-trabajo':'img-trabajo','map-domicilio':'img-domicilio',
    'map-general':'img-general','map-rutas':'img-rutas',
    'map-overlap-1':'img-overlap-1','map-calificacion':'img-cal'
  };
  Object.keys(imgSlots).forEach(function(cid){
    renderImg(cid, name+'__'+cid, document.getElementById(imgSlots[cid]));
  });

  if(!ROUTES[name])ROUTES[name]=[
    {name:'Entrada principal',desc:'Acceso desde la vía principal sin restricciones.'},
    {name:'Acceso alternativo',desc:'Ruta secundaria de acceso.'}
  ];
  renderRoutes(name);
  buildComplianceTables();
  updateTimeTabs();
  // Auto-navigate to the correct compliance tab based on EXTENSION
  // Navigate to first available isocrona tab
  const firstMins=(p._allRows||[p]).reduce((acc,r)=>{
    const m=(String(r[PT.ext]||'')).match(/\b(30|20|15)\b/);
    if(m){const v=parseInt(m[1]);if(!acc||v<acc)return v;}
    return acc;
  },null)||15;
  const sectionId='s-'+firstMins+'min';
  const allNavTabs=document.querySelectorAll('.nav-tab');
  let targetTab=null;
  allNavTabs.forEach(t=>{if(t.getAttribute('onclick')&&t.getAttribute('onclick').includes(sectionId))targetTab=t;});
  showSection(sectionId, targetTab||allNavTabs[0]);
  if(typeof applySectionVis==='function') applySectionVis();
  MANUAL_SELECTED=null;
  if(!(CURRENT_POINT&&CURRENT_POINT._mapKey&&CTX_STORE[CURRENT_POINT._mapKey]&&CTX_STORE[CURRENT_POINT._mapKey].cmpTable)){
    buildComparables();
  }
  renderCompMap(name);
  generateHallazgos();
  updateCalTable();
  // Gauge redrawn by restoreCtxState
  // Restore saved editable content for this point
  restoreCtxState(name);
  const _hasSavedCtx=CTX_STORE[name]&&CTX_STORE[name].desc&&CTX_STORE[name].desc.trim()!=='';
  if(!_hasSavedCtx){
    if(lat&&lng) fetchContext(name,lat,lng);
    else document.getElementById('ctx-descripcion').textContent='Sin coordenadas. Edita este campo para agregar el contexto.';
  }
}

// AI CONTEXT
async function fetchContext(name,lat,lng){
  document.getElementById('ctx-descripcion').innerHTML='<span style="color:var(--muted);font-style:italic">⏳ Generando contexto del sitio con IA...</span>';
  try{
    const prompt=`Eres un analista de ubicaciones comerciales. Con base en las coordenadas ${lat}, ${lng} para el punto llamado "${name}", describe en 3-4 oraciones el contexto del sitio: qué zona es, qué tipo de establecimientos y actividad comercial hay en los alrededores, y su relevancia como ubicación. Responde SOLO con el párrafo descriptivo, sin títulos ni viñetas.`;
    const res=await fetch('https://api.anthropic.com/v1/messages',{
      method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({model:'claude-sonnet-4-6',max_tokens:1000,messages:[{role:'user',content:prompt}]})
    });
    const data=await res.json();
    const text=data.content&&data.content[0]&&data.content[0].text;
    document.getElementById('ctx-descripcion').textContent=text||'No se pudo generar el contexto. Edita este campo.';
  }catch(e){
    document.getElementById('ctx-descripcion').textContent='Error al generar contexto. Edita este campo para agregar la descripción.';
  }
}

