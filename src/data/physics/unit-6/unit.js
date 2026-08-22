import { ROUTE_IDS } from "../../../i18n/routes.js";

const unitRoute="/fisica-basica-1/unidades/unidad-6";
export const UNIT_6=Object.freeze({
  number:6,slug:"unidad-6",title:"Rotación y momento angular",shortTitle:"Unidad 6",chapters:"Capítulos 9 y 10",status:"review",priority:"core",
  routeId:ROUTE_IDS.COURSE_UNIT_6,route:unitRoute,practiceRouteId:ROUTE_IDS.COURSE_UNIT_6_PRACTICE,practiceRoute:"/fisica-basica-1/ejercicios/unidad-6",bonusRoute:null,
  description:"Cinemática y dinámica de la rotación, rodadura, torca, energía y momento angular con sus condiciones de validez.",
  sourceScope:{stable:"Programa oficial 0302270 de Física Básica I",semester:"Programa clase a clase de Física Básica I 2026-2"},
  topics:Object.freeze([
    {order:1,slug:"cinematica-angular",title:"Cinemática angular",shortTitle:"Cinemática angular",route:`${unitRoute}/cinematica-angular`,routeId:ROUTE_IDS.COURSE_UNIT_6_TOPIC_ANGULAR_KINEMATICS,priority:"core",summary:"Posición, velocidad y aceleración angulares; rotación con aceleración constante."},
    {order:2,slug:"relaciones-lineal-angular",title:"Relación entre movimiento lineal y angular",shortTitle:"Relaciones lineal–angular",route:`${unitRoute}/relaciones-lineal-angular`,routeId:ROUTE_IDS.COURSE_UNIT_6_TOPIC_LINEAR_ANGULAR,priority:"core",summary:"Arco, rapidez tangencial y aceleraciones tangencial y radial."},
    {order:3,slug:"momento-inercia",title:"Momento de inercia",shortTitle:"Momento de inercia",route:`${unitRoute}/momento-inercia`,routeId:ROUTE_IDS.COURSE_UNIT_6_TOPIC_MOMENT_OF_INERTIA,priority:"core",summary:"Distribución de masa, eje de rotación y teorema de ejes paralelos."},
    {order:4,slug:"energia-rotacional",title:"Energía en la rotación",shortTitle:"Energía rotacional",route:`${unitRoute}/energia-rotacional`,routeId:ROUTE_IDS.COURSE_UNIT_6_TOPIC_ROTATIONAL_ENERGY,priority:"core",summary:"Energía cinética rotacional y composición con la traslación."},
    {order:5,slug:"torca",title:"Torca",shortTitle:"Torca",route:`${unitRoute}/torca`,routeId:ROUTE_IDS.COURSE_UNIT_6_TOPIC_TORQUE,priority:"core",summary:"Producto vectorial, línea de acción y brazo de palanca."},
    {order:6,slug:"dinamica-rotacional",title:"Dinámica rotacional",shortTitle:"Dinámica rotacional",route:`${unitRoute}/dinamica-rotacional`,routeId:ROUTE_IDS.COURSE_UNIT_6_TOPIC_ROTATIONAL_DYNAMICS,priority:"core",summary:"Torca neta y aceleración angular en un eje fijo apropiado."},
    {order:7,slug:"rodadura",title:"Rodadura y ejes móviles",shortTitle:"Rodadura",route:`${unitRoute}/rodadura`,routeId:ROUTE_IDS.COURSE_UNIT_6_TOPIC_ROLLING,priority:"core",summary:"Traslación, rotación y restricción de rodadura sin deslizamiento."},
    {order:8,slug:"trabajo-potencia-rotacion",title:"Trabajo y potencia en rotación",shortTitle:"Trabajo y potencia",route:`${unitRoute}/trabajo-potencia-rotacion`,routeId:ROUTE_IDS.COURSE_UNIT_6_TOPIC_ROTATIONAL_WORK_POWER,priority:"core",summary:"Trabajo de torcas variables, potencia instantánea y energía."},
    {order:9,slug:"momento-angular",title:"Momento angular",shortTitle:"Momento angular",route:`${unitRoute}/momento-angular`,routeId:ROUTE_IDS.COURSE_UNIT_6_TOPIC_ANGULAR_MOMENTUM,priority:"core",summary:"Momento angular de partículas y cuerpos rígidos respecto a un origen o eje."},
    {order:10,slug:"conservacion-precesion",title:"Conservación del momento angular y precesión",shortTitle:"Conservación y precesión",route:`${unitRoute}/conservacion-precesion`,routeId:ROUTE_IDS.COURSE_UNIT_6_TOPIC_CONSERVATION_PRECESSION,priority:"core",summary:"Conservación de L, cambios de inercia y aproximación de precesión lenta."},
  ]),
});
export const getUnit6Topic=(slug)=>UNIT_6.topics.find((topic)=>topic.slug===slug)??null;
