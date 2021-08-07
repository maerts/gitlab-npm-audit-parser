# CHANGELOG

All notable changes to this project will be documented in this file.

_The format is based on
[Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project
adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html)._

<!--lint disable no-duplicate-headings-->

<!-- --- -->

<!-- ## \[Unreleased] -->

<!-- ### Added -->

<!-- ### Changed -->

<!-- ### Removed -->

<!-- ### Fixed -->

<!-- ### Security -->

---

## \[v1.3.0] - _2021-08-04_

### Added

- Added `babel` & configuration to enable `Jest` to handle ES6 module syntax
- Added `jsonschema` module to run validation processing on reports with
  expected schema in test cases
- Added additional unit-tests to characterize all current features of CLI
- Added unit-tests to ensure handling of 0 vulnerability inputs to create an
  valid 0 vulnerability GitLab report
- Additional fault-tolerance and error handling to processing
- Aliased v1 & v2 of `npm-audit-report` pkg as devDependency, enables update
  monitoring & test integration
- Lint: allow increment notation (`i++`) of variables

### Changed

- Dev build does not produce extrenous files by default
- Expanded `package.json` spec with more keywords for SEO
- Improved `README.md` description to explain why to use this library
- Refactored processing of v1 & v2 audit reports for better code reuse and
  maintainability
- Refactored test framework organization to consolidate CLI tests together
- Resulting reports now include `dependency_files` entries that didn't exist
  before and are required by `v14.0.3` schema
- Switched `schema-merge` devdependency to `@gitlab-org/security-report-schemas`
  pkg & refactored usage
- V1 report now includes remediation actions for resolving vulnerabilities if
  exists
- V2 report will ensure no duplicate remediation actions in the resulting report

### Removed

- Dropped `tool` field in `report.json`
- Dropped inclusion of NodeJS core modules into distribution code via changed
  webpack config
- Removed concept of a DEV_ENTRYPOINT and development version testing. Decided
  to require a production rebuild prior to executing testcases

### Fixed

- Fix "value not exist in enum" issue relating to vulnerability severity
  translation
- Fixed invalid entries in reports that do not pass the schema validation
- Rewrite the vulnerabilility ID format generated per reported vulnerability to
  better match schema rules

### Security

- Bumped `ws` version to fix regex vulnerability
- Changed `remark-lint-are-links-valid` devdependency to
  `remark-lint-no-dead-urls` in favor of an active repo that resolves its
  vulnerabilities

---

## \[v1.2.1] - _2021-05-20_

### Changed

- Changed lint to ignore `import/no-extraneous-dependencies` rule

### Removed

- The installation of any dependencies for runtime

### Fixed

- Resolved slow installation of package

---

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

## \[v1.1.1] - _2021-05-19_

### Added

- Initial automated test run and validation

### Changed

- Improved README instructions related to testing
- Ported to new author [@elpete](https://github.com/elpete)

---

## \[v1.1.0] - _2021-05-06_

### Added

- Implemented support for `npm-audit-report@v2.0`, which provides v2 report
  format

---

## \[v1.0.4] - _2020-05-03_

### Changed

- Optimized `join()`

---

## \[v1.0.3] - _2019-02-07_

### Added

- Implemented `version` top level key
- Implemented `remediations` key
- Instructions for Gitlab CI configuration
- Put vulnerability info into `vulnerabilities` array

---

## \[v1.0.2] - _2018-10-01_

- Defined bin file

---

## \[v1.0.1] - _2018-09-30_

- Added initial documentation
- Cleaned up code

---

## \[v1.0.0] - _2018-09-27_

- Initial creation of project & base implementation
