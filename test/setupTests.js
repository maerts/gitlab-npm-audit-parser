/**
 * FILE: setupTests.js
 * JEST HOOK: setupFilesAfterEnv
 * ------------------------------
 * Configures jest test environment for all tests
 */
const { createHash } = require("crypto");
const { readFile } = require("fs").promises;
const { validate } = require("jsonschema");
const schemaSpec =
  require("@gitlab-org/security-report-schemas").DependencyScanningReportSchema;
const path = require("path");
const thisModule = require("../package.json");

global.isWindows = process.platform === "win32";
global.PROJECT_ROOT = path.dirname(__dirname);
global.PARSER_CLI = path.resolve(global.PROJECT_ROOT, thisModule.main);

global.sha256sum = async function sha256sum(filepath) {
  const hash = createHash("sha256");
  const data = await readFile(filepath);
  hash.update(data);
  return hash.digest("hex");
};

global.validateReport = function validateReport(reportObj) {
  if (typeof reportObj !== "object" || Array.isArray(reportObj)) {
    throw new Error("Invalid reportObj provided.");
  }
  const result = validate(reportObj, schemaSpec);
  const isValid = result.errors.length === 0;
  if (!isValid) {
    process.stderr.write("Report errors:\n");
    process.stderr.write(`  ${result.errors.join(";\n  ")};\n\n`);
  }
  return isValid;
};

global.validateReportFile = async function validateReportFile(filepath) {
  const strReport = await readFile(filepath, "utf-8");
  try {
    const reportJSON = JSON.parse(strReport);
    return global.validateReport(reportJSON);
  } catch (error) {
    if (Object.getPrototypeOf(error) === SyntaxError.prototype) {
      throw new Error(
        "Data provided is not JSON parsable. Check input format."
      );
    }
    throw error;
  }
};
