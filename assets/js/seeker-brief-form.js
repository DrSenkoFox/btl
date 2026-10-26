const matcherStatus = document.querySelector("#matcher-status");
const matcherResult = document.querySelector("#matcher-result");
const matcherSummary = document.querySelector("#matcher-summary");
const matcherReasons = document.querySelector("#matcher-reasons");
const budgetMin = document.querySelector("#budget-min");
const budgetMax = document.querySelector("#budget-max");
const briefForm = document.querySelector("#brief-form");
const briefStatus = document.querySelector("#brief-status");
const sentAt = document.querySelector("#sent-at");
const briefNumber = document.querySelector("#brief-number");
const submitBriefButton = document.querySelector("#submit-brief");
const saveDraftButton = document.querySelector("#save-brief-draft");
const archiveBriefButton = document.querySelector("#archive-brief");
const deleteBriefButton = document.querySelector("#delete-brief");
const briefActionStatus = document.querySelector("#brief-action-status");
const agentNotSelected = document.querySelector("#agent-not-selected");
const selectedAgentCard = document.querySelector(".selected-agent");
const selectedAgentInitials = document.querySelector(
  "#selected-agent-initials",
);
const selectedAgentName = document.querySelector("#selected-agent-name");
const selectedAgentVerified = document.querySelector(
  "#selected-agent-verified",
);
const selectedAgentMeta = document.querySelector("#selected-agent-meta");
const agentConsent = document.querySelector("#agent-consent");
const matcherWarning = document.querySelector(".matcher-warning");
const briefSidebar = document.querySelector(".brief-sidebar");
const briefLayout = document.querySelector(".brief-layout");

function updateBriefLayout() {
  const submissionSection = document
    .querySelector("#agent-heading")
    ?.closest(".form-section");

  if (window.innerWidth <= 760) {
    submissionSection?.before(briefSidebar);
  } else {
    briefLayout.append(briefSidebar);
  }
}

function updateMatcherWarning() {
  const inputFields = briefForm.querySelectorAll(
    "input:not([type='hidden']):not([type='checkbox']):not([type='radio']), textarea",
  );
  const hasEnteredValue = [...inputFields].some(
    (field) => field.value.trim() !== "",
  );

  matcherWarning.hidden = !hasEnteredValue;
}

window.addEventListener("resize", () => updateBriefLayout());
updateBriefLayout();

let briefExists =
  Boolean(briefNumber.textContent.trim()) || !briefStatus.hidden;
let selectedAgent = null;

const agentRequestsKey = "homefit-agent-requests";
const briefLeadKey = "homefit-brief-lead-id";
const viewParams = new URLSearchParams(window.location.search);
const viewedRequest = viewParams.get("view")
  ? readAgentRequests().find((r) => r.id === viewParams.get("briefId"))
  : null;

function restoreSelectedAgent() {
  try {
    selectedAgent = JSON.parse(
      sessionStorage.getItem("homefit-selected-agent") || "null",
    );
  } catch {
    selectedAgent = null;
  }

  const hasAgent = Boolean(selectedAgent?.id && selectedAgent?.name);
  agentNotSelected.hidden = hasAgent;
  selectedAgentCard.hidden = !hasAgent;
  agentConsent.closest(".brief-consent").hidden = !hasAgent;
  agentConsent.disabled = !hasAgent;

  if (hasAgent) {
    selectedAgentInitials.textContent = selectedAgent.initials;
    selectedAgentName.textContent = selectedAgent.name;
    selectedAgentVerified.hidden = !selectedAgent.verified;
    selectedAgentMeta.textContent = selectedAgent.meta;
  }
}

function updateBriefActions() {
  submitBriefButton.textContent = briefExists
    ? "Gửi bản cập nhật"
    : "Gửi brief";
  submitBriefButton.disabled = !selectedAgent || !agentConsent.checked;
  archiveBriefButton.disabled = !briefExists;
  deleteBriefButton.disabled = !briefExists;
}

function showBriefActionStatus(message) {
  briefActionStatus.textContent = message;
  briefActionStatus.hidden = false;
}

function storeBriefDraft() {
  const draft = JSON.stringify(
    Object.fromEntries(new FormData(briefForm).entries()),
  );
  sessionStorage.setItem("homefit-brief-draft", draft);
  localStorage.setItem("homefit-brief-draft", draft);
}

function handleBriefChange() {
  storeBriefDraft();
  updateMatcherWarning();
}

briefForm?.addEventListener("input", handleBriefChange);
briefForm?.addEventListener("change", handleBriefChange);
updateMatcherWarning();

restoreSelectedAgent();
updateBriefActions();
applyBriefViewMode();
agentConsent.addEventListener("change", updateBriefActions);

function validateBudgetRange() {
  const hasBothBudgets = budgetMin.value !== "" && budgetMax.value !== "";
  const invalidRange =
    hasBothBudgets && Number(budgetMax.value) < Number(budgetMin.value);
  budgetMax.setCustomValidity(
    invalidRange ? "Ngân sách tối đa phải từ mức tối thiểu trở lên." : "",
  );
}

budgetMin?.addEventListener("input", validateBudgetRange);
budgetMax?.addEventListener("input", validateBudgetRange);

