// HELPERS

// Devuelve el CSS que el export inyecta en el reporte generado: la tipografía
// embebida (#fonts-css, ver vendor/fonts-poppins.js) más el CSS del reporte (#main-css).
// Antes esto era document.querySelector('style').textContent, que dependía de que
// el CSS fuera el primer <style> del documento: al separar el CSS a un archivo
// devolvía null y el reporte exportado salía sin estilos, sin avisar.
// Incluir #fonts-css es lo que hace que el reporte exportado tenga la fuente sin
// internet; si se omite, cae a una tipografía genérica.
function getMainCSS() {
  const parts = [];
  ['fonts-css', 'main-css'].forEach(function (id) {
    const el = document.getElementById(id);
    if (el && el.textContent.trim()) parts.push(el.textContent);
  });
  if (parts.length) return parts.join('\n');
  // Respaldos: cualquier <style> presente y, en último caso, las hojas cargadas.
  const out = [];
  document.querySelectorAll('style').forEach(function (s) {
    out.push(s.textContent);
  });
  if (out.join('').trim()) return out.join('\n');
  for (let i = 0; i < document.styleSheets.length; i++) {
    try {
      const r = document.styleSheets[i].cssRules;
      for (let j = 0; j < r.length; j++) out.push(r[j].cssText);
    } catch (e) {
      console.warn('getMainCSS: hoja de estilo inaccesible', e);
    }
  }
  return out.join('\n');
}

function pf(v) {
  if (v === undefined || v === null || v === '') return 0;
  const s = String(v).trim();
  if (s.includes(' a ')) {
    const parts = s.split(' a ');
    const a = parseFloat(parts[0].replace(/,/g, '')) || 0;
    const b = parseFloat(parts[1].replace(/,/g, '')) || 0;
    return (a + b) / 2;
  }
  return parseFloat(s.replace(/,/g, '')) || 0;
}
function fmtN(n, forceInt) {
  if (n === undefined || n === null || n === '') return '—';
  const num = parseFloat(n);
  if (isNaN(num)) return String(n);
  if (forceInt) return Math.round(num).toLocaleString('en-US');
  if (Math.abs(num) >= 1000) return Math.round(num).toLocaleString('en-US');
  return num % 1 === 0 ? num.toString() : num.toFixed(1);
}
function fmtPob(n) {
  if (n === undefined || n === null || n === '') return '—';
  const num = Math.round(parseFloat(n));
  if (isNaN(num)) return '—';
  return num.toLocaleString('en-US');
}
function fmtMoney(n) {
  if (n === undefined || n === null || n === '') return '—';
  const num = parseFloat(n);
  if (isNaN(num)) return '—';
  return num.toFixed(1);
}
function fmtNSE(n) {
  if (n === undefined || n === null || n === '') return '—';
  const num = parseFloat(n);
  if (isNaN(num)) return '—';
  return num.toFixed(2);
}
function fmtByKey(k, val) {
  if (k === 'ingreso' || k === 'gasto') return fmtMoney(val);
  if (k.startsWith('nse')) return fmtNSE(val);
  return fmtPob(val);
}
function setLoading(show, msg, sub) {
  document.getElementById('loading-overlay').style.display = show ? 'flex' : 'none';
  if (msg) document.getElementById('loading-msg').textContent = msg;
  if (sub !== undefined) document.getElementById('loading-sub').textContent = sub;
}

