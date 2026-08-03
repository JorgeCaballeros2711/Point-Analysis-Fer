// ── HALLAZGOS AUTO-GENERATE ──
function generateHallazgos(){
  const p=CURRENT_POINT;if(!p)return;
  const ptName=p[PT.punto]||'el punto';
  const corp=p['Corporacion']||p['CORPORACION']||p['corporacion']||'la corporación';

  // Get compliance data from available isocronas
  const allRows=p._allRows||[p];
  function toM(v){const n=pf(v);return n>=100000?n/1000000:n;}
  
  // Use first available row for compliance calculation
  const firstRow=allRows[0];
  const pobPunto=pf(firstRow[PT.pob]);
  const isRuralPoint=String(firstRow[PT.tipo_urb]||'').trim().toLowerCase()==='rural';
  const benchType=isRuralPoint?'rural':'urbano';
  
  // Get first available mins for compliance
  const availMins=allRows.map(function(r){
    const m=String(r[PT.ext]||'').match(/\b(30|20|15)\b/);
    return m?parseInt(m[1]):null;
  }).filter(Boolean);
  const firstMins=availMins.length?availMins[0]:15;
  
  const natBench=avgSheet(URBAN[firstMins]||RURAL[firstMins]||[]);
  const localBench=isRuralPoint?avgSheet(RURAL[firstMins]||[]):avgSheet(URBAN[firstMins]||[]);
  
  const natPctPob=natBench&&natBench.pob?Math.round((pobPunto/natBench.pob)*100):0;
  const localPctPob=localBench&&localBench.pob?Math.round((pobPunto/localBench.pob)*100):0;
  const cumpleDemo=(natPctPob>=100&&localPctPob>=100)?'cumple':'no cumple';

  // Get comparables names
  const compRows=Array.from(document.querySelectorAll('#comparables-table tbody tr'));
  const compNames=compRows.filter(function(r){return !r.querySelector('[style*="PUNTO"]')&&!r.querySelector('.comp-tag');})
    .map(function(r){
      const td=r.querySelector('td');
      return td?td.textContent.replace('PUNTO','').trim():'';
    }).filter(function(n){return n&&n!=='—';}).slice(0,3);

  // Overlap data
  const overlapVis=document.getElementById('overlap-vis')?document.getElementById('overlap-vis').value||'X':'X';
  
  // Build text
  const text='Al realizar la evaluación del punto para el proyecto de "'+corp+'", se identifican los siguientes hallazgos:\n\n'
    +'La población residente tiene un cumplimiento de '+natPctPob+'% con respecto al promedio nacional y '+localPctPob+'% respecto al promedio '+benchType+', por lo que la ubicación '+cumpleDemo+' con los requerimientos demográficos principales.\n\n'
    +'La tienda más cercana es "[escribe el nombre aquí]" por lo cual se calcula un impacto de Overlap Visitantes del '+overlapVis+'%.\n\n'
    +'Se identifican como tiendas comparables por características demográficas: '+(compNames.length?compNames.join(', '):'[sin comparables cargados]')+'.\n\n'
    +'Por la anterior evaluación se recomienda:\n'
    +'Por las características demográficas identificadas, implementar un proyecto de acuerdo al tamaño de mercado.\n'
    +'Para garantizar un flujo de visitantes evaluar el adecuado mix comercial para el proyecto.\n'
    +'Evaluar si la tienda cercana existente es capaz de soportar financieramente un impacto de canibalismo.\n'
    +'Existe una característica importante de accesibilidad para las personas que vienen de carretera, para el ingreso y para la salida.';

  const el=document.getElementById('hallazgos-texto');
  if(el){
    // Format paragraphs
    el.innerHTML=text.split('\n\n').map(function(para){
      return '<p style="margin-bottom:.9rem">'+para.replace(/\n/g,'<br>')+'</p>';
    }).join('');
  }
}



