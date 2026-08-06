# Espacio de Física · v0.1

Sitio docente personal de física universitaria. Estático, responsive y preparado para crecer por cursos, recursos, actividades, simulaciones y herramientas docentes.

## Propósito

Centralizar materiales de enseñanza para Física Básica I (y futuros cursos) en un sitio web sencillo, accesible y de carga rápida. Sin bases de datos, sin CMS, sin dependencias de plataformas externas.

## Tecnologías

| Herramienta | Versión | Rol |
|-------------|---------|-----|
| [Astro](https://astro.build/) | ^7 | Framework de sitios estáticos |
| HTML5 semántico | — | Estructura de páginas |
| CSS con variables | — | Diseño y maquetación |
| JavaScript (módulos) | ES2022+ | Interactividad mínima (menú móvil) |
| Node.js | ≥ 22.12.0 | Entorno de desarrollo |

Sin React, Vue, Tailwind, backend ni base de datos.

## Árbol de carpetas

```
pagina-fisica/
├── public/                  # Archivos estáticos servidos en raíz
├── src/
│   ├── components/
│   │   ├── Footer.astro     # Pie de página
│   │   ├── Header.astro     # Cabecera con menú responsive
│   │   ├── NavCard.astro    # Tarjeta de acceso rápido
│   │   ├── SectionHeading.astro  # Encabezado de sección
│   │   └── UnitCard.astro   # Tarjeta de unidad temática
│   ├── data/
│   │   └── site.js          # Datos centralizados del sitio
│   ├── layouts/
│   │   └── BaseLayout.astro # Layout HTML base (head, header, footer)
│   ├── pages/
│   │   ├── index.astro          # Inicio
│   │   ├── fisica-basica-1.astro # Física Básica I
│   │   ├── recursos.astro       # Recursos de aprendizaje
│   │   ├── simulaciones.astro   # Directorio de simulaciones
│   │   ├── actividades.astro    # Ejercicios y cuestionarios
│   │   └── herramientas.astro   # Herramientas docentes
│   └── styles/
│       └── global.css       # Sistema de diseño centralizado
├── astro.config.mjs
├── package.json
└── README.md
```

## Comandos

```bash
# Instalar dependencias
npm install

# Iniciar servidor de desarrollo (http://localhost:4321)
npm run dev

# Construir el sitio para producción
npm run build

# Previsualizar el build de producción
npm run preview
```

## Navegación

| Página | Ruta | Estado |
|--------|------|--------|
| Inicio | `/` | ✅ |
| Física Básica I | `/fisica-basica-1` | ✅ (contenido provisional) |
| Recursos | `/recursos` | ✅ (en construcción) |
| Simulaciones | `/simulaciones` | ✅ (próximamente) |
| Actividades | `/actividades` | ✅ (en construcción) |
| Herramientas docentes | `/herramientas` | ✅ (próximamente) |

## Decisiones de diseño

- **`src/data/site.js`**: fuente única de verdad para nombre del sitio, navegación, unidades y categorías de simulaciones.
- **CSS con variables**: todo el sistema de colores, espaciado y tipografía se define en `:root` dentro de `global.css`.
- **Sin imágenes externas**: el favicon es un SVG inline; no se carga ninguna fuente ni imagen de terceros.
- **Privacidad por diseño**: el sitio no usa cookies, analytics ni servicios externos (salvo los enlaces a recursos en Recursos).

## Roadmap (versiones futuras)

- [ ] Añadir simulaciones con p5.js unidad por unidad
- [ ] Implementar el Consolidador de quices (procesamiento local)
- [ ] Publicar guías de laboratorio en PDF
- [ ] Configurar despliegue en GitHub Pages o Netlify
- [ ] Añadir modo oscuro

---

> Sitio en desarrollo activo. El contenido académico se publicará conforme avance el semestre.