briefForm?.addEventListener("submit", (event) => {
  event.preventDefault();
  storeBriefDraft();
  const eventType = briefExists
    ? window.HomeFitNavigation.events.briefEdited
    : window.HomeFitNavigation.events.briefSubmitted;

  const submittedAt = new Date();
  sentAt.dateTime = submittedAt.toISOString();
  sentAt.textContent = new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(submittedAt);
  briefStatus.hidden = false;
  briefExists = true;
  updateBriefActions();
  showBriefActionStatus("Brief đã được gửi.");
  window.HomeFitNavigation.recordNotification(eventType);
  sendBriefToBroker();
});

saveDraftButton?.addEventListener("click", () => {
  storeBriefDraft();
  showBriefActionStatus("Đã lưu nháp trong phiên này.");
});

archiveBriefButton?.addEventListener("click", () => {
  if (!briefExists) return;

  sessionStorage.setItem("homefit-brief-archived", "true");
  showBriefActionStatus("Brief đã được lưu trữ trong phiên này.");
});

deleteBriefButton?.addEventListener("click", () => {
  if (
    !briefExists ||
    !window.confirm("Bạn có chắc muốn xóa brief này không?")
  ) {
    return;
  }

  briefForm.reset();
  updateMatcherWarning();
  briefNumber.textContent = "";
  briefStatus.hidden = true;
  sessionStorage.removeItem("homefit-brief-draft");
  localStorage.removeItem("homefit-brief-draft");
  sessionStorage.removeItem("homefit-brief-archived");
  sessionStorage.removeItem(briefLeadKey);
  window.HomeFitAPI.saveAi("matcher", null);
  renderMatcherResult();
  briefExists = false;
  updateBriefActions();
  showBriefActionStatus("Brief đã được xóa.");
  window.HomeFitNavigation.recordNotification(
    window.HomeFitNavigation.events.briefDeleted,
  );
});

function readAgentRequests() {
  try {
    const arr = JSON.parse(localStorage.getItem(agentRequestsKey) || "[]");
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function sendBriefToBroker() {
  const reqs = readAgentRequests();
  const number =
    reqs.reduce(
      (max, r) => Math.max(max, Number(String(r.id).slice(2)) || 0),
      24,
    ) + 1;
  const code = String(number).padStart(3, "0");
  const leadCode = `L-${code}`;
  const id = reqs.some((r) => r.id === sessionStorage.getItem(briefLeadKey))
    ? sessionStorage.getItem(briefLeadKey)
    : leadCode;
  const sentAtIso = new Date().toISOString();
  const brief = Object.fromEntries(new FormData(briefForm).entries());
  const summary = brief.lifestyle || "";
  const request = {
    id,
    leadCode: id,
    briefCode: `B-${id.slice(2)}`,
    clientName: brief.title || "Gia đình tìm nhà",
    familyInfo: `Gia đình ${brief["household-size"] || "?"} người`,
    source: `B-${id.slice(2)}`,
    status: "new",
    email: brief.email || "",
    phone: brief.phone || "",
    brokerName: selectedAgent?.name || defaultBrokerName,
    consent: true,
    createdAt: sentAtIso,
    updatedAt: sentAtIso,
    briefSummary: summary,
    note: "",
    history: [`${fmtBriefDate(sentAtIso)} — ${brief.title || "Khách"} gửi B-${id.slice(2)}`],
    brief,
  };
  const index = reqs.findIndex((r) => r.id === id);
  if (index < 0) reqs.unshift(request);
  else reqs[index] = { ...reqs[index], ...request, status: reqs[index].status };
  localStorage.setItem(agentRequestsKey, JSON.stringify(reqs));
  sessionStorage.setItem(briefLeadKey, id);
}

function fmtBriefDate(iso) {
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, "0");
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)} • ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function applyBriefViewMode() {
  if (!viewedRequest) return;
  document.body.classList.add("brief-view-mode");
  document.getElementById("brief-back").hidden = false;
  briefNumber.textContent = viewedRequest.id;
  for (const [name, value] of Object.entries(viewedRequest.brief || {})) {
    const field = briefForm.elements[name];
    if (field) field.value = value;
  }
  selectedAgentName.textContent = viewedRequest.brokerName || "—";
  selectedAgentCard.hidden = !viewedRequest.brokerName;
  agentNotSelected.hidden = true;
  briefStatus.hidden = false;
  document.getElementById("recipient-name").textContent = viewedRequest.brokerName || "";
  sentAt.dateTime = viewedRequest.createdAt;
  sentAt.textContent = new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(viewedRequest.createdAt));
  briefForm
    .querySelectorAll("input, textarea, select, button")
    .forEach((el) => el.setAttribute("disabled", ""));
}

function createTextElement(tagName, text) {
  const element = document.createElement(tagName);
  element.textContent = text;
  return element;
}

function renderMatcherResult() {
  const criteria = window.HomeFitAPI.getAi("matcher")?.criteria || [];

  matcherResult.hidden = !criteria.length;
  matcherStatus.textContent = criteria.length
    ? `Đã áp dụng ${criteria.length} tiêu chí có trọng số từ trang AI.`
    : "Chưa có kết quả AI. Mở trang AI để phân tích mô tả nhu cầu.";
  if (!criteria.length) return;

  matcherSummary.textContent = `Brief đang dùng ${criteria.length} tiêu chí ưu tiên`;
  matcherReasons.replaceChildren(
    ...criteria.map((item) =>
      createTextElement(
        "li",
        `${item.rank}. ${item.label} · ${item.weight}% → ${item.guidance}`,
      ),
    ),
  );
}

window.addEventListener("storage", renderMatcherResult);
window.addEventListener("pageshow", renderMatcherResult);
renderMatcherResult();

