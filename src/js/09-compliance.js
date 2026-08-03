// COMPLIANCE TABLES
function updateTimeTabs() {
  const p = CURRENT_POINT;
  if (!p) return;
  const allRows = p._allRows || [p];
  const availMins = allRows
    .map(function (r) {
      const m = String(r[PT.ext] || '').match(/\b(30|20|15)\b/);
      return m ? parseInt(m[1]) : null;
    })
    .filter(Boolean);

  [15, 20, 30].forEach(function (mins) {
    const tab = document.getElementById('tab-' + mins + 'min');
    if (!tab) return;
    // Solo se muestra "Cumplimiento" a secas si es Trade Area Y además el punto
    // tiene un único tiempo cargado. Si hay más de un tiempo (15/20/30), se
    // conserva el sufijo de minutos para diferenciar cada viñeta.
    const _collapseTT = USE_TRADE_AREA && availMins.length <= 1;
    if (availMins.includes(mins)) {
      tab.textContent = _collapseTT ? 'Cumplimiento' : 'Cumplimiento ' + mins + ' min';
    }
    // Also update section title
    const sec = document.getElementById('s-' + mins + 'min');
    if (sec) {
      const titleEl = sec.querySelector('.section-title');
      if (titleEl)
        titleEl.textContent = _collapseTT ? 'Cumplimiento' : 'Cumplimiento — ' + mins + ' min';
    }
  });
  // Combine availability with the user's show/hide choices
  _AVAIL_MINS = availMins;
  if (typeof applySectionVis === 'function') applySectionVis();
}

function avgSheet(sheet) {
  if (!sheet || !sheet.length) return null;
  const egKeys = [
    'pob',
    'pob_flot',
    'mob_area',
    'mob_frente',
    'ingreso',
    'gasto',
    'nse_a',
    'nse_b',
    'nse_c',
    'nse_d',
    'nse_e'
  ];
  const avg = {};
  egKeys.forEach(k => {
    const vals = sheet
      .map(r => egGetRaw(r, k))
      .filter(v => v !== null && v !== undefined && v !== '')
      .map(v => pf(v))
      .filter(v => v > 0);
    avg[k] = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
  });
  return avg;
}

function editDemoCard(input) {
  var key = input.dataset.key;
  var mins = input.dataset.mins;
  var raw = input.value.replace(/[,$M]/g, '').trim();
  var num = parseFloat(raw);
  if (!num || isNaN(num)) return;
  var mk = CURRENT_POINT && CURRENT_POINT._mapKey ? CURRENT_POINT._mapKey : null;
  if (!mk) return;
  var cur = getPE(mk, mins);
  // pob_total = pob + pob_flot (special handling)
  if (key === 'pob_total') {
    var baseRow = getRowForMins(CURRENT_POINT, parseInt(mins));
    var oldPob = cur.pob || ptGet(baseRow, 'pob');
    var oldFlot = cur.pob_flot || ptGet(baseRow, 'pob_flot');
    var oldTotal = oldPob + oldFlot || 1;
    setPE(mk, mins, 'pob', Math.round(num * (oldPob / oldTotal)));
    setPE(mk, mins, 'pob_flot', Math.round(num * (oldFlot / oldTotal)));
  } else {
    setPE(mk, mins, key, num);
  }
  buildComplianceTables();
  buildComparables();
  if (typeof updateCalTable === 'function') updateCalTable();
}

function handleImgUpload(input, containerId, imgKey) {
  var file = input.files[0];
  if (!file) return;
  var reader = new FileReader();
  reader.onload = function (e) {
    var src = e.target.result;
    if (CURRENT_POINT && CURRENT_POINT._mapKey)
      IMG_STORE[CURRENT_POINT._mapKey + '__' + imgKey.split('__').pop()] = src;
    else IMG_STORE[imgKey] = src;
    var cont = document.getElementById(containerId);
    if (!cont) return;
    cont.innerHTML = '';
    var img = document.createElement('img');
    img.src = src;
    img.style.cssText = 'width:100%;height:100%;object-fit:cover;display:block;border-radius:8px';
    cont.appendChild(img);
    var btn = document.createElement('button');
    btn.textContent = '🔄';
    btn.style.cssText =
      'position:absolute;top:.3rem;right:.3rem;background:rgba(29,26,116,.8);color:white;border:none;border-radius:5px;padding:.2rem .4rem;font-size:.7rem;cursor:pointer;z-index:5';
    btn.onclick = function (e) {
      e.stopPropagation();
      input.click();
    };
    cont.appendChild(btn);
  };
  reader.readAsDataURL(file);
}

