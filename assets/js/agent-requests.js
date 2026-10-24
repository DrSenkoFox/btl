/* ==========================================================================
   HomeFit AI - Agent Requests Controller
   Quản lý yêu cầu khách hàng (CRM / Brief & Lead)
   ========================================================================== */
const reqStorageKey = "homefit-agent-requests";
const brokerStorageKey = "homefit-agent-name";
const defaultBrokerName = "Lan Hương";

const reqStatusLabels = {
  new: "Mới",
  consulting: "Đang tư vấn",
  scheduled: "Đã đặt lịch",
  completed: "Hoàn tất",
  rejected: "Từ chối",
  archived: "Đã lưu trữ",
};

/* Dữ liệu minh hoạ theo thiết kế */
const demoRequests = [
  {
    id: "L-024",
    leadCode: "L-024",
    briefCode: "B-024",
    clientName: "Minh Anh",
    familyInfo: "Gia đình 3 người",
    source: "B-024 / HF-101",
    sourcePostId: "HF-101",
    status: "new",
    email: "minhanh@example.com",
    phone: "090 0024 0024",
    brokerName: defaultBrokerName,
    consent: true,
    createdAt: "2026-10-03T08:30:00",
    updatedAt: "2026-10-03T08:30:00",
    briefSummary:
      "Ngân sách 16-20 triệu/tháng, Thảo Điền / An Phú. Ưu tiên yên tĩnh 40%, gần trường 35%, WFH 25%.",
    note: "Khách muốn xem gốc WFH và mức tiếng ồn. Dự kiến 05/10, 09:00 tại River Park.",
    history: [
      "03/10 • 08:30 — Minh Anh gửi B-024",
      "03/10 • 08:30 — Hệ thống gắn nguồn HF-101",
    ],
    brief: {
      "transaction-type": "rent",
      title: "Gia đình Minh Anh",
      "budget-min": "16000000",
      "budget-max": "20000000",
      "preferred-area": "Thảo Điền / An Phú, TP Thủ Đức",
      "move-in-date": "2026-11-01",
      "household-size": "3",
      "size-and-bedrooms": "2 phòng ngủ, 60-75 m²",
      lifestyle:
        "Ngân sách 16-20 triệu/tháng, Thảo Điền / An Phú. Ưu tiên yên tĩnh 40%, gần trường 35%, WFH 25%.",
    },
  },
  {
    id: "L-021",
    leadCode: "L-021",
    clientName: "Hoàng Nam",
    familyInfo: "Nhân viên văn phòng",
    source: "HF-102 / Liên hệ",
    sourcePostId: "HF-102",
    status: "scheduled",
    appointmentCode: "A-032",
    email: "hoangnam@example.com",
    phone: "090 0021 0021",
    brokerName: defaultBrokerName,
    consent: true,
    createdAt: "2026-10-01T09:15:00",
    updatedAt: "2026-10-02T16:00:00",
    briefSummary: "Căn 1 phòng ngủ gần quận 1, ngân sách 8-10 triệu/tháng.",
    note: "Đã xác nhận xem nhà sáng thứ bảy.",
    history: [
      "01/10 • 09:15 — Hoàng Nam liên hệ từ HF-102",
      "02/10 • 14:05 — Tiếp nhận yêu cầu.",
      "02/10 • 16:00 — Đã tạo lịch hẹn A-032",
    ],
  },
  {
    id: "L-020",
    leadCode: "L-020",
    clientName: "Thu Hà",
    familyInfo: "Gia đình 2 người",
    source: "HF-103 / Liên hệ",
    sourcePostId: "HF-103",
    status: "consulting",
    email: "thuha@example.com",
    phone: "090 0020 0020",
    brokerName: defaultBrokerName,
    consent: true,
    createdAt: "2026-10-01T08:40:00",
    updatedAt: "2026-10-02T14:20:00",
    briefSummary: "Căn 2 phòng ngủ có ban công, ngân sách 12-14 triệu/tháng.",
    note: "Đang hỏi thêm về phí quản lý.",
    history: ["02/10 • 14:20 — Tiếp nhận yêu cầu."],
  },
  {
    id: "L-019",
    leadCode: "L-019",
    briefCode: "B-019",
    clientName: "Đức Long",
    familyInfo: "Cặp vợ chồng trẻ",
    source: "B-019 / HF-101",
    sourcePostId: "HF-101",
    status: "new",
    email: "duclong@example.com",
    phone: "090 0019 0019",
    brokerName: defaultBrokerName,
    consent: true,
    createdAt: "2026-10-02T11:45:00",
    updatedAt: "2026-10-02T11:45:00",
    briefSummary: "Ngân sách 9-12 triệu/tháng, Bình Thạnh. Ưu tiên gần metro.",
    note: "",
    history: ["02/10 • 11:45 — Đức Long gửi B-019"],
    brief: {
      "transaction-type": "rent",
      title: "Vợ chồng Đức Long",
      "budget-min": "9000000",
      "budget-max": "12000000",
      "preferred-area": "Bình Thạnh",
      "move-in-date": "2026-10-20",
      "household-size": "2",
      "size-and-bedrooms": "1 phòng ngủ, 45-55 m²",
      lifestyle: "Ngân sách 9-12 triệu/tháng, Bình Thạnh. Ưu tiên gần metro.",
    },
  },
  {
    id: "L-018",
    leadCode: "L-018",
    clientName: "Mai Chi",
    familyInfo: "Ở một mình",
    source: "Thủ công",
    status: "completed",
    email: "maichi@example.com",
    phone: "090 0018 0018",
    brokerName: defaultBrokerName,
    consent: true,
    createdAt: "2026-09-28T10:00:00",
    updatedAt: "2026-10-01T10:00:00",
    briefSummary: "Đã ký hợp đồng căn studio tại An Phú.",
    note: "Khách hài lòng, hẹn bảo trì sau 30 ngày.",
    history: [
      "28/09 • 10:00 — Mai Chi liên hệ",
      "01/10 • 10:00 — Hoàn tất ký hợp đồng.",
    ],
  },
  {
    id: "L-017",
    leadCode: "L-017",
    briefCode: "B-017",
    clientName: "Thanh Tâm",
    familyInfo: "Gia đình 4 người",
    source: "B-017",
    status: "rejected",
    email: "thanhtam@example.com",
    phone: "090 0017 0017",
    brokerName: defaultBrokerName,
    consent: true,
    createdAt: "2026-09-30T09:00:00",
    updatedAt: "2026-10-01T09:00:00",
    briefSummary: "Cần 3 phòng ngủ dưới 10 triệu/tháng tại Thủ Đức.",
    note: "",
    rejectReason:
      "Chưa có căn 3 phòng ngủ dưới 10 triệu trong khu vực yêu cầu.",
    history: ["01/10 • 09:00 — Từ chối yêu cầu."],
  },
];

