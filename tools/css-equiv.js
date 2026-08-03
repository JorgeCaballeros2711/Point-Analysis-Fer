// Compara dos versiones del CSS de #main-css usando el parser del navegador.
// El formateo (espacios, hex en minúscula, ceros iniciales, punto y coma final) cambia
// el texto pero no las reglas: al leerlas por CSSOM, el navegador las normaliza, así
// que cualquier diferencia que quede es real.
//
// Uso: node tools/css-equiv.js <html-antes> <html-despues>

const fs = require('fs');
const path = require('path');
const os = require('os');
const { execFileSync } = require('child_process');

const [fileA, fileB] = process.argv.slice(2);
if (!fileA || !fileB) {
  console.error('Uso: node tools/css-equiv.js <html-antes> <html-despues>');
  process.exit(1);
}

const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';

function extractCss(file) {
  const s = fs.readFileSync(file, 'utf8');
  const m = s.match(/<style id="main-css">([\s\S]*?)<\/style>/);
  if (!m) {
    console.error(`No se encontró <style id="main-css"> en ${file}`);
    process.exit(1);
  }
  return m[1];
}

const page = `<div id="r">pendiente</div>
<script>
window.onerror = function (m, s, l) {
  document.getElementById('r').textContent = 'ERROR JS: ' + m + ' @' + l;
};
(function () {
  function rules(text) {
    var el = document.createElement('style');
    el.textContent = text;
    document.head.appendChild(el);
    var out = [];
    var rs = el.sheet.cssRules;
    for (var i = 0; i < rs.length; i++) out.push(rs[i].cssText);
    document.head.removeChild(el);
    return out;
  }
  var A = rules(window.__CSS_A);
  var B = rules(window.__CSS_B);
  var lines = ['reglas antes: ' + A.length, 'reglas ahora: ' + B.length];
  var diff = [];
  for (var i = 0; i < Math.max(A.length, B.length); i++) {
    if (A[i] !== B[i]) {
      diff.push(i + ':\\n    antes: ' + (A[i] || '(falta)') + '\\n    ahora: ' + (B[i] || '(falta)'));
    }
  }
  lines.push('reglas distintas: ' + diff.length);
  document.getElementById('r').textContent = lines.concat(diff.slice(0, 8)).join('\\n');
})();
</script>`;

// El CSS va como variables globales en su propio script para no pelear con el escapado.
const data =
  '<script>window.__CSS_A=' +
  JSON.stringify(extractCss(fileA)) +
  ';window.__CSS_B=' +
  JSON.stringify(extractCss(fileB)) +
  ';</script>\n';

const tmp = path.join(os.tmpdir(), 'css-equiv.html');
fs.writeFileSync(tmp, data + page, 'utf8');

const url = 'file:///' + tmp.replace(/\\/g, '/').replace(/ /g, '%20');
const out = execFileSync(
  EDGE,
  ['--headless', '--disable-gpu', '--no-sandbox', '--virtual-time-budget=10000', '--dump-dom', url],
  { maxBuffer: 64 * 1024 * 1024, stdio: ['ignore', 'pipe', 'ignore'], timeout: 120000 }
).toString('utf8');

const m = out.match(/id="r">([\s\S]*?)<\/div>/);
console.log(m ? m[1] : 'PROBE NO ENCONTRADO');
if (!m || !/reglas distintas: 0$/m.test(m[1])) process.exitCode = 1;
