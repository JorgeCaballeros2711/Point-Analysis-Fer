// Genera el entregable de un solo archivo a partir de la carpeta de desarrollo.
// Uso: node build.js
//
// No usa dependencias ni bundler: la app no necesita transpilación, solo que los
// módulos de src/js/ se concatenen en el mismo orden en que index.html los carga.
// Se fusionan en UN único <script>, que es la forma que tenía el archivo original,
// de modo que el resultado es estructuralmente equivalente.

const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const OUT_DIR = path.join(ROOT, 'dist');
const OUT_FILE = path.join(OUT_DIR, 'AnalisisDePuntos.html');

const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');

// Cada <script src="..."> local se sustituye EN SU SITIO por su contenido. Es
// deliberado no tratarlos como un tramo contiguo: los de vendor/ están en el <head>
// y los de src/js/ al final del <body>, así que reemplazar "del primero al último"
// se llevaría por delante todo el documento intermedio.
const LOCAL_TAG = /([ \t]*)<script src="(?!https?:\/\/)([^"]+)"><\/script>/g;

const sources = [];

const output = html.replace(LOCAL_TAG, (_match, indent, src) => {
  const file = path.join(ROOT, src);
  if (!fs.existsSync(file)) {
    console.error(`Falta el archivo referenciado por index.html: ${src}`);
    process.exit(1);
  }
  const code = fs.readFileSync(file, 'utf8').replace(/\r?\n$/, '');
  // Un "</script" literal dentro del JS cerraría la etiqueta antes de tiempo y
  // rompería el archivo generado en silencio.
  if (code.includes('</script')) {
    console.error(`${src} contiene "</script" y rompería el HTML al inlinearse.`);
    process.exit(1);
  }
  sources.push(src);
  return `${indent}<!-- ${src} -->\n<script>\n${code}\n</script>`;
});

if (!sources.length) {
  console.error('No se encontró ningún <script src="..."> local en index.html.');
  process.exit(1);
}

// El entregable no debe quedar con ninguna referencia externa: si queda una, un
// analista sin internet se encuentra con una herramienta a medias.
const remote = [...output.matchAll(/(?:src|href)="(https?:\/\/[^"]+)"/g)].map(r => r[1]);
const imports = [...output.matchAll(/@import\s+url\(['"]?(https?:\/\/[^'")]+)/g)].map(r => r[1]);
const external = [...new Set([...remote, ...imports])];

fs.mkdirSync(OUT_DIR, { recursive: true });
fs.writeFileSync(OUT_FILE, output, 'utf8');

const kb = (Buffer.byteLength(output, 'utf8') / 1024).toFixed(1);
console.log(
  `${path.relative(ROOT, OUT_FILE)}  —  ${kb} KB  (${sources.length} archivos inlineados)`
);

if (external.length) {
  console.warn('\nADVERTENCIA — el entregable depende de la red:');
  external.forEach(u => console.warn('  ' + u));
  process.exitCode = 1;
} else {
  console.log('Sin dependencias externas: funciona sin internet.');
}
