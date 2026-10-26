const API = window.HomeFitAPI;

const views = {
  login: document.querySelector("#auth-view-login"),
  register: document.querySelector("#auth-view-register"),
  forgot: document.querySelector("#auth-view-forgot"),
};

const homePages = {
  seeker: "seeker-search.html",
  agent: "agent-posts.html",
};

const rememberedKey = "homefit-remembered-email";
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function showView(mode) {
  Object.entries(views).forEach(([name, view]) => {
    view.hidden = name !== mode;
  });
}

function setError(boxSelector, errorSelector, message) {
  const box = document.querySelector(boxSelector);
  const error = document.querySelector(errorSelector);
  error.textContent = message;
  error.hidden = !message;
  box.classList.toggle("is-invalid", Boolean(message));
}

function setAlert(alertSelector, message, isError) {
  const box = document.querySelector(alertSelector);
  box.textContent = message;
  box.hidden = !message;
  box.classList.toggle("is-error", Boolean(isError));
  box.classList.toggle("is-success", !isError && Boolean(message));
}

function findUser(email, list = API.getUsers()) {
  return list.find(
    (user) => user.email.toLowerCase() === email.trim().toLowerCase(),
  );
}

function enter(user, remember) {
  API.setSession({
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    perms: user.perms || [],
  });
  if (remember) localStorage.setItem(rememberedKey, user.email);
  else localStorage.removeItem(rememberedKey);
  window.location.href = homePages[user.role] || homePages.seeker;
}

showView(new URLSearchParams(window.location.search).get("mode") || "login");

const rememberedEmail = localStorage.getItem(rememberedKey);
if (rememberedEmail) document.querySelector("#login-email").value = rememberedEmail;

document.querySelector(".auth-demo-chips").addEventListener("click", (event) => {
  const chip = event.target.closest("[data-demo-email]");
  if (!chip) return;
  document.querySelector("#login-email").value = chip.dataset.demoEmail;
  document.querySelector("#login-password").value = "123456";
});

document.querySelectorAll("[data-switch-mode]").forEach((button) => {
  button.addEventListener("click", () => showView(button.dataset.switchMode));
});

document.querySelectorAll("[data-toggle-pass]").forEach((button) => {
  button.addEventListener("click", () => {
    const input = document.querySelector(`#${button.dataset.togglePass}`);
    input.type = input.type === "password" ? "text" : "password";
  });
});

document.querySelector("#form-login").addEventListener("submit", async (event) => {
  event.preventDefault();
  const email = document.querySelector("#login-email").value;
  const password = document.querySelector("#login-password").value;
  setError("#login-email-box", "#login-email-error", "");
  setError("#login-password-box", "#login-password-error", "");
  setAlert("#login-global-msg", "");

  if (!emailPattern.test(email)) {
    setError("#login-email-box", "#login-email-error", "Email chưa đúng định dạng.");
    return;
  }
  if (password.length < 6) {
    setError(
      "#login-password-box",
      "#login-password-error",
      "Mật khẩu cần tối thiểu 6 ký tự.",
    );
    return;
  }

  await API.ready;
  const user = findUser(email);
  if (!user) {
    setAlert("#login-global-msg", "Email chưa được đăng ký trên HomeFit AI.", true);
    return;
  }
  if (user.password !== password) {
    setAlert(
      "#login-global-msg",
      "Mật khẩu không đúng. Thử lại hoặc dùng liên kết Quên mật khẩu.",
      true,
    );
    return;
  }
  if (user.status !== "active") {
    setAlert(
      "#login-global-msg",
      "Tài khoản đang bị tạm khoá, vui lòng liên hệ quản trị viên.",
      true,
    );
    return;
  }

  enter(user, document.querySelector("#login-remember").checked);
});

document.querySelector("#form-register").addEventListener("submit", async (event) => {
  event.preventDefault();
  const name = document.querySelector("#reg-name").value.trim();
  const email = document.querySelector("#reg-email").value.trim();
  const phone = document.querySelector("#reg-phone").value.replace(/\D/g, "");
  const password = document.querySelector("#reg-password").value;
  [
    ["#reg-name-box", "#reg-name-error"],
    ["#reg-email-box", "#reg-email-error"],
    ["#reg-phone-box", "#reg-phone-error"],
    ["#reg-password-box", "#reg-password-error"],
  ].forEach(([box, error]) => setError(box, error, ""));
  setAlert("#reg-global-msg", "");

  if (name.length < 3) {
    setError("#reg-name-box", "#reg-name-error", "Họ và tên cần tối thiểu 3 ký tự.");
    return;
  }
  if (!emailPattern.test(email)) {
    setError("#reg-email-box", "#reg-email-error", "Email chưa đúng định dạng.");
    return;
  }
  if (phone.length < 10 || phone.length > 11) {
    setError("#reg-phone-box", "#reg-phone-error", "Số điện thoại cần 10 đến 11 chữ số.");
    return;
  }
  if (password.length < 6) {
    setError(
      "#reg-password-box",
      "#reg-password-error",
      "Mật khẩu cần tối thiểu 6 ký tự.",
    );
    return;
  }

  await API.ready;
  if (findUser(email)) {
    setError("#reg-email-box", "#reg-email-error", "Email này đã có tài khoản.");
    return;
  }

  const users = API.getUsers();
  const user = {
    id: `U-${String(users.length + 1).padStart(3, "0")}`,
    name,
    email,
    password,
    phone,
    role: document.querySelector("#reg-role").value,
    perms: [],
    status: "active",
    joinedAt: new Date().toISOString().slice(0, 10),
  };
  users.push(user);
  API.saveUsers(users);
  enter(user, true);
});

document.querySelector("#form-forgot").addEventListener("submit", async (event) => {
  event.preventDefault();
  const email = document.querySelector("#forgot-email").value.trim();
  const password = document.querySelector("#forgot-newpass").value;
  const confirm = document.querySelector("#forgot-confirm").value;
  [
    ["#forgot-email-box", "#forgot-email-error"],
    ["#forgot-newpass-box", "#forgot-newpass-error"],
    ["#forgot-confirm-box", "#forgot-confirm-error"],
  ].forEach(([box, error]) => setError(box, error, ""));
  setAlert("#forgot-global-msg", "");

  if (!emailPattern.test(email)) {
    setError("#forgot-email-box", "#forgot-email-error", "Email chưa đúng định dạng.");
    return;
  }
  if (password.length < 6) {
    setError(
      "#forgot-newpass-box",
      "#forgot-newpass-error",
      "Mật khẩu mới cần tối thiểu 6 ký tự.",
    );
    return;
  }
  if (password !== confirm) {
    setError(
      "#forgot-confirm-box",
      "#forgot-confirm-error",
      "Mật khẩu nhập lại chưa khớp.",
    );
    return;
  }

  await API.ready;
  const users = API.getUsers();
  const user = findUser(email, users);
  if (!user) {
    setError("#forgot-email-box", "#forgot-email-error", "Email không có trong hệ thống.");
    return;
  }

  user.password = password;
  API.saveUsers(users);
  document.querySelector("#login-email").value = email;
  showView("login");
  setAlert(
    "#login-global-msg",
    "Đã cập nhật mật khẩu mới. Bạn có thể đăng nhập ngay.",
    false,
  );
});
