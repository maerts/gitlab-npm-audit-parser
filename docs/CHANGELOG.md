# CHANGELOG

All notable changes to this project will be documented in this file.

_The format is based on
[Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project
adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html)._

<!--lint disable no-duplicate-headings-->

<!-- ---- -->

<!-- ## \[Unreleased] -->

<!-- ### Added -->

<!-- ### Changed -->

<!-- ### Removed -->

<!-- ### Fixed -->

<!-- ### Security -->

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

## \[v1.1.1] - _2021-05-19_

### Added

- Initial automated test run and validation

### Changed

- Improved README instructions related to testing
- Ported to new author [@elpete](https://github.com/elpete)

## \[v1.1.0] - _2021-05-06_

### Added

- Implemented support for `npm-audit-report@v2.0`, which provides v2 report
  format

## \[v1.0.4] - _2020-05-03_

### Changed

- Optimized `join()`

## \[v1.0.3] - _2019-02-07_

### Added

- Implemented `version` top level key
- Implemented `remediations` key
- Instructions for Gitlab CI configuration
- Put vulnerability info into `vulnerabilities` array

## \[v1.0.2] - _2018-10-01_

- Defined bin file

## \[v1.0.1] - _2018-09-30_

- Added initial documentation
- Cleaned up code

## \[v1.0.0] - _2018-09-27_

- Initial creation of project & base implementation
