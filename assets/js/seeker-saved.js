const savedHouseList = document.querySelector("#saved-house-list");
const savedEmptyState = document.querySelector("#saved-empty-state");
const savedSummary = document.querySelector("#saved-summary");
const comparisonColumns = document.querySelector("#comparison-columns");
const comparisonRows = document.querySelectorAll("[data-criterion]");
const comparisonScroll = document.querySelector(".saved-comparison__scroll");
const comparisonEmpty = document.querySelector("#comparison-empty");
const briefLinks = document.querySelectorAll(
  'main a[href="seeker-brief-form.html"]',
);
const prioritiesList = document.querySelector("#saved-priorities-list");
const prioritiesEmpty = document.querySelector("#priorities-empty");
const assistantStatus = document.querySelector("#assistant-status");

function createTextElement(tagName, className, text) {
  const element = document.createElement(tagName);
  if (className) element.className = className;
  element.textContent = text || "";
  return element;
}

function renderSavedHomes() {
  const savedHomes = window.HomeFitSavedHomes.getAll();
  const hasBrief = window.HomeFitBrief?.exists() || false;
  savedHouseList.replaceChildren();
  comparisonColumns.replaceChildren(createTextElement("th", "", "Tiêu chí"));

  for (const row of comparisonRows) {
    row.querySelectorAll("td").forEach((cell) => cell.remove());
  }

  savedSummary.textContent = `${savedHomes.length} căn đã lưu · So sánh theo tiêu chí của bạn.`;
  savedEmptyState.hidden = savedHomes.length > 0;

  const criterionValues = {
    price: (home) => home.price,
    area: (home) => [home.size, home.bedrooms].filter(Boolean).join(" · "),
    location: (home) => home.location,
    amenities: (home) => home.amenities,
    quiet: (home) => home.quiet,
    school: (home) => home.school,
    wfh: (home) => home.wfh,
    legal: (home) => home.legal,
    fit: (home) => home.fitScore,
  };

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

    const title = createTextElement("h3", "", home.title || "Nhà đã lưu");
    const price = createTextElement("p", "saved-house-card__price", home.price);
    const location = createTextElement(
      "p",
      "saved-house-card__location",
      home.location,
    );

    card.append(cardMeta, title, price, location);
    item.append(card);
    savedHouseList.append(item);

    const column = createTextElement("th", "", home.title || "Nhà đã lưu");
    column.scope = "col";
    comparisonColumns.append(column);

    for (const row of comparisonRows) {
      const getValue = criterionValues[row.dataset.criterion];
      const cell = createTextElement("td", "", getValue?.(home));
      row.append(cell);
    }
  }

  renderPriorities();
  comparisonScroll.hidden = !hasBrief;
  comparisonEmpty.hidden = hasBrief;
  assistantStatus.textContent = !hasBrief
    ? "Chưa có brief. Hãy tạo brief để bắt đầu đánh giá và so sánh theo ưu tiên của bạn."
    : savedHomes.length
      ? `${savedHomes.length} căn nhà đã sẵn sàng để đối chiếu theo brief của bạn.`
      : "Lưu nhà để bắt đầu so sánh theo ưu tiên cá nhân.";
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

window.addEventListener("homefit:saved-homes-change", renderSavedHomes);
window.addEventListener("storage", renderSavedHomes);
window.addEventListener("pageshow", renderSavedHomes);
renderSavedHomes();
