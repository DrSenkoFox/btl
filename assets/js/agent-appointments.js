/* ==========================================================================
   HomeFit AI - Trang lịch hẹn của môi giới
   ========================================================================== */
const apptDayNames = ["T2", "T3", "T4", "T5", "T6"];
const apptMonthNames = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

document.addEventListener("DOMContentLoaded", () => {
  ensureAppointmentDemo();

  const broker = localStorage.getItem("homefit-agent-name") || "Lan Hương";
  document.getElementById("agent-broker-name").textContent = broker;
  document.getElementById("appt-broker-name").textContent = broker.toUpperCase();

  const weekBox = document.getElementById("appt-week");
  const monthBox = document.getElementById("appt-month");
  const tbody = document.getElementById("appt-tbody");
  const panel = document.getElementById("appt-panel");
  const nextBox = document.getElementById("appt-next");

  let view = "week";
  let anchor = mondayOf(new Date());
  let selectedId = null;
  let mode = null;
  let flashMsg = "";

  const byStart = (a, b) => new Date(a.start) - new Date(b.start);
  const houseText = (a) =>
    [a.houseCode, a.houseName].filter(Boolean).join(" + ") || "Chưa gắn căn nhà";
  const isOpen = (a) => a.status === "pending" || a.status === "confirmed";

  function isSameDay(iso, date) {
    const d = new Date(iso);
    return (
      d.getFullYear() === date.getFullYear() &&
      d.getMonth() === date.getMonth() &&
      d.getDate() === date.getDate()
    );
  }

  function onDay(list, date) {
    return list.filter((a) => isSameDay(a.start, date)).sort(byStart);
  }

  /* Mở đúng kỳ có lịch sắp tới gần nhất */
  const nextAppt = getAppointments()
    .filter((a) => isOpen(a) && new Date(a.end) >= new Date())
    .sort(byStart)[0];
  const nextDate = () => (nextAppt ? new Date(nextAppt.start) : new Date());
  if (nextAppt) anchor = mondayOf(nextDate());

  /* ---------- Khối 1 ---------- */
  function renderHeader(list) {
    const last =
      view === "week"
        ? shiftDays(anchor, 6)
        : new Date(anchor.getFullYear(), anchor.getMonth() + 1, 0);
    const label =
      view === "week"
        ? `${pad2(anchor.getDate())}–${apptDay(last)}/${last.getFullYear()}`
        : `${pad2(anchor.getMonth() + 1)}/${anchor.getFullYear()}`;

    document.getElementById("appt-range-label").textContent = label;
    document.getElementById("nav-prev-text").textContent =
      view === "week" ? "Tuần trước" : "Tháng trước";
    document.getElementById("nav-next-text").textContent =
      view === "week" ? "Tuần sau" : "Tháng sau";
    document.getElementById("appt-desc").textContent =
      `${view === "week" ? "Tuần" : "Tháng"} ${label} • ${list.length} lịch hẹn sau bước tiếp nhận khách`;

    const next = list
      .filter((a) => isOpen(a) && new Date(a.end) >= new Date())
      .sort(byStart)[0];
    nextBox.hidden = !next;
    if (next) {
      document.getElementById("appt-next-title").textContent =
        `Lịch sắp tới: ${next.clientName} • ${next.houseName || next.houseCode}`;
      document.getElementById("appt-next-desc").textContent =
        `${apptDay(next.start)}, ${apptTime(next.start)}–${apptTime(next.end)} • ${next.id}: ${next.reason || "Chưa ghi lý do chọn lịch."}`;
    }
  }

  /* ---------- Khối 2: chỉ để xem ---------- */
  function slotCard(a) {
    return `
      <article class="appt-slot appt-slot--${a.status}">
        <p class="appt-slot-time">${apptTime(a.start)}–${apptTime(a.end)}</p>
        <p class="appt-slot-title">${escHtml(a.clientName)} • ${escHtml(a.id)}</p>
        <p class="appt-slot-sub">${escHtml(houseText(a))}</p>
        <p class="appt-slot-state">● ${apptStatusLabels[a.status]}</p>
      </article>`;
  }

  function renderWeek(list) {
    weekBox.innerHTML = apptDayNames
      .map((name, index) => {
        const day = shiftDays(anchor, index);
        const items = onDay(list, day);
        const bucket = (from, to) =>
          items
            .filter((a) => {
              const hour = new Date(a.start).getHours();
              return hour >= from && hour < to;
            })
            .map(slotCard)
            .join("");
        const body = items.length
          ? `<p class="appt-hour">08:00</p>${bucket(8, 12)}<p class="appt-hour">12:00</p>${bucket(12, 16)}<p class="appt-hour">16:00</p>${bucket(16, 24)}`
          : `<p class="appt-hour">08:00</p><p class="appt-free">Chưa có lịch</p><p class="appt-hour">12:00</p><p class="appt-hour">16:00</p>`;
        return `<article class="appt-day${isSameDay(new Date().toISOString(), day) ? " is-today" : ""}">
          <p class="appt-day-name">${name} · ${apptDay(day)}</p>${body}
        </article>`;
      })
      .join("");
  }

  function renderMonth(list) {
    const start = mondayOf(anchor);
    const cells = Math.ceil((new Date(anchor.getFullYear(), anchor.getMonth() + 1, 0).getDate() + (start.getDay() + 6) % 7) / 7) * 7;
    let html = apptMonthNames
      .map((name) => `<p class="appt-month-head">${name}</p>`)
      .join("");
    for (let i = 0; i < cells; i += 1) {
      const day = shiftDays(start, i);
      if (day.getMonth() !== anchor.getMonth()) {
        html += `<div class="appt-month-cell is-out"></div>`;
        continue;
      }
      const chips = onDay(list, day)
        .map(
          (a) =>
            `<p class="appt-month-chip appt-month-chip--${a.status}">${apptTime(a.start)} ${escHtml(a.clientName)}</p>`,
        )
        .join("");
      html += `<div class="appt-month-cell"><p class="appt-month-day">${pad2(day.getDate())}</p>${chips}</div>`;
    }
    monthBox.innerHTML = html;
  }

  /* ---------- Khối 3 ---------- */
  function rowAction(act, text, cls = "") {
    return `<button type="button" class="appt-act${cls}" data-act="${act}">${text}</button>`;
  }

  function renderList(list) {
    const rows = [
      ...list.filter(isOpen).sort(byStart),
      ...list.filter((a) => !isOpen(a)).sort((a, b) => new Date(b.start) - new Date(a.start)),
    ];

    tbody.innerHTML = rows.length
      ? rows
          .map((a) => {
            const actions = {
              pending: [rowAction("remind", "Nhắc"), rowAction("edit", "Sửa")],
              confirmed: [rowAction("edit", "Sửa"), rowAction("cancel", "Hủy")],
              completed: [rowAction("note", "Xem ghi chú"), rowAction("remove", "Xóa", " appt-act--danger")],
              cancelled: [rowAction("reason", "Xem lý do"), rowAction("remove", "Xóa", " appt-act--danger")],
            }[a.status]?.join('<span class="action-sep">·</span>') || "";
            return `
            <tr data-appt-id="${a.id}"${a.id === selectedId ? ' class="is-selected"' : ""}>
              <td><strong>${escHtml(a.id)} • ${escHtml(a.clientName)}</strong>
                <p class="appt-cell-sub">${escHtml(houseText(a))} + ${escHtml(a.broker)}</p>
              </td>
              <td>${apptDay(a.start)} • ${apptTime(a.start)}</td>
              <td><span class="appt-badge appt-badge--${a.status}">${apptStatusLabels[a.status]}</span></td>
              <td>${actions}</td>
            </tr>`;
          })
          .join("")
      : `<tr class="empty-row"><td colspan="4">Chưa có lịch hẹn nào.</td></tr>`;
  }

  function panelField(label, input) {
    return `<label class="appt-field"><span>${label}</span>${input}</label>`;
  }

  function renderPanel(list) {
    const appt = list.find((a) => a.id === selectedId);
    const flash = flashMsg ? `<p class="appt-flash">${escHtml(flashMsg)}</p>` : "";
    flashMsg = "";

    if (!appt) {
      panel.innerHTML = `${flash}<p class="appt-panel-empty">Chọn một lịch hẹn để xem chi tiết.</p>`;
      return;
    }

    if (mode === "note" || mode === "reason") {
      const label = mode === "note" ? "Ghi chú" : "Lý do hủy";
      const value = mode === "note" ? appt.note || "Chưa có ghi chú." : appt.cancelReason || "Chưa có lý do.";
      panel.innerHTML = `${flash}<h2 class="appt-panel-title">Chi tiết ${escHtml(appt.id)}</h2>
        <p class="appt-panel-sub">${escHtml(appt.clientName)} • ${escHtml(houseText(appt))} • ${apptRange(appt.start)}</p>
        ${panelField(label, `<textarea readonly>${escHtml(value)}</textarea>`)}`;
      return;
    }

    const cancelling = mode === "cancel";
    panel.innerHTML = `${flash}
      <h2 class="appt-panel-title">${cancelling ? "Hủy" : "Sửa"} lịch ${escHtml(appt.id)}</h2>
      ${panelField("Khách / căn nhà", `<input type="text" value="${escHtml(`${appt.clientName} • ${houseText(appt)}`)}" readonly />`)}
      ${panelField("Ngày / giờ mới", `<input type="datetime-local" id="edit-start" value="${escHtml(appt.start)}" />`)}
      ${panelField("Người phụ trách", `<input type="text" id="edit-broker" value="${escHtml(appt.broker)}" />`)}
      ${panelField(cancelling ? "Lý do hủy lịch" : "Lý do sửa lịch", `<textarea id="edit-reason" placeholder="Ghi rõ để khách nắm thông tin...">${escHtml(cancelling ? appt.cancelReason || "" : appt.editReason || "")}</textarea>`)}
      <button type="button" class="btn-save" data-act="${cancelling ? "confirm-cancel" : "save"}">
        ${cancelling ? "Xác nhận hủy" : "Lưu thay đổi"}
      </button>
      <div class="detail-actions">
        <button type="button" class="btn-reject" data-act="complete">Hoàn tất</button>
        <button type="button" class="btn-cancel-schedule" data-act="cancel-open">Hủy lịch</button>
      </div>
      <p class="appt-panel-hint">Lưu thay đổi sẽ gửi lại thông báo để khách xác nhận.</p>`;
  }

  /* ---------- Tổng ---------- */
  function render() {
    const list = getAppointments();
    document.getElementById("agent-broker-notif").textContent =
      `Thông báo (${list.filter((a) => a.status === "pending").length})`;
    renderHeader(list);
    weekBox.hidden = view !== "week";
    monthBox.hidden = view !== "month";
    if (view === "week") renderWeek(list);
    else renderMonth(list);
    renderList(list);
    renderPanel(list);
  }

  /* ---------- Tương tác ---------- */
  document.querySelectorAll(".view-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".view-btn").forEach((b) => b.classList.remove("is-active"));
      btn.classList.add("is-active");
      view = btn.dataset.view;
      anchor = view === "week" ? mondayOf(nextDate()) : nextDate();
      render();
    });
  });

  document.querySelectorAll(".appt-nav-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const shift = Number(btn.dataset.shift);
      anchor =
        view === "week"
          ? shiftDays(anchor, shift * 7)
          : new Date(anchor.getFullYear(), anchor.getMonth() + shift, 1);
      render();
    });
  });

  tbody.addEventListener("click", (e) => {
    const row = e.target.closest("tr[data-appt-id]");
    if (!row) return;
    const appt = getAppointments().find((a) => a.id === row.dataset.apptId);
    if (!appt) return;
    const action = e.target.closest("[data-act]")?.dataset.act;

    if (action === "remind") {
      notifySeeker(appt);
      selectedId = appt.id;
      flashMsg = `Đã nhắc ${appt.clientName} xác nhận lịch ${appt.id}.`;
      render();
      return;
    }
    if (action === "remove") {
      saveAppointments(getAppointments().filter((a) => a.id !== appt.id));
      if (selectedId === appt.id) {
        selectedId = null;
        mode = null;
      }
      render();
      return;
    }
    selectedId = appt.id;
    mode =
      { edit: "edit", cancel: "cancel", note: "note", reason: "reason" }[action] ||
      (isOpen(appt) ? "edit" : appt.status === "cancelled" ? "reason" : "note");
    render();
  });

  panel.addEventListener("click", (e) => {
    const action = e.target.closest("[data-act]")?.dataset.act;
    if (!action) return;
    const appt = getAppointments().find((a) => a.id === selectedId);
    if (!appt) return;

    if (action === "save") {
      const start = document.getElementById("edit-start").value;
      if (!start) {
        alert("Cần chọn ngày và giờ cho lịch hẹn.");
        return;
      }
      const time = apptTime(start);
      appt.start = start;
      appt.end = toLocalISO(new Date(start), plusHour(time));
      appt.broker = document.getElementById("edit-broker").value.trim() || appt.broker;
      appt.editReason = document.getElementById("edit-reason").value.trim();
      appt.status = new Date(appt.end) < new Date() ? "completed" : "pending";
      saveAppointment(appt);
      notifySeeker(appt);
      flashMsg = `Đã cập nhật ${appt.id}, chờ khách xác nhận.`;
    } else if (action === "complete") {
      appt.status = "completed";
      saveAppointment(appt);
    } else if (action === "cancel-open") {
      mode = "cancel";
    } else if (action === "confirm-cancel") {
      appt.status = "cancelled";
      appt.cancelReason =
        document.getElementById("edit-reason").value.trim() || "Môi giới đã hủy lịch hẹn.";
      saveAppointment(appt);
      notifySeeker(appt);
      mode = "reason";
    }
    render();
  });

  window.addEventListener("storage", (e) => {
    if (e.key === apptStorageKey) render();
  });

  render();
});
