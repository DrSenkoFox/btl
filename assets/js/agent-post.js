const agentPostForm = document.querySelector("#agent-post-form");
const agentPostMessage = document.querySelector("#agent-post-message");
const photoInput = document.querySelector("#agent-post-photo-input");
const photosEl = document.querySelector("#agent-post-photos");
const photosMeta = document.querySelector("#agent-post-photos-meta");
const photoAlert = document.querySelector("#agent-post-photo-alert");
const photoAlertTitle = document.querySelector("#agent-post-photo-alert-title");
const docInput = document.querySelector("#agent-post-doc-input");
const docField = document.querySelector("#agent-post-doc-field");
const docState = document.querySelector("#agent-post-doc-state");
const checklist = document.querySelector("#agent-post-checklist");
const submitBtn = document.querySelector("#agent-post-submit-btn");
const draftBtn = document.querySelector("#agent-post-save-draft");
const checkNote = document.querySelector("#agent-post-check-note");
const aiState = document.querySelector("#agent-post-ai-state");
const aiTitle = document.querySelector("#agent-post-ai-title");
const aiList = document.querySelector("#agent-post-ai-list");
const aiNote = document.querySelector("#agent-post-ai-note");
const aiApplyBtn = document.querySelector("#agent-post-ai-apply");
const aiEditBtn = document.querySelector("#agent-post-ai-edit");
const aiReloadBtn = document.querySelector("#agent-post-ai-reload");
const aiClearBtn = document.querySelector("#agent-post-ai-clear");
const aiRenameField = document.querySelector("#agent-post-ai-rename-field");
const aiRename = document.querySelector("#agent-post-ai-rename");
const previewImage = document.querySelector("#agent-post-preview-image");
const previewEmpty = document.querySelector("#agent-post-preview-empty");
const previewTitle = document.querySelector("#agent-post-preview-title");
const previewPrice = document.querySelector("#agent-post-preview-price");
const previewMeta = document.querySelector("#agent-post-preview-meta");
const previewBadge = document.querySelector("#agent-post-preview-badge");
const previewLink = document.querySelector("#agent-post-preview-link");

const postParams = new URLSearchParams(window.location.search);
const editId = postParams.get("edit");
const draftId = `draft-${editId || "new"}`;
const minPhotos = 3;

let photos = [];
let docName = "";
let draftStamp = "";
let savedPostId = editId || "";
let aiSeed = 0;
let aiCleared = false;
let aiApplied = false;
let aiCustomTitle = "";

function showMessage(text) {
  agentPostMessage.textContent = text;
  agentPostMessage.hidden = !text;
}

function formValues() {
  const values = Object.fromEntries(new FormData(agentPostForm).entries());
  delete values.docFile;
  return values;
}

function checkItems() {
  const values = formValues();
  const filled = (key) => Boolean(String(values[key] || "").trim());
  return [
    {
      ok: filled("price") && filled("size") && filled("location"),
      okText: "Giá, diện tích, địa chỉ hợp lệ",
      badText: "Thiếu giá, diện tích hoặc địa chỉ",
    },
    {
      ok: filled("softCriteria") && filled("sourceNote"),
      okText: "Có nguồn cho tiêu chí mềm",
      badText: "Chưa có nguồn cho tiêu chí mềm",
    },
    {
      ok: Boolean(docName),
      okText: "Đã tải tài liệu quyền cho thuê",
      badText: "Thiếu tài liệu quyền cho thuê",
    },
    {
      ok: photos.length >= minPhotos,
      okText: `Đã có ${photos.length} ảnh`,
      badText: "Chưa đủ 3 ảnh",
    },
  ];
}

function updateChecks() {
  const items = checkItems();
  const missing = items.filter((item) => !item.ok).length;

  checklist.replaceChildren(
    ...items.map((item) => {
      const row = document.createElement("li");
      row.className = item.ok ? "is-ok" : "is-missing";
      row.textContent = item.ok ? item.okText : item.badText;
      return row;
    }),
  );
  docField.classList.toggle("is-missing", !docName);
  docState.textContent = docName || "Chưa tải tài liệu";
  const requiredLeft = !agentPostForm.checkValidity();
  submitBtn.disabled = missing > 0 || requiredLeft;
  checkNote.textContent = `${
    missing
      ? `Hoàn thành ${missing} mục còn thiếu để gửi.`
      : requiredLeft
        ? "Còn trường bắt buộc (*) chưa điền."
        : "Tin đã đủ điều kiện gửi duyệt."
  }${draftStamp}`;
  return missing + (requiredLeft ? 1 : 0);
}

