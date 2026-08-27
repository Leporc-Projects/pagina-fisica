# Aula Física — Auditoría independiente integral — Informe local

Fecha: 2026-08-27  
Baseline: `7033a21b36a39d157c243a9dacc2964ffe29c1d7`  
Rama local: `audit/full-site-independent-verification`  
Publicación: prohibida en esta fase

Este informe separa estrictamente la cobertura estructural y automatizada de la
revisión semántica manual. Un conteo presente en el manifiesto no se presenta como
una certificación académica ítem por ítem.

## 1. Git

- Punto de partida: `main == origin/main == 7033a21b36a39d157c243a9dacc2964ffe29c1d7` y árbol limpio.
- Rama de trabajo: `audit/full-site-independent-verification`.
- La rama no se publicó, no se abrió PR y no se integró en `main`.
- Los commits locales se detallan al cierre del informe y el SHA final se obtiene
  de la rama después de registrar este documento.
- `main` y `origin/main` permanecen en el baseline.

## 2. Inventory

El manifiesto se reconstruyó desde el registro académico y sus adaptadores, sin
descubrimiento implícito por carpetas. Para cada unidad comprobó identidad única,
contrapartes ES/EN, referencias de fórmulas, visualizaciones, ejemplos y errores,
alcanzabilidad de ejercicios y presencia de familias en el registro de runtime.

| Unidad | Topics | Sections | Formulas | Visuals | Checks | Errors | Examples | Exercises | Families | Mini quizzes | Routes ES+EN |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| U1 | 7 | 24 | 25 | 26 | 7 | 36 | 0 | 55 | 15 | 4 | 18 |
| U2 | 7 | 24 | 10 | 12 | 16 | 16 | 0 | 41 | 8 | 0 | 18 |
| U3 | 8 | 27 | 13 | 14 | 18 | 20 | 8 | 36 | 10 | 0 | 20 |
| U4 | 8 | 32 | 12 | 12 | 16 | 16 | 8 | 40 | 10 | 0 | 20 |
| U5 | 7 | 28 | 12 | 12 | 16 | 16 | 8 | 40 | 10 | 0 | 18 |
| U6 | 10 | 40 | 14 | 14 | 20 | 20 | 10 | 40 | 12 | 0 | 24 |
| U7 | 10 | 40 | 14 | 14 | 20 | 20 | 10 | 40 | 12 | 0 | 24 |
| **Total** | **57** | **215** | **100** | **104** | **113** | **144** | **44** | **292** | **77** | **4** | **142** |

Producto derivado: 4 simulaciones públicas, 5 escenarios de poleas y 5 modelos
internos, de los cuales `circular-radial-force` permanece archivado y sin ruta
pública. No aparecieron IDs duplicados, referencias rotas, contenido académico
inalcanzable ni contrapartes localizadas ausentes en las categorías enumeradas.

## 3. Method

La auditoría combinó:

- un manifiesto ejecutable transversal, separado de los conteos documentados;
- oráculos algebraicos escritos directamente en el test, sin obtener los valores
  esperados del solver probado;
- identidades de Newton y restricciones geométricas para los cinco sistemas de
  poleas;
- suite preexistente de contratos académicos, rutas, i18n, diagramas y familias;
- compilación estática de todas las páginas;
- QA real en browser con viewports de 1280×800 y 390×844, transiciones de tema y
  manipulación de simulaciones;
- búsqueda estática de superficie de red, persistencia, telemetría y exposición de
  herramientas;
- medición de chunks construidos y comportamiento de history cerrado/abierto.

Automated significa que una aserción reproducible recorrió el corpus o el caso.
Manual significa que la interfaz o el contenido fue inspeccionado directamente. Un
ítem que solo pasó schema, referencia o paridad se marca como pendiente de revisión
semántica; no se promueve a `VERIFIED`.

## 4. Simulations

### Cinemática 1D

El oracle independiente comprobó cuatro conjuntos adversariales con `x0` y `v0`
positivos y negativos, `a=0`, aceleración positiva y cambio de sentido. En `t=0`,
`T/3` y `T` se compararon `x=x0+v0t+at²/2`, `v=v0+at` y `a` constante. El modelo
coincidió. La página ES/EN no mostró overflow ni errores de consola en desktop y
móvil.

### Proyectil 2D

Cinco casos cubrieron lanzamiento casi degenerado, horizontal desde altura,
vertical, ángulo bajo y ángulo alto con distintas gravedades. El tiempo de vuelo se
obtuvo de la raíz física positiva y las posiciones/velocidades se calcularon por
separado en tres instantes. Modelo y oracle coincidieron; el impacto quedó en suelo.
La escena y sus rutas localizadas pasaron el QA de viewport.

### Fuerzas/fricción

