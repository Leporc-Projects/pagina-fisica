// Contrato compartido por el arranque temprano y el selector visual de tema.

export const THEME_STORAGE_KEY = "aula-fisica:theme";

/**
 * Preferencias admitidas por la interfaz. `system` no es un cuarto tema:
 * delega el tema efectivo en prefers-color-scheme.
 */
export const THEME_PREFERENCES = [
  { value: "light", label: "Claro" },
  { value: "dark", label: "Oscuro" },
  { value: "system", label: "Sistema" },
];

/** Colores del navegador que acompañan el fondo efectivo de cada tema. */
export const THEME_COLORS = {
  light: "#f4f2ec",
  dark: "#080b0d",
};
