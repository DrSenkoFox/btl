/* ==========================================================================
   HomeFit AI – Seeker Module (js/modules/seeker.js)
   - Khi chưa đăng nhập: Bấm nút Lưu (♡ hoặc + Lưu) sẽ chuyển thẳng sang login.html?returnUrl=seeker-property-search.html (KHÔNG lưu trước)
   - Khi đã đăng nhập: Mỗi tài khoản chỉ nhìn thấy và thao tác trên Nhà đã lưu & Nhu cầu nhà ở của riêng tài khoản đó
   ========================================================================== */

document.addEventListener("DOMContentLoaded", () => {
  const API = window.HomeFitAPI;
  const norm = (s) =>
    String(s || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d");

  function requireAuthOrRedirectToLogin() {
    const session = API.getSession();
    if (!session) {
      window.location.href = "login.html?returnUrl=seeker-property-search.html";
      return false;
    }
    return true;
  }

  /* ========================================================================
     1. TRANG TÌM NHÀ (seeker-property-search.html)
     ======================================================================== */
  const listingGrid = document.getElementById("house-listings");
  if (listingGrid) {
    function renderSearch() {
      const session = API.getSession();
      // Nếu chưa đăng nhập -> saved luôn là [] nên không bao giờ hiện "✓ Đã lưu"
      const saved = session ? API.getSaved() : [];
      const approved = API.getPosts().filter((p) => p.status === "approved");
      const selectedTx =
        document.querySelector('input[name="transaction"]:checked')?.value || "rent";
      const areaKw = norm(document.getElementById("filter-area")?.value);
      const minB = Number(document.getElementById("filter-budget-min")?.value) || 0;
      const maxB = Number(document.getElementById("filter-budget-max")?.value) || 0;
      const bedKw = parseInt(document.getElementById("filter-bedrooms")?.value, 10) || 0;
      const qKw = norm(document.getElementById("search-query")?.value);

      const matched = approved.filter((p) => {
        const postTx = p.transaction || "rent";
        if (selectedTx && postTx !== selectedTx) return false;
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
          const isSaved = session ? saved.some((s) => s.id === post.id) : false;
          return `
          <article class="house-listing" data-open="${post.id}">
            <img src="${post.image}" alt="${post.title}" loading="lazy" />
            <div class="house-listing__top">
              <span>● Đã kiểm duyệt (${post.transaction === "buy" ? "Bán" : "Cho thuê"})</span>
              <button
                type="button"
                data-save="${post.id}"
                aria-label="Lưu nhanh"
                style="border:0;background:none;cursor:pointer;color:#17684d;font-size:15px;"
              >
                ${isSaved ? "♥" : "♡"}
              </button>
            </div>
            <p class="house-listing__price">${post.price}</p>
            <h3>${post.title}</h3>
            <p class="house-listing__location">${post.location}</p>
            <p class="house-listing__meta">${post.size} · ${post.bedrooms} PN · ${post.bathrooms} WC · Môi giới: ${post.brokerName}</p>
            <menu class="house-listing__actions">
              <li>
                <a class="house-listing__detail" href="seeker-detail.html?id=${encodeURIComponent(post.id)}">
                  Xem chi tiết
                </a>
              </li>
              <li>
                <button class="house-listing__compare" type="button" data-save-goto-compare="${post.id}">
                  ${isSaved ? "✓ Đã lưu" : "+ Lưu"}
                </button>
              </li>
            </menu>
          </article>`;
        })
        .join("");
    }

    document.querySelectorAll('input[name="transaction"]').forEach((radio) => {
      radio.addEventListener("change", renderSearch);
    });
    document.getElementById("btn-ai-search-need")?.addEventListener("click", renderSearch);
    document.getElementById("btn-apply-filter")?.addEventListener("click", renderSearch);
    document.getElementById("house-filters-form")?.addEventListener("reset", () => setTimeout(renderSearch, 10));

    listingGrid.addEventListener("click", (e) => {
      // 1. Khi bấm nút trái tim ♡
      const heartBtn = e.target.closest("[data-save]");
      if (heartBtn) {
        e.stopPropagation();
        // Nếu chưa đăng nhập -> Chuyển sang trang đăng nhập (không lưu trước)
        if (!requireAuthOrRedirectToLogin()) return;

        const id = heartBtn.dataset.save;
        const post = API.getPosts().find((p) => p.id === id);
        let saved = API.getSaved();
        if (saved.some((s) => s.id === id)) saved = saved.filter((s) => s.id !== id);
        else if (post) saved.push(post);
        API.saveSaved(saved);
        renderSearch();
        return;
      }

      // 2. Khi bấm nút "+ Lưu" ở dưới thẻ nhà
      const saveCompareBtn = e.target.closest("[data-save-goto-compare]");
      if (saveCompareBtn) {
        e.stopPropagation();
        // Nếu chưa đăng nhập -> Chuyển sang trang đăng nhập (không lưu trước)
        if (!requireAuthOrRedirectToLogin()) return;

        const id = saveCompareBtn.dataset.saveGotoCompare;
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

  /* ========================================================================
     2. TRANG NHU CẦU NHÀ Ở / BRIEF (seeker-home-brief.html)
     Đọc và lưu dữ liệu Brief theo đúng tài khoản đang đăng nhập
     ======================================================================== */
  const briefForm = document.getElementById("brief-form");
  if (briefForm) {
    const session = API.getSession();
    const lifeInput = document.getElementById("lifestyle");
    const analyzeBtn = document.getElementById("analyze-lifestyle");
    const submitBtn = document.getElementById("submit-brief");
    const archiveBtn = document.getElementById("archive-brief");
    const deleteBtn = document.getElementById("delete-brief");
    const statusMsg = document.getElementById("brief-action-status");

    // Nạp dữ liệu Brief riêng của tài khoản hiện tại (nếu tài khoản này đã từng lưu)
    const userBrief = API.getBrief();
    if (userBrief) {
      document.getElementById("brief-title").value = userBrief.title || "";
      document.getElementById("budget-min").value = userBrief.budgetMin || "";
      document.getElementById("budget-max").value = userBrief.budgetMax || "";
      document.getElementById("preferred-area").value = userBrief.preferredArea || "";
      document.getElementById("move-in-date").value = userBrief.moveInDate || "";
      document.getElementById("household-size").value = userBrief.householdSize || "";
      document.getElementById("size-and-bedrooms").value = userBrief.sizeAndBedrooms || "";
      lifeInput.value = userBrief.lifestyle || "";
      document.getElementById("must-haves").value = userBrief.mustHaves || "";

      if (userBrief.brokerName) {
        document.getElementById("selected-broker-label").innerHTML =
          `Môi giới nhận brief: <strong style="color:#1e2d27;">${userBrief.brokerName}</strong>`;
      }
      if (userBrief.history && userBrief.history.length) {
        document.getElementById("brief-history").innerHTML = userBrief.history
          .map((h) => `<li>${h}</li>`)
          .join("");
      }
      analyzeBtn.disabled = lifeInput.value.trim().length < 30;
      submitBtn.disabled = false;
      archiveBtn.disabled = false;
      deleteBtn.disabled = false;
    }

    // Môi giới được chọn tạm thời trong phiên của đúng user hiện tại
    const brokerStorageKey = session ? `hf_selected_broker_${session.id}` : "hf_selected_broker";
    const selectedBroker = JSON.parse(sessionStorage.getItem(brokerStorageKey) || "null");
    if (selectedBroker) {
      document.getElementById("selected-broker-label").innerHTML =
        `Môi giới nhận brief: <strong style="color:#1e2d27;">${selectedBroker.name}</strong> (${selectedBroker.location})`;
      submitBtn.disabled = false;
    }

    lifeInput.addEventListener("input", () => {
      analyzeBtn.disabled = lifeInput.value.trim().length < 30;
      submitBtn.disabled = lifeInput.value.trim().length < 30 && !selectedBroker;
    });

    analyzeBtn.addEventListener("click", () => {
      const tags = ["Yên tĩnh (40%)", "Gần trường học (35%)", "Góc làm việc WFH (25%)"];
      const needTags = document.getElementById("need-tags");
      needTags.innerHTML = tags.map((t) => `<li class="need-tag">✓ ${t}</li>`).join("");
      needTags.hidden = false;

      document.getElementById("matcher-status").textContent = "Đã tạo · Chờ bạn xác nhận";
      document.getElementById("matcher-summary").textContent = "Đã chuyển mô tả thành 3 tiêu chí ưu tiên";
      document.getElementById("matcher-reasons").innerHTML = `
        <li>Ưu tiên không gian yên tĩnh → chọn căn tầng cao hoặc hướng nội khu</li>
        <li>Gần trường học → bán kính di chuyển dưới 15 phút</li>
        <li>Góc làm việc WFH → ưu tiên phòng có ánh sáng tự nhiên</li>
      `;
      document.getElementById("matcher-result").hidden = false;
      document.getElementById("property-matches").innerHTML = `
        <li><strong>P-01 • River Park căn góc</strong> — 98%</li>
        <li><strong>P-06 • Midtown Phú Mỹ Hưng</strong> — 95%</li>
      `;
      submitBtn.disabled = false;
    });

    briefForm.addEventListener("submit", (e) => {
      e.preventDefault();
      if (!requireAuthOrRedirectToLogin()) return;

      const title = document.getElementById("brief-title").value.trim() || `Brief của ${session.name}`;
      const lifestyle = lifeInput.value.trim();
      const mustHaves = document.getElementById("must-haves").value.trim();
      const brokerName = selectedBroker?.name || userBrief?.brokerName || "Nguyễn Lan Hương";
      const briefCode = `B-${session.id.replace(/\D/g, "") || "024"}`;
      const logEntry = `${new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })} — Đã gửi ${briefCode} tới ${brokerName}`;

      const briefData = {
        code: briefCode,
        title,
        budgetMin: document.getElementById("budget-min").value,
        budgetMax: document.getElementById("budget-max").value,
        preferredArea: document.getElementById("preferred-area").value.trim(),
        moveInDate: document.getElementById("move-in-date").value,
        householdSize: document.getElementById("household-size").value,
        sizeAndBedrooms: document.getElementById("size-and-bedrooms").value.trim(),
        lifestyle,
        mustHaves,
        priorities: "Yên tĩnh 40% / Trường 35% / WFH 25%",
        brokerName,
        history: [logEntry, ...(userBrief?.history || [])],
      };
      API.saveBrief(briefData);

      const leads = API.getLeads();
      const code = `L-0${leads.length + 24}`;
      leads.unshift({
        id: code,
        leadCode: code,
        briefCode,
        clientName: title,
        source: `${briefCode} / P-01`,
        status: "new",
        phone: session.phone || "090 000 0024",
        brokerName,
        briefSummary: lifestyle || "Ngân sách phù hợp, ưu tiên yên tĩnh, gần trường, WFH.",
      });
      API.saveLeads(leads);

      archiveBtn.disabled = false;
      deleteBtn.disabled = false;
      document.getElementById("brief-history").innerHTML = briefData.history
        .map((h) => `<li>${h}</li>`)
        .join("");
      statusMsg.textContent = `Đã lưu và gửi ${briefCode} của tài khoản ${session.name}!`;
      statusMsg.hidden = false;
    });

    document.getElementById("save-brief-draft")?.addEventListener("click", () => {
      if (!requireAuthOrRedirectToLogin()) return;
      API.saveBrief({
        code: `B-${session.id.replace(/\D/g, "") || "024"}`,
        title: document.getElementById("brief-title").value.trim(),
        budgetMin: document.getElementById("budget-min").value,
        budgetMax: document.getElementById("budget-max").value,
        preferredArea: document.getElementById("preferred-area").value.trim(),
        moveInDate: document.getElementById("move-in-date").value,
        householdSize: document.getElementById("household-size").value,
        sizeAndBedrooms: document.getElementById("size-and-bedrooms").value.trim(),
        lifestyle: lifeInput.value.trim(),
        mustHaves: document.getElementById("must-haves").value.trim(),
        priorities: "Yên tĩnh 40% / Trường 35% / WFH 25%",
      });
      statusMsg.textContent = "Đã lưu bản nháp Brief cho tài khoản của bạn.";
      statusMsg.hidden = false;
    });

    deleteBtn?.addEventListener("click", () => {
      if (!confirm("Bạn có chắc muốn xóa brief của tài khoản này không?")) return;
      briefForm.reset();
      API.saveBrief(null);
      sessionStorage.removeItem(brokerStorageKey);
      document.getElementById("brief-history").innerHTML = "";
      document.getElementById("property-matches").innerHTML = "";
      document.getElementById("matcher-result").hidden = true;
      archiveBtn.disabled = true;
      deleteBtn.disabled = true;
      statusMsg.textContent = "Đã xóa Brief của tài khoản hiện tại.";
    });
  }

  /* ========================================================================
     3. TRANG CHỌN MÔI GIỚI (seeker-agent-selection.html)
     ======================================================================== */
  const agentListEl = document.getElementById("agent-list");
  if (agentListEl) {
    let fitChipActive = false;
    let fastChipActive = false;

    function renderBrokers() {
      const brokers = API.getBrokers();
      const kw = norm(document.getElementById("agent-search")?.value);
      const area = document.getElementById("agent-area")?.value || "all";
      const spec = document.getElementById("agent-specialty")?.value || "all";
      const verOnly = document.getElementById("verified-only")?.checked;
      const sortBy = document.getElementById("agent-sort")?.value || "fit";

      const filtered = brokers
        .filter((b) => {
          if (kw && !norm(`${b.name} ${b.specialty} ${b.bio} ${b.tags.join(" ")}`).includes(kw)) return false;
          if (area !== "all" && !b.areas.includes(area)) return false;
          if (spec !== "all" && !b.specialties.includes(spec)) return false;
          if (verOnly && !b.verified) return false;
          if (fitChipActive && b.fit < 90) return false;
          if (fastChipActive && !b.fast) return false;
          return true;
        })
        .sort((a, b) => (sortBy === "deals" ? b.deals - a.deals : b.fit - a.fit));

      document.getElementById("agent-result-count").textContent = String(filtered.length);

      agentListEl.innerHTML = filtered
        .map(
          (b) => `
        <article class="agent-card">
          <header class="agent-card__topline">
            <span class="agent-card__avatar">${b.initials}</span>
            ${b.verified ? `<span class="agent-card__verified">Đã xác minh</span>` : ""}
          </header>
          <h3>${b.name}</h3>
          <p class="agent-card__location">${b.location}</p>
          <p class="agent-card__specialty">${b.specialty}</p>
          <p class="agent-card__bio">${b.bio}</p>
          <ul class="agent-card__tags">
            ${b.tags.map((t) => `<li>${t}</li>`).join("")}
          </ul>
          <ul class="agent-card__stats">
            <li>
              <strong>${b.fit}%</strong>
              <span>${b.fitLabel}</span>
            </li>
            <li>
              <strong>${b.deals}</strong>
              <span>Bài đăng công khai</span>
            </li>
          </ul>
          <p class="agent-card__match-note">${b.note}</p>
          <footer class="agent-card__links">
            <button type="button" data-pick-broker="${b.id}">Liên hệ</button>
          </footer>
        </article>`
        )
        .join("");
    }

    document.getElementById("agent-filter-form")?.addEventListener("input", renderBrokers);
    document.getElementById("agent-filter-form")?.addEventListener("change", renderBrokers);
    document.getElementById("agent-filter-form")?.addEventListener("submit", (e) => {
      e.preventDefault();
      renderBrokers();
    });
    document.getElementById("agent-sort")?.addEventListener("change", renderBrokers);

    document.querySelectorAll("[data-quick-filter]").forEach((chip) => {
      chip.addEventListener("click", () => {
        const pressed = chip.getAttribute("aria-pressed") === "true";
        chip.setAttribute("aria-pressed", String(!pressed));
        if (chip.dataset.quickFilter === "fit") fitChipActive = !pressed;
        if (chip.dataset.quickFilter === "fast") fastChipActive = !pressed;
        renderBrokers();
      });
    });

    agentListEl.addEventListener("click", (e) => {
      const trigger = e.target.closest("[data-pick-broker]");
      if (!trigger) return;
      if (!requireAuthOrRedirectToLogin()) return;

      const session = API.getSession();
      const broker = API.getBrokers().find((b) => b.id === trigger.dataset.pickBroker);
      if (broker && session) {
        sessionStorage.setItem(`hf_selected_broker_${session.id}`, JSON.stringify(broker));
        window.location.href = "seeker-home-brief.html";
      }
    });

    renderBrokers();
  }

  /* ========================================================================
     4. TRANG NHÀ ĐÃ LƯU / SO SÁNH (seeker-property-compare.html)
     Hiển thị đúng danh sách Nhà đã lưu và Brief của riêng tài khoản hiện tại
     ======================================================================== */
  const savedHouseList = document.getElementById("saved-house-list");
  if (savedHouseList) {
    function renderSavedCompare() {
      const saved = API.getSaved();
      const brief = API.getBrief();
      const hasBrief = Boolean(brief && brief.lifestyle);

      document.getElementById("saved-summary").textContent = `${saved.length} căn đã lưu · So sánh theo tiêu chí của bạn.`;
      document.getElementById("saved-empty-state").hidden = saved.length > 0;

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

      const emptyCmp = document.getElementById("comparison-empty");
      const scrollCmp = document.getElementById("comparison-scroll");
      const prioEmpty = document.getElementById("priorities-empty");
      const prioList = document.getElementById("saved-priorities-list");
      const assistantStatus = document.getElementById("assistant-status");
      const briefLink = document.getElementById("saved-brief-link");

      if (!hasBrief) {
        emptyCmp.hidden = false;
        scrollCmp.hidden = true;
        prioEmpty.hidden = false;
        prioList.hidden = true;
        briefLink.textContent = "Tạo brief";
        assistantStatus.textContent =
          "Chưa có brief. Hãy tạo brief để bắt đầu đánh giá và so sánh theo ưu tiên của bạn.";
      } else {
        emptyCmp.hidden = true;
        scrollCmp.hidden = saved.length === 0;
        prioEmpty.hidden = true;
        prioList.hidden = false;
        prioList.innerHTML = (brief.priorities || "Yên tĩnh 40% / Trường 35% / WFH 25%")
          .split("/")
          .map((item) => `<li>${item.trim()}</li>`)
          .join("");
        briefLink.textContent = "Cập nhật brief";
        assistantStatus.textContent = `${saved.length} căn nhà đã sẵn sàng để đối chiếu theo brief ${brief.code || "B-024"} của bạn.`;

        if (saved.length > 0) {
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
          scrollCmp.querySelectorAll("tbody tr").forEach((tr) => {
            const key = tr.dataset.criterion;
            const th = tr.querySelector("th").outerHTML;
            tr.innerHTML = th + saved.map((h) => `<td>${map[key](h)}</td>`).join("");
          });
        }
      }
    }

    savedHouseList.addEventListener("click", (e) => {
      const rmBtn = e.target.closest("[data-rm]");
      if (!rmBtn) return;
      API.saveSaved(API.getSaved().filter((h) => h.id !== rmBtn.dataset.rm));
      renderSavedCompare();
    });

    renderSavedCompare();
  }

  /* ========================================================================
     5. TRANG CHI TIẾT BẤT ĐỘNG SẢN (seeker-detail.html)
     Nếu chưa đăng nhập mà bấm "Lưu nhà" -> Chuyển sang login.html
     ======================================================================== */
  const detailArticle = document.getElementById("property-detail");
  if (detailArticle) {
    const id = new URLSearchParams(window.location.search).get("id") || "P-01";
    const post = API.getPosts().find((p) => p.id === id || p.code === id) || API.getPosts()[0];
    if (post) {
      document.getElementById("property-breadcrumb-title").textContent = post.title;
      document.getElementById("property-code").textContent = post.code;
      document.getElementById("property-title").textContent = post.title;
      document.getElementById("property-location").textContent = post.location;
      document.getElementById("property-price").textContent = post.price;
      document.getElementById("property-fit-score").textContent = `● Phù hợp ${post.fitScore || "95%"}`;
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

      const saveDetailBtn = document.getElementById("btn-detail-save");
      function syncSaveDetailButton() {
        if (!saveDetailBtn) return;
        const session = API.getSession();
        const isSaved = session ? API.getSaved().some((s) => s.id === post.id) : false;
        saveDetailBtn.textContent = isSaved ? "♥ Đã lưu nhà" : "♡ Lưu nhà";
        saveDetailBtn.classList.toggle("is-saved", isSaved);
      }

      saveDetailBtn?.addEventListener("click", () => {
        // Nếu chưa đăng nhập -> Đưa sang trang login.html, sau khi đăng nhập sẽ quay về seeker-property-search.html
        if (!requireAuthOrRedirectToLogin()) return;

        let saved = API.getSaved();
        if (saved.some((s) => s.id === post.id)) {
          saved = saved.filter((s) => s.id !== post.id);
        } else {
          saved.push(post);
        }
        API.saveSaved(saved);
        syncSaveDetailButton();
      });

      syncSaveDetailButton();
    }
  }
});