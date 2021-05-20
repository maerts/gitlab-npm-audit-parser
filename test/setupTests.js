/**
 * FILE: setupTests.js
 * JEST HOOK: setupFilesAfterEnv
 * ------------------------------
 * Configures jest test environment for all tests
 */
const { createHash } = require("crypto");
const { readFile } = require("fs/promises");
const path = require("path");
const thisModule = require("../package.json");

global.PROJECT_ROOT = path.dirname(__dirname);

global.PARSER_CLI =
  process.env.NODE_ENV === "production"
    ? path.resolve(global.PROJECT_ROOT, thisModule.main)
    : path.resolve(global.PROJECT_ROOT, global.DEV_ENTRYPOINT); // dev entrypoint

// console.log(`Tests running in ${process.env.NODE_ENV || "development"} mode.`);
// console.log(
//   `Entrypoint: ${global.PARSER_CLI.replace(global.PROJECT_ROOT, "")}`
// );

global.sha256sum = async function sha256sum(filepath) {
  const hash = createHash("sha256");
  const data = await readFile(filepath);
  hash.update(data);
  return hash.digest("hex");
};
