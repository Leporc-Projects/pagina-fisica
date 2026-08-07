// Resolución central de rutas públicas para instalaciones alojadas bajo un subdirectorio.

/**
 * Anteponer `base` a una ruta interna permite probar el contrato sin depender
 * del entorno de Astro. Las anclas, URL externas y rutas ya resueltas se
 * conservan sin cambios.
 */
export const resolveBasePath = (target, base) => {
  if (!target.startsWith("/") || target.startsWith("//")) {
    return target;
  }

  const normalizedBase =
    !base || base === "/"
      ? ""
      : `/${base.replace(/^\/+|\/+$/g, "")}`;

  if (!normalizedBase) return target;

  const alreadyResolved =
    target === normalizedBase ||
    target.startsWith(`${normalizedBase}/`) ||
    target.startsWith(`${normalizedBase}?`) ||
    target.startsWith(`${normalizedBase}#`);

  if (alreadyResolved) return target;
  return target === "/"
    ? `${normalizedBase}/`
    : `${normalizedBase}${target}`;
};

/**
 * Resuelve rutas internas con el `base` activo de Astro. Los datos mantienen
 * rutas lógicas desde `/`; los componentes llaman esta función al renderizar.
 */
export const withBase = (target) =>
  resolveBasePath(target, import.meta.env.BASE_URL);
