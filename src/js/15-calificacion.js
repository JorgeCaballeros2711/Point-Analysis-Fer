// ── CALIFICACIÓN TABLE ──
function calcScoreFromPesos(){
  var tbody=document.getElementById('cal-tbody');
  if(!tbody)return;
  var rows=tbody.querySelectorAll('tr');
  if(rows.length<3)return;
  var ptRow=rows[0], benchRow=rows[1], pesoRow=rows[2];
  var pesoInputs=pesoRow.querySelectorAll('input.cal-peso');
  var totalScore=0, totalPeso=0;
  pesoInputs.forEach(function(inp){
    var peso=parseFloat(inp.value)||0;
    if(peso===0)return;
    var col=inp.closest('td').cellIndex;
    var ptCell=ptRow.cells[col], benchCell=benchRow.cells[col];
    var ptInput=ptCell?ptCell.querySelector('input'):null;
    var benchInput=benchCell?benchCell.querySelector('input'):null;
    var ptVal=parseFloat(ptInput?ptInput.value:ptCell?ptCell.textContent:0)||0;
    var bVal=parseFloat(benchInput?benchInput.value:benchCell?benchCell.textContent:0)||0;
    if(bVal>0){
      var ratio=Math.min(ptVal/bVal,1);
      totalScore+=ratio*peso;
      totalPeso+=peso;
    }
  });
  var score=totalPeso>0?(totalScore/totalPeso*100).toFixed(1):'';
  var el=document.getElementById('cal-score');
  if(el){el.value=score;updateScoreDisplay();}
}


function saveCalEdit(input, type){
  var type=input.dataset.type||'pt';
  var key=input.dataset.key;
  var mk=CURRENT_POINT&&CURRENT_POINT._mapKey?CURRENT_POINT._mapKey:null;
  if(!mk||!key) return;
  if(!CAL_EDITS[mk]) CAL_EDITS[mk]={};
  if(!CAL_EDITS[mk][type]) CAL_EDITS[mk][type]={};
  var raw=input.value.replace(/[,%$M]/g,'').trim();
  var num=parseFloat(raw);
  if(!isNaN(num)) CAL_EDITS[mk][type][key]=num;
  if(typeof calcScoreFromPesos==='function') calcScoreFromPesos();
}

function updateCalDemoCell(input){
  var key=input.dataset.key;
  var raw=input.value.replace(/[,%$M%]/g,'').trim();
  var num=parseFloat(raw);
  if(!key||isNaN(num)) return;
  var mk=CURRENT_POINT&&CURRENT_POINT._mapKey?CURRENT_POINT._mapKey:null;
  if(!mk) return;
  var _avM=getAvailMins(CURRENT_POINT);var calMins=_avM.length?_avM[0]:15;
  if(!CAL_EDITS[mk]) CAL_EDITS[mk]={};
  if(!CAL_EDITS[mk].pt) CAL_EDITS[mk].pt={};
  if(key==='pob_total'){
    var _cur=getPE(mk,calMins);
    var _base=getRowForMins(CURRENT_POINT,calMins);
    var op=_cur.pob||ptGet(_base,'pob');
    var of2=_cur.pob_flot||ptGet(_base,'pob_flot');
    var ot=op+of2||1;
    var newPob=Math.round(num*(op/ot)), newFlot=Math.round(num*(of2/ot));
    setPE(mk,calMins,'pob',newPob);
    setPE(mk,calMins,'pob_flot',newFlot);
    CAL_EDITS[mk].pt.pob=newPob;
    CAL_EDITS[mk].pt.pob_flot=newFlot;
    CAL_EDITS[mk].pt.pob_total=num;
  } else {
    setPE(mk,calMins,key,num);
    CAL_EDITS[mk].pt[key]=num;
  }
  updateCalTable();
  buildComplianceTables();
  buildComparables();
}

