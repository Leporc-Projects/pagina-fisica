# Hoja de ruta para un CMS

El repositorio y sus builds estáticos siguen siendo la fuente de verdad. Esta
hoja define requisitos para una migración futura; no describe funciones ya
implementadas.

## Responsabilidades mínimas

Un CMS deberá resolver autenticación real, autorización por recurso, roles,
revisión y publicación explícitas, historial de versiones, registro de
auditoría, recuperación, controles de seguridad, almacenamiento durable,
despliegue y backups verificados. También deberá distinguir una fecha editorial
de una publicación programada: cualquier cambio público en GitHub Pages requiere
un build y despliegue.

El CMS sustituirá las fuentes detrás de consultas como
`getPublishedNotices()`, `getGlobalNotices()`, `getCourseNotices(courseId)`,
`getVideos*()` y `getMiniQuizzes*()`. Las páginas públicas no deben conocer si el
origen es JSON, Git, una API o una base de datos. El registro canónico de cursos
y el contrato de ámbito global/curso seguirán siendo fronteras estables, aunque
su almacenamiento cambie.

También podría sustituir el almacenamiento detrás de
`getPublishedSimulationExperiences()`, sin mezclarlo con el registro confiable
de modelos o con los renderers versionados. Un CMS futuro podrá editar la capa
de experiencia pedagógica, pero no debe convertir el modelo físico ni el
renderer en código arbitrario suministrado desde contenido.

## Roles conceptuales

| Rol | Alcance provisional |
| --- | --- |
| `teacher` | Avisos, banco, materiales, revisión y resultados |
| `workshopTeacher` | Avisos, preguntas, materiales y revisión cuando tenga permiso |
| `maintainer` | Infraestructura, configuración y despliegue |

Los roles se asignarán a cuentas verificadas, nunca a nombres personales
hardcodeados. La autorización deberá evaluarse por acción y recurso; ver un
editor no equivale a poder publicar.

## Flujo y seguridad

El flujo base seguirá `draft → review → published → archived`, con autor,
revisor, timestamps e historial inmutables. Se requieren protección contra
inyección, validación compartida servidor/cliente, sesiones seguras, mínimo
privilegio, rate limits donde proceda, trazabilidad de cambios y restauración
ensayada. Tokens, contraseñas y claves vivirán en un gestor de secretos, nunca
en contenido, código cliente ni archivos exportados.

La autorización deberá evaluar también el ámbito del recurso: poder preparar
avisos generales no implica poder publicar en todos los cursos, y un `courseId`
solo será válido si pertenece al registro de cursos disponible para esa cuenta.

Antes de migrar se deberá definir retención, propiedad de datos, exportación,
backups, recuperación ante fallos y el mecanismo que dispara builds. No se
incorporará información estudiantil a un CMS editorial por defecto.

## Autoría avanzada de simulaciones

El constructor visual local, los packs `2.0.0`, los renderers SVG y p5/Canvas 2D
registrados y el importador en revisión sí están implementados. No están
implementados un editor p5/Canvas, un editor de código, una galería de renderers,
ejecución remota ni publicación
desde el navegador. Si una etapa futura admite código docente, necesitará un
sandbox aislado, límites de recursos, política de red, revisión de dependencias,
versionado, auditoría y separación completa del sitio público. Es una frontera
de seguridad distinta, no una ampliación implícita del JSON declarativo.
