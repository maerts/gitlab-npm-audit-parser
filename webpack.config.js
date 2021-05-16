// Generated using webpack-cli https://github.com/webpack/webpack-cli

const isProduction = process.env.NODE_ENV === "production";
const path = require("path");
const SheBangPlugin = require("webpack-shebang-plugin");
const ESLintPlugin = require("eslint-webpack-plugin");
const thisModule = require("./package.json");

const config = {
  entry: "./parse.js",
  target: "node",
  output: {
    path: path.resolve(
      __dirname,
      path.dirname(thisModule.main) === "."
        ? "dist"
        : path.dirname(thisModule.main)
    ),
    filename: path.basename(thisModule.main)
  },
  plugins: [
    new SheBangPlugin({
      chmod: 0o755
    }),
    new ESLintPlugin()
  ],
  optimization: {
    // minimize & mangle the output files (TerserPlugin w/ webpack@v5)
    minimize: true,
    // determine which exports are used by modules and removed unused ones
    usedExports: true
  },
  resolve: {
    extensions: [".js", ".json"]
  }
};

module.exports = () => {
  if (isProduction) {
    config.mode = "production";
  } else {
    config.mode = "development";
  }
  return config;
};
