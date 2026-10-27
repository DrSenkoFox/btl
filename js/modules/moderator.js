/* ==========================================================================
   HomeFit AI – Moderator Module (js/modules/moderator.js)
   Khớp chính xác Ảnh 1: Duyệt bài đăng bất động sản, Xử lý vi phạm & Dữ liệu
   ========================================================================== */

document.addEventListener("DOMContentLoaded", () => {
  const API = window.HomeFitAPI;

  /* 1. Trang Duyệt bài đăng bất động sản (moderator-listing-review.html - Ảnh 1) */
  const rosterList = document.getElementById("mod-roster-list");
  if (rosterList) {
    let selectedId = API.getPosts()[0]?.id || "P-01";

    const statusText = {
      approved: "Đã kiểm duyệt",
      pending: "Chờ kiểm duyệt",
      revision: "Yêu cầu bổ sung",
      rejected: "Đã từ chối",
    };

    function renderModReview() {
      const posts = API.getPosts();
      if (!posts.some((p) => p.id === selectedId)) {
        selectedId = posts[0]?.id;
      }

      document.getElementById("mod-list-heading").textContent = `DANH SÁCH TIN ĐĂNG (${posts.length})`;

      rosterList.innerHTML = posts
        .map(
          (p) => `
        <li>
          <button type="button" class="ops-roster-item ${p.id === selectedId ? "is-selected" : ""}" data-select="${p.id}">
            <p class="ops-roster-name">${p.code} • ${p.title}</p>
            <p class="ops-roster-sub">${p.location} • ${statusText[p.status] || p.status}</p>
          </button>
        </li>`
        )
        .join("");

      const cur = posts.find((p) => p.id === selectedId);
      if (!cur) return;

      document.getElementById("mod-card-title").textContent = `${cur.code} • ${cur.title}`;
      document.getElementById("mod-status-pill").textContent = statusText[cur.status] || cur.status;
      document.getElementById("mod-broker-pill").textContent = `Môi giới: ${cur.brokerName || "Trần Quốc Bảo"}`;
      document.getElementById("mod-hero-photo").src = cur.image;
      document.getElementById("mod-field-location").value = cur.location;
      document.getElementById("mod-field-price-size").value = `${cur.price} (${cur.size} • ${cur.bedrooms}PN)`;
      document.getElementById("mod-field-note").value =
        cur.moderationNote || "Đã đối chiếu sổ hồng và thông số đo độ ồn thực tế đạt chuẩn.";
    }

    rosterList.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-select]");
      if (!btn) return;
      selectedId = btn.dataset.select;
      renderModReview();
    });

    function changeStatus(newStatus) {
      const posts = API.getPosts();
      const cur = posts.find((p) => p.id === selectedId);
      if (!cur) return;
      const note = document.getElementById("mod-field-note").value.trim();
      if (!note) {
        alert("Vui lòng nhập Nhận xét kiểm duyệt / Lý do phê duyệt hoặc từ chối!");
        return;
      }
      cur.status = newStatus;
      cur.moderationNote = note;
      API.savePosts(posts);
      renderModReview();
    }

    document.getElementById("btn-mod-approve")?.addEventListener("click", () => changeStatus("approved"));
    document.getElementById("btn-mod-revision")?.addEventListener("click", () => changeStatus("revision"));
    document.getElementById("btn-mod-reject")?.addEventListener("click", () => changeStatus("rejected"));

    renderModReview();
  }

  /* 2. Trang Trung tâm xử lý vi phạm (moderator-report-center.html) */
  const reportList = document.getElementById("mod-report-roster");
  if (reportList) {
    let selectedRpId = API.getReports()[0]?.id;

    function renderReports() {
      const reports = API.getReports();
      reportList.innerHTML = reports
        .map(
          (r) => `
        <li>
          <button type="button" class="ops-roster-item ${r.id === selectedRpId ? "is-selected" : ""}" data-rp="${r.id}">
            <p class="ops-roster-name">${r.id} • ${r.propertyTitle}</p>
            <p class="ops-roster-sub">${r.status === "resolved" ? "Đã xử lý" : "Chờ xử lý"}</p>
          </button>
        </li>`
        )
        .join("");

      const cur = reports.find((r) => r.id === selectedRpId) || reports[0];
      if (!cur) return;
      document.getElementById("rp-title").textContent = `${cur.id} • ${cur.propertyTitle}`;
      document.getElementById("rp-details").value = cur.details;
      document.getElementById("rp-status-pill").textContent =
        cur.status === "resolved" ? "Đã xử lý xong" : "Báo cáo mới từ người dùng";
    }

    reportList.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-rp]");
      if (!btn) return;
      selectedRpId = btn.dataset.rp;
      renderReports();
    });

    document.getElementById("btn-rp-resolve")?.addEventListener("click", () => {
      const reports = API.getReports();
      const cur = reports.find((r) => r.id === selectedRpId);
      if (cur) {
        cur.status = "resolved";
        API.saveReports(reports);
        renderReports();
      }
    });

    renderReports();
  }
  /* 3. Trang Giám sát chất lượng dữ liệu (moderator-data-quality.html) */
  const dqRoster = document.getElementById("dq-roster-list");
  if (dqRoster) {
    let selectedDqId = API.getPosts()[0]?.id || "P-01";

    function renderDataQuality() {
      const posts = API.getPosts();
      dqRoster.innerHTML = posts
        .map(
          (p) => `
        <li>
          <button type="button" class="ops-roster-item ${p.id === selectedDqId ? "is-selected" : ""}" data-dq="${p.id}">
            <p class="ops-roster-name">${p.code} • ${p.title}</p>
            <p class="ops-roster-sub">Độ khớp chuẩn: ${p.fitScore || "92%"}</p>
          </button>
        </li>`
        )
        .join("");

      const cur = posts.find((p) => p.id === selectedDqId) || posts[0];
      if (!cur) return;
      document.getElementById("dq-card-title").textContent = `${cur.code} • ${cur.title}`;
      document.getElementById("dq-score-pill").textContent = `Điểm chuẩn dữ liệu: ${cur.fitScore || "95%"}`;
      document.getElementById("dq-broker-pill").textContent = `Môi giới: ${cur.brokerName || "Trần Quốc Bảo"}`;
      document.getElementById("dq-amenities").value = cur.amenities || "Yên tĩnh, gần trường học, góc WFH";
      document.getElementById("dq-audit-note").value = cur.moderationNote || "Dữ liệu tiêu chí mềm đầy đủ, đủ điều kiện đưa vào mô hình gợi ý AI.";
    }

    dqRoster.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-dq]");
      if (!btn) return;
      selectedDqId = btn.dataset.dq;
      renderDataQuality();
    });

    document.getElementById("btn-dq-verify")?.addEventListener("click", () => {
      const posts = API.getPosts();
      const cur = posts.find((p) => p.id === selectedDqId);
      if (cur) {
        cur.fitScore = "98%";
        cur.moderationNote = document.getElementById("dq-audit-note").value.trim();
        API.savePosts(posts);
        renderDataQuality();
      }
    });

    document.getElementById("btn-dq-flag")?.addEventListener("click", () => {
      const posts = API.getPosts();
      const cur = posts.find((p) => p.id === selectedDqId);
      if (cur) {
        cur.status = "revision";
        cur.moderationNote = document.getElementById("dq-audit-note").value.trim() || "Cần bổ sung minh chứng đo kiểm tiêu chí mềm.";
        API.savePosts(posts);
        renderDataQuality();
      }
    });

    renderDataQuality();
  }
});