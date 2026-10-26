# HomeFit AI — User Flow & Sitemap

Tài liệu mắt xích 4–5 trong chuỗi truy vết (Context → Problem → Role → **User Flow** → Screen Inventory → Mockup → Task → Branch → Commit → PR → OBS → Viva).
Nguồn: `README.md` trên `origin/main` (P1–P4, O1–O7, AI-1..3, bảng 4 vai trò) đối chiếu với `assets/html/` trên `Dev` và `Homefit Ai/pages/` trên `origin/main`.

## 1. Vấn đề → vai trò → màn hình

| Vấn đề | Nội dung | Vai trò chịu trách nhiệm | Màn hình giải quyết |
|---|---|---|---|
| P1 | Nhu cầu sống khó biểu diễn bằng bộ lọc giá/diện tích | Người tìm nhà | `seeker-brief-form.html`, `seeker-search.html`, `seeker-detail.html` |
| P2 | Môi giới nhận brief không có cấu trúc | Môi giới | `agent-requests.html`, `agent-post.html` |
| P3 | Khó so sánh nhiều tin đăng | Người tìm nhà | `seeker-saved.html` |
| P4 | Tin đăng cần kiểm duyệt chất lượng | Kiểm duyệt viên, Quản trị viên | `moderator-listing-review.html`, `moderator-report-center.html`, `moderator-data-quality.html` |

## 2. Sitemap theo vai trò

```
index.html (chọn vai trò / Role Switcher)
└── login.html (đăng nhập theo vai trò, lưu homefit-current-session)
    ├── NGƯỜI TÌM NHÀ (seeker)
    │   ├── seeker-search.html         Tìm & lọc theo brief
    │   ├── seeker-detail.html         Chi tiết nhà + AI Living Summary
    │   ├── seeker-brief-form.html     Tạo brief + AI Lifestyle Matcher
    │   ├── seeker-saved.html          Nhà đã lưu + AI Comparison
    │   ├── seeker-agent-selection.html Chọn môi giới
    │   ├── seeker-agent-profile.html   Hồ sơ môi giới
    │   └── seeker-report.html          Báo cáo bài đăng cho kiểm duyệt
    ├── MÔI GIỚI (agent)
    │   ├── agent-post.html            Tạo bài + AI gợi ý bố cục
    │   ├── agent-posts.html           Quản lý bài đăng, xuất CSV
    │   ├── agent-requests.html        Lead & yêu cầu từ brief của seeker
    │   └── agent-appointments.html    Lịch hẹn xem nhà
    ├── KIỂM DUYỆT VIÊN (moderator)  — nguồn: origin/main
    │   ├── moderator-listing-review.html Duyệt tin pending → approved/rejected
    │   ├── moderator-report-center.html  Xử lý báo cáo từ seeker
    │   └── moderator-data-quality.html   Giám sát chất lượng dữ liệu
    └── QUẢN TRỊ VIÊN (admin)  — nguồn: origin/main
        ├── admin-platform-dashboard.html Thống kê toàn sàn
        ├── admin-user-management.html    Tài khoản & phân quyền
        └── admin-category-management.html Taxonomy (danh mục, khu vực)
```

## 3. Luồng nghiệp vụ đầu–cuối (hành trình chính, có liên thông dữ liệu)

```
[Seeker]  index → login(seeker)
   → seeker-brief-form: nhập nhu cầu → AI-1 Lifestyle Matcher
        (Input → Processing → Output → Giải thích % → Chấp nhận/Sửa/Từ chối → Lưu homefit-brief-draft)
   → seeker-search: lọc theo brief + từ khóa + sắp xếp → bấm "Lưu căn" (homefit-saved-homes)
   → seeker-detail: AI Living Summary → đặt lịch xem nhà (homefit-appointments, status = pending)
   → seeker-saved: AI-3 Comparison Assistant xếp hạng các căn đã lưu
   → seeker-report: báo cáo tin sai lệch (homefit-property-reports, status = open)

[Agent]   index → login(agent) → cùng session
   → agent-requests: lead/brief của seeker hiện sang đây (đọc homefit-brief-draft + homefit-agent-requests)
        → phản hồi, chốt lịch (homefit-appointments: pending → confirmed)
   → agent-post: tạo tin, AI-2 gợi ý bố cục + checklist trước khi gửi
        → homefit-agent-posts với status = draft → pending
   → agent-posts: sửa/ẩn/rút về nháp/xóa, xuất CSV
   → agent-appointments: xác nhận → hoàn tất / hủy lịch (homefit-appointments: confirmed → completed|cancelled)

[Moderator]  index → login(moderator)
   → moderator-listing-review: hàng đợi status = pending từ agent
        → Duyệt (approved) → tin xuất hiện ở seeker-search | Từ chối (rejected) kèm lý do
   → moderator-report-center: báo cáo status = open từ seeker → giữ nguyên / ẩn tin / từ chối báo cáo
   → moderator-data-quality: danh sách tin thiếu ảnh, thiếu giá, độ tin cậy thấp

[Admin]   index → login(admin)
   → admin-platform-dashboard: tổng số user/tin/report, bộ lọc thời gian
   → admin-user-management: khóa/mở tài khoản, gán perms (homefit-users-db)
   → admin-category-management: thêm/sửa danh mục dự án, khu vực dùng cho bộ lọc
```

Vòng đời trạng thái bản ghi dùng chung cho toàn hệ thống:

| Thực thể | Khoá localStorage | Trạng thái |
|---|---|---|
| Bài đăng | `homefit-agent-posts` | `draft → pending → approved / rejected` (+ ẩn/hiện) |
| Lịch hẹn | `homefit-appointments` | `pending → confirmed → completed / cancelled` |
| Lead / yêu cầu | `homefit-agent-requests` | `new → contacted → scheduled / closed` |
| Báo cáo | `homefit-property-reports` | `open → reviewing → resolved / dismissed` |
| Brief | `homefit-brief-draft` | `draft → published` |
| Nhà đã lưu | `homefit-saved-homes` | `saved → removed` |
| Tài khoản | `homefit-users-db` | `active → banned` |
| Phiên đăng nhập | `homefit-current-session` | `role = seeker \| agent \| moderator \| admin` |

Đồng bộ liên vai trò: mỗi trang lắng nghe `window.addEventListener("storage", ...)` để tab của vai trò khác cập nhật ngay (đã có ở 6 file JS trên `Dev`).

## 4. Liên kết đang thiếu (chết) trên `Dev`

- `assets/js/common.js` điều hướng tới `seeker-profile.html` — file chưa tồn tại ⇒ bấm menu là 404, mục 2.4 trừ -0.10 mỗi lỗi.
- Không có `index.html` và `login.html` ⇒ demo phải gõ tay URL, mục 2.1 trừ -0.20 vì thiếu màn hình dùng chung.
- Chưa có màn hình moderator/admin trong `assets/html` ⇒ mục 2.1 trừ -0.30 vì mới 2 vai trò.
