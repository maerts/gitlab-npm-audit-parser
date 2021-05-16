module.exports = {
  env: {
    commonjs: true,
    es2017: true,
  },
  extends: [
    "eslint:recommended",
    "airbnb-base",
    "plugin:prettier/recommended"
  ],
  parserOptions: {
    ecmaVersion: 8,
  },
  ignorePatterns: [ "dist/**" ],
  rules: {}
};
