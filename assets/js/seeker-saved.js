const savedHouseList = document.querySelector("#saved-house-list");
const savedEmptyState = document.querySelector("#saved-empty-state");
const savedSummary = document.querySelector("#saved-summary");
const comparisonColumns = document.querySelector("#comparison-columns");
const comparisonRows = document.querySelector("#comparison-rows");
const comparisonScroll = document.querySelector(".saved-comparison__scroll");
const comparisonEmpty = document.querySelector("#comparison-empty");
const compareOpen = document.querySelector("#compare-open");
const briefLinks = document.querySelectorAll(
  'main a[href="seeker-brief-form.html"]',
);
const prioritiesList = document.querySelector("#saved-priorities-list");
const prioritiesEmpty = document.querySelector("#priorities-empty");
const assistantStatus = document.querySelector("#assistant-status");
const assistantRanking = document.querySelector("#assistant-ranking");

const dataRows = [
  ["Giá thuê / tháng", (home) => home.price],
  [
    "Diện tích / phòng",
    (home) => [home.size, home.bedrooms].filter(Boolean).join(" · "),
  ],
  ["Vị trí", (home) => home.location],
  ["Tiện ích", (home) => home.amenities],
  ["Pháp lý", (home) => home.legal],
];

function createTextElement(tagName, className, text) {
  const element = document.createElement(tagName);
  if (className) element.className = className;
  element.textContent = text || "";
  return element;
}

function renderCards(savedHomes) {
  savedHouseList.replaceChildren();
  savedSummary.textContent = `${savedHomes.length} căn đã lưu · So sánh theo tiêu chí của bạn.`;
  savedEmptyState.hidden = savedHomes.length > 0;

  for (const home of savedHomes) {
    const item = document.createElement("li");
    const card = document.createElement("article");
    card.className = "saved-house-card";

    if (home.image) {
      const image = document.createElement("img");
      image.src = home.image;
      image.alt = home.title ? `Ảnh ${home.title}` : "Ảnh nhà đã lưu";
      image.loading = "lazy";
      card.append(image);
    }

    const metadata = createTextElement(
      "p",
      "saved-house-card__id",
      home.code || home.id,
    );
    const removeButton = createTextElement(
      "button",
      "saved-house-card__remove",
      "Bỏ căn",
    );
    removeButton.type = "button";
    removeButton.setAttribute(
      "aria-label",
      `Xóa ${home.title || "nhà này"} khỏi danh sách lưu`,
    );
    removeButton.addEventListener("click", () => {
      window.HomeFitSavedHomes.remove(home.id);
    });

    const cardMeta = document.createElement("header");
    cardMeta.className = "saved-house-card__meta";
    cardMeta.append(metadata, removeButton);

    card.append(
      cardMeta,
      createTextElement("h3", "", home.title || "Nhà đã lưu"),
      createTextElement("p", "saved-house-card__price", home.price),
      createTextElement("p", "saved-house-card__location", home.location),
    );
    item.append(card);
    savedHouseList.append(item);
  }
}

function renderTable(savedHomes, compare) {
  const scored = Object.fromEntries(
    (compare?.ranking || []).map((home) => [home.id, home]),
  );
  const aiRows = (compare?.ranking?.[0]?.points || []).map((point, index) => [
    point.label,
    (home) =>
      scored[home.id]?.points[index]?.met ? "Đạt" : "Chưa đạt",
  ]);

  comparisonColumns.replaceChildren(
    createTextElement("th", "", "Tiêu chí"),
    ...savedHomes.map((home) => {
      const column = createTextElement("th", "", home.title || "Nhà đã lưu");
      column.scope = "col";
      return column;
    }),
  );

  comparisonRows.replaceChildren(
    ...[
      ...dataRows,
      ...aiRows,
      [
        "Điểm phù hợp theo brief",
        (home) => (scored[home.id] ? `${scored[home.id].fit}%` : "Chờ AI"),
      ],
    ].map(([label, getValue]) => {
      const row = document.createElement("tr");
      const name = createTextElement("th", "", label);
      name.scope = "row";
      row.append(
        name,
        ...savedHomes.map((home) =>
          createTextElement("td", "", getValue(home)),
        ),
      );
      return row;
    }),
  );

  comparisonScroll.hidden = !savedHomes.length;
  comparisonEmpty.hidden = !savedHomes.length || Boolean(compare);
}

function renderAssistant(savedHomes, compare) {
  const hasBrief = window.HomeFitBrief?.exists() || false;

  assistantRanking.replaceChildren(
    ...(compare?.ranking || []).map((home) =>
      createTextElement(
        "li",
        "",
        `${home.code} · ${home.title} · ${home.fit}%`,
      ),
    ),
  );
  assistantRanking.hidden = !compare;

  if (!hasBrief) {
    assistantStatus.textContent =
      "Chưa có brief. Hãy tạo brief để AI có tiêu chí so sánh các căn đã lưu.";
  } else if (compare) {
    assistantStatus.textContent = `${compare.ranking.length} căn đã xếp hạng theo ${compare.criteriaCount} tiêu chí · Độ tin cậy ${compare.confidence}%.`;
  } else {
    assistantStatus.textContent = savedHomes.length
      ? `${savedHomes.length} căn đã lưu, chờ kết quả so sánh từ trang AI.`
      : "Lưu nhà để bắt đầu so sánh theo ưu tiên cá nhân.";
  }

  compareOpen.href = `ai-compare.html?ids=${savedHomes
    .map((home) => home.id)
    .join(",")}`;
}

function renderPriorities() {
  const brief = window.HomeFitBrief?.get() || {};

  const priorities = [
    brief["weighted-priorities"],
    brief["must-haves"],
    brief.lifestyle,
  ]
    .flatMap((value) =>
      typeof value === "string" ? value.split(/[\n,;]+/) : [],
    )
    .map((value) => value.trim())
    .filter(Boolean);

  prioritiesList.replaceChildren(
    ...[...new Set(priorities)].map((priority) =>
      createTextElement("li", "", priority),
    ),
  );
  prioritiesList.hidden = priorities.length === 0;
  prioritiesEmpty.hidden = priorities.length > 0;
  for (const link of briefLinks) {
    link.textContent = window.HomeFitBrief?.exists()
      ? "Cập nhật brief"
      : "Tạo brief";
  }
}

function renderSavedHomes() {
  const savedHomes = window.HomeFitSavedHomes.getAll();
  const compare = window.HomeFitAPI?.getAi("compare");

  renderCards(savedHomes);
  renderTable(savedHomes, compare);
  renderPriorities();
  renderAssistant(savedHomes, compare);
}

window.addEventListener("homefit:saved-homes-change", renderSavedHomes);
window.addEventListener("storage", renderSavedHomes);
window.addEventListener("pageshow", renderSavedHomes);
renderSavedHomes();
