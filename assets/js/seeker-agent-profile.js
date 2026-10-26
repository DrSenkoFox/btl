const profileParams = new URLSearchParams(window.location.search);
const profileId = profileParams.get("id");
const profileEmpty = document.querySelector("#agent-profile-empty");
const profileArticle = document.querySelector("#agent-profile");
const profileSendButton = document.querySelector("#agent-profile-send");

function getViewedAgent() {
  try {
    const agent = JSON.parse(
      sessionStorage.getItem("homefit-viewed-agent") || "null",
    );
    return agent?.id === profileId ? agent : null;
  } catch {
    return null;
  }
}

function setProfileText(selector, value, fallback = "Chưa cung cấp") {
  document.querySelector(selector).textContent = value || fallback;
}

function renderAgentListings(listings) {
  const listingGrid = document.querySelector("#agent-profile-listings");
  const listingEmpty = document.querySelector("#agent-profile-listings-empty");
  const validListings = Array.isArray(listings) ? listings : [];

  listingGrid.replaceChildren(
    ...validListings.map((listing) => {
      const item = document.createElement("li");
      const article = document.createElement("article");
      const title = document.createElement("h3");
      const details = document.createElement("p");
      const price = document.createElement("p");

      article.className = "agent-profile__listing";
      title.textContent = listing.title || "Bài đăng";
      details.textContent = [listing.location, listing.facts]
        .filter(Boolean)
        .join(" · ");
      price.textContent = listing.price || "";
      article.append(title, details, price);
      item.append(article);
      return item;
    }),
  );
  listingEmpty.hidden = validListings.length > 0;
}

function renderAgent(agent) {
  if (!agent) {
    profileEmpty.hidden = false;
    return;
  }

  profileArticle.hidden = false;
  document.title = `${agent.name} | Hồ sơ môi giới | HomeFit AI`;
  setProfileText("#agent-profile-breadcrumb", agent.name);
  setProfileText("#agent-profile-initials", agent.initials, "MH");
  setProfileText("#agent-profile-name", agent.name);
  setProfileText("#agent-profile-specialty", agent.specialty);
  setProfileText("#agent-profile-location", agent.location);
  setProfileText("#agent-profile-bio", agent.bio);
  setProfileText("#agent-profile-fit", agent.fit ? `${agent.fit}%` : "—");
  setProfileText(
    "#agent-profile-listing-count",
    agent.publicListingCount || "0",
  );
  setProfileText("#agent-profile-response", agent.responseTime);
  setProfileText("#agent-listings-name", agent.name);
  setProfileText(
    "#agent-listings-count",
    agent.publicListingCount
      ? `${agent.publicListingCount} bài đăng công khai`
      : "",
    "",
  );

  const verifiedBadge = document.querySelector("#agent-profile-verified");
  verifiedBadge.hidden = !agent.verified;

  const tags = Array.isArray(agent.tags) ? agent.tags : [];
  document.querySelector("#agent-profile-tags").replaceChildren(
    ...tags.map((tag) => {
      const item = document.createElement("li");
      item.textContent = tag;
      return item;
    }),
  );

  const isBriefFlow = profileParams.get("from") === "brief";
  profileSendButton.hidden = !isBriefFlow;
  if (isBriefFlow) {
    const briefId = profileParams.get("briefId")?.trim();
    profileSendButton.textContent = `Gửi brief${briefId ? ` ${briefId}` : ""}`;
  }

  renderAgentListings(agent.listings);
}

profileSendButton.addEventListener("click", () => {
  const agent = getViewedAgent();
  if (!agent) return;

  sessionStorage.removeItem("homefit-submitted-agent-id");
  sessionStorage.setItem(
    "homefit-selected-agent",
    JSON.stringify({
      id: agent.id,
      name: agent.name,
      initials: agent.initials,
      meta: agent.meta,
      verified: agent.verified,
    }),
  );
  window.location.href = "seeker-brief-form.html";
});

renderAgent(getViewedAgent());
