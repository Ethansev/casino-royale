import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    // Engine, dealer, and AI layers must stay pure TS: render-agnostic and
    // deterministic, so they can move server-side for multiplayer unchanged.
    files: ["src/engine/**", "src/dealer/**", "src/ai/**"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["react", "react-*", "next", "next/*", "react-dom", "react-dom/*"],
              message: "Engine/dealer/ai must not depend on React or Next.",
            },
            {
              group: ["**/components/**", "**/store/**", "**/audio/**", "**/app/**"],
              message: "Engine/dealer/ai must not depend on UI layers.",
            },
          ],
        },
      ],
      "no-restricted-properties": [
        "error",
        {
          object: "Math",
          property: "random",
          message: "Use the injected seeded RNG for determinism.",
        },
        {
          object: "Date",
          property: "now",
          message: "Engine must be deterministic; no clock access.",
        },
      ],
    },
  },
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts"]),
]);

export default eslintConfig;
