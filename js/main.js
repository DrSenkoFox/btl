/* ==========================================================================
   HomeFit AI – Shared Navigation & Session Controller (js/main.js)
   ========================================================================== */

document.addEventListener("DOMContentLoaded", () => {
  const API = window.HomeFitAPI;
  const currentPage = window.location.pathname.split("/").pop() || "seeker-property-search.html";

  const roleHomePage = {
    seeker: "seeker-property-search.html",
    agent: "agent-listing-management.html",
    moderator: "moderator-listing-review.html",
    admin: "admin-user-management.html",
  };

  /* 1. Render Seeker Top Navigation (Giống hệt Ảnh 1) */
  const siteNav = document.getElementById("site-navigation");
  if (siteNav) {
    const session = API.getSession();
    const activeMap = {
      "seeker-property-search.html": "search",
      "seeker-home-brief.html": "brief",
      "seeker-agent-selection.html": "broker",
      "seeker-property-compare.html": "saved",
    };
    const activeKey = activeMap[currentPage] || "";

    siteNav.innerHTML = `
      <a class="brand" href="seeker-property-search.html">
        <img src="../assets/images/homefit-ai-logo.svg" alt="HomeFit AI" />
        <span>HomeFit AI</span>
      </a>
      <ul class="primary-navigation">
        <li><a href="seeker-property-search.html" ${activeKey === "search" ? 'aria-current="page"' : ""}>Tìm nhà</a></li>
        <li><a href="seeker-home-brief.html" ${activeKey === "brief" ? 'aria-current="page"' : ""}>Nhu cầu nhà ở</a></li>
        <li><a href="seeker-agent-selection.html" ${activeKey === "broker" ? 'aria-current="page"' : ""}>Môi giới</a></li>
        <li><a href="seeker-property-compare.html" ${activeKey === "saved" ? 'aria-current="page"' : ""}>Nhà đã lưu</a></li>
      </ul>
      <ul class="account-navigation">
        <li><a href="seeker-home-brief.html">Thông báo</a></li>
        ${
          session
            ? `<li>
                 <span class="nav-user-pill">${session.name}</span>
                 ${
                   session.role !== "seeker"
                     ? `<a href="${roleHomePage[session.role]}" class="nav-auth-btn nav-auth-btn--ghost" style="margin-left:6px;text-decoration:none;">Workspace</a>`
                     : ""
                 }
                 <button type="button" class="nav-logout-btn" id="btn-top-logout">Đăng xuất</button>
               </li>`
            : `<li id="nav-guest-actions">
                 <a href="login.html" class="nav-auth-btn nav-auth-btn--ghost" style="text-decoration:none;">Đăng nhập</a>
                 <a href="login.html?mode=register" class="nav-auth-btn" style="text-decoration:none;">Đăng ký</a>
               </li>`
        }
      </ul>
    `;
  }

  /* 2. Render Agent Sidebar */
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
        <a href="#logout" id="btn-agent-logout" style="color:#b42318;font-weight:650;">Đăng xuất tài khoản</a>
      </footer>
    `;
  }

  /* 3. Sự kiện Đăng xuất quay về trang chủ Tìm nhà (Ảnh 1) */
  function logoutAndGoHome(e) {
    if (e) e.preventDefault();
    API.setSession(null);
    window.location.href = "seeker-property-search.html";
  }

  document.getElementById("btn-top-logout")?.addEventListener("click", logoutAndGoHome);
  document.getElementById("btn-agent-logout")?.addEventListener("click", logoutAndGoHome);
  document.querySelectorAll("[data-ops-logout]").forEach((btn) => {
    btn.addEventListener("click", logoutAndGoHome);
  });
});