/* ==========================================================================
   HomeFit AI – Shared Navigation & Workspace Header (js/main.js)
   ========================================================================== */

document.addEventListener("DOMContentLoaded", () => {
  const API = window.HomeFitAPI;
  const currentPage = window.location.pathname.split("/").pop() || "seeker-property-search.html";

  const workspaceNavConfig = {
    agent: { label: "Không gian Môi giới", href: "agent-listing-management.html" },
    moderator: { label: "Không gian Kiểm duyệt", href: "moderator-listing-review.html" },
    admin: { label: "Không gian Quản trị", href: "admin-user-management.html" },
  };

  /* 1. Render Seeker Top Navigation */
  const siteNav = document.getElementById("site-navigation");
  if (siteNav) {
    const session = API.getSession();
    const unreadCount = API.getNotifs().filter((n) => n.unread).length;

    const activeMap = {
      "seeker-property-search.html": "search",
      "seeker-home-brief.html": "brief",
      "seeker-agent-selection.html": "broker",
      "seeker-property-compare.html": "saved",
      "notifications.html": "notif",
      "profile.html": "profile",
    };
    const activeKey = activeMap[currentPage] || "";

    const extraWorkspaceItem =
      session && workspaceNavConfig[session.role]
        ? `<li>
             <a href="${workspaceNavConfig[session.role].href}" class="nav-workspace-link">
               ${workspaceNavConfig[session.role].label}
             </a>
           </li>`
        : "";

    const rightCornerHtml = session
      ? `<div class="account-corner" aria-label="Thông báo và tài khoản">
           <a href="notifications.html" class="account-corner__notif ${activeKey === "notif" ? "is-active" : ""}">
             <span>Thông báo</span>
             <span class="account-corner__dot">•</span>
             <span id="header-unread-count">${unreadCount}</span>
           </a>
           <span class="account-corner__sep">/</span>
           <a href="profile.html" class="account-corner__user ${activeKey === "profile" ? "is-active" : ""}">
             <span id="header-user-name">${session.shortName || session.name}</span>
             <span class="account-corner__caret" aria-hidden="true">▾</span>
           </a>
         </div>`
      : `<div class="account-corner">
           <a href="notifications.html" class="account-corner__notif" style="color:#6e7c75;">Thông báo</a>
           <span class="account-corner__sep">/</span>
           <a href="login.html" class="account-corner__user">Đăng nhập</a>
         </div>`;

    siteNav.innerHTML = `
      <a class="brand" href="seeker-property-search.html" aria-label="HomeFit AI - Trang chủ">
        <img src="../assets/images/homefit-ai-logo.svg" alt="HomeFit AI" />
        <span>HomeFit AI</span>
      </a>

      <ul class="primary-navigation">
        <li><a href="seeker-property-search.html" ${activeKey === "search" ? 'aria-current="page"' : ""}>Tìm nhà</a></li>
        <li><a href="seeker-home-brief.html" ${activeKey === "brief" ? 'aria-current="page"' : ""}>Nhu cầu nhà ở</a></li>
        <li><a href="seeker-agent-selection.html" ${activeKey === "broker" ? 'aria-current="page"' : ""}>Môi giới</a></li>
        <li><a href="seeker-property-compare.html" ${activeKey === "saved" ? 'aria-current="page"' : ""}>Nhà đã lưu</a></li>
        ${extraWorkspaceItem}
      </ul>

      ${rightCornerHtml}
    `;
  }

  /* 2. Render Agent Sidebar nếu ở trong Workspace của Môi giới */
  const agentNav = document.getElementById("agent-nav");
  if (agentNav) {
    document.body.classList.add("has-agent-nav");
    const newLeads = API.getLeads().filter((l) => l.status === "new").length;
    const links = [
      ["agent-listing-management.html", "Quản lý bài đăng"],
      ["agent-post-create.html", "Tạo bài đăng mới"],
      ["agent-lead-management.html", "Yêu cầu & khách hàng"],
      ["agent-viewing-schedule.html", "Lịch hẹn xem nhà"],
      ["seeker-property-search.html", "Trang tìm nhà (Index)"],
    ];
    agentNav.innerHTML = `
      <a class="agent-nav__brand" href="agent-listing-management.html">
        <img src="../assets/images/homefit-ai-logo.svg" alt="HomeFit AI" />
        <span>HomeFit AI</span>
      </a>
      <p class="agent-nav__label">Môi giới</p>
      <ul class="agent-nav__list">
        ${links
          .map(
            ([href, label]) =>
              `<li><a href="${href}" class="${currentPage === href ? "is-active" : ""}">${label}</a></li>`
          )
          .join("")}
      </ul>
      <footer class="agent-nav__foot">
        <a href="agent-lead-management.html">Thông báo • ${newLeads}</a>
        <a href="profile.html">Hồ sơ &amp; cài đặt</a>
        <a href="#logout" id="btn-agent-logout" style="color:#b42318;font-weight:650;">Đăng xuất</a>
      </footer>
    `;
  }

  /* 3. Sự kiện Đăng xuất từ Sidebar Môi giới / Moderator / Admin */
  function logoutToSearch(e) {
    if (e) e.preventDefault();
    API.setSession(null);
    window.location.href = "seeker-property-search.html";
  }

  document.getElementById("btn-agent-logout")?.addEventListener("click", logoutToSearch);
  document.querySelectorAll("[data-ops-logout]").forEach((btn) => {
    btn.addEventListener("click", logoutToSearch);
  });
});