// @ts-check
import { defineConfig } from "astro/config";
import {
  DEFAULT_LOCALE,
  SUPPORTED_LOCALES,
} from "./src/i18n/config.js";

// https://astro.build/config
export default defineConfig({
  site: "https://aulafisica.com",
  i18n: {
    locales: SUPPORTED_LOCALES,
    defaultLocale: DEFAULT_LOCALE,
    routing: {
      prefixDefaultLocale: false,
    },
  },
  vite: {
    build: {
      rolldownOptions: {
        output: {
          codeSplitting: {
            groups: [
              {
                name: "p5",
                test: /node_modules\/p5\//,
              },
            ],
          },
        },
      },
    },
  },
});