const aiCard = document.querySelector(".agent-post-ai");
const aiFocusTags = [
  [/wfh|làm việc|work/i, "góc WFH"],
  [/gia đình|con nhỏ|trường/i, "gia đình"],
  [/yên tĩnh|ngủ/i, "không gian yên tĩnh"],
  [/hồ bơi|gym|công viên/i, "tiện ích nội khu"],
];

function aiFocus(values) {
  const text = `${values.softCriteria} ${values.sourceNote} ${values.description}`;
  const hits = aiFocusTags
    .filter(([pattern]) => pattern.test(text))
    .map(([, label]) => label);
  if (!hits.length) return hits;
  const cut = aiSeed % hits.length;
  return [...hits.slice(cut), ...hits.slice(0, cut)];
}

function aiItems(values) {
  const focus = aiFocus(values);
  return [
    "Không gian & nội thất",
    `Tổng chi phí ${values.transaction === "buy" ? "mua" : "thuê"}`,
    focus[0] ? `Trường học & ${focus[0]}` : "Tiện ích quanh nhà",
    "Pháp lý, ngân sách và lưu ý",
  ];
}

function aiHeading(values) {
  if (aiCustomTitle) return aiCustomTitle;
  const focus = aiFocus(values);
  return focus.length
    ? `Trải nghiệm ${focus.slice(0, 2).join(" & ")}`
    : "Bố cục theo tiêu chí bạn vừa nhập";
}

function renderAi() {
  const values = formValues();

  aiCard.toggleAttribute("data-cleared", aiCleared);
  aiList.replaceChildren(
    ...aiItems(values).map((item) => {
      const row = document.createElement("li");
      row.textContent = item;
      return row;
    }),
  );
  aiTitle.textContent = aiHeading(values);
  aiState.textContent = aiCleared
    ? "Đã bỏ gợi ý"
    : aiApplied
      ? "Bản gợi ý • Đã áp dụng vào bài đăng"
      : aiCustomTitle
        ? "Bản gợi ý • Đã chỉnh sửa"
        : "Bản gợi ý • Chưa áp dụng";
  aiNote.textContent = aiCleared
    ? "Bấm Tạo lại để AI dựng lại bố cục từ thông tin bạn nhập."
    : "Nguồn cấu trúc bạn vừa nhập. AI không thêm tiện ích hoặc luật mới.";
}

function renderPreview() {
  const values = formValues();
  const parts = (values.location || "")
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
  const [bedrooms, bathrooms] = (values.rooms || "")
    .split("/")
    .map((part) => part.trim());

  previewImage.hidden = !photos.length;
  previewEmpty.hidden = Boolean(photos.length);
  if (photos.length) previewImage.src = photos[0];
  previewTitle.textContent = `${values.title || "Tiêu đề bài đăng"}${
    parts.length ? ` • ${parts.at(-3) || parts[0]}` : ""
  }`;
  previewPrice.textContent = values.price || "Chưa có giá";
  previewMeta.textContent = [
    values.size,
    bedrooms && `${bedrooms} PN`,
    bathrooms && `${bathrooms} WC`,
  ]
    .filter(Boolean)
    .join(" · ");
}

function refresh() {
  updateChecks();
  renderAi();
  renderPreview();
}

function renderPhotos() {
  const missingPhotos = Math.max(0, minPhotos - photos.length);
  photosEl.replaceChildren(
    ...photos.map((src, index) => {
      const figure = document.createElement("figure");
      const image = document.createElement("img");
      const remove = document.createElement("button");

      figure.draggable = true;
      figure.dataset.index = index;
      image.src = src;
      image.alt = `Ảnh ${index + 1} của căn nhà`;
      remove.type = "button";
      remove.className = "agent-post-photos__remove";
      remove.textContent = "×";
      remove.setAttribute("aria-label", `Xóa ảnh ${index + 1}`);
      remove.addEventListener("click", () => {
        photos.splice(index, 1);
        renderPhotos();
      });
      figure.append(image, remove);
      return figure;
    }),
  );
  photosMeta.textContent = photos.length
    ? `${photos.length} ảnh đã tải • Kéo để đổi thứ tự`
    : "Chưa có ảnh nào được tải.";
  photoAlert.hidden = missingPhotos === 0;
  photoAlertTitle.textContent = `Cần thêm ${missingPhotos} ảnh`;
  refresh();
}

