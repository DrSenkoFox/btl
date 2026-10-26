/* ==========================================================================
   HomeFit AI – Agent Module (js/modules/agent.js)
   Hỗ trợ Xem, Tạo mới, Chỉnh sửa bài đăng (?edit=ID), Xóa bài, Leads & Lịch hẹn
   ========================================================================== */

document.addEventListener("DOMContentLoaded", () => {
  const API = window.HomeFitAPI;

  /* 1. Quản lý bài đăng (agent-listing-management.html) */
  const postsTbody = document.getElementById("agent-posts-tbody");
  if (postsTbody) {
    function renderAgentPosts() {
      const posts = API.getPosts();
      const leads = API.getLeads();
      const appts = API.getAppts();

      document.getElementById("stat-total").textContent = String(posts.length);
      document.getElementById("stat-approved").textContent = `${
        posts.filter((p) => p.status === "approved").length
      } đang công khai`;
      document.getElementById("stat-pending-count").textContent = String(
        posts.filter((p) => p.status === "pending").length
      );
      document.getElementById("stat-leads").textContent = String(leads.length);
      document.getElementById("stat-appointments").textContent = String(appts.length);

      const labels = {
        approved: "Đã kiểm duyệt (Công khai)",
        pending: "Chờ Moderator duyệt",
        revision: "Yêu cầu bổ sung",
        rejected: "Đã từ chối",
      };

      postsTbody.innerHTML = posts
        .map(
          (p) => `
        <tr>
          <td>
            <strong>${p.code} • ${p.title}</strong>
            <div style="font-size:11px;color:#6f7d76;">${p.location} · ${
              p.transaction === "buy" ? "Mua bán" : "Cho thuê"
            }</div>
          </td>
          <td>${p.price}</td>
          <td><span class="badge-${p.status}">● ${labels[p.status] || p.status}</span></td>
          <td>${p.fitScore || "92%"}</td>
          <td>
            <a href="agent-post-create.html?edit=${encodeURIComponent(p.id)}" class="action-link">Sửa</a>
            <span style="margin:0 6px;color:#9cb0a7;">·</span>
            <button type="button" class="action-link" style="color:#b42318;" data-del="${p.id}">Xóa</button>
          </td>
        </tr>`
        )
        .join("");
    }

    postsTbody.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-del]");
      if (!btn) return;
      if (!confirm(`Xác nhận xóa bài đăng ${btn.dataset.del}?`)) return;
      API.savePosts(API.getPosts().filter((p) => p.id !== btn.dataset.del));
      renderAgentPosts();
    });

    renderAgentPosts();
  }

  /* 2. Tạo bài đăng mới hoặc Chỉnh sửa bài đăng (agent-post-create.html) */
  const createForm = document.getElementById("agent-post-form");
  if (createForm) {
    const editId = new URLSearchParams(window.location.search).get("edit");
    if (editId) {
      const existing = API.getPosts().find((p) => p.id === editId || p.code === editId);
      if (existing) {
        document.querySelector(".agent-title").textContent = `Chỉnh sửa bài đăng ${existing.code}`;
        createForm.elements.title.value = existing.title || "";
        createForm.elements.price.value = existing.price || "";
        createForm.elements.size.value = String(existing.size || "").replace(/\s*m²/i, "");
        createForm.elements.bedrooms.value = existing.bedrooms || 2;
        createForm.elements.bathrooms.value = existing.bathrooms || 2;
        createForm.elements.location.value = existing.location || "";
        createForm.elements.legal.value = existing.legal || "";
        createForm.elements.image.value = existing.image || "";
        createForm.elements.amenities.value = existing.amenities || "";
        createForm.elements.description.value = existing.description || "";
      }
    }

    document.getElementById("agent-post-ai-apply")?.addEventListener("click", () => {
      const title = createForm.elements.title.value.trim() || "Căn hộ gia đình";
      const amenities = createForm.elements.amenities.value.trim() || "Yên tĩnh, gần trường, góc WFH";
      createForm.elements.description.value = `${title} đáp ứng tiêu chí sống: ${amenities}. Đã kiểm tra độ yên tĩnh và khoảng cách di chuyển thực tế.`;
    });

    createForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const fd = new FormData(createForm);
      const posts = API.getPosts();
      const session = API.getSession();
      const brokerName = session?.name || "Trần Quốc Bảo";
      const image =
        fd.get("image").trim() ||
        "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1000&q=80";

      const priceStr = fd.get("price").trim();
      const txType = /tỷ|ty/i.test(priceStr) ? "buy" : "rent";

      if (editId) {
        API.updatePost(editId, {
          title: fd.get("title").trim(),
          price: priceStr,
          transaction: txType,
          size: `${fd.get("size").trim()} m²`,
          bedrooms: Number(fd.get("bedrooms")) || 2,
          bathrooms: Number(fd.get("bathrooms")) || 2,
          location: fd.get("location").trim(),
          area: fd.get("location").split(",")[0].trim(),
          legal: fd.get("legal").trim(),
          amenities: fd.get("amenities").trim(),
          description: fd.get("description").trim(),
          image,
          status: "pending",
          moderationNote: "Bài đăng vừa được Môi giới chỉnh sửa, chờ Moderator duyệt lại.",
        });
      } else {
        const nextNum = String(posts.length + 1).padStart(2, "0");
        const code = `P-${nextNum}`;
        posts.unshift({
          id: code,
          code,
          title: fd.get("title").trim(),
          price: priceStr,
          transaction: txType,
          size: `${fd.get("size").trim()} m²`,
          bedrooms: Number(fd.get("bedrooms")) || 2,
          bathrooms: Number(fd.get("bathrooms")) || 2,
          location: fd.get("location").trim(),
          area: fd.get("location").split(",")[0].trim(),
          legal: fd.get("legal").trim(),
          amenities: fd.get("amenities").trim(),
          description: fd.get("description").trim(),
          brokerName,
          fitScore: "94%",
          moderationNote: "Bài đăng mới do Môi giới gửi, đang chờ Kiểm duyệt viên phê duyệt.",
          status: "pending",
          image,
        });
        API.savePosts(posts);
      }

      const msg = document.getElementById("agent-post-message");
      msg.innerHTML = `Đã lưu bài đăng vào cơ sở dữ liệu JSON (Trạng thái: <strong>Chờ duyệt</strong>). <a href="moderator-listing-review.html" style="text-decoration:underline;font-weight:700;">Chuyển sang trang Moderator để duyệt bài ngay →</a>`;
      msg.hidden = false;
    });
  }

  /* 3. Quản lý khách hàng quan tâm & Liên hệ người mua (agent-lead-management.html) */
  const reqTbody = document.getElementById("agent-req-tbody");
  if (reqTbody) {
    function renderLeads() {
      const leads = API.getLeads();
      reqTbody.innerHTML = leads
        .map(
          (l) => `
        <tr data-id="${l.id}">
          <td><strong>${l.clientName} • ${l.leadCode}</strong></td>
          <td>${l.source}</td>
          <td>${l.status === "new" ? "Mới" : "Đã liên hệ & tiếp nhận"}</td>
          <td><button type="button" class="action-link" data-accept="${l.id}">Tiếp nhận &amp; Liên hệ</button></td>
        </tr>`
        )
        .join("");
    }

    reqTbody.addEventListener("click", (e) => {
      const row = e.target.closest("tr[data-id]");
      if (!row) return;
      const leads = API.getLeads();
      const item = leads.find((l) => l.id === row.dataset.id);
      if (!item) return;

      if (e.target.closest("[data-accept]")) {
        item.status = "consulting";
        API.saveLeads(leads);
        renderLeads();
      }

      document.getElementById("agent-req-detail-box").innerHTML = `
        <h3>${item.clientName} (${item.leadCode})</h3>
        <p style="font-size:12px;color:#55665f;">Số điện thoại liên hệ: <strong>${item.phone}</strong> • Nguồn: ${item.source}</p>
        <div style="padding:12px;background:#eaf4ed;border-radius:8px;font-size:12.5px;margin-bottom:12px;">
          <strong>Nội dung Brief nhu cầu sống của người mua:</strong>
          <p style="margin:6px 0 0;">${item.briefSummary}</p>
        </div>
        <a href="agent-viewing-schedule.html" class="btn-primary" style="text-decoration:none;">+ Đặt lịch hẹn xem nhà cho khách này</a>
      `;
    });

    renderLeads();
  }

  /* 4. Lịch hẹn xem nhà (agent-viewing-schedule.html) */
  const apptTbody = document.getElementById("agent-appt-tbody");
  if (apptTbody) {
    function renderAppts() {
      const appts = API.getAppts();
      apptTbody.innerHTML = appts
        .map(
          (a) => `
        <tr>
          <td><strong>${a.id} • ${a.clientName}</strong></td>
          <td>${a.houseCode} • ${a.houseName}</td>
          <td>${a.time}</td>
          <td>${a.status === "confirmed" ? "Đã xác nhận" : "Chờ xác nhận"}</td>
          <td><button type="button" class="action-link" data-ok="${a.id}">Xác nhận</button></td>
        </tr>`
        )
        .join("");
    }

    apptTbody.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-ok]");
      if (!btn) return;
      const appts = API.getAppts();
      const item = appts.find((a) => a.id === btn.dataset.ok);
      if (item) {
        item.status = "confirmed";
        API.saveAppts(appts);
        renderAppts();
      }
    });

    const newApptForm = document.getElementById("agent-new-appt-form");
    newApptForm?.addEventListener("submit", (e) => {
      e.preventDefault();
      const fd = new FormData(newApptForm);
      const appts = API.getAppts();
      appts.unshift({
        id: `A-0${appts.length + 32}`,
        clientName: fd.get("clientName").trim(),
        houseCode: fd.get("houseCode").trim(),
        houseName: fd.get("houseName").trim(),
        time: fd.get("time").trim(),
        status: "confirmed",
      });
      API.saveAppts(appts);
      newApptForm.reset();
      renderAppts();
    });

    renderAppts();
  }
});