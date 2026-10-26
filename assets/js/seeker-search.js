const houseFiltersForm = document.querySelector("#house-filters-form");
const listingContainer = document.querySelector("#house-listings");
const emptyState = document.querySelector("#house-results-empty");
const resultCount = document.querySelector(".house-results__count");
const priorityTags = document.querySelector("#priority-filter-tags");
const needInput = document.querySelector("#search-query");
const needButton = document.querySelector(".house-search__query-row button");
const briefNote = document.querySelector("#search-brief-note");
const briefNoteBody = document.querySelector("#search-brief-note-body");
const disclaimerNote = document.querySelector("#search-disclaimer");

const priorityRules = [
  { label: "Yên tĩnh", keywords: ["yen tinh", "tieng on", "an ninh"] },
  { label: "Gần trường học", keywords: ["truong hoc", "gan truong"] },
  {
    label: "Góc làm việc WFH",
    keywords: ["goc lam viec", "wfh", "lam viec tai nha", "ban lam viec"],
  },
  {
    label: "Ánh sáng tự nhiên",
    keywords: ["anh sang", "cua so", "ban cong", "thoang"],
  },
  {
    label: "Không gian xanh",
    keywords: ["cong vien", "cay xanh", "view song", "nhin song", "san vuon"],
  },
  { label: "Thú cưng", keywords: ["thu cung", "nuoi cho", "nuoi meo"] },
  {
    label: "Phù hợp gia đình",
    keywords: ["gia dinh", "the he", "3 phong ngu", "4 phong ngu"],
  },
];

let tagLabels = [];
let activeTags = new Set();
let needsApplied = false;

function normalize(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d");
}

function numbers(text) {
  return (String(text).match(/\d+(?:[.,]\d+)?/g) || []).map((value) =>
    Number(value.replace(",", ".")),
  );
}

function priceInMillions(post) {
  const [value] = numbers(post.price);
  if (!value) return 0;
  return normalize(post.price).includes("ty") ? value * 1000 : value;
}

function postTagSet(post) {
  const haystack = normalize(
    [
      post.title,
      post.aiSummary,
      (post.aiReasons || []).join(" "),
      (post.nearby || [])
        .map((item) => `${item.name} ${item.type} ${item.distance}`)
        .join(" "),
    ].join(" "),
  );
  return new Set(
    priorityRules
      .filter((rule) =>
        rule.keywords.some((keyword) => haystack.includes(keyword)),
      )
      .map((rule) => rule.label),
  );
}

function readFilters() {
  const data = new FormData(houseFiltersForm);
  const size = numbers(data.get("size"));
  const bedrooms = numbers(data.get("bedrooms"));
  return {
    transaction: document.querySelector(
      ".house-search__transaction input:checked",
    ).value,
    area: String(data.get("area") || "").trim(),
    budgetMin: Number(data.get("budget-min")) || 0,
    budgetMax: Number(data.get("budget-max")) || 0,
    sizeMin: size[0] || 0,
    sizeMax: size[1] || 0,
    bedrooms: bedrooms[0] || 0,
  };
}

function matchesFilters(post, filters) {
  const tags = postTagSet(post);
  const price = priceInMillions(post);
  const size = numbers(post.size)[0] || 0;

  if (post.transaction && post.transaction !== filters.transaction) return false;
  if (
    filters.area &&
    !normalize(`${post.area} ${post.location}`).includes(normalize(filters.area))
  )
    return false;
  if (filters.budgetMin && price < filters.budgetMin) return false;
  if (filters.budgetMax && price > filters.budgetMax) return false;
  if (filters.sizeMin && size < filters.sizeMin) return false;
  if (filters.sizeMax && size > filters.sizeMax) return false;
  if (filters.bedrooms && (Number(post.bedrooms) || 0) < filters.bedrooms)
    return false;
  return [...activeTags].every((tag) => tags.has(tag));
}

