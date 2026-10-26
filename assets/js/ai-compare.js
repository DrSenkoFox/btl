const API = window.HomeFitAPI;
const params = new URLSearchParams(window.location.search);
const ids = (params.get("ids") || "").split(",").filter(Boolean);

const source = document.querySelector("#compare-source");
const missing = document.querySelector("#compare-missing");
const runButton = document.querySelector("#compare-run");
const status = document.querySelector("#compare-status");
const output = document.querySelector("#compare-output");
const confidence = document.querySelector("#compare-confidence");
const homesList = document.querySelector("#compare-homes");
const reasonsList = document.querySelector("#compare-reasons");
const actions = document.querySelector("#compare-actions");
const note = document.querySelector("#compare-note");

let brief = {};
let homes = [];
let result = null;
let cut = 0;

function normalizeText(value) {
  return String(value || "")
    .toLocaleLowerCase("vi")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d");
}

function tokens(text) {
  return normalizeText(text)
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length >= 3)
    .slice(0, 4);
}

function moneyOf(value) {
  const digits = Number(String(value || "").replace(/[^\d]/g, ""));
  if (!digits) return 0;
  return digits > 1000 ? Math.round(digits / 1e6) : digits;
}

function homeText(home) {
  return normalizeText(
    [
      home.title,
      home.location,
      home.description,
      home.amenities,
      home.legal,
      home.costs,
      home.furnishing,
      (home.aiReasons || []).join(" "),
    ].join(" "),
  );
}

function hasBrief() {
  return Boolean(
    String(brief.lifestyle || "").trim() ||
      String(brief["must-haves"] || "").trim() ||
      Object.keys(brief).length > 1,
  );
}

function buildCriteria() {
  const matcher = API.getAi("matcher");
  const criteria = [];
  const min = Number(brief["budget-min"]) || 0;
  const max = Number(brief["budget-max"]) || 0;
  if (min || max)
    criteria.push({
      label: `Ngân sách ${min || "?"}-${max || "?"} triệu`,
      weight: 26,
      check: (home) => {
        const price = moneyOf(home.price);
        return price && (!min || price >= min) && (!max || price <= max * 1.05);
      },
    });
  if (brief["preferred-area"]) {
    const area = normalizeText(brief["preferred-area"]);
    criteria.push({
      label: `Khu vực ${brief["preferred-area"]}`,
      weight: 20,
      check: (home) =>
        normalizeText(`${home.location} ${home.area}`).includes(area),
    });
  }
  if (brief["size-and-bedrooms"]) {
    const wanted = tokens(brief["size-and-bedrooms"]);
    criteria.push({
      label: `Diện tích / phòng ${brief["size-and-bedrooms"]}`,
      weight: 14,
      check: (home, text) =>
        wanted.some((token) => text.includes(token)),
    });
  }

  for (const item of matcher?.criteria || []) {
    const keywords = (item.keywords?.length
      ? item.keywords
      : [item.tag, item.label]
    )
      .map(normalizeText)
      .filter(Boolean);
    criteria.push({
      label: item.label,
      weight: item.weight || 10,
      check: (home, text) => keywords.some((keyword) => text.includes(keyword)),
    });
  }

  const mustHaves = String(brief["must-haves"] || "")
    .split(/[\n,;]+/)
    .map((value) => value.trim())
    .filter(Boolean);
  for (const need of mustHaves) {
    const wanted = tokens(need);
    criteria.push({
      label: need,
      weight: 18,
      check: (home, text) => wanted.some((token) => text.includes(token)),
    });
  }

  if (!criteria.length)
    criteria.push({
      label: "Mô tả nhu cầu sống",
      weight: 20,
      check: (home, text) =>
        tokens(brief.lifestyle).some((token) => text.includes(token)),
    });

  const start = cut % criteria.length;
  return [...criteria.slice(start), ...criteria.slice(0, start)];
}

function analyzeHomes() {
  const criteria = buildCriteria();
  const scored = homes.map((home) => {
    const text = homeText(home);
    const total = criteria.reduce((sum, item) => sum + item.weight, 0);
    const points = criteria.map((item) => ({
      label: item.label,
      met: Boolean(item.check(home, text)),
    }));
    const earned = criteria.reduce(
      (sum, item, index) => sum + (points[index].met ? item.weight : 0),
      0,
    );
    return {
      id: home.id,
      code: home.code || home.id,
      title: home.title || "Nhà đã lưu",
      price: home.price || "",
      location: home.location || "",
      fit: total ? Math.round((earned / total) * 100) : 0,
      matched: points.filter((point) => point.met).length,
      points,
    };
  });
  const ranking = scored.sort((first, second) => second.fit - first.fit);
  const top = ranking[0];
  const matcherCriteria = API.getAi("matcher")?.criteria || [];

  return {
    ranking,
    criteriaCount: criteria.length,
    confidence: Math.min(
      95,
      46 + criteria.length * 6 + (top?.matched ? 8 : 0) + (ranking.length >= 3 ? 6 : 0),
    ),
    reasons: [
      `Căn đứng đầu khớp ${top?.matched || 0}/${criteria.length} tiêu chí nên có điểm cao nhất.`,
      matcherCriteria.length
        ? `AI dùng ${matcherCriteria.length} tiêu chí có trọng số bạn đã chấp nhận ở AI-1.`
        : "Chưa chấp nhận kết quả AI-1 nên AI so bằng tiêu chí lấy trực tiếp từ brief.",
      `Giá từng căn được quy về triệu/tháng để đối chiếu với ngân sách ${brief["budget-min"] || "?"}-${brief["budget-max"] || "?"}.`,
      "Mọi căn được chấm trên cùng một bộ tiêu chí nên điểm so sánh trực tiếp được.",
    ],
  };
}

