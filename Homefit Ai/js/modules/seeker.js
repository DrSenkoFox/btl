/* ==========================================================================
   HomeFit AI – Seeker Module (js/modules/seeker.js)
   ========================================================================== */

document.addEventListener("DOMContentLoaded", () => {
  const API = window.HomeFitAPI;
  const norm = (s) =>
    String(s || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d");

  /* 1. Trang Tìm nhà (seeker-property-search.html) */
  const listingGrid = document.getElementById("house-listings");
  if (listingGrid) {
    function renderSearch() {
      const saved = API.getSaved();
      const approvedPosts = API.getPosts().filter((p) => p.status === "approved");
      const areaKw = norm(document.getElementById("filter-area")?.value);
      const minB = Number(document.getElementById("filter-budget-min")?.value) || 0;
      const maxB = Number(document.getElementById("filter-budget-max")?.value) || 0;
      const bedKw = parseInt(document.getElementById("filter-bedrooms")?.value, 10) || 0;
      const qKw = norm(document.getElementById("search-query")?.value);

      const matched = approvedPosts.filter((p) => {
        const priceVal = parseFloat(p.price) || 0;
        if (areaKw && !norm(p.location).includes(areaKw)) return false;
        if (minB && priceVal < minB) return false;
        if (maxB && priceVal > maxB) return false;
        if (bedKw && Number(p.bedrooms) < bedKw) return false;
        if (qKw && !norm(`${p.title} ${p.location} ${p.description}`).includes(qKw)) return false;
        return true;
      });

      document.getElementById("house-results-count").textContent = `${matched.length} bất động sản`;
      listingGrid.innerHTML = matched
        .map((post) => {
          const isSaved = saved.some((s) => s.id === post.id);
          return `
          <article class="house-listing" data-id="${post.id}">
            <img src="${post.image}" alt="${post.title}" loading="lazy" />
            <header class="house-listing__top">
              <p class="house-listing__status">Đã kiểm duyệt</p>
              <button class="house-listing__save" type="button" data-save="${post.id}" aria-pressed="${isSaved}">
                ${isSaved ? "♥" : "♡"}
              </button>
            </header>
            <p class="house-listing__price">${post.price}</p>
            <h3>${post.title}</h3>
            <p class="house-listing__location">${post.location}</p>
            <p class="house-listing__meta">${post.size} · ${post.bedrooms} PN · ${post.bathrooms} WC</p>
            <menu class="house-listing__actions">
              <li><a class="house-listing__detail" href="seeker-detail.html?id=${encodeURIComponent(post.id)}">Xem chi tiết</a></li>
              <li><button class="house-listing__compare" type="button" data-compare="${post.id}">+ So sánh</button></li>
            </menu>
          </article>`;
        })
        .join("");
    }

    document.getElementById("btn-ai-search-need")?.addEventListener("click", renderSearch);
    document.querySelector(".house-filters__apply")?.addEventListener("click", renderSearch);
    document.getElementById("house-filters-form")?.addEventListener("reset", () => setTimeout(renderSearch, 10));

    listingGrid.addEventListener("click", (e) => {
      const saveBtn = e.target.closest("[data-save]");
      if (saveBtn) {
        e.stopPropagation();
        const id = saveBtn.dataset.save;
        const post = API.getPosts().find((p) => p.id === id);
        let saved = API.getSaved();
        if (saved.some((s) => s.id === id)) saved = saved.filter((s) => s.id !== id);
        else if (post) saved.push(post);
        API.saveSaved(saved);
        renderSearch();
        return;
      }
      const cmpBtn = e.target.closest("[data-compare]");
      if (cmpBtn) {
        e.stopPropagation();
        const id = cmpBtn.dataset.compare;
        const post = API.getPosts().find((p) => p.id === id);
        const saved = API.getSaved();
        if (post && !saved.some((s) => s.id === id)) {
          saved.push(post);
          API.saveSaved(saved);
        }
        window.location.href = "seeker-property-compare.html";
      }
    });

    renderSearch();
  }

  /* 2. Trang Brief & AI-1 Lifestyle Matcher (seeker-home-brief.html) */
  const briefForm = document.getElementById("brief-form");
  if (briefForm) {
    const lifeInput = document.getElementById("lifestyle");
    const analyzeBtn = document.getElementById("analyze-lifestyle");

    lifeInput.addEventListener("input", () => {
      analyzeBtn.disabled = lifeInput.value.trim().length < 20;
    });

    analyzeBtn.addEventListener("click", () => {
      const tags = ["Yên tĩnh (40%)", "Gần trường học (35%)", "Góc làm việc WFH (25%)"];
      const needTags = document.getElementById("need-tags");
      needTags.innerHTML = tags.map((t) => `<li class="need-tag">${t}</li>`).join("");
      needTags.hidden = false;
      document.getElementById("matcher-status").textContent = "Đã phân tích • Chờ xác nhận";
      document.getElementById("matcher-summary").textContent = "Đã chuyển mô tả thành 3 tiêu chí ưu tiên";
      document.getElementById("matcher-reasons").innerHTML = `
        <li>Ưu tiên không gian yên tĩnh → chọn căn hướng nội khu</li>
        <li>Gần trường học → thuận tiện đưa đón con dưới 15 phút</li>
        <li>Góc làm việc WFH → có ánh sáng tự nhiên</li>
      `;
      document.getElementById("matcher-result").hidden = false;
      document.getElementById("submit-brief").disabled = false;
    });

    briefForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const title = document.getElementById("brief-title").value.trim();
      const lifestyle = lifeInput.value.trim();
      API.saveBrief({ title, lifestyle });
      const leads = API.getLeads();
      const code = `L-0${leads.length + 25}`;
      leads.unshift({
        id: code,
        leadCode: code,
        briefCode: `B-0${leads.length + 25}`,
        clientName: title,
        source: "Brief Nhu cầu nhà ở",
        status: "new",
        phone: "0909 112 233",
        brokerName: "Nguyễn Lan Hương",
        briefSummary: lifestyle,
      });
      API.saveLeads(leads);
      const st = document.getElementById("brief-action-status");
      st.textContent = "Đã gửi Brief thành công sang giao diện Môi giới!";
      st.hidden = false;
    });
  }

  /* 3. Trang Nhà đã lưu & So sánh (seeker-property-compare.html) */
  const savedHouseList = document.getElementById("saved-house-list");
  if (savedHouseList) {
    function renderCompare() {
      const saved = API.getSaved();
      document.getElementById("saved-summary").textContent = `${saved.length} căn đã lưu · So sánh theo tiêu chí của bạn.`;
      savedHouseList.innerHTML = saved
        .map(
          (h) => `
        <li>
          <article class="saved-house-card">
            <img src="${h.image}" alt="${h.title}" />
            <p class="saved-house-card__id">${h.code || h.id}</p>
            <h3>${h.title}</h3>
            <p class="saved-house-card__location">${h.location}</p>
            <p class="saved-house-card__price">${h.price}</p>
            <button type="button" class="saved-house-card__remove" data-rm="${h.id}">Bỏ lưu</button>
          </article>
        </li>`
        )
        .join("");

      const scrollEl = document.getElementById("comparison-scroll");
      if (saved.length > 0 && scrollEl) {
        scrollEl.hidden = false;
        document.getElementById("comparison-empty").hidden = true;
        document.getElementById("comparison-columns").innerHTML =
          `<th scope="col">Tiêu chí</th>` + saved.map((h) => `<th scope="col">${h.title}</th>`).join("");
        const map = {
          price: (h) => h.price,
          area: (h) => `${h.size} · ${h.bedrooms} PN`,
          location: (h) => h.location,
          amenities: (h) => h.amenities,
          legal: (h) => h.legal,
          fit: (h) => h.fitScore || "92%",
        };
        scrollEl.querySelectorAll("tbody tr").forEach((tr) => {
          const key = tr.dataset.criterion;
          const th = tr.querySelector("th").outerHTML;
          tr.innerHTML = th + saved.map((h) => `<td>${map[key](h)}</td>`).join("");
        });
      }
    }

    savedHouseList.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-rm]");
      if (!btn) return;
      API.saveSaved(API.getSaved().filter((h) => h.id !== btn.dataset.rm));
      renderCompare();
    });

    renderCompare();
  }

  /* 4. Trang Chi tiết nhà (seeker-detail.html) */
  const detailArticle = document.getElementById("property-detail");
  if (detailArticle) {
    const id = new URLSearchParams(window.location.search).get("id") || "P-01";
    const post = API.getPosts().find((p) => p.id === id) || API.getPosts()[0];
    if (post) {
      document.getElementById("property-breadcrumb-title").textContent = post.title;
      document.getElementById("property-code").textContent = post.code;
      document.getElementById("property-title").textContent = post.title;
      document.getElementById("property-location").textContent = post.location;
      document.getElementById("property-price").textContent = post.price;
      document.getElementById("property-quick-facts").textContent = `${post.size} · ${post.bedrooms} PN · ${post.bathrooms} WC`;
      document.getElementById("property-description").textContent = post.description;
      document.getElementById("property-contract").textContent = post.contract;
      document.getElementById("property-legal").textContent = post.legal;
      document.getElementById("property-costs").textContent = post.costs;
      document.getElementById("property-furnishing").textContent = post.furnishing;
      document.getElementById("property-amenities").textContent = post.amenities;
      document.getElementById("property-broker").textContent = post.brokerName;
      document.getElementById("property-image-main").src = post.image;
      document.getElementById("property-image-second").src = post.image;
      document.getElementById("property-image-third").src = post.image;
      document.getElementById("property-ai-reasons").innerHTML = (post.aiReasons || [post.description])
        .map((r) => `<li>${r}</li>`)
        .join("");

      document.getElementById("property-viewing-form")?.addEventListener("submit", (e) => {
        e.preventDefault();
        const fd = new FormData(e.target);
        const appts = API.getAppts();
        appts.unshift({
          id: `A-0${appts.length + 35}`,
          clientName: fd.get("clientName"),
          houseCode: post.code,
          houseName: post.title,
          time: `${fd.get("date")} • ${fd.get("time")}`,
          status: "pending",
        });
        API.saveAppts(appts);
        document.getElementById("property-viewing-status").textContent =
          "Đã đặt lịch hẹn! Môi giới sẽ xác nhận trong trang Lịch hẹn.";
        e.target.reset();
      });

      document.getElementById("property-report-inline-form")?.addEventListener("submit", (e) => {
        e.preventDefault();
        const details = new FormData(e.target).get("details");
        const reports = API.getReports();
        reports.unshift({
          id: `RP-${reports.length + 102}`,
          propertyId: post.id,
          propertyTitle: `${post.code} • ${post.title}`,
          details,
          status: "pending",
        });
        API.saveReports(reports);
        document.getElementById("property-report-inline-status").textContent =
          "Đã gửi báo cáo tới Trung tâm xử lý vi phạm của Moderator!";
        e.target.reset();
      });
    }
  }
});