Cuatro casos independientes cubrieron `muS=muK=0`, plano horizontal con fuerza
oblicua, velocidad inicial negativa y positiva, y distintos ángulos de plano/fuerza.
El oracle derivó `N=mg cos(beta)-F sin(alpha)`, el drive paralelo, el umbral estático,
la fricción cinética y el régimen de contacto. En browser se fijaron
`F=60 N`, `alpha=20°` y `beta=30°`; las lecturas `N=62.09 N`,
`f=-18.44 N` y fuerza neta nula coincidieron con el cálculo separado. La suite de
geometría protege ortonormalidad, descomposición, perpendicularidad de la normal y
dirección de fricción. No se encontró una regresión del error histórico.

### Laboratorio de poleas

Los cinco escenarios se ejercitaron en browser. Las identidades independientes
usaron las ecuaciones de Newton y las restricciones `a1=a2`, `a1+a2=0`,
`2aL+aC=0`, `3aL+aC=0` y las restricciones del Atwood doble junto con
`TC=2TA`. Los residuos observados fueron cero. En móvil se inspeccionaron además el
Atwood doble y el polipasto 3:1: cuerda, anclajes, poleas, aparejos y masas resultaron
conectados y sin recorte evidente.

La gráfica se dejó cerrada, se ejecutó durante 2.44 s, se pausó y luego se abrió:
el path había acumulado history y el tiempo/estado no cambió al abrir, cerrar ni
cambiar de tema. La transición dark→light→dark→light preservó exactamente escenario,
tiempo e history. La coincidencia del marcador actual queda cubierta por la suite de
charts; no se declara una segunda medición manual del marcador porque el primer
selector usado en browser no correspondía a su atributo real.

No hubo findings físicos o de runtime demostrables en las cuatro simulaciones.

## 5. Theory

El manifiesto recorrió 215/215 secciones, verificó sus cuatro capas obligatorias,
identidad de topic/section, referencias y paridad de estructura ES/EN. Se revisaron
los contratos y una muestra transversal orientada a riesgo, incluidos vectores,
fuerzas, energía, momentum, rotación, oscilaciones y gravitación.

No se realizó en esta pasada una lectura semántica humana, afirmación por afirmación,
de las 215 secciones en ambos idiomas. Por tanto, el resultado es **215/215 con
cobertura estructural** y **0/215 con nueva certificación semántica exhaustiva**. No
se encontraron contradicciones en la muestra, pero el resto queda `MANUAL-REVIEW`.

## 6. Formulas

El manifiesto resolvió 100/100 IDs de fórmula en ES/EN y la suite verificó contratos
MathML, nombres accesibles, metadata dimensional y referencias cruzadas. Las pruebas
académicas existentes ejercitan invariantes físicos por unidad.

No se volvió a derivar cada una de las 100 ecuaciones desde primeros principios en
esta pasada. El conteo certificado es 100/100 estructural; 0/100 recibió una nueva
derivación manual individual completa. Signo, dominio y supuestos de los cuatro
modelos de simulación sí se revisaron con oráculos separados.

## 7. Worked examples

Hay 44/44 ejemplos localizables y alcanzables, con contrapartes ES/EN. Ninguno fue
recalculado de forma individual y completa desde el enunciado durante esta pasada
(0/44). Los tests existentes no se reutilizan como prueba de una recalculación
independiente nueva. Los 44 quedan `MANUAL-REVIEW`; no se detectó ni corrigió un
resultado erróneo en esta categoría.

## 8. Fixed exercises

El corpus contiene 292/292 ejercicios: 186 numéricos/multivalue y 106 conceptuales.
La auditoría automatizada comprobó IDs globales, topics/subtopics alcanzables,
referencias de common errors y que la respuesta evaluada no deriva entre ES y EN.

No se recalcularon desde cero los 186 numéricos ni se hizo el análisis distractor por
distractor de los 106 conceptuales. Recuento de esta pasada: recalculados
independientemente 0/186; revisión conceptual exhaustiva 0/106; ambiguos demostrados
0; respuestas erróneas demostradas 0. Todos los demás quedan `MANUAL-REVIEW`.

## 9. Families

Las 77/77 familias están registradas y alcanzables. La suite completa genera al menos
100 semillas deterministas por familia y locale: 15 400 instancias ES/EN, además de
casos de borde e invariantes específicos ya protegidos por unidad. Se verifican
parámetros, respuesta, tolerancia y unidad compartidos entre locales.

La nueva prueba de esta rama no duplica los solvers de las 77 familias; añadió
oráculos separados solo para los modelos físicos transversales de las cuatro
simulaciones. Por ello se acredita la matriz de semillas y las properties existentes,
pero no una nueva derivación manual independiente de cada solver de familia.

## 10. Checks/common errors

