const siteNavigation = document.querySelector("#site-navigation");

if (siteNavigation) {
  siteNavigation.innerHTML = `
    <a class="brand" href="seeker-search.html" aria-label="HomeFit AI - Trang chủ">
      <img src="../images/homefit-ai-logo.svg" alt="" />
      <span>HomeFit AI</span>
    </a>
    <button
      class="navigation-toggle"
      type="button"
      aria-label="Mở menu tài khoản"
      aria-expanded="false"
      aria-controls="account-navigation"
    >
      <span></span>
      <span></span>
      <span></span>
    </button>
    <ul class="primary-navigation">
      <li>
        <a href="seeker-search.html" data-nav-page="search">
          <svg class="navigation-icon" viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="11" cy="11" r="6.5" />
            <path d="m16 16 4.5 4.5" />
          </svg>
          <span>Tìm nhà</span>
        </a>
      </li>
      <li>
        <a href="seeker-brief-form.html" data-nav-page="brief">
          <svg class="navigation-icon" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M8 4h11v16H8zM5 7v14h11M11 9h5M11 13h5M11 17h3" />
          </svg>
          <span>Nhu cầu nhà ở</span>
        </a>
      </li>
      <li>
        <a id="broker-nav-link" href="seeker-agent-selection.html" data-nav-page="broker">
          <svg class="navigation-icon" viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="9" cy="8" r="3" />
            <path d="M3 20v-1a6 6 0 0 1 12 0v1M16 5.5a3 3 0 0 1 0 5.8M18 14a5 5 0 0 1 3 4.6V20" />
          </svg>
          <span>Môi giới</span>
        </a>
      </li>
      <li>
        <a href="seeker-saved.html" data-nav-page="saved">
          <svg class="navigation-icon" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.5 1.1-1.1a5.5 5.5 0 0 0-.1-7.8Z" />
          </svg>
          <span>Nhà đã lưu</span>
        </a>
      </li>
    </ul>
    <ul class="account-navigation" id="account-navigation" aria-label="Thông báo và tài khoản">
      <li>
        <a class="notification-link" href="#">
          Thông báo
          <span class="notification-count" id="notification-count" hidden></span>
        </a>
      </li>
      <li class="mobile-history-item">
        <a href="seeker-brief-form.html#history-heading">Lịch sử brief</a>
      </li>
      <li class="account-user" id="user-account" hidden>
        <a class="account-name" id="user-name" href="seeker-profile.html"></a>
      </li>
    </ul>
  `;
}

const navigationToggle = siteNavigation?.querySelector(".navigation-toggle");

function setAccountMenuOpen(isOpen) {
  siteNavigation?.classList.toggle("account-menu-open", isOpen);
  navigationToggle?.setAttribute("aria-expanded", String(isOpen));
  navigationToggle?.setAttribute(
    "aria-label",
    isOpen ? "Đóng menu tài khoản" : "Mở menu tài khoản",
  );
}

navigationToggle?.addEventListener("click", () => {
  setAccountMenuOpen(navigationToggle.getAttribute("aria-expanded") !== "true");
});

siteNavigation?.addEventListener("click", (event) => {
  if (event.target.closest(".account-navigation a")) {
    setAccountMenuOpen(false);
  }
});

siteNavigation?.addEventListener("keydown", (event) => {
  if (event.key === "Escape") setAccountMenuOpen(false);
});

document.addEventListener("click", (event) => {
  if (!siteNavigation?.contains(event.target)) setAccountMenuOpen(false);
});

window.addEventListener("resize", () => {
  if (window.innerWidth > 760) setAccountMenuOpen(false);
});

const userAccount = document.querySelector("#user-account");
const userName = document.querySelector("#user-name");
const notificationCount = document.querySelector("#notification-count");
const notificationEvents = Object.freeze({
  briefSubmitted: "brief-submitted",
  brokerReceivedBrief: "broker-received-brief",
  brokerDeclinedBrief: "broker-declined-brief",
  briefEdited: "brief-edited",
  briefDeleted: "brief-deleted",
});
const allowedNotificationEvents = new Set(Object.values(notificationEvents));
let unreadNotificationCount = 0;

const pageNavigation = new Map([
  ["seeker-search.html", "search"],
  ["seeker-brief-form.html", "brief"],
  ["seeker-agent-selection.html", "broker"],
  ["agent-post.html", "agent-post"],
  ["agent-posts.html", "agent-post"],
  ["seeker-saved.html", "saved"],
]);

function renderActiveNavigation() {
  const currentPage = window.location.pathname.split("/").pop();
  const activePage = pageNavigation.get(currentPage);

  for (const link of document.querySelectorAll(
    ".primary-navigation a[data-nav-page]",
  )) {
    if (link.dataset.navPage === activePage) {
      link.setAttribute("aria-current", "page");
    } else {
      link.removeAttribute("aria-current");
    }
  }
}

renderActiveNavigation();
window.addEventListener("pageshow", renderActiveNavigation);

function renderNotificationCount() {
  notificationCount.textContent =
    unreadNotificationCount > 99 ? "99+" : String(unreadNotificationCount);
  notificationCount.hidden =
    unreadNotificationCount === 0 || userAccount.hidden;
}

function setNotificationCount(count) {
  const numericCount = Number(count);
  unreadNotificationCount = Number.isFinite(numericCount)
    ? Math.max(0, Math.floor(numericCount))
    : 0;

  renderNotificationCount();
}

function recordNotification(eventType) {
  if (!allowedNotificationEvents.has(eventType) || userAccount.hidden) {
    return false;
  }

  setNotificationCount(unreadNotificationCount + 1);
  return true;
}

function setUser(user) {
  const rawName = typeof user === "string" ? user : user?.name;
  const name = typeof rawName === "string" ? rawName.trim() : "";

  userName.textContent = name;
  userAccount.hidden = !name;
  setNotificationCount(0);
}

window.HomeFitNavigation = Object.freeze({
  events: notificationEvents,
  recordNotification,
  setUser,
});
