/* ==========================================================================
   HomeFit AI – Shared Data & Storage API (js/api.js)
   ========================================================================== */

window.HomeFitAPI = (() => {
  const KEYS = {
    POSTS: "homefit-agent-posts",
    SAVED: "homefit-saved-homes",
    BRIEF: "homefit-brief-draft",
    LEADS: "homefit-agent-requests",
    APPTS: "homefit-appointments",
    REPORTS: "homefit-property-reports",
    USERS: "homefit-users-db",
    SESSION: "homefit-current-session",
  };

  const defaultUsers = [
    {
      id: "U-001",
      name: "Đức Khải (bạn)",
      email: "duckhai@example.com",
      phone: "0901112233",
      role: "admin",
      perms: ["review", "ban", "taxonomy"],
    },
    {
      id: "U-012",
      name: "Nguyễn Lan Hương",
      email: "lanhuong@example.com",
      phone: "0912345678",
      role: "admin",
      perms: ["review", "ban", "taxonomy"],
    },
    {
      id: "U-008",
      name: "Quốc Tuấn",
      email: "quoctuan@example.com",
      phone: "0908889999",
      role: "moderator",
      perms: ["review", "ban"],
    },
    {
      id: "U-031",
      name: "Minh Quân",
      email: "minhquan@example.com",
      phone: "0903334444",
      role: "moderator",
      perms: ["review"],
    },
    {
      id: "U-015",
      name: "Trần Quốc Bảo",
      email: "quocbao@example.com",
      phone: "0905556677",
      role: "agent",
      perms: [],
    },
    {
      id: "U-024",
      name: "Gia đình Minh Anh",
      email: "minhanh@example.com",
      phone: "0900024002",
      role: "seeker",
      perms: [],
    },
  ];

  const defaultPosts = [
    ["P-01", "River Park căn góc, ban công hướng sông", "Quận 2, TP.HCM", "19 triệu / tháng", 88, 3, 2, "approved", "Trần Quốc Bảo", 98, "Đã đối chiếu sổ hồng và thông số đo độ ồn thực tế đạt chuẩn.", "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1000&q=80"],
    ["P-02", "Lumi Studio gần metro, ánh sáng tự nhiên", "Quận 2, TP.HCM", "11 triệu / tháng", 38, 1, 1, "approved", "Trần Minh Quân", 92, "Cách metro 400 m, cửa sổ lớn lấy sáng tự nhiên.", "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1000&q=80"],
    ["P-03", "Garden House 2 phòng ngủ có sân vườn", "TP. Thủ Đức", "17 triệu / tháng", 95, 2, 2, "approved", "Lê Thảo Vy", 86, "Sân vườn riêng, pháp lý sổ hồng rõ ràng.", "https://images.unsplash.com/photo-1560185007-cde436f6a4d0?auto=format&fit=crop&w=1000&q=80"],
    ["P-04", "The Horizon 3PN view công viên nội khu", "Quận 7, TP.HCM", "23 triệu / tháng", 110, 3, 2, "approved", "Nguyễn Lan Hương", 94, "Ban công hướng công viên yên tĩnh, có phòng làm việc riêng.", "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1000&q=80"],
    ["P-05", "Botanica căn hộ 2PN+1 tối ưu làm việc tại nhà", "Bình Thạnh, TP.HCM", "15 triệu / tháng", 76, 2, 2, "approved", "Đỗ Hoài Nam", 90, "Góc WFH tách biệt, gần công viên Gia Định.", "https://images.unsplash.com/photo-1600121848594-d8644e57abab?auto=format&fit=crop&w=1000&q=80"],
    ["P-06", "Midtown Phú Mỹ Hưng căn hộ gia đình gần trường", "Quận 7, TP.HCM", "26 triệu / tháng", 118, 3, 2, "approved", "Lê Thảo Vy", 95, "Đi bộ 5 phút tới trường quốc tế, an ninh 24/7.", "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1000&q=80"],
    ["P-07", "Vinhomes Golden River 2PN yên tĩnh, view sông", "Quận 1, TP.HCM", "28 triệu / tháng", 82, 2, 2, "approved", "Nguyễn Lan Hương", 91, "Kính cách âm 2 lớp, bến thuyền và đường dạo bộ ven sông.", "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&fit=crop&w=1000&q=80"],
    ["P-08", "Estella Heights 3PN khu compound an ninh", "Quận 2, TP.HCM", "32 triệu / tháng", 125, 3, 2, "approved", "Trịnh Mỹ Dung", 89, "Hồ bơi tràn bờ, khu vui chơi trẻ em, cộng đồng gia đình.", "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1000&q=80"],
    ["P-09", "Celadon Emerald 2PN ban công rộng nhiều cây xanh", "Tân Phú, TP.HCM", "13 triệu / tháng", 70, 2, 2, "approved", "Trần Minh Quân", 85, "Công viên nội khu 16ha, xe điện đưa đón.", "https://images.unsplash.com/photo-1554995207-c18c203602cb?auto=format&fit=crop&w=1000&q=80"],
    ["P-10", "Sala Sarimi 2PN tầng thấp thoáng mát", "TP. Thủ Đức", "24 triệu / tháng", 88, 2, 2, "approved", "Nguyễn Lan Hương", 93, "Khu đô thị sinh thái Sala, kết nối Quận 1 trong 10 phút.", "https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?auto=format&fit=crop&w=1000&q=80"],
    ["P-11", "Thảo Điền Villa 4PN có sân vườn & hồ bơi riêng", "TP. Thủ Đức", "45 triệu / tháng", 200, 4, 3, "pending", "Trịnh Mỹ Dung", 88, "Đang chờ kiểm duyệt viên đối chiếu giấy ủy quyền cho thuê.", "https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?auto=format&fit=crop&w=1000&q=80"]
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
    legal: "Sổ hồng riêng • Đã đối chiếu",
    amenities: "Yên tĩnh, gần trường học, góc làm việc WFH, ánh sáng tự nhiên",
    contract: "Hợp đồng 12 tháng",
    costs: "Điện nước theo hóa đơn · Phí quản lý minh bạch",
    furnishing: "Đầy đủ nội thất",
    brokerName,
    brokerMeta: `${brokerName} • Đã xác minh`,
    fitScore: `${fit}%`,
    aiSummary: `${note} Hiện khớp ${fit}% với nhu cầu sống của bạn.`,
    aiReasons: [note, "Có góc WFH yên tĩnh & ánh sáng tự nhiên", "Gần trường học và tiện ích nội khu"],
    moderationNote: note,
    status,
    image,
    images: [image]
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

  function ensureSeeded() {
    if (!localStorage.getItem(KEYS.POSTS)) write(KEYS.POSTS, defaultPosts);
    if (!localStorage.getItem(KEYS.USERS)) write(KEYS.USERS, defaultUsers);
    if (!localStorage.getItem(KEYS.SAVED)) write(KEYS.SAVED, defaultPosts.slice(0, 2));
    if (!localStorage.getItem(KEYS.LEADS)) {
      write(KEYS.LEADS, [
        {
          id: "L-024",
          leadCode: "L-024",
          briefCode: "B-024",
          clientName: "Gia đình Minh Anh",
          source: "B-024 / P-01",
          status: "new",
          phone: "090 0024 0024",
          brokerName: "Nguyễn Lan Hương",
          briefSummary: "Ngân sách 16-20 triệu/tháng, Quận 2 / Thảo Điền. Ưu tiên yên tĩnh 40%, gần trường 35%, WFH 25%.",
        },
      ]);
    }
    if (!localStorage.getItem(KEYS.APPTS)) {
      write(KEYS.APPTS, [
        {
          id: "A-031",
          clientName: "Minh Anh",
          houseCode: "P-01",
          houseName: "River Park căn góc, ban công hướng sông",
          time: "28/10/2026 • 09:00",
          status: "confirmed",
        },
      ]);
    }
    if (!localStorage.getItem(KEYS.REPORTS)) {
      write(KEYS.REPORTS, [
        {
          id: "RP-101",
          propertyId: "P-03",
          propertyTitle: "P-03 • Garden House 2 phòng ngủ có sân vườn",
          details: "Người dùng phản ánh cần cập nhật lại phí quản lý hàng tháng.",
          status: "pending",
        },
      ]);
    }
  }

  ensureSeeded();

  return {
    KEYS,
    getPosts: () => read(KEYS.POSTS, defaultPosts),
    savePosts: (list) => write(KEYS.POSTS, list),
    getUsers: () => read(KEYS.USERS, defaultUsers),
    saveUsers: (list) => write(KEYS.USERS, list),
    getSaved: () => read(KEYS.SAVED, []),
    saveSaved: (list) => write(KEYS.SAVED, list),
    getBrief: () => read(KEYS.BRIEF, null),
    saveBrief: (brief) => write(KEYS.BRIEF, brief),
    getLeads: () => read(KEYS.LEADS, []),
    saveLeads: (list) => write(KEYS.LEADS, list),
    getAppts: () => read(KEYS.APPTS, []),
    saveAppts: (list) => write(KEYS.APPTS, list),
    getReports: () => read(KEYS.REPORTS, []),
    saveReports: (list) => write(KEYS.REPORTS, list),
    getSession: () => read(KEYS.SESSION, null),
    setSession: (user) => {
      if (user) write(KEYS.SESSION, user);
      else localStorage.removeItem(KEYS.SESSION);
    },
  };
})();