El manifiesto contó 113 concept checks y 144 common errors, con identidad y paridad
localizada. La suite comprueba su esquema, referencias y asociación a contenido.
Esta pasada no realizó una lectura humana individual de las 257 entradas, por lo que
no puede certificar unicidad semántica de cada respuesta/distractor ni la precisión
de cada corrección. Ambigüedades o errores demostrados: 0. Pendientes de revisión
semántica: 113 checks y 144 common errors.

## 11. Mini quizzes

Se confirmaron 4 actividades de U1, IDs/slugs únicos, grading y contratos local-only
mediante la suite, rutas ES/EN reversibles y redirects legacy. La UI publicada usa
“Mini quices/Mini quizzes”; las futuras actividades siguen sin páginas falsas. No se
reactivó el producto futuro Bonos ni ninguna herramienta docente oculta.

## 12. Cross-unit physics

Los registros y pruebas mantienen las conexiones de vectores, movimiento circular,
gravedad local/universal, energía lineal/rotacional/orbital, momentum lineal/angular,
resorte/SHM, fricción y fronteras de sistema. Los contratos distinguen aproximaciones
como aceleración constante, cuerdas/poleas ideales, campo uniforme, rodadura sin
deslizamiento, ángulo pequeño y masa de prueba.

Esta fue una comprobación transversal de referencias, invariantes y muestras de alto
riesgo, no una nueva lectura comparada línea por línea de U1–U7. No se encontró una
contradicción demostrable; la certificación semántica total depende de cerrar los
ítems `MANUAL-REVIEW` de las secciones 5–10.

## 13. Visuals

- Inventario: 104 visualizaciones académicas.
- Cobertura automatizada: 104/104 registradas; 416 configuraciones geométricas y
  localizadas en el validador visual, además de tests específicos de vectores,
  diagramas y clipping.
- Inspección manual: 3 escenas dinámicas de alto riesgo vistas directamente
  (poleas general, Atwood doble/polipasto 3:1 móvil y fuerzas oblicuas), además de la
  composición responsive de las cuatro páginas de simulación. Esta cifra no se
  confunde con 104 visualizaciones académicas inspeccionadas una por una.
- No se observó overflow, objetos flotantes, desconexiones o texto cortado en la
  muestra. Las 104 visualizaciones no recibieron inspección visual manual individual
  en ambos locales/viewports y quedan como límite declarado.

## 14. Routes/i18n/accessibility

El build genera 204 páginas. El registro académico aporta 142 rutas ES/EN y la suite
global comprueba el resto del producto. No existe namespace `/es/`; inglés vive bajo
`/en/`. Se verifican contrapartes reversibles, canonical y hreflang en los contratos.

En browser se observaron 30 rutas ES en desktop y las mismas 30 en móvil, más 10
rutas EN en móvil: 70 observaciones sobre 40 rutas únicas. Todas tuvieron un H1,
`lang` correcto, cero overflow horizontal y cero imágenes rotas; las 10 EN mostraron
canonical y alternates `es`, `en` y `x-default`. La navegación solo expuso las cuatro
simulaciones públicas. Disclosures, cambio de escenario y controles de simulación
respondieron sin error.

No se ejecutó Safari ni Firefox. Tampoco se inspeccionaron manualmente las 204 páginas
en cada viewport, ni el viewport tablet o un desktop >=1440; el desktop utilizado fue
1280×800. Esos puntos permanecen como cobertura humana pendiente.

## 15. Efficiency

| Medición | Coste observado | Decisión | Evidencia |
| --- | ---: | --- | --- |
| Chunk p5 | 1 181 193 B | No change | Solo lo importan entradas Canvas específicas |
| Chunk physics | 862 864 B | No change | Compartido por páginas académicas/simulación, warning >500 kB conocido |
| Kinematics entry | 13 187 B | No change | Entrada aislada; no importa p5 |
| Projectile entry | 14 249 B | No change | p5 se carga dinámicamente en su entrada |
| Forces entry | 14 978 B | No change | p5 queda aislado a la página Canvas |
| Pulley entry | 22 505 B | No change | p5 queda aislado a la página Canvas |
| Practice entry | 6 501 B | No change | No arrastra el runtime de simulación |

La home no referencia un script de aplicación y las prácticas solo cargan su entrada.
No se encontró duplicación global de p5. Al correr con la gráfica de poleas cerrada,
history avanzó correctamente; al abrir no hubo reconstrucción de estado ni salto
temporal. El entorno de browser no expuso perfiles CPU/transfer fiables, por lo que no
se afirma una medición de frame time. El warning de chunks se reporta sin abrir un
refactor especulativo.

## 16. Privacy/product non-regression

- Participa sigue `local`, `anonymous` y `submissionTarget: null`; no hay POST ni
  persistencia de respuestas.
