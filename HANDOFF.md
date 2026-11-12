# HANDOFF · Firma Digital

Estado del trabajo de diseño (rama `design/disenojg`, integrada en `main` por avance rápido y publicada en GitHub Pages el 2026-11-12).

## Dónde estamos

Rediseño completo de la pantalla única con la dirección «papel de seguridad con línea de firma»: tinta azul-negra de bolígrafo (`#2c4072`) sobre papel secante rosado (`#f8ebeb`), Public Sans autoalojada, botón con cuerpo, anillo de foco doble, `select` «Formato» dibujado con respaldo nativo, línea de firma con «X» como guía (fuera del `<canvas>`), estado visible («Vacía», «Firma lista»), sello al iniciar la descarga y cargador que traza la línea. Todo sale de los tokens de `src/styles.css`.

La lógica de trazado y de exportación no se tocó. En `signature-canvas.component.ts` solo se añadieron `formato`, `ultimaDescarga` y `descargar()`. `download.service.ts`, `app.component.ts` y `main.ts` están intactos.

## Cómo verificar

- `npm run build` y `npm test`. Las pruebas (corregidas en el primer commit) pasan con Chrome sin ventana. Karma necesita un lanzador con `--no-sandbox --disable-gpu` en este equipo; sin él, `ChromeHeadless` no llega a capturarse. Ejemplo de `karma.conf.cjs` fuera del repo, pasado con `npx ng test --watch=false --karma-config=<ruta>`: `frameworks: ['jasmine', '@angular-devkit/build-angular']`, `customLaunchers: { CH: { base: 'ChromeHeadless', flags: ['--no-sandbox', '--disable-gpu'] } }`, `browsers: ['CH']`.
- Salida exportada: a 1440×900 el PNG y el SVG son equivalentes a los de `main` (800×450, fondo transparente, tinta `#000000`, grosor 2). A 390 px el lienzo pasa de 274×183 a 324×213 y a 768 px de 604×381 a 686×430, a propósito (la hoja gana ancho en móvil). Tinta, grosor y fondo no cambian.
- Hay que mantener el contrato de DOM del lienzo: `.canvas-wrapper` es el padre directo del `<canvas>`, con `padding-inline: 16px` exactos, `max-width: 832px` y sin borde, y el canvas conserva `width: 100%; height: auto; touch-action: none`. `setupCanvas()` mide el padre y resta 32, así que cambiar eso cambia lo que se exporta.
- `index.html` lleva un script de una línea que lanza `resize` cuando cargan las fuentes: el lienzo mide su posición una sola vez al iniciar y, sin ese aviso, el cambio de fuente desplaza el trazo unos 21 px en 390 px.

## Cómo se publica

GitHub Pages sirve la rama `gh-pages` (raíz) en https://juangaitand.github.io/obtener_firma_digital/. No hay script: se construye con `npx ng build --base-href /obtener_firma_digital/` y el contenido de `dist/obtener-firma-digital/browser/` se copia a la raíz de `gh-pages` (conservando su `.gitignore`), en un commit propio.

## Revisión independiente (2026-11-12)

Veredicto: apto para publicar, sin bloqueantes. Build, pruebas, salida exportada, teclado, movimiento reducido y los tres navegadores pasan. Hallazgos que quedan abiertos:

- **P1, de origen: el trazo sale desplazado si la página se movió antes de firmar.** El lienzo mide su posición solo al cargar; tras hacer scroll o con zoom al 200 %, la tinta sale corrida lo que se movió la página. Ya ocurría en `main`; el rediseño lo reduce en portátiles porque ahí ya no hay scroll. El arreglo es de una línea en la lógica de trazado y haría innecesario el script de `index.html`.
- **P2:** entre unos 600 y 700 px de ancho, el texto del selector «Formato» se parte en dos líneas y el control queda más alto que los botones.
- **P2:** en escritorio, Tab va Formato → Descargar → Limpiar, pero Limpiar se ve a la izquierda.
- **P3:** a 390 px el nombre de archivo se corta por el guion; si se descarga en SVG y luego se cambia a PNG, el sello dice «SVG» y el aviso «.png».

## Qué queda pendiente

- **Firefox de escritorio no dibuja con ratón** (ya ocurría antes del rediseño): `getCoordinates()` usa `e instanceof TouchEvent` y `TouchEvent` no existe ahí (`ReferenceError`). Es zona prohibida en este encargo; el arreglo es una línea (`'touches' in e`). Con táctil, y en Chromium y WebKit, funciona.
- Escala por `devicePixelRatio` y reajuste del lienzo al rotar (los dos tocan `setupCanvas`).
- Favicon propio (sigue el de Angular).
- Lector de pantalla real, Safari e iOS reales y tacto real no se probaron; zoom al 200 % y `forced-colors` solo emulados.
- Los tres archivos de documentación del estándar (`AGENTS.md`, `CLAUDE.md`, `wigi.json`) no existen; no se crearon.

## Preguntas abiertas para Juan

1. ¿Se quita el cargador artificial de 800 ms? (Se rediseñó y respeta movimiento reducido, pero sigue ahí. Recomendado: quitarlo.)
2. ¿Se añade la alternativa de escribir el nombre y generar la firma? (Función nueva; no se incluyó.)
3. ¿Se puede afirmar en pantalla que la firma no sale del navegador? (El código lo cumple, pero es una afirmación de privacidad nueva; no se añadió.)
4. ¿Se corrigen los dos fallos de origen del trazado (Firefox de escritorio en `getCoordinates()` y el desplazamiento tras hacer scroll)? Son una línea cada uno.
