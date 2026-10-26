(() => {
  const agentNav = document.querySelector("#agent-nav");
  if (!agentNav) return;

  const links = [
    ["agent-posts.html", "Quản lý bài đăng"],
    ["seeker-search.html", "Trang tìm nhà"],
    ["agent-requests.html", "Yêu cầu & khách hàng"],
    ["agent-appointments.html", "Lịch hẹn xem nhà"],
  ];

  function render() {
    const page = window.location.pathname.split("/").pop();
    const requests = JSON.parse(
      localStorage.getItem("homefit-agent-requests") || "[]",
    );
    const notifCount = Array.isArray(requests)
      ? requests.filter((r) => r.status === "new").length
      : 0;

    agentNav.innerHTML = `
      <a class="agent-nav__brand" href="agent-posts.html">
        <img src="../images/homefit-ai-logo.svg" alt="" />
        <span>HomeFit AI</span>
      </a>
      <p class="agent-nav__label">Môi giới</p>
      <ul class="agent-nav__list">
        ${links
          .map(
            ([href, label]) =>
              `<li><a href="${href}"${
                href === page ? ' class="is-active" aria-current="page"' : ""
              }>${label}</a></li>`,
          )
          .join("")}
      </ul>
      <footer class="agent-nav__foot">
        <a href="agent-requests.html">Thông báo • ${notifCount}</a>
        <a href="seeker-agent-profile.html?id=nguyen-lan-huong">Hồ sơ &amp; cài đặt</a>
      </footer>
    `;
    document.body.classList.add("has-agent-nav");
  }

  render();
  window.addEventListener("homefit:agent-requests-change", render);
  window.addEventListener("storage", (event) => {
    if (event.key === "homefit-agent-requests") render();
  });
})();
