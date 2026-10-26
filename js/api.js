/* ==========================================================================
   HomeFit AI – JSON File Data Layer & Per-User Isolated State (js/api.js)
   - Đọc dữ liệu khởi tạo từ tệp cục bộ: ../assets/data/data.json
   - Mặc định khởi đầu ở trạng thái Chưa đăng nhập (Guest)
   - Mỗi tài khoản (user.id) có kho Nhà đã lưu (savedByUser) và Nhu cầu nhà ở (briefByUser) riêng biệt
   ========================================================================== */

window.HomeFitAPI = (() => {
  const JSON_FILE_URL = "../assets/data/data.json";
  const STORAGE_DB_KEY = "homefit_json_db_v5";
  const SESSION_KEY = "homefit_session_v5";

  /* 1. Đọc tệp ../assets/data/data.json lần đầu */
  function fetchInitialJsonFile() {
    try {
      const xhr = new XMLHttpRequest();
      xhr.open("GET", JSON_FILE_URL, false);
      xhr.send(null);
      if (xhr.status >= 200 && xhr.status < 300 && xhr.responseText) {
        return JSON.parse(xhr.responseText);
      }
    } catch (err) {
      console.error("[HomeFitAPI] Không thể đọc đồng bộ data.json:", err);
    }
    return {
      users: [],
      posts: [],
      leads: [],
      appointments: [],
      reports: [],
      notifications: [],
      savedByUser: {},
      briefByUser: {},
    };
  }

  async function reloadFromJsonFileAsync() {
    try {
      const response = await fetch(JSON_FILE_URL, { cache: "no-store" });
      if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
      const data = await response.json();
      data.savedByUser = data.savedByUser || {};
      data.briefByUser = data.briefByUser || {};
      saveDatabase(data);
      return data;
    } catch (error) {
      console.error("[HomeFitAPI] Lỗi khi fetch assets/data/data.json:", error);
      return getDatabase();
    } finally {
      window.dispatchEvent(new CustomEvent("homefit:db-synced"));
    }
  }

  function getDatabase() {
    try {
      const cached = localStorage.getItem(STORAGE_DB_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed && Array.isArray(parsed.users) && Array.isArray(parsed.posts)) {
          parsed.savedByUser = parsed.savedByUser || {};
          parsed.briefByUser = parsed.briefByUser || {};
          return parsed;
        }
      }
    } catch {
      // Bỏ qua lỗi cache
    }
    const initialData = fetchInitialJsonFile();
    initialData.savedByUser = initialData.savedByUser || {};
    initialData.briefByUser = initialData.briefByUser || {};
    saveDatabase(initialData);
    return initialData;
  }

  function saveDatabase(db) {
    localStorage.setItem(STORAGE_DB_KEY, JSON.stringify(db));
    window.dispatchEvent(new CustomEvent("homefit:db-changed"));
  }

  async function exportOrSaveToJsonFile() {
    const db = getDatabase();
    const jsonString = JSON.stringify(db, null, 2);

    if (window.showSaveFilePicker) {
      try {
        const handle = await window.showSaveFilePicker({
          suggestedName: "data.json",
          types: [{ description: "JSON Database File", accept: { "application/json": [".json"] } }],
        });
        const writable = await handle.createWritable();
        await writable.write(jsonString);
        await writable.close();
        return true;
      } catch {
        return false;
      }
    }

    const blob = new Blob([jsonString], { type: "application/json;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "data.json";
    a.click();
    return true;
  }

  /* 2. Quản lý Phiên đăng nhập (Mặc định chưa đăng nhập sẽ trả về null) */
  function getSession() {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      if (!raw) return null;
      const sessionUser = JSON.parse(raw);
      return sessionUser && sessionUser.id ? sessionUser : null;
    } catch {
      return null;
    }
  }

  function setSession(user) {
    if (user && user.id) {
      localStorage.setItem(SESSION_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(SESSION_KEY);
    }
  }

  /* 3. Quản lý Tài khoản & Danh sách Môi giới */
  function getUsers() {
    return getDatabase().users || [];
  }

  function saveUsers(usersList) {
    const db = getDatabase();
    db.users = usersList;
    saveDatabase(db);
  }

  function getBrokers() {
    return getUsers()
      .filter((u) => u.role === "agent")
      .map((u) => ({
        id: u.brokerId || u.id,
        userId: u.id,
        name: u.name,
        initials: u.initials || u.name.slice(0, 2).toUpperCase(),
        verified: u.verified !== false,
        location: u.location || u.area || "TP.HCM",
        specialty: u.specialty || "Tư vấn thuê & mua bất động sản theo nhu cầu sống",
        bio: u.bio || "Đồng hành cùng khách hàng tìm kiếm ngôi nhà phù hợp nhịp sống gia đình.",
        tags: Array.isArray(u.tags) && u.tags.length ? u.tags : ["Gia đình", "WFH", "Pháp lý"],
        fit: u.fit || 90,
        fitLabel: u.fitLabel || "Khớp brief của bạn",
        deals: u.deals || 12,
        fast: u.fast !== false,
        areas: u.areas || "all thao-dien binh-thanh thu-duc",
        specialties: u.specialties || "all family wfh rental buying",
        note: u.note || "Thường phản hồi trong 2 giờ • Đủ dữ liệu hồ sơ",
      }));
  }

  /* 4. Quản lý Bài đăng BĐS */
  function getPosts() {
    return getDatabase().posts || [];
  }

  function savePosts(postsList) {
    const db = getDatabase();
    db.posts = postsList;
    saveDatabase(db);
  }

  function updatePost(postId, patchData) {
    const posts = getPosts();
    const idx = posts.findIndex((p) => p.id === postId || p.code === postId);
    if (idx < 0) return false;
    posts[idx] = { ...posts[idx], ...patchData };
    savePosts(posts);
    return true;
  }

  /* 5. [QUAN TRỌNG] Quản lý Nhà đã lưu & Nhu cầu nhà ở RIÊNG BIỆT theo từng User ID */
  function getSaved() {
    const session = getSession();
    // Nếu chưa đăng nhập -> Không có nhà nào được lưu (trả về mảng rỗng [])
    if (!session || !session.id) return [];

    const db = getDatabase();
    const userSaved = db.savedByUser[session.id];
    return Array.isArray(userSaved) ? userSaved : [];
  }

  function saveSaved(list) {
    const session = getSession();
    if (!session || !session.id) return false;

    const db = getDatabase();
    db.savedByUser[session.id] = Array.isArray(list) ? list : [];
    saveDatabase(db);
    return true;
  }

  function getBrief() {
    const session = getSession();
    // Nếu chưa đăng nhập -> Không có Brief nào
    if (!session || !session.id) return null;

    const db = getDatabase();
    return db.briefByUser[session.id] || null;
  }

  function saveBrief(briefObj) {
    const session = getSession();
    if (!session || !session.id) return false;

    const db = getDatabase();
    if (briefObj) {
      db.briefByUser[session.id] = briefObj;
    } else {
      delete db.briefByUser[session.id];
    }
    saveDatabase(db);
    return true;
  }

  /* 6. Quản lý Leads, Lịch hẹn, Báo cáo & Thông báo */
  function getLeads() {
    return getDatabase().leads || [];
  }

  function saveLeads(list) {
    const db = getDatabase();
    db.leads = list;
    saveDatabase(db);
  }

  function getAppts() {
    return getDatabase().appointments || [];
  }

  function saveAppts(list) {
    const db = getDatabase();
    db.appointments = list;
    saveDatabase(db);
  }

  function getReports() {
    return getDatabase().reports || [];
  }

  function saveReports(list) {
    const db = getDatabase();
    db.reports = list;
    saveDatabase(db);
  }

  function getNotifs() {
    return getDatabase().notifications || [];
  }

  function saveNotifs(list) {
    const db = getDatabase();
    db.notifications = list;
    saveDatabase(db);
  }

  getDatabase();

  return {
    JSON_FILE_URL,
    reloadFromJsonFileAsync,
    exportOrSaveToJsonFile,
    getDatabase,
    saveDatabase,
    getUsers,
    saveUsers,
    getBrokers,
    getPosts,
    savePosts,
    updatePost,
    getSession,
    setSession,
    getSaved,
    saveSaved,
    getBrief,
    saveBrief,
    getLeads,
    saveLeads,
    getAppts,
    saveAppts,
    getReports,
    saveReports,
    getNotifs,
    saveNotifs,
  };
})();