// @ts-check
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  site: "https://leporc-projects.github.io",
  // Con un dominio personalizado se actualiza `site` y se retira `base`.
  base: "/pagina-fisica",
});
