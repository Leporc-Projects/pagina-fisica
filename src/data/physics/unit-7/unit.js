import { ROUTE_IDS } from "../../../i18n/routes.js";

const unitRoute="/fisica-basica-1/unidades/unidad-7";
export const UNIT_7=Object.freeze({
  number:7,slug:"unidad-7",title:"Gravitación y movimiento periódico",shortTitle:"Unidad 7",chapters:"Capítulos 13 y 14",status:"review",priority:"core",
  routeId:ROUTE_IDS.COURSE_UNIT_7,route:unitRoute,practiceRouteId:ROUTE_IDS.COURSE_UNIT_7_PRACTICE,practiceRoute:"/fisica-basica-1/ejercicios/unidad-7",bonusRoute:null,
  description:"Gravitación universal, órbitas, energía y movimiento periódico con sus modelos, aproximaciones y límites.",
  sourceScope:{stable:"Programa oficial 0302270 de Física Básica I",semester:"Programa clase a clase de Física Básica I 2026-2"},
  topics:Object.freeze([
    {order:1,slug:"gravitacion-universal",title:"Gravitación universal",shortTitle:"Gravitación universal",route:`${unitRoute}/gravitacion-universal`,routeId:ROUTE_IDS.COURSE_UNIT_7_TOPIC_UNIVERSAL_GRAVITATION,priority:"core",summary:"Ley de gravitación, acción-reacción, dependencia inversa al cuadrado y superposición vectorial."},
    {order:2,slug:"campo-peso",title:"Campo gravitacional y peso",shortTitle:"Campo y peso",route:`${unitRoute}/campo-peso`,routeId:ROUTE_IDS.COURSE_UNIT_7_TOPIC_FIELD_WEIGHT,priority:"core",summary:"Campo gravitacional, peso local, altura e ingravidez aparente."},
    {order:3,slug:"energia-gravitacional",title:"Energía potencial gravitacional",shortTitle:"Energía gravitacional",route:`${unitRoute}/energia-gravitacional`,routeId:ROUTE_IDS.COURSE_UNIT_7_TOPIC_GRAVITATIONAL_ENERGY,priority:"core",summary:"Referencia en el infinito, signo de U y aproximación local mgh."},
    {order:4,slug:"orbitas-satelites",title:"Órbitas y satélites",shortTitle:"Órbitas y satélites",route:`${unitRoute}/orbitas-satelites`,routeId:ROUTE_IDS.COURSE_UNIT_7_TOPIC_ORBITS_SATELLITES,priority:"core",summary:"Rapidez, periodo, energía circular y rapidez de escape."},
    {order:5,slug:"kepler-limites",title:"Leyes de Kepler y límites del modelo newtoniano",shortTitle:"Kepler y límites",route:`${unitRoute}/kepler-limites`,routeId:ROUTE_IDS.COURSE_UNIT_7_TOPIC_KEPLER_LIMITS,priority:"core",summary:"Órbitas elípticas, leyes de Kepler y contexto relativista de agujeros negros."},
    {order:6,slug:"oscilaciones",title:"Descripción de las oscilaciones",shortTitle:"Oscilaciones",route:`${unitRoute}/oscilaciones`,routeId:ROUTE_IDS.COURSE_UNIT_7_TOPIC_OSCILLATIONS,priority:"core",summary:"Amplitud, periodo, frecuencia, frecuencia angular y fase."},
    {order:7,slug:"movimiento-armonico-simple",title:"Movimiento armónico simple",shortTitle:"Movimiento armónico simple",route:`${unitRoute}/movimiento-armonico-simple`,routeId:ROUTE_IDS.COURSE_UNIT_7_TOPIC_SHM,priority:"core",summary:"Estado del MAS, signos, fase y sistema masa–resorte."},
    {order:8,slug:"energia-oscilador",title:"Energía del oscilador armónico",shortTitle:"Energía del oscilador",route:`${unitRoute}/energia-oscilador`,routeId:ROUTE_IDS.COURSE_UNIT_7_TOPIC_OSCILLATOR_ENERGY,priority:"core",summary:"Intercambio de energía, rapidez y sentido del movimiento."},
    {order:9,slug:"pendulos",title:"Péndulo simple y péndulo físico",shortTitle:"Péndulos",route:`${unitRoute}/pendulos`,routeId:ROUTE_IDS.COURSE_UNIT_7_TOPIC_PENDULUMS,priority:"core",summary:"Aproximación de ángulo pequeño y dependencia respecto al pivote."},
    {order:10,slug:"amortiguamiento-resonancia",title:"Amortiguamiento, forzamiento y resonancia",shortTitle:"Amortiguamiento y resonancia",route:`${unitRoute}/amortiguamiento-resonancia`,routeId:ROUTE_IDS.COURSE_UNIT_7_TOPIC_DAMPING_RESONANCE,priority:"core",summary:"Regímenes amortiguados, respuesta forzada y resonancia finita."},
  ]),
});
export const getUnit7Topic=(slug)=>UNIT_7.topics.find((topic)=>topic.slug===slug)??null;
