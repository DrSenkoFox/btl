/* ==========================================================================
   HomeFit AI – Admin Module (js/modules/admin.js)
   ========================================================================== */

document.addEventListener("DOMContentLoaded", () => {
  const API = window.HomeFitAPI;

  const adminForm = document.getElementById("admin-user-form");
  if (adminForm) {
    let selectedUserId = "U-012";

    const roleTitles = {
      admin: "Quản trị viên",
      moderator: "Kiểm duyệt viên",
      agent: "Môi giới",
      seeker: "Người tìm nhà",
    };

    function renderAdminUsers() {
      const users = API.getUsers();
      if (!users.some((u) => u.id === selectedUserId)) {
        selectedUserId = users[0]?.id;
      }

      const admins = users.filter((u) => u.role === "admin");
      const mods = users.filter((u) => u.role === "moderator");

      const itemHtml = (u) => `
        <li>
          <button type="button" class="ops-roster-item ${u.id === selectedUserId ? "is-selected" : ""}" data-uid="${u.id}">
            <p class="ops-roster-name">${u.id} • ${u.name}</p>
            <p class="ops-roster-sub">${u.email}</p>
          </button>
        </li>`;

      document.getElementById("admin-list-admins").innerHTML = admins.map(itemHtml).join("");
      document.getElementById("admin-list-mods").innerHTML = mods.map(itemHtml).join("");

      const cur = users.find((u) => u.id === selectedUserId) || users[0];
      if (!cur) return;

      document.getElementById("admin-selected-heading").textContent = `${cur.id} • ${cur.name}`;
      document.getElementById("admin-selected-role-pill").textContent = roleTitles[cur.role] || cur.role;
      document.getElementById("admin-user-id").value = cur.id;
      document.getElementById("admin-user-name").value = cur.name;
      document.getElementById("admin-user-email").value = cur.email;
      document.getElementById("admin-user-phone").value = cur.phone || "";
      document.getElementById("admin-user-role").value = cur.role;

      const perms = cur.perms || [];
      document.getElementById("perm-review").checked = perms.includes("review");
      document.getElementById("perm-ban").checked = perms.includes("ban");
      document.getElementById("perm-taxonomy").checked = perms.includes("taxonomy");
      document.getElementById("admin-user-reason").value = "";
    }

    document.addEventListener("click", (e) => {
      const uBtn = e.target.closest("[data-uid]");
      if (uBtn) {
        selectedUserId = uBtn.dataset.uid;
        renderAdminUsers();
        return;
      }

      const addBtn = e.target.closest("[data-add-role]");
      if (addBtn) {
        const role = addBtn.dataset.addRole;
        const users = API.getUsers();
        const newId = `U-0${users.length + 35}`;
        users.push({
          id: newId,
          name: role === "admin" ? "Quản trị viên mới" : "Kiểm duyệt viên mới",
          email: `nhansu${users.length + 1}@example.com`,
          phone: "0912345678",
          role,
          perms: role === "admin" ? ["review", "ban", "taxonomy"] : ["review"],
        });
        API.saveUsers(users);
        selectedUserId = newId;
        renderAdminUsers();
        document.getElementById("admin-user-name").focus();
      }
    });

    adminForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const users = API.getUsers();
      const cur = users.find((u) => u.id === selectedUserId);
      if (!cur) return;

      cur.name = document.getElementById("admin-user-name").value.trim();
      cur.email = document.getElementById("admin-user-email").value.trim();
      cur.phone = document.getElementById("admin-user-phone").value.trim();
      cur.role = document.getElementById("admin-user-role").value;
      cur.perms = [
        document.getElementById("perm-review").checked && "review",
        document.getElementById("perm-ban").checked && "ban",
        document.getElementById("perm-taxonomy").checked && "taxonomy",
      ].filter(Boolean);

      API.saveUsers(users);
      const reason = document.getElementById("admin-user-reason").value.trim();
      const log = document.getElementById("admin-audit-log");
      const li = document.createElement("li");
      li.textContent = `Vừa xong • Cập nhật ${cur.id} (${cur.name}): ${reason}`;
      log.prepend(li);
      renderAdminUsers();
    });

    document.getElementById("btn-admin-delete")?.addEventListener("click", () => {
      const users = API.getUsers();
      if (users.length <= 1) return;
      const next = users.filter((u) => u.id !== selectedUserId);
      API.saveUsers(next);
      selectedUserId = next[0].id;
      renderAdminUsers();
    });

    renderAdminUsers();
  }
  /* 2. Trang Quản lý dữ liệu hệ thống (admin-platform-dashboard.html) */
  const dashPostsRoster = document.getElementById("dash-posts-roster");
  if (dashPostsRoster) {
    function renderDashboard() {
      const posts = API.getPosts();
      const users = API.getUsers();
      const leads = API.getLeads();
      const appts = API.getAppts();
      const reports = API.getReports();

      const approved = posts.filter((p) => p.status === "approved").length;
      const pending = posts.filter((p) => p.status === "pending").length;

      document.getElementById("dash-stat-posts").value = `${posts.length} tin đăng (${approved} công khai • ${pending} chờ duyệt)`;
      document.getElementById("dash-stat-users").value = `${users.length} tài khoản trên 4 vai trò`;
      document.getElementById("dash-stat-leads").value = `${leads.length} hồ sơ Brief & yêu cầu tư vấn`;
      document.getElementById("dash-stat-appts").value = `${appts.length} lịch hẹn • ${reports.length} báo cáo`;
      document.getElementById("dash-sync-preview").value =
        `[Đồng bộ OK] Bài đăng mới nhất: ${posts[0]?.code} - ${posts[0]?.title} (${posts[0]?.status})\n` +
        `[Đồng bộ OK] Tài khoản mới nhất: ${users[users.length - 1]?.name} (${users[users.length - 1]?.email})`;

      dashPostsRoster.innerHTML = posts
        .map(
          (p) => `
        <li>
          <div class="ops-roster-item">
            <p class="ops-roster-name">${p.code} • ${p.title}</p>
            <p class="ops-roster-sub">${p.price} • Trạng thái: ${p.status}</p>
          </div>
        </li>`
        )
        .join("");
    }

    document.getElementById("btn-dash-export")?.addEventListener("click", () => {
      const dump = {
        posts: API.getPosts(),
        users: API.getUsers(),
        leads: API.getLeads(),
        appointments: API.getAppts(),
      };
      const blob = new Blob([JSON.stringify(dump, null, 2)], { type: "application/json" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "homefit-ai-database.json";
      a.click();
    });

    document.getElementById("btn-dash-seed-post")?.addEventListener("click", () => {
      const posts = API.getPosts();
      const code = `P-${String(posts.length + 1).padStart(2, "0")}`;
      posts.unshift({
        id: code,
        code,
        title: `Empire City Thủ Thiêm 2PN view sông (${code})`,
        location: "TP. Thủ Đức, TP.HCM",
        area: "TP. Thủ Đức",
        price: "25 triệu / tháng",
        size: "92 m²",
        bedrooms: 2,
        bathrooms: 2,
        brokerName: "Trần Quốc Bảo",
        fitScore: "96%",
        status: "pending",
        moderationNote: "Vừa khởi tạo nhanh từ trang Quản lý dữ liệu, đang chờ Moderator duyệt.",
        image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1000&q=80",
      });
      API.savePosts(posts);
      renderDashboard();
    });

    document.getElementById("btn-dash-reset")?.addEventListener("click", () => {
      if (confirm("Khôi phục toàn bộ dữ liệu bài đăng và tài khoản về trạng thái mặc định ban đầu?")) {
        localStorage.clear();
        window.location.reload();
      }
    });

    renderDashboard();
  }

  /* 3. Trang Tùy chỉnh trang web & Taxonomy (admin-category-management.html) */
  const taxForm = document.getElementById("admin-taxonomy-form");
  if (taxForm) {
    const TAX_KEY = "homefit-taxonomy-db";
    const defaultTax = [
      {
        id: "TAX-01",
        name: "Yên tĩnh & Cách âm WFH",
        weight: 40,
        keywords: "yên tĩnh, ít tiếng ồn, làm việc tại nhà, wfh, cách âm",
        desc: "Ưu tiên căn hộ tầng cao hoặc hướng nội khu, độ ồn dưới 45dB và có góc bàn làm việc đón sáng tự nhiên.",
      },
      {
        id: "TAX-02",
        name: "Gần trường học cho con",
        weight: 35,
        keywords: "gần trường, trường quốc tế, đưa đón con, gia đình",
        desc: "Bán kính di chuyển tới trường mầm non / tiểu học dưới 15 phút, đường nội khu an toàn.",
      },
      {
        id: "TAX-03",
        name: "Gần Metro & Kết nối giao thông",
        weight: 25,
        keywords: "gần metro, ga tàu, đi làm, giao thông thuận tiện",
        desc: "Cách trạm Metro hoặc trục giao thông chính dưới 500m, tối ưu tổng chi phí đi lại.",
      },
    ];

    const getTax = () => {
      try {
        return JSON.parse(localStorage.getItem(TAX_KEY)) || defaultTax;
      } catch {
        return defaultTax;
      }
    };
    const saveTax = (list) => localStorage.setItem(TAX_KEY, JSON.stringify(list));

    let selectedTaxId = "TAX-01";

    function renderTaxonomy() {
      const list = getTax();
      if (!list.some((t) => t.id === selectedTaxId)) selectedTaxId = list[0]?.id;

      document.getElementById("tax-roster-list").innerHTML = list
        .map(
          (t) => `
        <li>
          <button type="button" class="ops-roster-item ${t.id === selectedTaxId ? "is-selected" : ""}" data-tax="${t.id}">
            <p class="ops-roster-name">${t.id} • ${t.name}</p>
            <p class="ops-roster-sub">Trọng số AI: ${t.weight}%</p>
          </button>
        </li>`
        )
        .join("");

      const cur = list.find((t) => t.id === selectedTaxId) || list[0];
      if (!cur) return;
      document.getElementById("tax-selected-heading").textContent = `${cur.id} • ${cur.name}`;
      document.getElementById("tax-id").value = cur.id;
      document.getElementById("tax-name").value = cur.name;
      document.getElementById("tax-weight").value = cur.weight;
      document.getElementById("tax-keywords").value = cur.keywords;
      document.getElementById("tax-desc").value = cur.desc;
    }

    document.getElementById("tax-roster-list").addEventListener("click", (e) => {
      const btn = e.target.closest("[data-tax]");
      if (!btn) return;
      selectedTaxId = btn.dataset.tax;
      renderTaxonomy();
    });

    document.getElementById("btn-tax-add")?.addEventListener("click", () => {
      const list = getTax();
      const newId = `TAX-0${list.length + 1}`;
      list.push({
        id: newId,
        name: "Tiêu chí lối sống mới",
        weight: 20,
        keywords: "ban công, cây xanh, thú cưng",
        desc: "Mô tả tiêu chí mới phục vụ bộ lọc AI Lifestyle Matcher.",
      });
      saveTax(list);
      selectedTaxId = newId;
      renderTaxonomy();
      document.getElementById("tax-name").focus();
    });

    taxForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const list = getTax();
      const cur = list.find((t) => t.id === selectedTaxId);
      if (cur) {
        cur.name = document.getElementById("tax-name").value.trim();
        cur.weight = Number(document.getElementById("tax-weight").value) || 25;
        cur.keywords = document.getElementById("tax-keywords").value.trim();
        cur.desc = document.getElementById("tax-desc").value.trim();
        saveTax(list);
        renderTaxonomy();
      }
    });

    document.getElementById("btn-tax-delete")?.addEventListener("click", () => {
      const list = getTax();
      if (list.length <= 1) return;
      const next = list.filter((t) => t.id !== selectedTaxId);
      saveTax(next);
      selectedTaxId = next[0].id;
      renderTaxonomy();
    });

    renderTaxonomy();
  }
});