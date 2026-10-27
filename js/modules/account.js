/* ==========================================================================
   HomeFit AI – Account & Notifications Controller (js/modules/account.js)
   - Xử lý lọc, đánh dấu đã đọc trên pages/notifications.html (Hình 2)
   - Xử lý lưu hồ sơ, đổi mật khẩu, chuyển đổi tài khoản trên pages/profile.html (Hình 3)
   ========================================================================== */

document.addEventListener("DOMContentLoaded", () => {
  const API = window.HomeFitAPI;

  /* ========================================================================
     1. [ROLE: SHARED] TRANG TRUNG TÂM THÔNG BÁO (notifications.html - Hình 2)
     ======================================================================== */
  const notifFeed = document.getElementById("notif-feed-list");
  if (notifFeed) {
    let activeTab = "all";
    let roleFilter = "all";
    let groupFilter = "all";

    const iconSvg = {
      bell: "🔔",
      clip: "📋",
      shield: "🛡️",
    };

    function renderNotifications() {
      const all = API.getNotifs();
      const unreadTotal = all.filter((n) => n.unread).length;

      const tabUnreadEl = document.getElementById("tab-unread-label");
      if (tabUnreadEl) tabUnreadEl.textContent = `Chưa đọc (${unreadTotal})`;
      const headerCount = document.getElementById("header-unread-count");
      if (headerCount) headerCount.textContent = String(unreadTotal);

      const filtered = all.filter((n) => {
        if (activeTab === "unread" && !n.unread) return false;
        if (activeTab === "read" && n.unread) return false;
        if (roleFilter !== "all" && n.role !== roleFilter) return false;
        if (groupFilter !== "all" && n.group !== groupFilter) return false;
        return true;
      });

      notifFeed.innerHTML = filtered
        .map(
          (n) => `
        <article class="notif-card ${n.unread ? "is-unread" : ""}" data-id="${n.id}">
          <div class="notif-card__icon" aria-hidden="true">${iconSvg[n.icon] || "🔔"}</div>
          <div>
            <div class="notif-card__top">
              <span class="notif-card__role">${n.roleLabel}</span>
              <span class="notif-card__time">${n.time}</span>
            </div>
            <h3 class="notif-card__title">${n.title}</h3>
            <p class="notif-card__desc">${n.desc}</p>
            <div class="notif-card__foot">
              <a href="${n.actionHref}" class="notif-card__link">${n.actionText}</a>
              <button type="button" class="notif-card__state" data-toggle-read="${n.id}">
                ● ${n.unread ? "Chưa đọc" : "Đã đọc"}
              </button>
            </div>
          </div>
        </article>`
        )
        .join("");
    }

    document.querySelectorAll("[data-notif-tab]").forEach((btn) => {
      btn.addEventListener("click", () => {
        document.querySelectorAll("[data-notif-tab]").forEach((b) => b.classList.remove("is-active"));
        btn.classList.add("is-active");
        activeTab = btn.dataset.notifTab;
        renderNotifications();
      });
    });

    document.getElementById("btn-mark-all-read")?.addEventListener("click", () => {
      const updated = API.getNotifs().map((n) => ({ ...n, unread: false }));
      API.saveNotifs(updated);
      renderNotifications();
    });

    document.getElementById("btn-apply-notif-filter")?.addEventListener("click", () => {
      groupFilter = document.getElementById("filter-notif-group").value;
      roleFilter = document.getElementById("filter-notif-role").value;
      renderNotifications();
    });

    notifFeed.addEventListener("click", (e) => {
      const toggleBtn = e.target.closest("[data-toggle-read]");
      if (!toggleBtn) return;
      const list = API.getNotifs();
      const target = list.find((n) => n.id === toggleBtn.dataset.toggleRead);
      if (target) {
        target.unread = !target.unread;
        API.saveNotifs(list);
        renderNotifications();
      }
    });

    renderNotifications();
  }

  /* ========================================================================
     2. [ROLE: SHARED] TRANG HỒ SƠ & CÀI ĐẶT (profile.html - Hình 3)
     ======================================================================== */
  const profileForm = document.getElementById("profile-info-form");
  if (profileForm) {
    const roleNames = {
      seeker: "Người tìm nhà",
      agent: "Môi giới bất động sản",
      moderator: "Kiểm duyệt viên",
      admin: "Quản trị viên",
    };

    function renderProfile() {
      const session = API.getSession();
      const brief = API.getBrief();

      document.getElementById("prof-eyebrow").textContent = `TÀI KHOẢN ${session.code || session.id}`;
      document.getElementById("prof-avatar-dot").textContent = `● ${session.initials || "MA"}`;
      document.getElementById("prof-display-name").textContent = session.name;
      document.getElementById("prof-display-meta").textContent = `${
        roleNames[session.role] || session.role
      } • Tham gia ${session.joined || "02/10/2026"}`;

      document.getElementById("prof-name").value = session.name;
      document.getElementById("prof-email").value = session.email;
      document.getElementById("prof-phone").value = session.phone || "";
      document.getElementById("prof-area").value = session.area || "TP. Thủ Đức, TP.HCM";
      document.getElementById("prof-role-badge").textContent = `● Vai trò đang sử dụng: ${
        roleNames[session.role]
      }`;

      if (brief?.title) {
        document.getElementById("prof-brief-name").value = `${brief.code || "B-024"} • ${brief.title} ▾`;
      }

      const switcher = document.getElementById("quick-role-switcher");
      if (switcher) switcher.value = session.id;
    }

    profileForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const session = API.getSession();
      const users = API.getUsers();
      const newName = document.getElementById("prof-name").value.trim();

      session.name = newName;
      session.shortName = newName.split(" ").slice(-2).join(" ");
      session.phone = document.getElementById("prof-phone").value.trim();
      session.area = document.getElementById("prof-area").value.trim();

      const idx = users.findIndex((u) => u.id === session.id);
      if (idx >= 0) users[idx] = session;

      API.saveUsers(users);
      API.setSession(session);
      renderProfile();

      const headerName = document.getElementById("header-user-name");
      if (headerName) headerName.textContent = session.shortName;

      const msg = document.getElementById("prof-save-msg");
      msg.hidden = false;
      setTimeout(() => (msg.hidden = true), 2500);
    });

    /* Khi đổi tài khoản ở hộp chọn nhanh bên phải -> Cập nhật ngay thanh Header Hình 4 */
    document.getElementById("quick-role-switcher")?.addEventListener("change", (e) => {
      const targetUser = API.getUsers().find((u) => u.id === e.target.value);
      if (targetUser) {
        API.setSession(targetUser);
        window.location.reload();
      }
    });

    renderProfile();
    /* Xử lý nút Đăng xuất trong trang profile.html -> Quay về seeker-property-search.html */
    document.getElementById("btn-logout-account")?.addEventListener("click", () => {
      API.setSession(null);
      window.location.href = "seeker-property-search.html";
    });
  }
});
