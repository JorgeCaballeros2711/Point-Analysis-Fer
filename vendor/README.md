# vendor/

Dependencias con copia local. **La app debe funcionar sin internet**: se usa en equipos
de analistas, a veces en redes corporativas que bloquean CDNs o sin conexión. Nada de
aquí debe volver a cargarse desde una URL remota.

| Archivo | Qué es | Origen |
|---|---|---|
| `xlsx.full.min.js` | SheetJS 0.18.5. Lee los `.xlsx`; es la puerta de entrada de la app. | `cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js` |
| `fonts-poppins.js` | Poppins (300/400/600/700/800, subset latin) en base64. **Generado.** | `tools/fetch-fonts.js` |

## Actualizar la tipografía

```
node tools/fetch-fonts.js
```

Requiere internet, solo al cambiar de fuente o de pesos. No editar `fonts-poppins.js`
a mano: se regenera completo.

Emite un `.js` y no un `.css` a propósito. `18-export.js` necesita leer el texto del CSS
para copiarlo al reporte exportado, y un `.css` con `<link>` no sirve: sobre `file://` el
navegador trata la hoja como origen opaco, `cssRules` lanza `SecurityError` y el reporte
saldría sin tipografía. El `.js` inyecta `<style id="fonts-css">`, que `getMainCSS()`
([13-helpers.js](../src/js/13-helpers.js)) sí puede leer.

Solo se embebe el subset `latin` (U+0000–00FF): cubre acentos y ñ del español.
`latin-ext` y `devanagari` se descartan por peso.

## Actualizar SheetJS

Descargar la versión nueva sobre `xlsx.full.min.js` y correr la prueba de humo:

```
node build.js
node tools/smoke-test.js dist/AnalisisDePuntos.html "<un .xlsx real>"
```

## Verificación

`build.js` falla con código de salida distinto de cero si el entregable queda con
cualquier `src`, `href` o `@import` apuntando a `http://` o `https://`. Es la red de
seguridad contra reintroducir una dependencia remota sin darse cuenta.
