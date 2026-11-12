# HANDOFF · Firma Digital

Estado del trabajo de diseño (rama `design/disenojg`, sin push ni PR).

## Dónde estamos

Rediseño completo de la pantalla única con la dirección «papel de seguridad con línea de firma»: tinta azul-negra de bolígrafo (`#2c4072`) sobre papel secante rosado (`#f8ebeb`), Public Sans autoalojada, botón con cuerpo, anillo de foco doble, `select` «Formato» dibujado con respaldo nativo, línea de firma con «X» como guía (fuera del `<canvas>`), estado visible («Vacía», «Firma lista»), sello al iniciar la descarga y cargador que traza la línea. Todo sale de los tokens de `src/styles.css`.

La lógica de trazado y de exportación no se tocó. En `signature-canvas.component.ts` solo se añadieron `formato`, `ultimaDescarga` y `descargar()`. `download.service.ts`, `app.component.ts` y `main.ts` están intactos.

## Cómo verificar

- `npm run build` y `npm test`. Las pruebas (corregidas en el primer commit) pasan con Chrome sin ventana. Karma necesita un lanzador con `--no-sandbox --disable-gpu` en este equipo; sin él, `ChromeHeadless` no llega a capturarse. Ejemplo de `karma.conf.cjs` fuera del repo, pasado con `npx ng test --watch=false --karma-config=<ruta>`: `frameworks: ['jasmine', '@angular-devkit/build-angular']`, `customLaunchers: { CH: { base: 'ChromeHeadless', flags: ['--no-sandbox', '--disable-gpu'] } }`, `browsers: ['CH']`.
- Salida exportada: a 1440×900 el PNG y el SVG son equivalentes a los de `main` (800×450, fondo transparente, tinta `#000000`, grosor 2). A 390 px el lienzo pasa de 274×183 a 324×213 y a 768 px de 604×381 a 686×430, a propósito (la hoja gana ancho en móvil). Tinta, grosor y fondo no cambian.
- Hay que mantener el contrato de DOM del lienzo: `.canvas-wrapper` es el padre directo del `<canvas>`, con `padding-inline: 16px` exactos, `max-width: 832px` y sin borde, y el canvas conserva `width: 100%; height: auto; touch-action: none`. `setupCanvas()` mide el padre y resta 32, así que cambiar eso cambia lo que se exporta.
- `index.html` lleva un script de una línea que lanza `resize` cuando cargan las fuentes: el lienzo mide su posición una sola vez al iniciar y, sin ese aviso, el cambio de fuente desplaza el trazo unos 21 px en 390 px.

## Qué queda pendiente

- **Firefox de escritorio no dibuja con ratón** (ya ocurría antes del rediseño): `getCoordinates()` usa `e instanceof TouchEvent` y `TouchEvent` no existe ahí (`ReferenceError`). Es zona prohibida en este encargo; el arreglo es una línea (`'touches' in e`). Con táctil, y en Chromium y WebKit, funciona.
- Escala por `devicePixelRatio` y reajuste del lienzo al rotar (los dos tocan `setupCanvas`).
- Favicon propio (sigue el de Angular).
- Lector de pantalla real, zoom al 200 %, `forced-colors` y Safari real no se probaron.
- Los tres archivos de documentación del estándar (`AGENTS.md`, `CLAUDE.md`, `wigi.json`) no existen; no se crearon.

## Preguntas abiertas para Juan

1. ¿Se quita el cargador artificial de 800 ms? (Se rediseñó y respeta movimiento reducido, pero sigue ahí. Recomendado: quitarlo.)
2. ¿Se añade la alternativa de escribir el nombre y generar la firma? (Función nueva; no se incluyó.)
3. ¿Se puede afirmar en pantalla que la firma no sale del navegador? (El código lo cumple, pero es una afirmación de privacidad nueva; no se añadió.)
4. ¿Se corrige el fallo de Firefox de escritorio en `getCoordinates()`?
