// Prueba de humo end-to-end. Mete un .xlsx real por el pipeline de la app
// (readXLSX → detectSheets → buildReport → exportStaticHTML) en un navegador
// headless con la red bloqueada, y comprueba que el reporte exportado sale
// completo y sin depender de internet.
//
// Uso: node tools/smoke-test.js <archivo.html> <archivo.xlsx>

const fs = require('fs');
const path = require('path');
const os = require('os');
const { execFileSync } = require('child_process');

const [target, xlsx] = process.argv.slice(2);
if (!target || !xlsx) {
  console.error('Uso: node tools/smoke-test.js <archivo.html> <archivo.xlsx>');
  process.exit(1);
}

const ROOT = path.join(__dirname, '..');
const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';

const html = fs.readFileSync(path.join(ROOT, target), 'utf8');
const b64 = fs.readFileSync(path.join(ROOT, xlsx)).toString('base64');

const probe = `
<div id="__probe">pendiente</div>
<script>
(function(){
  var log = [];
  var alerts = [];
  window.alert = function(m){ alerts.push(String(m)); };

  // Se vuelca el progreso tras cada paso: si algo se cuelga más adelante, el DOM
  // capturado igual muestra hasta dónde llegó.
  function flush(){
    document.getElementById('__probe').textContent = log.join('\\n');
  }
  function say(line){ log.push(line); flush(); }

  function finish(){
    say('ALERTAS: ' + (alerts.length ? alerts.join(' | ') : 'ninguna'));
    say('ERRORES JS: ' + (window.__errs.length ? window.__errs.join(' | ') : 'ninguno'));
    say('=== COMPLETADO ===');
  }

  try {
    // base64 -> File, tal como llegaría desde el input de archivo
    var bin = atob(${JSON.stringify(b64)});
    var bytes = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    var file = new File([bytes], 'prueba.xlsx',
      { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

    readXLSX(file);

    // readXLSX usa FileReader (asíncrono): esperar a que POINTS se llene.
    var tries = 0;
    var wait = setInterval(function(){
      tries++;
      if (typeof POINTS !== 'undefined' && POINTS.length) {
        clearInterval(wait);
        step2();
      } else if (tries > 100) {
        clearInterval(wait);
        say('FALLO: POINTS quedó vacío tras leer el Excel');
        finish();
      }
    }, 50);

    function step2(){
      say('hojas detectadas: ' + WB.SheetNames.length + ' -> ' + WB.SheetNames.join(', '));
      say('POINTS: ' + POINTS.length + ' filas | CLASIFICACION: ' + CLASIFICACION.length);

      buildReport();

      // buildReport hace el trabajo dentro de un setTimeout (para poder pintar el
      // overlay de carga antes), así que hay que esperar a que POINT_MAP se llene.
      var t2 = 0;
      var wait2 = setInterval(function(){
        t2++;
        if (Object.keys(POINT_MAP).length) { clearInterval(wait2); step3(); }
        else if (t2 > 100) { clearInterval(wait2); say('FALLO: POINT_MAP quedó vacío tras buildReport'); finish(); }
      }, 50);
    }

    function step3(){
      // No basta con que el CSS de la fuente esté presente: hay que confirmar que el
      // navegador la carga y la puede usar sin pedirla a la red.
      document.fonts.ready.then(function(){
        say('Poppins usable (400/700/800): ' +
          ['400','700','800'].map(function(w){
            return w + '=' + document.fonts.check(w + ' 16px Poppins');
          }).join(' '));
      });

      var names = Object.keys(POINT_MAP);
      say('puntos en POINT_MAP: ' + names.length + ' -> ' + names.slice(0,4).join(' / '));
      say('punto actual: ' + (CURRENT_POINT ? CURRENT_POINT[PT.punto] : 'NINGUNO'));
      say('pantalla de reporte visible: ' +
        (document.getElementById('report-screen').style.display !== 'none'));
      say('tablas de cumplimiento renderizadas: ' +
        document.querySelectorAll('#s-15min table, #s-20min table, #s-30min table').length);
      say('comparables renderizados: ' +
        (document.getElementById('comparables-table').innerHTML.length > 200));

      // Interceptar la descarga para inspeccionar el reporte exportado.
      var captured = null;
      var RealBlob = window.Blob;
      window.Blob = function(parts, opts){ captured = parts && parts[0]; return new RealBlob(parts, opts); };
      var realClick = HTMLAnchorElement.prototype.click;
      HTMLAnchorElement.prototype.click = function(){};

      say('iniciando exportStaticHTML() con ' + names.length + ' puntos...');
      exportStaticHTML();

      // exportStaticHTML es ASÍNCRONO: captureAll() recorre los puntos con un
      // setTimeout(...,300) cada uno y solo crea el Blob al terminar la cadena.
      // Hay que esperar, y mantener los parches puestos hasta entonces: si se
      // restauran antes, la descarga real se dispara y cuelga el navegador headless.
      var t3 = 0;
      var wait3 = setInterval(function(){
        t3++;
        if (captured || t3 > 400) {
          clearInterval(wait3);
          window.Blob = RealBlob;
          HTMLAnchorElement.prototype.click = realClick;
          report();
        }
      }, 50);

      function report(){
      if (!captured) {
        say('FALLO: exportStaticHTML no generó ningún blob');
      } else {
        say('--- reporte exportado ---');
        say('tamaño: ' + Math.round(captured.length / 1024) + ' KB');
        say('tipografía embebida (woff2 base64): ' + /data:font\\/woff2;base64/.test(captured));
        say('referencias a internet: ' +
          ((captured.match(/https?:\\/\\/[^"')\\s]+/g) || []).join(' | ') || 'ninguna'));
        say('tarjetas de contenido en el export: ' + (captured.match(/class="card"/g) || []).length);
        say('puntos en el export: ' + (captured.match(/class="exp-point"/g) || []).length +
          ' de ' + names.length);
        say('tiene datos del punto: ' + captured.includes(
          CURRENT_POINT ? String(CURRENT_POINT[PT.punto]) : '@@'));
      }
      finish();
      }
    }
  } catch (e) {
    say('EXCEPCION: ' + (e && e.stack ? e.stack.split('\\n')[0] : e));
    finish();
  }
})();
</script>`;

