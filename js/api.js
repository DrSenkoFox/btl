/* ==========================================================================
   HomeFit AI – Unified Data Store & API (js/api.js)
   - Hợp nhất toàn bộ helper của Dev (HomeFitAgentPosts, HomeFitSavedHomes,
     HomeFitBrief, HomeFitReports, Appointments) và Main (HomeFitAPI)
   - Sử dụng duy nhất nguồn dữ liệu từ ../assets/data/data.json
   - Phân tách Nhà đã lưu (savedByUser) & Nhu cầu nhà ở (briefByUser) theo từng tài khoản
   ========================================================================== */

window.HomeFitAPI = (() => {
  const JSON_FILE_URL = "../assets/data/data.json";
  const STORAGE_DB_KEY = "homefit_unified_db_v6";
  const SESSION_KEY = "homefit_session_v6";

  function fetchInitialJsonFile() {
    try {
      const xhr = new XMLHttpRequest();
      xhr.open("GET", JSON_FILE_URL, false);
      xhr.send(null);
      if (xhr.status >= 200 && xhr.status < 300 && xhr.responseText) {
        return JSON.parse(xhr.responseText);
      }
    } catch (err) {
      console.error("[HomeFitAPI] Lỗi đọc data.json:", err);
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
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      data.savedByUser = data.savedByUser || {};
      data.briefByUser = data.briefByUser || {};
      saveDatabase(data);
      return data;
    } catch (err) {
      console.error("[HomeFitAPI] Fetch data.json error:", err);
      return getDatabase();
    } finally {
      window.dispatchEvent(new CustomEvent("homefit:db-synced"));
    }
  }

  function getDatabase() {
    try {
      const raw = localStorage.getItem(STORAGE_DB_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && Array.isArray(parsed.users) && Array.isArray(parsed.posts)) {
          parsed.savedByUser = parsed.savedByUser || {};
          parsed.briefByUser = parsed.briefByUser || {};
          return parsed;
        }
      }
    } catch {
      // Nạp lại từ file data.json nếu cache hỏng
    }
    const fresh = fetchInitialJsonFile();
    fresh.savedByUser = fresh.savedByUser || {};
    fresh.briefByUser = fresh.briefByUser || {};
    saveDatabase(fresh);
    return fresh;
  }

  function saveDatabase(db) {
    localStorage.setItem(STORAGE_DB_KEY, JSON.stringify(db));
    window.dispatchEvent(new CustomEvent("homefit:db-changed"));
    window.dispatchEvent(new CustomEvent("homefit:agent-posts-change"));
    window.dispatchEvent(new CustomEvent("homefit:saved-homes-change"));
    window.dispatchEvent(new CustomEvent("homefit:agent-requests-change"));
  }

  async function exportOrSaveToJsonFile() {
    const db = getDatabase();
    const jsonString = JSON.stringify(db, null, 2);

    if (window.showSaveFilePicker) {
      try {
        const handle = await window.showSaveFilePicker({
          suggestedName: "data.json",
          types: [{ description: "JSON Database", accept: { "application/json": [".json"] } }],
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

  /* Phiên đăng nhập (Mặc định chưa đăng nhập trả về null) */
  function getSession() {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      if (!raw) return null;
      const user = JSON.parse(raw);
      return user && user.id ? user : null;
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

  /* Users & Brokers */
  function getUsers() {
    return getDatabase().users || [];
  }

  function saveUsers(list) {
    const db = getDatabase();
    db.users = list;
    saveDatabase(db);
  }

  function getBrokers() {
    const posts = getPosts().filter((p) => p.status === "approved");
    return getUsers()
      .filter((u) => u.role === "agent")
      .map((u) => {
        const brokerId = u.brokerId || u.id;
        const brokerPosts = posts.filter(
          (p) => p.broker === brokerId || p.brokerName === u.name
        );
        return {
          id: brokerId,
          userId: u.id,
          name: u.name,
          initials: u.initials || u.name.slice(0, 2).toUpperCase(),
          verified: u.verified !== false,
          location: u.location || u.area || "TP.HCM",
          specialty: u.specialty || "Tư vấn thuê & mua bất động sản",
          bio: u.bio || "Đồng hành cùng khách hàng tìm kiếm ngôi nhà phù hợp.",
          tags: Array.isArray(u.tags) && u.tags.length ? u.tags : ["Gia đình", "WFH"],
          fit: u.fit || 90,
          fitLabel: u.fitLabel || "Khớp brief B-024",
          deals: u.deals || brokerPosts.length || 10,
          fast: u.fast !== false,
          areas: u.areas || "all tp-hcm thao-dien binh-thanh thu-duc",
          specialties: u.specialties || "all family wfh rental buying",
          note: u.note || "Thường phản hồi trong 2 giờ • Đủ dữ liệu hồ sơ",
          contact: u.phone || "0901 234 567",
          listings: brokerPosts,
        };
      });
  }

  /* Posts */
  function getPosts() {
    return getDatabase().posts || [];
  }

  function savePosts(list) {
    const db = getDatabase();
    db.posts = list;
    saveDatabase(db);
  }

  function saveSinglePost(post) {
    if (!post?.id && !post?.title) return false;
    const posts = getPosts();
    if (!post.id) post.id = `HF-${101 + posts.length}`;
    if (!post.code) post.code = post.id;
    if (!post.area) post.area = post.location ? post.location.split(",")[0].trim() : "TP.HCM";
    const idx = posts.findIndex((item) => item.id === post.id || item.code === post.id);
    if (idx >= 0) posts[idx] = { ...posts[idx], ...post };
    else posts.unshift(post);
    savePosts(posts);
    return true;
  }

  function updatePost(postId, patchData) {
    const posts = getPosts();
    const idx = posts.findIndex((p) => p.id === postId || p.code === postId);
    if (idx < 0) return false;
    posts[idx] = { ...posts[idx], ...patchData };
    savePosts(posts);
    return true;
  }

  function deletePost(postId) {
    const posts = getPosts();
    const filtered = posts.filter((p) => p.id !== postId && p.code !== postId);
    if (filtered.length === posts.length) return false;
    savePosts(filtered);
    return true;
  }

  /* Per-User Saved Homes & Per-User Brief */
  function getSaved() {
    const session = getSession();
    if (!session || !session.id) return [];
    const db = getDatabase();
    const list = db.savedByUser[session.id];
    return Array.isArray(list) ? list : [];
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
    if (!session || !session.id) return null;
    const db = getDatabase();
    return db.briefByUser[session.id] || null;
  }

  function saveBrief(briefObj) {
    const session = getSession();
    if (!session || !session.id) return false;
    const db = getDatabase();
    if (briefObj) db.briefByUser[session.id] = briefObj;
    else delete db.briefByUser[session.id];
    saveDatabase(db);
    return true;
  }

  /* Leads, Appointments, Reports, Notifications */
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

  /* Tương thích ngược với các đối tượng global của nhánh Dev */
  window.HomeFitAgentPosts = Object.freeze({
    getAll: getPosts,
    save: saveSinglePost,
    updateStatus: (id, status) => updatePost(id, { status }),
    delete: deletePost,
  });

  window.HomeFitSavedHomes = Object.freeze({
    getAll: getSaved,
    save: (home) => {
      const list = getSaved();
      if (list.some((item) => item.id === home.id)) return false;
      return saveSaved([...list, home]);
    },
    remove: (homeId) => saveSaved(getSaved().filter((item) => item.id !== homeId)),
  });

  window.HomeFitBrief = Object.freeze({
    get: () => getBrief() || {},
    exists: () => Boolean(getBrief()?.lifestyle),
  });

  window.HomeFitReports = Object.freeze({
    getAll: getReports,
    submit: (report) => {
      saveReports([report, ...getReports()]);
      return true;
    },
  });

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
    saveSinglePost,
    updatePost,
    deletePost,
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