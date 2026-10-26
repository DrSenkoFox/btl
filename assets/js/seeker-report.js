const reportForm = document.querySelector("#property-report-form");
const reportProperty = document.querySelector("#report-property");
const reportBack = document.querySelector("#report-back");
const reportPropertyId = new URLSearchParams(window.location.search).get("id");
let selectedProperty = null;

try {
  selectedProperty = JSON.parse(
    sessionStorage.getItem("homefit-selected-home") || "null",
  );
} catch {
  selectedProperty = null;
}

if (!selectedProperty || selectedProperty.id !== reportPropertyId) {
  selectedProperty = window.HomeFitSavedHomes?.getAll().find(
    (home) => home.id === reportPropertyId,
  );
}

if (selectedProperty) {
  reportProperty.textContent = `${selectedProperty.title || "Bài đăng"} · ${selectedProperty.code || selectedProperty.id}`;
  reportBack.href = `seeker-detail.html?id=${encodeURIComponent(selectedProperty.id)}`;
} else {
  reportProperty.textContent = "Chưa xác định được bài đăng được báo cáo.";
}

reportForm.addEventListener("submit", (event) => {
  event.preventDefault();
  if (!selectedProperty || !window.HomeFitReports) return;

  const report = {
    id: window.crypto?.randomUUID?.() || `report-${Date.now()}`,
    propertyId: selectedProperty.id,
    propertyTitle: selectedProperty.title || "Bài đăng",
    propertyCode: selectedProperty.code || selectedProperty.id,
    details: new FormData(reportForm).get("details").trim(),
    submittedAt: new Date().toISOString(),
    status: "pending",
  };

  if (!window.HomeFitReports.submit(report)) {
    document.querySelector("#report-status").textContent =
      "Chưa thể lưu báo cáo. Vui lòng thử lại.";
    return;
  }

  window.location.href = `moderator-reports.html?reportId=${encodeURIComponent(report.id)}`;
});