const harness =
  '<script>window.__errs=[];window.onerror=function(m,s,l){window.__errs.push(m+" @"+l);};</script>\n' +
  html +
  probe;

// El arnés vive junto al archivo probado para que las rutas relativas a vendor/ y src/ resuelvan.
const harnessPath = path.join(ROOT, path.dirname(target), '_smoke_harness.html');
fs.writeFileSync(harnessPath, harness, 'utf8');

const fileUrl = 'file:///' + harnessPath.replace(/\\/g, '/').replace(/ /g, '%20');
const dump = path.join(os.tmpdir(), 'smoke-dump.html');

let out = '';
let failure = null;
try {
  out = execFileSync(
    EDGE,
    [
      '--headless',
      '--disable-gpu',
      '--no-sandbox',
      // Bloquea toda resolución DNS: simula un equipo sin internet.
      '--host-resolver-rules=MAP * ~NOTFOUND',
      '--virtual-time-budget=60000',
      '--dump-dom',
      fileUrl,
    ],
    {
      maxBuffer: 64 * 1024 * 1024,
      stdio: ['ignore', 'pipe', 'ignore'],
      // Sin esto, un cuelgue del navegador deja el proceso vivo indefinidamente.
      timeout: 180000,
      killSignal: 'SIGKILL',
    }
  ).toString('utf8');
} catch (e) {
  // Con timeout o salida no-cero, stdout parcial sigue sirviendo: el probe vuelca
  // su progreso tras cada paso, así que indica hasta dónde llegó.
  out = e.stdout ? e.stdout.toString('utf8') : '';
  failure = e.killed || e.signal ? `el navegador excedió el límite de tiempo (${e.signal || 'timeout'})` : e.message;
} finally {
  try { fs.unlinkSync(harnessPath); } catch {}
}

fs.writeFileSync(dump, out, 'utf8');
const m = out.match(/id="__probe">([\s\S]*?)<\/div>/);

console.log(`\n=== ${target} — red bloqueada ===`);
if (m) console.log(m[1]);
else console.log(`PROBE NO ENCONTRADO — ${out.length} bytes volcados en ${dump}`);

if (failure) {
  console.error(`\nFALLO: ${failure}`);
  process.exitCode = 1;
} else if (!m || !m[1].includes('=== COMPLETADO ===')) {
  console.error('\nFALLO: la prueba no llegó al final.');
  process.exitCode = 1;
}
