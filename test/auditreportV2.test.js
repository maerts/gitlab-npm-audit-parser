const { unlink } = require("fs/promises");
const { promisify } = require("util");
const path = require("path");
const subprocess = require("child_process");

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
  it("generates correct gitlab parsable schema from piped input", async () => {
    if (!validGLFormatV2Hash) {
      // Jest 27 (uses jest-circus), should deem this check irrelevant.
      // BeforeAll/BeforeEach hook failures will terminate all consecutive tests
      throw new Error("BeforeAll failed prior to test.");
    }
    const reportJSONfile = path.resolve(__dirname, "v2_report.json");
    await subprocessExec(`cat ${reportJSONfile} | ${parserCLI}`);
    const outputFile = defaultOutputFilename;
    await expect(global.sha256sum(outputFile)).resolves.toEqual(
      validGLFormatV2Hash
    );
  });
});
