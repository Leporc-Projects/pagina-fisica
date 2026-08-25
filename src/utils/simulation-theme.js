export const listenForSimulationThemeChange = ({ target, redraw }) => {
  if (!target || typeof target.addEventListener !== "function" ||
      typeof target.removeEventListener !== "function" || typeof redraw !== "function") {
    throw new TypeError("El enlace de tema requiere un EventTarget y una función de redibujado.");
  }

  let active = true;
  const handleThemeChange = () => {
    if (active) redraw();
  };
  target.addEventListener("themechange", handleThemeChange);

  return () => {
    if (!active) return;
    active = false;
    target.removeEventListener("themechange", handleThemeChange);
  };
};