function buildComplianceTables() {
  const p = CURRENT_POINT;
  if (!p) return;
  const allRows = p._allRows || [p];
  const availMins = getAvailMins(p);
  const _rowFor = mins => getRowForMins(p, mins);
  [15, 20, 30].forEach(m => {
    const tab = document.getElementById('tab-' + m + 'min');
    if (tab) tab.style.display = availMins.includes(m) ? '' : 'none';
  });
  [15, 20, 30].forEach(mins => {
    const container = document.getElementById('compliance-' + mins);
    if (!container) return;
    if (!availMins.includes(mins)) {
      container.innerHTML =
        '<div style="display:flex;align-items:center;justify-content:center;min-height:200px;flex-direction:column;gap:.75rem"><div style="font-size:2rem;opacity:.3">⏱</div><div style="font-size:.9rem;color:var(--muted)">Sin datos para ' +
        mins +
        ' minutos</div></div>';
      return;
    }
    const row = _rowFor(mins);
    const pd = pdFromRow(row);
    const ru = avgSheet(RURAL[mins] || []);
    const ur = avgSheet(URBAN[mins] || []);
    const nat = avgSheet(GENERAL[mins] || []) || ur || ru;
    const pobTotal = pd.pob + pd.pob_flot;
    const sumTxt =
      (USE_TRADE_AREA ? 'Dentro del trade area' : 'En una isócrona de ' + mins + ' minutos') +
      ', el punto registra ' +
      fmtPob(pd.pob) +
      ' hab. residentes y ' +
      fmtPob(pd.pob_flot) +
      ' de población flotante (total ' +
      fmtPob(pobTotal) +
      '). Movilidad en área: ' +
      fmtPob(pd.mob_area) +
      '. Gasto retail estimado: $' +
      fmtMoney(pd.gasto) +
      ' M.';
    const _mk = CURRENT_POINT && CURRENT_POINT._mapKey ? CURRENT_POINT._mapKey : null;
    if (_mk) Object.assign(pd, getPE(_mk, mins));
    const pobTotal2 = pd.pob + pd.pob_flot;
    const _scInp = (val, key) =>
      '<input type="text" value="' +
      fmtPob(val) +
      '" data-key="' +
      key +
      '" data-mins="' +
      mins +
      '" oninput="editDemoCard(this)" style="font-size:1rem;font-weight:700;color:var(--navy);border:none;background:transparent;width:100%;text-align:center;outline:none;border-bottom:1px dashed var(--p-mid);font-family:Poppins,sans-serif">';
    const _scInpM = (val, key) =>
      '<input type="text" value="' +
      fmtMoney(val) +
      '" data-key="' +
      key +
      '" data-mins="' +
      mins +
      '" oninput="editDemoCard(this)" style="font-size:1.4rem;font-weight:700;color:var(--navy);border:none;background:transparent;width:100%;text-align:center;outline:none;border-bottom:1px dashed var(--p-mid);font-family:Poppins,sans-serif">';
    const sumTxt2 =
      (USE_TRADE_AREA ? 'Dentro del trade area' : 'En una isócrona de ' + mins + ' minutos') +
      ', el punto registra ' +
      fmtPob(pd.pob) +
      ' hab. residentes y ' +
      fmtPob(pd.pob_flot) +
      ' de población flotante (total ' +
      fmtPob(pobTotal2) +
      '). Movilidad en área: ' +
      fmtPob(pd.mob_area) +
      '. Gasto retail estimado: $' +
      fmtMoney(pd.gasto) +
      ' M.';
    container.innerHTML =
      '<div class="summary-box">' +
      sumTxt2 +
      '</div>' +
      '<div class="grid-2" style="align-items:stretch;margin-bottom:1.25rem">' +
      '<div class="card" style="display:flex;flex-direction:column">' +
      '<div class="card-header">Mapa</div>' +
      '<div class="card-body" style="padding:.75rem;flex:1">' +
      '<div class="map-placeholder" id="cumpl-img-wrap-' +
      mins +
      '" style="height:100%;min-height:320px" onclick="triggerImg(\'img-cumpl-' +
      mins +
      '\')"> ' +
      '<div class="map-icon">🗺️</div><p>Subir imagen del mapa</p><small>PNG · JPG</small>' +
      '</div>' +
      '<input type="file" id="img-cumpl-' +
      mins +
      '" accept="image/*" style="display:none" onchange="handleImgUpload(this,\'cumpl-img-wrap-' +
      mins +
      "','" +
      (_mk || 'cumpl') +
      '__cumpl-' +
      mins +
      '\')">' +
      '</div></div>' +
      '<div>' +
      '<div class="grid-4" style="margin-bottom:1.25rem">' +
      '<div class="stat-card">' +
      _scInp(pd.pob, 'pob') +
      '<div class="stat-label">Población Residente</div></div>' +
      '<div class="stat-card">' +
      _scInp(pd.pob_flot, 'pob_flot') +
      '<div class="stat-label">Población Flotante</div></div>' +
      '<div class="stat-card">' +
      _scInp(pobTotal2, 'pob_total') +
      '<div class="stat-label">Población Total</div></div>' +
      '<div class="stat-card">' +
      _scInpM(pd.gasto, 'gasto') +
      '<div class="stat-label">Gasto Retail Anual ($M)</div></div>' +
      '</div>' +
      buildNSE(pd) +
      '</div>' +
      '</div>' +
      buildHTable(pd, ur, ru, p[PT.punto], p[PT.tipo], nat);
    // Restore compliance image if stored
    if (_mk) {
      var _cimg = IMG_STORE[_mk + '__cumpl-' + mins];
      if (_cimg) {
        var _cw = document.getElementById('cumpl-img-wrap-' + mins);
        if (_cw) {
          _cw.innerHTML = '';
          var _ci = document.createElement('img');
          _ci.src = _cimg;
          _ci.style.cssText =
            'width:100%;height:100%;object-fit:cover;display:block;border-radius:8px';
          _cw.appendChild(_ci);
          var _cb = document.createElement('button');
          _cb.textContent = '🔄';
          _cb.style.cssText =
            'position:absolute;top:.3rem;right:.3rem;background:rgba(29,26,116,.8);color:white;border:none;border-radius:5px;padding:.2rem .4rem;font-size:.7rem;cursor:pointer;z-index:5';
          _cb.onclick = function (e) {
            e.stopPropagation();
            var fi = document.getElementById('img-cumpl-' + mins);
            if (fi) fi.click();
          };
          _cw.appendChild(_cb);
        }
      }
    }
  });
}