// DEMO
function loadDemo() {
  setLoading(true, 'Cargando datos demo...', '');
  setTimeout(() => {
    POINTS = [
      {
        PUNTO: 'Agencia Centro',
        LAT: '15.5039',
        LNG: '-88.0252',
        TIPO: 'Supermercado',
        'TIPO URB O RURAL': 'Urbano',
        METODO_TRANSPORTE: 'Manejando',
        EXTENSION: '15 min',
        Municipio: 'San Pedro Sula',
        POBLACION: '7906',
        RETAIL_USD: '12000000',
        INCOME_USD: '40900000',
        NSE_A: '6',
        NSE_B: '7',
        NSE_C: '20',
        NSE_D: '39',
        NSE_E: '27',
        MOVILIDAD_FRENTE_AL_COMERCIO: '23400',
        MOVILIDAD_EN_AREA: '89200',
        POBLACION_FLOTANTE: '2600',
        COMPETIDOR_1: 'La Torre',
        COMPETIDOR_2: 'Supermercado El Rey',
        COMPETIDOR_3: 'Pricesmart',
        COMPETIDOR_4: '',
        COMPETIDOR_5: ''
      },
      {
        PUNTO: 'Agencia Centro',
        LAT: '15.5039',
        LNG: '-88.0252',
        TIPO: 'Supermercado',
        'TIPO URB O RURAL': 'Urbano',
        METODO_TRANSPORTE: 'Manejando',
        EXTENSION: '20 min',
        Municipio: 'San Pedro Sula',
        POBLACION: '17109',
        RETAIL_USD: '30500000',
        INCOME_USD: '96100000',
        NSE_A: '9',
        NSE_B: '7',
        NSE_C: '28',
        NSE_D: '37',
        NSE_E: '19',
        MOVILIDAD_FRENTE_AL_COMERCIO: '44200',
        MOVILIDAD_EN_AREA: '149100',
        POBLACION_FLOTANTE: '5250',
        COMPETIDOR_1: 'La Torre',
        COMPETIDOR_2: 'Supermercado El Rey',
        COMPETIDOR_3: 'Pricesmart',
        COMPETIDOR_4: '',
        COMPETIDOR_5: ''
      },
      {
        PUNTO: 'Agencia Centro',
        LAT: '15.5039',
        LNG: '-88.0252',
        TIPO: 'Supermercado',
        'TIPO URB O RURAL': 'Urbano',
        METODO_TRANSPORTE: 'Manejando',
        EXTENSION: '30 min',
        Municipio: 'San Pedro Sula',
        POBLACION: '117489',
        RETAIL_USD: '247200000',
        INCOME_USD: '829700000',
        NSE_A: '11',
        NSE_B: '7',
        NSE_C: '36',
        NSE_D: '20',
        NSE_E: '24',
        MOVILIDAD_FRENTE_AL_COMERCIO: '23400',
        MOVILIDAD_EN_AREA: '365400',
        POBLACION_FLOTANTE: '56700',
        COMPETIDOR_1: 'La Torre',
        COMPETIDOR_2: 'Supermercado El Rey',
        COMPETIDOR_3: 'Pricesmart',
        COMPETIDOR_4: '',
        COMPETIDOR_5: ''
      }
    ];
    const mk = (n, pob, pa, pb, pc, pd, pe, ing, gas) => ({
      Tienda: n,
      'Poblacion Residente': pob,
      'Poblacion Flotante (Promedio)': Math.round(pob * 0.3),
      'Movilidad en el Area (Promedio)': Math.round(pob * 11),
      'Movilidad Frente al Comercio  (Promedio)': Math.round(pob * 2.9),
      'Ingreso Anual ($Millones)': ing,
      'Gasto Retail Anual ($Millones)': gas,
      'NSE A (%)': pa,
      'NSE B (%)': pb,
      'NSE C (%)': pc,
      'NSE D (%)': pd,
      'NSE E (%)': pe
    });
    const rA = mk('Tienda Rural A', 6800, 2, 5, 14, 45, 34, 32.1, 9.8),
      rB = mk('Tienda Rural B', 9200, 1, 4, 11, 50, 34, 41.0, 12.5);
    const uA = mk('Tienda Urbana A', 82000, 18, 16, 30, 22, 14, 600.0, 177.0),
      uB = mk('Tienda Urbana B', 75000, 15, 14, 28, 26, 17, 540.0, 162.0);
    RURAL = { 15: [rA, rB], 20: [rA, rB], 30: [rA, rB] };
    URBAN = { 15: [uA, uB], 20: [uA, uB], 30: [uA, uB] };
    CLASIFICACION = [{ Municipio: 'San Pedro Sula', Clasificación: 'Urbano' }];
    CLASIF_MAP = {};
    CLASIFICACION.forEach(r => {
      const m = String(r['Municipio'] || '')
        .trim()
        .toLowerCase();
      const c = String(r['Clasificación'] || '')
        .trim()
        .toLowerCase();
      if (m) CLASIF_MAP[m] = c;
    });
    POINT_MAP = {};
    POINTS.forEach(p => {
      const n = String(p[PT.punto] || '').trim();
      if (!POINT_MAP[n]) POINT_MAP[n] = [];
      POINT_MAP[n].push(p);
    });
    const uNames = Object.keys(POINT_MAP);
    const sel = document.getElementById('point-select');
    sel.innerHTML = '';
    uNames.forEach(n => {
      const o = document.createElement('option');
      o.value = n;
      o.textContent = n;
      sel.appendChild(o);
    });
    setLoading(false);
    document.getElementById('upload-screen').style.display = 'none';
    document.getElementById('report-screen').style.display = 'block';
    switchPoint(uNames[0]);
  }, 600);
}
