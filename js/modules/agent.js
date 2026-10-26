/* ==========================================================================
   HomeFit AI – Agent Module (js/modules/agent.js)
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
      document.getElementById("stat-approved").textContent = `${posts.filter((p) => p.status === "approved").length} đang công khai`;
      document.getElementById("stat-pending-count").textContent = String(posts.filter((p) => p.status === "pending").length);
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
            <div style="font-size:11px;color:#6f7d76;">${p.location}</div>
          </td>
          <td>${p.price}</td>
          <td><strong>● ${labels[p.status] || p.status}</strong></td>
          <td>${p.fitScore || "92%"}</td>
          <td><button type="button" class="action-link" data-del="${p.id}">Xóa</button></td>
        </tr>`
        )
        .join("");
    }

    postsTbody.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-del]");
      if (!btn) return;
      API.savePosts(API.getPosts().filter((p) => p.id !== btn.dataset.del));
      renderAgentPosts();
    });

    renderAgentPosts();
  }

  /* 2. Tạo bài đăng mới + AI-2 (agent-post-create.html) */
  const createForm = document.getElementById("agent-post-form");
  if (createForm) {
    document.getElementById("agent-post-ai-apply")?.addEventListener("click", () => {
      const title = createForm.elements.title.value.trim() || "Căn hộ gia đình";
      const amenities = createForm.elements.amenities.value.trim() || "Yên tĩnh, gần trường, góc WFH";
      createForm.elements.description.value = `${title} đáp ứng tiêu chí sống: ${amenities}. Đã kiểm tra độ yên tĩnh và khoảng cách di chuyển thực tế.`;
    });

    createForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const fd = new FormData(createForm);
      const posts = API.getPosts();
      const nextNum = String(posts.length + 1).padStart(2, "0");
      const code = `P-${nextNum}`;
      const session = API.getSession();
      const brokerName = session?.name || "Trần Quốc Bảo";
      const image =
        fd.get("image").trim() ||
        "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1000&q=80";

      posts.unshift({
        id: code,
        code,
        title: fd.get("title").trim(),
        price: fd.get("price").trim(),
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
        images: [image],
      });

      API.savePosts(posts);
      const msg = document.getElementById("agent-post-message");
      msg.innerHTML = `Đã tạo bài đăng <strong>${code}</strong> (Chờ duyệt). <a href="moderator-listing-review.html" style="text-decoration:underline;font-weight:700;">Chuyển sang trang Kiểm duyệt viên để duyệt bài ngay →</a>`;
      msg.hidden = false;
      createForm.reset();
    });
  }

  /* 3. Quản lý khách hàng quan tâm (agent-lead-management.html) */
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
          <td>${l.status === "new" ? "Mới" : "Đã tiếp nhận"}</td>
          <td><button type="button" class="action-link" data-accept="${l.id}">Tiếp nhận</button></td>
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
        <p style="font-size:12px;color:#55665f;">Điện thoại: ${item.phone} • Nguồn: ${item.source}</p>
        <div style="padding:12px;background:#eaf4ed;border-radius:8px;font-size:12.5px;">
          <strong>Nội dung Brief nhu cầu sống:</strong>
          <p style="margin:6px 0 0;">${item.briefSummary}</p>
        </div>
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

    renderAppts();
  }
  /* Bổ sung form Tạo lịch hẹn mới trên trang agent-viewing-schedule.html */
  const newApptForm = document.getElementById("agent-new-appt-form");
  if (newApptForm) {
    newApptForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const fd = new FormData(newApptForm);
      const appts = API.getAppts();
      appts.unshift({
        id: `A-0${appts.length + 35}`,
        clientName: fd.get("clientName").trim(),
        houseCode: fd.get("houseCode").trim(),
        houseName: fd.get("houseName").trim(),
        time: fd.get("time").trim(),
        status: "confirmed",
      });
      API.saveAppts(appts);
      newApptForm.reset();
      window.location.reload();
    });
  }
});
