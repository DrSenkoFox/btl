const agentPostsStorageKey = "homefit-agent-posts";
const agentPostStatuses = new Set([
  "pending",
  "approved",
  "rejected",
  "revision",
  "draft",
  "archived",
]);

const demoBrokers = {
  "nguyen-lan-huong": ["Nguyễn Lan Hương", "0901 234 567"],
  "tran-minh-quan": ["Trần Minh Quân", "0902 876 543"],
  "le-thao-vy": ["Lê Thảo Vy", "0903 456 128"],
  "do-hoai-nam": ["Đỗ Hoài Nam", "0904 762 311"],
  "trinh-my-dung": ["Trịnh Mỹ Dung", "0905 318 774"],
};

const demoNearby = {
  "Quận 2": [
    ["Trường quốc tế BIS", "8 phút đi bộ", "Trường học"],
    ["Ga metro R1 An Phú", "400 m", "Giao thông"],
    ["Siêu thị An Phú", "600 m", "Mua sắm"],
  ],
  "TP. Thủ Đức": [
    ["Đại học Quốc gia TP.HCM", "1,2 km", "Trường học"],
    ["Khu công nghệ cao", "2,5 km", "Làm việc"],
    ["Chợ Thảo Điền", "900 m", "Mua sắm"],
  ],
  "Bình Thạnh": [
    ["Bệnh viện Gia Định", "1,5 km", "Y tế"],
    ["UNBD quận Bình Thạnh", "700 m", "Hành chính"],
    ["Công viên Lê Thị Hồng", "500 m", "Không gian xanh"],
  ],
  "Quận 7": [
    ["Crescent Mall", "3,5 km", "Mua sắm"],
    ["Trường SSBS", "2 km", "Trường học"],
    ["Bệnh viện FV", "4 km", "Y tế"],
  ],
  "Phú Nhuận": [
    ["Sân bay Tân Sơn Nhất", "3 km", "Giao thông"],
    ["Công viên Gia Định", "1,2 km", "Không gian xanh"],
    ["Bệnh viện Hoàn Mỹ", "800 m", "Y tế"],
  ],
  "Quận 4": [
    ["Bitexco", "2 km", "Làm việc"],
    ["Chợ Xóm Chiếu", "400 m", "Mua sắm"],
    ["Trường Tiểu học Bình Khánh", "900 m", "Trường học"],
  ],
  "Tân Bình": [
    ["Công viên Gia Định", "1 km", "Không gian xanh"],
    ["Bệnh viện 175", "2,5 km", "Y tế"],
    ["Chợ Phạm Văn Hai", "600 m", "Mua sắm"],
  ],
  "Quận 3": [
    ["Bệnh viện Từ Dũ", "900 m", "Y tế"],
    ["Trường Nguyễn Thị Minh Khai", "700 m", "Trường học"],
    ["Công viên Lê Văn Tám", "1,2 km", "Không gian xanh"],
  ],
};