/* ---------- Dữ liệu ---------- */
function getRequests() {
  try {
    const raw = localStorage.getItem(reqStorageKey);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr.filter((r) => r && r.id) : [];
  } catch {
    return [];
  }
}

function saveRequests(arr) {
  localStorage.setItem(reqStorageKey, JSON.stringify(arr));
  window.dispatchEvent(new CustomEvent("homefit:agent-requests-change"));
  renderRequests();
}

function addHistory(req, text) {
  req.history = req.history || [];
  req.history.push(`${fmtNow()} — ${text}`);
}

function updateRequestStatus(id, status) {
  const reqs = getRequests();
  const req = reqs.find((r) => r.id === id);
  if (!req) return;
  req.status = status;
  req.updatedAt = new Date().toISOString();
  if (status === "consulting") addHistory(req, "Tiếp nhận yêu cầu.");
  if (status === "rejected") addHistory(req, "Từ chối yêu cầu.");
  saveRequests(reqs);
}

function createSchedule(id) {
  const reqs = getRequests();
  const req = reqs.find((r) => r.id === id);
  if (!req) return;
  const date = document.getElementById("appt-date").value;
  const time = document.getElementById("appt-time").value;
  if (!date || !time) {
    alert("Cần chọn ngày và giờ xem nhà.");
    return;
  }
  const appt = createAppointment({
    leadId: req.id,
    clientName: req.clientName,
    houseCode: req.sourcePostId || "",
    houseName: "",
    start: `${date}T${time}`,
    end: `${date}T${plusHour(time)}`,
    broker:
      document.getElementById("appt-broker").value.trim() || defaultBrokerName,
    reason: document.getElementById("appt-reason").value.trim(),
    brokerReason: document.getElementById("appt-broker-reason").value.trim(),
  });
  req.appointmentCode = appt.id;
  req.status = "scheduled";
  req.updatedAt = new Date().toISOString();
  addHistory(req, `Đã tạo lịch hẹn ${appt.id} • ${apptRange(appt.start)}`);
  scheduling = false;
  saveRequests(reqs);
}