function updateCalTable(){
  const p=CURRENT_POINT;
  if(!p) return;

  const combo=document.getElementById('cal-nse-combo');
  const nseKey=combo?combo.value:'CD';

  // Determine bench
  const tipoUR=String(p[PT.tipo_urb]||'').trim().toLowerCase();
  const muni=String(p[PT.muni]||p['Municipio']||'').toLowerCase();
  const clasifM=CLASIF_MAP[muni]||'';
  const isRural=tipoUR==='rural'||clasifM.includes('rural');

  const allRows=p._allRows||[p];
  const availMins=allRows.map(function(r){
    var m=String(r[PT.ext]||'').match(/\b(30|20|15)\b/);
    return m?parseInt(m[1]):null;
  }).filter(Boolean);
  const mins=availMins.length?availMins[0]:15;

  const bench=isRural?avgSheet(RURAL[mins]||[]):avgSheet(URBAN[mins]||[]);
  const benchLabel=isRural?'Rural':'Urbana';

  // NSE combo sum
  function nseSum(obj, keys){
    return keys.split('').reduce(function(acc,l){
      return acc+(obj['nse_'+l.toLowerCase()]||0);
    },0);
  }

  function toM(v){var n=pf(v);return n>=100000?n/1000000:n;}

  const _mk2=p._mapKey||'';
  const _baseRow=getRowForMins(p,mins);
  const _pe=Object.assign(pdFromRow(_baseRow), getPE(_mk2, mins));
  const ptData={
    pob_total: (_pe.pob||0)+(_pe.pob_flot||0),
    nse_cd: nseSum(_pe, nseKey),
    mob_frente: _pe.mob_frente||0,
    mob_area: _pe.mob_area||0,
    income: _pe.ingreso||0,
    retail: _pe.gasto||0
  };

  const benchData=bench?{
    pob_total: (bench.pob||0)+(bench.pob_flot||0),
    nse_cd: nseSum(bench, nseKey),
    mob_frente: bench.mob_frente||0,
    mob_area: bench.mob_area||0,
    income: bench.ingreso||0,
    retail: bench.gasto||0
  }:{pob_total:0,nse_cd:0,mob_frente:0,mob_area:0,income:0,retail:0};

  const nseLabel='NSE '+nseKey.split('').join('+');
  const rows=[
    {l:'Población Total',     k:'pob_total', fmt:fmtPob,   peso:'50%'},
    {l:nseLabel,              k:'nse_cd',    fmt:fmtNSE,   peso:'20%'},
    {l:'Movil. Área',         k:'mob_area',  fmt:fmtPob,   peso:'10%'},
    {l:'Movil. FT Comercio',  k:'mob_frente',fmt:fmtPob,   peso:'10%'},
    {l:'Retail ($M)',         k:'retail',    fmt:fmtMoney, peso:'5%'},
    {l:'Income ($M)',         k:'income',    fmt:fmtMoney, peso:'5%'},
  ];

  const thStyle='background:var(--p-dark);color:white;padding:.5rem .6rem;font-weight:600;text-align:center;white-space:nowrap;font-size:.78rem';
  const thLeft='background:var(--p-dark);color:white;padding:.5rem .6rem;font-weight:600;text-align:left;font-size:.78rem';

  document.getElementById('cal-thead').innerHTML=
    '<tr>'
    +'<th style="'+thLeft+'">'+benchLabel+'</th>'
    +'<th style="'+thStyle+'">Población</th>'
    +'<th style="'+thStyle+'">Pob. Flotante</th>'
    +'<th style="'+thStyle+'">Pob. Total</th>'
    +'<th style="'+thStyle+'">'+nseLabel+'</th>'
    +'<th style="'+thStyle+'">PROM Movil.<br>en Área</th>'
    +'<th style="'+thStyle+'">PROM Movil.<br>FT Comercio</th>'
    +'<th style="'+thStyle+'">Retail ($M)</th>'
    +'<th style="'+thStyle+'">Income ($M)</th>'
    +'<th style="'+thStyle+'">Calificación<br>Final</th>'
    +'</tr>';

  const tdBase='padding:.5rem .6rem;text-align:center;border-bottom:1px solid var(--p-border);font-size:.8rem';
  const tdLabel='padding:.5rem .6rem;text-align:left;border-bottom:1px solid var(--p-border);font-size:.8rem;font-weight:600;color:var(--p-dark)';
  const tdBold=tdBase+';font-weight:700;color:var(--p-dark)';
  const tdBench=tdBase+';font-weight:700;background:#F0ECFF';

  const _ce=CAL_EDITS[_mk2]||{};
  const _cePt=_ce.pt||{};
  const _ceBench=_ce.bench||{};
  const _cePesos=_ce.pesos||{};
  // Punto values: CAL_EDITS.pt > PUNTO_EDITS > Excel
  const ptPob=fmtPob(_cePt.pob!==undefined?_cePt.pob:_pe.pob!==undefined?_pe.pob:pf(p[PT.pob]));
  const ptFlot=fmtPob(_cePt.pob_flot!==undefined?_cePt.pob_flot:_pe.pob_flot!==undefined?_pe.pob_flot:pf(p[PT.pob_flot]));
  const ptTotal=fmtPob(_cePt.pob_total!==undefined?_cePt.pob_total:ptData.pob_total);
  const ptNse=fmtNSE(_cePt.nse_cd!==undefined?_cePt.nse_cd:ptData.nse_cd)+'%';
  const ptMobA=fmtPob(_cePt.mob_area!==undefined?_cePt.mob_area:ptData.mob_area);
  const ptMobF=fmtPob(_cePt.mob_frente!==undefined?_cePt.mob_frente:ptData.mob_frente);
  const ptRet=fmtMoney(_cePt.retail!==undefined?_cePt.retail:ptData.retail);
  const ptInc=fmtMoney(_cePt.income!==undefined?_cePt.income:ptData.income);

  const bPob=fmtPob(_ceBench.pob!==undefined?_ceBench.pob:(bench?bench.pob:0));
  const bFlot=fmtPob(_ceBench.pob_flot!==undefined?_ceBench.pob_flot:(bench?bench.pob_flot:0));
  const bTotal=fmtPob(_ceBench.pob_total!==undefined?_ceBench.pob_total:benchData.pob_total);
  const bNse=fmtNSE(_ceBench.nse_cd!==undefined?_ceBench.nse_cd:benchData.nse_cd)+'%';
  const bMobA=fmtPob(_ceBench.mob_area!==undefined?_ceBench.mob_area:benchData.mob_area);
  const bMobF=fmtPob(_ceBench.mob_frente!==undefined?_ceBench.mob_frente:benchData.mob_frente);
  const bRet=fmtMoney(_ceBench.retail!==undefined?_ceBench.retail:benchData.retail);
  const bInc=fmtMoney(_ceBench.income!==undefined?_ceBench.income:benchData.income);

  document.getElementById('cal-tbody').innerHTML=
    // Row 1: Point data
    '<tr>'
    +'<td style="'+tdLabel+'">Punto a evaluar</td>'
    +'<td style="'+tdBold+'">'+'<input type="text" value="'+ptPob+'" data-key="pob" onchange="updateCalDemoCell(this)" style="border:none;background:rgba(77,30,168,.06);width:70px;text-align:center;font-size:.78rem;font-family:Poppins,sans-serif;cursor:text;border-bottom:1px dashed var(--p-mid);outline:none;padding:1px 2px">'+'</td>'
    +'<td style="'+tdBold+'">'+'<input type="text" value="'+ptFlot+'" data-key="pob_flot" onchange="updateCalDemoCell(this)" style="border:none;background:rgba(77,30,168,.06);width:70px;text-align:center;font-size:.78rem;font-family:Poppins,sans-serif;cursor:text;border-bottom:1px dashed var(--p-mid);outline:none;padding:1px 2px">'+'</td>'
    +'<td style="'+tdBold+'">'+'<input type="text" value="'+ptTotal+'" data-key="pob_total" onchange="updateCalDemoCell(this)" style="border:none;background:rgba(77,30,168,.06);width:70px;text-align:center;font-size:.78rem;font-family:Poppins,sans-serif;cursor:text;border-bottom:1px dashed var(--p-mid);outline:none;padding:1px 2px">'+'</td>'
    +'<td style="'+tdBold+'">'+'<input type="text" value="'+ptNse+'" data-key="nse_cd" onchange="updateCalDemoCell(this)" style="border:none;background:rgba(77,30,168,.06);width:70px;text-align:center;font-size:.78rem;font-family:Poppins,sans-serif;cursor:text;border-bottom:1px dashed var(--p-mid);outline:none;padding:1px 2px">'+'</td>'
    +'<td style="'+tdBold+'">'+'<input type="text" value="'+ptMobA+'" data-key="mob_area" onchange="updateCalDemoCell(this)" style="border:none;background:rgba(77,30,168,.06);width:70px;text-align:center;font-size:.78rem;font-family:Poppins,sans-serif;cursor:text;border-bottom:1px dashed var(--p-mid);outline:none;padding:1px 2px">'+'</td>'
    +'<td style="'+tdBold+'">'+'<input type="text" value="'+ptMobF+'" data-key="mob_frente" onchange="updateCalDemoCell(this)" style="border:none;background:rgba(77,30,168,.06);width:70px;text-align:center;font-size:.78rem;font-family:Poppins,sans-serif;cursor:text;border-bottom:1px dashed var(--p-mid);outline:none;padding:1px 2px">'+'</td>'
    +'<td style="'+tdBold+'">'+'<input type="text" value="'+ptRet+'" data-key="retail" onchange="updateCalDemoCell(this)" style="border:none;background:rgba(77,30,168,.06);width:70px;text-align:center;font-size:.78rem;font-family:Poppins,sans-serif;cursor:text;border-bottom:1px dashed var(--p-mid);outline:none;padding:1px 2px">'+'</td>'
    +'<td style="'+tdBold+'">'+'<input type="text" value="'+ptInc+'" data-key="income" onchange="updateCalDemoCell(this)" style="border:none;background:rgba(77,30,168,.06);width:70px;text-align:center;font-size:.78rem;font-family:Poppins,sans-serif;cursor:text;border-bottom:1px dashed var(--p-mid);outline:none;padding:1px 2px">'+'</td>'
    +'<td rowspan="3" style="'+tdBase+';vertical-align:middle;border-bottom:none">'
    +'<div id="cal-score-box2" style="background:#F4A261;color:white;border-radius:8px;padding:.5rem;text-align:center">'
    +'<div id="cal-score-display2" style="font-size:1.2rem;font-weight:800;font-family:Poppins,sans-serif">—</div></div>'
    +'</td>'
    +'</tr>'
    // Row 2: Benchmark
    +'<tr>'
    +'<td style="'+tdLabel+'"><strong>Parámetros</strong></td>'
    +'<td style="'+tdBench+'"><input type="text" value="'+bPob+'" style="width:70px;text-align:center;border:1px solid var(--p-border);border-radius:4px;font-size:.78rem;padding:.1rem .2rem;font-family:Poppins,sans-serif" class="cal-bench" data-type="bench" onchange=\"saveCalEdit(this)\" data-key="pob"></td>'
    +'<td style="'+tdBench+'"><input type="text" value="'+bFlot+'" style="width:70px;text-align:center;border:1px solid var(--p-border);border-radius:4px;font-size:.78rem;padding:.1rem .2rem;font-family:Poppins,sans-serif" class="cal-bench" data-type="bench" onchange=\"saveCalEdit(this)\" data-key="pob_flot"></td>'
    +'<td style="'+tdBench+'"><input type="text" value="'+bTotal+'" style="width:70px;text-align:center;border:1px solid var(--p-border);border-radius:4px;font-size:.78rem;padding:.1rem .2rem;font-family:Poppins,sans-serif" class="cal-bench" data-type="bench" onchange=\"saveCalEdit(this)\" data-key="pob_total"></td>'
    +'<td style="'+tdBench+'"><input type="text" value="'+bNse+'" style="width:70px;text-align:center;border:1px solid var(--p-border);border-radius:4px;font-size:.78rem;padding:.1rem .2rem;font-family:Poppins,sans-serif" class="cal-bench" data-type="bench" onchange=\"saveCalEdit(this)\" data-key="nse_cd"></td>'
    +'<td style="'+tdBench+'"><input type="text" value="'+bMobA+'" style="width:70px;text-align:center;border:1px solid var(--p-border);border-radius:4px;font-size:.78rem;padding:.1rem .2rem;font-family:Poppins,sans-serif" class="cal-bench" data-type="bench" onchange=\"saveCalEdit(this)\" data-key="mob_area"></td>'
    +'<td style="'+tdBench+'"><input type="text" value="'+bMobF+'" style="width:70px;text-align:center;border:1px solid var(--p-border);border-radius:4px;font-size:.78rem;padding:.1rem .2rem;font-family:Poppins,sans-serif" class="cal-bench" data-type="bench" onchange=\"saveCalEdit(this)\" data-key="mob_frente"></td>'
    +'<td style="'+tdBench+'"><input type="text" value="'+bRet+'" style="width:70px;text-align:center;border:1px solid var(--p-border);border-radius:4px;font-size:.78rem;padding:.1rem .2rem;font-family:Poppins,sans-serif" class="cal-bench" data-type="bench" onchange=\"saveCalEdit(this)\" data-key="retail"></td>'
    +'<td style="'+tdBench+'"><input type="text" value="'+bInc+'" style="width:70px;text-align:center;border:1px solid var(--p-border);border-radius:4px;font-size:.78rem;padding:.1rem .2rem;font-family:Poppins,sans-serif" class="cal-bench" data-type="bench" onchange=\"saveCalEdit(this)\" data-key="income"></td>'
    +'</tr>'
    // Row 3: Weights (editable)
    +'<tr>'
    +'<td style="'+tdLabel+'">Pesos</td>'
    +'<td style="'+tdBase+'"><input type="text" value="'+(_cePesos['pob_total']!==undefined?_cePesos['pob_total']+'%':'50%')+'" style="width:45px;text-align:center;border:1px solid var(--p-border);border-radius:4px;font-size:.78rem;padding:.1rem .2rem;font-family:Poppins,sans-serif" class="cal-peso" data-type="pesos" onchange=\"saveCalEdit(this)\" data-key="pob_total"></td>'
    +'<td style="'+tdBase+'"><input type="text" value="'+(_cePesos['pob_flot']!==undefined?_cePesos['pob_flot']+'%':'0%')+'" style="width:45px;text-align:center;border:1px solid var(--p-border);border-radius:4px;font-size:.78rem;padding:.1rem .2rem;font-family:Poppins,sans-serif" class="cal-peso" data-type="pesos" onchange=\"saveCalEdit(this)\" data-key="pob_flot"></td>'
    +'<td style="'+tdBase+'"><input type="text" value="'+(_cePesos['pob_total_sum']!==undefined?_cePesos['pob_total_sum']+'%':'0%')+'" style="width:45px;text-align:center;border:1px solid var(--p-border);border-radius:4px;font-size:.78rem;padding:.1rem .2rem;font-family:Poppins,sans-serif" class="cal-peso" data-type="pesos" onchange=\"saveCalEdit(this)\" data-key="pob_total_sum"></td>'
    +'<td style="'+tdBase+'"><input type="text" value="'+(_cePesos['nse_cd']!==undefined?_cePesos['nse_cd']+'%':'20%')+'" style="width:45px;text-align:center;border:1px solid var(--p-border);border-radius:4px;font-size:.78rem;padding:.1rem .2rem;font-family:Poppins,sans-serif" class="cal-peso" data-type="pesos" onchange=\"saveCalEdit(this)\" data-key="nse_cd"></td>'
    +'<td style="'+tdBase+'"><input type="text" value="'+(_cePesos['mob_area']!==undefined?_cePesos['mob_area']+'%':'10%')+'" style="width:45px;text-align:center;border:1px solid var(--p-border);border-radius:4px;font-size:.78rem;padding:.1rem .2rem;font-family:Poppins,sans-serif" class="cal-peso" data-type="pesos" onchange=\"saveCalEdit(this)\" data-key="mob_area"></td>'
    +'<td style="'+tdBase+'"><input type="text" value="'+(_cePesos['mob_frente']!==undefined?_cePesos['mob_frente']+'%':'10%')+'" style="width:45px;text-align:center;border:1px solid var(--p-border);border-radius:4px;font-size:.78rem;padding:.1rem .2rem;font-family:Poppins,sans-serif" class="cal-peso" data-type="pesos" onchange=\"saveCalEdit(this)\" data-key="mob_frente"></td>'
    +'<td style="'+tdBase+'"><input type="text" value="'+(_cePesos['retail']!==undefined?_cePesos['retail']+'%':'5%')+'" style="width:45px;text-align:center;border:1px solid var(--p-border);border-radius:4px;font-size:.78rem;padding:.1rem .2rem;font-family:Poppins,sans-serif" class="cal-peso" data-type="pesos" onchange=\"saveCalEdit(this)\" data-key="retail"></td>'
    +'<td style="'+tdBase+'"><input type="text" value="'+(_cePesos['income']!==undefined?_cePesos['income']+'%':'5%')+'" style="width:45px;text-align:center;border:1px solid var(--p-border);border-radius:4px;font-size:.78rem;padding:.1rem .2rem;font-family:Poppins,sans-serif" class="cal-peso" data-type="pesos" onchange=\"saveCalEdit(this)\" data-key="income"></td>'
    +'</tr>';
}

