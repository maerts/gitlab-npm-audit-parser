---
<!-- Gitlab published tag [FALSE IS CORRECT] -->
published: false
---

# GitLab parser for NPM Audit (v1.2.0)

    Usage: gitlab-npm-audit-parser [options]

    Input: Stdin via pipe
      npm audit --json | gitlab-npm-audit-parser ...
      cat <file> | gitlab-npm-audit-parser ...

    Options:

      -V, --version     output the version number
      -o, --out <path>  output filename, defaults to gl-dependency-scanning-report.json
      -h, --help        output usage information

## \[v1.2.0] - _2021-05-20_

### Added

- Added CHANGELOG file
- Added per version readme documentation
- Eslint for JS and Markdown to include prettier, AirBnb style & remark plugins
- Official Schema package as a dependency & into bundle for use
- Webpack bundle creation for distribution code

### Changed

- Run-scripts modified for new developer workflow & pre-checks (dropped prepare
- Testing Framework implementation uses jest/nodejs instead of shell scripts
  script)
- Updated README documentation to explain package and explain new test usage
- Updated schema output to match official schema (schema.version)

### Fixed

- Fix parse error from stdin extrenuous prefixed json output (usually from
  `npm run-script`)

---

## Package Objective

Perform the data translation from an `npm audit --json` report output to the
GitLab.com standardized JSON schema format specifically for ingest of dependency
scanning reports of a project.

## Why?

GitLab requires a common schema to ingest scanning reports from multiple
different dependency auditing tools across different languages. In the
JavaScript/TypeScript ecosystem, most of us use `npm audit` to verify project
dependencies but the JSON report is not ingestable by GitLab.com. It requires
this package as middleware to translate an `npm audit --json` report into the
standard dependency audit schema before it can be uploaded and ingested as a
dependency_scanning artifact. Ingested artifacts can then be used as data
sources to generate interactive content embedded in a pipeline results view or
Merge Request (MR) webpage.

## Compatibility

| INGEST                  | SUPPORTED? | OUTPUT                                      |
| ----------------------- | :--------: | ------------------------------------------- |
| npm-audit-report@^1.0.0 |    yes     | JSON file (gitlab-org/schema-merge@^14.0.1) |
| npm-audit-report@^2.0.0 |    yes     | JSON file (gitlab-org/schema-merge@^14.0.1) |

## How to use

Install this package into your devDependencies or use `npx` directly to download
the package at runtime. If you opt to download for use at run time, make sure to
include the correct scope name for the package since there are multiple versions
of this package on npmjs.com.

_I recommend the runtime option since this package is only needed in a GitLab
specific pipeline and not necessary to be locally installed for developer use._

```sh
# 1. Downloads at runtime use
npm audit --json | npx @codejedi365/gitlab-npm-audit-parser -o gl-dependency-scanning.json

# 2. Install in devDependencies
npm install --save-dev @codejedi365/gitlab-npm-audit-parser
```

Add the following job to `.gitlab-ci.yml`. If you used #2 and it is in your
devDependencies you may remove the `@<scope>` prefix from the following.

```yaml
dependency scanning:
  image: node:10-alpine
  script:
    - npm ci
    - npm audit --json | npx @codejedi365/gitlab-npm-audit-parser -o
      gl-dependency-scanning.json
  artifacts:
    reports:
      dependency_scanning: gl-dependency-scanning.json
```

NOTE: If you use a `npm run-script` to call `npm audit` due to set project
parameters, this library will ignore any prefixed stdout data prior to the first
open bracket for the JSON output. This way `npm run --silent` is no longer
required.

## Test

```sh
# Production build (CLI bundle) & Executes all test cases
npm run test:prod

# Verifies build process once, then runs tests against local files
npm test
npm run test:dev   # enable test watch mode

# Monitor build process & interactive lint
npm run build-watch
```

### Examples

| #   | INGEST FILE             |     | OUTPUT FILE                         |
| --- | ----------------------- | --- | ----------------------------------- |
| 1.  | `./test/v1_report.json` | =>  | `./test/snapshots/GL-report.1.json` |
| 2.  | `./test/v2_report.json` | =>  | `./test/snapshots/GL-report.2.json` |
