# HANDOFF · Firma Digital

Estado del trabajo. La segunda ronda (rama `design/ronda-2`) está en `main` y publicada en GitHub Pages desde el 2026-11-12. La tercera (rama `design/ronda-3`, sobre `main` = `ca7fadc`) añade «Copiar como PNG», la licencia OFL en el repo y un favicon que se lee en pestañas oscuras; está sin publicar a la espera de la revisión.

## Dónde estamos

Pantalla única con la dirección «papel secante con línea de firma»: tinta azul-negra de bolígrafo (`#2c4072`) sobre papel secante rosado (`#f8ebeb`), Public Sans autoalojada, botón con cuerpo, anillo de foco doble, `select` «Formato» dibujado con respaldo nativo, línea de firma con «X» como guía (fuera del `<canvas>`), estado visible («Vacía», «Firma lista») y sello al iniciar la descarga.

La ronda 2 añadió, por decisión de Juan:

- **Se puede firmar con ratón en Firefox de escritorio.** `getCoordinates()` usaba `e instanceof TouchEvent` (inexistente allí). Ahora ratón, tacto y lápiz van por Pointer Events (`pointerdown/move/up/cancel/leave` + `setPointerCapture`), con `touch-action: none` en el lienzo.
- **La tinta cae bajo el puntero aunque la página se haya movido.** El lienzo se mide con `getBoundingClientRect()` en cada evento; se quitaron el `rect` cacheado, el listener de `resize` y el script de `index.html` que relanzaba `resize` al cargar la fuente.
- **Sin cargador de 800 ms.** La app aparece directamente (fundido de 200 ms). Se borró `loader/` y `isLoading`.
- **Escribir el nombre como alternativa a dibujar.** Control segmentado «Dibujar» / «Escribir» (radios nativos). En «Escribir», un campo «Nombre para tu firma» pinta el nombre con **La Belle Aurore** (OFL-1.1, `@fontsource`, autoalojada en `fonts/`) sobre la misma línea de firma, con vista previa en vivo.
- **Aviso de privacidad**: «Tu firma no sale de tu navegador: se genera y se descarga en tu dispositivo.» Verificado registrando las peticiones de un recorrido completo (ver abajo).
- Pendientes del revisor: el selector «Formato» ya no parte su texto (pie apilado hasta 768 px; con la ronda 3, hasta 880 px), Tab sigue el orden visual (Formato → Limpiar → Descargar), sello y aviso dicen el mismo formato (cambiar el formato retira el sello), el nombre de archivo no se corta.
- Favicon propio: la «X» con la línea de firma, papel sobre tinta (`public/favicon.svg`, `favicon-32.png`, `apple-touch-icon.png`). Se quitó el de Angular.
- Navegadores objetivo declarados en `.browserslistrc` y respaldos de CSS (abajo).

La ronda 3 añadió, a petición de Juan:

