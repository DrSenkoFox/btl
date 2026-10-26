const agentPostsStorageKey = "homefit-agent-posts";
const agentPostStatuses = new Set([
  "pending",
  "approved",
  "rejected",
  "revision",
  "draft",
  "archived",
]);

function getAgentPosts() {
  try {
    const raw = localStorage.getItem(agentPostsStorageKey);
    if (!raw) return window.HomeFitAPI?.getPosts() || [];
    const posts = JSON.parse(raw);
    return Array.isArray(posts)
      ? posts.filter((post) => post && typeof post.id === "string")
      : [];
  } catch {
    return [];
  }
}

function saveAgentPost(post) {
  if (!post?.id || typeof post.title !== "string") return false;
  try {
    const current = getAgentPosts();
    if (!post.code) post.code = `HF-${100 + current.length + 1}`;
    if (!post.area)
      post.area = post.location ? post.location.split(",")[0].trim() : "TP.HCM";
    localStorage.setItem(
      agentPostsStorageKey,
      JSON.stringify([post, ...current]),
    );
    window.dispatchEvent(new CustomEvent("homefit:agent-posts-change"));
    return true;
  } catch {
    return false;
  }
}

function updateAgentPostStatus(postId, status) {
  if (!agentPostStatuses.has(status)) return false;
  const posts = getAgentPosts();
  const post = posts.find((item) => item.id === postId);
  if (!post) return false;
  post.status = status;
  try {
    localStorage.setItem(agentPostsStorageKey, JSON.stringify(posts));
    window.dispatchEvent(new CustomEvent("homefit:agent-posts-change"));
    return true;
  } catch {
    return false;
  }
}

function deleteAgentPost(postId) {
  const posts = getAgentPosts();
  const filtered = posts.filter((item) => item.id !== postId);
  if (filtered.length === posts.length) return false;
  try {
    localStorage.setItem(agentPostsStorageKey, JSON.stringify(filtered));
    window.dispatchEvent(new CustomEvent("homefit:agent-posts-change"));
    return true;
  } catch {
    return false;
  }
}

window.HomeFitAgentPosts = Object.freeze({
  getAll: getAgentPosts,
  save: saveAgentPost,
  updateStatus: updateAgentPostStatus,
  delete: deleteAgentPost,
});

