const gitlabSchema =
  require("@gitlab-org/security-report-schemas").DependencyScanningReportSchema;
const { capitalize } = require("./utils");
const { getCWEId } = require("./utils");

function getReportType(parsedData) {
  return parsedData.auditReportVersion || 1;
}

function getSeverity(severity) {
  const gitlabSeverities = [
    "Info",
    "Unknown",
    "Low",
    "Medium",
    "High",
    "Critical"
  ];
  const alternativesMap = {
    moderate: gitlabSeverities[3]
  };
  for (let s = 0; s < gitlabSeverities.length; s++) {
    const regex = new RegExp(`^${gitlabSeverities[s]}$`, "i"); // case-insensitive
    if (regex.test(severity)) {
      return capitalize(gitlabSeverities[s]);
    }
  }
  const alternatives = Object.keys(alternativesMap);
  for (let s = 0; s < alternatives.length; s++) {
    const regex = new RegExp(`^${alternatives[s]}$`, "i"); // case-insensitive
    if (regex.test(severity)) {
      return capitalize(alternativesMap[alternatives[s]]);
    }
  }
  return null;
}

function convertV2Report(parsedData) {
  const report = {};
  // The version of the schema to which the JSON report conforms.
  report.version = gitlabSchema.self.version;
  report.schema = `https://gitlab.com/gitlab-org/security-products/security-report-schemas/-/raw/v${gitlabSchema.self.version}/dist/dependency-scanning-report-format.json`;
  report.vulnerabilities = [];
  report.remediations = [];
  report.dependency_files = [
    {
      path: "package-lock.json",
      package_manager: "npm",
      dependencies: []
    }
  ];

  Object.keys(parsedData.vulnerabilities).forEach((pkgName) => {
    const advisory = parsedData.vulnerabilities[pkgName];
    advisory.via.forEach((via) => {
      if (typeof via !== "object") {
        return;
      }
      const id = `npm::advisory:${via.source || via.id}::${advisory.name}`;
      const solution =
        typeof advisory.fixAvailable === "object"
          ? `Upgrade ${advisory.fixAvailable.name} to version >=${advisory.fixAvailable.version}`
          : null;
      report.vulnerabilities.push({
        id,
        // cve is deprecated (but still required as part of schema)
        // & this is not a CVE as defined by cve.mitre.org
        cve: id,
        category: "dependency_scanning",
        name: advisory.name,
        message: via.title,
        description: via.title,
        severity: getSeverity(via.severity),
        confidence: "High",
        scanner: {
          id: "npm_audit_advisories",
          name: `NPM Audit v${getReportType(parsedData)}`
        },
        location: {
          file: "package-lock.json",
          dependency: {
            package: {
              name: advisory.name
            },
            version: via.range
          }
        },
        identifiers: [
          {
            type: "cve",
            name: via.title,
            value: via.source,
            url: via.url
          }
        ],
        solution,
        links: [
          {
            url: via.url
          }
        ]
      });

      if (solution) {
        report.remediations.push({
          fixes: [{ id }],
          summary: solution
        });
      }

      // NPM audit only reviews a single lockfile at a time (index = 0)
      report.dependency_files[0].dependencies.push({
        package: {
          name: advisory.name
        },
        version: via.range
      });
    });
  });

  return report;
}

function convertV1Report(parsedData) {
  const report = {};
  // The version of the schema to which the JSON report conforms.
  report.version = gitlabSchema.self.version;
  report.schema = `https://gitlab.com/gitlab-org/security-products/security-report-schemas/-/raw/v${gitlabSchema.self.version}/dist/dependency-scanning-report-format.json`;
  report.vulnerabilities = [];
  report.remediations = [];

  Object.keys(parsedData.advisories).forEach((id) => {
    const advisory = parsedData.advisories[id];
    const cweID = getCWEId(advisory.cwe);
    const uuid = `npm::advisory:${id}::${advisory.module_name}`;

    report.vulnerabilities.push({
      category: "dependency_scanning",
      name: advisory.module_name,
      namespace: advisory.module_name,
      message: advisory.title,
      id: uuid,
      // cve is deprecated & this is not a CVE as defined by cve.mitre.org
      cve: uuid,
      description: advisory.overview,
      severity: getSeverity(advisory.severity),
      fixedby: advisory.reported_by.name,
      confidence: "High",
      scanner: {
        id: "npm_audit_advisories",
        name: `NPM Audit v${getReportType(parsedData)}`
      },
      location: {
        file: "package.json",
        dependency: {
          package: {
            name: advisory.module_name
          },
          version: advisory.vulnerable_versions
        }
      },
      identifiers: [
        advisory.cves.length > 0
          ? {
              type: "cve_id",
              name: advisory.cves[0],
              value: advisory.cves[0],
              url: `https://nvd.nist.gov/vuln/detail/${advisory.cves[0]}`
            }
          : null,
        {
          type: "cwe_id",
          name: advisory.cwe,
          value: advisory.cwe,
          url: `https://cwe.mitre.org/data/definitions/${cweID}.html`
        }
      ],
      solution: advisory.recommendation,
      links: [
        {
          url: `https://npmjs.com/advisories/${advisory.id}`
        }
      ]
    });

    // Filter out nulls
    report.vulnerabilities[report.vulnerabilities.length - 1].identifiers =
      report.vulnerabilities[
        report.vulnerabilities.length - 1
      ].identifiers.filter((el) => el);

  });

  return report;
}

function convertReportForType(parsedData) {
  switch (getReportType(parsedData)) {
    case 2:
      return convertV2Report(parsedData);
    case 1:
    default:
      return convertV1Report(parsedData);
  }
}

function convert(data) {
  let json = data;
  if (!/^\s*{/.test(data)) {
    // Trim any leading npm loglevel information
    json = data.replace(/^([^{])*{/, "{");
  }
  try {
    json = JSON.parse(json); // internally runs trim()
  } catch (error) {
    if (Object.getPrototypeOf(error) === SyntaxError.prototype) {
      throw new Error(
        "Data provided is not JSON parsable. Check input format."
      );
    }
    throw error;
  }
  try {
    return JSON.stringify(convertReportForType(json), null, "  ");
  } catch (error) {
    throw new Error(`Internal error!\nCaused by:\n  ${error.toString()}`);
  }
}

module.exports = convert;
