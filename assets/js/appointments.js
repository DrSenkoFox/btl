const apptStorageKey = "homefit-appointments";
const apptStatusLabels = {
  pending: "Chờ khách",
  confirmed: "Đã xác nhận",
  completed: "Hoàn tất",
  cancelled: "Đã hủy",
};
function pad2(n) {
  return String(n).padStart(2, "0");
}
function apptTime(iso) {
  const d = new Date(iso);
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}
function apptDay(iso) {
  const d = new Date(iso);
  return `${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}`;
}
function apptRange(iso) {
  return `${apptDay(iso)} • ${apptTime(iso)}`;
}
function escHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
function mondayOf(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return d;
}
function shiftDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}
function toLocalISO(date, time) {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}T${time || "09:00"}`;
}
function plusHour(time) {
  return `${pad2(Math.min(Number(time.slice(0, 2)) + 1, 23))}:00`;
}
function getAppointments() {
  try {
    const arr = JSON.parse(localStorage.getItem(apptStorageKey) || "[]");
    return Array.isArray(arr) ? arr.filter((a) => a && a.id) : [];
  } catch {
    return [];
  }
}
function saveAppointments(list) {
  localStorage.setItem(apptStorageKey, JSON.stringify(list));
}
function nextApptCode(list = getAppointments()) {
  const highest = list.reduce(
    (max, a) => Math.max(max, Number(String(a.id).slice(2)) || 0),
    33,
  );
  return `A-${String(highest + 1).padStart(3, "0")}`;
}
function saveAppointment(appt) {
  const list = getAppointments();
  const index = list.findIndex((a) => a.id === appt.id);
  appt.updatedAt = new Date().toISOString();
  if (index < 0) list.unshift(appt);
  else list[index] = appt;
  saveAppointments(list);
  return appt;
}
function createAppointment(data) {
  const appt = {
    ...data,
    id: data.id || nextApptCode(),
    status: new Date(data.end || data.start) < new Date() ? "completed" : "pending",
  };
  saveAppointment(appt);
  notifySeeker(appt);
  return appt;
}
function notifySeeker(appt) {
  console.info(
    `[HomeFit] Gửi thông báo lịch hẹn ${appt.id} tới ${appt.clientName}: ${apptRange(appt.start)}`,
  );
}
function demoMonday() {
  return shiftDays(mondayOf(new Date()), 7);
}
function demoAppointments() {
  const monday = demoMonday();
  const build = ([id, offset, time, clientName, houseName, houseCode, status, leadId, extra]) => ({
    id,
    leadId: leadId || "",
    clientName,
    houseName,
    houseCode,
    start: toLocalISO(shiftDays(monday, offset), time),
    end: toLocalISO(shiftDays(monday, offset), plusHour(time)),
    status,
    broker: "Lan Hương",
    reason: "",
    brokerReason: "",
    note: "",
    ...extra,
  });
  return [
    ["A-031", 0, "09:00", "Minh Anh", "River Park", "HF-101", "confirmed", "L-024", {
      reason: "Xác nhận với chủ nhà, chuẩn bị thông tin phí và kiểm tra gốc WFH.",
      brokerReason: "Môi giới phụ trách brief B-024 từ đầu.",
    }],
    ["A-032", 1, "14:00", "Hoàng Nam", "Lumi", "HF-102", "confirmed", "L-021", {
      reason: "Khách rảnh ngoài giờ hành chính.",
    }],
    ["A-033", 3, "10:00", "Thu Hà", "Garden", "HF-103", "pending", "L-020", {
      reason: "Xem ban công và phí quản lý.",
    }],
    ["A-029", -5, "09:00", "Mai Chi", "An Phú", "HF-103", "completed", "L-018", {
      note: "Khách hài lòng, hẹn bảo trì sau 30 ngày.",
    }],
    ["A-028", -6, "15:00", "Thanh Tâm", "Thủ Đức", "HF-102", "cancelled", "L-017", {
      cancelReason: "Khách đổi khu vực tìm nhà.",
    }],
  ].map(build);
}
function ensureAppointmentDemo() {
  if (localStorage.getItem(apptStorageKey) === null) {
    saveAppointments(demoAppointments());
  }
}