const demoAgentPosts = [
  ["River Park căn góc, ban công hướng sông", "Quận 2, TP.HCM", "19 triệu / tháng", 80, 2, 2, 230, 18, 4, "approved", "nguyen-lan-huong", 98, "Căn góc hai mặt thoáng, ban công nhìn sông; khu yên tĩnh phù hợp làm việc tại nhà; 8 phút tới trường quốc tế.", "photo-1600210492486-724fe5c67fb0 photo-1600585154340-be6161a56a0c photo-1600121848594-d8644e57abab"],
  ["Lumi Studio gần metro, ánh sáng tự nhiên", "Quận 2, TP.HCM", "11 triệu / tháng", 38, 1, 1, 165, 9, 2, "approved", "tran-minh-quan", 92, "Cách metro 400 m, tổng chi phí đi lại thấp; cửa sổ lớn lấy sáng tự nhiên; nội thất cơ bản vào ở ngay.", "photo-1522708323590-d24dbb6b0267 photo-1584622650111-993a426fbf0a photo-1560185007-cde436f6a4d0"],
  ["Garden House 2 phòng ngủ có sân vườn", "TP. Thủ Đức", "17 triệu / tháng", 95, 2, 2, 240, 12, 3, "approved", "le-thao-vy", 86, "Sân vườn riêng, nuôi được thú cưng; pháp lý sổ hồng rõ ràng; tiện cho gia đình nhiều thế hệ.", "photo-1560185007-cde436f6a4d0 photo-1484154218962-a197022b5858 photo-1600047509807-ba8f99d2cdde"],
  ["Sunrise 1PN full nội thất, vào ở ngay", "Bình Thạnh, TP.HCM", "12 triệu / tháng", 45, 1, 1, 180, 21, 5, "approved", "do-hoai-nam", 90, "Full nội thất, hợp đồng ngắn hạn linh hoạt; toà nhà có gym và siêu thị; phản hồi nhanh trong ngày.", "photo-1600121848594-d8644e57abab photo-1512917774080-9991f1c4c750 photo-1600210492486-724fe5c67fb0"],
  ["Masteris 3PN thoáng, gần trường học", "Quận 2, TP.HCM", "26 triệu / tháng", 120, 3, 2, 310, 15, 6, "approved", "nguyen-lan-huong", 95, "Ba phòng ngủ, hai vệ sinh, đủ chỗ cho gia đình; đối tượng phù hợp nhu cầu gần trường học; nội thất đầy đủ.", "photo-1600585154340-be6161a56a0c photo-1600596542815-ffad4c1539a9 photo-1600607687939-ce8a6c25118c"],
  ["Eco Green 2PN yên tĩnh, góc làm việc WFH", "Quận 2, TP.HCM", "15 triệu / tháng", 72, 2, 1, 195, 7, 1, "approved", "trinh-my-dung", 88, "Góc làm việc riêng, tầng cao ít tiếng ồn; nhiều cây xanh và công viên nội khu; căn hộ dịch vụ có vệ sinh.", "photo-1600566753086-00f18fb6b3ea photo-1600121848594-d8644e57abab photo-1484154218962-a197022b5858"],
  ["Thảo Điền villa 4PN có hồ bơi", "TP. Thủ Đức", "45 triệu / tháng", 200, 4, 3, 140, 4, 2, "pending", "trinh-my-dung", 80, "Villa hồ bơi riêng, phù hợp gia đình đông người; khu an ninh 24/7; cần kiểm tra pháp lý trước khi công khai.", "photo-1600607687939-ce8a6c25118c photo-1600047509807-ba8f99d2cdde photo-1522708323590-d24dbb6b0267"],
  ["Chung cư Victoria Quận 7, hai mặt thoáng", "Quận 7, TP.HCM", "14 triệu / tháng", 68, 2, 2, 152, 11, 3, "approved", "le-thao-vy", 91, "Ban công hướng đông, phòng khách nhận sáng tự nhiên; hồ bơi và gym trong toà; 10 phút tới Crescent Mall.", "photo-1554995207-c18c203602cb photo-1605276374104-dee2a0ed3cd6 photo-1616486338812-3dadae4b4ace"],
  ["Nhà nguyên căn hẻm xe hơi Phú Nhuận", "Phú Nhuận, TP.HCM", "22 triệu / tháng", 90, 3, 2, 198, 8, 4, "approved", "nguyen-lan-huong", 84, "Hẻm xe hơi 6 m, đậu được ô tô trong nhà; gần sân bay và bệnh viện; hai tầng nên mỗi người có góc riêng.", "photo-1580587771525-78b9dba3b914 photo-1600585154340-be6161a56a0c photo-1484154218962-a197022b5858"],
  ["Căn hộ dịch vụ Quận 4, gần trung tâm", "Quận 4, TP.HCM", "9 triệu / tháng", 32, 1, 1, 210, 24, 6, "approved", "do-hoai-nam", 89, "Cách Bitexco 7 phút xe máy; vệ sinh khép kín, có giặt sấy; giờ giấc linh hoạt cho người đi làm ca.", "photo-1512918728675-ed5a9ecdebfd photo-1584622650111-993a426fbf0a photo-1522708323590-d24dbb6b0267"],
  ["The Golden Manor 3PN, nội thất cơ bản", "Tân Bình, TP.HCM", "18 triệu / tháng", 88, 3, 2, 134, 6, 2, "approved", "trinh-my-dung", 82, "Ba phòng ngủ, phòng sinh hoạt chung rộng; gần công viên Gia Định và chợ; có thang máy và hầm xe.", "photo-1600566753086-00f18fb6b3ea photo-1600596542815-ffad4c1539a9 photo-1512917774080-9991f1c4c750"],
  ["Studio nhỏ yên tĩnh Quận 3, vào ở ngay", "Quận 3, TP.HCM", "7 triệu / tháng", 28, 1, 1, 276, 19, 5, "approved", "tran-minh-quan", 78, "Tầng cao ít tiếng ồn, cửa sổ nhìn ra nội khu; đã bố trí bàn làm việc; 3 phút tới trường và bệnh viện.", "photo-1560185007-cde436f6a4d0 photo-1600121848594-d8644e57abab photo-1600047509807-ba8f99d2cdde"],
  ["Sunrise Riverside 2PN bàn giao đầy đủ", "Quận 7, TP.HCM", "16 triệu / tháng", 74, 2, 1, 88, 5, 1, "revision", "nguyen-lan-huong", 93, "Bàn giao đủ nội thất, chỉ cần vào ở; view sông và công viên nội khu; thiếu ảnh mặt bằng nên đang chờ bổ sung.", "photo-1600607687939-ce8a6c25118c photo-1600585154340-be6161a56a0c photo-1605276374104-dee2a0ed3cd6"],
].map(
  (
    [title, location, price, size, bedrooms, bathrooms, views, saved, leads, status, broker, fit, reasons, photos],
    index,
  ) => {
    const images = photos.split(" ").map(
      (photo) =>
        `https://images.unsplash.com/${photo}?auto=format&fit=crop&w=900&q=80`,
    );
    const [brokerName, contact] = demoBrokers[broker];
    const area = location.split(",")[0].trim();
    const firstReason = reasons.split("; ")[0];
    return {
      id: `HF-${101 + index}`,
      code: `HF-${101 + index}`,
      title,
      location,
      area,
      price,
      transaction: "rent",
      size: `${size} m²`,
      bedrooms,
      bathrooms,
      floor: `Tầng ${(index % 14) + 2}`,
      description: `${title} • ${size} m², ${bedrooms} phòng ngủ, ${bathrooms} vệ sinh. ${firstReason}. Khu yên tĩnh, an ninh 24/7.`,
      furnishing: "Đầy đủ nội thất",
      legal: "Sổ hồng riêng",
      amenities: "Gần metro, siêu thị, công viên, trường học quốc tế.",
      contract: "Hợp đồng 12 tháng",
      costs: `Điện nước theo hoá đơn · phí quản lý ~${Math.round(size * 8)}k/tháng`,
      availableDate: "2026-11-01",
      image: images[0],
      images,
      broker,
      brokerName,
      brokerMeta: `${brokerName} • ${contact}`,
      contact,
      fitScore: `${fit}%`,
      aiSummary: `${firstReason}. Hiện khớp ${fit}% với các ưu tiên trong brief của bạn.`,
      aiReasons: reasons.split("; "),
      nearby: (demoNearby[area] || []).map(([name, distance, type]) => ({
        name,
        distance,
        type,
      })),
      status,
      views,
      saved,
      leads,
      createdAt: new Date(Date.now() - (index + 1) * 864e5).toISOString(),
    };
  },
);

