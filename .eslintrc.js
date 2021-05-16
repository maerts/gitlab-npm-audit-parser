module.exports = {
  env: {
    commonjs: true,
    es2017: true,
  },
  extends: [
    "airbnb-base",
    "plugin:prettier/recommended"
  ],
  parserOptions: {
    ecmaVersion: 8,
  },
  ignorePatterns: [ "dist/**" ],
  rules: {}
};
