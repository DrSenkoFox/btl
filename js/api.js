/* ==========================================================================
   HomeFit AI – Core Data Store & State API (js/api.js)
   Quản lý LocalStorage cho: Users, Session, Notifications, Posts, Leads
   ========================================================================== */

window.HomeFitAPI = (() => {
  const KEYS = {
    USERS: "hf_users_v3",
    SESSION: "hf_session_v3",
    NOTIFS: "hf_notifs_v3",
    POSTS: "hf_posts_v3",
    SAVED: "hf_saved_v3",
    BRIEF: "hf_brief_v3",
    LEADS: "hf_leads_v3",
  };

  /* [ROLE: ALL] Danh sách 4 tài khoản đại diện cho 4 vai trò */
  const defaultUsers = [
    {
      id: "U-024",
      code: "U-024",
      name: "Nguyễn Minh Anh",
      shortName: "Minh Anh",
      initials: "MA",
      email: "minhanh@example.com",
      password: "123456",
      phone: "090 000 0024",
      area: "TP. Thủ Đức, TP.HCM",
      role: "seeker",
      joined: "02/10/2026",
      sharePhoneConsent: true,
    },
    {
      id: "U-012",
      code: "U-012",
      name: "Nguyễn Lan Hương",
      shortName: "Lan Hương",
      initials: "LH",
      email: "lanhuong@example.com",
      password: "123456",
      phone: "0912345678",
      area: "Thảo Điền, TP. Thủ Đức",
      role: "agent",
      joined: "15/09/2026",
      sharePhoneConsent: true,
    },
    {
      id: "U-008",
      code: "U-008",
      name: "Quốc Tuấn",
      shortName: "Quốc Tuấn",
      initials: "QT",
      email: "quoctuan@example.com",
      password: "123456",
      phone: "0908889999",
      area: "Quận 1, TP.HCM",
      role: "moderator",
      joined: "10/09/2026",
      sharePhoneConsent: false,
    },
    {
      id: "U-001",
      code: "U-001",
      name: "Đức Khải",
      shortName: "Đức Khải",
      initials: "ĐK",
      email: "duckhai@example.com",
      password: "123456",
      phone: "0901112233",
      area: "Quận 3, TP.HCM",
      role: "admin",
      joined: "01/09/2026",
      sharePhoneConsent: false,
    },
  ];

  /* [ROLE: SHARED] 6 Thông báo chuẩn khớp 100% Hình 2 (3 chưa đọc, 3 đã đọc) */
  const defaultNotifications = [
    {
      id: "N-01",
      role: "seeker",
      roleLabel: "Người tìm nhà",
      group: "brief",
      icon: "bell",
      time: "03/10 · 08:30",
      title: "Brief B-024 đã gửi thành công",
      desc: "Lan Hương đã nhận yêu cầu của gia đình Minh Anh. Trạng thái: chờ môi giới tiếp nhận.",
      actionText: "Xem nhu cầu B-024",
      actionHref: "seeker-home-brief.html",
      unread: true,
    },
    {
      id: "N-02",
      role: "agent",
      roleLabel: "Môi giới",
      group: "lead",
      icon: "clip",
      time: "03/10 · 08:30",
      title: "Có yêu cầu mới từ Minh Anh",
      desc: "Lead L-024 được tạo từ B-024; nhà gợi ý River Park HF-101. Tiếp nhận hoặc từ chối có lý do.",
      actionText: "Mở yêu cầu L-024",
      actionHref: "agent-listing-management.html",
      unread: true,
    },
    {
      id: "N-03",
      role: "moderator",
      roleLabel: "Kiểm duyệt viên",
      group: "report",
      icon: "shield",
      time: "03/10 · 08:45",
      title: "Report R-018 cần xác minh",
      desc: "HF-207 có 2 report về ảnh. Đối chiếu bằng chứng và phản hồi người đăng trước khi quyết định.",
      actionText: "Mở trung tâm báo cáo",
      actionHref: "moderator-listing-review.html",
      unread: true,
    },
    {
      id: "N-04",
      role: "agent",
      roleLabel: "Môi giới",
      group: "post",
      icon: "clip",
      time: "02/10 · 09:15",
      title: "HF-104 cần bổ sung thông tin",
      desc: "Bổ sung quyền cho thuê, thêm ảnh WFH và tách phí quản lý. Hạn 06/10/2026.",
      actionText: "Chỉnh sửa HF-104",
      actionHref: "agent-listing-management.html",
      unread: false,
    },
    {
      id: "N-05",
      role: "seeker",
      roleLabel: "Người tìm nhà",
      group: "schedule",
      icon: "bell",
      time: "Trạng thái tiếp theo • Minh họa",
      title: "Lịch A-031 được xác nhận",
      desc: "River Park • 05/10, 09:00–10:00 • Lan Hương phụ trách. Ví dụ ở bước sau tiếp nhận B-024.",
      actionText: "Xem lịch A-031",
      actionHref: "seeker-detail.html?id=P-01",
      unread: false,
    },
    {
      id: "N-06",
      role: "admin",
      roleLabel: "Quản trị viên",
      group: "system",
      icon: "bell",
      time: "03/10 · 09:00",
      title: "24 bài quá hạn cập nhật",
      desc: "Các listing công khai chưa cập nhật >30 ngày. Mở chất lượng dữ liệu để phân công kiểm tra.",
      actionText: "Mở chất lượng dữ liệu",
      actionHref: "admin-user-management.html",
      unread: false,
    },
  ];

  /* [ROLE: SEEKER / AGENT / MODERATOR] Danh sách tin đăng BĐS */
  const defaultPosts = [
    ["P-01", "River Park căn góc, ban công hướng sông", "Quận 2, TP.HCM", "19 triệu / tháng", 88, 3, 2, "approved", "Nguyễn Lan Hương", 98, "Đã đối chiếu sổ hồng và thông số đo độ ồn thực tế đạt chuẩn.", "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1000&q=80"],
    ["P-02", "Lumi Studio gần metro, ánh sáng tự nhiên", "Quận 2, TP.HCM", "11 triệu / tháng", 38, 1, 1, "approved", "Trần Minh Quân", 92, "Cách metro 400 m, cửa sổ lớn lấy sáng tự nhiên.", "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1000&q=80"],
    ["P-03", "Garden House 2 phòng ngủ có sân vườn", "TP. Thủ Đức", "17 triệu / tháng", 95, 2, 2, "approved", "Lê Thảo Vy", 86, "Sân vườn riêng, pháp lý sổ hồng rõ ràng.", "https://images.unsplash.com/photo-1560185007-cde436f6a4d0?auto=format&fit=crop&w=1000&q=80"],
    ["P-04", "Sunrise 1PN full nội thất, vào ở ngay", "Bình Thạnh, TP.HCM", "12 triệu / tháng", 45, 1, 1, "approved", "Đỗ Hoài Nam", 90, "Full nội thất, hợp đồng linh hoạt, có gym và siêu thị.", "https://images.unsplash.com/photo-1600121848594-d8644e57abab?auto=format&fit=crop&w=1000&q=80"],
    ["P-05", "Masteris 3PN thoáng, gần trường học", "Quận 2, TP.HCM", "26 triệu / tháng", 120, 3, 2, "approved", "Nguyễn Lan Hương", 95, "Ba phòng ngủ, đối diện trường quốc tế, nội thất đầy đủ.", "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1000&q=80"],
    ["P-06", "Eco Green 2PN yên tĩnh, góc làm việc WFH", "Quận 7, TP.HCM", "15 triệu / tháng", 72, 2, 2, "approved", "Trịnh Mỹ Dung", 88, "Góc làm việc riêng tầng cao ít tiếng ồn, nhiều cây xanh.", "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&fit=crop&w=1000&q=80"],
    ["P-07", "Thảo Điền Villa 4PN có hồ bơi riêng", "TP. Thủ Đức", "45 triệu / tháng", 200, 4, 3, "pending", "Nguyễn Lan Hương", 89, "Đang chờ Kiểm duyệt viên xác minh giấy ủy quyền cho thuê.", "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1000&q=80"],
  ].map(([code, title, location, price, size, bedrooms, bathrooms, status, brokerName, fit, note, image]) => ({
    id: code,
    code,
    title,
    location,
    area: location.split(",")[0].trim(),
    price,
    transaction: "rent",
    size: `${size} m²`,
    bedrooms,
    bathrooms,
    description: `${title} • ${size} m², ${bedrooms}PN. ${note}`,
    legal: "Sổ hồng riêng • Đã xác minh",
    amenities: "Yên tĩnh, gần trường học, góc làm việc WFH, ánh sáng tự nhiên",
    brokerName,
    fitScore: `${fit}%`,
    moderationNote: note,
    status,
    image,
  }));

  function read(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  }

  function write(key, val) {
    localStorage.setItem(key, JSON.stringify(val));
  }

  function init() {
    if (!localStorage.getItem(KEYS.USERS)) write(KEYS.USERS, defaultUsers);
    /* Mặc định đăng nhập sẵn Minh Anh (U-024) để hiển thị đúng Hình 1 */
    if (!localStorage.getItem(KEYS.SESSION)) write(KEYS.SESSION, defaultUsers[0]);
    if (!localStorage.getItem(KEYS.NOTIFS)) write(KEYS.NOTIFS, defaultNotifications);
    if (!localStorage.getItem(KEYS.POSTS)) write(KEYS.POSTS, defaultPosts);
    if (!localStorage.getItem(KEYS.SAVED)) write(KEYS.SAVED, defaultPosts.slice(0, 2));
    if (!localStorage.getItem(KEYS.BRIEF)) {
      write(KEYS.BRIEF, {
        code: "B-024",
        title: "Gia đình Minh Anh",
        priorities: "Yên tĩnh 40% / Trường 35% / WFH 25%",
        brokerName: "Nguyễn Lan Hương",
        lifestyle: "Gia đình 3 người cần nhà yên tĩnh, gần trường và có góc làm việc WFH.",
      });
    }
  }

  init();

  return {
    getUsers: () => read(KEYS.USERS, defaultUsers),
    saveUsers: (list) => write(KEYS.USERS, list),
    getSession: () => read(KEYS.SESSION, defaultUsers[0]),
    setSession: (user) => write(KEYS.SESSION, user),
    getNotifs: () => read(KEYS.NOTIFS, defaultNotifications),
    saveNotifs: (list) => write(KEYS.NOTIFS, list),
    getPosts: () => read(KEYS.POSTS, defaultPosts),
    savePosts: (list) => write(KEYS.POSTS, list),
    getSaved: () => read(KEYS.SAVED, []),
    saveSaved: (list) => write(KEYS.SAVED, list),
    getBrief: () => read(KEYS.BRIEF, {}),
    saveBrief: (b) => write(KEYS.BRIEF, b),
  };
})();