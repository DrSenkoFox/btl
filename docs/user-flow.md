# HomeFit AI — Luồng người dùng (User Flow) & Sitemap

Tài liệu cặp với `docs/screen-inventory.md`. Ánh xạ P1–P4 → vai trò → màn hình → luồng nghiệp vụ đầu–cuối.

## 1. Vấn đề → vai trò → màn hình

| Vấn đề | Nội dung | Vai trò | Màn hình |
|---|---|---|---|
| P1 | Nhu cầu sống khó biểu diễn bằng bộ lọc giá/diện tích | Người tìm nhà | `seeker-brief-form.html`, `ai-matcher.html`, `seeker-search.html`, `seeker-detail.html` |
| P2 | Môi giới nhận brief không có cấu trúc | Môi giới | `agent-requests.html`, `agent-post.html`, `ai-summary.html` |
| P3 | Khó so sánh nhiều tin đăng | Người tìm nhà | `seeker-saved.html`, `ai-compare.html` |
| P4 | Tin đăng cần được kiểm duyệt chất lượng | Kiểm duyệt viên, Quản trị viên | `moderator-listing-review.html`, `moderator-report-center.html`, `moderator-data-quality.html`, `admin-platform-dashboard.html` (nhánh chung `Homefit Ai/pages/`) |

## 2. Sitemap theo vai trò

```
login.html (điểm vào hệ thống + định tuyến theo vai trò)
├── DÙNG CHUNG
│   ├── login.html                     Đăng nhập / đăng ký / đặt lại mật khẩu
│   ├── ai-matcher.html                AI-1 Lifestyle Matcher
│   ├── ai-summary.html                AI-2 Listing Summary
│   └── ai-compare.html                AI-3 Comparison Assistant
├── NGƯỜI TÌM NHÀ (SV1)
│   ├── seeker-search.html             Tìm & lọc theo brief, điểm vào nghiệp vụ
│   ├── seeker-detail.html             Chi tiết nhà + Living Summary
│   ├── seeker-brief-form.html         Tạo brief + khối kết quả AI-1
│   ├── seeker-saved.html              Nhà đã lưu + bảng so sánh của AI-3
│   ├── seeker-agent-selection.html    Chọn môi giới
│   ├── seeker-agent-profile.html      Hồ sơ môi giới
│   └── seeker-report.html             Báo cáo bài đăng
├── MÔI GIỚI (SV1)
│   ├── agent-post.html                Tạo bài đăng + khối bố cục của AI-2
│   ├── agent-posts.html               Quản lý bài đăng, xuất CSV
│   ├── agent-requests.html            Lead & yêu cầu từ brief
│   └── agent-appointments.html        Lịch hẹn xem nhà
├── KIỂM DUYỆT VIÊN (SV2 · nhánh chung Homefit Ai/pages/)
│   ├── moderator-listing-review.html  Duyệt tin chờ
│   ├── moderator-report-center.html   Xử lý báo cáo
│   └── moderator-data-quality.html    Giám sát chất lượng dữ liệu
└── QUẢN TRỊ VIÊN (SV2 · nhánh chung Homefit Ai/pages/)
    ├── admin-platform-dashboard.html  Thống kê nền tảng
    ├── admin-user-management.html     Tài khoản & phân quyền
    └── admin-category-management.html Taxonomy danh mục
```

## 3. Hành trình đầu–cuối xuyên bốn vai trò

```
[Đăng nhập]  login.html: nhập email + mật khẩu → api.js đọc `homefit-users-db`
   → đăng ký tài khoản mới, đặt lại mật khẩu, đánh dấu "Ghi nhớ đăng nhập"
   → phiên lưu ở `homefit-current-session`, login.js chuyển vai trò:
        seeker → seeker-search.html, agent → agent-posts.html
        moderator/admin → màn hình vận hành ở nhánh chung

[Người tìm nhà]  seeker-search → lọc từ khóa + ≥2 tiêu chí + sắp xếp
   → seeker-brief-form: nhập nhu cầu → mở ai-matcher.html (Input → Processing → Output
        → % độ tin cậy & tiêu chí khớp → Chấp nhận/Sửa/Từ chối/Tạo lại → Lưu vào brief)
        → quay lại brief thấy khối kết quả AI-1 và `weighted-priorities` đã ghi
   → seeker-detail: xem ảnh & AI Living Summary → bấm lưu căn → bấm đặt lịch xem nhà
   → seeker-saved: mở ai-compare.html kèm danh sách mã căn → xác nhận → bảng tiêu chí
        và xếp hạng hiện lại ở trang nhà đã lưu
   → seeker-agent-selection → seeker-agent-profile: chọn môi giới, gửi lead
   → seeker-report: gửi báo cáo, report `pending` vào hàng đợi kiểm duyệt

[Môi giới]  agent-requests: lead và brief của người tìm nhà hiện vào hàng đợi
   → phản hồi, đề xuất khung giờ → chốt lịch (hẹn `pending → confirmed`)
   → agent-post: nhập tin rồi mở ai-summary.html?id=bản nháp → xác nhận → bố cục 4 khối
        ghi vào mô tả tin, khối kết quả AI-2 hiện ở sidebar → tin `draft → pending`
   → agent-posts: sửa / ẩn-hiện / rút về nháp / xóa, xuất CSV
   → agent-appointments: xác nhận → hoàn tất hoặc hủy lịch

[Kiểm duyệt viên]  moderator-listing-review: hàng đợi tin `pending` từ môi giới
   → Duyệt (`approved`) để tin xuất hiện ở seeker-search, hoặc Từ chối (`rejected`) kèm lý do
   → moderator-report-center: nhận report `pending` → ghi hướng xử lý rồi đóng (`resolved`)
   → moderator-data-quality: đối chiếu pháp lý + ảnh thật, bật/tắt quyền AI, tin thiếu dữ liệu chuyển `revision`

[Quản trị viên]  admin-platform-dashboard: KPI tin/lead/lịch hẹn/báo cáo, cảnh báo nghiệp vụ, xuất CSV, đối chiếu `assets/data/data.json`
   → admin-user-management: tạo, sửa, xóa tài khoản, phân quyền, tạm khoá `suspended` kèm lý do
   → admin-category-management: danh mục khu vực/loại hình nuôi bộ lọc của seeker-search
```