- No aparecen analytics ni telemetría. `localStorage` se limita al tema visual.
- No se detectaron secretos en las comprobaciones del repositorio.
- Solo las teacher tools con `published: true` tienen superficie pública.
- Hay exactamente cuatro simulaciones públicas; circular sigue archivada.
- Hay cuatro mini quices en U1 y ninguna página falsa de Bonos futuros.

## 17. Findings table

| ID | Severity | Surface | Evidence / expected / actual / oracle | Classification | Estado |
| --- | --- | --- | --- | --- | --- |
| DOC-01 | DOC | `README.md` | Afirmaba que p5 solo era cargado por proyectil; los imports construidos muestran otros renderers Canvas | AUTO-FIX | Corregido |
| DOC-02 | DOC | `README.md` | Describía cuatro sistemas de poleas y omitía 2:1, 3:1 y el inventario real de cinco escenarios | AUTO-FIX | Corregido |
| DOC-03 | DOC | `docs/CONTENT_GUIDE.md` | Contrato de Participa y schemas exportables anterior a scope global/course y versiones actuales | AUTO-FIX | Corregido |
| DOC-04 | DOC | `docs/CMS_ROADMAP.md` | Registraba simulation packs 1.0.0 cuando el contrato actual es 2.0.0 | AUTO-FIX | Corregido |
| PERF-01 | PERFORMANCE | build chunks | p5 y physics superan 500 kB, pero están aislados por entrada y no se midió regresión de runtime | REPORT-ONLY | Sin cambio |
| SOURCE-01 | SOURCE-DISCREPANCY | fuentes académicas | El plan 2026-2, programa oficial, bibliografía y solucionarios no estaban disponibles en el workspace | REPORT-ONLY | Limitación declarada |
| AUDIT-01 | BLOCKER | certificación integral | No se completó revisión semántica/recalculo manual ítem por ítem ni inspección visual individual de todo el corpus | REPORT-ONLY | Impide verdict A |

No se registraron findings `MAJOR`, `MINOR`, `VISUAL-PHYSICS`, `UX` o `FUTURE`.

## 18. Tests / validation

Se añadió `tests/full-site-independent-audit.test.mjs` con cuatro pruebas de alto
valor: manifiesto académico, manifiesto de producto, mini quices/rutas y oráculos
algebraicos de las cuatro simulaciones públicas. La ejecución focalizada pasó 4/4.

La validación final de la rama incluye, en orden, `npm test`, `npm run test:charts`,
`npm run validate`, `npm run verify`, `npm run build`, `npm run stats:loc`,
`git diff --check` y `npm audit`. El cierre debe registrar 466 tests, 9 tests de
charts, 204 páginas, diff-check limpio y 0 vulnerabilidades; si cualquiera difiere,
este documento no autoriza sustituir el valor real ni emitir verdict A.

Baseline LOC:

| Category | Baseline |
| --- | ---: |
| Application | 51 121 |
| Tooling | 2 848 |
| Tests | 7 129 |
| CODE TOTAL | 61 098 |
| Editorial data | 472 |
| Documentation | 3 069 |
| RELEVANT TOTAL | 64 639 |

Los valores finales y deltas se reportan después de crear los commits locales.

## 19. Local browser QA

Rutas: home, catálogo del curso, materiales, mini quices, Participa global/course,
7 landings, 7 prácticas, una página académica de alta densidad por unidad y las 4
simulaciones. Viewports: 1280×800 y 390×844; locales: ES/EN. Se ejercitaron los cinco
escenarios de poleas, fuerzas con `beta/alpha` no nulos, gráfica closed-run-open y
transición dark→light→dark→light sin reload.

Consola: 0 warnings y 0 errores en las pestañas auditadas. Limitaciones: Chromium del
browser disponible solamente; sin Safari/Firefox, sin tablet, sin >=1440 y sin una
inspección manual página por página de las 204 rutas.

## 20. Human-decision items

1. Hugo y Papilla deben decidir si encargan una fase adicional dedicada a completar
   la revisión humana ítem por ítem: 215 secciones, 100 fórmulas, 44 ejemplos, 292
   ejercicios, 113 checks, 144 errores frecuentes y 104 visualizaciones.
2. Para una certificación curricular, deben proporcionar el plan clase a clase
   2026-2 y, si corresponde, el programa oficial/bibliografía autorizada. Este repo no
   permite afirmar que esas fuentes fueron contrastadas.
3. El warning de chunks no requiere acción sin una meta y medición de rendimiento
   acordadas; una refactorización de bundling sería una decisión separada.

## 21. Publication status

READY FOR HUMAN QA — NOT PUBLISHED

## 22. Verdict

**B. LOCAL AUDIT NOT PASSED — la implementación no presenta un blocker de producto
demostrado, pero la certificación integral solicitada queda bloqueada por la revisión
manual ítem por ítem y la cobertura visual/browser completa que se detallan en
`AUDIT-01`.**
