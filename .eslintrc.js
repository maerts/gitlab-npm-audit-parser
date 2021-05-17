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
  rules: {
    "no-console": "off"
  }
};
