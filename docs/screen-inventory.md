# HomeFit AI — Bảng kiểm kê màn hình (Screen Inventory)

Cặp tài liệu với `docs/user-flow.md`. Mỗi dòng là một màn hình độc lập của sản phẩm, đặt tên tệp theo chuẩn `role-function.html`; màn hình của Kiểm duyệt viên và Quản trị viên nằm ở thư mục `pages/` của nhánh chung `Homefit Ai`. Ba màn hình AI mô phỏng là màn hình dùng chung, đặt tên theo chuẩn `ai-function.html` và giữ trong `assets/`.

| Vai trò | Mục tiêu người dùng | Nhiệm vụ người dùng | Màn hình | Tệp | CRUD/Trạng thái | AI | SV phụ trách |
|---|---|---|---|---|---|---|---|
| Bốn vai trò | Vào đúng không gian làm việc của vai trò mình | Đăng nhập, đăng ký tài khoản, đặt lại mật khẩu | Đăng nhập | `assets/html/login.html` | C, R, U · phiên `homefit-current-session`, tài khoản `active ↔ suspended` | — | Dùng chung |
| Dùng chung | Diễn đạt nhu cầu sống thành bộ tiêu chí có trọng số | Mở trang AI từ brief, chạy phân tích, đọc giải thích và % độ tin cậy, chấp nhận hoặc từ chối | AI Lifestyle Matcher | `assets/html/ai-matcher.html` | R, U · nhận brief `homefit-brief-draft`, ghi `weighted-priorities`, kết quả `homefit-ai-matcher` | AI-1 Lifestyle Matcher: Input → Processing → Output → Giải thích → Chấp nhận/Sửa/Từ chối/Tạo lại → Lưu | Dùng chung |
| Dùng chung | Dựng bố cục tin đăng từ chính thông tin môi giới nhập | Mở trang AI kèm mã bài đăng, chạy phân tích, xác nhận để ghi bố cục vào mô tả | AI Listing Summary | `assets/html/ai-summary.html` | R, U · nhận bài đăng `?id=`, ghi mô tả vào `homefit-agent-posts`, kết quả `homefit-ai-summary` | AI-2 Listing Summary: Input → Processing → Output → Giải thích → Chấp nhận/Sửa/Từ chối/Tạo lại → Lưu | Dùng chung |
| Dùng chung | Xếp hạng các căn đã lưu theo tiêu chí của brief | Mở trang AI kèm danh sách mã nhà, chạy so sánh, đọc lý do và xác nhận kết quả | AI Comparison Assistant | `assets/html/ai-compare.html` | R, U · nhận `homefit-saved-homes` + brief, kết quả `homefit-ai-compare` | AI-3 Comparison Assistant: Input → Processing → Output → Giải thích → Chấp nhận/Sửa/Từ chối/Tạo lại → Lưu | Dùng chung |
| Người tìm nhà | Tìm được căn nhà hợp nhu cầu sống | Tìm và lọc bài đăng bán/cho thuê theo từ khóa, bộ lọc đa tiêu chí và brief | Tìm nhà | `assets/html/seeker-search.html` | R · tin `approved` hiển thị, tin `draft/pending` bị ẩn | Đề xuất mức độ khớp theo brief (AI-1 Lifestyle Matcher) | SV1 |
| Người tìm nhà | Hiểu rõ giá trị thực của một căn | Xem thư viện ảnh, thông số, tiện ích và đặt lịch xem nhà | Chi tiết nhà | `assets/html/seeker-detail.html` | R, Create (lịch hẹn) · `pending → confirmed` | Living Summary tóm tắt ưu/nhược điểm căn nhà | SV1 |
| Người tìm nhà | Diễn đạt nhu cầu sống thành bản mô tả có cấu trúc | Điền biểu mẫu nhu cầu, mở trang AI để duyệt gợi ý tiêu chí rồi lưu brief | Tạo brief tìm nhà | `assets/html/seeker-brief-form.html` | C, U · brief `draft → published`, lead `new` | Khối kết quả chỉ đọc của AI-1, liên kết sang `ai-matcher.html` | SV1 |
| Người tìm nhà | So sánh nhiều căn đã chọn | Lưu/bỏ căn, mở trang AI để lấy bảng tiêu chí và xếp hạng | Nhà đã lưu | `assets/html/seeker-saved.html` | C, R, U, D · `saved → removed` | Bảng so sánh và khối xếp hạng chỉ đọc, nhận kết quả AI-3, liên kết sang `ai-compare.html` | SV1 |
| Người tìm nhà | Chọn người đồng hành phù hợp brief | Lọc danh sách môi giới theo chuyên khu và mức khớp | Chọn môi giới | `assets/html/seeker-agent-selection.html` | R, U · môi giới đã chọn `homefit-selected-agent` | Xếp hạng môi giới theo brief | SV1 |
| Người tìm nhà | Đánh giá năng lực từng môi giới | Xem hồ sơ, bài đăng và phản hồi của môi giới | Hồ sơ môi giới | `assets/html/seeker-agent-profile.html` | R · hồ sơ môi giới + tin `approved` của môi giới | — | SV1 |
| Người tìm nhà | Phản ánh tin đăng sai lệch | Soạn và gửi báo cáo cho kiểm duyệt viên | Báo cáo bài đăng | `assets/html/seeker-report.html` | C · report `pending` vào hàng đợi kiểm duyệt | Phân loại mức độ nghiêm trọng của báo cáo | SV1 |
| Môi giới | Đăng tin chất lượng, đủ hồ sơ | Nhập thông tin tin đăng, tải ảnh, đối chiếu checklist trước khi gửi | Tạo bài đăng | `assets/html/agent-post.html` | C, U · tin `draft → pending` | Khối bố cục 4 khối chỉ đọc, nhận kết quả AI-2, liên kết sang `ai-summary.html` | SV1 |
| Môi giới | Kiểm soát vòng đời tin đăng | Sửa, ẩn/hiện, rút về nháp, xóa và xuất dữ liệu | Quản lý bài đăng | `assets/html/agent-posts.html` | R, U, D · tin `draft → pending`, nhận `approved / rejected / revision` | Chấm điểm độ hoàn thiện từng tin | SV1 |
| Môi giới | Bắt đúng khách tiềm năng | Đọc brief của người tìm nhà, phản hồi và đề xuất khung giờ | Yêu cầu & khách hàng | `assets/html/agent-requests.html` | R, U · lead `new → consulting → scheduled → completed / rejected` | Gợi ý khung giờ và kịch bản tư vấn theo brief | SV1 |
| Môi giới | Sắp xếp lịch xem nhà khoa học | Chuyển đổi lịch tuần/tháng, xác nhận, hoàn tất hoặc hủy hẹn | Lịch hẹn | `assets/html/agent-appointments.html` | R, U, D · hẹn `pending → confirmed → completed/cancelled` | — | SV1 |
| Kiểm duyệt viên | Chỉ tin đạt chuẩn lên sàn | Duyệt hàng đợi tin chờ, đối chiếu ảnh và thông tin, chấp nhận hoặc từ chối kèm lý do | Duyệt bài đăng | `Homefit Ai/pages/moderator-listing-review.html` | R, U · tin `pending → approved / rejected / revision`, nhận xét tối thiểu 10 ký tự | Cảnh báo tin nghi vấn thiếu căn cứ | SV2 |
| Kiểm duyệt viên | Xử lý phản ánh của người dùng | Mở báo cáo, kiểm tra tin bị phản ánh, kết luận và ghi hướng xử lý | Trung tâm xử lý vi phạm | `Homefit Ai/pages/moderator-report-center.html` | R, U · report `pending → resolved`, liên kết sang tin bị phản ánh | Phân loại vi phạm và mức độ ưu tiên xử lý | SV2 |
| Kiểm duyệt viên | Duy trì chất lượng dữ liệu toàn sàn | Audit pháp lý, ảnh thật và nhãn lối sống, bật/tắt quyền AI cho từng tin | Giám sát chất lượng dữ liệu | `Homefit Ai/pages/moderator-data-quality.html` | R, U · tin `approved → revision`, `aiEligible` bật/tắt | Chấm điểm chất lượng dữ liệu từng tin | SV2 |
| Quản trị viên | Nắm tình hình nền tảng | Xem KPI tin, lead, lịch hẹn, báo cáo, cảnh báo nghiệp vụ và xuất CSV | Dashboard nền tảng | `Homefit Ai/pages/admin-platform-dashboard.html` | R · tổng hợp các khoá dữ liệu, đối chiếu `assets/data/data.json` | Biểu đồ xu hướng đăng tin và duyệt tin | SV2 |
| Quản trị viên | Kiểm soát tài khoản và phân quyền | Tạo tài khoản, gán vai trò, khóa hoặc mở lại quyền | Tài khoản & phân quyền | `Homefit Ai/pages/admin-user-management.html` | C, R, U, D · tài khoản `active ↔ suspended`, nhật ký thao tác | — | SV2 |
| Quản trị viên | Chuẩn hóa dữ liệu danh mục | Thêm/sửa khu vực, loại hình, tiện ích dùng cho bộ lọc toàn hệ thống | Taxonomy | `Homefit Ai/pages/admin-category-management.html` | C, R, U, D · danh mục `active ↔ draft`, trọng số 1–100 | Đếm tin khớp từ khóa của danh mục | SV2 |

## Bốn vai trò của hệ thống

| Vai trò | Trách nhiệm chính | Số màn hình | SV phụ trách |
|---|---|---|---|
| Dùng chung | Đăng nhập, đăng ký, đặt lại mật khẩu, định tuyến vai trò và ba màn hình AI mô phỏng | 4 | Cả hai SV |
| Người tìm nhà | Tìm, lưu và so sánh nhà theo nhu cầu sống | 7 | SV1 |
| Môi giới | Quản lý tin đăng và khách hàng tiềm năng | 4 | SV1 |
| Kiểm duyệt viên | Duyệt tin đăng và xử lý báo cáo | 3 | SV2 |
| Quản trị viên | Quản lý tài khoản và danh mục nền tảng | 3 | SV2 |
