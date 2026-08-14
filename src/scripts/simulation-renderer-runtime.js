import { getSimulationModelById } from "../data/simulation-models.js";
import { getSimulationRendererById } from "../data/simulation-renderers.js";
import { localizeSimulationExperience } from "../data/simulation-experiences.js";
import {
  normalizeSimulationExperience,
  validateSimulationExperience,
} from "../utils/simulation-experience.js";

const rendererClients = Object.freeze({
  "svg-kinematics-1d": Object.freeze({
    selector: "[data-kinematics-simulation]",
    load: () => import("./kinematics-1d.js").then((module) => ({
      initialize: module.initializeKinematicsSimulation,
      destroy: module.destroyKinematicsSimulation,
    })),
  }),
  "p5-projectile-2d": Object.freeze({
    selector: "[data-projectile-simulation]",
    load: () => import("./projectile-2d.js").then((module) => ({
      initialize: module.initializeProjectileSimulation,
      destroy: module.destroyProjectileSimulation,
    })),
  }),
  "p5-forces-friction": Object.freeze({
    selector: "[data-forces-friction-simulation]",
    load: () => import("./forces-friction.js").then((module) => ({
      initialize: module.initializeForcesFrictionSimulation,
      destroy: module.destroyForcesFrictionSimulation,
    })),
  }),
  "p5-circular-radial-force": Object.freeze({
    selector: "[data-circular-radial-simulation]",
    load: () => import("./circular-radial-force.js").then((module) => ({
      initialize: module.initializeCircularRadialSimulation,
      destroy: module.destroyCircularRadialSimulation,
    })),
  }),
});

const mountedRenderers = new WeakMap();

export const getSimulationRendererClient = (rendererId) =>
  rendererClients[rendererId];

export const getSimulationRendererClientIds = () => Object.keys(rendererClients);

export const mountSimulationExperienceRenderer = async (root, suppliedExperience) => {
  if (!(root instanceof HTMLElement)) return null;
  const experience = normalizeSimulationExperience(suppliedExperience);
  const validation = validateSimulationExperience(experience);
  const model = getSimulationModelById(experience.modelId);
  const renderer = getSimulationRendererById(model?.rendererId);
  const client = getSimulationRendererClient(renderer?.id);
  if (!validation.valid || !model || !renderer || renderer.modelId !== model.id || !client) {
    throw new TypeError(validation.errors.join(" ") || "Renderer no registrado.");
  }

  const existing = mountedRenderers.get(root);
  if (existing?.rendererId === renderer.id) {
    const locale = existing.rendererRoot.dataset.locale === "en" ? "en" : "es";
    await existing.api.updateExperience(localizeSimulationExperience(experience, locale));
    return existing.api;
  }
  if (existing) {
    await existing.api.destroy();
    mountedRenderers.delete(root);
  }

  const slots = [...root.querySelectorAll("[data-renderer-slot]")];
  const activeSlot = slots.find((slot) => slot.dataset.rendererSlot === renderer.id);
  if (!(activeSlot instanceof HTMLElement)) {
    throw new TypeError(`No existe un slot para ${renderer.id}.`);
  }
  slots.forEach((slot) => { slot.hidden = slot !== activeSlot; });
  const rendererRoot = activeSlot.querySelector(client.selector);
  if (!(rendererRoot instanceof HTMLElement)) {
    throw new TypeError(`El slot ${renderer.id} no contiene su interfaz.`);
  }

  const implementation = await client.load();
  const locale = rendererRoot.dataset.locale === "en" ? "en" : "es";
  const api = await implementation.initialize(
    rendererRoot,
    localizeSimulationExperience(experience, locale)
  );
  if (!api) throw new Error(`No fue posible montar ${renderer.id}.`);
  root.dataset.activeRenderer = renderer.id;
  mountedRenderers.set(root, { rendererId: renderer.id, api, rendererRoot });
  return api;
};

export const destroySimulationExperienceRenderer = async (root) => {
  const existing = mountedRenderers.get(root);
  if (!existing) return;
  await existing.api.destroy();
  mountedRenderers.delete(root);
  root.removeAttribute("data-active-renderer");
};
