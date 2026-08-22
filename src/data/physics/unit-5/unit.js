import { ROUTE_IDS } from "../../../i18n/routes.js";

const unitRoute = "/fisica-basica-1/unidades/unidad-5";
export const UNIT_5 = Object.freeze({
  number:5, slug:"unidad-5", title:"Momento lineal y sistemas de partículas", shortTitle:"Unidad 5", chapters:"Capítulo 8", status:"review", priority:"core",
  routeId:ROUTE_IDS.COURSE_UNIT_5, route:unitRoute, practiceRouteId:ROUTE_IDS.COURSE_UNIT_5_PRACTICE, practiceRoute:"/fisica-basica-1/ejercicios/unidad-5", bonusRoute:null,
  description:"Momento lineal, impulso, colisiones, centro de masa y flujo de momento como herramientas para analizar sistemas de partículas y propulsión.",
  sourceScope:{stable:"Programa oficial 0302270 de Física Básica I",semester:"Programa clase a clase de Física Básica I 2026-2"},
  topics:Object.freeze([
    {order:1,slug:"momento-lineal",title:"Momento lineal",shortTitle:"Momento lineal",route:`${unitRoute}/momento-lineal`,routeId:ROUTE_IDS.COURSE_UNIT_5_TOPIC_MOMENTUM,priority:"core",summary:"Cantidad de movimiento vectorial, componentes y relación con la energía cinética."},
    {order:2,slug:"impulso",title:"Impulso y cambio de momento",shortTitle:"Impulso",route:`${unitRoute}/impulso`,routeId:ROUTE_IDS.COURSE_UNIT_5_TOPIC_IMPULSE,priority:"core",summary:"Fuerza acumulada en el tiempo, área con signo y cambio de momento."},
    {order:3,slug:"conservacion-momento",title:"Conservación del momento lineal",shortTitle:"Conservación",route:`${unitRoute}/conservacion-momento`,routeId:ROUTE_IDS.COURSE_UNIT_5_TOPIC_MOMENTUM_CONSERVATION,priority:"core",summary:"Frontera del sistema, impulso externo y retroceso."},
    {order:4,slug:"colisiones",title:"Colisiones en una y dos dimensiones",shortTitle:"Colisiones",route:`${unitRoute}/colisiones`,routeId:ROUTE_IDS.COURSE_UNIT_5_TOPIC_COLLISIONS,priority:"core",summary:"Choques elásticos e inelásticos y conservación por componentes."},
    {order:5,slug:"centro-masa",title:"Centro de masa y movimiento del sistema",shortTitle:"Centro de masa",route:`${unitRoute}/centro-masa`,routeId:ROUTE_IDS.COURSE_UNIT_5_TOPIC_CENTER_OF_MASS,priority:"core",summary:"Promedio ponderado, momento total y respuesta a fuerzas externas."},
    {order:6,slug:"masa-variable",title:"Sistemas de masa variable",shortTitle:"Masa variable",route:`${unitRoute}/masa-variable`,routeId:ROUTE_IDS.COURSE_UNIT_5_TOPIC_VARIABLE_MASS,priority:"core",summary:"Fronteras abiertas y transporte de momento por flujos de masa."},
    {order:7,slug:"propulsion-cohete",title:"Propulsión de cohetes",shortTitle:"Propulsión",route:`${unitRoute}/propulsion-cohete`,routeId:ROUTE_IDS.COURSE_UNIT_5_TOPIC_ROCKET_PROPULSION,priority:"core",summary:"Empuje por expulsión de masa y ecuación ideal del cohete."},
  ]),
});
export const getUnit5Topic=(slug)=>UNIT_5.topics.find((topic)=>topic.slug===slug)??null;
