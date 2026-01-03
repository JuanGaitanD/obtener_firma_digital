# Firma Digital

Aplicación web desarrollada con Angular 19 que permite crear firmas digitales dibujándolas directamente en el navegador. La aplicación es completamente accesible, responsive y no requiere autenticación.

## Características

- Dibujo de firmas con mouse o pantalla táctil
- Descarga de firmas en formato PNG y SVG
- Diseño minimalista y accesible
- Responsive (adaptable a móviles, tablets y escritorio)
- Animaciones suaves
- Sin necesidad de login o registro

## Requisitos

- Node.js 18 o superior
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

Una vez que el servidor esté corriendo, abre tu navegador y navega a `http://localhost:4200/`. La aplicación se recargará automáticamente cuando modifiques los archivos fuente.

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
   - Hacer clic en "Descargar PNG" para guardar la firma como imagen PNG
   - Hacer clic en "Descargar SVG" para guardar la firma como imagen SVG

Los archivos descargados se guardarán con un nombre que incluye la fecha y hora: `firma-digital-YYYYMMDD-HHMMSS.png` o `.svg`

## Tecnologías

- Angular 19
- TypeScript 5
- Tailwind CSS 3
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
- Etiquetas ARIA para lectores de pantalla
- Navegación por teclado
- Contraste adecuado (WCAG AA)
- Textos descriptivos

## Licencia

Este proyecto está disponible para uso personal y comercial.