function buildListingCard(post) {
  const home = {
    ...post,
    code: post.code || post.id,
    image: post.images?.[0] || "",
  };
  const isSaved = window.HomeFitSavedHomes.getAll().some(
    (saved) => saved.id === post.id,
  );
  const hasBrief = window.HomeFitBrief?.exists() || false;
  const card = document.createElement("article");
  const image = document.createElement("img");
  const top = document.createElement("header");
  const status = document.createElement("p");
  const saveButton = document.createElement("button");
  const price = document.createElement("p");
  const title = document.createElement("h3");
  const location = document.createElement("p");
  const meta = document.createElement("p");
  const match = document.createElement("p");
  const fit = document.createElement("span");
  const matchLabel = document.createElement("span");
  const summary = document.createElement("p");
  const actions = document.createElement("menu");
  const detailItem = document.createElement("li");
  const detailLink = document.createElement("a");
  const compareItem = document.createElement("li");
  const compareButton = document.createElement("button");

  card.className = "house-listing";
  card.dataset.homeDetail = JSON.stringify(home);
  image.src =
    home.image ||
    "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=900&q=80";
  image.alt = `Ảnh ${post.title}`;
  top.className = "house-listing__top";
  status.className = "house-listing__status";
  status.textContent = "Đã kiểm duyệt";
  saveButton.className = "house-listing__save";
  saveButton.type = "button";
  saveButton.dataset.saveHome = JSON.stringify(home);
  saveButton.setAttribute("aria-pressed", String(isSaved));
  saveButton.setAttribute(
    "aria-label",
    isSaved ? "Bỏ lưu tin nhà" : "Lưu tin nhà",
  );
  saveButton.textContent = isSaved ? "♥" : "♡";
  price.className = "house-listing__price";
  price.textContent = post.price;
  title.textContent = post.title;
  location.className = "house-listing__location";
  location.textContent = post.location;
  meta.className = "house-listing__meta";
  meta.textContent = [
    post.size,
    post.bedrooms && `${post.bedrooms} PN`,
    post.bathrooms && `${post.bathrooms} WC`,
  ]
    .filter(Boolean)
    .join(" · ");
  match.className = "house-listing__match";
  fit.className = "house-listing__fit";
  fit.textContent = `Phù hợp ${post.fitScore || "—"}`;
  matchLabel.className = "house-listing__match-label";
  matchLabel.textContent = "Lifestyle Match";
  summary.className = "house-listing__summary";
  summary.textContent = post.aiSummary || "";
  actions.className = "house-listing__actions";
  detailLink.className = "house-listing__detail";
  detailLink.href = `seeker-detail.html?id=${encodeURIComponent(post.id)}`;
  detailLink.textContent = "Xem chi tiết";
  compareButton.className = "house-listing__compare";
  compareButton.type = "button";
  compareButton.dataset.compareHome = JSON.stringify(home);
  compareButton.textContent = "+ So sánh";

  match.hidden = summary.hidden = !hasBrief || !post.fitScore;
  top.append(status, saveButton);
  detailItem.append(detailLink);
  compareItem.append(compareButton);
  match.append(fit, matchLabel);
  actions.append(detailItem, compareItem);
  card.append(image, top, price, title, location, meta, match, summary, actions);
  return card;
}

function renderPriorityTags() {
  priorityTags.replaceChildren(
    ...tagLabels.map((label) => {
      const item = document.createElement("li");
      const tag = document.createElement("button");
      const isActive = activeTags.has(label);

      tag.type = "button";
      tag.textContent = label;
      tag.setAttribute("aria-pressed", String(isActive));
      tag.addEventListener("click", () => {
        if (activeTags.has(label)) activeTags.delete(label);
        else activeTags.add(label);
        renderPriorityTags();
        renderListings();
      });
      item.append(tag);
      return item;
    }),
  );
  priorityTags.hidden = tagLabels.length === 0;
}

