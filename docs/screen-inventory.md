# HomeFit AI — Bảng kiểm kê màn hình (Screen Inventory)

Mắt xích 5 của chuỗi truy vết, dùng cho ĐK1 và mục 1.2 (0.30 điểm).
Cột **Tệp** là đường dẫn thật trong `assets/html/`; cột **Nguồn** cho biết màn hình đã code xong hay còn nằm ở bản `origin/main`.

| Role | User Goal | User Task | Screen | File | CRUD | States | AI | Assignee | Task ID | Branch | OBS |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Dùng chung | Vào hệ thống theo đúng vai trò | Chọn vai trò trên Role Switcher | Trang chủ | `index.html` | R | CHƯA TẠO | — | SV1 | TASK-01 | `feature/shared-index` | CHƯA QUAY |
| Dùng chung | Đăng nhập phiên làm việc | Nhập email/mật khẩu, validate | Đăng nhập | `login.html` | R, Create session | CHƯA TẠO | — | SV1 | TASK-02 | `feature/shared-login` | CHƯA QUAY |
| Dùng chung | Xem/sửa thông tin tài khoản | Cập nhật hồ sơ cá nhân | Tài khoản | `profile.html` | U | CHƯA TẠO (menu đang trỏ `seeker-profile.html` — liên kết chết) | — | SV1 | TASK-03 | `feature/shared-profile` | CHƯA QUAY |
| Người tìm nhà | Tìm nhà hợp nhu cầu sống | Gõ từ khóa, lọc ≥2 tiêu chí, sắp xếp | Tìm nhà | `seeker-search.html` | R, Delete (bỏ lưu) | Normal, Empty — thiếu Loading, Error | AI-1 điểm khớp theo brief | SV1 | TASK-04 | `feature/seeker-search` | CHƯA QUAY |
| Người tìm nhà | Hiểu rõ một căn nhà | Xem ảnh, thông tin, đặt lịch xem | Chi tiết nhà | `seeker-detail.html` | R, Create (lịch hẹn) | Normal, Empty — thiếu Loading, Error | AI Living Summary (thiếu Processing, thiếu nút Accept/Edit/Reject) | SV1 | TASK-05 | `feature/seeker-detail` | CHƯA QUAY |
| Người tìm nhà | Diễn đạt nhu cầu thành brief | Điền form, AI gợi ý tiêu chí | Tạo brief | `seeker-brief-form.html` | C, U | Normal, Empty, Error — thiếu Loading | AI-1 Lifestyle Matcher (đủ 6 bước, có Confidence + Failure UX) | SV1 | TASK-06 | `feature/seeker-brief` | CHƯA QUAY |
| Người tìm nhà | So sánh các căn đã lưu | Lưu/bỏ căn, đọc bảng so sánh | Nhà đã lưu | `seeker-saved.html` | C, R, U, D | Normal, Empty — thiếu Loading, Error | AI-3 Comparison Assistant (thiếu Processing, thiếu nút điều khiển) | SV1 | TASK-07 | `feature/seeker-saved` | CHƯA QUAY |
| Người tìm nhà | Chọn người đồng hành | Lọc và chọn môi giới theo brief | Chọn môi giới | `seeker-agent-selection.html` | R, U (gán lead) | Normal, Empty — thiếu Loading, Error | Gợi ý khớp brief (không có Processing) | SV1 | TASK-08 | `feature/seeker-agent-select` | CHƯA QUAY |
| Người tìm nhà | Đánh giá năng lực môi giới | Xem hồ sơ, bài đăng, phản hồi | Hồ sơ môi giới | `seeker-agent-profile.html` | R | Normal, Empty — thiếu Loading, Error | — | SV1 | TASK-09 | `feature/seeker-agent-profile` | CHƯA QUAY |
| Người tìm nhà | Báo tin đăng sai lệch | Gửi report cho kiểm duyệt | Báo cáo bài đăng | `seeker-report.html` | C | Normal — thiếu Empty, Loading, Error | — | SV1 | TASK-10 | `feature/seeker-report` | CHƯA QUAY |
| Môi giới | Đăng tin chất lượng | Nhập thông tin, AI gợi ý bố cục, checklist | Tạo bài đăng | `agent-post.html` | C, U | Normal, Error — thiếu Loading, Empty | AI-2 Listing Summary / gợi ý bố cục (có nút Áp dụng, thiếu Processing) | SV3 | TASK-11 | `feature/agent-post-create` | CHƯA QUAY |
| Môi giới | Quản lý vòng đời tin | Sửa/ẩn/rút nháp/xóa, xuất CSV | Quản lý bài đăng | `agent-posts.html` | R, U, D | Normal, Empty — thiếu Loading, Error | Điểm tin cậy từng tin | SV3 | TASK-12 | `feature/agent-listing-mgmt` | CHƯA QUAY |
| Môi giới | Bắt khách tiềm năng | Đọc brief seeker, phản hồi, chốt lịch | Yêu cầu & khách hàng | `agent-requests.html` | R, U | Normal, Empty — thiếu Loading, Error | Xếp hạng lead | SV3 | TASK-13 | `feature/agent-leads` | CHƯA QUAY |
| Môi giới | Sắp lịch xem nhà | Xác nhận/hoàn tất/hủy theo tuần–tháng | Lịch hẹn | `agent-appointments.html` | R, U, D | Normal, Empty — thiếu Loading, Error | Gợi ý khung giờ | SV3 | TASK-14 | `feature/agent-schedule` | CHƯA QUAY |
| Kiểm duyệt viên | Lọc tin đạt chuẩn | Duyệt pending → approved/rejected kèm lý do | Duyệt bài đăng | `moderator-listing-review.html` | R, U | CHƯA port (mới có Normal; 0 Empty/Loading/Error) | Cảnh báo tin nghi vấn | SV2 | TASK-15 | `feature/moderator-review` | CHƯA QUAY |
| Kiểm duyệt viên | Xử lý báo cáo | Mở report, giữ/ẩn tin, kết luận | Trung tâm vi phạm | `moderator-report-center.html` | R, U | CHƯA port (chỉ Normal) | Phân loại mức độ vi phạm | SV2 | TASK-16 | `feature/moderator-reports` | CHƯA QUAY |
| Kiểm duyệt viên | Giám sát chất lượng dữ liệu | Lọc tin thiếu ảnh/giá, độ tin cậy thấp | Giám sát dữ liệu | `moderator-data-quality.html` | R, U | CHƯA port (chỉ Normal) | Chấm điểm chất lượng tin | SV2 | TASK-17 | `feature/moderator-quality` | CHƯA QUAY |
| Quản trị viên | Nhìn toàn sàn | Xem thống kê, lọc theo thời gian/trạng thái | Dashboard nền tảng | `admin-platform-dashboard.html` | R | CHƯA port (chỉ Normal) | Biểu đồ xu hướng | SV2 | TASK-18 | `feature/admin-dashboard` | CHƯA QUAY |
| Quản trị viên | Kiểm soát tài khoản | Khóa/mở tài khoản, gán quyền | Tài khoản & phân quyền | `admin-user-management.html` | R, C, U, D | CHƯA port (chỉ Normal) | — | SV2 | TASK-19 | `feature/admin-users` | CHƯA QUAY |
| Quản trị viên | Chuẩn hóa danh mục | Thêm/sửa khu vực, loại hình dùng cho bộ lọc | Taxonomy | `admin-category-management.html` | C, R, U, D | CHƯA port (chỉ Normal) | — | SV2 | TASK-20 | `feature/admin-taxonomy` | CHƯA QUAY |

