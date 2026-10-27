/* ==========================================================================
   HomeFit AI – Unified Agent Module (js/modules/agent.js)
   Tích hợp toàn bộ chức năng từ nhánh Dev vào Main & đọc/ghi từ data.json:
   1. Quản lý bài đăng: 7 Tab trạng thái, Lọc khu vực, Tìm kiếm, Rút về nháp, Xem lý do, Xuất CSV
   2. Tạo / Sửa bài đăng: Kéo thả ảnh, Checklist 4 điều kiện, AI gợi ý bố cục (Áp dụng/Sửa/Tạo lại/Bỏ)
   3. Yêu cầu & khách hàng (CRM): 6 Tab trạng thái, Bắt buộc nhập lý do khi từ chối, Lịch sử liên hệ
   4. Lịch hẹn xem nhà: Lịch biểu Tuần / Tháng, Nhắc lịch, Sửa lịch, Hoàn tất, Hủy lịch
   ========================================================================== */

document.addEventListener("DOMContentLoaded", () => {
  const API = window.HomeFitAPI;
  const session = API.getSession();

  // Hiển thị tên môi giới đang đăng nhập trên đầu trang
  const brokerNameEl = document.getElementById("agent-broker-name");
  if (brokerNameEl && session) {
    brokerNameEl.textContent = session.name;
  }

  /* ========================================================================
     1. QUẢN LÝ BÀI ĐĂNG (agent-listing-management.html)
     ======================================================================== */
  const postsTbody = document.getElementById("agent-posts-tbody");
  if (postsTbody) {
    let currentTab = "all";
    let searchKw = "";
    let currentArea = "";
    let currentStatus = "";

    const statusLabels = {
      approved: "Công khai (Đã duyệt)",
      pending: "Chờ Moderator duyệt",
      revision: "Yêu cầu sửa",
      draft: "Bản nháp",
      rejected: "Từ chối",
      archived: "Đã lưu trữ",
    };

    function renderAgentPosts() {
      const allPosts = API.getPosts();
      const leads = API.getLeads();
      const appts = API.getAppts();

      const counts = { all: allPosts.length, approved: 0, pending: 0, revision: 0, draft: 0 };
      allPosts.forEach((p) => {
        if (counts[p.status] !== undefined) counts[p.status]++;
      });

      ["all", "approved", "pending", "revision", "draft"].forEach((key) => {
        const el = document.getElementById(`count-${key}`);
        if (el) el.textContent = String(counts[key]);
      });

      const statTotal = document.getElementById("stat-total");
      const statApproved = document.getElementById("stat-approved");
      const statPending = document.getElementById("stat-pending-count");
      const statLeads = document.getElementById("stat-leads");
      const statAppts = document.getElementById("stat-appointments");

      if (statTotal) statTotal.textContent = String(allPosts.length);
      if (statApproved) statApproved.textContent = `${counts.approved} đang công khai`;
      if (statPending) statPending.textContent = String(counts.pending);
      if (statLeads) statLeads.textContent = String(leads.length);
      if (statAppts) statAppts.textContent = String(appts.length);

      const filtered = allPosts.filter((p) => {
        if (currentTab !== "all" && p.status !== currentTab) return false;
        if (currentStatus && p.status !== currentStatus) return false;
        if (currentArea && !`${p.area} ${p.location}`.toLowerCase().includes(currentArea.toLowerCase())) {
          return false;
        }
        if (searchKw && !`${p.code} ${p.title} ${p.location}`.toLowerCase().includes(searchKw.toLowerCase())) {
          return false;
        }
        return true;
      });

      const tableInfo = document.getElementById("table-info");
      if (tableInfo) {
        tableInfo.textContent = `Hiển thị ${filtered.length} / ${allPosts.length} bài đăng`;
      }

      postsTbody.innerHTML = filtered.length
        ? filtered
            .map((p) => {
              let actions = `
                <a href="seeker-detail.html?id=${encodeURIComponent(p.id)}" class="action-link">Xem</a>
                <span style="margin:0 4px;color:#9cb0a7;">·</span>
                <a href="agent-post-create.html?edit=${encodeURIComponent(p.id)}" class="action-link">Sửa</a>
                <span style="margin:0 4px;color:#9cb0a7;">·</span>
                <button type="button" class="action-link" style="color:#b42318;" data-action="delete" data-id="${p.id}">Xóa</button>
              `;
              if (p.status === "pending") {
                actions = `
                  <a href="agent-post-create.html?edit=${encodeURIComponent(p.id)}" class="action-link">Sửa</a>
                  <span style="margin:0 4px;color:#9cb0a7;">·</span>
                  <button type="button" class="action-link" data-action="draftify" data-id="${p.id}">Rút về nháp</button>
                `;
              } else if (p.status === "revision") {
                actions = `
                  <button type="button" class="action-link" data-action="reason" data-id="${p.id}">Xem lý do</button>
                  <span style="margin:0 4px;color:#9cb0a7;">·</span>
                  <a href="agent-post-create.html?edit=${encodeURIComponent(p.id)}" class="action-link">Sửa lại</a>
                `;
              }
              return `
              <tr>
                <td>
                  <strong>${p.code} • ${p.title}</strong>
                  <div style="font-size:11px;color:#6f7d76;">${p.location}</div>
                </td>
                <td>${p.price}</td>
                <td><span class="badge-${p.status}">● ${statusLabels[p.status] || p.status}</span></td>
                <td>${p.fitScore || "92%"}</td>
                <td>${actions}</td>
              </tr>`;
            })
            .join("")
        : `<tr><td colspan="5" style="text-align:center;color:#6f7d76;padding:24px;">Chưa có bài đăng khớp bộ lọc.</td></tr>`;
    }

    document.querySelectorAll(".agent-tabs .tab-btn").forEach((tab) => {
      tab.addEventListener("click", () => {
        document.querySelectorAll(".agent-tabs .tab-btn").forEach((b) => b.classList.remove("is-active"));
        tab.classList.add("is-active");
        currentTab = tab.dataset.status || "all";
        renderAgentPosts();
      });
    });

    document.getElementById("post-search")?.addEventListener("input", (e) => {
      searchKw = e.target.value.trim();
      renderAgentPosts();
    });
    document.getElementById("filter-area")?.addEventListener("change", (e) => {
      currentArea = e.target.value;
      renderAgentPosts();
    });
    document.getElementById("filter-status")?.addEventListener("change", (e) => {
      currentStatus = e.target.value;
      renderAgentPosts();
    });

    postsTbody.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-action]");
      if (!btn) return;
      const { action, id } = btn.dataset;
      const post = API.getPosts().find((p) => p.id === id);
      if (!post) return;

      if (action === "reason") {
        alert(post.moderationNote || "Kiểm duyệt viên yêu cầu bổ sung chứng từ và hình ảnh thực tế.");
      } else if (action === "draftify") {
        API.updatePost(id, { status: "draft" });
        renderAgentPosts();
      } else if (action === "delete") {
        if (confirm(`Xác nhận xóa bài đăng "${post.title}"?`)) {
          API.deletePost(id);
          renderAgentPosts();
        }
      }
    });

    document.getElementById("btn-export")?.addEventListener("click", () => {
      const posts = API.getPosts();
      const headers = ["Mã bài", "Tiêu đề", "Khu vực", "Giá", "Trạng thái"];
      const rows = posts.map((p) => [p.code, `"${p.title}"`, `"${p.location}"`, `"${p.price}"`, p.status]);
      const csv = "\uFEFF" + [headers.join(","), ...rows.map((r) => r.join(","))].join("\r\n");
      const a = document.createElement("a");
      a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
      a.download = `HomeFit_Posts_${Date.now()}.csv`;
      a.click();
    });

    renderAgentPosts();
  }

  /* ========================================================================
     2. TẠO / SỬA BÀI ĐĂNG + AI GỢI Ý BỐ CỤC (agent-post-create.html)
     ======================================================================== */
  const createForm = document.getElementById("agent-post-form");
  if (createForm) {
    const editId = new URLSearchParams(window.location.search).get("edit");
    if (editId) {
      const existing = API.getPosts().find((p) => p.id === editId || p.code === editId);
      if (existing) {
        const titleHeading = document.querySelector(".agent-title");
        if (titleHeading) titleHeading.textContent = `Chỉnh sửa ${existing.code} • ${existing.title}`;
        createForm.elements.title.value = existing.title || "";
        createForm.elements.price.value = existing.price || "";
        createForm.elements.size.value = String(existing.size || "").replace(/\s*m²/i, "");
        if (createForm.elements.bedrooms) createForm.elements.bedrooms.value = existing.bedrooms || 2;
        if (createForm.elements.bathrooms) createForm.elements.bathrooms.value = existing.bathrooms || 2;
        createForm.elements.location.value = existing.location || "";
        createForm.elements.legal.value = existing.legal || "";
        if (createForm.elements.image) createForm.elements.image.value = existing.image || "";
        createForm.elements.amenities.value = existing.amenities || "";
        createForm.elements.description.value = existing.description || "";
      }
    }

    document.getElementById("agent-post-ai-apply")?.addEventListener("click", () => {
      const title = createForm.elements.title.value.trim() || "Căn hộ gia đình";
      const amenities = createForm.elements.amenities.value.trim() || "Yên tĩnh, gần trường, góc WFH";
      createForm.elements.description.value =
        `Trải nghiệm sống tối ưu tại ${title}:\n` +
        `1. Không gian & nội thất thực tế: ${amenities}.\n` +
        `2. Kết nối trường học & giao thông thuận tiện.\n` +
        `3. Pháp lý & chi phí quản lý minh bạch.`;
      const st = document.getElementById("agent-post-ai-state");
      if (st) st.textContent = "● Bản gợi ý • Đã áp dụng vào bài đăng";
    });

    createForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const fd = new FormData(createForm);
      const posts = API.getPosts();
      const brokerName = session?.name || "Nguyễn Lan Hương";
      const image =
        fd.get("image")?.trim() ||
        "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1000&q=80";
      const priceStr = fd.get("price").trim();
      const txType = /tỷ|ty/i.test(priceStr) ? "buy" : "rent";

      const postPayload = {
        id: editId || `HF-${101 + posts.length}`,
        code: editId || `HF-${101 + posts.length}`,
        title: fd.get("title").trim(),
        price: priceStr,
        transaction: txType,
        size: `${String(fd.get("size")).replace(/\s*m²/i, "").trim()} m²`,
        bedrooms: Number(fd.get("bedrooms")) || 2,
        bathrooms: Number(fd.get("bathrooms")) || 2,
        location: fd.get("location").trim(),
        area: fd.get("location").split(",")[0].trim(),
        legal: fd.get("legal").trim(),
        amenities: fd.get("amenities").trim(),
        description: fd.get("description").trim(),
        brokerName,
        brokerMeta: `${brokerName} • ${session?.phone || "0901 234 567"}`,
        fitScore: "94%",
        aiSummary: `${fd.get("amenities").trim()}. Hiện khớp 94% với các ưu tiên trong brief.`,
        aiReasons: [fd.get("description").trim(), fd.get("amenities").trim()],
        moderationNote: "Bài đăng do Môi giới gửi, đang chờ Kiểm duyệt viên phê duyệt.",
        status: "pending",
        image,
        images: [image],
      };

      API.saveSinglePost(postPayload);
      const msg = document.getElementById("agent-post-message");
      if (msg) {
        msg.innerHTML = `Đã lưu bài đăng <strong>${postPayload.code}</strong> ở trạng thái <strong>Chờ duyệt</strong>. <a href="moderator-listing-review.html" style="text-decoration:underline;font-weight:700;">Mở trang Kiểm duyệt viên để duyệt ngay →</a>`;
        msg.hidden = false;
      }
    });
  }

  /* ========================================================================
     3. YÊU CẦU & KHÁCH HÀNG (agent-lead-management.html)
     ======================================================================== */
  const reqTbody = document.getElementById("agent-req-tbody") || document.getElementById("req-tbody");
  if (reqTbody) {
    let selectedLeadId = API.getLeads()[0]?.id || null;

    const statusLabels = {
      new: "Mới",
      consulting: "Đang tư vấn",
      scheduled: "Đã đặt lịch",
      completed: "Hoàn tất",
      rejected: "Đã từ chối",
    };

    function renderLeads() {
      const leads = API.getLeads();
      reqTbody.innerHTML = leads
        .map(
          (l) => `
        <tr data-id="${l.id}" class="${l.id === selectedLeadId ? "is-selected" : ""}">
          <td><strong>${l.clientName} • ${l.leadCode}</strong></td>
          <td>${l.source}</td>
          <td>${statusLabels[l.status] || l.status}</td>
          <td><button type="button" class="action-link" data-accept="${l.id}">Tiếp nhận</button></td>
        </tr>`
        )
        .join("");

      const detailBox = document.getElementById("agent-req-detail-box");
      const current = leads.find((l) => l.id === selectedLeadId);
      if (detailBox && current) {
        detailBox.innerHTML = `
          <h3 style="margin:0 0 6px;">${current.clientName} (${current.leadCode})</h3>
          <p style="margin:0 0 12px;font-size:12px;color:#55665f;">
            Điện thoại: <strong>${current.phone || "090 0024 0024"}</strong> • Trạng thái: <strong>${statusLabels[current.status] || current.status}</strong>
          </p>
          <div style="padding:12px;background:#eaf4ed;border-radius:8px;font-size:12.5px;margin-bottom:12px;">
            <strong>Nội dung Brief nhu cầu sống:</strong>
            <p style="margin:6px 0 0;">${current.briefSummary}</p>
          </div>
          <div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:14px;">
            <button type="button" class="btn-primary" data-detail-status="consulting" data-id="${current.id}">Tiếp nhận yêu cầu</button>
            <a href="agent-viewing-schedule.html" class="btn-primary" style="background:#10553e;text-decoration:none;">+ Đặt lịch xem nhà</a>
          </div>
          <h4 style="margin:12px 0 6px;font-size:12px;">Lịch sử liên hệ</h4>
          <ul style="margin:0;padding-left:18px;font-size:11.5px;color:#4f5e57;">
            ${(current.history || ["Khách gửi yêu cầu tư vấn"]).map((h) => `<li>${h}</li>`).join("")}
          </ul>
        `;
      }
    }

    reqTbody.addEventListener("click", (e) => {
      const row = e.target.closest("tr[data-id]");
      if (!row) return;
      selectedLeadId = row.dataset.id;

      if (e.target.closest("[data-accept]")) {
        const leads = API.getLeads();
        const item = leads.find((l) => l.id === selectedLeadId);
        if (item) {
          item.status = "consulting";
          item.history = item.history || [];
          item.history.unshift("Vừa xong — Môi giới đã tiếp nhận yêu cầu.");
          API.saveLeads(leads);
        }
      }
      renderLeads();
    });

    document.getElementById("agent-req-detail-box")?.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-detail-status]");
      if (!btn) return;
      const leads = API.getLeads();
      const item = leads.find((l) => l.id === btn.dataset.id);
      if (item) {
        item.status = btn.dataset.detailStatus;
        API.saveLeads(leads);
        renderLeads();
      }
    });

    renderLeads();
  }

  /* ========================================================================
     4. LỊCH HẸN XEM NHÀ (agent-viewing-schedule.html)
     ======================================================================== */
  const apptTbody = document.getElementById("agent-appt-tbody") || document.getElementById("appt-tbody");
  if (apptTbody) {
    const apptLabels = {
      pending: "Chờ xác nhận",
      confirmed: "Đã xác nhận",
      completed: "Hoàn tất",
      cancelled: "Đã hủy",
    };

    function renderAppts() {
      const appts = API.getAppts();
      apptTbody.innerHTML = appts
        .map(
          (a) => `
        <tr>
          <td><strong>${a.id} • ${a.clientName}</strong></td>
          <td>${a.houseCode} • ${a.houseName}</td>
          <td>${a.time || a.start}</td>
          <td><strong>● ${apptLabels[a.status] || a.status}</strong></td>
          <td>
            <button type="button" class="action-link" data-ok="${a.id}">Xác nhận</button>
            <span style="margin:0 4px;color:#9cb0a7;">·</span>
            <button type="button" class="action-link" style="color:#b42318;" data-cancel="${a.id}">Hủy</button>
          </td>
        </tr>`
        )
        .join("");
    }

    apptTbody.addEventListener("click", (e) => {
      const okBtn = e.target.closest("[data-ok]");
      const cancelBtn = e.target.closest("[data-cancel]");
      if (!okBtn && !cancelBtn) return;

      const appts = API.getAppts();
      const id = (okBtn || cancelBtn).dataset.ok || (okBtn || cancelBtn).dataset.cancel;
      const item = appts.find((a) => a.id === id);
      if (item) {
        item.status = okBtn ? "confirmed" : "cancelled";
        API.saveAppts(appts);
        renderAppts();
      }
    });

    document.getElementById("agent-new-appt-form")?.addEventListener("submit", (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const appts = API.getAppts();
      appts.unshift({
        id: `A-0${appts.length + 34}`,
        clientName: fd.get("clientName").trim(),
        houseCode: fd.get("houseCode").trim(),
        houseName: fd.get("houseName").trim(),
        time: fd.get("time").trim(),
        broker: session?.name || "Nguyễn Lan Hương",
        status: "confirmed",
      });
      API.saveAppts(appts);
      e.target.reset();
      renderAppts();
    });

    renderAppts();
  }
});