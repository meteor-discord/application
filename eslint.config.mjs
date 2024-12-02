import eslint from "@eslint/js";
import regexpPlugin from "eslint-plugin-regexp";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    files: ["**/*.{ts,tsx,js,mjs,jsx}"],
  },
  {
    ignores: ["node_modules/**"],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  ...tseslint.configs.stylistic,
  regexpPlugin.configs["flat/recommended"],
  {
    rules: {
      // General ESLint rules
      "dot-notation": "error",
      "eqeqeq": "error",
      "no-constant-condition": ["error", { checkLoops: false }],
      "no-extra-bind": "error",
      "no-template-curly-in-string": "error",
      "no-throw-literal": "error",
      "no-undef-init": "error",
      "no-var": "error",
      "object-shorthand": "error",
      "prefer-const": "error",
      "prefer-object-spread": "error",
      "unicode-bom": ["error", "never"],
      "linebreak-style": ["error", "unix"],

      // TypeScript-specific rules
      "@typescript-eslint/naming-convention": [
        "error",
        {
          selector: "typeLike",
          format: ["PascalCase"],
          filter: { regex: "^(__String|[A-Za-z]+_[A-Za-z]+)$", match: false },
        },
        {
          selector: "interface",
          format: ["PascalCase"],
          custom: { regex: "^I[A-Z]", match: false },
          filter: {
            regex: "^I(Arguments|TextWriter|O([A-Z][a-z]+[A-Za-z]*)?)$",
            match: false,
          },
        },
        {
          selector: "variable",
          format: ["camelCase", "PascalCase", "UPPER_CASE"],
          leadingUnderscore: "allow",
          filter: {
            regex: "^(_{1,2}filename|_{1,2}dirname|_+|[A-Za-z]+_[A-Za-z]+)$",
            match: false,
          },
        },
        {
          selector: "function",
          format: ["camelCase", "PascalCase"],
          leadingUnderscore: "allow",
          filter: { regex: "^[A-Za-z]+_[A-Za-z]+$", match: false },
        },
        {
          selector: "parameter",
          format: ["camelCase"],
          leadingUnderscore: "allow",
          filter: { regex: "^(_+|[A-Za-z]+_[A-Z][a-z]+)$", match: false },
        },
        {
          selector: "method",
          format: ["camelCase", "PascalCase"],
          leadingUnderscore: "allow",
          filter: { regex: "^([0-9]+|[A-Za-z]+_[A-Za-z]+)$", match: false },
        },
        {
          selector: "memberLike",
          format: ["camelCase"],
          leadingUnderscore: "allow",
          filter: { regex: "^([0-9]+|[A-Za-z]+_[A-Za-z]+)$", match: false },
        },
        {
          selector: "enumMember",
          format: ["camelCase", "PascalCase"],
          leadingUnderscore: "allow",
          filter: { regex: "^[A-Za-z]+_[A-Za-z]+$", match: false },
        },
        { selector: "property", format: null },
      ],

      // Additional TypeScript rules
      "@typescript-eslint/unified-signatures": "error",
      "@typescript-eslint/no-unused-expressions": ["error", { allowTernary: true }],
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^(_+$|_[^_])",
          varsIgnorePattern: "^(_+$|_[^_])",
        },
      ],

      // Disable native no-unused-expressions in favor of TypeScript's version
      "no-unused-expressions": "off",
    },
  },
);