function scoreColor(val){
  const n=parseFloat(val);
  if(isNaN(n)||val==='') return '#F4A261';
  if(n>=100) return '#2D9E6B';
  if(n>=90)  return '#E67E22';
  if(n>=80)  return '#B8860B';
  return '#C0392B';
}
function updateScoreDisplay(){
  const val=document.getElementById('cal-score').value||'';
  const disp=document.getElementById('cal-score-display2');
  const box=document.getElementById('cal-score-box');
  const inline=document.getElementById('cal-score-inline');
  const col=scoreColor(val);
  if(disp){disp.textContent=val?val+'%':'—';disp.parentElement.style.background=col;}
  if(box) box.style.background=col;
  if(inline) inline.textContent=val||'0.00';
}


// ── OVERLAP ──
function addOverlapRow(tienda,dist,vis){
  const tbody=document.getElementById('overlap-tbody');
  if(!tbody)return;
  const rowCount=tbody.querySelectorAll('tr').length;
  if(rowCount>=5&&!tienda){alert('Máximo 5 filas.');return;}
  const tr=document.createElement('tr');
  tr.setAttribute('data-row',rowCount);
  tr.innerHTML='<td style="padding:.45rem .75rem;border-bottom:1px solid var(--p-border)"><input type="text" value="'+(tienda||'')+'" placeholder="Nombre tienda" style="border:none;background:transparent;font-size:.78rem;width:100%;min-width:120px;outline:none"></td>'
    +'<td style="padding:.45rem .75rem;border-bottom:1px solid var(--p-border)"><input type="number" value="'+(dist||'')+'" placeholder="0" style="border:none;background:transparent;font-size:.82rem;width:60px;text-align:center;outline:none"></td>'
    +'<td style="padding:.45rem .75rem;border-bottom:1px solid var(--p-border);color:var(--p-mid);font-weight:700"><input type="text" value="'+(vis||'')+'" placeholder="0%" style="border:none;background:transparent;font-size:.82rem;width:50px;text-align:center;outline:none;color:var(--p-mid);font-weight:700"></td>'
    +'<td style="padding:.45rem .5rem;border-bottom:1px solid var(--p-border);text-align:center"><button onclick="removeOverlapRow(this)" style="background:none;border:none;color:var(--red);cursor:pointer;font-size:.9rem">✕</button></td>';
  tbody.appendChild(tr);
}
function removeOverlapRow(btn){
  const row=btn.closest('tr');
  if(document.getElementById('overlap-tbody').querySelectorAll('tr').length>1)
    row.remove();
}

