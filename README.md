# Point Analysis Fer

Reporte interactivo de análisis de ubicaciones. Se desarrolla en carpeta y se entrega
como un único archivo HTML autocontenido.

## Flujo de trabajo

**Desarrollar:** abrir `index.html` directamente en el navegador (doble clic). No hace
falta servidor, `npm install` ni build — los módulos se cargan con `<script src>`
clásicos, que sí funcionan sobre `file://`. Editar, guardar, recargar.

**Entregar:**

```
node build.js
```

Genera `dist/AnalisisDePuntos.html`: un solo archivo con los módulos, el CSS, SheetJS y la
tipografía inlineados. Ese es el archivo que se comparte. `dist/` está en `.gitignore`.

**Probar:**

```
node tools/smoke-test.js dist/AnalisisDePuntos.html "<un .xlsx real>"
```

Pasa un Excel de verdad por el pipeline completo (leer → construir reporte → exportar) en
un navegador headless **con la red bloqueada**, y verifica que el reporte exportado sale
completo y sin referencias a internet.

## Funciona sin internet

Es un requisito, no un detalle: la herramienta se usa en equipos de analistas, a veces en
redes que bloquean CDNs. SheetJS y la tipografía tienen copia local en [vendor/](vendor/) —
ver [vendor/README.md](vendor/README.md). `build.js` **falla** si el entregable queda con
cualquier `src`, `href` o `@import` apuntando a `http(s)://`.

## Estructura

```
index.html          Esqueleto del DOM + <style id="main-css"> + los <script src>
src/js/             La lógica, en orden de carga (el prefijo numérico ES el orden)
vendor/             SheetJS y la tipografía, con copia local
tools/              Generador de fuentes y prueba de humo
build.js            Genera el entregable de un archivo. Sin dependencias.
dist/               Salida del build (ignorada por git)
```

| Módulo                  | Qué contiene                                                             |
| ----------------------- | ------------------------------------------------------------------------ |
| `01-state.js`           | Estado global, mapas de columnas `PT`/`EG`, accesores `ptGet`/`egGet`    |
| `02-toggles.js`         | `toggleComp`, `toggleOverlap`, `toggleCal`, guardado de rutas            |
| `03-images.js`          | `renderImg`, `renderCompMap`                                             |
| `04-point-state.js`     | `saveCtxState` / `restoreCtxState` (estado por punto)                    |
| `05-session.js`         | `saveSession`, `importSession` (sesión y lectura de reportes exportados) |
| `06-trade-area-logo.js` | Modo trade area, carga del logo                                          |
| `07-import.js`          | Drop zone, lectura de XLSX, `detectSheets`, `buildReport`                |
| `08-switch-point.js`    | `switchPoint`, pestañas de tiempo, contexto IA                           |
| `09-compliance.js`      | Tablas de cumplimiento, NSE, edición por tiempo                          |
| `10-comparables.js`     | `buildComparables` y overrides manuales                                  |
| `11-routes.js`          | Rutas calientes y accesos                                                |
| `12-ui-nav.js`          | Tags, imágenes, navegación, visibilidad de apartados                     |
| `13-helpers.js`         | `getMainCSS`, `pf`, formateadores, `setLoading`                          |
| `14-zoom-map.js`        | Mapa de comparables con zoom/pan                                         |
| `15-calificacion.js`    | Pesos, score, tabla de calificación, gauge, overlap                      |
| `16-hallazgos.js`       | `generateHallazgos`                                                      |
| `17-add-point.js`       | Modal de alta manual de punto                                            |
| `18-export.js`          | `exportStaticHTML` / `buildExport`                                       |

## Formato

El código está formateado con Prettier. La configuración vive en `.prettierrc.json`, así
que el resultado es el mismo en cualquier máquina.

```
npm install     # solo la primera vez, instala Prettier (dependencia de desarrollo)
npm run format  # formatea todo
```

Esto **no** afecta a la app: sigue sin necesitar `npm install` para funcionar. Prettier es
solo una herramienta de desarrollo.

`.prettierignore` excluye `vendor/` (biblioteca minificada y artefacto generado), `dist/` y
el monolito original.

**Los 11 elementos `contenteditable` llevan `<!-- prettier-ignore -->`, y hay que
mantenerlo.** Prettier reindenta el texto interno y hasta lo parte en varias líneas; ese
espacio en blanco entra en el contenido editable, se guarda en `CTX_STORE` y se arrastra al
reporte exportado. Si se añade otro elemento editable, hay que ponerle el comentario.

## Notas para editar

**El orden de carga importa.** Los módulos son scripts clásicos, no ES modules: comparten
el ámbito global y por eso los `onclick` inline del HTML siguen funcionando sin cambios.
Si se agrega un módulo, hay que añadir su `<script src>` a `index.html` — `build.js` lee
las etiquetas de ahí, así que no hay una segunda lista que mantener sincronizada.

**El CSS vive en `<style id="main-css">` dentro de `index.html`, a propósito.** `18-export.js`
necesita el texto del CSS para inyectarlo en el reporte exportado. Si el CSS se mueve a un
`.css` externo con `<link>`, sobre `file://` Chrome/Edge tratan la hoja como origen opaco,
`cssRules` lanza `SecurityError` y el reporte exportado sale sin estilos, sin ningún aviso.
`getMainCSS()` (en `13-helpers.js`) degrada con varios respaldos, pero mantener el CSS
inline es lo que garantiza que el export funcione igual en dev y en el entregable.

## Pendientes conocidos

- `BaseAnalisisdePuntosBueno.html` es el archivo monolítico original. Se conserva solo como
  referencia; ya no se usa ni se construye desde él. Conviene borrarlo para que nadie lo
  edite por error.
- El campo "empresa" de Confidencialidad (`index.html:1997`) llama a `updateConfEmpresa()`,
  que nunca se definió. Lanza un `ReferenceError` al escribir en él. Bug preexistente,
  anterior a la modularización.
