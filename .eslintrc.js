module.exports = {
  env: {
    commonjs: true,
    es2017: true
  },
  extends: [
    "eslint:recommended",
    "airbnb-base",
    "plugin:mdx/recommended",
    "plugin:prettier/recommended"
  ],
  parserOptions: {
    ecmaVersion: 8
  },
  settings: {
    "mdx/code-blocks": true
  },
  ignorePatterns: ["dist/**"],
  overrides: [
    {
      files: ["**.test.js"],
      env: {
        jest: true
      }
    }
  ],
  rules: {
    "no-console": "off",
    // webpack handles all dependencies to generate remaining bundle
    "import/no-extraneous-dependencies": "off"
  }
};
