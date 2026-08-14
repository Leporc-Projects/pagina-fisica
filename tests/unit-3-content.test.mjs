import assert from "node:assert/strict";
import test from "node:test";
import { UNIT_3 } from "../src/data/physics/unit-3/unit.js";
import { UNIT_3_CONTENT } from "../src/data/physics/unit-3/content.js";
import { UNIT_3_FORMULAS } from "../src/data/physics/unit-3/formulas.js";
import { UNIT_3_VISUALIZATIONS } from "../src/data/physics/unit-3/visualizations.js";
import { UNIT_3_COMMON_ERRORS } from "../src/data/physics/unit-3/common-errors.js";
import { UNIT_3_WORKED_EXAMPLES } from "../src/data/physics/unit-3/examples.js";
import { getLocalizedUnit3ErrorsByTopics, getLocalizedUnit3Formula, getLocalizedUnit3Visualization, getLocalizedUnit3WorkedExample, getUnit3TopicRouteId, localizeUnit3, localizeUnit3Content } from "../src/data/physics/unit-3/localize.js";
import { getLocalizedPath } from "../src/i18n/routes.js";

const sections=()=>Object.values(UNIT_3_CONTENT).flatMap(({sections})=>sections);
const withoutAria=(mathml)=>mathml.replace(/ aria-label="[^"]*"/,"");
const replaceStrings=(value)=>typeof value==="string"?"<text>":Array.isArray(value)?value.map(replaceStrings):value&&typeof value==="object"?Object.fromEntries(Object.entries(value).map(([key,child])=>[key,replaceStrings(child)])):value;
const finite=(value,seen=new WeakSet())=>{if(typeof value==="number")return Number.isFinite(value);if(!value||typeof value!=="object")return true;if(seen.has(value))return true;seen.add(value);return Object.values(value).every((child)=>finite(child,seen));};

test("Unidad 3 conserva los ocho temas y las 27 secciones del paquete",()=>{
  assert.equal(UNIT_3.number,3); assert.equal(UNIT_3.bonusRoute,null);
  assert.deepEqual(UNIT_3.topics.map(({order})=>order),[1,2,3,4,5,6,7,8]);
  assert.deepEqual(UNIT_3.topics.map(({slug})=>slug),["equilibrio","dinamica-particulas","fuerza-normal","tension","friccion","resistencia-fluidos","dinamica-circular","fuerzas-fundamentales"]);
  assert.deepEqual(Object.keys(UNIT_3_CONTENT),UNIT_3.topics.map(({slug})=>slug));
  assert.deepEqual(Object.values(UNIT_3_CONTENT).map(({sections})=>sections.length),[3,4,3,3,4,3,4,3]); assert.equal(sections().length,27);
  assert.ok(UNIT_3.topics.every(({slug,routeId})=>getUnit3TopicRouteId(slug)===routeId));
  for(const locale of ["es","en"]){const unit=localizeUnit3(locale);assert.equal(getLocalizedPath(unit.routeId,locale),unit.route);assert.equal(getLocalizedPath(unit.practiceRouteId,locale),unit.practiceRoute);}
});

test("cada sección desarrolla cuatro capas y el conjunto contiene 18 checks",()=>{
  for(const section of sections())for(const layer of ["essential","understand","deepen","explore"]){assert.ok(Array.isArray(section[layer])&&section[layer].length>0,`${section.id}.${layer}`);assert.ok(section[layer].every((text)=>typeof text==="string"&&text.trim()));}
  assert.equal(sections().reduce((sum,section)=>sum+(section.checks?.length??0),0),18);
});

test("los ocho ejemplos resueltos son estáticos y conservan referencias al localizar",()=>{
  assert.equal(Object.keys(UNIT_3_WORKED_EXAMPLES).length,8);
  for(const [id,source] of Object.entries(UNIT_3_WORKED_EXAMPLES)){const en=getLocalizedUnit3WorkedExample(id,"en");assert.notEqual(en.title,source.title,id);assert.equal(en.steps.length,source.steps.length,id);assert.deepEqual(en.steps.map(({formulaId,visualizationId})=>({formulaId,visualizationId})),source.steps.map(({formulaId,visualizationId})=>({formulaId,visualizationId})),id);assert.equal("interaction" in source||"answer" in source||"feedback" in source,false,id);for(const step of source.steps){if(step.formulaId)assert.ok(UNIT_3_FORMULAS[step.formulaId],`${id}:${step.formulaId}`);if(step.visualizationId)assert.ok(UNIT_3_VISUALIZATIONS[step.visualizationId],`${id}:${step.visualizationId}`);}}
});

test("13 fórmulas y 14 visualizaciones tienen paridad estructural y referencias resolubles",()=>{
  assert.equal(Object.keys(UNIT_3_FORMULAS).length,13);assert.equal(Object.keys(UNIT_3_VISUALIZATIONS).length,14);
  const formulaRefs=sections().flatMap(({formulas=[]})=>formulas);const visualRefs=sections().flatMap(({visualizations=[]})=>visualizations);
  assert.ok(formulaRefs.every((id)=>UNIT_3_FORMULAS[id]));assert.ok(visualRefs.every((id)=>UNIT_3_VISUALIZATIONS[id]));
  for(const [id,source] of Object.entries(UNIT_3_FORMULAS)){const en=getLocalizedUnit3Formula(id,"en");assert.ok(source.mathml);assert.equal(withoutAria(en.mathml),withoutAria(source.mathml),id);assert.deepEqual(en.variables.map(({symbol,unit})=>({symbol,unit})),source.variables.map(({symbol,unit})=>({symbol,unit})),id);if(["normal-incline-special","static-friction-range","kinetic-friction-model","linear-drag","quadratic-drag","terminal-speed-linear","terminal-speed-quadratic","flat-curve-limit","frictionless-bank"].includes(id))assert.ok(source.conditions.length,id);}
  for(const [id,source] of Object.entries(UNIT_3_VISUALIZATIONS)){const en=getLocalizedUnit3Visualization(id,"en");assert.ok(en.props.title&&en.props.description,id);assert.deepEqual(replaceStrings(en),replaceStrings(source),id);assert.equal(finite(source),true,id);}
});

test("20 errores y todo el contenido inglés conservan estructura sin fallback",()=>{
  assert.equal(UNIT_3_COMMON_ERRORS.length,20);assert.equal(new Set(UNIT_3_COMMON_ERRORS.map(({id})=>id)).size,20);assert.ok(UNIT_3_COMMON_ERRORS.every((error)=>UNIT_3_CONTENT[error.topic]?.sections.some(({id})=>id===error.subtopic),error=>error.id));
  const localizedErrors=getLocalizedUnit3ErrorsByTopics(UNIT_3.topics.map(({slug})=>slug),"en");assert.ok(localizedErrors.every((error,index)=>error.description!==UNIT_3_COMMON_ERRORS[index].description&&error.feedback));
  const en=localizeUnit3Content("en");for(const [slug,source] of Object.entries(UNIT_3_CONTENT)){assert.notEqual(en[slug].introduction,source.introduction,slug);assert.deepEqual(en[slug].sections.map(({id,formulas,visualizations,examples,checks})=>({id,formulas,visualizations,examples,checks:checks?.length??0})),source.sections.map(({id,formulas,visualizations,examples,checks})=>({id,formulas,visualizations,examples,checks:checks?.length??0})));en[slug].sections.forEach((section,index)=>assert.notEqual(section.title,source.sections[index].title,`${slug}.${section.id}`));}
});
