const filterForm = document.querySelector("#agent-filter-form");
const agentSearch = document.querySelector("#agent-search");
const agentArea = document.querySelector("#agent-area");
const agentSpecialty = document.querySelector("#agent-specialty");
const verifiedOnly = document.querySelector("#verified-only");
const agentSort = document.querySelector("#agent-sort");
const agentList = document.querySelector("#agent-list");
const resultCount = document.querySelector("#agent-result-count");
const emptyState = document.querySelector("#agent-empty-state");
const selectionStatus = document.querySelector("#agent-selection-status");
const agentCards = [...document.querySelectorAll("[data-agent-card]")];
const quickFilters = [...document.querySelectorAll("[data-quick-filter]")];

function normalizeText(value) {
  return value
    .toLocaleLowerCase("vi")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d");
}

function readSelectedAgent() {
  try {
    return JSON.parse(
      sessionStorage.getItem("homefit-selected-agent") || "null",
    );
  } catch {
    return null;
  }
}

function updateSelectedAgentCard() {
  const selectedAgent = readSelectedAgent();

  for (const card of agentCards) {
    const isSelected = card.dataset.agentId === selectedAgent?.id;
    const selectButton = card.querySelector("[data-agent-select]");
    card.classList.toggle("agent-card--selected", isSelected);
    selectButton.textContent = isSelected
      ? "Đang chọn"
      : "Chọn cho brief B-024";
    selectButton.setAttribute("aria-pressed", String(isSelected));
    selectButton.disabled = isSelected;
  }
}

function updateAgentResults() {
  const searchText = normalizeText(agentSearch.value.trim());
  const selectedArea = agentArea.value;
  const selectedSpecialty = agentSpecialty.value;
  const fitOnly =
    quickFilters
      .find((filter) => filter.dataset.quickFilter === "fit")
      .getAttribute("aria-pressed") === "true";
  const fastOnly =
    quickFilters
      .find((filter) => filter.dataset.quickFilter === "fast")
      .getAttribute("aria-pressed") === "true";

  const matchingCards = agentCards.filter((card) => {
    const matchesSearch = normalizeText(card.innerText).includes(searchText);
    const matchesArea =
      selectedArea === "all" ||
      card.dataset.agentAreas.split(" ").includes(selectedArea);
    const matchesSpecialty =
      selectedSpecialty === "all" ||
      card.dataset.agentSpecialties.split(" ").includes(selectedSpecialty);
    const matchesVerified =
      !verifiedOnly.checked || card.dataset.agentVerified === "true";
    const matchesFit = !fitOnly || Number(card.dataset.agentFit) >= 85;
    const matchesFast = !fastOnly || card.dataset.agentFast === "true";

    return (
      matchesSearch &&
      matchesArea &&
      matchesSpecialty &&
      matchesVerified &&
      matchesFit &&
      matchesFast
    );
  });

  matchingCards.sort((first, second) => {
    const metric = agentSort.value === "deals" ? "agentDeals" : "agentFit";
    return Number(second.dataset[metric]) - Number(first.dataset[metric]);
  });

  agentList.append(...matchingCards);
  for (const card of agentCards) {
    card.hidden = !matchingCards.includes(card);
  }

  resultCount.textContent = String(matchingCards.length);
  emptyState.hidden = matchingCards.length > 0;
}

function selectAgent(button) {
  const agent = {
    id: button.dataset.agentId,
    name: button.dataset.agentName,
    initials: button.dataset.agentInitials,
    meta: button.dataset.agentMeta,
    verified: button.dataset.agentVerified === "true",
  };

  sessionStorage.setItem("homefit-selected-agent", JSON.stringify(agent));
  window.location.href = "seeker-brief-form.html";
}

filterForm.addEventListener("submit", (event) => {
  event.preventDefault();
  updateAgentResults();
});

filterForm.addEventListener("input", updateAgentResults);
filterForm.addEventListener("change", updateAgentResults);
agentSort.addEventListener("change", updateAgentResults);

for (const filter of quickFilters) {
  filter.addEventListener("click", () => {
    const isPressed = filter.getAttribute("aria-pressed") === "true";
    filter.setAttribute("aria-pressed", String(!isPressed));
    updateAgentResults();
  });
}

for (const button of document.querySelectorAll("[data-agent-select]")) {
  button.addEventListener("click", () =>
    selectAgent(button.closest("[data-agent-card]")),
  );
}

for (const button of document.querySelectorAll("[data-agent-contact]")) {
  button.addEventListener("click", () => {
    selectionStatus.textContent =
      "Thông tin liên hệ chỉ được chia sẻ sau khi bạn chọn môi giới và xác nhận trong brief.";
    selectionStatus.hidden = false;
  });
}

updateSelectedAgentCard();
updateAgentResults();