// Build ONE compliance table: rows = variables, cols = Promedio | Punto | Cumplimiento
function buildOneTable(punto, bench, puntNombre, benchLabel, headerClass) {
  const mainVars = [
    { k: 'pob', l: 'Población' },
    { k: 'pob_flot', l: 'Población Flotante' },
    { k: 'mob_area', l: 'Movilidad dentro del Área' },
    { k: 'mob_frente', l: 'Movilidad Frente al Comercio' },
    { k: 'ingreso', l: 'Ingreso Anual ($Millones)' },
    { k: 'gasto', l: 'Gasto Retail Anual ($Millones)' }
  ];
  const nseVars = [
    { k: 'nse_a', l: 'NSE A' },
    { k: 'nse_b', l: 'NSE B' },
    { k: 'nse_c', l: 'NSE C' },
    { k: 'nse_d', l: 'NSE D' },
    { k: 'nse_e', l: 'NSE E' }
  ];
  const allVars = [...nseVars, ...mainVars];

  function pctCell(v, b) {
    if (!b || b === 0) return '<td class="cumpl-col">—</td>';
    const p = Math.round((v / b) * 100);
    const cls = p >= 80 ? 'pct-green' : p >= 40 ? 'pct-orange' : 'pct-red';
    return `<td class="cumpl-col ${cls}">${p}%</td>`;
  }
  const isNse = k => k.startsWith('nse');
  const fmt2 = v => (isNse ? v.toFixed(1) + '%' : fmtN(v));

  const rows = allVars
    .map(v => {
      const suf = isNse(v.k) ? '%' : '';
      const bVal = bench ? bench[v.k] : 0;
      return `<tr>
      <td class="row-label">${v.l}</td>
      <td class="promedio-col">${bench ? fmtN(bVal) + suf : '—'}</td>
      <td class="punto-col">${fmtN(punto[v.k])}${suf}</td>
      ${pctCell(punto[v.k], bVal)}
    </tr>`;
    })
    .join('');

  return `<div class="compliance-card">
    <div class="compliance-card-header ${headerClass}">
      <span style="font-size:1rem">📊</span> ${benchLabel}
    </div>
    <div class="h-table-wrap"><table class="h-table" style="width:100%">
      <thead><tr>
        <th class="row-label nat-head">Variable</th>
        <th class="nat-head">Promedio ${benchLabel}</th>
        <th class="punto-head">${puntNombre}</th>
        <th class="cumpl-head">Cumplimiento</th>
      </tr></thead>
      <tbody>${rows}</tbody>
    </table></div>
  </div>`;
}

