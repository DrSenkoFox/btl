const API = window.HomeFitAPI;
const source = document.querySelector("#matcher-source");
const missing = document.querySelector("#matcher-missing");
const runButton = document.querySelector("#matcher-run");
const status = document.querySelector("#matcher-status");
const output = document.querySelector("#matcher-output");
const confidence = document.querySelector("#matcher-confidence");
const criteriaList = document.querySelector("#matcher-criteria");
const reasonsList = document.querySelector("#matcher-reasons");
const actions = document.querySelector("#matcher-actions");
const note = document.querySelector("#matcher-note");

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

let brief = {};
let result = null;
let cut = 0;

function normalizeText(value) {
  return String(value || "")
    .toLocaleLowerCase("vi")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d");
}

function priorityOf(text, need) {
  const normalized = normalizeText(text);
  const keyword = need.keywords
    .map(normalizeText)
    .find((item) => normalized.includes(item));
  if (!keyword) return 2;

  const sentence =
    normalized.split(/[.!?;\n,]+/).find((item) => item.includes(keyword)) ||
    normalized;
  if (/khong bat buoc|neu co|co thi tot/.test(sentence)) return 1;
  if (/bat buoc|phai co|khong the thieu|nhat dinh/.test(sentence)) return 5;
  if (/uu tien hang dau|uu tien nhat|quan trong nhat|rat quan trong/.test(sentence))
    return 4;
  if (/\bcan (?:co|phai|khong gian|mot|them|goc|gan|duoc)\b/.test(sentence)) return 3;
  if (/uu tien|quan trong|mong muon|muon/.test(sentence)) return 3;
  return 2;
}

function budgetLine(briefDraft) {
  if (!briefDraft["budget-min"] && !briefDraft["budget-max"]) return "";
  return `Ngân sách: ${briefDraft["budget-min"] || "?"} - ${briefDraft["budget-max"] || "?"} triệu`;
}

function describe(briefDraft) {
  return [
    briefDraft.title && `Bản mô tả: ${briefDraft.title}`,
    briefDraft.lifestyle && `Nhu cầu sống: ${briefDraft.lifestyle}`,
    briefDraft["must-haves"] && `Điều kiện bắt buộc: ${briefDraft["must-haves"]}`,
    budgetLine(briefDraft),
    briefDraft["preferred-area"] && `Khu vực mong muốn: ${briefDraft["preferred-area"]}`,
  ]
    .filter(Boolean)
    .join("\n");
}

function analyzeBrief(briefDraft) {
  const mustHaves = normalizeText(briefDraft["must-haves"]);
  const text = `${briefDraft.lifestyle || ""} ${briefDraft["must-haves"] || ""}`;
  const matched = lifestyleNeeds
    .map((need) => {
      const mandatory = need.keywords.some((keyword) =>
        mustHaves.includes(normalizeText(keyword)),
      );
      return { need, score: priorityOf(text, need) + (mandatory ? 5 : 0) };
    })
    .filter(({ need }) =>
      need.keywords.some((keyword) => normalizeText(text).includes(normalizeText(keyword))),
    )
    .sort((first, second) => second.score - first.score);
  if (!matched.length) return null;

  const total = matched.reduce((sum, item) => sum + item.score, 0);
  const weights = matched.map(({ score }) => Math.floor((score / total) * 100));
  const rest = 100 - weights.reduce((sum, weight) => sum + weight, 0);
  const byRemainder = matched
    .map(({ score }, index) => ({ index, remainder: ((score / total) * 100) % 1 }))
    .sort((first, second) => second.remainder - first.remainder);
  for (let index = 0; index < rest; index += 1) weights[byRemainder[index].index] += 1;

  const items = matched.map(({ need }, index) => ({
    tag: need.tag,
    label: need.label,
    guidance: need.guidance,
    keywords: need.keywords,
    weight: weights[index],
  }));
  const rotated = [...items.slice(cut % items.length), ...items.slice(0, cut % items.length)];

  return {
    criteria: rotated.map((item, index) => ({ ...item, rank: index + 1 })),
    confidence: Math.min(
      95,
      58 +
        Math.min(20, Math.round(((briefDraft.lifestyle || "").trim().length / 240) * 20)) +
        (briefDraft["budget-min"] || briefDraft["budget-max"] ? 8 : 0) +
        (mustHaves ? 9 : 0),
    ),
  };
}

