# Firma Digital

Aplicación web desarrollada con Angular 19 que permite crear firmas digitales dibujándolas directamente en el navegador. La aplicación es completamente accesible, responsive y no requiere autenticación.

## Características

- Dos modos, en un control segmentado: **Dibujar** (mouse, lápiz o dedo, también en Firefox de escritorio) y **Escribir** (tu nombre con una tipografía de firma manuscrita, La Belle Aurore, sobre la misma línea de firma, con vista previa en vivo; es la alternativa para quien no puede dibujar con puntero y se opera solo con teclado)
- **Copiar como PNG**: copia la firma al portapapeles como imagen (la misma que descarga «Descargar PNG») para pegarla en un documento, un correo o un chat; el botón solo aparece si tu navegador sabe copiar imágenes
- Descarga de firmas en formato PNG (fondo transparente) o SVG (vectorial), a elegir en un selector; en el modo Escribir el SVG lleva el nombre convertido a trazados, así que se ve igual sin la tipografía instalada
- La firma no sale de tu navegador: se genera y se descarga en tu dispositivo (sin analítica ni fuentes de CDN)
- Diseño de «papel secante con línea de firma», accesible y con foco visible
- Responsive (adaptable a móviles, tablets y escritorio)
- Animaciones suaves, sin cargador artificial
- Sin necesidad de login o registro

## Requisitos

- Node.js 18 o superior (probado con Node 24)
- npm 9 o superior

## Instalación

1. Clona o descarga el repositorio
2. Instala las dependencias:

```bash
npm install
```

## Desarrollo

Para iniciar el servidor de desarrollo, ejecuta:

```bash
npm start
```

O alternativamente:

```bash
ng serve
```

Una vez que el servidor esté corriendo, abre tu navegador y navega a `http://localhost:4200/` (para otro puerto: `npx ng serve --port 4201`). La aplicación se recargará automáticamente cuando modifiques los archivos fuente.

## Construcción

Para compilar el proyecto para producción, ejecuta:

```bash
npm run build
```

O:

```bash
ng build
```

Los archivos compilados se guardarán en el directorio `dist/`. La compilación de producción optimiza la aplicación para mejor rendimiento.

## Uso

1. Abre la aplicación en tu navegador
2. Elige cómo firmar en el control «Dibujar» / «Escribir» (se cambia con clic, tacto o las flechas del teclado):
   - **Dibujar**: traza tu firma en el área con el mouse, un lápiz o tu dedo
   - **Escribir**: escribe tu nombre en el campo «Nombre para tu firma» (admite tildes, ñ y nombres largos) y mira cómo queda sobre la línea
3. Una vez que estés satisfecho con tu firma, puedes:
   - Hacer clic en "Limpiar" para borrar lo del modo activo (lo del otro modo se conserva) y empezar de nuevo
   - Elegir el formato en el selector "Formato" (PNG con fondo transparente, o SVG vectorial)
   - Hacer clic en "Copiar como PNG" para copiar la firma como imagen y pegarla donde la necesites (siempre es PNG transparente, sin importar el formato elegido; el botón no aparece si tu navegador no puede copiar imágenes, y entonces se usa "Descargar")
   - Hacer clic en "Descargar" para guardar la firma en el formato elegido

Los archivos descargados se guardarán con un nombre que incluye la fecha y hora: `firma-digital-YYYYMMDD-HHMMSS.png` o `.svg`. El PNG y el SVG de los dos modos tienen el mismo tamaño de lienzo, fondo transparente y tinta `#000000`.

## Navegadores

«Copiar como PNG» funciona en Chrome, Edge y Firefox recientes (verificado con Chromium 156 y Firefox 159 leyendo de vuelta el portapapeles). En Safari e iOS el código sigue lo que exigen (llamada síncrona dentro del clic con el blob como promesa), pero no se pudo verificar en un dispositivo real. Donde el navegador no soporta copiar imágenes, el botón no se muestra.


Objetivo (archivo `.browserslistrc`): Safari e iOS 14 o superior, Chrome y Edge 90 o superior, Firefox 90 o superior y Samsung Internet 15 o superior. Se probó en las versiones recientes de Chromium, Firefox y WebKit; ver `HANDOFF.md` para lo que no se pudo probar.

## Pruebas

```bash
npm test
```

Para correrlas sin abrir ventana (por ejemplo, en CI), Karma necesita Chrome sin interfaz y, en algunos equipos, sin sandbox: usa un lanzador personalizado con `ChromeHeadless` y las banderas `--no-sandbox --disable-gpu`. Ver `HANDOFF.md`.

## Tecnologías

- Angular 19
- TypeScript 5
- Tailwind CSS 3
- Public Sans (autoalojada con `@fontsource-variable/public-sans`)
- La Belle Aurore (tipografía de firma, OFL-1.1, autoalojada con `@fontsource/la-belle-aurore`) y `opentype.js` para convertir el nombre en trazados (se descargan solo al elegir «Escribir»)
- HTML5 Canvas API y Pointer Events

## Estructura del Proyecto

```
src/
├── app/
│   ├── components/
│   │   └── signature-canvas/    # Componente principal: modos dibujar y escribir, estado, descarga
│   ├── services/
│   │   ├── download.service.ts        # Servicio para descargar firmas (PNG y SVG)
│   │   └── text-signature.service.ts  # Carga diferida de la fuente y conversión del nombre a trazados
│   ├── app.component.ts         # Componente raíz
│   └── app.config.ts            # Configuración de la aplicación
├── styles.css                   # Estilos globales con Tailwind
└── index.html
```

## Accesibilidad

La aplicación incluye:
- Etiquetas ARIA para lectores de pantalla y una región de estado («Vacía», «Firma lista») que vale para los dos modos
- Alternativa a dibujar: escribir el nombre, con teclado y lector de pantalla
- Navegación por teclado con anillo de foco doble
- Movimiento reducido respetado (`prefers-reduced-motion`)
- Contraste adecuado (WCAG AA)
- Textos descriptivos

## Licencias de terceros

La tipografía de firma La Belle Aurore (© 2010 Kimberly Geswein) se distribuye bajo la SIL Open Font License 1.1. El texto completo está en [`public/fonts/LICENSE-la-belle-aurore.txt`](public/fonts/LICENSE-la-belle-aurore.txt) y se publica junto a la fuente (`fonts/LICENSE-la-belle-aurore.txt`).

## Licencia

Este proyecto está disponible para uso personal y comercial.
