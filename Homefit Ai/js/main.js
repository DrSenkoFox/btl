/* ==========================================================================
   HomeFit AI – Shared Navigation & Multi-Role Auth Router (js/main.js)
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

  /* 1. Render Seeker Top Navigation nếu trang có #site-navigation */
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
                     ? `<a href="${roleHomePage[session.role]}" class="nav-auth-btn nav-auth-btn--ghost" style="margin-left:6px;text-decoration:none;">Về trang ${session.role.toUpperCase()}</a>`
                     : ""
                 }
                 <button type="button" class="nav-logout-btn" id="btn-top-logout">Đăng xuất</button>
               </li>`
            : `<li>
                 <button type="button" class="nav-auth-btn nav-auth-btn--ghost" id="btn-open-login">Đăng nhập</button>
                 <button type="button" class="nav-auth-btn" id="btn-open-register">Đăng ký</button>
               </li>`
        }
      </ul>
    `;
  }

  /* 2. Render Agent Sidebar nếu trang có #agent-nav */
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

  /* 3. Khởi tạo Modal Đăng nhập / Đăng ký tự động trên mọi trang */
  const modalWrap = document.createElement("div");
  modalWrap.className = "auth-backdrop";
  modalWrap.id = "auth-modal";
  modalWrap.hidden = true;
  modalWrap.innerHTML = `
    <div class="auth-dialog" role="dialog" aria-modal="true">
      <header class="auth-dialog__head">
        <div class="auth-dialog__brand">
          <img src="../assets/images/homefit-ai-logo.svg" alt="" width="24" height="24" />
          <span>Đăng nhập / Đăng ký HomeFit AI</span>
        </div>
        <button type="button" class="auth-dialog__close" id="btn-close-auth">✕</button>
      </header>
      <div class="auth-tabs">
        <button type="button" class="auth-tab is-active" id="tab-login-btn" data-tab="login">Đăng nhập</button>
        <button type="button" class="auth-tab" id="tab-reg-btn" data-tab="register">Đăng ký mới</button>
      </div>
      <div class="auth-quick-roles">
        <p>Chọn nhanh tài khoản mẫu để chuyển đến đúng giao diện:</p>
        <div class="auth-quick-grid">
          <button type="button" class="auth-quick-btn" data-quick="minhanh@example.com">1. Người mua nhà (Index)</button>
          <button type="button" class="auth-quick-btn" data-quick="quocbao@example.com">2. Môi giới (Agent)</button>
          <button type="button" class="auth-quick-btn" data-quick="quoctuan@example.com">3. Moderator (Duyệt bài)</button>
          <button type="button" class="auth-quick-btn" data-quick="duckhai@example.com">4. Admin (Phân quyền)</button>
        </div>
      </div>
      <form class="auth-form" id="login-form">
        <label class="auth-field">
          <span>Email tài khoản</span>
          <input type="email" id="login-email" required value="quocbao@example.com" />
        </label>
        <label class="auth-field">
          <span>Mật khẩu</span>
          <input type="password" id="login-pass" required value="123456" />
        </label>
        <button type="submit" class="auth-submit">Đăng nhập &amp; Điều hướng</button>
      </form>
      <form class="auth-form" id="register-form" hidden>
        <label class="auth-field">
          <span>Họ và tên *</span>
          <input type="text" id="reg-name" required placeholder="Nguyễn Văn A" />
        </label>
        <label class="auth-field">
          <span>Email *</span>
          <input type="email" id="reg-email" required placeholder="vana@example.com" />
        </label>
        <label class="auth-field">
          <span>Vai trò *</span>
          <select id="reg-role">
            <option value="seeker">Người mua nhà (Giữ ở trang Tìm nhà)</option>
            <option value="agent">Môi giới (Dẫn đến trang Môi giới)</option>
            <option value="moderator">Moderator (Dẫn đến trang Kiểm duyệt)</option>
            <option value="admin">Admin (Dẫn đến trang Quản trị viên)</option>
          </select>
        </label>
        <label class="auth-field">
          <span>Mật khẩu *</span>
          <input type="password" value="123456" required />
        </label>
        <button type="submit" class="auth-submit">Tạo tài khoản &amp; Đi tới giao diện</button>
      </form>
      <p class="auth-msg" id="auth-error" hidden></p>
    </div>
  `;
  document.body.appendChild(modalWrap);

  function openModal(mode) {
    modalWrap.hidden = false;
    const isLogin = mode !== "register";
    document.getElementById("login-form").hidden = !isLogin;
    document.getElementById("register-form").hidden = isLogin;
    document.getElementById("tab-login-btn").classList.toggle("is-active", isLogin);
    document.getElementById("tab-reg-btn").classList.toggle("is-active", !isLogin);
  }

  document.getElementById("btn-open-login")?.addEventListener("click", () => openModal("login"));
  document.getElementById("btn-open-register")?.addEventListener("click", () => openModal("register"));
  document.getElementById("btn-close-auth").addEventListener("click", () => (modalWrap.hidden = true));

  modalWrap.querySelectorAll("[data-tab]").forEach((btn) => {
    btn.addEventListener("click", () => openModal(btn.dataset.tab));
  });

  modalWrap.querySelectorAll("[data-quick]").forEach((btn) => {
    btn.addEventListener("click", () => {
      openModal("login");
      document.getElementById("login-email").value = btn.dataset.quick;
    });
  });

  document.getElementById("login-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const email = document.getElementById("login-email").value.trim().toLowerCase();
    const found = API.getUsers().find((u) => u.email.toLowerCase() === email);
    if (!found) {
      const err = document.getElementById("auth-error");
      err.textContent = "Không tìm thấy tài khoản. Vui lòng chọn tài khoản mẫu hoặc đăng ký mới!";
      err.hidden = false;
      return;
    }
    API.setSession(found);
    window.location.href = roleHomePage[found.role] || "seeker-property-search.html";
  });

  document.getElementById("register-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const users = API.getUsers();
    const role = document.getElementById("reg-role").value;
    const newUser = {
      id: `U-0${users.length + 35}`,
      name: document.getElementById("reg-name").value.trim(),
      email: document.getElementById("reg-email").value.trim().toLowerCase(),
      phone: "0909123456",
      role,
      perms: role === "admin" ? ["review", "ban", "taxonomy"] : ["review"],
    };
    users.push(newUser);
    API.saveUsers(users);
    API.setSession(newUser);
    window.location.href = roleHomePage[newUser.role] || "seeker-property-search.html";
  });

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