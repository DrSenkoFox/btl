const propertyReportsStorageKey = "homefit-property-reports";

function getPropertyReports() {
  try {
    const reports = JSON.parse(
      localStorage.getItem(propertyReportsStorageKey) || "[]",
    );
    return Array.isArray(reports)
      ? reports.filter((report) => report && typeof report.id === "string")
      : [];
  } catch {
    return [];
  }
}

function storePropertyReports(reports) {
  try {
    localStorage.setItem(propertyReportsStorageKey, JSON.stringify(reports));
    return true;
  } catch {
    return false;
  }
}

function submitPropertyReport(report) {
  if (!report?.id || !report.propertyId || !report.details) return false;
  return storePropertyReports([...getPropertyReports(), report]);
}

window.HomeFitReports = Object.freeze({
  getAll: getPropertyReports,
  submit: submitPropertyReport,
});
