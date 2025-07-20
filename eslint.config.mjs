import js from "@eslint/js";
import { FlatCompat } from "@eslint/eslintrc";
// import nextPlugin from "@next/eslint-plugin-next";
// import reactPlugin from "eslint-plugin-react";
// import reactHooksPlugin from "eslint-plugin-react-hooks";
// import tseslint from "@typescript-eslint/eslint-plugin";
// import tsParser from "@typescript-eslint/parser";
import prettierConfig from "eslint-config-prettier";

const compat = new FlatCompat({
  // import.meta.dirname is available after Node.js v20.11.0
  baseDirectory: import.meta.dirname,
  recommendedConfig: js.configs.recommended,
});

const eslintConfig = [
  ...compat.config({
    extends: ["eslint:recommended", "next"],
    ignorePatterns: [
      "**/node_modules/**",
      "**/.pnp",
      "**/.pnp.js",
      "**/.next/**",
      "**/dist/**",
      "**/build/**",
      "**/out/**",
      "**/coverage/**",
      "**/.cache/**",
      "**/.parcel-cache/**",
      "**/.eslintcache",
      "**/.stylelintcache",
      "**/public/**",
      "**/data/**",
      "**/*.d.ts",
      "**/*.esm.js",
      "**/src/components/ui/**", // shadcn/ui components
      "**/src/app/generated/**",
      "**/.env",
      "**/.env.local",
      "**/.env.development.local",
      "**/.env.test.local",
      "**/.env.production.local",
      "**/*.log",
      "**/.vscode/**",
      "**/.DS_Store",
    ],
    plugins: ["@typescript-eslint", "react", "react-hooks"],
    globals: {
      // Browser globals
      window: "readonly",
      document: "readonly",
      console: "readonly",
      fetch: "readonly",
      setInterval: "readonly",
      clearInterval: "readonly",
      setTimeout: "readonly",
      clearTimeout: "readonly",
      Buffer: "readonly",
      // Node.js globals
      process: "readonly",
      NodeJS: "readonly",
      // React
      React: "readonly",
      JSX: "readonly",
    },
    rules: {
      "no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
      "no-console": ["warn", { allow: ["warn", "error"] }],
      "prefer-const": "error",
      "no-var": "error",
      // TypeScript specific rules
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-var-requires": "error",
      "@typescript-eslint/no-non-null-assertion": "warn",

      // React rules
      "react/prop-types": "off", // TypeScript handles this
      "react/react-in-jsx-scope": "off", // Not needed in Next.js
      "react/display-name": "warn",
      "react/jsx-key": "error",
      "react/jsx-no-duplicate-props": "error",
      "react/jsx-no-undef": "error",
      "react/jsx-uses-vars": "error",
      "react/no-children-prop": "error",
      "react/no-danger-with-children": "error",
      "react/no-deprecated": "warn",
      "react/no-direct-mutation-state": "error",
      "react/no-find-dom-node": "error",
      "react/no-is-mounted": "error",
      "react/no-render-return-value": "error",
      "react/no-string-refs": "error",
      "react/no-unescaped-entities": "error",
      "react/no-unknown-property": "error",
      "react/require-render-return": "error",
      "react/self-closing-comp": ["error", { component: true, html: true }],

      // React Hooks rules
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",

      // Custom Next.js rule overrides (if needed)
      "@next/next/no-html-link-for-pages": "off", // Allow HTML links for external pages

      // General code quality rules
      "no-console": ["warn", { allow: ["warn", "error"] }],
      "no-debugger": "error",
      "no-duplicate-imports": "error",
      "no-unused-expressions": "error",
      "prefer-const": "error",
      "no-var": "error",
      "object-shorthand": "error",
      "prefer-template": "error",
      "no-useless-escape": "error",
      "no-redeclare": "error",
    },
  }),
  prettierConfig, // Disable formatting rules (handled by Prettier)
];

export default eslintConfig;

// const config = [
//   // Base JavaScript config
//   js.configs.recommended,

//   // Global ignores
//   {
//     ignores: [
//       "**/node_modules/**",
//       "**/.pnp",
//       "**/.pnp.js",
//       "**/.next/**",
//       "**/dist/**",
//       "**/build/**",
//       "**/out/**",
//       "**/coverage/**",
//       "**/.cache/**",
//       "**/.parcel-cache/**",
//       "**/.eslintcache",
//       "**/.stylelintcache",
//       "**/public/**",
//       "**/data/**",
//       "**/*.d.ts",
//       "**/*.esm.js",
//       "**/src/components/ui/**", // shadcn/ui components
//       "**/src/app/generated/**",
//       "**/.env",
//       "**/.env.local",
//       "**/.env.development.local",
//       "**/.env.test.local",
//       "**/.env.production.local",
//       "**/*.log",
//       "**/.vscode/**",
//       "**/.DS_Store",
//     ],
//   },

//   // Next.js configuration
//   {
//     files: ["**/*.ts", "**/*.tsx", "**/*.js", "**/*.jsx"],
//     plugins: {
//       "@next/next": nextPlugin,
//     },
//     rules: {
//       ...nextPlugin.configs.recommended.rules,
//       ...nextPlugin.configs["core-web-vitals"].rules,
//     },
//   },