document.addEventListener("DOMContentLoaded", () => {
  const tbody = document.getElementById("agent-posts-tbody");
  if (!tbody) return;
  const leadsTbody = document.getElementById("agent-leads-tbody");
  const alertSection = document.getElementById("agent-alert");
  const alertTitle = document.getElementById("alert-title");
  const alertDesc = document.getElementById("alert-desc");
  const searchInput = document.getElementById("post-search");
  const areaSelect = document.getElementById("filter-area");
  const statusSelect = document.getElementById("filter-status");
  const tabButtons = document.querySelectorAll(".agent-tabs .tab-btn");
  const tableInfo = document.getElementById("table-info");
  const btnExport = document.getElementById("btn-export");
  const statTotal = document.getElementById("stat-total");
  const statApproved = document.getElementById("stat-approved");
  const statViews = document.getElementById("stat-views");
  const statViewsGrowth = document.getElementById("stat-views-growth");
  const statLeads = document.getElementById("stat-leads");
  const statLeadsPending = document.getElementById("stat-leads-pending");
  const statAppointments = document.getElementById("stat-appointments");
  const statNextAppointment = document.getElementById("stat-next-appointment");
  const brokerNameEl = document.getElementById("agent-broker-name");
  const categoryNameEl = document.getElementById("agent-category-name");
  const metaSepEl = document.getElementById("agent-meta-sep");
  function updateUserInfo() {
    let userName = "";
    try {
      const raw =
        localStorage.getItem("homefit-user") ||
        localStorage.getItem("homefit-agent") ||
        sessionStorage.getItem("homefit-user");
      if (raw) {
        const parsed = JSON.parse(raw);
        userName = typeof parsed === "string" ? parsed : parsed?.name || "";
      }
    } catch {
    }
    if (brokerNameEl) brokerNameEl.textContent = userName;
    if (categoryNameEl)
      categoryNameEl.textContent = userName ? userName.toUpperCase() : "";
    if (metaSepEl) metaSepEl.style.display = userName ? "inline" : "none";
  }
  let currentTab = "all";
  let searchKw = "";
  let currentArea = "";
  let currentStatus = "";
  const statusLabels = {
    approved: "Công khai",
    pending: "Chờ duyệt",
    revision: "Yêu cầu sửa",
    draft: "Nháp",
    rejected: "Từ chối",
    archived: "Đã lưu trữ",
  };
  function updateOverview(posts) {
    updateUserInfo();
    const counts = {
      all: posts.length,
      approved: 0,
      pending: 0,
      revision: 0,
      draft: 0,
    };
    posts.forEach((p) => {
      if (counts[p.status] !== undefined) counts[p.status]++;
    });
    ["all", "approved", "pending", "revision", "draft"].forEach((key) => {
      const el = document.getElementById(`count-${key}`);
      if (el) el.textContent = counts[key];
    });
    if (posts.length === 0) {

      if (statTotal) statTotal.textContent = "0";
      if (statApproved) statApproved.textContent = "0 đang công khai";
      if (statViews) statViews.textContent = "0";
      if (statViewsGrowth)
        statViewsGrowth.textContent = "+0% so với tuần trước";
      if (statLeads) statLeads.textContent = "0";
      if (statLeadsPending)
        statLeadsPending.textContent = "0 yêu cầu chưa tiếp nhận";
      if (statAppointments) statAppointments.textContent = "0";
      if (statNextAppointment)
        statNextAppointment.textContent = "Chưa có lịch hẹn";
      if (alertSection) alertSection.hidden = true;
      if (leadsTbody) {
        leadsTbody.innerHTML = `
          <tr class="table-empty-row">
            <td colspan="3">Chưa có yêu cầu liên hệ từ khách hàng.</td>
          </tr>
        `;
      }
    } else {
      if (statTotal) statTotal.textContent = String(counts.all);
      if (statApproved)
        statApproved.textContent = `${counts.approved} đang công khai`;
      if (statViews) statViews.textContent = String(counts.approved * 150);
      if (statViewsGrowth)
        statViewsGrowth.textContent = "+12% so với tuần trước";
      if (statLeads) statLeads.textContent = String(counts.approved * 3);
      if (statLeadsPending)
        statLeadsPending.textContent = "0 yêu cầu chưa tiếp nhận";
      if (statAppointments) statAppointments.textContent = "0";
      if (statNextAppointment)
        statNextAppointment.textContent = "Chưa có lịch hẹn";
      const revisionPost = posts.find((p) => p.status === "revision");
      if (alertSection) {
        if (revisionPost) {
          alertSection.hidden = false;
          if (alertTitle)
            alertTitle.textContent = `${revisionPost.title} cần bổ sung thông tin`;
          if (alertDesc) {
            alertDesc.textContent =
              revisionPost.moderationNote ||
              `${revisionPost.code || revisionPost.id}: kiểm duyệt viên yêu cầu bổ sung thông tin.`;
          }
        } else {
          alertSection.hidden = true;
        }
      }
    }
  }
  function renderTable() {
    const allPosts = getAgentPosts();
    updateOverview(allPosts);
    const filtered = allPosts.filter((post) => {
      if (currentTab !== "all" && post.status !== currentTab) return false;
      if (currentStatus && post.status !== currentStatus) return false;
      if (currentArea) {
        const a = (post.area || post.location || "").toLowerCase();
        if (!a.includes(currentArea.toLowerCase())) return false;
      }
      if (searchKw) {
        const kw = searchKw.toLowerCase();
        const str =
          `${post.code || ""} ${post.title || ""} ${post.location || ""}`.toLowerCase();
        if (!str.includes(kw)) return false;
      }
      return true;
    });
    if (tableInfo) {
      tableInfo.textContent = `Hiển thị ${filtered.length} / ${allPosts.length} bài · Cập nhật 03/10/2026`;
    }
    if (filtered.length === 0) {
      tbody.innerHTML = `
        <tr class="table-empty-row">
          <td colspan="5">Chưa có bài đăng nào. Bắt đầu bằng cách nhấn "+ Tạo bài đăng".</td>
        </tr>
      `;
      return;
    }
    tbody.innerHTML = filtered
      .map((post) => {
        const code = post.code || post.id;
        const area = post.area || "TP.HCM";
        const statusClass = `badge-${post.status}`;
        const statusLabel = statusLabels[post.status] || "—";
        let statsHtml = `<span style="color:#9cb0a7;">—</span>`;
        if (post.status === "approved" && post.views != null) {
          statsHtml = `${post.views} / ${post.saved || 0} / ${post.leads || 0}`;
        }
        let actions = "";
        if (post.status === "approved") {
          actions = `
            <a href="seeker-detail.html?id=${encodeURIComponent(post.id)}" class="action-link">Xem</a>
            <span class="action-sep">·</span>
            <a href="agent-post.html?edit=${encodeURIComponent(post.id)}" class="action-link">Sửa</a>
            <span class="action-sep">·</span>
            <button type="button" class="action-link" data-action="delete" data-id="${post.id}">Xóa</button>
          `;
        } else if (post.status === "revision") {
          actions = `
            <button type="button" class="action-link" data-action="reason" data-id="${post.id}">Xem lý do</button>
            <span class="action-sep">·</span>
            <a href="agent-post.html?edit=${encodeURIComponent(post.id)}" class="action-link">Sửa</a>
          `;
        } else if (post.status === "pending") {
          actions = `
            <button type="button" class="action-link" data-action="view" data-id="${post.id}">Xem</button>
            <span class="action-sep">·</span>
            <button type="button" class="action-link" data-action="draftify" data-id="${post.id}">Rút về nháp</button>
          `;
        } else {
          actions = `
            <a href="agent-post.html?edit=${encodeURIComponent(post.id)}" class="action-link">Tiếp tục sửa</a>
            <span class="action-sep">·</span>
            <button type="button" class="action-link" data-action="delete" data-id="${post.id}">Xóa nháp</button>
          `;
        }
        return `
          <tr data-post-id="${post.id}">
            <td>
              <p class="post-name">${code} • ${post.title}</p>
              <p class="post-area">${area}</p>
            </td>
            <td>${post.price || "—"}</td>
            <td><span class="${statusClass}">${statusLabel}</span></td>
            <td>${statsHtml}</td>
            <td>${actions}</td>
          </tr>
        `;
      })
      .join("");
  }
  tbody.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-action]");
    if (!btn) return;
    const action = btn.dataset.action;
    const postId = btn.dataset.id;
    const post = getAgentPosts().find((p) => p.id === postId);
    if (action === "reason") {
      alert(
        post?.moderationNote ||
          "Vui lòng cập nhật hình ảnh và thông tin theo yêu cầu kiểm duyệt.",
      );
    } else if (action === "view") {
      alert(
        `Bài đăng ${post?.code || post?.id}: ${post?.title}\nGiá: ${post?.price}\nKhu vực: ${post?.location || post?.area}`,
      );
    } else if (action === "draftify") {
      if (confirm(`Rút bài đăng "${post?.title}" về trạng thái Nháp?`)) {
        updateAgentPostStatus(postId, "draft");
      }
    } else if (action === "delete") {
      if (confirm(`Xác nhận xóa bài đăng "${post?.title}"?`)) {
        deleteAgentPost(postId);
      }
    }
  });
  tabButtons.forEach((tab) => {
    tab.addEventListener("click", () => {
      tabButtons.forEach((b) => b.classList.remove("is-active"));
      tab.classList.add("is-active");
      currentTab = tab.dataset.status;
      renderTable();
    });
  });
  searchInput?.addEventListener("input", (e) => {
    searchKw = e.target.value.trim();
    renderTable();
  });
  areaSelect?.addEventListener("change", (e) => {
    currentArea = e.target.value;
    renderTable();
  });
  statusSelect?.addEventListener("change", (e) => {
    currentStatus = e.target.value;
    renderTable();
  });
  btnExport?.addEventListener("click", () => {
    const posts = getAgentPosts();
    if (!posts.length) {
      alert("Chưa có bài đăng nào để xuất.");
      return;
    }
    const headers = ["Mã bài", "Tiêu đề", "Khu vực", "Giá", "Trạng thái"];
    const rows = posts.map((p) => [
      p.code || p.id,
      p.title,
      p.area || p.location,
      p.price,
      p.status,
    ]);
    const csv =
      "\uFEFF" +
      [headers.join(","), ...rows.map((r) => r.join(","))].join("\r\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(
      new Blob([csv], { type: "text/csv;charset=utf-8;" }),
    );
    a.download = `HomeFit_Posts_${Date.now()}.csv`;
    a.click();
  });
  window.addEventListener("homefit:agent-posts-change", renderTable);
  window.addEventListener("storage", (e) => {
    if (e.key === agentPostsStorageKey) renderTable();
  });
  renderTable();
});