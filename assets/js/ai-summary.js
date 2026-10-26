const API = window.HomeFitAPI;
const params = new URLSearchParams(window.location.search);
const postId = params.get("id") || "";

const source = document.querySelector("#summary-source");
const missing = document.querySelector("#summary-missing");
const runButton = document.querySelector("#summary-run");
const status = document.querySelector("#summary-status");
const output = document.querySelector("#summary-output");
const confidence = document.querySelector("#summary-confidence");
const blocksList = document.querySelector("#summary-blocks");
const reasonsList = document.querySelector("#summary-reasons");
const actions = document.querySelector("#summary-actions");
const note = document.querySelector("#summary-note");
const backLink = document.querySelector(".ai-bar__back");
const editLink = document.querySelector("#summary-edit-link");

const focusTopics = [
  [/wfh|lam viec|work/i, "góc WFH"],
  [/gia dinh|con nho|truong/i, "gia đình"],
  [/yen tinh|ngu/i, "không gian yên tĩnh"],
  [/ho boi|gym|cong vien/i, "tiện ích nội khu"],
];

let post = null;
let result = null;
let cut = 0;

function normalizeText(value) {
  return String(value || "")
    .toLocaleLowerCase("vi")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d");
}

function postText(postData) {
  return normalizeText(
    [
      postData.title,
      postData.description,
      postData.amenities,
      postData.softCriteria,
      postData.sourceNote,
    ].join(" "),
  );
}

function focusOf(text) {
  const hits = focusTopics
    .filter(([pattern]) => pattern.test(text))
    .map(([, label]) => label);
  if (!hits.length) return hits;
  const start = cut % hits.length;
  return [...hits.slice(start), ...hits.slice(0, start)];
}

function describe(postData) {
  return [
    `Bài đăng ${postData.code || postData.id}: ${postData.title || "chưa có tiêu đề"}`,
    postData.price && `Giá: ${postData.price}`,
    postData.size && `Diện tích: ${postData.size}`,
    postData.location && `Vị trí: ${postData.location}`,
    (postData.bedrooms || postData.rooms) &&
      `Phòng: ${postData.bedrooms || postData.rooms}`,
    (postData.description || postData.amenities) &&
      `Mô tả: ${postData.description || postData.amenities}`,
    postData.softCriteria && `Tiêu chí mềm: ${postData.softCriteria}`,
    postData.legal && `Pháp lý: ${postData.legal}`,
    `Ảnh: ${(postData.images || []).length} · Tài liệu: ${postData.docName || "chưa tải"}`,
  ]
    .filter(Boolean)
    .join("\n");
}

function analyzePost(postData) {
  const text = postText(postData);
  const focus = focusOf(text);
  const evidence = [
    postData.title,
    postData.price,
    postData.size,
    postData.location,
    postData.description || postData.amenities,
    postData.legal,
    postData.docName,
    (postData.images || []).length >= 3,
  ].filter(Boolean).length;

  return {
    heading: focus.length
      ? `Trải nghiệm ${focus.slice(0, 2).join(" & ")}`
      : "Bố cục theo thông tin bài đăng",
    blocks: [
      {
        label: "Không gian & nội thất",
        note: [postData.size, postData.furnishing].filter(Boolean).join(" · "),
      },
      {
        label: `Tổng chi phí ${postData.transaction === "buy" ? "mua" : "thuê"}`,
        note: [postData.price, postData.costs].filter(Boolean).join(" · "),
      },
      {
        label: focus[0] ? `Trường học & ${focus[0]}` : "Tiện ích quanh nhà",
        note: postData.location || "",
      },
      {
        label: "Pháp lý, ngân sách và lưu ý",
        note: [postData.legal, postData.docName].filter(Boolean).join(" · "),
      },
    ],
    reasons: [
      ...focus.map(
        (label) => `Chủ đề "${label}" xuất hiện trong mô tả bạn đã nhập.`,
      ),
      `Bài đăng có ${evidence}/8 nhóm thông tin chính nên bố cục giữ đủ 4 khối.`,
      postData.docName
        ? `Tài liệu ${postData.docName} là căn cứ cho khối pháp lý.`
        : "Chưa có tài liệu quyền cho thuê nên khối pháp lý chỉ nêu thông tin đã nhập.",
      `Bài có ${(postData.images || []).length} ảnh; ảnh đầu tiên là ảnh chính ở trang tìm nhà.`,
    ],
    confidence: Math.min(
      95,
      55 + evidence * 5 + Math.min(4, focus.length * 2),
    ),
  };
}

