function capitalize(str) {
  if (typeof str !== "string") {
    throw new Error(
      `Parameter mixmatch: expected string, not '${typeof str}'.`
    );
  }
  const char = str.length > 0 ? str.charAt(0).toUpperCase() : str;
  return str.length > 1 ? `${char}${str.slice(1)}` : char;
}

function getCWEId(cweString) {
  return cweString.replace("CWE-", "");
}

module.exports = {
  capitalize,
  getCWEId
};
