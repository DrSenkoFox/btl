/* ==========================================================================
   HomeFit AI – Unified Seeker Module (js/modules/seeker.js)
   Đã tích hợp toàn bộ chức năng từ nhánh Dev vào Main & dùng chung data.json:
   - Phân tích câu tìm kiếm tự nhiên (tự tách ngân sách, diện tích, số PN, khu vực & 7 Priority Tags)
   - Kiểm tra đăng nhập trước khi Lưu nhà; mỗi tài khoản có Nhà đã lưu & Brief riêng
   - Trang Brief (seeker-home-brief.html): 9 Tag AI, Trọng số %, Đếm 0/200 ký tự, Kiểm tra (*)
   - Trang Môi giới (seeker-agent-selection.html): Lọc, Sắp xếp, Chip lọc nhanh, Liên hệ gửi Brief
   - Trang Chi tiết (seeker-detail.html): Bảng tiện ích lân cận (nearby), Lưu nhà, Chia sẻ, Đặt lịch, Báo cáo
   ========================================================================== */

document.addEventListener("DOMContentLoaded", () => {
  const API = window.HomeFitAPI;
  const norm = (s) =>
    String(s || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d");

  function numbers(text) {
    return (String(text || "").match(/\d+(?:[.,]\d+)?/g) || []).map((v) =>
      Number(v.replace(",", "."))
    );
  }

  function requireAuthOrRedirectToLogin() {
    const session = API.getSession();
    if (!session) {
      window.location.href = "login.html?returnUrl=seeker-property-search.html";
      return false;
    }
    return true;
  }

  /* ========================================================================
     1. TRANG TÌM NHÀ (seeker-property-search.html) - Tích hợp NLP & Priority Tags từ Dev
     ======================================================================== */
  const listingGrid = document.getElementById("house-listings");
  if (listingGrid) {
    const priorityRules = [
      { label: "Yên tĩnh", keywords: ["yen tinh", "tieng on", "an ninh"] },
      { label: "Gần trường học", keywords: ["truong hoc", "gan truong"] },
      { label: "Góc làm việc WFH", keywords: ["goc lam viec", "wfh", "lam viec tai nha", "ban lam viec"] },
      { label: "Ánh sáng tự nhiên", keywords: ["anh sang", "cua so", "ban cong", "thoang"] },
      { label: "Không gian xanh", keywords: ["cong vien", "cay xanh", "view song", "nhin song", "san vuon"] },
      { label: "Thú cưng", keywords: ["thu cung", "nuoi cho", "nuoi meo"] },
      { label: "Phù hợp gia đình", keywords: ["gia dinh", "the he", "3 phong ngu", "4 phong ngu"] },
    ];

    let tagLabels = [];
    let activeTags = new Set();
    const priorityTagsEl = document.getElementById("priority-filter-tags");
    const needInput = document.getElementById("search-query");

    function postTagSet(post) {
      const haystack = norm(
        [
          post.title,
          post.amenities,
          post.aiSummary,
          (post.aiReasons || []).join(" "),
          (post.nearby || []).map((n) => `${n.name} ${n.type}`).join(" "),
        ].join(" ")
      );
      return new Set(
        priorityRules
          .filter((rule) => rule.keywords.some((kw) => haystack.includes(kw)))
          .map((rule) => rule.label)
      );
    }

    function renderPriorityTags() {
      if (!priorityTagsEl) return;
      priorityTagsEl.innerHTML = tagLabels
        .map((label) => {
          const isActive = activeTags.has(label);
          return `<li>
            <button type="button" data-prio-tag="${label}" aria-pressed="${isActive}">
              ${isActive ? "✓" : "○"} ${label}
            </button>
          </li>`;
        })
        .join("");
      priorityTagsEl.hidden = tagLabels.length === 0;
    }

    priorityTagsEl?.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-prio-tag]");
      if (!btn) return;
      const label = btn.dataset.prioTag;
      if (activeTags.has(label)) activeTags.delete(label);
      else activeTags.add(label);
      renderPriorityTags();
      renderSearch();
    });

    function applyNaturalLanguageNeeds() {
      const text = norm(needInput?.value || "");
      if (!text) {
        renderSearch();
        return;
      }

      const matchedTags = priorityRules
        .filter((r) => r.keywords.some((kw) => text.includes(kw)))
        .map((r) => r.label);
      activeTags = new Set(matchedTags);
      tagLabels = matchedTags;

      const budgetRange = text.match(/(\d+(?:[.,]\d+)?)\s*(?:-|–|den)\s*(\d+(?:[.,]\d+)?)\s*trieu/);
      const budgetMax = text.match(/(?:duoi|toi da|khong qua)\D{0,12}(\d+(?:[.,]\d+)?)\s*trieu/);
      const sizeMatch = text.match(/(\d+(?:[.,]\d+)?)\s*(?:m2|m\b)/);
      const bedMatch = text.match(/(\d+)\s*phong\s*ngu/);

      if (budgetRange) {
        document.getElementById("filter-budget-min").value = budgetRange[1];
        document.getElementById("filter-budget-max").value = budgetRange[2];
      } else if (budgetMax) {
        document.getElementById("filter-budget-max").value = budgetMax[1];
      }
      if (sizeMatch) document.getElementById("filter-size").value = `${sizeMatch[1]} m²`;
      if (bedMatch) document.getElementById("filter-bedrooms").value = `${bedMatch[1]} phòng`;

      renderPriorityTags();
      renderSearch();
    }

    function renderSearch() {
      const session = API.getSession();
      const saved = session ? API.getSaved() : [];
      const hasBrief = Boolean(session && API.getBrief()?.lifestyle);
      const approved = API.getPosts().filter((p) => p.status === "approved");
      const selectedTx =
        document.querySelector('input[name="transaction"]:checked')?.value || "rent";
      const areaKw = norm(document.getElementById("filter-area")?.value);
      const minB = Number(document.getElementById("filter-budget-min")?.value) || 0;
      const maxB = Number(document.getElementById("filter-budget-max")?.value) || 0;
      const sizeNums = numbers(document.getElementById("filter-size")?.value);
      const bedNums = numbers(document.getElementById("filter-bedrooms")?.value);
      const qKw = norm(needInput?.value);

      const matched = approved.filter((p) => {
        const postTx = p.transaction || "rent";
        if (selectedTx && postTx !== selectedTx) return false;

        const priceVal = numbers(p.price)[0] || 0;
        const sizeVal = numbers(p.size)[0] || 0;

        if (areaKw && !norm(`${p.area} ${p.location}`).includes(areaKw)) return false;
        if (minB && priceVal < minB) return false;
        if (maxB && priceVal > maxB) return false;
        if (sizeNums[0] && sizeVal < sizeNums[0]) return false;
        if (bedNums[0] && (Number(p.bedrooms) || 0) < bedNums[0]) return false;

        const tags = postTagSet(p);
        if (![...activeTags].every((t) => tags.has(t))) return false;

        if (qKw && activeTags.size === 0) {
          const hay = norm(`${p.title} ${p.location} ${p.description} ${p.amenities}`);
          const words = qKw.split(/\s+/).filter((w) => w.length > 2);
          if (words.length && !words.some((w) => hay.includes(w))) return false;
        }
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
            ${
              hasBrief && post.fitScore
                ? `<div style="display:flex;justify-content:space-between;font-size:10.5px;color:#17684d;font-weight:700;margin-top:2px;">
                     <span>Phù hợp ${post.fitScore}</span>
                     <span>● Lifestyle Match</span>
                   </div>`
                : ""
            }
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

    document.querySelectorAll('input[name="transaction"]').forEach((r) =>
      r.addEventListener("change", renderSearch)
    );
    document.getElementById("btn-ai-search-need")?.addEventListener("click", applyNaturalLanguageNeeds);
    needInput?.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        applyNaturalLanguageNeeds();
      }
    });
    document.getElementById("btn-apply-filter")?.addEventListener("click", renderSearch);
    document.getElementById("house-filters-form")?.addEventListener("reset", () => {
      setTimeout(() => {
        activeTags.clear();
        tagLabels = [];
        if (needInput) needInput.value = "";
        renderPriorityTags();
        renderSearch();
      }, 10);
    });

    listingGrid.addEventListener("click", (e) => {
      const heartBtn = e.target.closest("[data-save]");
      if (heartBtn) {
        e.stopPropagation();
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

      const saveCompareBtn = e.target.closest("[data-save-goto-compare]");
      if (saveCompareBtn) {
        e.stopPropagation();
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
     ======================================================================== */
  const briefForm = document.getElementById("brief-form");
  if (briefForm) {
    const session = API.getSession();
    const lifestyleInput = document.querySelector("#lifestyle");
    const needTags = document.querySelector("#need-tags");
    const matcherStatus = document.querySelector("#matcher-status");
    const analyzeButton = document.querySelector("#analyze-lifestyle");
    const matcherResult = document.querySelector("#matcher-result");
    const matcherSummary = document.querySelector("#matcher-summary");
    const matcherEmpty = document.querySelector("#matcher-empty");
    const matcherReasons = document.querySelector("#matcher-reasons");
    const weightedPrioritiesInput = document.querySelector("#weighted-priorities");
    const mustHavesInput = document.querySelector("#must-haves");
    const weightedPrioritiesGroup = document.querySelector("#weighted-priorities-group");
    const weightedPrioritiesResults = document.querySelector("#weighted-priorities-results");
    const budgetMin = document.querySelector("#budget-min");
    const budgetMax = document.querySelector("#budget-max");
    const briefStatus = document.querySelector("#brief-status");
    const sentAt = document.querySelector("#sent-at");
    const briefNumber = document.querySelector("#brief-number");
    const submitBriefButton = document.querySelector("#submit-brief");
    const saveDraftButton = document.querySelector("#save-brief-draft");
    const archiveBriefButton = document.querySelector("#archive-brief");
    const deleteBriefButton = document.querySelector("#delete-brief");
    const briefActionStatus = document.querySelector("#brief-action-status");
    const agentNotSelected = document.querySelector("#agent-not-selected");
    const selectedAgentCard = document.querySelector(".selected-agent");
    const selectedAgentInitials = document.querySelector("#selected-agent-initials");
    const selectedAgentName = document.querySelector("#selected-agent-name");
    const selectedAgentVerified = document.querySelector("#selected-agent-verified");
    const selectedAgentMeta = document.querySelector("#selected-agent-meta");
    const agentConsent = document.querySelector("#agent-consent");
    const matcherWarning = document.querySelector(".matcher-warning");

    const lifestyleNeeds = [
      { label: "Ưu tiên không gian yên tĩnh", tag: "Yên tĩnh", keywords: ["yên tĩnh", "ít tiếng ồn", "không ồn", "riêng tư"], guidance: "ưu tiên hướng nội khu, tránh trục đường lớn." },
      { label: "Ưu tiên ánh sáng tự nhiên", tag: "Ánh sáng", keywords: ["ánh sáng", "nhiều sáng", "cửa sổ", "ban công", "thoáng"], guidance: "chọn nhà có cửa sổ hoặc ban công đón sáng." },
      { label: "Phù hợp gia đình có trẻ nhỏ", tag: "Gia đình", keywords: ["gia đình", "trẻ em", "con nhỏ", "em bé", "con "], guidance: "ưu tiên không gian sinh hoạt thuận tiện cho cả gia đình." },
      { label: "Gần trường học", tag: "Gần trường", keywords: ["trường học", "gần trường", "đưa đón con", "đi bộ đến trường"], guidance: "tìm khu vực có trường học trong khoảng cách tiện đưa đón." },
      { label: "Thân thiện với thú cưng", tag: "Thú cưng", keywords: ["thú cưng", "chó", "mèo", "nuôi thú"], guidance: "kiểm tra quy định nuôi thú cưng và không gian đi dạo gần nhà." },
      { label: "Ưu tiên không gian xanh", tag: "Không gian xanh", keywords: ["cây xanh", "công viên", "nhiều cây"], guidance: "ưu tiên nơi gần công viên hoặc có mảng xanh." },
      { label: "Không gian làm việc tại nhà", tag: "WFH", keywords: ["làm việc tại nhà", "wfh", "góc làm việc"], guidance: "ưu tiên góc làm việc riêng, đủ yên tĩnh và ánh sáng." },
      { label: "Thuận tiện đi lại", tag: "Đi lại", keywords: ["đi làm", "gần công ty", "metro", "xe buýt", "giao thông"], guidance: "cân nhắc kết nối giao thông tới nơi làm việc." },
      { label: "Gần tiện ích thiết yếu", tag: "Tiện ích", keywords: ["siêu thị", "chợ", "bệnh viện", "trung tâm thương mại"], guidance: "ưu tiên tiện ích thiết yếu ở khoảng cách gần." },
    ];

    const brokerStorageKey = session ? `hf_selected_broker_${session.id}` : "hf_selected_broker";
    let selectedAgent = null;
    let briefExists = false;

    function textCount() {
      const c = lifestyleInput.value.trim().length;
      const sp = document.querySelector(".char-count");
      const wrap = document.querySelector(".char-counter-wrap");
      if (sp) sp.textContent = String(c);
      lifestyleInput.classList.toggle("over180", c > 180);
      lifestyleInput.classList.toggle("over200", c > 200);
      if (wrap) {
        wrap.classList.toggle("is-warn", c > 180 && c <= 200);
        wrap.classList.toggle("is-danger", c > 200);
      }
      analyzeButton.disabled = c < 30 || c > 200;
    }

    function updateMatcherWarning() {
      const inputFields = briefForm.querySelectorAll(
        "input:not([type='hidden']):not([type='checkbox']):not([type='radio']), textarea"
      );
      const hasEnteredValue = [...inputFields].some((f) => f.value.trim() !== "");
      if (matcherWarning) matcherWarning.hidden = !hasEnteredValue;
    }

    function restoreSelectedAgent() {
      try {
        selectedAgent = JSON.parse(sessionStorage.getItem(brokerStorageKey) || "null");
      } catch {
        selectedAgent = null;
      }

      const hasAgent = Boolean(selectedAgent?.id && selectedAgent?.name);
      agentNotSelected.hidden = hasAgent;
      selectedAgentCard.hidden = !hasAgent;
      agentConsent.closest(".brief-consent").hidden = !hasAgent;
      agentConsent.disabled = !hasAgent;

      if (hasAgent) {
        selectedAgentInitials.textContent = selectedAgent.initials || "MG";
        selectedAgentName.textContent = selectedAgent.name;
        selectedAgentVerified.hidden = !selectedAgent.verified;
        selectedAgentMeta.textContent = `${selectedAgent.location || ""} • ${selectedAgent.specialty || ""}`;
      }
    }

    function getNeedPriority(description, need) {
      const normalizedDescription = norm(description);
      const keyword = need.keywords.map(norm).find((item) => normalizedDescription.includes(item));
      if (!keyword) return 2;
      const sentence =
        normalizedDescription.split(/[.!?;\n,]+/).find((item) => item.includes(keyword)) ||
        normalizedDescription;
      if (/khong bat buoc|neu co|co thi tot/.test(sentence)) return 1;
      if (/bat buoc|phai co|khong the thieu|nhat dinh/.test(sentence)) return 5;
      if (/uu tien hang dau|uu tien nhat|quan trong nhat|rat quan trong/.test(sentence)) return 4;
      return 3;
    }

    function renderGeneratedCriteria(description, matchedNeeds) {
      const normalizedMustHaves = norm(mustHavesInput.value);
      const priorities = matchedNeeds.map((need) => {
        const isMandatory = need.keywords.some((kw) => normalizedMustHaves.includes(norm(kw)));
        return { need, score: getNeedPriority(description, need) + (isMandatory ? 5 : 0) };
      });

      const totalScore = priorities.reduce((total, item) => total + item.score, 0);
      const weights = priorities.map(({ score }) => Math.floor((score / totalScore) * 100));
      const remainingWeight = 100 - weights.reduce((total, w) => total + w, 0);
      const roundingOrder = priorities
        .map(({ score }, index) => ({ index, remainder: ((score / totalScore) * 100) % 1 }))
        .sort((a, b) => b.remainder - a.remainder);

      for (let i = 0; i < remainingWeight; i += 1) {
        weights[roundingOrder[i].index] += 1;
      }

      weightedPrioritiesInput.value = priorities
        .map(({ need }, i) => `${need.tag}: ${weights[i]}%`)
        .join(" / ");

      needTags.replaceChildren(
        ...priorities.map(({ need }) => {
          const li = document.createElement("li");
          li.className = "need-tag";
          li.textContent = need.tag;
          return li;
        })
      );
      needTags.hidden = false;

      weightedPrioritiesResults.replaceChildren(
        ...priorities.map(({ need }, i) => {
          const li = document.createElement("li");
          li.textContent = `${need.tag} ${weights[i]}%`;
          return li;
        })
      );
      weightedPrioritiesGroup.hidden = false;
    }

    function clearGeneratedCriteria() {
      weightedPrioritiesInput.value = "";
      needTags.replaceChildren();
      needTags.hidden = true;
      weightedPrioritiesResults.replaceChildren();
      weightedPrioritiesGroup.hidden = true;
    }

    function analyzeLifestyle() {
      const description = lifestyleInput.value.trim();
      const normalizedDescription = norm(description);
      const normalizedMustHaves = norm(mustHavesInput.value);
      const matchedNeeds = lifestyleNeeds.filter((need) =>
        need.keywords.some(
          (kw) => normalizedDescription.includes(norm(kw)) || normalizedMustHaves.includes(norm(kw))
        )
      );

      if (!description) {
        clearGeneratedCriteria();
        matcherStatus.textContent = "Hãy nhập mô tả nhu cầu trước khi phân tích.";
        matcherResult.hidden = true;
      } else if (matchedNeeds.length) {
        renderGeneratedCriteria(description, matchedNeeds);
        matcherStatus.textContent = "Đã tạo · Chờ bạn xác nhận";
        matcherResult.dataset.state = "suggestions";
        matcherEmpty.hidden = true;
        matcherSummary.textContent = `Đã chuyển mô tả thành ${matchedNeeds.length} tiêu chí ưu tiên`;
        matcherReasons.replaceChildren(
          ...matchedNeeds.map((need) => {
            const li = document.createElement("li");
            li.textContent = `${need.label} → ${need.guidance}`;
            return li;
          })
        );
        matcherResult.hidden = false;
        document.getElementById("property-matches").innerHTML = `
          <li><strong>HF-101 • River Park căn góc</strong> — Phù hợp 98%</li>
          <li><strong>HF-105 • Masteris 3PN thoáng</strong> — Phù hợp 95%</li>
        `;
      } else {
        clearGeneratedCriteria();
        matcherStatus.textContent = "Đã phân tích · Chưa có gợi ý";
        matcherResult.dataset.state = "empty";
        matcherSummary.textContent = "Chưa có gợi ý cho mô tả này";
        matcherEmpty.textContent =
          "Thông tin hiện tại chưa đủ để xác định tiêu chí phù hợp. Hãy bổ sung từ khóa (yên tĩnh, gần trường, WFH, ánh sáng, cây xanh...) rồi phân tích lại.";
        matcherEmpty.hidden = false;
        matcherResult.hidden = false;
      }
    }

    function setFieldError(boxId, errId, msg) {
      const box = document.getElementById(boxId);
      const err = document.getElementById(errId);
      if (box) box.classList.toggle("is-invalid", Boolean(msg));
      if (err) {
        err.textContent = msg || "";
        err.hidden = !msg;
      }
    }

    function clearFormErrors() {
      briefForm.querySelectorAll(".is-invalid").forEach((el) => el.classList.remove("is-invalid"));
      briefForm.querySelectorAll(".field-error").forEach((el) => (el.hidden = true));
    }

    function validateBriefForm() {
      clearFormErrors();
      let isValid = true;
      let firstInvalidEl = null;

      const markInvalid = (boxId, errId, inputEl, message) => {
        setFieldError(boxId, errId, message);
        isValid = false;
        if (!firstInvalidEl && inputEl) firstInvalidEl = inputEl;
      };

      if (!document.getElementById("brief-title").value.trim()) {
        markInvalid("field-box-title", "err-brief-title", document.getElementById("brief-title"), "Vui lòng nhập Tên nhu cầu (*).");
      }
      const minVal = budgetMin.value.trim();
      const maxVal = budgetMax.value.trim();
      if (!minVal || Number(minVal) <= 0) {
        markInvalid("field-box-budget-min", "err-budget-min", budgetMin, "Vui lòng nhập Ngân sách tối thiểu lớn hơn 0 (*).");
      }
      if (!maxVal || Number(maxVal) <= 0) {
        markInvalid("field-box-budget-max", "err-budget-max", budgetMax, "Vui lòng nhập Ngân sách tối đa lớn hơn 0 (*).");
      } else if (minVal && Number(maxVal) < Number(minVal)) {
        markInvalid("field-box-budget-max", "err-budget-max", budgetMax, "Ngân sách tối đa phải từ mức tối thiểu trở lên (*).");
      }
      if (!document.getElementById("preferred-area").value.trim()) {
        markInvalid("field-box-area", "err-preferred-area", document.getElementById("preferred-area"), "Vui lòng nhập Khu vực mong muốn (*).");
      }
      const houseSizeVal = document.getElementById("household-size").value.trim();
      if (!houseSizeVal || Number(houseSizeVal) < 1) {
        markInvalid("field-box-household", "err-household-size", document.getElementById("household-size"), "Vui lòng nhập Số thành viên từ 1 trở lên (*).");
      }
      const lifeVal = lifestyleInput.value.trim();
      if (!lifeVal) {
        markInvalid("field-box-lifestyle", "err-lifestyle", lifestyleInput, "Vui lòng nhập Mô tả nhu cầu sống (*).");
      } else if (lifeVal.length < 30) {
        markInvalid("field-box-lifestyle", "err-lifestyle", lifestyleInput, `Mô tả nhu cầu sống cần tối thiểu 30 ký tự (hiện tại: ${lifeVal.length}).`);
      } else if (lifeVal.length > 200) {
        markInvalid("field-box-lifestyle", "err-lifestyle", lifestyleInput, `Mô tả nhu cầu sống không vượt quá 200 ký tự (hiện tại: ${lifeVal.length}).`);
      }
      if (!selectedAgent) {
        markInvalid("agent-not-selected", "err-agent-select", null, "Vui lòng chọn môi giới nhận Brief (*).");
      } else if (!agentConsent.checked) {
        markInvalid("agent-not-selected", "err-agent-select", agentConsent, "Vui lòng tích đồng ý chia sẻ brief với môi giới (*).");
      }

      if (firstInvalidEl) firstInvalidEl.focus();
      return isValid;
    }

    function showBriefActionStatus(message, isError = false) {
      briefActionStatus.textContent = message;
      briefActionStatus.style.color = isError ? "#d92d20" : "#17684d";
      briefActionStatus.hidden = false;
    }

    restoreSelectedAgent();
    const savedUserBrief = API.getBrief();
    if (savedUserBrief) {
      briefExists = true;
      document.getElementById("brief-title").value = savedUserBrief.title || "";
      budgetMin.value = savedUserBrief.budgetMin || "";
      budgetMax.value = savedUserBrief.budgetMax || "";
      document.getElementById("preferred-area").value = savedUserBrief.preferredArea || "";
      document.getElementById("move-in-date").value = savedUserBrief.moveInDate || "";
      document.getElementById("household-size").value = savedUserBrief.householdSize || "";
      document.getElementById("size-and-bedrooms").value = savedUserBrief.sizeAndBedrooms || "";
      lifestyleInput.value = savedUserBrief.lifestyle || "";
      mustHavesInput.value = savedUserBrief.mustHaves || "";

      if (!selectedAgent && savedUserBrief.brokerObj) {
        selectedAgent = savedUserBrief.brokerObj;
        sessionStorage.setItem(brokerStorageKey, JSON.stringify(selectedAgent));
        restoreSelectedAgent();
      }
      if (selectedAgent) agentConsent.checked = true;
      if (savedUserBrief.history?.length) {
        document.getElementById("brief-history").innerHTML = savedUserBrief.history.map((h) => `<li>${h}</li>`).join("");
      }
      textCount();
      if (lifestyleInput.value.trim().length >= 30) analyzeLifestyle();
      archiveBriefButton.disabled = false;
      deleteBriefButton.disabled = false;
      submitBriefButton.textContent = "Gửi bản cập nhật";
    }

    updateMatcherWarning();

    lifestyleInput.addEventListener("input", () => {
      textCount();
      setFieldError("field-box-lifestyle", "err-lifestyle", "");
      clearGeneratedCriteria();
      if (!matcherResult.hidden) {
        matcherResult.hidden = true;
        matcherEmpty.hidden = true;
        matcherStatus.textContent = "Nội dung đã thay đổi. Hãy phân tích lại để cập nhật gợi ý.";
      }
    });

    mustHavesInput.addEventListener("input", () => {
      clearGeneratedCriteria();
      if (!matcherResult.hidden) {
        matcherResult.hidden = true;
        matcherEmpty.hidden = true;
        matcherStatus.textContent = "Nội dung đã thay đổi. Hãy phân tích lại để cập nhật gợi ý.";
      }
    });

    briefForm.addEventListener("input", updateMatcherWarning);
    analyzeButton.addEventListener("click", analyzeLifestyle);

    document.querySelector(".matcher-actions")?.addEventListener("click", (event) => {
      const action = event.target.closest("[data-matcher-action]")?.dataset.matcherAction;
      if (action === "accept") matcherStatus.textContent = "Đã xác nhận gợi ý.";
      else if (action === "edit") lifestyleInput.focus();
      else if (action === "reject") {
        matcherResult.hidden = true;
        clearGeneratedCriteria();
        matcherStatus.textContent = "Bạn đã từ chối gợi ý. Hãy chỉnh mô tả để phân tích lại.";
      } else if (action === "retry") analyzeLifestyle();
      else if (action === "save") matcherStatus.textContent = "Đã lưu kết quả phân tích AI trong phiên này.";
    });

    briefForm.addEventListener("submit", (event) => {
      event.preventDefault();
      if (!requireAuthOrRedirectToLogin()) return;
      if (!validateBriefForm()) {
        showBriefActionStatus("Không thể gửi Brief: Vui lòng điền đầy đủ các mục bắt buộc có dấu (*).", true);
        return;
      }
      if (needTags.hidden) analyzeLifestyle();

      const briefCode = `B-${session.id.replace(/\D/g, "") || "024"}`;
      const now = new Date();
      const timeStr = new Intl.DateTimeFormat("vi-VN", { dateStyle: "short", timeStyle: "short" }).format(now);

      const briefData = {
        code: briefCode,
        title: document.getElementById("brief-title").value.trim(),
        budgetMin: budgetMin.value.trim(),
        budgetMax: budgetMax.value.trim(),
        preferredArea: document.getElementById("preferred-area").value.trim(),
        moveInDate: document.getElementById("move-in-date").value,
        householdSize: document.getElementById("household-size").value.trim(),
        sizeAndBedrooms: document.getElementById("size-and-bedrooms").value.trim(),
        lifestyle: lifestyleInput.value.trim(),
        mustHaves: mustHavesInput.value.trim(),
        priorities: weightedPrioritiesInput.value || "Yên tĩnh: 40% / Gần trường: 35% / WFH: 25%",
        brokerName: selectedAgent.name,
        brokerObj: selectedAgent,
        history: [
          `${timeStr} — ${document.getElementById("brief-title").value.trim()} gửi ${briefCode} tới ${selectedAgent.name}`,
          ...(savedUserBrief?.history || []),
        ],
      };

      API.saveBrief(briefData);

      const leads = API.getLeads();
      const leadCode = `L-0${leads.length + 24}`;
      leads.unshift({
        id: leadCode,
        leadCode,
        briefCode,
        clientName: briefData.title,
        familyInfo: `Gia đình ${briefData.householdSize} người`,
        source: `${briefCode} / HF-101`,
        sourcePostId: "HF-101",
        status: "new",
        email: session.email || "",
        phone: session.phone || "090 000 0024",
        brokerName: selectedAgent.name,
        consent: true,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
        briefSummary: `${briefData.lifestyle} (${briefData.priorities})`,
        history: [`${timeStr} — ${briefData.title} gửi ${briefCode}`],
      });
      API.saveLeads(leads);

      briefNumber.textContent = briefCode;
      document.getElementById("recipient-name").textContent = selectedAgent.name;
      sentAt.dateTime = now.toISOString();
      sentAt.textContent = timeStr;
      briefStatus.hidden = false;
      briefExists = true;
      archiveBriefButton.disabled = false;
      deleteBriefButton.disabled = false;
      submitBriefButton.textContent = "Gửi bản cập nhật";

      document.getElementById("brief-history").innerHTML = briefData.history.map((h) => `<li>${h}</li>`).join("");
      showBriefActionStatus("Brief đã được gửi thành công tới môi giới!");
    });

    saveDraftButton?.addEventListener("click", () => {
      if (!requireAuthOrRedirectToLogin()) return;
      showBriefActionStatus("Đã lưu nháp trong phiên này.");
    });

    archiveBriefButton?.addEventListener("click", () => {
      if (!briefExists) return;
      showBriefActionStatus("Brief đã được lưu trữ trong phiên này.");
    });

    deleteBriefButton?.addEventListener("click", () => {
      if (!briefExists || !window.confirm("Bạn có chắc muốn xóa brief này không?")) return;
      briefForm.reset();
      clearFormErrors();
      clearGeneratedCriteria();
      API.saveBrief(null);
      sessionStorage.removeItem(brokerStorageKey);
      selectedAgent = null;
      restoreSelectedAgent();
      briefNumber.textContent = "";
      briefStatus.hidden = true;
      matcherResult.hidden = true;
      matcherStatus.textContent = "Nhập nhu cầu sinh hoạt để bắt đầu phân tích.";
      document.getElementById("brief-history").innerHTML = "";
      briefExists = false;
      archiveBriefButton.disabled = true;
      deleteBriefButton.disabled = true;
      submitBriefButton.textContent = "Gửi brief";
      textCount();
      updateMatcherWarning();
      showBriefActionStatus("Brief đã được xóa.");
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
            <li><strong>${b.fit}%</strong><span>${b.fitLabel}</span></li>
            <li><strong>${b.deals}</strong><span>Bài đăng công khai</span></li>
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
     5. TRANG CHI TIẾT BẤT ĐỘNG SẢN (seeker-detail.html) - Tích hợp Bảng Nearby từ Dev
     ======================================================================== */
  const detailArticle = document.getElementById("property-detail");
  if (detailArticle) {
    const id = new URLSearchParams(window.location.search).get("id") || "HF-101";
    const post = API.getPosts().find((p) => p.id === id || p.code === id) || API.getPosts()[0];
    if (post) {
      document.getElementById("property-breadcrumb-title").textContent = post.title;
      document.getElementById("property-code").textContent = post.code;
      document.getElementById("property-title").textContent = post.title;
      document.getElementById("property-location").textContent = post.location;
      document.getElementById("property-price").textContent = post.price;
      document.getElementById("property-fit-score").textContent = `● Phù hợp ${post.fitScore || "95%"}`;
      document.getElementById("property-quick-facts").textContent = [
        post.size,
        post.bedrooms && `${post.bedrooms} PN`,
        post.bathrooms && `${post.bathrooms} WC`,
        post.floor,
      ]
        .filter(Boolean)
        .join(" · ");
      document.getElementById("property-description").textContent = post.description;
      document.getElementById("property-contract").textContent = post.contract;
      document.getElementById("property-legal").textContent = post.legal;
      document.getElementById("property-costs").textContent = post.costs;
      document.getElementById("property-furnishing").textContent = post.furnishing;
      document.getElementById("property-amenities").textContent = post.amenities;
      document.getElementById("property-broker").textContent = post.brokerName;
      document.getElementById("property-contact-description").textContent = post.brokerMeta || post.location;

      const imgs = Array.isArray(post.images) && post.images.length ? post.images : [post.image];
      document.getElementById("property-image-main").src = imgs[0];
      document.getElementById("property-image-second").src = imgs[1] || imgs[0];
      document.getElementById("property-image-third").src = imgs[2] || imgs[0];

      document.getElementById("property-ai-reasons").innerHTML = (post.aiReasons || [post.description])
        .map((r) => `<li>${r}</li>`)
        .join("");

      // Render bảng Tiện ích lân cận (nearby) nếu có phần tử #property-nearby-list
      const nearbyBody = document.getElementById("property-nearby-list");
      if (nearbyBody && Array.isArray(post.nearby)) {
        nearbyBody.innerHTML = post.nearby
          .map((item) => `<tr><td>${item.name}</td><td>${item.distance}</td><td>${item.type}</td></tr>`)
          .join("");
      }

      const saveDetailBtn = document.getElementById("btn-detail-save");
      function syncSaveDetailButton() {
        if (!saveDetailBtn) return;
        const session = API.getSession();
        const isSaved = session ? API.getSaved().some((s) => s.id === post.id) : false;
        saveDetailBtn.textContent = isSaved ? "♥ Đã lưu nhà" : "♡ Lưu nhà";
        saveDetailBtn.classList.toggle("is-saved", isSaved);
      }

      saveDetailBtn?.addEventListener("click", () => {
        if (!requireAuthOrRedirectToLogin()) return;
        let saved = API.getSaved();
        if (saved.some((s) => s.id === post.id)) saved = saved.filter((s) => s.id !== post.id);
        else saved.push(post);
        API.saveSaved(saved);
        syncSaveDetailButton();
      });

      syncSaveDetailButton();

      document.getElementById("property-viewing-form")?.addEventListener("submit", (e) => {
        e.preventDefault();
        const fd = new FormData(e.target);
        const appts = API.getAppts();
        appts.unshift({
          id: `A-0${appts.length + 34}`,
          clientName: fd.get("clientName"),
          houseCode: post.code,
          houseName: post.title,
          start: `${fd.get("date")}T${fd.get("time") || "09:00"}`,
          end: `${fd.get("date")}T10:00`,
          time: `${fd.get("date")} • ${fd.get("time")}`,
          broker: post.brokerName,
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
          id: `R-0${reports.length + 19}`,
          propertyId: post.id,
          propertyTitle: `${post.code} • ${post.title}`,
          details,
          status: "pending",
          submittedAt: new Date().toISOString(),
        });
        API.saveReports(reports);
        document.getElementById("property-report-inline-status").textContent =
          "Đã gửi báo cáo tới Trung tâm xử lý vi phạm của Moderator!";
        e.target.reset();
      });
    }
  }
});