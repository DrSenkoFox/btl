const savedHouseList = document.querySelector("#saved-house-list");
const savedEmptyState = document.querySelector("#saved-empty-state");
const savedSummary = document.querySelector("#saved-summary");
const savedAddLabel = document.querySelector("#saved-add-label");
const comparisonColumns = document.querySelector("#comparison-columns");
const comparisonRows = document.querySelectorAll("[data-criterion]");
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
  savedHouseList.replaceChildren();
  comparisonColumns.replaceChildren(createTextElement("th", "", "Tiêu chí"));

  for (const row of comparisonRows) {
    row.querySelectorAll("td").forEach((cell) => cell.remove());
  }

  savedSummary.textContent = `${savedHomes.length} căn đã lưu · So sánh theo tiêu chí của bạn.`;
  savedAddLabel.textContent = savedHomes.length ? "Thêm nhà" : "Tìm nhà";
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
    const title = createTextElement("h3", "", home.title || "Nhà đã lưu");
    const location = createTextElement(
      "p",
      "saved-house-card__location",
      home.location,
    );
    const price = createTextElement("p", "saved-house-card__price", home.price);
    const removeButton = createTextElement(
      "button",
      "saved-house-card__remove",
      "Bỏ lưu",
    );
    removeButton.type = "button";
    removeButton.setAttribute(
      "aria-label",
      `Bỏ lưu ${home.title || "nhà này"}`,
    );
    removeButton.addEventListener("click", () => {
      window.HomeFitSavedHomes.remove(home.id);
    });

    card.append(metadata, title, location, price, removeButton);
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
  assistantStatus.textContent = savedHomes.length
    ? `${savedHomes.length} căn nhà đã sẵn sàng để đối chiếu theo brief của bạn.`
    : "Lưu nhà để bắt đầu so sánh theo ưu tiên cá nhân.";
}

function renderPriorities() {
  let brief = {};
  try {
    const savedBrief = JSON.parse(
      sessionStorage.getItem("homefit-brief-draft") || "{}",
    );
    if (
      savedBrief &&
      typeof savedBrief === "object" &&
      !Array.isArray(savedBrief)
    ) {
      brief = savedBrief;
    }
  } catch {
    brief = {};
  }

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
}

document.addEventListener("click", (event) => {
  const addButton = event.target.closest("[data-add-home]");
  if (!addButton || !window.HomeFitSavedHomes) return;

  try {
    const home = JSON.parse(addButton.dataset.addHome);
    if (window.HomeFitSavedHomes.save(home)) {
      window.location.href = "seeker-search.html";
    }
  } catch {
    return;
  }
});

window.addEventListener("homefit:saved-homes-change", renderSavedHomes);
window.addEventListener("storage", renderSavedHomes);
window.addEventListener("pageshow", renderSavedHomes);
renderSavedHomes();
