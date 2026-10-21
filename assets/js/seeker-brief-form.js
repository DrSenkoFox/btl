const lifestyleInput = document.querySelector("#lifestyle");
const needTags = document.querySelector("#need-tags");
const matcherStatus = document.querySelector("#matcher-status");
const analyzeButton = document.querySelector("#analyze-lifestyle");
const matcherResult = document.querySelector("#matcher-result");
const matcherSummary = document.querySelector("#matcher-summary");
const matcherEmpty = document.querySelector("#matcher-empty");
const matcherReasons = document.querySelector("#matcher-reasons");
const weightedPrioritiesInput = document.querySelector("#weighted-priorities");
const mustHavesInput = document.querySelector("#must-haves");
const weightedPrioritiesGroup = document.querySelector(
  "#weighted-priorities-group",
);
const weightedPrioritiesResults = document.querySelector(
  "#weighted-priorities-results",
);
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
  const draft = Object.fromEntries(new FormData(briefForm).entries());
  sessionStorage.setItem("homefit-brief-draft", JSON.stringify(draft));
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
  sessionStorage.removeItem("homefit-brief-archived");
  sessionStorage.removeItem(briefLeadKey);
  needTags.replaceChildren();
  clearGeneratedCriteria();
  matcherResult.hidden = true;
  matcherStatus.textContent = "Nhập nhu cầu sinh hoạt để bắt đầu phân tích.";
  analyzeButton.disabled = true;
  briefExists = false;
  updateBriefActions();
  showBriefActionStatus("Brief đã được xóa.");
  window.HomeFitNavigation.recordNotification(
    window.HomeFitNavigation.events.briefDeleted,
  );
});

const lifestyleNeeds = [
  {
    label: "Ưu tiên không gian yên tĩnh",
    tag: "Yên tĩnh",
    keywords: ["yên tĩnh", "ít tiếng ồn", "không ồn", "riêng tư"],
    guidance: "ưu tiên hướng nội khu, tránh trục đường lớn.",
  },
  {
    label: "Ưu tiên ánh sáng tự nhiên",
    tag: "Ánh sáng",
    keywords: ["ánh sáng", "nhiều sáng", "cửa sổ", "ban công", "thoáng"],
    guidance: "chọn nhà có cửa sổ hoặc ban công đón sáng.",
  },
  {
    label: "Phù hợp gia đình có trẻ nhỏ",
    tag: "Gia đình",
    keywords: ["gia đình", "trẻ em", "con nhỏ", "em bé", "con "],
    guidance: "ưu tiên không gian sinh hoạt thuận tiện cho cả gia đình.",
  },
  {
    label: "Gần trường học",
    tag: "Gần trường",
    keywords: ["trường học", "gần trường", "đưa đón con", "đi bộ đến trường"],
    guidance: "tìm khu vực có trường học trong khoảng cách tiện đưa đón.",
  },
  {
    label: "Thân thiện với thú cưng",
    tag: "Thú cưng",
    keywords: ["thú cưng", "chó", "mèo", "nuôi thú"],
    guidance: "kiểm tra quy định nuôi thú cưng và không gian đi dạo gần nhà.",
  },
  {
    label: "Ưu tiên không gian xanh",
    tag: "Không gian xanh",
    keywords: ["cây xanh", "công viên", "nhiều cây"],
    guidance: "ưu tiên nơi gần công viên hoặc có mảng xanh.",
  },
  {
    label: "Không gian làm việc tại nhà",
    tag: "WFH",
    keywords: ["làm việc tại nhà", "wfh", "góc làm việc"],
    guidance: "ưu tiên góc làm việc riêng, đủ yên tĩnh và ánh sáng.",
  },
  {
    label: "Thuận tiện đi lại",
    tag: "Đi lại",
    keywords: ["đi làm", "gần công ty", "metro", "xe buýt", "giao thông"],
    guidance: "cân nhắc kết nối giao thông tới nơi làm việc.",
  },
  {
    label: "Gần tiện ích thiết yếu",
    tag: "Tiện ích",
    keywords: ["siêu thị", "chợ", "bệnh viện", "trung tâm thương mại"],
    guidance: "ưu tiên tiện ích thiết yếu ở khoảng cách gần.",
  },
];

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

function normalizeText(value) {
  return value
    .toLocaleLowerCase("vi")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d");
}

function getNeedPriority(description, need) {
  const normalizedDescription = normalizeText(description);
  const keyword = need.keywords
    .map(normalizeText)
    .find((item) => normalizedDescription.includes(item));
  if (!keyword) return 2;

  const sentence =
    normalizedDescription
      .split(/[.!?;\n,]+/)
      .find((item) => item.includes(keyword)) || normalizedDescription;

  if (/khong bat buoc|neu co|co thi tot/.test(sentence)) return 1;
  if (/bat buoc|phai co|khong the thieu|nhat dinh/.test(sentence)) return 5;
  if (
    /uu tien hang dau|uu tien nhat|quan trong nhat|rat quan trong/.test(
      sentence,
    )
  )
    return 4;
  if (/\bcan (?:co|phai|khong gian|mot|them|goc|gan|duoc)\b/.test(sentence))
    return 3;
  if (/uu tien|quan trong|mong muon|muon/.test(sentence)) return 3;
  return 2;
}

