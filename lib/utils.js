const { createHash } = require("crypto");
const gitlabSchema =
  require("@gitlab-org/security-report-schemas").DependencyScanningReportSchema;

/**
 * Function to capitalize the first letter of a given string
 * @param {string} str
 * @returns initial letter capitalized string
 */
function capitalize(str) {
  if (typeof str !== "string") {
    throw new Error(
      `Parameter mixmatch: expected string, not '${typeof str}'.`
    );
  }
  const char = str.length > 0 ? str.charAt(0).toUpperCase() : str;
  return str.length > 1 ? `${char}${str.slice(1)}` : char;
}

/**
 * Extract numeric id value from a CWE prefixed identifier
 *
 * @param {string} cweString string matching format `CWE-*`
 * @returns identifier without CWE prefix
 */
module.exports.getCWEId = (cweString) => {
  return cweString.replace("CWE-", "");
};

/**
 * Function to calculate a sha1 hash of data
 *
 * @param {*} data Data to calculate hash on
 * @returns hex notation string of sha1sum digest
 */
function sha1sum(data) {
  const hash = createHash("sha1");
  hash.update(data);
  return hash.digest("hex");
}

/**
 * Function to extract report format version of `npm-audit-report` output.
 *
 * @param {{ auditReportVersion: number, [key]: unknown }} parsedData
 * @returns Number designating the npm report version
 */
module.exports.getReportType = (parsedData) => {
  return parseInt(parsedData.auditReportVersion, 10) || 1;
};

/**
 * Function to transform generic severity descriptors to GitLab specified constants
 * that represent the same severity
 *
 * @param {string} severity descriptor to define severity of vulnerability by npm audit
 * @returns string matching a GitLab severity constant
 */
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

/**
 * Function to generate remediation object defined by GitLab Dependency Scanning schema
 *
 * @param {string} summary Description of what remediation action to take
 * @param {string[]} ids List of vulnerability UUIDs this remediation fixes
 * @returns properly formatted remediation object
 */
function createRemediation(summary, ids) {
  if (!Array.isArray(ids)) {
    throw new Error(
      `parameter mixmatch. Expected string[] not '${JSON.stringify(ids)}'`
    );
  }
  return {
    fixes: ids.map((uuid) => ({ id: uuid, cve: uuid })),
    summary,
    // No possible way at this time to get a base64 encoded code diff for git apply
    diff: " "
  };
}
module.exports.createRemediation = createRemediation;

/**
 * Combines resolutions that solve more than one problem
 *
 * @param {[]} singleFixes Array of remediation objects
 * @returns [] remediation objects
 */
function consolidateRemediations(singleFixes) {
  const hashMap = {};
  singleFixes.forEach((fix) => {
    const hash = sha1sum(fix.summary);
    const fixIds = fix.fixes.map((idObj) => idObj.id);
    if (!hashMap[hash]) {
      hashMap[hash] = {
        summary: fix.summary,
        ids: fixIds
      };
    } else {
      hashMap[hash].ids = hashMap[hash].ids.concat(fixIds);
    }
  });
  return Object.values(hashMap).map((fix) =>
    createRemediation(fix.summary, fix.ids)
  );
}

/**
 * Report Creator function that ensures conformity to GitLab published schema
 *
 * @param {
 *  lockfile: string,
 *  vulns: [],
 *  remediations: [],
 * } reportParams parsed data from audit logs to enter into report
 * @returns GitLab standard report
 */
module.exports.createGitLabReport = (reportParams) => {
  const report = {};
  // The version of the schema to which the JSON report conforms.
  report.version = gitlabSchema.self.version;
  report.schema = `https://gitlab.com/gitlab-org/security-products/security-report-schemas/-/raw/v${gitlabSchema.self.version}/dist/dependency-scanning-report-format.json`;
  report.vulnerabilities = reportParams.vulns;
  report.remediations = consolidateRemediations(reportParams.remediations);
  report.dependency_files = [
    // NPM audit only reviews a single lockfile at a time (index = 0)
    {
      path: reportParams.lockfile,
      package_manager: "npm",
      dependencies: reportParams.vulns.map((vuln) => vuln.location.dependency)
    }
  ];

  return report;
};

/**
 * Function to generate the proper object structure for a vulnerability definition for a GitLab report
 *
 * @param {string} id Unique identifier for the vulnerability should be universally unique
 * @param {*} name Human readable name of the vulnerability
 * @param {*} subject A short text section that describes the vulnerability
 * @param {*} description A long text section that describes the vulnerability more fully.
 * @param {*} severity Descriptor of how much the vulnerability impacts the software. Will
 *                     be transformed by `getSeverity()` to match expected GitLab enum values.
 * @returns Skeleton Vulnerability object as expected by GitLab Dependency Scanning schema
 */
module.exports.createVulnDef = (id, name, subject, description, severity) => {
  return {
    id,
    // cve is deprecated & this is not a CVE as defined by cve.mitre.org
    cve: id,
    category: "dependency_scanning",
    name,
    message: subject,
    description,
    severity: getSeverity(severity),
    confidence: "High",
    scanner: null,
    location: null,
    identifiers: [],
    solution: null,
    links: []
  };
};

/**
 * Function to generate the proper object structure for the scanner definition included
 * for a vulnerability description
 *
 * @param {number} versionNum Number identifier for version of `npm-audit-report` pkg used
 * @returns Scanner object as defined by GitLab Dependency Scanning schema
 */
module.exports.createScannerDef = (versionNum) => {
  return {
    id: "npm_audit_advisories",
    name: `NPM Audit v${versionNum}`
  };
};

/**
 * Function to generate the proper object structure for a vulnerabilities location description
 *
 * @param {string} lockfile NPM filename used as dependency version specification
 * @param {string} pkgName Human readable name of package
 * @param {string} vulnVersions Description of which versions have a vulnerability
 * @returns Location object as defined by GitLab Dependency Scanning schema
 */
module.exports.createLocDef = (lockfile, pkgName, vulnVersions) => {
  return {
    file: lockfile,
    dependency: {
      package: {
        name: pkgName
      },
      version: vulnVersions
    }
  };
};

/**
 * Function to generate the proper object structure of a vulnerability identifier
 *
 * @param {string} type Type of Identifier like cve, cwe, osvdb, usn, or analyzer-dependent type
 * @param {string} name Human-readable name of identifier
 * @param {unknown & { toString: () => string }} value value of the identifier for matching purposes
 * @param {string} url URL of the identifier's documentation
 * @returns Identifier object as defined by GitLab Dependency Scanning schema
 */
module.exports.createVulnIdentifier = (type, name, value, url) => {
  return {
    type,
    name,
    value: value.toString(),
    url
  };
};

/**
 * Function to generate proper object structure of a Link object
 *
 * @param {string} link string representation of a URL
 * @returns URL object for links[] as defined by GitLab Dependency Scanning schema
 */
module.exports.createVulnLink = (link) => {
  return { url: link };
};