// Global edits for compliance table
var CUMPL_EDITS = {};
var PUNTO_EDITS = {}; // Per-time edits: PUNTO_EDITS[mapKey][minsKey][field]=value
var CAL_EDITS = {}; // {mapKey: {pt:{}, bench:{}, pesos:{}}}

// ---- Shared per-time point-data helpers ----
function _extVal(row) {
  return String(
    (typeof PT !== 'undefined' && PT.ext ? row[PT.ext] : '') ||
      row['EXTENSION'] ||
      row['Área de Cobertura'] ||
      row['Area de Cobertura'] ||
      ''
  );
}
function getAvailMins(p) {
  var rows = (p && p._allRows) || [p];
  return rows
    .map(function (r) {
      var m = _extVal(r).match(/\b(30|20|15)\b/);
      return m ? parseInt(m[1]) : null;
    })
    .filter(Boolean);
}
function getRowForMins(p, mins) {
  var rows = (p && p._allRows) || [p];
  return (
    rows.find(function (r) {
      var m = _extVal(r).match(/\b(30|20|15)\b/);
      return m && parseInt(m[1]) === mins;
    }) || p
  );
}
function pdFromRow(row) {
  function toM(v) {
    var n = pf(v);
    return n >= 100000 ? n / 1000000 : n;
  }
  return {
    pob: ptGet(row, 'pob'),
    pob_flot: ptGet(row, 'pob_flot'),
    mob_area: ptGet(row, 'mob_area'),
    mob_frente: ptGet(row, 'mob_frente'),
    ingreso: toM(ptGet(row, 'income') || pf(row[PT.income])),
    gasto: toM(ptGet(row, 'retail') || pf(row[PT.retail])),
    nse_a: pf(row[PT.nse_a]),
    nse_b: pf(row[PT.nse_b]),
    nse_c: pf(row[PT.nse_c]),
    nse_d: pf(row[PT.nse_d]),
    nse_e: pf(row[PT.nse_e])
  };
}
// Per-time edit accessors. minsKey is the minute number (or 'ta' for trade area / single area).
function peKey(mins) {
  return mins === null || mins === undefined || mins === '' ? 'ta' : String(mins);
}
function getPE(mk, mins) {
  if (!mk || !PUNTO_EDITS[mk]) return {};
  return PUNTO_EDITS[mk][peKey(mins)] || {};
}
function setPE(mk, mins, key, val) {
  if (!mk) return;
  if (!PUNTO_EDITS[mk]) PUNTO_EDITS[mk] = {};
  var k = peKey(mins);
  if (!PUNTO_EDITS[mk][k]) PUNTO_EDITS[mk][k] = {};
  PUNTO_EDITS[mk][k][key] = val;
}