const storedAgentPosts = getAgentPosts();
// Nhà mẫu: thêm bài còn thiếu, bổ sung trường mới cho bài đã lưu, giữ nguyên bài và trạng thái đã duyệt
const upgradedPosts = storedAgentPosts.map((post) => {
  const demo = demoAgentPosts.find((item) => item.id === post.id);
  return demo && !post.nearby ? { ...post, ...demo, status: post.status } : post;
});
const missingDemoPosts = demoAgentPosts.filter(
  (demo) => !upgradedPosts.some((post) => post.id === demo.id),
);
if (
  missingDemoPosts.length ||
  JSON.stringify(upgradedPosts) !== JSON.stringify(storedAgentPosts)
) {
  localStorage.setItem(
    agentPostsStorageKey,
    JSON.stringify([...upgradedPosts, ...missingDemoPosts]),
  );
}

function getAgentPosts() {
  try {
    const raw = localStorage.getItem(agentPostsStorageKey);
    if (!raw) return [];
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

/* ==========================================================================
   Page Controller for agent-posts.html
   ========================================================================== */
document.addEventListener("DOMContentLoaded", () => {
  const tbody = document.getElementById("agent-posts-tbody");
  if (!tbody) return;

  const leadsTbody = document.getElementById("agent-leads-tbody");
  const alertSection = document.getElementById("agent-alert");
  const alertTitle = document.getElementById("alert-title");
  const alertDesc = document.getElementById("alert-desc");

  // Elements
  const searchInput = document.getElementById("post-search");
  const areaSelect = document.getElementById("filter-area");
  const statusSelect = document.getElementById("filter-status");
  const tabButtons = document.querySelectorAll(".agent-tabs .tab-btn");
  const tableInfo = document.getElementById("table-info");
  const btnExport = document.getElementById("btn-export");

  // Stats
  const statTotal = document.getElementById("stat-total");
  const statApproved = document.getElementById("stat-approved");
  const statViews = document.getElementById("stat-views");
  const statViewsGrowth = document.getElementById("stat-views-growth");
  const statLeads = document.getElementById("stat-leads");
  const statLeadsPending = document.getElementById("stat-leads-pending");
  const statAppointments = document.getElementById("stat-appointments");
  const statNextAppointment = document.getElementById("stat-next-appointment");

  // User elements (khung rỗng ban đầu, khi đăng nhập sẽ hiển thị)
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
      // Chưa đăng nhập
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
      // Mặc định ban đầu trạng thái rỗng
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
      // Khi đã có dữ liệu bài đăng được tạo
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

  // Tương tác nút bấm trong bảng
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

  // Tab lọc trạng thái
  tabButtons.forEach((tab) => {
    tab.addEventListener("click", () => {
      tabButtons.forEach((b) => b.classList.remove("is-active"));
      tab.classList.add("is-active");
      currentTab = tab.dataset.status;
      renderTable();
    });
  });

  // Tìm kiếm & Lọc
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

  // Xuất CSV
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

  // Lắng nghe sự kiện đồng bộ
  window.addEventListener("homefit:agent-posts-change", renderTable);
  window.addEventListener("storage", (e) => {
    if (e.key === agentPostsStorageKey) renderTable();
  });

  renderTable();
});