function updateGauge(){
  const pct=parseFloat(document.getElementById('overlap-pct').value)||0;
  const vis=parseFloat(document.getElementById('overlap-vis').value)||0;
  document.getElementById('overlap-pct-display').textContent=pct+'%';
  document.getElementById('overlap-vis-display').textContent=vis+'%';
  drawGauge(pct,vis);
}

function drawGauge(pct,vis){
  const canvas=document.getElementById('overlap-gauge');
  if(!canvas)return;
  const ctx=canvas.getContext('2d');
  const W=canvas.width,H=canvas.height;
  ctx.clearRect(0,0,W,H);
  const cx=W/2,cy=H-8,r=100;
  ctx.lineCap='round';
  // Outer background
  ctx.beginPath();ctx.arc(cx,cy,r,Math.PI,0);
  ctx.strokeStyle='#E0D0F5';ctx.lineWidth=22;ctx.stroke();
  // Inner background
  ctx.beginPath();ctx.arc(cx,cy,r-26,Math.PI,0);
  ctx.strokeStyle='#F0ECFF';ctx.lineWidth=16;ctx.stroke();
  // Overlap outer arc
  if(pct>0){
    const ep=Math.PI+(Math.PI*(Math.min(pct,100)/100));
    ctx.beginPath();ctx.arc(cx,cy,r,Math.PI,ep);
    ctx.strokeStyle='#C63CFC';ctx.lineWidth=22;ctx.stroke();
  }
  // Overlap Visitantes inner arc
  if(vis>0){
    const ev=Math.PI+(Math.PI*(Math.min(vis,100)/100));
    ctx.beginPath();ctx.arc(cx,cy,r-26,Math.PI,ev);
    ctx.strokeStyle='#9C38DF';ctx.lineWidth=16;ctx.stroke();
    // Needle
    const angle=Math.PI+(Math.PI*(Math.min(vis,100)/100));
    ctx.beginPath();ctx.moveTo(cx,cy);
    ctx.lineTo(cx+Math.cos(angle)*(r-4),cy+Math.sin(angle)*(r-4));
    ctx.strokeStyle='#1D1A74';ctx.lineWidth=3;ctx.stroke();
    ctx.beginPath();ctx.arc(cx,cy,6,0,Math.PI*2);
    ctx.fillStyle='#1D1A74';ctx.fill();
  }
}

