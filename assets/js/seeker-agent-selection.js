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
const selectionParams = new URLSearchParams(window.location.search);
const isBriefSelection = selectionParams.get("from") === "brief";
const briefId = selectionParams.get("briefId")?.trim();
const sendBriefLabel = `Gửi brief${briefId ? ` ${briefId}` : ""}`;

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
  const submittedAgentId = sessionStorage.getItem("homefit-submitted-agent-id");

  for (const card of agentCards) {
    const isSelected = card.dataset.agentId === selectedAgent?.id;
    const isSubmitted = card.dataset.agentId === submittedAgentId;
    const selectButton = card.querySelector("[data-agent-select]");
    card.classList.toggle("agent-card--selected", isSelected);
    selectButton.textContent = isSubmitted ? "Đã chọn" : sendBriefLabel;
    selectButton.setAttribute("aria-pressed", String(isSubmitted));
    selectButton.disabled = isSubmitted;
    selectButton.hidden = !isBriefSelection && !isSubmitted;
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

  sessionStorage.removeItem("homefit-submitted-agent-id");
  sessionStorage.setItem("homefit-selected-agent", JSON.stringify(agent));
  window.location.href = "seeker-brief-form.html";
}

function readAgentProfile(card) {
  return {
    id: card.dataset.agentId,
    name: card.dataset.agentName,
    initials: card.dataset.agentInitials,
    meta: card.dataset.agentMeta,
    verified: card.dataset.agentVerified === "true",
    location: card.querySelector(".agent-card__location").textContent.trim(),
    specialty: card.querySelector(".agent-card__specialty").textContent.trim(),
    bio: card.querySelector(".agent-card__bio").textContent.trim(),
    tags: [...card.querySelectorAll(".agent-card__tags li")].map((tag) =>
      tag.textContent.trim(),
    ),
    fit: card.dataset.agentFit,
    publicListingCount: card.dataset.agentDeals,
    responseTime: card
      .querySelector(".agent-card__match-note")
      .textContent.trim(),
    listings: [...card.querySelectorAll("[data-agent-listing]")].map(
      (listing) => ({ ...listing.dataset }),
    ),
  };
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
  button.textContent = sendBriefLabel;
  button.addEventListener("click", () =>
    selectAgent(button.closest("[data-agent-card]")),
  );
}

for (const link of document.querySelectorAll("[data-agent-profile]")) {
  link.addEventListener("click", () => {
    const card = link.closest("[data-agent-card]");
    if (!card) return;

    sessionStorage.setItem(
      "homefit-viewed-agent",
      JSON.stringify(readAgentProfile(card)),
    );

    if (isBriefSelection) {
      const profileUrl = new URL(link.href);
      profileUrl.searchParams.set("from", "brief");
      if (briefId) profileUrl.searchParams.set("briefId", briefId);
      link.href = profileUrl.href;
    }
  });
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
