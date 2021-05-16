function capitalize(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

function getCWEId(cweString) {
  return cweString.replace("CWE-", "");
}

module.exports = {
  capitalize,
  getCWEId
};
