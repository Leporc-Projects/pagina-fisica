// @ts-check
import { defineConfig } from "astro/config";

// https://astro.build/config
export default defineConfig({
  site: "https://aulafisica.com",
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