async function toStoredImage(file) {
  if (!file?.type?.startsWith("image/")) return "";

  const url = URL.createObjectURL(file);
  const image = new Image();
  await new Promise((resolve) => {
    image.onload = image.onerror = resolve;
    image.src = url;
  });
  URL.revokeObjectURL(url);
  const width = image.naturalWidth || 1280;
  const height = image.naturalHeight || 800;
  const scale = Math.min(1, 1280 / width);
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(width * scale);
  canvas.height = Math.round(height * scale);
  canvas.getContext("2d").drawImage(image, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", 0.78);
}

photoInput.addEventListener("change", async () => {
  const files = [...photoInput.files];
  let skipped = 0;

  photoInput.value = "";
  for (const file of files) {
    const stored = await toStoredImage(file);
    if (stored) photos.push(stored);
    else skipped += 1;
  }
  renderPhotos();
  if (skipped)
    showMessage("Video chưa lưu được trong bản mẫu, chỉ ảnh hiển thị ở tin đăng.");
});

docInput.addEventListener("change", () => {
  docName = docInput.files[0]?.name || "";
  refresh();
});

let dragIndex = null;

photosEl.addEventListener("dragstart", (event) => {
  dragIndex = Number(event.target.closest("figure")?.dataset.index);
});
photosEl.addEventListener("dragover", (event) => event.preventDefault());
photosEl.addEventListener("drop", (event) => {
  event.preventDefault();
  const to = Number(event.target.closest("figure")?.dataset.index);
  if (Number.isNaN(to) || to === dragIndex) return;
  photos.splice(to, 0, photos.splice(dragIndex, 1)[0]);
  dragIndex = null;
  renderPhotos();
});

function saveDraft() {
  const stamp = new Date().toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  });

  window.HomeFitAgentPosts.delete(draftId);
  const saved = window.HomeFitAgentPosts.save({
    ...formValues(),
    id: draftId,
    code: "B-NHÁP",
    docName,
    images: photos,
    status: "draft",
    updatedAt: stamp,
  });
  draftStamp = saved
    ? ` Bản nháp được lưu lúc ${stamp}.`
    : " Không lưu được nháp vì bộ nhớ trình duyệt đầy.";
  if (saved) savedPostId = draftId;
  updateChecks();
  return saved ? draftId : "";
}

draftBtn.addEventListener("click", saveDraft);
aiApplyBtn.addEventListener("click", () => {
  const values = formValues();
  agentPostForm.elements.description.value = `${aiHeading(values)}\n${aiItems(values)
    .map((item, index) => `${index + 1}. ${item}`)
    .join("\n")}`;
  aiApplied = true;
  refresh();
});
aiEditBtn.addEventListener("click", () => {
  aiRenameField.hidden = false;
  aiRename.value = aiTitle.textContent;
  aiRename.focus();
});
aiRename.addEventListener("input", () => {
  aiCustomTitle = aiRename.value.trim();
  renderAi();
});
aiReloadBtn.addEventListener("click", () => {
  aiSeed += 1;
  aiCleared = false;
  aiApplied = false;
  aiCustomTitle = "";
  aiRenameField.hidden = true;
  renderAi();
});
aiClearBtn.addEventListener("click", () => {
  aiCleared = true;
  renderAi();
});
previewLink.addEventListener("click", (event) => {
  event.preventDefault();
  const hasTitle = agentPostForm.elements.title.value.trim();
  const id = savedPostId || (hasTitle && saveDraft());
  if (!id) {
    showMessage(
      hasTitle
        ? "Chưa lưu được bản nháp nên chưa mở xem trước đầy đủ."
        : "Nhập tiêu đề bài đăng để mở xem trước đầy đủ.",
    );
    return;
  }
  window.location.href = `seeker-detail.html?id=${encodeURIComponent(id)}`;
});
agentPostForm.addEventListener("input", refresh);
agentPostForm.addEventListener("change", refresh);

