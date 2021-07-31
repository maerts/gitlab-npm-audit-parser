const { unlink } = require("fs/promises");
const { promisify } = require("util");
const path = require("path");
const subprocess = require("child_process");

const subprocessExec = promisify(subprocess.exec);
const parserCLI = global.PARSER_CLI;
const defaultOutputFilename = "gl-dependency-scanning-report.json";
const validGLFormatV1File = path.resolve(
  __dirname,
  "snapshot",
  "GL-report.1.json"
);
let validGLFormatV1Hash;

describe("npm-audit-report-v1", () => {
  beforeAll(async () => {
    validGLFormatV1Hash = await global.sha256sum(validGLFormatV1File);
  });
  afterAll(async () => {
    await unlink(defaultOutputFilename);
  });
  it("generates correct gitlab parsable schema from piped input", async () => {
    if (!validGLFormatV1Hash) {
      // Jest 27 (uses jest-circus), should deem this check irrelevant.
      // BeforeAll/BeforeEach hook failures will terminate all consecutive tests
      throw new Error("BeforeAll failed prior to test.");
    }
    const reportJSONfile = path.resolve(__dirname, "v1_report.json");
    const outputFile = defaultOutputFilename;
    await expect(
      subprocessExec(`cat ${reportJSONfile} | ${parserCLI}`)
    ).resolves.toBeTruthy();
    await expect(global.sha256sum(outputFile)).resolves.toEqual(
      validGLFormatV1Hash
    );
  });
});