function editCumplCell(input, target) {
  var tid = input.dataset.tid,
    key = input.dataset.key;
  if (!CUMPL_EDITS[tid]) CUMPL_EDITS[tid] = {};
  if (!CUMPL_EDITS[tid][key]) CUMPL_EDITS[tid][key] = {};
  var raw = input.value.replace(/[,%$M]/g, '').trim();
  var num = parseFloat(raw);
  if (!isNaN(num)) CUMPL_EDITS[tid][key][target] = num;
  var row = input.closest('tr');
  if (!row) return;
  var cells = row.querySelectorAll('td');
  var cumplTd = cells[cells.length - 1];
  if (!cumplTd) return;
  var bInp = row.querySelector(
    '[data-tid="' + tid + '"][data-key="' + key + '"][oninput*="bench"]'
  );
  var pInp = row.querySelector(
    '[data-tid="' + tid + '"][data-key="' + key + '"][oninput*="punto"]'
  );
  var bv = bInp ? parseFloat(bInp.value.replace(/[,%$M]/g, '').trim()) || 0 : 0;
  var pv = pInp ? parseFloat(pInp.value.replace(/[,%$M]/g, '').trim()) || 0 : 0;
  var isNse = cumplTd.innerHTML.includes('pp');
  if (isNse) {
    var diff = parseFloat((pv - bv).toFixed(1));
    var sign = diff >= 0 ? '+' : '';
    var col = diff >= 0 ? '#2D9E6B' : '#C0392B';
    cumplTd.innerHTML =
      '<span style="color:' + col + ';font-weight:700">' + sign + diff + ' pp</span>';
  } else if (bv) {
    var pc = Math.round((pv / bv) * 100);
    var col = pc >= 100 ? '#2D9E6B' : pc >= 90 ? '#E67E22' : pc >= 80 ? '#B8860B' : '#C0392B';
    cumplTd.innerHTML = '<span style="color:' + col + ';font-weight:700">' + pc + '%</span>';
  }
}