- **Botón «Copiar como PNG»** entre «Limpiar» y «Descargar», en los dos modos (secundario con cuerpo, icono de copiar y texto). Copia **la misma imagen que descarga «Descargar PNG»** (mismo lienzo, mismo tamaño, transparente, tinta `#000000`) sin importar el formato elegido en «Formato». Sin firma queda deshabilitado, como «Descargar».
  - `DownloadService.copiarPNG()` llama a `navigator.clipboard.write([new ClipboardItem({ 'image/png': promesaDelBlob })])` **de forma síncrona dentro del clic**, con la promesa del blob (de `canvas.toBlob`) dentro del `ClipboardItem`. Es lo que exigen Safari e iOS: no hay ningún `await` entre el gesto y `write`. El modo escribir arma su lienzo temporal también de forma síncrona. Una prueba lo vigila (`write` ya tiene que haber sido llamado al volver de `click()`, y el valor tiene que ser una `Promise`); se comprobó que falla si se difiere la llamada.
  - **Detección** (`copiaDisponible()`, una vez al crear el componente): contexto seguro, `navigator.clipboard.write`, `ClipboardItem` y `ClipboardItem.supports('image/png') !== false`. Si falla cualquiera, **el botón no se pinta**. Los navegadores sin `supports()` (Safari 13.1–17.3) lo muestran si tienen el resto.
  - **Aviso**: una región `aria-live="polite"` siempre presente en la línea bajo la hoja («Firma copiada como imagen PNG», o «No se pudo copiar la imagen. Usa Descargar PNG.»; con SVG elegido: «…Elige PNG en «Formato» y usa Descargar.»). Además el icono del botón pasa a un check (el nombre accesible no cambia). Copia, sello de descarga y aviso de descarga **no conviven**: la acción más reciente retira a las demás (también al cambiar de modo, escribir, limpiar o cambiar el formato).
  - Maqueta: a < 600 px, «Limpiar» y «Copiar» comparten fila y «Descargar» ocupa la suya a todo el ancho; de 600 a 879 px los tres van en una fila bajo el selector, pegados a la derecha; desde **880 px** (antes 768) el selector y los tres botones comparten fila. Para que quepa a 1440, la opción del selector pasa de «PNG · fondo transparente» a **«PNG · transparente»** (el valor sigue siendo `png`). Orden de Tab = orden visual: Formato → Limpiar → Copiar → Descargar.
- **Licencia OFL** de La Belle Aurore en `public/fonts/LICENSE-la-belle-aurore.txt` (copiada de `@fontsource/la-belle-aurore`, copyright de Kimberly Geswein). Se publica en `fonts/LICENSE-la-belle-aurore.txt` junto a la fuente; se quitó del `angular.json` la entrada que copiaba `LICENSE` desde `node_modules` (ya no hace falta, y la ruta publicada cambia de `fonts/LICENSE` a `fonts/LICENSE-la-belle-aurore.txt`).
- **Favicon**: la baldosa de tinta lleva un filete de papel (`#f8ebeb`, 2 de 32 unidades) que la separa de una pestaña oscura y de la claridad de una clara; la «X» y la línea conservan su geometría y colores. `favicon.svg` y `favicon-32.png` regenerados. El `apple-touch-icon.png` **no cambia**: es un cuadrado a sangre sin borde y iOS lo recorta solo, así que no tiene el problema.
- El comentario del CSS sobre el orden del pie estaba sobre `.signature-canvas--oculto`; ahora está sobre `.hoja__pie`.

## Cómo funciona la firma escrita

- `src/app/services/text-signature.service.ts` descarga **de forma diferida** `opentype.js` (chunk aparte, ~245 kB, ~57 kB comprimido) y la fuente `fonts/la-belle-aurore-latin-400-normal.woff` la primera vez que se elige «Escribir». No hay petición a ningún otro origen.
- El nombre se convierte en **trazados** (`Path` de opentype). Esos mismos trazados alimentan la vista previa (un `<svg>` con el mismo `viewBox` que el lienzo, por encima de él), el **PNG** (lienzo temporal del mismo tamaño que el de dibujo, transparente, relleno `#000000`) y el **SVG** (un `<path fill="#000000">`). Como el SVG lleva `<path>` y no `<text>`, se ve igual en cualquier visor sin la fuente instalada. No se usa `document.fonts.load` ni `fillText`: la fuente solo se lee como binario, así que el PNG no depende del motor de texto del navegador.
- Un nombre largo se reduce para caber (margen del 6 %) y, si queda muy pequeño, pasa a dos líneas por el espacio más cercano a la mitad. Caben tildes y ñ (todos los acentos del español están en el subconjunto `latin`); los caracteres sin glifo se descartan. Campo con `maxlength="60"`.
- **Limpiar** borra lo del modo activo; lo del otro modo se conserva. Cambiar de modo no pierde ni lo dibujado ni lo escrito. «Descargar» se habilita con la firma del modo activo; sin nombre no descarga.
- El SVG y la vista previa se escriben con `datosDeTrazado()` (en el mismo servicio), que serializa los comandos del trazado con dos decimales. **No uses `Path.toPathData(2)`**: en opentype.js 2.0.0 devuelve `NaN` con valores como `269.00000000000006` y la firma sale cortada (le pasaba a 13 de 30 nombres comunes a 1440 px). Lo cubre la prueba «el SVG de un nombre no se corta».
- Se usa `opentype.js/dist/opentype.mjs` (la entrada `browser` del paquete apunta al UMD y Angular avisaba de que no es ESM) y `src/opentype.d.ts` declara solo lo que se usa (la 2.0.0 no trae tipos).