function applyPost(post) {
  for (const [key, value] of Object.entries(post)) {
    const field = agentPostForm.elements[key];
    if (!field || typeof value !== "string") continue;
    if (field.type === "radio") {
      const option = agentPostForm.querySelector(
        `input[name="${key}"][value="${value}"]`,
      );
      if (option) option.checked = true;
    } else {
      field.value = value;
    }
  }

  if (!post.rooms && post.bedrooms != null)
    agentPostForm.elements.rooms.value = `${post.bedrooms} / ${post.bathrooms ?? ""}`;
  photos = Array.isArray(post.images) ? [...post.images] : [];
  docName = post.docName || "";
  renderPhotos();
}

function loadHeading() {
  const eyebrow = document.querySelector("#agent-post-eyebrow");

  if (!editId) {
    eyebrow.textContent = "BÀI ĐĂNG MỚI";
    return;
  }
  const post = window.HomeFitAgentPosts?.getAll().find(
    (item) => item.id === editId || item.code === editId,
  );
  const statusLabels = {
    pending: "Đang chờ duyệt",
    approved: "Đã duyệt",
    revision: "Yêu cầu sửa",
    rejected: "Không được chấp nhận",
    draft: "Bản nháp",
  };
  eyebrow.textContent = `CHỈNH SỬA ${(post?.code || editId).toUpperCase()}`;
  submitBtn.textContent =
    post && post.status !== "draft" ? "Gửi duyệt lại" : "Gửi duyệt";
  previewBadge.hidden = !post;
  previewBadge.dataset.status = post?.status || "";
  previewBadge.textContent = statusLabels[post?.status] || "";
  if (post) applyPost(post);
}

agentPostForm.addEventListener("submit", (event) => {
  event.preventDefault();
  if (updateChecks()) {
    showMessage("Còn mục chưa đạt, vui lòng bổ sung trước khi gửi duyệt.");
    return;
  }

  const values = formValues();
  const posts = window.HomeFitAgentPosts.getAll();
  const existing = posts.find(
    (post) => post.id === editId || (editId && post.code === editId),
  );
  const fromDraft = existing?.status === "draft";
  const [bedrooms, bathrooms] = (values.rooms || "")
    .split("/")
    .map((value) => value.trim());
  const post = {
    ...existing,
    ...values,
    id: existing && !fromDraft ? existing.id : `post-${Date.now()}`,
    code: existing && !fromDraft ? existing.code : undefined,
    transactionType: values.transaction,
    brokerMeta: `${values.brokerName} • ${values.contact}`,
    bedrooms,
    bathrooms,
    costs: `Phí quản lý ${values.managementFee} · điện nước theo hoá đơn`,
    docName,
    images: photos,
    image: photos[0] || "",
    status: "pending",
    createdAt: existing?.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  window.HomeFitAgentPosts.delete(post.id);
  window.HomeFitAgentPosts.delete(draftId);
  if (fromDraft) window.HomeFitAgentPosts.delete(existing.id);
  draftStamp = "";
  if (!window.HomeFitAgentPosts.save(post)) {
    showMessage("Không thể lưu bài đăng. Hãy giảm số ảnh rồi thử lại.");
    return;
  }
  savedPostId = post.id;
  refresh();
  showMessage(
    "Đã gửi bài đăng. Tin đang chờ kiểm duyệt và sẽ hiện ở trang tìm nhà khi được duyệt.",
  );
});

function updateUserInfo() {
  const brokerNameEl = document.getElementById("agent-broker-name");
  const metaSepEl = document.getElementById("agent-meta-sep");

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
  if (metaSepEl) metaSepEl.style.display = userName ? "inline" : "none";
}

const storedDraft = window.HomeFitAgentPosts?.getAll().find(
  (post) => post.id === draftId,
);

if (!editId && storedDraft) {
  draftStamp = ` Bản nháp được lưu lúc ${storedDraft.updatedAt}.`;
  applyPost(storedDraft);
} else {
  renderPhotos();
}
loadHeading();
updateUserInfo();