function buildComplianceSection(punto, national, benchSheet, benchLabel, puntNombre) {
  // Layout: filas = variables (nombre corto fijo izq), columnas = Promedio | Punto | Cumpl
  // Dos tablas lado a lado: Nacional | Bench (rural/urbano)
  const vars = [
    { k: 'pob', l: 'Población' },
    { k: 'pob_flot', l: 'Pob. Flotante' },
    { k: 'pob_total', l: 'Pob. Total' },
    { k: 'mob_area', l: 'Movil. Área ¹' },
    { k: 'mob_frente', l: 'Mov. ft comercio ¹' },
    { k: 'ingreso', l: 'Ingreso ($M) ²' },
    { k: 'gasto', l: 'Gasto Retail ($M) ²' },
    { k: 'nse_a', l: 'NSE A (%)', nse: true },
    { k: 'nse_b', l: 'NSE B (%)', nse: true },
    { k: 'nse_c', l: 'NSE C (%)', nse: true },
    { k: 'nse_d', l: 'NSE D (%)', nse: true },
    { k: 'nse_e', l: 'NSE E (%)', nse: true }
  ];

  const COL_VAR = '150px';
  const COL_PROM = '110px';
  const COL_PTO = '120px';
  const COL_CUM = '90px';

  function tableHead(benchLabel) {
    return `<thead><tr>
      <th style="text-align:left;width:${COL_VAR};min-width:${COL_VAR};background:#1D1A74;color:white;font-size:.74rem;padding:.55rem .7rem">Variable</th>
      <th style="width:${COL_PROM};min-width:${COL_PROM};background:#4D1EA8;color:white;font-size:.74rem;padding:.55rem .6rem;text-align:center">Promedio<br><span style="font-weight:400;opacity:.85">${benchLabel}</span></th>
      <th style="width:${COL_PTO};min-width:${COL_PTO};background:#9C38DF;color:white;font-size:.74rem;padding:.55rem .6rem;text-align:center;white-space:normal;word-break:break-word">${puntNombre}</th>
      <th style="width:${COL_CUM};min-width:${COL_CUM};background:#C63CFC;color:white;font-size:.74rem;padding:.55rem .6rem;text-align:center">Cumplimiento</th>
    </tr></thead>`;
  }

  function buildRows(sheet, tableId) {
    const inpStyle =
      'border:none;background:transparent;width:90%;text-align:center;font-size:.8rem;font-family:Poppins,sans-serif;cursor:pointer;border-bottom:1px dashed currentColor;outline:none;font-weight:inherit;color:inherit';
    return vars
      .map(v => {
        const benchVal = sheet ? sheet[v.k] || 0 : 0;
        const puntoVal = punto[v.k] || 0;
        let cumplHtml = '<span style="color:#aaa">—</span>';
        if (v.nse) {
          if (benchVal) {
            const diff = parseFloat((puntoVal - benchVal).toFixed(1));
            const sign = diff >= 0 ? '+' : '';
            const col = diff >= 0 ? '#2D9E6B' : '#C0392B';
            cumplHtml = `<span style="color:${col};font-weight:700">${sign}${diff} pp</span>`;
          }
        } else if (benchVal) {
          const pc = Math.round((puntoVal / benchVal) * 100);
          const col =
            pc >= 100 ? '#2D9E6B' : pc >= 90 ? '#E67E22' : pc >= 80 ? '#B8860B' : '#C0392B';
          cumplHtml = `<span style="color:${col};font-weight:700">${pc}%</span>`;
        }
        const benchCell = benchVal
          ? `<input type="text" value="${fmtByKey(v.k, benchVal)}" data-tid="${tableId}" data-key="${v.k}" oninput="editCumplCell(this,'bench')" style="${inpStyle};opacity:.85">`
          : '—';
        const puntoCell = `<input type="text" value="${fmtByKey(v.k, puntoVal)}" data-tid="${tableId}" data-key="${v.k}" oninput="editCumplCell(this,'punto')" style="${inpStyle};font-weight:700">`;
        return `<tr>
        <td style="text-align:left;font-size:.78rem;font-weight:600;color:#4D1EA8;padding:.5rem .7rem;border-bottom:1px solid #DDD6F5;background:#FDFBFF;width:${COL_VAR};min-width:${COL_VAR}">${v.l}</td>
        <td style="text-align:center;font-size:.8rem;color:#7B5EA7;padding:.5rem .6rem;border-bottom:1px solid #DDD6F5;width:${COL_PROM};min-width:${COL_PROM}">${benchCell}</td>
        <td style="text-align:center;font-size:.8rem;font-weight:700;color:#1D1A74;background:#F0E5FF;padding:.5rem .6rem;border-bottom:1px solid #DDD6F5;width:${COL_PTO};min-width:${COL_PTO}">${puntoCell}</td>
        <td style="text-align:center;font-size:.8rem;padding:.5rem .6rem;border-bottom:1px solid #DDD6F5;width:${COL_CUM};min-width:${COL_CUM}">${cumplHtml}</td>
      </tr>`;
      })
      .join('');
  }

  const natRows = buildRows(
    national.reduce((acc, v) => {
      acc[v.k] = v.avg;
      return acc;
    }, {}),
    'nat'
  );
  const benchRowsData = benchSheet.reduce((acc, v) => {
    acc[v.k] = v.avg;
    return acc;
  }, {});
  const benchRows = buildRows(benchRowsData, 'bench');

  const tStyle = 'border-collapse:collapse;width:100%;table-layout:fixed';

  const footnote =
    '<p style="font-size:.72rem;color:#7B5EA7;margin-top:.25rem;padding:.2rem .5rem">¹ Mensual &nbsp;·&nbsp; ² Anual</p>';
  const scrollWrap = 'overflow-x:auto;-webkit-overflow-scrolling:touch';
  return (
    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:1.25rem;margin-bottom:.25rem">' +
    '<div class="compliance-card">' +
    '<div style="background:linear-gradient(135deg,#1D1A74,#4D1EA8);color:white;padding:.8rem 1.1rem;font-size:.88rem;font-weight:700;font-family:Poppins,sans-serif">Nacional</div>' +
    '<div style="' +
    scrollWrap +
    '"><table style="' +
    tStyle +
    '">' +
    tableHead('Nacional') +
    '<tbody>' +
    natRows +
    '</tbody></table></div>' +
    '</div>' +
    '<div class="compliance-card">' +
    '<div style="background:linear-gradient(135deg,#4D1EA8,#9C38DF);color:white;padding:.8rem 1.1rem;font-size:.88rem;font-weight:700;font-family:Poppins,sans-serif">' +
    benchLabel +
    '</div>' +
    '<div style="' +
    scrollWrap +
    '"><table style="' +
    tStyle +
    '">' +
    tableHead(benchLabel) +
    '<tbody>' +
    benchRows +
    '</tbody></table></div>' +
    '</div>' +
    '</div>' +
    footnote
  );
}

