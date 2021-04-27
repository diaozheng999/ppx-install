module.exports = {
  parser: "@typescript-eslint/parser",
  parserOptions: {
    tsconfigRootDir: __dirname,
    project: ["./tsconfig.json"],
  },
  extends: [
    "plugin:@typescript-eslint/recommended", // uses typescript-specific linting rules
    "plugin:@typescript-eslint/recommended-requiring-type-checking", // enables additional rules with type definitions
    "plugin:prettier/recommended", // enables eslint-plugin-prettier and eslint-config-prettier
    "plugin:import/errors",
    "plugin:import/warnings",
    "plugin:import/typescript",
  ],
  rules: {
    "no-console": "error",
    "no-magic-numbers": ["error", { ignore: [0, 1, -1, 2, 0.5, -2, -0.5] }],
    "no-multiple-empty-lines": ["error", { max: 1, maxEOF: 0 }],
    "@typescript-eslint/camelcase": "off",
    "@typescript-eslint/explicit-function-return-type": "off",
    "@typescript-eslint/restrict-template-expressions": "off",
    "@typescript-eslint/explicit-module-boundary-types": [
      "error",
      {
        allowHigherOrderFunctions: true,
      },
    ],
    "@typescript-eslint/no-explicit-any": ["error"],
    "@typescript-eslint/no-unused-vars": [
      "error",
      { argsIgnorePattern: "^_", ignoreRestSiblings: true },
    ],
    "@typescript-eslint/naming-convention": [
      "error",
      {
        selector: "default",
        format: ["camelCase", "PascalCase"],
      },
      {
        selector: "typeParameter",
        filter: "^[A-Z]$",
        format: ["PascalCase"],
      },
      {
        selector: "typeParameter",
        filter: {
          regex: "^.{2,}$",
          match: true,
        },
        format: ["PascalCase"],
        prefix: ["T"],
      },
      {
        selector: "variable",
        format: ["camelCase", "UPPER_CASE", "PascalCase"],
        trailingUnderscore: "allowSingleOrDouble",
      },
      {
        selector: "function",
        format: ["PascalCase", "camelCase"],
        trailingUnderscore: "allow",
      },
      {
        selector: "function",
        filter: "^(UNSAFE_|INTERNAL_|DEPRECATED_|__opt_)",
        prefix: ["UNSAFE_", "INTERNAL_", "DEPRECATED_", "__opt_"],
        format: ["camelCase"],
      },
      {
        selector: "parameter",
        format: ["camelCase"],
        leadingUnderscore: "allow",
      },
      {
        selector: "method",
        filter: "^UNSAFE_",
        prefix: ["UNSAFE_"],
        format: ["camelCase"],
      },
      {
        selector: "property",
        modifiers: ["readonly"],
        format: ["camelCase", "PascalCase", "UPPER_CASE"],
      },
    ],
    "jest/no-commented-out-tests": "error",
    "jest/no-disabled-tests": "error",
  },
  plugins: ["@typescript-eslint", "jest"],
  overrides: [
    {
      files: ["*.test.ts", "*.test.tsx"],
      rules: {
        "no-magic-numbers": "off",
      },
    },
  ],
};
