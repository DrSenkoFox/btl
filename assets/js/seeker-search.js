const houseFiltersForm = document.querySelector("#house-filters-form");

document.addEventListener("click", (event) => {
  const saveButton = event.target.closest("[data-save-home]");
  if (!saveButton || !window.HomeFitSavedHomes) return;

  try {
    const home = JSON.parse(saveButton.dataset.saveHome);
    if (window.HomeFitSavedHomes.save(home)) {
      saveButton.textContent = "Đã lưu";
      saveButton.disabled = true;
    }
  } catch {
    return;
  }
});

if (houseFiltersForm) {
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

  document.querySelector("#filter-area").value = brief["preferred-area"] || "";
  document.querySelector("#filter-budget-min").value =
    brief["budget-min"] || "";
  document.querySelector("#filter-budget-max").value =
    brief["budget-max"] || "";

  const sizeAndBedrooms = (brief["size-and-bedrooms"] || "").trim();
  const [size, bedrooms] = sizeAndBedrooms.split("/");
  document.querySelector("#filter-size").value =
    size?.trim() || sizeAndBedrooms;
  document.querySelector("#filter-bedrooms").value = bedrooms?.trim() || "";

  const lifestyleCriteria = [
    brief.lifestyle,
    brief["must-haves"],
    brief["weighted-priorities"],
  ]
    .map((value) => (typeof value === "string" ? value.trim() : ""))
    .filter(Boolean);
  const lifestyleText = lifestyleCriteria.join("\n");

  const normalizedLifestyle = lifestyleText
    .toLocaleLowerCase("vi")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d");
  const priorityRules = [
    { label: "Yên tĩnh", keywords: ["yen tinh", "it tieng on", "khong on"] },
    { label: "Gần trường học", keywords: ["truong hoc", "gan truong"] },
    {
      label: "Góc làm việc WFH",
      keywords: ["goc lam viec", "wfh", "lam viec tai nha"],
    },
    {
      label: "Ánh sáng tự nhiên",
      keywords: ["anh sang", "cua so", "ban cong"],
    },
    { label: "Thú cưng", keywords: ["thu cung", "nuoi cho", "nuoi meo"] },
    { label: "Không gian xanh", keywords: ["cay xanh", "cong vien"] },
  ];
  const priorities = priorityRules
    .filter((rule) =>
      rule.keywords.some((keyword) => normalizedLifestyle.includes(keyword)),
    )
    .map((rule) => rule.label);

  if (Number(brief["household-size"]) > 1) {
    priorities.push("Phù hợp gia đình");
  }

  const priorityTags = document.querySelector("#priority-filter-tags");
  priorityTags.replaceChildren(
    ...[...new Set(priorities)].map((priority) => {
      const tag = document.createElement("li");
      tag.textContent = priority;
      return tag;
    }),
  );
  priorityTags.hidden = priorities.length === 0;

  const transaction = brief["transaction-type"];
  if (transaction) {
    const transactionInput = document.querySelector(
      `.house-search__transaction input[value="${transaction}"]`,
    );
    if (transactionInput) transactionInput.checked = true;
  }

  houseFiltersForm.addEventListener("reset", () => {
    window.setTimeout(() => {
      priorityTags.replaceChildren();
      priorityTags.hidden = true;
    }, 0);
  });
}