Nguồn bản gốc của 6 dòng Kiểm duyệt viên / Quản trị viên: `origin/main` → `Homefit Ai/pages/`, có `js/api.js` với 8 khoá `homefit-*` và `js/modules/{moderator,admin}.js`.

## Tổng kết theo vai trò

| Vai trò | Đã code trên `Dev` | Cần port từ `main` | Cần tạo mới | Tổng màn hình |
|---|---|---|---|---|
| Dùng chung | 0 | 0 (`index.html` của main chỉ là redirect) | 3 | 3 |
| Người tìm nhà | 7 | 0 | 0 | 7 |
| Môi giới | 4 | 0 | 0 | 4 |
| Kiểm duyệt viên | 0 | 3 | 0 | 3 |
| Quản trị viên | 0 | 3 | 0 | 3 |
| **Cộng** | **11** | **6** | **3** | **20** |

## Hole cần xử lý trước khi chốt bảng

1. Loading/Skeleton **chưa tồn tại trên bất kỳ màn hình nào** ⇒ mục 2.3 mất điểm và cả 4 tính năng AI thiếu bước 2 trong 6 bước AI UX.
2. Error State chỉ có ở `agent-post.html`, `agent-requests.html`, `seeker-brief-form.html`; các trang còn lại gộp Empty chung với lỗi ⇒ -0.15.
3. 6 trang moderator/admin chưa có Empty/Loading/Error và dùng 13–15 thẻ `<div>` mỗi trang; khi port phải chuyển sang thẻ ngữ nghĩa và tách CSS theo từng trang.
4. Số video OBS bắt buộc = số dòng "đã hoàn thành" của bảng này (mục 8.1), nên chỉ đánh dấu Hoàn thành khi màn hình đủ Definition of Done 14 bước.
