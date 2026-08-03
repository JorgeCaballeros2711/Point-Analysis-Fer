// FILE UPLOAD
const dz=document.getElementById('drop-zone'),fi=document.getElementById('file-input');
dz.addEventListener('dragover',e=>{e.preventDefault();dz.classList.add('drag-over')});
dz.addEventListener('dragleave',()=>dz.classList.remove('drag-over'));
dz.addEventListener('drop',e=>{e.preventDefault();dz.classList.remove('drag-over');if(e.dataTransfer.files[0])readXLSX(e.dataTransfer.files[0])});
fi.addEventListener('change',()=>{if(fi.files[0])readXLSX(fi.files[0])});

function readXLSX(file){
  document.getElementById('file-name').textContent='📄 '+file.name;
  const reader=new FileReader();
  reader.onload=e=>{
    try{WB=XLSX.read(e.target.result,{type:'array'});detectSheets();}
    catch(err){alert('Error al leer el archivo: '+err.message);}
  };
  reader.readAsArrayBuffer(file);
}

function sToJ(name){const s=WB.Sheets[name];return s?XLSX.utils.sheet_to_json(s,{defval:''}):null;}

function detectSheets(){
  const ns=WB.SheetNames;
  const pn=ns.find(n=>n.toLowerCase().includes('punto')||n.toLowerCase().includes('point'));
  const cn=ns.find(n=>n.toLowerCase().includes('clasif'));
  POINTS=pn?sToJ(pn)||[]:[];
  CLASIFICACION=cn?sToJ(cn)||[]:[];
  CLASIF_MAP={};
  CLASIFICACION.forEach(r=>{
    const muni=String(r['Municipio']||r['municipio']||'').trim().toLowerCase();
    const cls=String(r['Clasificación']||r['Clasificacion']||r['clasificacion']||'').trim().toLowerCase();
    if(muni) CLASIF_MAP[muni]=cls;
  });

  // Detect rural/urban sheets per isocrona
  // Match patterns like "Rural 15", "EG Rural 15", "Urbano 15", "Urban 15" etc.
  function findSheet(keywords, mins){
    // Try exact minute match first (e.g. "15" in sheet name)
    const minsStr=String(mins);
    // Also match "quince"/"veinte"/"treinta" in case of Spanish names
    const minsWords={15:['15','quince'],20:['20','veinte'],30:['30','treinta']};
    const minsAlt=minsWords[mins]||[minsStr];
    return ns.find(n=>{
      const nl=n.toLowerCase().replace(/[_\-]/g,' ');
      const hasKeyword=keywords.some(k=>nl.includes(k));
      const hasMins=minsAlt.some(m=>nl.includes(m));
      return hasKeyword && hasMins;
    });
  }
  RURAL={15:[],20:[],30:[]};
  URBAN={15:[],20:[],30:[]};
  GENERAL={15:[],20:[],30:[]};
  [15,20,30].forEach(m=>{
    const exactG=['Expansion Genie '+m,'EG '+m],exactU=['Expansion Genie '+m+' Urbano','EG '+m+' Urbano'],exactR=['Expansion Genie '+m+' Rural','EG '+m+' Rural'];
    const gn=exactG.reduce((a,n)=>a||ns.find(s=>s.trim()===n),null)||ns.find(n=>{const nl=n.toLowerCase().replace(/[_\-]/g,' ');return nl.includes(String(m))&&!nl.includes('rural')&&!nl.includes('urban')&&!nl.includes('urbano');});
    const un=exactU.reduce((a,n)=>a||ns.find(s=>s.trim()===n),null)||findSheet(['urbano','urban','metropolit'],m);
    const rn=exactR.reduce((a,n)=>a||ns.find(s=>s.trim()===n),null)||findSheet(['rural'],m);
    RURAL[m]=rn?sToJ(rn)||[]:[];URBAN[m]=un?sToJ(un)||[]:[];GENERAL[m]=gn?sToJ(gn)||[]:[];
  });

  const rows=[
    {l:'EG Rural 15 min', ok:RURAL[15].length>0, c:RURAL[15].length},
    {l:'EG Rural 20 min', ok:RURAL[20].length>0, c:RURAL[20].length},
    {l:'EG Rural 30 min', ok:RURAL[30].length>0, c:RURAL[30].length},
    {l:'EG Urbano 15 min',ok:URBAN[15].length>0, c:URBAN[15].length},
    {l:'EG Urbano 20 min',ok:URBAN[20].length>0, c:URBAN[20].length},
    {l:'EG Urbano 30 min',ok:URBAN[30].length>0, c:URBAN[30].length},
    {l:'EG Nacional 15 min',ok:GENERAL[15].length>0, c:GENERAL[15].length},
    {l:'EG Nacional 20 min',ok:GENERAL[20].length>0, c:GENERAL[20].length},
    {l:'EG Nacional 30 min',ok:GENERAL[30].length>0, c:GENERAL[30].length},
    {l:'Expansion Genie Puntos',ok:POINTS.length>0,c:POINTS.length},
    {l:'Clasificación de Municipios',ok:CLASIFICACION.length>0,c:CLASIFICACION.length}
  ];
  document.getElementById('sheet-status').style.display='block';
  // Also show which actual sheet names were found for debugging
  const foundNames={
    r15:findSheet(['rural'],15), r20:findSheet(['rural'],20), r30:findSheet(['rural'],30),
    u15:findSheet(['urbano','urban','metropolit'],15),
    u20:findSheet(['urbano','urban','metropolit'],20),
    u30:findSheet(['urbano','urban','metropolit'],30)
  };
  document.getElementById('sheet-rows').innerHTML=rows.map(r=>`
    <div class="sheet-row"><div class="${r.ok?'dot-ok':'dot-miss'}"></div>
    <span style="font-size:.82rem;color:${r.ok?'var(--text)':'var(--muted)'}">${r.l}</span>
    <span style="font-size:.75rem;color:var(--muted);margin-left:auto">${r.ok?r.c+' filas':'No encontrada'}</span></div>`).join('')
  +'<div style="margin-top:.5rem;font-size:.73rem;color:var(--muted);border-top:1px solid var(--border);padding-top:.4rem">'
  +'Hojas detectadas: '
  +Object.entries(foundNames).map(([k,v])=>v?`<span style="color:var(--green)">${k}:${v}</span>`:null).filter(Boolean).join(', ')
  +'</div>';
  if(POINTS.length>0){
    document.getElementById('btn-load').style.display='block';
    document.getElementById('trade-area-option').style.display='block';
  }
}