function toDescription(summary) {
  return `${summary.heading}\n${summary.blocks
    .map((block, index) => `${index + 1}. ${block.label}`)
    .join("\n")}`;
}

function fill(target, items, create) {
  target.replaceChildren(...items.map(create));
}

function showResult(next, message) {
  result = next;
  output.hidden = false;
  actions.hidden = false;
  fill(blocksList, next.blocks, (block) => {
    const row = document.createElement("li");
    row.append(block.label);
    if (block.note) {
      const hint = document.createElement("span");
      hint.textContent = block.note;
      row.append(hint);
    }
    return row;
  });
  fill(
    reasonsList,
    next.reasons,
    (reason) => {
      const item = document.createElement("li");
      item.textContent = reason;
      return item;
    },
  );
  confidence.textContent = `Độ tin cậy ${next.confidence}% · ${next.blocks.length} khối · ${next.heading}`;
  status.className = "ai-status is-done";
  status.textContent = message;
}

function resetOutput(message, warn) {
  result = null;
  output.hidden = true;
  actions.hidden = true;
  status.className = warn ? "ai-status is-warn" : "ai-status";
  status.textContent = message;
}

function showNote(message) {
  note.textContent = message;
  note.hidden = !message;
}

function renderPost() {
  post = API.getPosts().find(
    (item) => item.id === postId || item.code === postId,
  );
  source.textContent = post ? describe(post) : "";
  missing.hidden = Boolean(post);
  runButton.disabled = !post;
  return post;
}

function analyze(message) {
  runButton.disabled = true;
  status.className = "ai-status is-busy";
  status.textContent = "Đang dựng bố cục từ thông tin bài đăng...";
  window.setTimeout(() => {
    runButton.disabled = false;
    showResult(analyzePost(post), message);
  }, 650);
}

API.ready.then(() => {
  const editParam = postId.startsWith("draft-") ? postId.slice(6) : postId;
  const backUrl =
    editParam && editParam !== "new"
      ? `agent-post.html?edit=${encodeURIComponent(editParam)}`
      : "agent-post.html";
  backLink.href = backUrl;
  editLink.href = backUrl;

  const ready = Boolean(renderPost());
  if (!ready) {
    resetOutput("Chưa có bài đăng được truyền vào nên AI chưa có dữ liệu.", true);
    return;
  }

  const saved = API.getAi("summary");
  if (saved?.postId === postId && saved.blocks?.length) {
    showResult(
      saved,
      `Đang áp dụng cho bài đăng, lưu lúc ${new Date(saved.savedAt).toLocaleString("vi-VN")}.`,
    );
    showNote("Bài đăng đang dùng bố cục này cho phần mô tả.");
  }

  runButton.addEventListener("click", () => {
    renderPost();
    analyze("Đã tạo · Chờ bạn xác nhận");
  });

  actions.addEventListener("click", (event) => {
    const action = event.target.closest("[data-action]")?.dataset.action;
    if (!action || !result) return;

    if (action === "accept") {
      const posts = API.getPosts();
      const index = posts.findIndex(
        (item) => item.id === postId || item.code === postId,
      );
      if (index >= 0) {
        posts[index] = { ...posts[index], description: toDescription(result) };
        API.savePosts(posts);
      }
      API.saveAi("summary", {
        ...result,
        postId,
        savedAt: new Date().toISOString(),
      });
      showNote("Đã lưu bố cục và ghi vào phần mô tả của bài đăng.");
      status.textContent = "Đã xác nhận và lưu vào hệ thống.";
    } else if (action === "reject") {
      API.saveAi("summary", null);
      resetOutput(
        "Bạn đã từ chối gợi ý. Hãy sửa bài đăng rồi mở lại AI.",
        true,
      );
      showNote("");
    } else if (action === "retry") {
      cut += 1;
      analyze("Bản gợi ý mới · Chờ bạn xác nhận");
      showNote("");
    }
  });
});
