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

  const seed = { posts: [], users: [], reports: [] };

  function read(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  }

  function write(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  async function loadSeed() {
    try {
      const response = await fetch("../data/data.json");
      if (!response.ok) throw new Error(`Không tải được dữ liệu: ${response.status}`);
      Object.assign(seed, await response.json());
    } catch {
      return;
    } finally {
      const seeds = [
        [KEYS.USERS, seed.users],
        [KEYS.POSTS, seed.posts],
        [KEYS.REPORTS, seed.reports],
      ];
      seeds.forEach(([key, value]) => {
        if (value.length && !localStorage.getItem(key)) write(key, value);
      });
    }
  }

  const ready = loadSeed();

  return Object.freeze({
    KEYS,
    ready,
    getPosts: () => read(KEYS.POSTS, seed.posts),
    savePosts: (list) => write(KEYS.POSTS, list),
    getUsers: () => read(KEYS.USERS, seed.users),
    saveUsers: (list) => write(KEYS.USERS, list),
    getSaved: () => read(KEYS.SAVED, []),
    saveSaved: (list) => write(KEYS.SAVED, list),
    getBrief: () => read(KEYS.BRIEF, null),
    saveBrief: (brief) => write(KEYS.BRIEF, brief),
    getLeads: () => read(KEYS.LEADS, []),
    saveLeads: (list) => write(KEYS.LEADS, list),
    getAppts: () => read(KEYS.APPTS, []),
    saveAppts: (list) => write(KEYS.APPTS, list),
    getReports: () => read(KEYS.REPORTS, seed.reports),
    saveReports: (list) => write(KEYS.REPORTS, list),
    getSession: () => read(KEYS.SESSION, null),
    setSession: (user) => {
      if (user) write(KEYS.SESSION, user);
      else localStorage.removeItem(KEYS.SESSION);
    },
  });
})();
