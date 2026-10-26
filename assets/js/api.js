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
  const photoBase = "https://images.unsplash.com/";
  const photoQuery = "?auto=format&fit=crop&w=900&q=80";

  function seedPosts() {
    return seed.posts.map((post) => {
      const [brokerName, contact] = seed.brokers?.[post.broker] || [];
      const images = (post.photos || []).map((photo) => `${photoBase}${photo}${photoQuery}`);
      return {
        ...seed.postDefaults,
        ...post,
        brokerName,
        contact,
        brokerMeta: `${brokerName} • ${contact}`,
        nearby: seed.nearby?.[post.area] || [],
        image: images[0] || "",
        images,
      };
    });
  }

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
        [KEYS.REPORTS, seed.reports],
      ];
      seeds.forEach(([key, value]) => {
        if (value.length && !localStorage.getItem(key)) write(key, value);
      });
      if (seed.posts.length) {
        const stored = read(KEYS.POSTS, []);
        const posts = seedPosts();
        write(
          KEYS.POSTS,
          posts
            .map(
              (post) =>
                stored.find((item) => item.id === post.id && item.images?.length) ||
                post,
            )
            .concat(
              stored.filter((item) => !posts.some((post) => post.id === item.id)),
            ),
        );
        window.dispatchEvent(new CustomEvent("homefit:agent-posts-change"));
      }
    }
  }

  const ready = loadSeed();

  return Object.freeze({
    KEYS,
    ready,
    getPosts: () => read(KEYS.POSTS, seedPosts()),
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