function renderListings() {
  if (!window.HomeFitAgentPosts || !listingContainer) return;
  const posts = window.HomeFitAgentPosts.getAll().filter(
    (post) => post.status === "approved",
  );
  const matched = posts.filter((post) => matchesFilters(post, readFilters()));

  listingContainer.replaceChildren(...matched.map(buildListingCard));
  emptyState.hidden = matched.length > 0;
  emptyState.querySelector("h3").textContent = posts.length
    ? "Không có tin khớp bộ lọc hiện tại"
    : "Hiện chưa có bài đăng nhà";
  emptyState.querySelector("p").textContent = posts.length
    ? "Bỏ bớt một tiêu chí hoặc đặt lại bộ lọc để xem thêm tin phù hợp."
    : "Tin nhà sẽ xuất hiện tại đây sau khi môi giới đăng và được kiểm duyệt.";
  resultCount.textContent = `${matched.length} bài đăng`;
  briefNote.hidden = !(needsApplied || window.HomeFitBrief?.exists());
  briefNoteBody.textContent = activeTags.size
    ? `Brief đã có các điểm mềm: ${[...activeTags].join(", ")}. Những nhu cầu này làm kết quả sát hơn.`
    : "Chưa có tiêu chí mềm nào được chọn, danh sách đang theo bộ lọc cơ bản.";
  disclaimerNote.hidden = !window.HomeFitBrief?.exists();
}

function setTagsFromText(text) {
  const normalized = normalize(text);
  const matched = priorityRules
    .filter((rule) =>
      rule.keywords.some((keyword) => normalized.includes(keyword)),
    )
    .map((rule) => rule.label);
  const suggestion = priorityRules
    .map((rule) => rule.label)
    .find((label) => !matched.includes(label));

  activeTags = new Set(matched);
  tagLabels = matched.length && suggestion ? [...matched, suggestion] : matched;
}

function applyNeeds() {
  const text = normalize(needInput.value);
  const posts = window.HomeFitAgentPosts.getAll();
  const areas = [
    ...new Set(
      posts.flatMap((post) =>
        `${post.area}, ${post.location}`.split(",").map((part) => part.trim()),
      ),
    ),
  ]
    .map((area) => ({ raw: area, key: normalize(area) }))
    .filter((area) => area.key.length > 2 && text.includes(area.key));

  setTagsFromText(text);
  const budgetRange = text.match(
    /(\d+(?:[.,]\d+)?)\s*(?:-|–|den)\s*(\d+(?:[.,]\d+)?)\s*trieu/,
  );
  const budgetMax = text.match(
    /(?:duoi|toi da|khong qua)\D{0,12}(\d+(?:[.,]\d+)?)\s*trieu/,
  );
  const sizeRange = text.match(
    /(\d+(?:[.,]\d+)?)\s*(?:-|–|den)\s*(\d+(?:[.,]\d+)?)\s*m\b/,
  );
  const size = text.match(/(\d+(?:[.,]\d+)?)\s*(?:m2|m\b)/);
  const bedrooms = text.match(/(\d+)\s*phong\s*ngu/);

  houseFiltersForm.elements["budget-min"].value = budgetRange
    ? budgetRange[1]
    : "";
  houseFiltersForm.elements["budget-max"].value = budgetRange
    ? budgetRange[2]
    : budgetMax
      ? budgetMax[1]
      : "";
  houseFiltersForm.elements.size.value = sizeRange
    ? `${sizeRange[1]} - ${sizeRange[2]} m²`
    : size
      ? `${size[1]} m²`
      : "";
  houseFiltersForm.elements.bedrooms.value = bedrooms
    ? `${bedrooms[1]} phòng`
    : "";
  houseFiltersForm.elements.area.value = areas.length
    ? areas
        .sort((left, right) => right.key.length - left.key.length)[0]
        .raw.split(",")[0]
        .trim()
    : "";
  needsApplied = Boolean(needInput.value.trim());
  renderPriorityTags();
  renderListings();
}

