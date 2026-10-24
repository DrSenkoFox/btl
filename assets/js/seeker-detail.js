const propertyDetail = document.querySelector("#property-detail");
const propertyEmpty = document.querySelector("#property-detail-empty");

function setPropertyText(selector, value, fallback = "Chưa cung cấp") {
  const element = document.querySelector(selector);
  element.textContent = value || fallback;
}

function setPropertyImage(selector, source, alt) {
  const image = document.querySelector(selector);
  const safeSource = typeof source === "string" ? source.trim() : "";
  if (!safeSource) {
    image.hidden = true;
    return;
  }

  image.src = safeSource;
  image.alt = alt;
  image.hidden = false;
}

function getSelectedProperty() {
  const propertyId = new URLSearchParams(window.location.search).get("id");
  let selectedProperty = null;

  try {
    selectedProperty = JSON.parse(
      sessionStorage.getItem("homefit-selected-home") || "null",
    );
  } catch {
    selectedProperty = null;
  }

  if (
    selectedProperty?.id &&
    (!propertyId || selectedProperty.id === propertyId)
  ) {
    return selectedProperty;
  }

  try {
    const posts = JSON.parse(localStorage.getItem("homefit-agent-posts") || "[]");
    return (
      window.HomeFitSavedHomes?.getAll().find((home) => home.id === propertyId) ||
      posts.find((post) => post.id === propertyId || post.code === propertyId) ||
      null
    );
  } catch {
    return null;
  }
}

function getBriefSummary(property) {
  if (property.briefSummary) return property.briefSummary;

  try {
    const brief = JSON.parse(
      sessionStorage.getItem("homefit-brief-draft") || "{}",
    );
    return [
      brief["preferred-area"],
      brief["size-and-bedrooms"],
      brief.lifestyle,
      brief["must-haves"],
    ]
      .filter((value) => typeof value === "string" && value.trim())
      .map((value) => value.trim())
      .join(" · ");
  } catch {
    return "";
  }
}

function renderProperty(property) {
  if (!property) {
    propertyEmpty.hidden = false;
    return;
  }

  propertyDetail.hidden = false;
  document.title = `${property.title || "Chi tiết nhà"} | HomeFit AI`;
  setPropertyText("#property-breadcrumb-title", property.title);
  setPropertyText("#property-code", property.code || property.id);
  setPropertyText("#property-title", property.title, "Nhà cho thuê");
  setPropertyText("#property-location", property.location);
  setPropertyText("#property-price", property.price);
  setPropertyText(
    "#property-quick-facts",
    [property.size, property.bedrooms, property.bathrooms, property.floor]
      .filter(Boolean)
      .join(" · "),
  );
  setPropertyText("#property-description", property.description, "");
  setPropertyText("#property-contract", property.contract);
  setPropertyText("#property-legal", property.legal);
  setPropertyText("#property-costs", property.costs);
  setPropertyText("#property-furnishing", property.furnishing);
  setPropertyText("#property-amenities", property.amenities);
  setPropertyText("#property-available", property.availableDate);
  setPropertyText(
    "#property-fit-label",
    property.fitScore ? `● ${property.fitScore} phù hợp` : "",
  );
  setPropertyText("#property-ai-intro", property.aiSummary, "");
  setPropertyText(
    "#property-broker",
    property.brokerName,
    "● Môi giới phụ trách",
  );
  setPropertyText(
    "#property-contact-description",
    property.brokerMeta || property.location,
  );
  setPropertyText(
    "#property-brief-summary",
    getBriefSummary(property),
    "Chưa có brief được lưu trong phiên này.",
  );
  document.querySelector("#property-report-link").href =
    `seeker-report.html?id=${encodeURIComponent(property.id)}`;

  const fitScore = document.querySelector("#property-fit-score");
  fitScore.textContent = property.fitScore
    ? `● ${property.fitScore} phù hợp`
    : "";
  fitScore.hidden = !property.fitScore;

  const gallery = document.querySelector(".property-gallery");
  const images = Array.isArray(property.images) ? property.images : [];
  const mainImage = property.image || images[0];
  gallery.hidden = !mainImage;
  setPropertyImage(
    "#property-image-main",
    mainImage,
    `Ảnh ${property.title || "căn nhà"}`,
  );
  const extras = images.filter((src) => src !== mainImage).slice(0, 2);
  setPropertyImage("#property-image-second", extras[0], "Không gian bên trong căn nhà");
  setPropertyImage("#property-image-third", extras[1], "Góc sinh hoạt trong căn nhà");
  gallery.classList.toggle("is-single", extras.length === 0);
  document.querySelector(".property-gallery__secondary").hidden =
    extras.length === 0;

  const reasons =
    Array.isArray(property.aiReasons) && property.aiReasons.length
      ? property.aiReasons
      : ["Chưa có phân tích phù hợp cho tin đăng này."];
  document.querySelector("#property-ai-reasons").replaceChildren(
    ...reasons.map((reason) => {
      const item = document.createElement("li");
      item.textContent = reason;
      return item;
    }),
  );

  const nearby = Array.isArray(property.nearby) ? property.nearby : [];
  const nearbyList = document.querySelector("#property-nearby-list");
  nearbyList.replaceChildren(
    ...nearby.map((place) => {
      const row = document.createElement("tr");
      for (const value of [place.name, place.distance, place.type]) {
        const cell = document.createElement("td");
        cell.textContent = value || "Chưa cung cấp";
        row.append(cell);
      }
      return row;
    }),
  );
  document.querySelector("#property-nearby-empty").hidden = nearby.length > 0;

  document
    .querySelector("[data-save-detail]")
    .addEventListener("click", (event) => {
      const button = event.currentTarget;
      if (window.HomeFitSavedHomes?.save(property)) {
        button.textContent = "Đã lưu";
        button.disabled = true;
      }
    });

  document
    .querySelector("[data-share-detail]")
    .addEventListener("click", async (event) => {
      const shareData = { title: property.title, url: window.location.href };
      if (navigator.share) {
        await navigator.share(shareData);
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(shareData.url);
        event.currentTarget.textContent = "Đã sao chép liên kết";
      }
    });
}

document
  .querySelector("#property-viewing-form")
  .addEventListener("submit", (event) => {
    event.preventDefault();
    document.querySelector("#property-viewing-status").textContent =
      "Đã ghi nhận yêu cầu. Môi giới sẽ liên hệ xác nhận lịch xem.";
  });

renderProperty(getSelectedProperty());