## Cómo verificar

- `npm run build` (sin avisos: cada hoja de componente queda por debajo de 4 kB; lo compartido está en `src/styles.css`) y `npm test`. Karma (29 pruebas: las 12 anteriores y 17 de copiar) necesita un lanzador con `--no-sandbox --disable-gpu` en este equipo: `karma.conf.cjs` fuera del repo con `frameworks: ['jasmine', '@angular-devkit/build-angular']`, `customLaunchers: { CH: { base: 'ChromeHeadless', flags: ['--no-sandbox', '--disable-gpu'] } }`, `browsers: ['CH']`, pasado con `npx ng test --watch=false --karma-config=<ruta>`. Las pruebas cubren: trazo con ratón, tacto y lápiz sin `TouchEvent`, coordenadas con scroll, botón secundario ignorado, aviso/sello, y el modo escribir (sin nombre no descarga, PNG transparente y negro del tamaño del lienzo, SVG con trazados, nombre largo dentro del lienzo, limpiar y cambio de modo).
- Salida del modo dibujo: a 1440×900 el PNG y el SVG son equivalentes a los de `main` (800×450, fondo transparente, tinta `#000000`, grosor 2; la geometría del SVG varía menos de 1 px). A 390 px el lienzo es 324×213 y a 768 px 686×430 (la hoja gana ancho en móvil; es de la ronda 1).
- Contrato de DOM del lienzo (sigue vigente): `.canvas-wrapper` es el padre directo del `<canvas>`, con `padding-inline: 16px` exactos, `max-width: 832px` y sin borde; el canvas conserva `width: 100%; height: auto; touch-action: none`. `setupCanvas()` mide el padre y resta 32, así que cambiar eso cambia lo que se exporta. Con la medición en cada evento ya no importa que el contenedor se mueva, solo su ancho.
- La vista previa del modo escribir y el campo de nombre van sobre el lienzo (`position: absolute` dentro de `.canvas-wrapper`), con el `<canvas>` en `visibility: hidden` para que la altura no cambie.

## Cómo se publica

GitHub Pages sirve la rama `gh-pages` (raíz) en https://juangaitand.github.io/obtener_firma_digital/. No hay script: se construye con `npx ng build --base-href /obtener_firma_digital/` y el contenido de `dist/obtener-firma-digital/browser/` se copia a la raíz de `gh-pages` (conservando su `.gitignore`), en un commit propio. **En Git Bash de Windows, prefija `MSYS_NO_PATHCONV=1`**: si no, la ruta `/obtener_firma_digital/` se convierte en `C:/Program Files/Git/obtener_firma_digital/` y el `<base href>` sale roto. Las rutas de iconos, fuentes y del chunk de opentype son relativas a la base. Tras publicar, comprobar que `fonts/la-belle-aurore-latin-400-normal.woff`, `favicon.svg` y los chunks responden 200 bajo esa ruta.

## Copiar como PNG por navegador

Probado en navegador real con Playwright, a 390 y 1440 px, sobre este código (también bajo `/obtener_firma_digital/`):