function buildReport(){
  // Read radio selection
  var radio=document.querySelector('input[name="analysis-type"]:checked');
  USE_TRADE_AREA=radio?radio.value==='trade-area':false;
  setLoading(true,'Construyendo reporte...','');
  setTimeout(()=>{
    // Deduplicate points by name — collect all rows per name
    POINT_MAP={};
    POINTS.forEach((p,i)=>{
      const pntName=String(p[PT.punto]||'Punto '+(i+1)).trim();
      if(!POINT_MAP[pntName]) POINT_MAP[pntName]=[];
      POINT_MAP[pntName].push(p);
      p._mapKey=pntName; // pre-set mapKey on every row
    });
    const uniqueNames=Object.keys(POINT_MAP);

    const sel=document.getElementById('point-select');
    sel.innerHTML='';
    uniqueNames.forEach((name,i)=>{
      const o=document.createElement('option');
      o.value=name;o.textContent=name;
      sel.appendChild(o);
    });
    setLoading(false);
    document.getElementById('upload-screen').style.display='none';
    document.getElementById('report-screen').style.display='block';
    switchPoint(uniqueNames[0]);
    if(USE_TRADE_AREA){
      // Solo colapsar a "Cumplimiento" simple cuando hay UN único tiempo disponible.
      // Si el Excel trae más de un tiempo (15/20/30 min), se conserva el sufijo
      // de minutos en cada viñeta para poder identificarlas.
      var _avBR=CURRENT_POINT?getAvailMins(CURRENT_POINT):[];
      if(_avBR.length<=1){
        [15,20,30].forEach(function(m){
          var tab=document.getElementById('tab-'+m+'min');
          if(tab&&tab.style.display!=='none') tab.textContent='Cumplimiento';
          var sec=document.getElementById('s-'+m+'min');
          if(sec){var t=sec.querySelector('.section-title');if(t)t.textContent='Cumplimiento';}
        });
      }
    }
  },400);
}

