// Regenera vendor/fonts-poppins.js con la tipografía Poppins embebida en base64.
// Uso: node tools/fetch-fonts.js     (requiere internet; solo al actualizar la fuente)
//
// La app tiene que funcionar sin internet, así que no se puede depender del @import
// a fonts.googleapis.com. Este script baja los woff2 y los incrusta como data: URIs.
//
// ¿Por qué emite un .js y no un .css? Porque el CSS tiene que quedar legible desde
// JavaScript: 18-export.js lo copia al reporte generado, y eso es lo que hace que el
// reporte exportado tenga la fuente offline. Un .css cargado con <link> no sirve:
// sobre file:// el navegador lo trata como origen opaco, cssRules lanza SecurityError
// y el reporte saldría sin tipografía. Emitiendo un .js que inyecta <style id="fonts-css">
// hay una sola fuente de verdad y funciona igual en la carpeta y en el entregable.
//
// Se embebe únicamente el subset "latin" (U+0000-00FF): cubre acentos y ñ del
// español. latin-ext (Europa del Este) y devanagari se descartan por peso.

const fs = require('fs');
const path = require('path');

const FAMILY = 'Poppins';
const WEIGHTS = [300, 400, 600, 700, 800];
const SUBSET = 'latin';
const CSS_URL = `https://fonts.googleapis.com/css2?family=${FAMILY}:wght@${WEIGHTS.join(';')}&display=swap`;
// Google devuelve woff2 solo si el User-Agent parece un navegador moderno.
const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36';

const OUT = path.join(__dirname, '..', 'vendor', 'fonts-poppins.js');

async function get(url, asBuffer) {
  const res = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} — ${url}`);
  return asBuffer ? Buffer.from(await res.arrayBuffer()) : res.text();
}

(async () => {
  const css = await get(CSS_URL, false);

  // El CSS de Google viene como bloques precedidos por un comentario con el subset:
  //   /* latin */
  //   @font-face { ... src: url(...woff2) ... }
  const blocks = [];
  const re = /\/\*\s*([a-z-]+)\s*\*\/\s*(@font-face\s*\{[^}]*\})/g;
  let m;
  while ((m = re.exec(css)) !== null) {
    if (m[1] === SUBSET) blocks.push(m[2]);
  }

  if (blocks.length !== WEIGHTS.length) {
    throw new Error(
      `Se esperaban ${WEIGHTS.length} bloques "${SUBSET}", se encontraron ${blocks.length}`
    );
  }

  const rules = [];
  let bytes = 0;
  for (const block of blocks) {
    const urlMatch = block.match(/url\((https:\/\/[^)]+\.woff2)\)/);
    if (!urlMatch) throw new Error('Bloque @font-face sin URL woff2:\n' + block);
    const font = await get(urlMatch[1], true);
    bytes += font.length;
    const dataUri = `url(data:font/woff2;base64,${font.toString('base64')}) format('woff2')`;
    rules.push(
      block
        .replace(/url\(https:\/\/[^)]+\.woff2\)\s*format\('woff2'\)/, dataUri)
        .replace(/\s*\n\s*/g, ' ')
        .trim()
    );
  }

  const fontCss = rules.join('\n');
  // El CSS no puede contener "</style>" ni comillas invertidas: lo primero cerraría la
  // etiqueta antes de tiempo, lo segundo rompería el template literal generado.
  for (const bad of ['</style', '`', '${']) {
    if (fontCss.includes(bad)) throw new Error(`El CSS generado contiene "${bad}"`);
  }

  const js = [
    '// ' + FAMILY + ' — subset ' + SUBSET + ', embebido para funcionar sin internet.',
    '// GENERADO por tools/fetch-fonts.js. No editar a mano.',
    '// Se inyecta como <style id="fonts-css"> para que getMainCSS() (13-helpers.js)',
    '// pueda leerlo y copiarlo al reporte exportado.',
    '(function(){',
    '  var css = `' + fontCss + '`;',
    '  var el = document.createElement("style");',
    '  el.id = "fonts-css";',
    '  el.textContent = css;',
    '  document.head.appendChild(el);',
    '})();',
    ''
  ].join('\n');

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, js, 'utf8');

  const kb = n => (n / 1024).toFixed(1) + ' KB';
  console.log(
    `vendor/fonts-poppins.js — ${blocks.length} pesos (${WEIGHTS.join(', ')}), ` +
      `${kb(bytes)} de woff2 → ${kb(fs.statSync(OUT).size)} embebido`
  );
})().catch(e => {
  console.error('Falló la descarga de fuentes:', e.message);
  process.exit(1);
});