function fill(target, items, create) {
  target.replaceChildren(...items.map(create));
}

function showResult(next, message) {
  result = next;
  output.hidden = false;
  actions.hidden = false;
  fill(criteriaList, next.criteria, (item) => {
    const row = document.createElement("li");
    const head = document.createElement("header");
    const name = document.createElement("span");
    name.textContent = item.label;
    const weight = document.createElement("strong");
    weight.textContent = `${item.weight}%`;
    const bar = document.createElement("p");
    bar.className = "matcher-bar";
    const fillBar = document.createElement("span");
    fillBar.style.width = `${item.weight}%`;
    bar.append(fillBar);
    head.append(name, weight);
    row.append(head, bar);
    return row;
  });
  fill(reasonsList, next.criteria, (item) => {
    const reason = document.createElement("li");
    reason.textContent = `${item.rank}. ${item.label} → ${item.guidance}`;
    return reason;
  });
  confidence.textContent = `Độ tin cậy ${next.confidence}% · ${next.criteria.length} tiêu chí`;
  status.className = "ai-status is-done";
  status.textContent = message;
}

function resetOutput(message, warn) {
  result = null;
  output.hidden = true;
  actions.hidden = true;
  status.className = warn ? "ai-status is-warn" : "ai-status";
  status.textContent = message;
}

function showNote(message) {
  note.textContent = message;
  note.hidden = !message;
}

function renderBrief() {
  brief = API.getBrief() || {};
  source.textContent = describe(brief);
  const ready = Boolean(String(brief.lifestyle || "").trim());
  missing.hidden = ready;
  runButton.disabled = !ready;
  return ready;
}

function analyze(message) {
  runButton.disabled = true;
  status.className = "ai-status is-busy";
  status.textContent = "Đang chuyển mô tả của bạn thành tiêu chí có trọng số...";
  window.setTimeout(() => {
    const scored = analyzeBrief(brief);
    runButton.disabled = !scored && !brief.lifestyle ? true : false;
    if (!scored) {
      resetOutput(
        "Chưa đủ dữ liệu để xác định tiêu chí. Hãy bổ sung mô tả chi tiết rồi phân tích lại.",
        true,
      );
      return;
    }
    showResult(scored, message);
  }, 650);
}

API.ready.then(() => {
  const ready = renderBrief();
  if (!ready) resetOutput("Chưa có mô tả nhu cầu để phân tích.");

  const saved = API.getAi("matcher");
  if (saved?.criteria?.length) {
    showResult(
      saved,
      `Đang áp dụng cho brief, lưu lúc ${new Date(saved.savedAt).toLocaleString("vi-VN")}.`,
    );
    showNote("Trang tạo brief đang dùng bộ tiêu chí và trọng số này.");
  }

  runButton.addEventListener("click", () => {
    renderBrief();
    analyze("Đã tạo · Chờ bạn xác nhận");
  });

  actions.addEventListener("click", (event) => {
    const action = event.target.closest("[data-action]")?.dataset.action;
    if (!action || !result) return;

    if (action === "accept") {
      const accepted = {
        ...result,
        savedAt: new Date().toISOString(),
      };
      API.saveAi("matcher", accepted);
      API.saveBrief({
        ...(API.getBrief() || {}),
        "weighted-priorities": result.criteria
          .map((item) => `${item.tag}: ${item.weight}%`)
          .join("\n"),
      });
      showNote("Đã lưu bộ tiêu chí và trọng số vào brief của bạn.");
      status.textContent = "Đã xác nhận và lưu vào hệ thống.";
    } else if (action === "reject") {
      API.saveAi("matcher", null);
      API.saveBrief({ ...(API.getBrief() || {}), "weighted-priorities": "" });
      resetOutput("Bạn đã từ chối gợi ý. Chỉnh mô tả trên trang brief rồi phân tích lại.");
      showNote("");
    } else if (action === "retry") {
      cut += 1;
      analyze("Bản gợi ý mới · Chờ bạn xác nhận");
      showNote("");
    }
  });
});