//   // TypeScript files configuration
//   {
//     files: ["**/*.ts", "**/*.tsx"],
//     languageOptions: {
//       parser: tsParser,
//       parserOptions: {
//         ecmaVersion: "latest",
//         sourceType: "module",
//         ecmaFeatures: {
//           jsx: true,
//         },
//         project: ["./tsconfig.json"],
//       },
//       globals: {
//         // Browser globals
//         window: "readonly",
//         document: "readonly",
//         console: "readonly",
//         fetch: "readonly",
//         setInterval: "readonly",
//         clearInterval: "readonly",
//         setTimeout: "readonly",
//         clearTimeout: "readonly",
//         Buffer: "readonly",
//         // Node.js globals
//         process: "readonly",
//         NodeJS: "readonly",
//         // React
//         React: "readonly",
//         JSX: "readonly",
//       },
//     },
//     plugins: {
//       "@typescript-eslint": tseslint,
//       react: reactPlugin,
//       "react-hooks": reactHooksPlugin,
//     },
//     rules: {
//       // TypeScript specific rules
//       "@typescript-eslint/no-unused-vars": [
//         "error",
//         {
//           argsIgnorePattern: "^_",
//           varsIgnorePattern: "^_",
//           caughtErrorsIgnorePattern: "^_",
//         },
//       ],
//       "@typescript-eslint/no-explicit-any": "warn",
//       "@typescript-eslint/no-var-requires": "error",
//       "@typescript-eslint/consistent-type-imports": [
//         "error",
//         { prefer: "type-imports", fixStyle: "separate-type-imports" },
//       ],
//       "@typescript-eslint/no-unnecessary-condition": "warn", // Changed to warn
//       "@typescript-eslint/no-non-null-assertion": "warn",

//       // React rules
//       "react/prop-types": "off", // TypeScript handles this
//       "react/react-in-jsx-scope": "off", // Not needed in Next.js
//       "react/display-name": "warn",
//       "react/jsx-key": "error",
//       "react/jsx-no-duplicate-props": "error",
//       "react/jsx-no-undef": "error",
//       "react/jsx-uses-vars": "error",
//       "react/no-children-prop": "error",
//       "react/no-danger-with-children": "error",
//       "react/no-deprecated": "warn",
//       "react/no-direct-mutation-state": "error",
//       "react/no-find-dom-node": "error",
//       "react/no-is-mounted": "error",
//       "react/no-render-return-value": "error",
//       "react/no-string-refs": "error",
//       "react/no-unescaped-entities": "error",
//       "react/no-unknown-property": "error",
//       "react/require-render-return": "error",
//       "react/self-closing-comp": ["error", { component: true, html: true }],

//       // React Hooks rules
//       "react-hooks/rules-of-hooks": "error",
//       "react-hooks/exhaustive-deps": "warn",

//       // Custom Next.js rule overrides (if needed)
//       "@next/next/no-html-link-for-pages": "off", // Allow HTML links for external pages

//       // General code quality rules
//       "no-console": ["warn", { allow: ["warn", "error"] }],
//       "no-debugger": "error",
//       "no-duplicate-imports": "error",
//       "no-unused-expressions": "error",
//       "prefer-const": "error",
//       "no-var": "error",
//       "object-shorthand": "error",
//       "prefer-template": "error",
//       "no-useless-escape": "error",
//       "no-redeclare": "error",
//     },
//     settings: {
//       react: {
//         version: "detect",
//       },
//       next: {
//         rootDir: "./",
//       },
//     },
//   },

//   // JavaScript files configuration
//   {
//     files: ["**/*.js", "**/*.mjs"],
//     languageOptions: {
//       ecmaVersion: "latest",
//       sourceType: "module",
//       globals: {
//         // Browser globals
//         window: "readonly",
//         document: "readonly",
//         console: "readonly",
//         fetch: "readonly",
//         setInterval: "readonly",
//         clearInterval: "readonly",
//         setTimeout: "readonly",
//         clearTimeout: "readonly",
//         // Node.js globals
//         process: "readonly",
//         NodeJS: "readonly",
//       },
//     },
//     rules: {
//       "no-unused-vars": [
//         "error",
//         {
//           argsIgnorePattern: "^_",
//           varsIgnorePattern: "^_",
//           caughtErrorsIgnorePattern: "^_",
//         },
//       ],
//       "no-console": ["warn", { allow: ["warn", "error"] }],
//       "prefer-const": "error",
//       "no-var": "error",
//     },
//   },

//   // Configuration files (more relaxed rules)
//   {
//     files: [
//       "**/*.config.{js,mjs,ts}",
//       "**/tailwind.config.{js,ts}",
//       "**/next.config.{js,mjs}",
//       "**/postcss.config.{js,mjs}",
//       "**/.eslintrc.{js,mjs}",
//     ],
//     rules: {
//       "no-console": "off",
//       "@typescript-eslint/no-var-requires": "off",
//     },
//   },

//   // Disable formatting rules (handled by Prettier)
//   prettierConfig,
// ];

// export default config;
