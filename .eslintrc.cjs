/**
 * @type {import('eslint/lib/shared/types').ConfigData}
 */
module.exports = {
  extends: ["plugin:@typescript-eslint/recommended", "airbnb", "prettier"],
  plugins: ["import", "@typescript-eslint"],
  parser: "@typescript-eslint/parser",
  env: {
    es2021: true,
    browser: true,
    node: true,
  },
  settings: {
    "import/resolver": {
      typescript: {
        alwaysTryTypes: true,
      },
    },
    "import/parsers": {
      "@typescript-eslint/parser": [".ts", ".tsx"],
    },
  },
  rules: {
    // off
    "arrow-body-style": "off",
    "arrow-parens": "off",
    camelcase: "off",
    "default-param-last": "off",
    "import/extensions": "off",
    "import/no-extraneous-dependencies": "off",
    "import/prefer-default-export": "off",
    "no-alert": "off",
    "no-console": "off",
    "no-shadow": "off",
    "no-underscore-dangle": "off",
    "react/jsx-props-no-spreading": "off",
    "react/react-in-jsx-scope": "off",
    "react/require-default-props": "off",
    "react/prop-types": "off",
    "@typescript-eslint/no-explicit-any": "off",
    // error
    "import/order": [
      "error",
      {
        "newlines-between": "always-and-inside-groups",
        groups: [
          "builtin",
          "external",
          "internal",
          "parent",
          "sibling",
          "index",
          "object",
          "type",
        ],
        alphabetize: {
          order: "asc",
        },
      },
    ],
    "react/jsx-filename-extension": [
      "error",
      {
        extensions: [".jsx", ".tsx"],
      },
    ],
    "react/function-component-definition": [
      "error",
      {
        namedComponents: "arrow-function",
      },
    ],
    "no-unused-vars": [
      "error",
      {
        argsIgnorePattern: "^_",
      },
    ],
  },
};