function cancelSchedule(id) {
  const reqs = getRequests();
  const req = reqs.find((r) => r.id === id);
  if (!req) return;
  const appt = getAppointments().find((a) => a.id === req.appointmentCode);
  if (appt) {
    appt.status = "cancelled";
    appt.cancelReason = "Môi giới hủy lịch hẹn.";
    saveAppointment(appt);
  }
  req.appointmentCode = "";
  req.status = "consulting";
  req.updatedAt = new Date().toISOString();
  addHistory(req, "Đã hủy lịch hẹn.");
  saveRequests(reqs);
}

function saveRequestNote(id, note) {
  const reqs = getRequests();
  const req = reqs.find((r) => r.id === id);
  if (!req) return;
  req.note = note;
  saveRequests(reqs);
}

function fmtNow() {
  return fmtDate(new Date().toISOString());
}

function fmtDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, "0");
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)} • ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function esc(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/* ---------- Trang ---------- */
let currentTab = "new";
let searchKw = "";
let selectedId = null;
let scheduling = false;

function renderRequests() {
  const tbody = document.getElementById("req-tbody");
  if (!tbody) return;
  const allReqs = getRequests();
  const counts = { new: 0, consulting: 0, scheduled: 0, completed: 0 };
  allReqs.forEach((r) => {
    if (counts[r.status] !== undefined) counts[r.status]++;
  });
  Object.keys(counts).forEach((status) => {
    const el = document.getElementById(`count-${status}`);
    if (el) el.textContent = counts[status];
  });
  const notif = document.getElementById("agent-broker-notif");
  if (notif) notif.textContent = `Thông báo (${counts.new})`;

  const filtered = allReqs.filter((r) => {
    if (r.status !== currentTab) return false;
    if (!searchKw) return true;
    const haystack = `${r.clientName} ${r.leadCode} ${r.source} ${r.briefCode || ""} ${r.phone || ""}`;
    return haystack.toLowerCase().includes(searchKw.toLowerCase());
  });

  const footerInfo = document.getElementById("req-table-footer");
  if (footerInfo) {
    footerInfo.textContent = `Hiển thị ${filtered.length} / ${allReqs.length} khách • Trạng thái trước từng yêu cầu, không đánh giá con người.`;
  }

  tbody.innerHTML = filtered.length
    ? filtered
        .map(
          (r) => `
        <tr data-req-id="${r.id}"${r.id === selectedId ? ' class="is-selected"' : ""}>
          <td><strong>${esc(r.clientName)} • ${esc(r.leadCode)}</strong></td>
          <td>${esc(r.source)}</td>
          <td><span class="req-badge req-badge--${r.status}">${reqStatusLabels[r.status] || r.status}</span></td>
          <td>${fmtDate(r.updatedAt)}</td>
        </tr>`,
        )
        .join("")
    : `<tr class="empty-row"><td colspan="4">Chưa có yêu cầu nào từ người tìm nhà.</td></tr>`;

  renderHighlight(allReqs);
  const selected = allReqs.find((r) => r.id === selectedId);
  if (selected) renderDetail(selected);
}

function renderDetail(req) {
  const content = document.getElementById("req-detail-content");
  document.getElementById("req-detail-empty").hidden = true;
  content.hidden = false;
  content.classList.toggle("is-rejected", req.status === "rejected");

  document.getElementById("detail-name").textContent =
    `${req.clientName} • ${req.leadCode}`;
  const badge = document.getElementById("detail-badge");
  badge.className = `detail-badge detail-badge--${req.status}`;
  badge.textContent = reqStatusLabels[req.status] || req.status;
  document.getElementById("detail-consent").textContent = req.consent
    ? "Đã đồng ý chia sẻ liên hệ"
    : "";

  document.getElementById("detail-info").innerHTML = `
    <li><span>Email:</span> ${esc(req.email || "—")}</li>
    <li><span>Điện thoại mẫu:</span> ${esc(req.phone || "—")}</li>
    <li><span>Môi giới phụ trách:</span> ${esc(req.brokerName || defaultBrokerName)}</li>
  `;

  document.getElementById("detail-status-value").textContent =
    req.status === "scheduled"
      ? `${reqStatusLabels.scheduled} • ${req.appointmentCode}`
      : reqStatusLabels[req.status] || req.status;

  const isNew = req.status === "new";
  document.getElementById("reject-reason-box").hidden = !isNew;
  document.getElementById("detail-actions").innerHTML = isNew
    ? `<button type="button" class="btn-accept" data-action="accept" data-id="${req.id}">Tiếp nhận yêu cầu</button>
       <button type="button" class="btn-reject" data-action="reject" data-id="${req.id}">Từ chối</button>`
    : "";

  const appointment = document.getElementById("detail-appointment");
  appointment.innerHTML =
    req.status === "consulting"
      ? scheduling
        ? scheduleForm(req)
        : `<button type="button" class="btn-schedule" data-action="open-schedule">Đặt lịch hẹn</button>`
      : req.status === "scheduled"
        ? `<button type="button" class="btn-cancel-schedule" data-action="cancel-schedule" data-id="${req.id}">Hủy lịch</button>
           <a class="btn-appt-link" href="agent-appointments.html">Xem lịch ${esc(req.appointmentCode)}</a>`
        : "";

  document.getElementById("detail-note").value = req.note || "";
  document.getElementById("reject-reason").value = req.rejectReason || "";

  const historyBox = document.getElementById("detail-history-box");
  const history = req.history || [];
  historyBox.hidden = req.status === "rejected";
  document.getElementById("detail-history-empty").hidden = history.length > 0;
  document.getElementById("detail-history").innerHTML = history
    .map((h) => `<li>${esc(h)}</li>`)
    .join("");
}

function scheduleForm(req) {
  const field = (label, input) =>
    `<label class="appt-field"><span>${label}</span>${input}</label>`;
  return `
    <fieldset class="appt-form">
      <p class="detail-box-label">Tạo lịch hẹn ${nextApptCode()}</p>
      ${field("Ngày xem nhà", '<input type="date" id="appt-date" />')}
      ${field("Giờ bắt đầu", '<input type="time" id="appt-time" value="09:00" />')}
      ${field("Lý do chọn lịch", '<textarea id="appt-reason" placeholder="Vì sao đề xuất căn và khung giờ này..."></textarea>')}
      ${field("Người phụ trách", `<input type="text" id="appt-broker" value="${esc(req.brokerName || defaultBrokerName)}" />`)}
      ${field("Giải thích chọn người phụ trách", '<textarea id="appt-broker-reason" placeholder="Người này hiểu khu vực và đã làm việc với chủ nhà..."></textarea>')}
      <menu class="detail-actions">
        <button type="button" class="btn-accept" data-action="create-schedule" data-id="${req.id}">Hoàn tất</button>
        <button type="button" class="btn-reject" data-action="close-schedule">Hủy bỏ</button>
      </menu>
    </fieldset>`;
}

function renderHighlight(reqs) {
  const card = document.getElementById("req-highlight");
  const tip = document.getElementById("req-tip");
  const first = reqs.find((r) => r.status === "new");
  card.hidden = !first;
  tip.hidden = !first;
  if (!first) return;

  document.getElementById("highlight-client").textContent =
    `${first.clientName} • ${first.familyInfo || ""}`;
  document.getElementById("highlight-meta").textContent =
    `Brief ${first.briefCode || "—"} • Gửi ${fmtDate(first.createdAt)}`;
  document.getElementById("highlight-brief").textContent =
    first.briefSummary || "";
  document.getElementById("highlight-links").innerHTML = `
    ${first.briefCode ? `<a href="seeker-brief-form.html?view=1&briefId=${encodeURIComponent(first.id)}">Xem brief ${esc(first.briefCode)}</a>` : ""}
    ${first.sourcePostId ? `<a href="seeker-detail.html?id=${encodeURIComponent(first.sourcePostId)}">Xem nhà ${esc(first.sourcePostId)}</a>` : ""}
  `;
}

document.addEventListener("DOMContentLoaded", () => {
  if (!document.getElementById("req-tbody")) return;
  // Nạp bản demo mà không ghi đè yêu cầu thật người dùng đã gửi
  const storedReqs = getRequests();
  const missingDemo = demoRequests.filter(
    (demo) => !storedReqs.some((r) => r.id === demo.id),
  );
  if (missingDemo.length) saveRequests([...storedReqs, ...missingDemo]);
  ensureAppointmentDemo();

  const brokerName =
    localStorage.getItem(brokerStorageKey) || defaultBrokerName;
  document.getElementById("agent-broker-name").textContent = brokerName;
  document.getElementById("agent-meta-sep").style.display = "inline";

  document.getElementById("req-tbody").addEventListener("click", (e) => {
    const row = e.target.closest("tr[data-req-id]");
    if (!row) return;
    selectedId = row.dataset.reqId;
    scheduling = false;
    document.getElementById("reject-reason").value = "";
    renderRequests();
  });

  document.getElementById("req-detail").addEventListener("click", (e) => {
    const btn = e.target.closest("[data-action]");
    if (!btn) return;
    const { action, id } = btn.dataset;

    if (action === "accept") updateRequestStatus(id, "consulting");
    else if (action === "open-schedule") {
      scheduling = true;
      renderRequests();
    } else if (action === "close-schedule") {
      scheduling = false;
      renderRequests();
    } else if (action === "create-schedule") createSchedule(id);
    else if (action === "cancel-schedule") cancelSchedule(id);
    else if (action === "reject") {
      const reason = document.getElementById("reject-reason").value.trim();
      if (!reason) {
        alert("Vui lòng ghi lý do từ chối trước khi xác nhận.");
        document.getElementById("reject-reason").focus();
        return;
      }
      const reqs = getRequests();
      const req = reqs.find((r) => r.id === id);
      if (req) req.rejectReason = reason;
      saveRequests(reqs);
      updateRequestStatus(id, "rejected");
    }
  });

  document.getElementById("btn-save-note").addEventListener("click", () => {
    if (!selectedId) return;
    saveRequestNote(
      selectedId,
      document.getElementById("detail-note").value.trim(),
    );
    alert("Đã lưu ghi chú.");
  });

  document.querySelectorAll(".agent-tabs .tab-btn").forEach((tab) => {
    tab.addEventListener("click", () => {
      document
        .querySelectorAll(".agent-tabs .tab-btn")
        .forEach((b) => b.classList.remove("is-active"));
      tab.classList.add("is-active");
      currentTab = tab.dataset.status;
      renderRequests();
    });
  });

  document.getElementById("req-search").addEventListener("input", (e) => {
    searchKw = e.target.value.trim();
    renderRequests();
  });

  window.addEventListener("storage", (e) => {
    if (e.key === reqStorageKey) renderRequests();
  });

  renderRequests();
});