| Motor | Botón | Resultado |
|---|---|---|
| Chromium 156 | Se muestra (`supports('image/png')` es `true`) | Copia y **lee de vuelta** el portapapeles (`clipboard-read`/`clipboard-write` concedidos): la imagen copiada es **idéntica píxel a píxel** (0 distintos) a la que descarga «Descargar PNG», en los dos modos y los dos anchos (324×213 y 800×450, esquina transparente, 0 píxeles opacos que no sean negros). |
| Firefox 159 | Se muestra | Copia y también permite leer de vuelta: 0 píxeles distintos, mismos casos. |
| WebKit 27.2 (Playwright) | **Oculto**: `ClipboardItem.supports('image/png')` devuelve `false` | Sin errores. Forzando `supports()` a `true` solo para la prueba, `clipboard.write` se rechaza con `NotAllowedError` y la app muestra «No se pudo copiar la imagen. Usa Descargar PNG.» Es el comportamiento que se espera: ese motor no puede escribir imágenes en el portapapeles y no le ofrecemos el botón. |

**Safari e iOS reales: no verificados** (aquí no hay Safari ni iPhone; el WebKit de Playwright no es Safari y no tiene el portapapeles de macOS/iOS). El código cumple lo que Safari exige: `write` se llama de forma síncrona dentro del clic y el blob entra como **promesa** dentro del `ClipboardItem`, de modo que Safari no pierde la activación del usuario mientras `toBlob` termina. Lo que no se sabe es si `supports('image/png')` devuelve `true` en el Safari de Juan (si devolviera `false`, el botón no aparece y no hay otro efecto). Pruébalo en el iPhone con el enlace publicado: toca «Copiar como PNG» y pega en Notas o Mensajes.

## Navegadores objetivo

`.browserslistrc` (lo leen el build de Angular y Autoprefixer): Safari ≥ 14, iOS ≥ 14, Chrome ≥ 90, Edge ≥ 90, Firefox ≥ 90, Samsung Internet ≥ 15. Angular 19 admite cualquier navegador con módulos ES, así que el suelo real lo pone Tailwind 3 (Safari 14); no hubo que migrar nada. Samsung no tiene objetivo de esbuild: solo cuenta para los prefijos de Autoprefixer.

Respaldos añadidos o comprobados:

- `:focus-visible` (Safari < 15.4): el `:focus { outline: none }` y el anillo propio solo se aplican dentro de `@supports selector(:focus-visible)`; sin él se conserva el anillo del navegador y el control de modos saca el suyo con `:focus`. Con `:has()` el anillo rodea todo el control de modos; sin `:has()` rodea el segmento.
- `:hover` solo bajo `@media (hover: hover)` (botones, `select`, segmentos): en táctil no queda un estado pegado.
- `--sombra-hoja` sin OKLCH (hex y `rgb(r g b / a)`): con `oklch()` Safari < 15.4 descartaba toda la sombra. El OKLCH de cada token sigue en su comentario.
- `100vh` con `100dvh` encima en la altura mínima de la página.
- `appearance: base-select` ya iba dentro de `@supports`; el `select` nativo dibujado funciona sin él. `-webkit-appearance: none` también en el campo de texto (iOS).
- `forced-colors: active`: el anillo usa `Highlight`; el segmento activo, `Highlight`/`HighlightText`; el lienzo, su guía, la vista previa y el campo de nombre se quedan sobre papel claro (`forced-color-adjust: none` en `.canvas-wrapper`) porque la tinta es negra y con el fondo oscuro del sistema no se vería.
- Pointer Events (Safari ≥ 13, Chrome ≥ 55, Firefox ≥ 59): sin `TouchEvent`, sin `mouse*` ni `touch*`. `setPointerCapture` va en `try/catch`.
- Autoprefixer expande `inset` donde hace falta. Sin `color-mix`, `@container`, `:has` imprescindible, `structuredClone`, `Array.at`, `inert` ni `ResizeObserver`. `navigator.clipboard` solo se usa para el botón «Copiar como PNG», con detección y el botón oculto si no hay soporte. Public Sans variable declara `font-display: swap` y tiene `system-ui` de respaldo.
- Safari 14.0 (no 14.1) no tiene `gap` en flex: iconos y texto de los botones quedarían pegados, pero todo se lee y funciona.

## Lo no probado de verdad

