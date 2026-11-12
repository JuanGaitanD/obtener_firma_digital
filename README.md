# Firma Digital

Aplicación web desarrollada con Angular 19 que permite crear firmas digitales dibujándolas directamente en el navegador. La aplicación es completamente accesible, responsive y no requiere autenticación.

## Características

- Dibujo de firmas con mouse o pantalla táctil
- Descarga de firmas en formato PNG (fondo transparente) o SVG (vectorial), a elegir en un selector
- Diseño de «papel de seguridad con línea de firma», accesible y con foco visible
- Responsive (adaptable a móviles, tablets y escritorio)
- Animaciones suaves
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
2. Dibuja tu firma en el área del canvas usando el mouse o tu dedo (en dispositivos táctiles)
3. Una vez que estés satisfecho con tu firma, puedes:
   - Hacer clic en "Limpiar" para borrar y empezar de nuevo
   - Elegir el formato en el selector "Formato" (PNG con fondo transparente, o SVG vectorial)
   - Hacer clic en "Descargar" para guardar la firma en el formato elegido

Los archivos descargados se guardarán con un nombre que incluye la fecha y hora: `firma-digital-YYYYMMDD-HHMMSS.png` o `.svg`

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
- HTML5 Canvas API

## Estructura del Proyecto

```
src/
├── app/
│   ├── components/
│   │   ├── signature-canvas/    # Componente principal del canvas de dibujo
│   │   └── loader/              # Componente de carga
│   ├── services/
│   │   └── download.service.ts  # Servicio para descargar firmas
│   ├── app.component.ts         # Componente raíz
│   └── app.config.ts            # Configuración de la aplicación
├── styles.css                   # Estilos globales con Tailwind
└── index.html
```

## Accesibilidad

La aplicación incluye:
- Etiquetas ARIA para lectores de pantalla y una región de estado («Vacía», «Firma lista»)
- Navegación por teclado con anillo de foco doble
- Movimiento reducido respetado (`prefers-reduced-motion`)
- Contraste adecuado (WCAG AA)
- Textos descriptivos

## Licencia

Este proyecto está disponible para uso personal y comercial.