function renderGeneratedCriteria(description, matchedNeeds) {
  const normalizedMustHaves = normalizeText(mustHavesInput.value);
  const priorities = matchedNeeds.map((need) => {
    const isMandatory = need.keywords.some((keyword) =>
      normalizedMustHaves.includes(normalizeText(keyword)),
    );

    return {
      need,
      score: getNeedPriority(description, need) + (isMandatory ? 5 : 0),
    };
  });
  const totalScore = priorities.reduce((total, item) => total + item.score, 0);
  const weights = priorities.map(({ score }) =>
    Math.floor((score / totalScore) * 100),
  );
  const remainingWeight =
    100 - weights.reduce((total, weight) => total + weight, 0);
  const roundingOrder = priorities
    .map(({ score }, index) => ({
      index,
      remainder: ((score / totalScore) * 100) % 1,
    }))
    .sort((first, second) => second.remainder - first.remainder);

  for (let index = 0; index < remainingWeight; index += 1) {
    weights[roundingOrder[index].index] += 1;
  }

  weightedPrioritiesInput.value = priorities
    .map(({ need }, index) => `${need.tag}: ${weights[index]}%`)
    .join("\n");

  needTags.replaceChildren(
    ...priorities.map(({ need }) => {
      const item = document.createElement("li");
      item.className = "need-tag";
      item.textContent = need.tag;
      return item;
    }),
  );
  needTags.hidden = false;
  weightedPrioritiesResults.replaceChildren(
    ...priorities.map(({ need }, index) => {
      const item = document.createElement("li");
      item.textContent = `${need.tag} ${weights[index]}%`;
      return item;
    }),
  );
  weightedPrioritiesGroup.hidden = false;
  storeBriefDraft();
}

function clearGeneratedCriteria() {
  weightedPrioritiesInput.value = "";
  needTags.replaceChildren();
  needTags.hidden = true;
  weightedPrioritiesResults.replaceChildren();
  weightedPrioritiesGroup.hidden = true;
}

function analyzeLifestyle() {
  const description = lifestyleInput.value.trim();
  const normalizedDescription = normalizeText(description);
  const normalizedMustHaves = normalizeText(mustHavesInput.value);
  const matchedNeeds = lifestyleNeeds.filter((need) =>
    need.keywords.some(
      (keyword) =>
        normalizedDescription.includes(normalizeText(keyword)) ||
        normalizedMustHaves.includes(normalizeText(keyword)),
    ),
  );

  if (!description) {
    clearGeneratedCriteria();
    matcherStatus.textContent = "Hãy nhập mô tả nhu cầu trước khi phân tích.";
    matcherResult.hidden = true;
  } else if (matchedNeeds.length) {
    renderGeneratedCriteria(description, matchedNeeds);
    matcherStatus.textContent = "Đã tạo · Chờ bạn xác nhận";
    matcherResult.dataset.state = "suggestions";
    matcherEmpty.hidden = true;
    matcherSummary.textContent = `Đã chuyển mô tả thành ${matchedNeeds.length} tiêu chí ưu tiên`;
    matcherReasons.replaceChildren(
      ...matchedNeeds.map((need) => {
        const reason = document.createElement("li");
        reason.textContent = `${need.label} → ${need.guidance}`;
        return reason;
      }),
    );
    matcherResult.hidden = false;
  } else {
    clearGeneratedCriteria();
    matcherStatus.textContent = "Đã phân tích · Chưa có gợi ý";
    matcherResult.dataset.state = "empty";
    matcherSummary.textContent = "Chưa có gợi ý cho mô tả này";
    matcherEmpty.textContent =
      "Thông tin hiện tại chưa đủ để xác định tiêu chí phù hợp. Bạn có thể bổ sung chi tiết rồi phân tích lại.";
    matcherEmpty.hidden = false;
    matcherResult.hidden = false;
  }
}

lifestyleInput?.addEventListener("input", () => {
  analyzeButton.disabled = lifestyleInput.value.trim().length < 30;
  clearGeneratedCriteria();
  if (!matcherResult.hidden) {
    matcherResult.hidden = true;
    matcherEmpty.hidden = true;
    matcherStatus.textContent =
      "Nội dung đã thay đổi. Hãy phân tích lại để cập nhật gợi ý.";
  }
});
mustHavesInput?.addEventListener("input", () => {
  clearGeneratedCriteria();
  if (!matcherResult.hidden) {
    matcherResult.hidden = true;
    matcherEmpty.hidden = true;
    matcherStatus.textContent =
      "Nội dung đã thay đổi. Hãy phân tích lại để cập nhật gợi ý.";
  }
});
analyzeButton?.addEventListener("click", analyzeLifestyle);

document
  .querySelector(".matcher-actions")
  ?.addEventListener("click", (event) => {
    const action = event.target.closest("[data-matcher-action]")?.dataset
      .matcherAction;

    if (action === "accept") {
      matcherStatus.textContent = "Đã xác nhận gợi ý.";
    } else if (action === "edit") {
      lifestyleInput.focus();
    } else if (action === "reject") {
      matcherResult.hidden = true;
      clearGeneratedCriteria();
      matcherStatus.textContent =
        "Bạn đã từ chối gợi ý. Hãy chỉnh mô tả để phân tích lại.";
    } else if (action === "retry") {
      analyzeLifestyle();
    } else if (action === "save") {
      sessionStorage.setItem(
        "homefit-lifestyle-suggestion",
        JSON.stringify({
          description: lifestyleInput.value.trim(),
          priorities: [...matcherReasons.children].map(
            (item) => item.textContent,
          ),
        }),
      );
      matcherStatus.textContent = "Đã lưu kết quả trong phiên này.";
    }
  });
