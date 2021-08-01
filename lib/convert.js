const {
  createGitLabReport,
  createLocDef,
  createScannerDef,
  createRemediation,
  createVulnDef,
  createVulnIdentifier,
  createVulnLink,
  getCWEId,
  getReportType
} = require("./utils");

/**
 * Function to extract/generate valuable data to be inserted into GitLab report
 * @param {{[key]: any}} parsedData a JSON object adhering to `npm-audit-report@^2.x.x`
 * @returns GitLab dependency scanning report object
 */
function convertV2Report(parsedData) {
  const scanner = createScannerDef(2);
  const reportParams = {
    lockfile: "package-lock.json",
    vulns: [],
    remediations: []
  };

  Object.values(parsedData.vulnerabilities).forEach((advisory) => {
    advisory.via.forEach((via) => {
      if (typeof via !== "object") {
        return;
      }
      const solution =
        typeof advisory.fixAvailable === "object"
          ? `Upgrade ${advisory.fixAvailable.name} to version >=${advisory.fixAvailable.version}`
          : null;

      const vulDef = createVulnDef(
        `npm::advisory:${via.source || via.id}::${advisory.name}`,
        advisory.name,
        via.title,
        via.title,
        via.severity
      );
      vulDef.scanner = scanner;
      vulDef.location = createLocDef(
        reportParams.lockfile,
        advisory.name,
        via.range
      );
      vulDef.identifiers = [
        createVulnIdentifier("cve", via.title, via.source, via.url)
      ];
      vulDef.links = [createVulnLink(via.url)];

      if (solution) {
        vulDef.solution = solution;
        reportParams.remediations.push(
          createRemediation(vulDef.solution, [vulDef.id])
        );
      } else {
        delete vulDef.solution;
      }

      reportParams.vulns.push(vulDef);
    });
  });

  // ######## GENERATE REPORT FROM EXTRACTS ########
  return createGitLabReport(reportParams);
}

/**
 * Function to extract/generate valuable data to be inserted into GitLab report
 * @param {{[key]: any}} parsedData a JSON object adhering to `npm-audit-report@^1.x.x`
 * @returns GitLab dependency scanning report object
 */
function convertV1Report(parsedData) {
  const scanner = createScannerDef(1);
  const reportParams = {
    lockfile: "package.json",
    vulns: [],
    remediations: []
  };

  // ######## GENERATE & TRACK VULNERABILITY UUIDS ########
  const idTracker = {};
  idTracker.generateName = (id, moduleName) => {
    idTracker[id] = idTracker[id] || `npm::advisory:${id}::${moduleName}`;
    return idTracker[id];
  };
  const resolvedTracker = [];

  // ######## EXTRACT REMEDIATIONS ########
  parsedData.actions.forEach((actionDef) => {
    if (actionDef.action === "install") {
      const solution = `Upgrade ${actionDef.module} to v${actionDef.target}.`;
      const UUIDs = [];
      actionDef.resolves.forEach((dep) => {
        const vulnUUID = idTracker.generateName(
          dep.id,
          parsedData.advisories[dep.id].module_name
        );
        UUIDs.push(vulnUUID);
        resolvedTracker.push(dep.id);
      });
      reportParams.remediations.push(createRemediation(solution, UUIDs));
    }
  });

  // ######## EXTRACT VULNERABILITY INFO ########
  Object.entries(parsedData.advisories).forEach(([id, advisory]) => {
    const cweID = getCWEId(advisory.cwe);

    const vulDef = createVulnDef(
      idTracker.generateName(id, advisory.module_name),
      advisory.module_name,
      advisory.title,
      advisory.overview,
      advisory.severity
    );
    vulDef.scanner = scanner;
    vulDef.location = createLocDef(
      reportParams.lockfile,
      advisory.module_name,
      advisory.vulnerable_versions
    );
    vulDef.identifiers = [
      createVulnIdentifier(
        "cwe",
        advisory.cwe,
        advisory.cwe,
        `https://cwe.mitre.org/data/definitions/${cweID}.html`
      )
    ];
    if (advisory.cves.length > 0) {
      vulDef.identifiers.unshift(
        createVulnIdentifier(
          "cve",
          advisory.cves[0],
          advisory.cves[0],
          `https://nvd.nist.gov/vuln/detail/${advisory.cves[0]}`
        )
      );
    }
    vulDef.links = [
      createVulnLink(`https://npmjs.com/advisories/${advisory.id}`)
    ];
    vulDef.solution = `Upgrade ${vulDef.name} to`;
    vulDef.solution = `${vulDef.solution} ${advisory.recommendation.replace(
      /^(?:Please )?update to /i,
      ""
    )}`;
    if (!resolvedTracker.includes(parseInt(id, 10))) {
      reportParams.remediations.push(
        createRemediation(vulDef.solution, [vulDef.id])
      );
    }
    reportParams.vulns.push(vulDef);
  });

  // ######## GENERATE REPORT FROM EXTRACTS ########
  return createGitLabReport(reportParams);
}

/**
 * Data Flow decision function to detect npm-audit-report version
 * @param {{[key]: unknown}} parsedData a JSON object adhering to `npm-audit-report` ^1.0.0 || ^2.0.0
 * @returns GitLab dependency scanning report object
 */
function convertReportForType(parsedData) {
  switch (getReportType(parsedData)) {
    case 2:
      return convertV2Report(parsedData);
    case 1:
    default:
      return convertV1Report(parsedData);
  }
}

/**
 * Entrypoint function to convert input json stream into formatted output stream
 * @param {{[key]: unknown}} data a JSON object adhering to `npm-audit-report` ^1.0.0 || ^2.0.0
 * @returns GitLab dependency scanning report object
 */
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
