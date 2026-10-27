/* ==========================================================================
   HomeFit AI – Shared Navigation & Access Guard (js/main.js)
   - Khi chưa đăng nhập: Ẩn hoàn toàn "Nhu cầu nhà ở" và "Nhà đã lưu"
   - Chặn truy cập trực tiếp vào seeker-home-brief.html & seeker-property-compare.html khi chưa đăng nhập
   ========================================================================== */

document.addEventListener("DOMContentLoaded", () => {
  const API = window.HomeFitAPI;
  const currentPage = window.location.pathname.split("/").pop() || "seeker-property-search.html";
  const session = API.getSession();

  /* 1. Bảo vệ các trang cá nhân: Nếu chưa đăng nhập mà vào Brief / Nhà đã lưu / Hồ sơ -> chuyển sang Login */
  const protectedSeekerPages = new Set([
    "seeker-home-brief.html",
    "seeker-property-compare.html",
    "profile.html",
    "notifications.html",
  ]);

  if (!session && protectedSeekerPages.has(currentPage)) {
    window.location.replace("login.html?returnUrl=seeker-property-search.html");
    return;
  }

  const workspaceNavConfig = {
    agent: { label: "Không gian Môi giới", href: "agent-listing-management.html" },
    moderator: { label: "Không gian Kiểm duyệt", href: "moderator-listing-review.html" },
    admin: { label: "Không gian Quản trị", href: "admin-user-management.html" },
  };

  /* 2. Render Seeker Top Navigation (#site-navigation) */
  const siteNav = document.getElementById("site-navigation");
  if (siteNav) {
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

    // Nếu đã đăng nhập: Hiện đủ Tìm nhà, Nhu cầu nhà ở, Môi giới, Nhà đã lưu
    // Nếu chưa đăng nhập: Xóa bỏ Nhu cầu nhà ở và Nhà đã lưu
    const centerMenuHtml = session
      ? `<ul class="primary-navigation">
           <li><a href="seeker-property-search.html" ${activeKey === "search" ? 'aria-current="page"' : ""}>Tìm nhà</a></li>
           <li><a href="seeker-home-brief.html" ${activeKey === "brief" ? 'aria-current="page"' : ""}>Nhu cầu nhà ở</a></li>
           <li><a href="seeker-agent-selection.html" ${activeKey === "broker" ? 'aria-current="page"' : ""}>Môi giới</a></li>
           <li><a href="seeker-property-compare.html" ${activeKey === "saved" ? 'aria-current="page"' : ""}>Nhà đã lưu</a></li>
           ${extraWorkspaceItem}
         </ul>`
      : `<ul class="primary-navigation">
           <li><a href="seeker-property-search.html" ${activeKey === "search" ? 'aria-current="page"' : ""}>Tìm nhà</a></li>
           <li><a href="seeker-agent-selection.html" ${activeKey === "broker" ? 'aria-current="page"' : ""}>Môi giới</a></li>
         </ul>`;

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
           <a href="login.html" class="account-corner__user" style="font-weight:700;">Đăng nhập</a>
         </div>`;

    siteNav.innerHTML = `
      <a class="brand" href="seeker-property-search.html" aria-label="HomeFit AI - Trang chủ">
        <img src="../assets/images/homefit-ai-logo.svg" alt="HomeFit AI" />
        <span>HomeFit AI</span>
      </a>
      ${centerMenuHtml}
      ${rightCornerHtml}
    `;
  }

  /* 3. Render Agent Sidebar */
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

  /* 4. Sự kiện Đăng xuất */
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