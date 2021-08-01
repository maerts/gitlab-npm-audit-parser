const { unlink, copyFile } = require("fs/promises");
const { promisify } = require("util");
const path = require("path");
const subprocess = require("child_process");
const { replaceInFile } = require("replace-in-file");

const subprocessExec = promisify(subprocess.exec);
const parserCLI = global.PARSER_CLI;
const defaultOutputFilename = "gl-dependency-scanning-report.json";

describe("gitlab-npm-audit-parser", () => {
  // AUDIT VERSION 1
  describe("npm-audit-report-v1", () => {
    afterAll(async () => {
      await unlink(defaultOutputFilename);
    });

    it("generates expected gitlab report file from piped input", async () => {
      const reportJSONfile = path.resolve(__dirname, "v1_report.json");
      const validGLFormatV1File = path.resolve(
        __dirname,
        "snapshot",
        "GL-report.1.json"
      );
      const validGLFormatV1Hash = await global.sha256sum(validGLFormatV1File);
      const outputFile = defaultOutputFilename;
      await expect(
        subprocessExec(`cat ${reportJSONfile} | ${parserCLI}`)
      ).resolves.toBeTruthy();
      await expect(global.sha256sum(outputFile)).resolves.toEqual(
        validGLFormatV1Hash
      );
    });

    it("generates valid & parsable gitlab schema report", async () => {
      const reportJSONfile = path.resolve(__dirname, "v1_report.json");
      const outputFile = defaultOutputFilename;
      await subprocessExec(`cat ${reportJSONfile} | ${parserCLI}`);
      await expect(global.validateReportFile(outputFile)).resolves.toBeTruthy();
    });

    it("handles 0 vulnerabilities found", async () => {
      const reportJSONfile = path.resolve(__dirname, "v1_report_0vuls.json");
      const outputFile = defaultOutputFilename;
      await expect(
        subprocessExec(`cat ${reportJSONfile} | ${parserCLI}`)
      ).resolves.toBeTruthy();
      await expect(global.validateReportFile(outputFile)).resolves.toBeTruthy();
    });
  });

  // AUDIT VERSION 2
  describe("npm-audit-report-v2", () => {
    afterAll(async () => {
      await unlink(defaultOutputFilename);
    });

    it("generates expected gitlab report file from piped input", async () => {
      const reportJSONfile = path.resolve(__dirname, "v2_report.json");
      const validGLFormatV2File = path.resolve(
        __dirname,
        "snapshot",
        "GL-report.2.json"
      );
      const validGLFormatV2Hash = await global.sha256sum(validGLFormatV2File);
      const outputFile = defaultOutputFilename;
      await expect(
        subprocessExec(`cat ${reportJSONfile} | ${parserCLI}`)
      ).resolves.toBeTruthy();
      await expect(global.sha256sum(outputFile)).resolves.toEqual(
        validGLFormatV2Hash
      );
    });

    it("generates valid & parsable gitlab schema report", async () => {
      const reportJSONfile = path.resolve(__dirname, "v2_report.json");
      const outputFile = defaultOutputFilename;
      await subprocessExec(`cat ${reportJSONfile} | ${parserCLI}`);
      await expect(global.validateReportFile(outputFile)).resolves.toBeTruthy();
    });

    it("handles 0 vulnerabilities found", async () => {
      const reportJSONfile = path.resolve(__dirname, "v2_report_0vuls.json");
      const outputFile = defaultOutputFilename;
      await expect(
        subprocessExec(`cat ${reportJSONfile} | ${parserCLI}`)
      ).resolves.toBeTruthy();
      await expect(global.validateReportFile(outputFile)).resolves.toBeTruthy();
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

      it("generates correct gitlab parsable schema from piped input w/ run-script prefix", async () => {
        if (!pretestSetup) {
          // Jest 27 (uses jest-circus), should deem this check irrelevant.
          // BeforeAll/BeforeEach hook failures will terminate all consecutive tests
          throw new Error("BeforeAll failed prior to test.");
        }
        const validGLFormatV2File = path.resolve(
          __dirname,
          "snapshot",
          "GL-report.2.json"
        );
        const validGLFormatV2Hash = await global.sha256sum(validGLFormatV2File);
        const outputFile = defaultOutputFilename;

        await expect(
          subprocessExec(`cat ${reportJSONfile} | ${parserCLI}`)
        ).resolves.toBeTruthy();

        await expect(global.sha256sum(outputFile)).resolves.toEqual(
          validGLFormatV2Hash
        );
        await expect(
          global.validateReportFile(outputFile)
        ).resolves.toBeTruthy();
      });
    });
  });

  describe("cli options", () => {
    const helptext = [
      "Usage: parse [options]",
      "",
      "Options:",
      "  -V, --version     output the version number",
      "  -o, --out <path>  output filename, defaults to gl-dependency-scanning-report.json",
      "  -h, --help        output usage information\n"
    ].join("\n");

    it("prints version when given `--version`", async () => {
      // eslint-disable-next-line global-require
      const pkgVersion = require("../package.json").version;
      await expect(subprocessExec(`${parserCLI} --version`)).resolves.toEqual({
        stdout: `${pkgVersion}\n`,
        stderr: ""
      });
    });

    it("prints help info when given `-h`", async () => {
      await expect(subprocessExec(`${parserCLI} -h`)).resolves.toEqual({
        stderr: "",
        stdout: helptext
      });
    });

    it("prints help info when given `--help`", async () => {
      await expect(subprocessExec(`${parserCLI} --help`)).resolves.toEqual({
        stderr: "",
        stdout: helptext
      });
    });

    it("fails on invalid option `-x`", async () => {
      const command = `${parserCLI} -x`;
      const errMsg = [
        `Command failed: ${command}`,
        "error: unknown option `-x'\n"
      ].join("\n");
      await expect(subprocessExec(command)).rejects.toThrowError(errMsg);
    });

    describe("custom output file", () => {
      let customOutputFilename;
      beforeEach(() => {
        customOutputFilename = ".outputfile.json";
      });
      afterEach(async () => {
        await unlink(customOutputFilename);
      });

      it("generates report with user-defined filename with -o", async () => {
        const reportJSONfile = path.resolve(__dirname, "v2_report.json");
        const validGLFormatV2File = path.resolve(
          __dirname,
          "snapshot",
          "GL-report.2.json"
        );
        const validGLFormatV2Hash = await global.sha256sum(validGLFormatV2File);
        await expect(
          subprocessExec(
            `cat ${reportJSONfile} | ${parserCLI} -o ${customOutputFilename}`
          )
        ).resolves.toBeTruthy();
        await expect(global.sha256sum(customOutputFilename)).resolves.toEqual(
          validGLFormatV2Hash
        );
      });

      it("generates report at user-defined filepath with --out", async () => {
        const reportJSONfile = path.resolve(__dirname, "v2_report.json");
        const validGLFormatV2File = path.resolve(
          __dirname,
          "snapshot",
          "GL-report.2.json"
        );
        const validGLFormatV2Hash = await global.sha256sum(validGLFormatV2File);
        customOutputFilename = path.resolve(__dirname, customOutputFilename);
        await expect(
          subprocessExec(
            `cat ${reportJSONfile} | ${parserCLI} --out ${customOutputFilename}`
          )
        ).resolves.toBeTruthy();
        await expect(global.sha256sum(customOutputFilename)).resolves.toEqual(
          validGLFormatV2Hash
        );
      });
    });
  });
});
