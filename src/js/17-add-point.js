// ── ADD POINT MANUALLY ──
function openAddPoint() {
  document.getElementById('add-point-modal').style.display = 'block';
  document.body.style.overflow = 'hidden';
}
function closeAddPoint() {
  document.getElementById('add-point-modal').style.display = 'none';
  document.body.style.overflow = '';
}
function apSelectTab(mins) {
  document.querySelectorAll('.ap-iso-panel').forEach(function (p) {
    p.style.display = 'none';
  });
  document.getElementById('ap-panel-' + mins).style.display = 'block';
  document.querySelectorAll('.ap-iso-tab').forEach(function (t) {
    t.style.background = 'white';
    t.style.color = 'var(--muted)';
    t.style.borderColor = 'var(--border)';
  });
  var activeTab = document.getElementById('ap-tab-' + mins);
  if (activeTab) {
    activeTab.style.background = '#9C38DF';
    activeTab.style.color = 'white';
    activeTab.style.borderColor = '#9C38DF';
  }
}

function apVal(id) {
  return document.getElementById(id) ? document.getElementById(id).value.trim() : '';
}
function apNum(id) {
  var v = apVal(id);
  return v ? parseFloat(v.replace(/,/g, '')) || 0 : 0;
}

function saveNewPoint() {
  var nombre = apVal('ap-nombre');
  if (!nombre) {
    document.getElementById('ap-error').style.display = 'block';
    return;
  }
  document.getElementById('ap-error').style.display = 'none';

  var base = {
    PUNTO: nombre,
    Corporacion: apVal('ap-corp'),
    Municipio: apVal('ap-muni'),
    Departamento: apVal('ap-dpto'),
    LAT: apVal('ap-lat'),
    LNG: apVal('ap-lng'),
    'TIPO URB O RURAL': apVal('ap-tipo-ur'),
    METODO_TRANSPORTE: apVal('ap-metodo'),
    COMPETIDOR_1: apVal('ap-c1'),
    COMPETIDOR_2: apVal('ap-c2'),
    COMPETIDOR_3: apVal('ap-c3'),
    COMPETIDOR_4: apVal('ap-c4'),
    COMPETIDOR_5: apVal('ap-c5')
  };

  var rows = [];
  ['15', '20', '30'].forEach(function (m) {
    var pob = apNum('ap-pob-' + m);
    var flot = apNum('ap-flot-' + m);
    var moba = apNum('ap-moba-' + m);
    var mobf = apNum('ap-mobf-' + m);
    var ing = apNum('ap-ing-' + m);
    var ret = apNum('ap-ret-' + m);
    var nsea = apNum('ap-nsea-' + m);
    var nseb = apNum('ap-nseb-' + m);
    var nsec = apNum('ap-nsec-' + m);
    var nsed = apNum('ap-nsed-' + m);
    var nsee = apNum('ap-nsee-' + m);
    // Only add row if at least population is filled
    if (pob > 0 || flot > 0 || moba > 0) {
      var row = Object.assign({}, base, {
        EXTENSION: m + ' min',
        POBLACION: pob,
        POBLACION_FLOTANTE: flot,
        MOVILIDAD_EN_AREA: moba,
        MOVILIDAD_FRENTE_AL_COMERCIO: mobf,
        INCOME_USD: ing,
        RETAIL_USD: ret,
        NSE_A: nsea,
        NSE_B: nseb,
        NSE_C: nsec,
        NSE_D: nsed,
        NSE_E: nsee
      });
      rows.push(row);
    }
  });

  if (rows.length === 0) {
    // Add at least one row with whatever is in 15 min
    rows.push(
      Object.assign({}, base, {
        EXTENSION: '15 min',
        POBLACION: 0,
        POBLACION_FLOTANTE: 0,
        MOVILIDAD_EN_AREA: 0,
        MOVILIDAD_FRENTE_AL_COMERCIO: 0,
        INCOME_USD: 0,
        RETAIL_USD: 0,
        NSE_A: 0,
        NSE_B: 0,
        NSE_C: 0,
        NSE_D: 0,
        NSE_E: 0
      })
    );
  }

  // Add to POINTS array and POINT_MAP
  rows.forEach(function (r) {
    POINTS.push(r);
  });
  if (!POINT_MAP[nombre]) POINT_MAP[nombre] = [];
  rows.forEach(function (r) {
    POINT_MAP[nombre].push(r);
  });

  // Add to selector
  var sel = document.getElementById('point-select');
  // Check if already exists
  var exists = false;
  for (var i = 0; i < sel.options.length; i++) {
    if (sel.options[i].value === nombre) {
      exists = true;
      break;
    }
  }
  if (!exists) {
    var opt = document.createElement('option');
    opt.value = nombre;
    opt.textContent = nombre;
    sel.appendChild(opt);
  }

  closeAddPoint();
  // Switch to new point
  sel.value = nombre;
  switchPoint(nombre);

  // Clear form
  [
    'ap-nombre',
    'ap-corp',
    'ap-muni',
    'ap-dpto',
    'ap-lat',
    'ap-lng',
    'ap-c1',
    'ap-c2',
    'ap-c3',
    'ap-c4',
    'ap-c5'
  ].forEach(function (id) {
    var el = document.getElementById(id);
    if (el) el.value = '';
  });
  ['15', '20', '30'].forEach(function (m) {
    ['pob', 'flot', 'moba', 'mobf', 'ing', 'ret', 'nsea', 'nseb', 'nsec', 'nsed', 'nsee'].forEach(
      function (f) {
        var el = document.getElementById('ap-' + f + '-' + m);
        if (el) el.value = '';
      }
    );
  });
  apSelectTab('15');
}
