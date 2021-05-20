const { unlink, copyFile } = require("fs/promises");
const { promisify } = require("util");
const path = require("path");
const subprocess = require("child_process");
const { replaceInFile } = require("replace-in-file");

const subprocessExec = promisify(subprocess.exec);
const parserCLI = global.PARSER_CLI;
const defaultOutputFilename = "gl-dependency-scanning-report.json";
const validGLFormatV2File = path.resolve(
  __dirname,
  "snapshot",
  "GL-report.2.json"
);
let validGLFormatV2Hash;

describe("npm-audit-report-v2", () => {
  beforeAll(async () => {
    validGLFormatV2Hash = await global.sha256sum(validGLFormatV2File);
  });
  afterAll(async () => {
    await unlink(defaultOutputFilename);
  });
  describe("run-script-use", () => {
    const originalReportJSONfile = path.resolve(__dirname, "v2_report.json");
    const reportJSONfile = `${originalReportJSONfile}.tmp`;
    let pretestSetup = false;
    beforeAll(async () => {
      await copyFile(originalReportJSONfile, reportJSONfile);
      await replaceInFile({
        files: reportJSONfile,
        from: /^\s*{/,
        to: (match) => {
          // Inserts lines of output typically seen from npm run-script if not silent
          const lines = [
            "> project@v#.#.# dependency-security",
            "> npm audit --audit-level=moderate\n",
            match
          ];
          return `\n${lines.join("\n")}`;
        }
      });
      pretestSetup = true;
    });
    afterAll(async () => {
      await unlink(reportJSONfile);
    });
    it("generates correct gitlab parsable schema from piped input", async () => {
      if (!validGLFormatV2Hash || !pretestSetup) {
        // Jest 27 (uses jest-circus), should deem this check irrelevant.
        // BeforeAll/BeforeEach hook failures will terminate all consecutive tests
        throw new Error("BeforeAll failed prior to test.");
      }
      const outputFile = defaultOutputFilename;
      await expect(
        subprocessExec(`cat ${reportJSONfile} | ${parserCLI}`)
      ).resolves.toBeTruthy();
      await expect(global.sha256sum(outputFile)).resolves.toEqual(
        validGLFormatV2Hash
      );
    });
  });
});