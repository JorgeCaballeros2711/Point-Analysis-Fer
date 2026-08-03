// COMPARABLES
let COMP_COUNT=3;
let COMP_MINS=15;
let MANUAL_OVERRIDES={};

function changeCompMins(val){COMP_MINS=parseInt(val);buildComparables();}
function changeCompCount(val){COMP_COUNT=parseInt(val);buildComparables();}


function updateCompPuntoVal(input){
  var key=input.dataset.key;
  if(!key) return;
  var raw=input.value.replace('%','').replace(/[$,]/g,'').trim();
  var num=parseFloat(raw);
  if(!isNaN(num)&&CURRENT_POINT&&CURRENT_POINT._mapKey){
    setPE(CURRENT_POINT._mapKey, COMP_MINS, key, num);
    buildComparables();
    buildComplianceTables();
    if(typeof updateCalTable==='function') updateCalTable();
  }
}

function buildComparables(){
  const p=CURRENT_POINT;if(!p)return;
  const pName=p[PT.punto]||'Punto';
  // Available isochrone times for this point
  const availMinsC=getAvailMins(p);
  // Populate the time selector from available data (single option / hidden for trade area)
  const minsSel=document.getElementById('comp-mins-select');
  if(minsSel){
    const opts=(availMinsC.length?[...new Set(availMinsC)].sort((a,b)=>a-b):[COMP_MINS]);
    if(!opts.includes(COMP_MINS)) COMP_MINS=opts[0];
    minsSel.innerHTML=opts.map(m=>'<option value="'+m+'"'+(m===COMP_MINS?' selected':'')+'>'+m+' min</option>').join('');
    const minsWrap=minsSel.closest('div');
    if(minsWrap) minsWrap.style.display=(USE_TRADE_AREA||opts.length<=1)?'none':'';
  }
  // Point demographics for the SELECTED time (with per-time edits)
  const compRow=getRowForMins(p,COMP_MINS);
  const pdSel=pdFromRow(compRow);
  const _mkC=CURRENT_POINT&&CURRENT_POINT._mapKey?CURRENT_POINT._mapKey:null;
  if(_mkC) Object.assign(pdSel, getPE(_mkC, COMP_MINS));
  const targetPob=pdSel.pob||pf(p[PT.pob]);
  const tipo=String(p[PT.tipo]||'').toLowerCase();
  const tipoURComp=String(p[PT.tipo_urb]||'').trim().toLowerCase();
  const puntoMuniC=String(p[PT.muni]||p['Municipio']||p[PT.punto]||'').toLowerCase();
  const clasifC=CLASIF_MAP[puntoMuniC]||'';
  const isRural=tipoURComp?(tipoURComp==='rural'):clasifC?clasifC.includes('rural'):tipo.includes('rural');
  const poolObj=isRural?RURAL:URBAN;
  const poolLabel=isRural?'Rural':'Urbano';
  const all=(poolObj[COMP_MINS]||[]).filter(r=>String(r[EG.tienda]||r[EG.cadena]||'').trim()!==pName);
  const picker=document.getElementById('comp-store-picker');
  if(!all.length){
    document.getElementById('comparables-table').innerHTML='<p style="color:var(--muted);padding:.75rem;font-size:.88rem">No se encontraron tiendas en la base '+poolLabel+' '+COMP_MINS+' min para comparables.</p>';
    if(picker)picker.innerHTML='';return;
  }
  const sorted=[...all].sort((a,b)=>Math.abs(pf(a[EG.pob])-targetPob)-Math.abs(pf(b[EG.pob])-targetPob));
  const autoTop=sorted.slice(0,COMP_COUNT).map(r=>String(r[EG.tienda]||r[EG.cadena]||'').trim());
  if(MANUAL_SELECTED===null) MANUAL_SELECTED=new Set(autoTop);
  // Render picker — ordered by population, highest to lowest
  if(picker){
    picker.innerHTML='';
    const byPob=[...all].sort((a,b)=>pf(b[EG.pob])-pf(a[EG.pob]));
    byPob.forEach(r=>{
      const nm=String(r[EG.tienda]||r[EG.cadena]||'').trim();
      const sel=MANUAL_SELECTED.has(nm);
      const btn=document.createElement('button');
      btn.textContent=nm;btn.dataset.name=nm;
      btn.style.cssText='padding:.25rem .7rem;border-radius:20px;border:1.5px solid '+(sel?'var(--p-mid)':'var(--border)')+';background:'+(sel?'var(--p-mid)':'white')+';color:'+(sel?'white':'var(--muted)')+';font-size:.75rem;cursor:pointer;font-family:Poppins,sans-serif;margin:.1rem';
      btn.onclick=function(){toggleComp(this.dataset.name);};
      picker.appendChild(btn);
    });
  }
  const top=all.filter(r=>MANUAL_SELECTED.has(String(r[EG.tienda]||r[EG.cadena]||'').trim()));
  function toM(v){const n=pf(v);return n>=100000?n/1000000:n;}
  const pd={nombre:pName,esP:true,pob:pdSel.pob,pob_flot:pdSel.pob_flot,mob_area:pdSel.mob_area,mob_frente:pdSel.mob_frente,ingreso:pdSel.ingreso,gasto:pdSel.gasto,nse_a:pdSel.nse_a,nse_b:pdSel.nse_b,nse_c:pdSel.nse_c,nse_d:pdSel.nse_d,nse_e:pdSel.nse_e};
  const crs=top.map(r=>({nombre:String(r[EG.tienda]||r[EG.cadena]||'—'),esP:false,pob:pf(r[EG.pob]),pob_flot:egGet(r,'pob_flot'),mob_area:egGet(r,'mob_area'),mob_frente:egGet(r,'mob_frente'),ingreso:pf(r[EG.ingreso]),gasto:pf(r[EG.gasto]),nse_a:pf(r[EG.nse_a]),nse_b:pf(r[EG.nse_b]),nse_c:pf(r[EG.nse_c]),nse_d:pf(r[EG.nse_d]),nse_e:pf(r[EG.nse_e])}));
  const vars=[{k:'pob',l:'Población Residente',u:''},{k:'pob_flot',l:'Pob. Flotante',u:''},{k:'mob_area',l:'Movil. Área',u:''},{k:'mob_frente',l:'Mov. ft comercio',u:''},{k:'ingreso',l:'Ingreso ($M)',u:'$'},{k:'gasto',l:'Gasto Retail ($M)',u:'$'},{k:'nse_a',l:'NSE A % pp',u:'%'},{k:'nse_b',l:'NSE B % pp',u:'%'},{k:'nse_c',l:'NSE C % pp',u:'%'},{k:'nse_d',l:'NSE D % pp',u:'%'},{k:'nse_e',l:'NSE E % pp',u:'%'}];
  const thead='<tr><th style="text-align:left;min-width:160px;background:#1D1A74;position:sticky;left:0;z-index:2;color:white;padding:.55rem .85rem;font-size:.75rem">Punto</th>'+vars.map(v=>'<th style="min-width:90px;background:#4D1EA8;color:white;padding:.55rem .85rem;font-size:.75rem;text-align:center">'+v.l+'</th>').join('')+'</tr>';
  function makeRow(row,isPunto){
    const cells=vars.map(v=>{const val=row[v.k]||0,ref=pd[v.k]||0;const isNseCol=v.u==='%';const display=v.u==='$'?fmtMoney(val):fmtPob(val);let badge='';if(!isPunto){if(isNseCol){const diff=parseFloat((val-ref).toFixed(1));const sign=diff>=0?'+':'';const diffColor=diff>=0?'color:#2D9E6B;font-weight:700':'color:#C0392B;font-weight:700';badge='<div style="font-size:.68rem;'+diffColor+'">'+sign+diff+' pp</div>';}else if(val){const pc=Math.round((ref/val)*100);const diffColor=pc>=100?'color:#2D9E6B;font-weight:700':pc>=90?'color:#E67E22;font-weight:700':pc>=80?'color:#B8860B;font-weight:700':'color:#C0392B;font-weight:700';badge='<div style="font-size:.68rem;'+diffColor+'">'+pc+'%</div>';}}var cellHtml=isPunto?('<input type="text" value="'+display+'" data-key="'+v.k+'" data-suf="'+(v.u==='%'?'%':'')+'" '+'oninput="updateCompPuntoVal(this)" '+'style="border:none;background:transparent;width:75px;text-align:center;font-size:.82rem;font-family:Poppins,sans-serif;cursor:pointer;border-bottom:1px dashed #4D1EA8;outline:none;font-weight:800" '+'title="Editar valor del punto">'):('<div style="font-weight:500">'+display+'</div>'+badge);return '<td style="text-align:center;vertical-align:middle;padding:.5rem .85rem;border-bottom:1px solid #DDD6F5">'+cellHtml+'</td>';}).join('');
    const rowBg=isPunto?'background:linear-gradient(135deg,#EDE8FF,#F5F2FF);':'';const nameStyle=isPunto?'font-weight:800;color:#1D1A74':'font-weight:600;color:#3D2882';const badge=isPunto?'<span style="background:#6B4FBB;color:white;border-radius:10px;padding:.1rem .45rem;font-size:.65rem;margin-left:.4rem">PUNTO</span>':'';
    return '<tr style="'+rowBg+'"><td style="text-align:left;position:sticky;left:0;z-index:1;background:'+(isPunto?'#EDE8FF':'white')+';'+nameStyle+';padding:.6rem 1rem;border-bottom:1px solid #DDD6F5;font-size:.82rem;min-width:160px">'+row.nombre+badge+'</td>'+cells+'</tr>';
  }
  const tbody=[pd,...crs].map((r,i)=>makeRow(r,i===0)).join('');
  if(crs.length>0){
    const compNames=crs.map(c=>c.nombre);const namesStr=compNames.length===1?compNames[0]:compNames.slice(0,-1).join(', ')+' y '+compNames[compNames.length-1];
    const descEl=document.getElementById('comparables-desc');
    if(descEl&&(descEl.textContent.includes('identificaron')||descEl.textContent.includes('automáticamente'))){
      descEl.textContent='Se identificaron '+(crs.length===1?'una ubicación comparable':(crs.length+' ubicaciones comparables'))+' en base a su perfil demográfico: '+namesStr+'.';
    }
  }
  document.getElementById('comparables-table').innerHTML='<div style="overflow-x:auto;border-radius:10px;border:1px solid #DDD6F5"><table style="border-collapse:collapse;font-size:.82rem;min-width:100%;width:100%"><thead>'+thead+'</thead><tbody>'+tbody+'</tbody></table></div>';
  const selEl=document.getElementById('comp-count-select');if(selEl)selEl.value=String(COMP_COUNT);
  const minsEl=document.getElementById('comp-mins-select');if(minsEl)minsEl.value=String(COMP_MINS);
}