## 4. Liên thông dữ liệu giữa các vai trò

| Thực thể | Khoá localStorage | Vòng đời trạng thái | Vai trò ghi | Vai trò đọc |
|---|---|---|---|---|
| Bài đăng | `homefit-agent-posts` | `draft → pending → approved / rejected / revision` | Môi giới, Kiểm duyệt viên | Người tìm nhà, Quản trị viên |
| Brief nhu cầu | `homefit-brief-draft` | `draft → published` | Người tìm nhà, `ai-matcher.html` | Môi giới, AI Comparison |
| Nhà đã lưu | `homefit-saved-homes` | `saved → removed` | Người tìm nhà | AI Comparison |
| Kết quả AI-1 | `homefit-ai-matcher` | `chưa duyệt → đã chấp nhận / đã từ chối` | `ai-matcher.html` | `seeker-brief-form.html` |
| Kết quả AI-2 | `homefit-ai-summary` | `chưa duyệt → đã chấp nhận / đã từ chối` | `ai-summary.html` | `agent-post.html` |
| Kết quả AI-3 | `homefit-ai-compare` | `chưa duyệt → đã chấp nhận / đã từ chối` | `ai-compare.html` | `seeker-saved.html` |
| Lead / yêu cầu | `homefit-agent-requests` | `new → consulting → scheduled → completed / rejected` | Người tìm nhà, Môi giới | Môi giới, Quản trị viên |
| Lịch hẹn | `homefit-appointments` | `pending → confirmed → completed / cancelled` | Người tìm nhà, Môi giới | Môi giới, Quản trị viên |
| Báo cáo | `homefit-property-reports` | `pending → resolved` | Người tìm nhà, Kiểm duyệt viên | Kiểm duyệt viên, Quản trị viên |
| Tài khoản | `homefit-users-db` | `active ↔ suspended` | Quản trị viên, chính người dùng qua `login.html` | Kiểm duyệt viên, Quản trị viên |
| Phiên đăng nhập | `homefit-current-session` | `login → logout` | Bốn vai trò qua `login.html` | Điều hướng vai trò |

Dữ liệu mẫu của các thực thể trên nằm ở `assets/data/data.json`, được `assets/js/api.js` nạp bằng `fetch()` trong `try/catch/finally` rồi gieo vào `localStorage` ở lần chạy đầu; `HomeFitAPI.ready` là promise để các trang chờ gieo xong mới đọc. Mỗi màn hình lắng nghe sự kiện `storage` nên thao tác ở tab của vai trò này hiển thị ngay ở tab của vai trò kia — mắt xích chứng minh sản phẩm là một hệ thống thống nhất, không phải các trang rời rạc.

## 5. Ba tính năng AI theo đặc tả đề tài

| Mã | Tính năng | Vai trò | Màn hình AI | Màn hình vai trò nhận kết quả | Luồng 6 bước |
|---|---|---|---|---|---|
| AI-1 | Lifestyle Matcher — chuyển nhu cầu sống thành tiêu chí có trọng số | Dùng chung | `ai-matcher.html` | `seeker-brief-form.html` | Input → Processing → Output → Giải thích % độ tin cậy & tiêu chí khớp → Chấp nhận/Sửa/Từ chối/Tạo lại → Lưu vào brief |
| AI-2 | Listing Summary — tóm tắt và dựng bố cục tin đăng 4 khối | Dùng chung | `ai-summary.html` | `agent-post.html` | Input → Processing → Output → Giải thích theo đầu vào → Chấp nhận/Sửa/Từ chối/Tạo lại → Ghi mô tả tin đăng |
| AI-3 | Comparison Assistant — xếp hạng nhà đã lưu theo brief | Dùng chung | `ai-compare.html` | `seeker-saved.html` | Input → Processing → Output → Giải thích % độ tin cậy & lý do xếp hạng → Chấp nhận/Sửa/Từ chối/Tạo lại → Lưu kết quả so sánh |

Ba màn hình AI là màn hình dùng chung: nhận đối tượng cần phân tích qua tham số URL (`?id=` bài đăng, `?ids=` danh sách nhà) hoặc qua kho dữ liệu chung (`homefit-brief-draft`, `homefit-saved-homes`), chạy phân tích ở trang riêng, rồi ghi kết quả đã chấp nhận vào `localStorage` để trang vai trò hiển thị lại trong khối chỉ đọc. Trang vai trò không còn nút phân tích, chỉ còn khối kết quả và liên kết mở trang AI.

Kịch bản AI không chắc chắn: khi brief thiếu dữ liệu hoặc độ tin cậy thấp, hệ thống hiển thị cảnh báo "chưa đủ dữ liệu để xác định tiêu chí" thay vì trả kết quả giả, kèm hướng dẫn bổ sung thông tin.
