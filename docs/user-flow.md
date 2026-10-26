# HomeFit AI — Luồng người dùng (User Flow) & Sitemap

Tài liệu cặp với `docs/screen-inventory.md`. Ánh xạ P1–P4 → vai trò → màn hình → luồng nghiệp vụ đầu–cuối.

## 1. Vấn đề → vai trò → màn hình

| Vấn đề | Nội dung | Vai trò | Màn hình |
|---|---|---|---|
| P1 | Nhu cầu sống khó biểu diễn bằng bộ lọc giá/diện tích | Người tìm nhà | `seeker-brief-form.html`, `seeker-search.html`, `seeker-detail.html` |
| P2 | Môi giới nhận brief không có cấu trúc | Môi giới | `agent-requests.html`, `agent-post.html` |
| P3 | Khó so sánh nhiều tin đăng | Người tìm nhà | `seeker-saved.html` |
| P4 | Tin đăng cần được kiểm duyệt chất lượng | Kiểm duyệt viên, Quản trị viên | `moderator-listing-review.html`, `moderator-report-center.html`, `moderator-data-quality.html` |

## 2. Sitemap theo vai trò

```
seeker-search.html (điểm vào sản phẩm + thanh chuyển vai trò)
├── NGƯỜI TÌM NHÀ (SV1)
│   ├── seeker-search.html           Tìm & lọc theo brief
│   ├── seeker-detail.html           Chi tiết nhà + Living Summary
│   ├── seeker-brief-form.html       Tạo brief + AI Lifestyle Matcher
│   ├── seeker-saved.html            Nhà đã lưu + AI Comparison
│   ├── seeker-agent-selection.html  Chọn môi giới
│   ├── seeker-agent-profile.html    Hồ sơ môi giới
│   └── seeker-report.html           Báo cáo bài đăng
├── MÔI GIỚI (SV1)
│   ├── agent-post.html              Tạo bài đăng + AI gợi ý bố cục
│   ├── agent-posts.html             Quản lý bài đăng, xuất CSV
│   ├── agent-requests.html          Lead & yêu cầu từ brief
│   └── agent-appointments.html      Lịch hẹn xem nhà
├── KIỂM DUYỆT VIÊN (SV2)
│   ├── moderator-listing-review.html Duyệt tin chờ
│   ├── moderator-report-center.html  Xử lý báo cáo
│   └── moderator-data-quality.html   Giám sát chất lượng dữ liệu
└── QUẢN TRỊ VIÊN (SV2)
    ├── admin-platform-dashboard.html Thống kê nền tảng
    ├── admin-user-management.html    Tài khoản & phân quyền
    └── admin-category-management.html Taxonomy danh mục
```

## 3. Hành trình đầu–cuối xuyên bốn vai trò

```
[Người tìm nhà]  seeker-search → lọc từ khóa + ≥2 tiêu chí + sắp xếp
   → seeker-brief-form: nhập nhu cầu → AI-1 phân tích (Input → Processing → Output
        → % độ tin cậy & tiêu chí khớp → Chấp nhận/Sửa/Từ chối/Tạo lại → Lưu brief)
   → seeker-detail: xem ảnh & AI Living Summary → bấm lưu căn → bấm đặt lịch xem nhà
   → seeker-saved: AI-3 so sánh và xếp hạng các căn đã lưu
   → seeker-agent-selection → seeker-agent-profile: chọn môi giới, gửi lead
   → seeker-report: báo tin đăng sai lệch cho kiểm duyệt viên

[Môi giới]  agent-requests: lead và brief của người tìm nhà hiện vào hàng đợi
   → phản hồi, đề xuất khung giờ → chốt lịch (hẹn `pending → confirmed`)
   → agent-post: tạo tin, AI-2 gợi ý bố cục + checklist trước khi gửi → tin `draft → pending`
   → agent-posts: sửa / ẩn-hiện / rút về nháp / xóa, xuất CSV
   → agent-appointments: xác nhận → hoàn tất hoặc hủy lịch

[Kiểm duyệt viên]  moderator-listing-review: hàng đợi tin `pending` từ môi giới
   → Duyệt (`approved`) để tin xuất hiện ở seeker-search, hoặc Từ chối (`rejected`) kèm lý do
   → moderator-report-center: nhận report `open` → giữ nguyên / ẩn tin / `dismissed`
   → moderator-data-quality: tin thiếu ảnh, thiếu giá → yêu cầu `needs-revision`

[Quản trị viên]  admin-platform-dashboard: thống kê tin, lead, báo cáo theo bộ lọc
   → admin-user-management: gán quyền, khóa/mở tài khoản
   → admin-category-management: danh mục khu vực/loại hình nuôi bộ lọc của seeker-search
```

## 4. Liên thông dữ liệu giữa các vai trò

| Thực thể | Khoá localStorage | Vòng đời trạng thái | Vai trò ghi | Vai trò đọc |
|---|---|---|---|---|
| Bài đăng | `homefit-agent-posts` | `draft → pending → approved / rejected → needs-revision` | Môi giới | Người tìm nhà, Kiểm duyệt viên, Quản trị viên |
| Brief nhu cầu | `homefit-brief-draft` | `draft → published` | Người tìm nhà | Môi giới, AI Lifestyle Matcher |
| Nhà đã lưu | `homefit-saved-homes` | `saved → removed` | Người tìm nhà | AI Comparison |
| Lead / yêu cầu | `homefit-agent-requests` | `new → contacted → scheduled / closed` | Người tìm nhà | Môi giới |
| Lịch hẹn | `homefit-appointments` | `pending → confirmed → completed / cancelled` | Người tìm nhà | Môi giới |
| Báo cáo | `homefit-property-reports` | `open → reviewing → resolved / dismissed` | Người tìm nhà | Kiểm duyệt viên, Quản trị viên |
| Tài khoản | `homefit-users-db` | `active → banned` | Quản trị viên | Kiểm duyệt viên |

Mỗi màn hình lắng nghe `window.addEventListener("storage", ...)` nên thao tác ở tab của vai trò này cập nhật ngay sang tab của vai trò kia — đây là mắt xích chứng minh sản phẩm là một hệ thống thống nhất, không phải các trang rời rạc.

## 5. Ba tính năng AI theo đặc tả đề tài

| Mã | Tính năng | Vai trò | Màn hình | Luồng 6 bước |
|---|---|---|---|---|
| AI-1 | Lifestyle Matcher — chấm điểm phù hợp theo brief | Người tìm nhà | `seeker-brief-form.html`, `seeker-search.html` | Input → Processing → Output → Giải thích % độ tin cậy & tiêu chí khớp → Chấp nhận/Sửa/Từ chối/Tạo lại → Lưu vào brief |
| AI-2 | Listing Summary — tóm tắt và gợi ý bố cục tin đăng | Môi giới | `agent-post.html` | Input → Processing → Output → Giải thích theo đầu vào → Lưu/Sửa/Từ chối → Cập nhật mô tả tin đăng |
| AI-3 | Comparison Assistant — xếp hạng nhà đã lưu | Người tìm nhà | `seeker-saved.html` | Chọn căn → Phân tích → Bảng xếp hạng → Lý do đề xuất → Điều chỉnh tiêu chí → Lưu kết quả so sánh |

Kịch bản AI không chắc chắn: khi brief thiếu dữ liệu hoặc độ tin cậy thấp, hệ thống hiển thị cảnh báo "chưa đủ dữ liệu để xác định tiêu chí" thay vì trả kết quả giả, kèm nút bổ sung thông tin.