function buildHTable(punto, urban, rural, puntNombre, tipo, nat) {
  const tipoUrbRu = String((CURRENT_POINT && CURRENT_POINT[PT.tipo_urb]) || '')
    .trim()
    .toLowerCase();
  const puntoMuni = (
    CURRENT_POINT &&
    (CURRENT_POINT[PT.muni] || CURRENT_POINT['Municipio'] || '')
  ).toLowerCase();
  const clasifFromMap = CLASIF_MAP[puntoMuni] || '';
  const isRuralPoint = tipoUrbRu
    ? tipoUrbRu === 'rural'
    : clasifFromMap
      ? clasifFromMap.includes('rural')
      : tipo && tipo.toLowerCase().includes('rural');
  const bench = isRuralPoint ? rural : urban;
  const benchLabel = isRuralPoint ? 'Rural' : 'Urbano / Metropolitano';
  const natBench = nat || urban || rural;
  function enrichSheet(sheet) {
    if (!sheet) return null;
    return { ...sheet, pob_total: (sheet.pob || 0) + (sheet.pob_flot || 0) };
  }
  const allKeys = [
    'pob',
    'pob_flot',
    'pob_total',
    'mob_area',
    'mob_frente',
    'ingreso',
    'gasto',
    'nse_a',
    'nse_b',
    'nse_c',
    'nse_d',
    'nse_e'
  ];
  function toArr(sheet) {
    const e = enrichSheet(sheet);
    return allKeys.map(k => ({ k, avg: e ? e[k] || 0 : 0 }));
  }
  const enrichedPunto = { ...punto, pob_total: (punto.pob || 0) + (punto.pob_flot || 0) };
  return buildComplianceSection(
    enrichedPunto,
    toArr(natBench),
    toArr(bench),
    benchLabel,
    puntNombre || 'Punto'
  );
}

function buildNSE(pd) {
  const colors = {
    nse_a: '#C63CFC',
    nse_b: '#9C38DF',
    nse_c: '#4D1EA8',
    nse_d: '#1D1A74',
    nse_e: '#E67E22'
  };
  const bars = ['a', 'b', 'c', 'd', 'e']
    .map(l => {
      const val = Math.min(pd['nse_' + l] || 0, 100);
      const display = (pd['nse_' + l] || 0).toFixed(2) + '%';
      return (
        '<div style="display:flex;align-items:center;gap:.65rem;margin-bottom:.6rem">' +
        '<div style="width:44px;font-size:.78rem;font-weight:700;color:#1D1A74;font-family:Poppins,sans-serif">NSE ' +
        l.toUpperCase() +
        '</div>' +
        '<div style="flex:1;background:#E0D0F5;border-radius:20px;height:10px;overflow:hidden">' +
        '<div style="width:' +
        val +
        '%;height:100%;border-radius:20px;background:' +
        colors['nse_' + l] +
        '"></div>' +
        '</div>' +
        '<div style="width:48px;font-size:.78rem;color:#7B5EA7;text-align:right;font-family:Poppins,sans-serif">' +
        display +
        '</div>' +
        '</div>'
      );
    })
    .join('');
  return (
    '<div class="card" style="margin-bottom:1.25rem">' +
    '<div class="card-header" style="background:linear-gradient(135deg,#1D1A74,#9C38DF)">Distribución NSE del Punto</div>' +
    '<div class="card-body" style="padding:1.25rem">' +
    bars +
    '</div>' +
    '</div>'
  );
}