function prefillFromBrief() {
  const brief = window.HomeFitBrief?.get() || {};
  const sizeAndBedrooms = (brief["size-and-bedrooms"] || "").trim();
  const [size, bedrooms] = sizeAndBedrooms.split("/");
  const lifestyleText = [
    brief.lifestyle,
    brief["must-haves"],
    brief["weighted-priorities"],
  ]
    .filter((value) => typeof value === "string")
    .join(" ");

  houseFiltersForm.elements.area.value = brief["preferred-area"] || "";
  houseFiltersForm.elements["budget-min"].value = brief["budget-min"] || "";
  houseFiltersForm.elements["budget-max"].value = brief["budget-max"] || "";
  houseFiltersForm.elements.size.value =
    size?.trim() || sizeAndBedrooms.replace(/\d+\s*phong.*/i, "").trim();
  houseFiltersForm.elements.bedrooms.value =
    bedrooms?.trim() || sizeAndBedrooms.match(/\d+\s*phong.*/i)?.[0] || "";
  setTagsFromText(lifestyleText);
  if (Number(brief["household-size"]) > 1) {
    activeTags.add("Phù hợp gia đình");
    if (!tagLabels.includes("Phù hợp gia đình"))
      tagLabels.push("Phù hợp gia đình");
  }

  const transaction = brief["transaction-type"];
  const transactionInput = document.querySelector(
    `.house-search__transaction input[value="${transaction}"]`,
  );
  if (transactionInput) transactionInput.checked = true;
  renderPriorityTags();
}

prefillFromBrief();
renderListings();

window.addEventListener("homefit:agent-posts-change", renderListings);
window.addEventListener("homefit:saved-homes-change", renderListings);
window.addEventListener("storage", (event) => {
  if (event.key === "homefit-agent-posts") renderListings();
});

needButton.addEventListener("click", applyNeeds);
needInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    applyNeeds();
  }
});
houseFiltersForm.querySelector(".house-filters__apply").addEventListener(
  "click",
  () => {
    needsApplied = activeTags.size > 0;
    renderListings();
  },
);
houseFiltersForm.addEventListener("reset", () => {
  window.setTimeout(() => {
    activeTags.clear();
    tagLabels = [];
    needsApplied = false;
    renderPriorityTags();
    renderListings();
  }, 0);
});
document
  .querySelectorAll(".house-search__transaction input")
  .forEach((input) => input.addEventListener("change", renderListings));

document.addEventListener("click", (event) => {
  const detailTrigger = event.target.closest("[data-home-detail]");
  if (
    detailTrigger &&
    !event.target.closest("[data-save-home]") &&
    !event.target.closest("[data-compare-home]")
  ) {
    try {
      const home = JSON.parse(detailTrigger.dataset.homeDetail);
      if (home && typeof home.id === "string" && home.id.trim()) {
        event.preventDefault();
        sessionStorage.setItem("homefit-selected-home", JSON.stringify(home));
        window.location.href = `seeker-detail.html?id=${encodeURIComponent(home.id)}`;
      }
    } catch {
      return;
    }
  }

  const saveButton = event.target.closest("[data-save-home]");
  if (saveButton) {
    try {
      const home = JSON.parse(saveButton.dataset.saveHome);
      const alreadySaved = window.HomeFitSavedHomes.getAll().some(
        (saved) => saved.id === home.id,
      );
      if (alreadySaved) window.HomeFitSavedHomes.remove(home.id);
      else window.HomeFitSavedHomes.save(home);
    } catch {
      return;
    }
    return;
  }

  const compareButton = event.target.closest("[data-compare-home]");
  if (!compareButton) return;
  try {
    const home = JSON.parse(compareButton.dataset.compareHome);
    window.HomeFitSavedHomes.save(home);
    sessionStorage.setItem("homefit-selected-home", JSON.stringify(home));
    window.location.href = "seeker-saved.html";
  } catch {
    return;
  }
});