function describeInput() {
  const briefLines = [
    brief.title && `Brief: ${brief.title}`,
    (brief["budget-min"] || brief["budget-max"]) &&
      `Ngân sách: ${brief["budget-min"] || "?"}-${brief["budget-max"] || "?"} triệu`,
    brief["preferred-area"] && `Khu vực: ${brief["preferred-area"]}`,
    brief["must-haves"] && `Bắt buộc: ${brief["must-haves"]}`,
  ].filter(Boolean);
  const homeLines = homes.map(
    (home, index) =>
      `${index + 1}. ${home.code || home.id} · ${home.title} · ${home.price} · ${home.location}`,
  );
  return [...briefLines, ...homeLines].join("\n");
}

function fill(target, items, create) {
  target.replaceChildren(...items.map(create));
}

function showResult(next, message) {
  result = next;
  output.hidden = false;
  actions.hidden = false;
  fill(homesList, next.ranking, (home, index) => {
    const row = document.createElement("li");
    if (!index && home.fit) row.dataset.top = "1";

    const head = document.createElement("header");
    const name = document.createElement("span");
    name.textContent = `${index + 1}. ${home.title} · ${home.price}`;
    const score = document.createElement("strong");
    score.textContent = `${home.fit}%`;
    head.append(name, score);

    const bar = document.createElement("p");
    bar.className = "compare-bar";
    const barFill = document.createElement("span");
    barFill.style.width = `${home.fit}%`;
    bar.append(barFill);

    const points = document.createElement("ul");
    points.className = "compare-points";
    points.append(
      ...home.points.map((point) => {
        const item = document.createElement("li");
        item.textContent = `${point.met ? "Đạt" : "Chưa đạt"} · ${point.label}`;
        return item;
      }),
    );

    row.append(head, bar, points);
    return row;
  });
  fill(
    reasonsList,
    next.reasons,
    (reason) => {
      const item = document.createElement("li");
      item.textContent = reason;
      return item;
    },
  );
  confidence.textContent = `Độ tin cậy ${next.confidence}% · ${next.ranking.length} căn · ${next.criteriaCount} tiêu chí`;
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

function showMissing(message) {
  missing.textContent = message;
  missing.hidden = !message;
  runButton.disabled = Boolean(message);
  return !message;
}

function renderInput() {
  brief = API.getBrief() || {};
  const saved = API.getSaved();
  homes = ids.length ? saved.filter((home) => ids.includes(home.id)) : saved;
  source.textContent = describeInput();

  if (!hasBrief())
    return showMissing(
      "Chưa có brief nên AI chưa có tiêu chí để so sánh. Hãy tạo brief rồi mở lại trang này.",
    );
  if (homes.length < 2)
    return showMissing(
      `Mới có ${homes.length} căn được lưu. AI cần ít nhất 2 căn để so sánh.`,
    );
  return showMissing("");
}

function analyze(message) {
  runButton.disabled = true;
  status.className = "ai-status is-busy";
  status.textContent = "Đang đối chiếu các căn đã lưu với tiêu chí brief...";
  window.setTimeout(() => {
    runButton.disabled = false;
    showResult(analyzeHomes(), message);
  }, 650);
}

API.ready.then(() => {
  const ready = renderInput();
  if (!ready) resetOutput("Chưa đủ dữ liệu để so sánh.", true);

  const saved = API.getAi("compare");
  if (saved?.ranking?.length) {
    showResult(
      saved,
      `Kết quả đã lưu lúc ${new Date(saved.savedAt).toLocaleString("vi-VN")}.`,
    );
    showNote("Trang nhà đã lưu đang hiển thị kết quả so sánh này.");
  }

  runButton.addEventListener("click", () => {
    renderInput();
    analyze("Đã tạo · Chờ bạn xác nhận");
  });

  actions.addEventListener("click", (event) => {
    const action = event.target.closest("[data-action]")?.dataset.action;
    if (!action || !result) return;

    if (action === "accept") {
      API.saveAi("compare", {
        ...result,
        savedAt: new Date().toISOString(),
      });
      showNote("Đã lưu kết quả so sánh cho trang nhà đã lưu.");
      status.textContent = "Đã xác nhận và lưu vào hệ thống.";
    } else if (action === "reject") {
      API.saveAi("compare", null);
      resetOutput(
        "Bạn đã từ chối kết quả. Chỉnh brief hoặc danh sách nhà đã lưu rồi so sánh lại.",
        true,
      );
      showNote("");
    } else if (action === "retry") {
      cut += 1;
      analyze("Bản so sánh mới · Chờ bạn xác nhận");
      showNote("");
    }
  });
});
