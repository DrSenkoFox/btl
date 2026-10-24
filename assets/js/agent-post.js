const agentPostForm = document.querySelector("#agent-post-form");
const agentPostList = document.querySelector("#agent-post-list");
const agentPostEmpty = document.querySelector("#agent-post-empty");
const agentPostMessage = document.querySelector("#agent-post-message");

function renderAgentPostStatuses() {
  const posts = window.HomeFitAgentPosts.getAll();
  const labels = {
    pending: "Đang duyệt",
    approved: "Đã duyệt · Được chấp nhận",
    rejected: "Không được chấp nhận",
    revision: "Yêu cầu sửa",
    draft: "Bản nháp",
    archived: "Đã lưu",
  };

  agentPostList.replaceChildren(
    ...posts.map((post) => {
      const item = document.createElement("li");
      const title = document.createElement("strong");
      const status = document.createElement("span");
      const link = document.createElement("a");

      item.className = `agent-post-status agent-post-status--${post.status}`;
      title.textContent = post.title;
      status.textContent = labels[post.status] || labels.pending;
      item.append(title, status);
      link.href =
        post.status === "approved"
          ? "seeker-search.html"
          : post.status === "rejected"
            ? "agent-post.html#agent-post-form"
            : "agent-posts.html";
      link.textContent =
        post.status === "approved"
          ? "Xem trên trang tìm nhà"
          : post.status === "pending"
            ? "Quản lý bài đăng"
            : post.status === "revision"
              ? "Xem lý do sửa"
              : "Quản lý bài đăng";
      item.append(link);
      return item;
    }),
  );
  agentPostEmpty.hidden = posts.length > 0;
}

function readPostImages(data) {
  return ["image", "image2", "image3"]
    .map((key) => String(data.get(key) || "").trim())
    .filter(Boolean);
}

function updateAgentPostPreview() {
  const data = new FormData(agentPostForm);
  const images = readPostImages(data);
  const preview = document.querySelector("#agent-post-preview-images");

  document.querySelector("#agent-post-preview-type").textContent =
    data.get("transaction") === "buy" ? "Cần bán" : "Cho thuê";
  document.querySelector("#agent-post-preview-title").textContent =
    data.get("title") || "Tiêu đề bài đăng";
  document.querySelector("#agent-post-preview-location").textContent =
    data.get("location") || "Khu vực căn nhà";
  document.querySelector("#agent-post-preview-price").textContent =
    data.get("price") || "Giá đăng";
  preview.replaceChildren(
    ...images.map((src, index) => {
      const image = document.createElement("img");
      image.src = src;
      image.alt = `Ảnh xem trước ${index + 1}`;
      return image;
    }),
  );
}

agentPostForm.addEventListener("input", updateAgentPostPreview);
agentPostForm.addEventListener("change", updateAgentPostPreview);
function loadPostForEditing() {
  const params = new URLSearchParams(window.location.search);
  const editId = params.get("edit");
  const eyebrow = document.querySelector("#agent-post-eyebrow");
  const subtitle = document.querySelector("#agent-post-subtitle");

  if (!editId) {
    if (eyebrow) eyebrow.textContent = "KHÔNG GIAN DÀNH CHO MÔI GIỚI";
    return;
  }

  const posts = window.HomeFitAgentPosts?.getAll() || [];
  const post = posts.find((p) => p.id === editId || p.code === editId);
  if (!post) {
    if (eyebrow) eyebrow.textContent = `CHỈNH SỬA ${editId.toUpperCase()}`;
    return;
  }

  if (eyebrow) {
    eyebrow.textContent = `CHỈNH SỬA ${post.code || post.id} / ${(post.title || "").toUpperCase()}`;
  }
  if (subtitle) {
    subtitle.textContent =
      "Bản sửa được lưu riêng. AI chỉ hỗ trợ nội dung; môi giới gửi duyệt và kiểm duyệt viên quyết định công khai.";
  }

  Object.entries(post).forEach(([key, val]) => {
    const input = agentPostForm.elements[key];
    if (input) {
      if (input.type === "radio") {
        const radio = agentPostForm.querySelector(`input[name="${key}"][value="${val}"]`);
        if (radio) radio.checked = true;
      } else {
        input.value = val;
      }
    }
  });

  ["image", "image2", "image3"].forEach((key, index) => {
    const input = agentPostForm.elements[key];
    if (input && post.images?.[index]) input.value = post.images[index];
  });

  const submitBtn = agentPostForm.querySelector("button[type='submit']");
  if (submitBtn) {
    submitBtn.textContent = "Cập nhật bài đăng & gửi duyệt";
  }

  updateAgentPostPreview();
}

agentPostForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const formData = Object.fromEntries(new FormData(agentPostForm).entries());
  const images = ["image", "image2", "image3"]
    .map((key) => String(formData[key] || "").trim())
    .filter(Boolean);
  formData.image = images[0] || "";
  delete formData.image2;
  delete formData.image3;
  const params = new URLSearchParams(window.location.search);
  const editId = params.get("edit");

  let post;
  if (editId) {
    const posts = window.HomeFitAgentPosts.getAll();
    const existing = posts.find((p) => p.id === editId || p.code === editId);
    if (existing) {
      post = {
        ...existing,
        ...formData,
        transactionType: formData.transaction,
        brokerMeta: formData.contact,
        images: images.length ? images : existing.images || [],
        status: "pending",
        updatedAt: new Date().toLocaleDateString("vi-VN"),
      };
      // Xóa bài cũ rồi lưu bài đã cập nhật
      window.HomeFitAgentPosts.delete(existing.id);
    }
  }

  if (!post) {
    post = {
      ...formData,
      id: `post-${Date.now()}`,
      transactionType: formData.transaction,
      brokerMeta: formData.contact,
      images,
      status: "pending",
      createdAt: new Date().toISOString(),
    };
  }

  if (!window.HomeFitAgentPosts.save(post)) {
    agentPostMessage.textContent = "Không thể lưu bài đăng. Vui lòng thử lại.";
    agentPostMessage.hidden = false;
    return;
  }

  agentPostMessage.textContent =
    "Đã gửi bài đăng. Tin đang chờ kiểm duyệt và sẽ xuất hiện khi được chấp nhận.";
  agentPostMessage.hidden = false;
  agentPostForm.reset();
  if (editId) {
    history.replaceState(null, "", window.location.pathname);
    const submitBtn = agentPostForm.querySelector("button[type='submit']");
    if (submitBtn) submitBtn.textContent = "Gửi bài đăng để duyệt";
  }
  updateAgentPostPreview();
  renderAgentPostStatuses();
});

window.addEventListener("homefit:agent-posts-change", renderAgentPostStatuses);
window.addEventListener("storage", (event) => {
  if (event.key === "homefit-agent-posts") renderAgentPostStatuses();
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
    // Chưa đăng nhập
  }

  if (brokerNameEl) brokerNameEl.textContent = userName;
  if (metaSepEl) metaSepEl.style.display = userName ? "inline" : "none";
}

renderAgentPostStatuses();
updateAgentPostPreview();
loadPostForEditing();
updateUserInfo();
