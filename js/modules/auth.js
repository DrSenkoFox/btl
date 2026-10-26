/* ==========================================================================
   HomeFit AI – Authentication, Validation & Password Recovery (js/modules/auth.js)
   ========================================================================== */

document.addEventListener("DOMContentLoaded", () => {
  const API = window.HomeFitAPI;
  const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  const roleRoutes = {
    seeker: "seeker-property-search.html",
    agent: "agent-listing-management.html",
    moderator: "moderator-listing-review.html",
    admin: "admin-user-management.html",
  };

  /* 1. Chuyển đổi qua lại giữa 3 chế độ: login | register | forgot */
  const views = {
    login: document.getElementById("auth-view-login"),
    register: document.getElementById("auth-view-register"),
    forgot: document.getElementById("auth-view-forgot"),
  };

  function switchAuthMode(mode) {
    Object.entries(views).forEach(([key, el]) => {
      if (el) el.hidden = key !== mode;
    });
    clearAllErrors();
  }

  // Mở đúng tab nếu URL có ?mode=register hoặc ?mode=forgot
  const urlMode = new URLSearchParams(window.location.search).get("mode");
  if (urlMode && views[urlMode]) {
    switchAuthMode(urlMode);
  }

  document.querySelectorAll("[data-switch-mode]").forEach((btn) => {
    btn.addEventListener("click", () => switchAuthMode(btn.dataset.switchMode));
  });

  /* 2. Bật / tắt hiển thị mật khẩu (nút con mắt) */
  document.querySelectorAll("[data-toggle-pass]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const input = document.getElementById(btn.dataset.togglePass);
      if (!input) return;
      input.type = input.type === "password" ? "text" : "password";
    });
  });

  /* 3. Nút điền nhanh tài khoản giả lập để kiểm thử 4 vai trò */
  document.querySelectorAll("[data-demo-email]").forEach((btn) => {
    btn.addEventListener("click", () => {
      switchAuthMode("login");
      document.getElementById("login-email").value = btn.dataset.demoEmail;
      document.getElementById("login-password").value = "123456";
      clearAllErrors();
    });
  });

  /* 4. Hàm tiện ích hiển thị lỗi ngay dưới từng trường nhập */
  function setFieldError(boxId, errId, message) {
    const box = document.getElementById(boxId);
    const err = document.getElementById(errId);
    if (box) box.classList.toggle("is-invalid", Boolean(message));
    if (err) {
      err.textContent = message || "";
      err.hidden = !message;
    }
  }

  function setGlobalAlert(elId, message, type = "error") {
    const el = document.getElementById(elId);
    if (!el) return;
    el.textContent = message || "";
    el.className = `auth-global-alert ${type === "success" ? "is-success" : "is-error"}`;
    el.hidden = !message;
  }

  function clearAllErrors() {
    document.querySelectorAll(".auth-input-card").forEach((c) => c.classList.remove("is-invalid"));
    document.querySelectorAll(".auth-field-error").forEach((e) => (e.hidden = true));
    document.querySelectorAll(".auth-global-alert").forEach((a) => (a.hidden = true));
  }

  /* 5. XỬ LÝ ĐĂNG NHẬP: Kiểm tra định dạng Email + Đối chiếu dữ liệu giả lập */
  document.getElementById("form-login")?.addEventListener("submit", (e) => {
    e.preventDefault();
    clearAllErrors();

    const email = document.getElementById("login-email").value.trim().toLowerCase();
    const password = document.getElementById("login-password").value;

    let hasError = false;
    if (!email) {
      setFieldError("login-email-box", "login-email-error", "Vui lòng nhập địa chỉ email.");
      hasError = true;
    } else if (!EMAIL_REGEX.test(email)) {
      setFieldError(
        "login-email-box",
        "login-email-error",
        "Định dạng email không hợp lệ (ví dụ hợp lệ: minhanh@example.com)."
      );
      hasError = true;
    }

    if (!password) {
      setFieldError("login-password-box", "login-password-error", "Vui lòng nhập mật khẩu.");
      hasError = true;
    }

    if (hasError) return;

    // Đối chiếu với danh sách tài khoản trong dữ liệu giả lập (localStorage)
    const users = API.getUsers();
    const matchedUser = users.find((u) => u.email.toLowerCase() === email);

    if (!matchedUser) {
      setFieldError(
        "login-email-box",
        "login-email-error",
        "Email không khớp với bất kỳ tài khoản nào trong dữ liệu hệ thống."
      );
      return;
    }

    if (matchedUser.status === "disabled") {
      setGlobalAlert(
        "login-global-msg",
        "Tài khoản này đã bị vô hiệu hóa. Vui lòng liên hệ Quản trị viên để được hỗ trợ."
      );
      return;
    }

    const expectedPass = matchedUser.password || "123456";
    if (password !== expectedPass) {
      setFieldError(
        "login-password-box",
        "login-password-error",
        "Mật khẩu không chính xác. Bạn có thể bấm 'Quên mật khẩu?' để đặt lại."
      );
      return;
    }

    // Đăng nhập thành công -> Lưu phiên và điều hướng theo đúng vai trò
    API.setSession(matchedUser);
    window.location.href = roleRoutes[matchedUser.role] || "seeker-property-search.html";
  });

  /* 6. XỬ LÝ ĐĂNG KÝ: Kiểm tra định dạng + Chống trùng Email trong DB */
  document.getElementById("form-register")?.addEventListener("submit", (e) => {
    e.preventDefault();
    clearAllErrors();

    const name = document.getElementById("reg-name").value.trim();
    const email = document.getElementById("reg-email").value.trim().toLowerCase();
    const phone = document.getElementById("reg-phone").value.trim();
    const role = document.getElementById("reg-role").value;
    const password = document.getElementById("reg-password").value;

    let hasError = false;
    if (name.length < 2) {
      setFieldError("reg-name-box", "reg-name-error", "Vui lòng nhập họ và tên đầy đủ (tối thiểu 2 ký tự).");
      hasError = true;
    }

    if (!email) {
      setFieldError("reg-email-box", "reg-email-error", "Vui lòng nhập địa chỉ email.");
      hasError = true;
    } else if (!EMAIL_REGEX.test(email)) {
      setFieldError("reg-email-box", "reg-email-error", "Định dạng email không hợp lệ.");
      hasError = true;
    }

    if (!/^(0|\+84)\d{8,10}$/.test(phone.replace(/\s+/g, ""))) {
      setFieldError("reg-phone-box", "reg-phone-error", "Số điện thoại phải bắt đầu bằng 0 và gồm 9–11 chữ số.");
      hasError = true;
    }

    if (password.length < 6) {
      setFieldError("reg-password-box", "reg-password-error", "Mật khẩu phải có ít nhất 6 ký tự.");
      hasError = true;
    }

    if (hasError) return;

    const users = API.getUsers();
    if (users.some((u) => u.email.toLowerCase() === email)) {
      setFieldError("reg-email-box", "reg-email-error", "Email này đã tồn tại trong dữ liệu hệ thống. Vui lòng đăng nhập!");
      return;
    }

    const newUser = {
      id: `U-0${users.length + 35}`,
      name,
      email,
      password,
      phone,
      role,
      status: "active",
      perms: [],
    };

    users.push(newUser);
    API.saveUsers(users);
    API.setSession(newUser);
    window.location.href = roleRoutes[newUser.role] || "seeker-property-search.html";
  });

  /* 7. XỬ LÝ QUÊN MẬT KHẨU: Kiểm tra Email tồn tại trong DB & Cập nhật mật khẩu mới */
  document.getElementById("form-forgot")?.addEventListener("submit", (e) => {
    e.preventDefault();
    clearAllErrors();

    const email = document.getElementById("forgot-email").value.trim().toLowerCase();
    const newPass = document.getElementById("forgot-newpass").value;
    const confirmPass = document.getElementById("forgot-confirm").value;

    let hasError = false;
    if (!email) {
      setFieldError("forgot-email-box", "forgot-email-error", "Vui lòng nhập địa chỉ email cần khôi phục.");
      hasError = true;
    } else if (!EMAIL_REGEX.test(email)) {
      setFieldError("forgot-email-box", "forgot-email-error", "Định dạng email không hợp lệ.");
      hasError = true;
    }

    if (newPass.length < 6) {
      setFieldError("forgot-newpass-box", "forgot-newpass-error", "Mật khẩu mới phải có ít nhất 6 ký tự.");
      hasError = true;
    }

    if (confirmPass !== newPass) {
      setFieldError("forgot-confirm-box", "forgot-confirm-error", "Mật khẩu xác nhận không khớp.");
      hasError = true;
    }

    if (hasError) return;

    const users = API.getUsers();
    const targetUser = users.find((u) => u.email.toLowerCase() === email);

    if (!targetUser) {
      setFieldError(
        "forgot-email-box",
        "forgot-email-error",
        "Không tìm thấy tài khoản nào khớp với email này trong dữ liệu giả lập."
      );
      return;
    }

    // Lưu mật khẩu mới vào dữ liệu giả lập (localStorage)
    targetUser.password = newPass;
    API.saveUsers(users);

    // Chuyển về màn hình Đăng nhập kèm thông báo thành công
    switchAuthMode("login");
    document.getElementById("login-email").value = email;
    document.getElementById("login-password").value = newPass;
    setGlobalAlert(
      "login-global-msg",
      `Đã cập nhật mật khẩu mới cho tài khoản ${targetUser.name} (${email}). Bạn có thể bấm Đăng nhập ngay!`,
      "success"
    );
  });
});