- **Copiar como PNG en Safari e iOS** (ver arriba) y, en general:
- Safari e iOS **reales**, Samsung Internet y navegadores viejos (Safari 14, Chrome 90, Firefox 90): Playwright solo trae versiones recientes (Chromium 156, Firefox 159, WebKit 27.2). Los respaldos están escritos pero no ejercitados en motores antiguos.
- Tacto real: en Chromium se emuló con eventos táctiles de CDP (DPR 3, dibuja y no hace scroll). Firefox no emula `isMobile` y WebKit de Playwright no dibuja con tacto: ahí solo se comprobó el tamaño de los objetivos.
- Lector de pantalla real (NVDA, VoiceOver): el modo escribir está pensado para teclado y lector (radios nativos con `fieldset` y `legend`, campo con etiqueta, estado en `role="status"`) pero no se escuchó.
- Zoom real del navegador (se emuló con 640×400 a DPR 2) y modo de alto contraste real de Windows (solo la emulación de `forced-colors`).
- Cómo se ve la firma escrita con alfabetos no latinos o con más de 60 caracteres (el campo los corta). Sí se comprobó con «José Ñandú Íñiguez» y con un nombre de 60 caracteres en Chromium, Firefox y WebKit.
- La escala por `devicePixelRatio` del lienzo y su reajuste al rotar siguen sin hacerse (tocan `setupCanvas`).
- Un fallo real de escritura en Chromium y Firefox (permiso denegado, ventana sin foco): no se pudo provocar en Playwright. El camino de fallo se ejercitó en Karma (promesa rechazada y `write` que lanza) y en WebKit real (rechazo `NotAllowedError`).
- `AGENTS.md`, `CLAUDE.md` y `wigi.json` no existen; no se crearon.

## Preguntas de Juan, ya resueltas

1. ¿Se quita el cargador de 800 ms? **Sí, quitado.**
2. ¿Se añade escribir el nombre y generar la firma? **Sí.** Una sola tipografía (La Belle Aurore); ofrecer dos o tres estilos en un `select` quedó fuera para no complicar.
3. ¿Se puede afirmar que la firma no sale del navegador? **Sí**, con la frase de arriba. Se comprobó que en un recorrido completo (cargar, dibujar, escribir, descargar PNG y SVG en los dos modos) todas las peticiones van al propio origen: HTML, JS, CSS, Public Sans, favicon, el chunk de opentype y la fuente de la firma. Ni CDN de fuentes ni analítica.
4. ¿Se corrigen los dos fallos de origen del trazado? **Sí**, los dos.

## Revisión independiente de la ronda 2 (2026-11-12)

Veredicto: apto con correcciones, ya aplicadas (los tres P3 abiertos —licencia, favicon y comentario— se cerraron en la ronda 3): la firma escrita salía cortada en la vista previa y el SVG por el redondeo de opentype.js (bloqueante; ahora 0 de 30 nombres fallan y el SVG tiene la misma tinta que el PNG en Chromium, Firefox y WebKit) y faltaba un espacio entre el nombre de archivo y el aviso de descarga. Pasan build, Karma (12 de 12), la línea base del dibujo, el trazado (desvío de 0,2 px o menos tras scroll y zoom en los tres motores; Firefox de escritorio firma con ratón) y la privacidad (solo peticiones al propio origen). P3 abiertos: la licencia OFL de La Belle Aurore se publica junto a la fuente pero no está copiada en el repo; el favicon se distingue poco sobre pestaña oscura; un comentario fuera de sitio en el CSS del componente. `npm audit` da avisos de Angular que ya estaban en `main`; ninguno viene de las dependencias nuevas.

## Qué queda pendiente

- Escala por `devicePixelRatio` y reajuste del lienzo al rotar (los dos tocan `setupCanvas`).
- Ofrecer más estilos de firma escrita, si Juan los quiere.
- Los tres archivos del estándar (`AGENTS.md`, `CLAUDE.md`, `wigi.json`).
