# HomeFit AI – Khám phá nhà ở theo nhu cầu sống

## Ngữ cảnh
Bộ lọc giá/diện tích truyền thống trong tìm kiếm nhà ở không phản ánh đầy đủ nhu cầu sống mềm như: gần trường học, không gian yên tĩnh, góc làm việc (WFH) hay tiện ích phù hợp cho gia đình.

## Phát biểu vấn đề
- **P1.** Nhu cầu sống khó biểu diễn bằng bộ lọc truyền thống.
- **P2.** Môi giới nhận brief (bản mô tả nhu cầu) không có cấu trúc.
- **P3.** Khó so sánh nhiều listing (tin đăng) bất động sản.
- **P4.** Listing cần được kiểm duyệt chất lượng.

## Mục tiêu
- **O1.** Biến bài toán thực tế thành một sản phẩm Web Frontend có hành trình người dùng rõ ràng.
- **O2.** Thiết kế đầy đủ giao diện cho từng vai trò, bảo đảm mỗi vai trò có ít nhất 3 màn hình.
- **O3.** Thể hiện các thao tác CRUD hoặc trạng thái nghiệp vụ phù hợp.
- **O4.** Sử dụng JavaScript/DOM cho các tính năng: tìm kiếm, lọc, kiểm tra hợp lệ, cửa sổ bật, thẻ, trạng thái và kết xuất dữ liệu.
- **O5.** Sử dụng JSON giả lập / LocalStorage / MockAPI / API công khai.
- **O6.** Thiết kế ít nhất 3 trải nghiệm AI mô phỏng được ở Frontend.
- **O7.** Tổ chức làm việc nhóm bằng Trello/Jira/Notion và Git/GitHub theo quy trình chuẩn.

## Các vai trò
| Vai trò | Trách nhiệm chính |
|---|---|
| Người tìm nhà | Tìm, lưu và so sánh |
| Môi giới | Quản lý listing và lead (khách hàng tiềm năng) |
| Kiểm duyệt viên | Duyệt listing và xử lý report (báo cáo) |
| Quản trị viên | Quản lý taxonomy (danh mục) và tài khoản |

## Luồng người dùng tổng quát và bảng kiểm kê màn hình
- Trong repository: [`docs/user-flow.md`](docs/user-flow.md) và [`docs/screen-inventory.md`](docs/screen-inventory.md)
- Bản Word: https://onedrive.live.com/:w:/g/personal/80e3254865fce49f/IQAoU6TwhOFaSKJ2k7aJPt--ATGKnX_isArGiNxQMDBSoSI?rtime=P1tP-_ky30g&redeem=aHR0cHM6Ly8xZHJ2Lm1zL3cvYy84MGUzMjU0ODY1ZmNlNDlmL0lRQW9VNlR3aE9GYVNLSjJrN2FKUHQtLUFUR0tuWF9pc0FyR2lOeFFNREJTb1NJP2U9SFJwcmhFJnphcnNyYz00MTAmdXRtX3NvdXJjZT16YWxvJnV0bV9tZWRpdW09emFsbyZ1dG1fY2FtcGFpZ249emFsbw


## Tính năng AI
- **AI-1: Lifestyle Matcher**
  - **Mô tả:** Chấm điểm mức độ phù hợp của bất động sản dựa theo housing brief (bản tóm tắt nhu cầu).
  - **Luồng UX:** Người dùng nhập mô tả nhu cầu $\rightarrow$ Trạng thái đang xử lý $\rightarrow$ Hiển thị kết quả $\rightarrow$ Giải thích lý do / tiêu chí khớp $\rightarrow$ Cung cấp nút Chấp nhận/Sửa/Từ chối/Tạo lại $\rightarrow$ Cập nhật vào hệ thống.
- **AI-2: Listing Summary**
  - **Mô tả:** Tóm tắt ưu, nhược điểm của bất động sản cho Môi giới.
  - **Luồng UX:** Môi giới nhập thông tin cơ bản $\rightarrow$ Trạng thái đang xử lý $\rightarrow$ Hiển thị tóm tắt $\rightarrow$ AI giải thích dựa trên đầu vào $\rightarrow$ Các tùy chọn kiểm soát (Lưu, Sửa, Từ chối) $\rightarrow$ Cập nhật mô tả tin đăng.
- **AI-3: Comparison Assistant**
  - **Mô tả:** Trợ lý xếp hạng và so sánh các căn nhà đã lưu dựa trên tiêu chí cá nhân của Người tìm nhà.
  - **Luồng UX:** Lựa chọn các căn nhà $\rightarrow$ Quá trình phân tích $\rightarrow$ Đưa ra bảng xếp hạng/so sánh $\rightarrow$ Hiển thị lý do đề xuất $\rightarrow$ Tùy chọn điều chỉnh $\rightarrow$ Lưu kết quả so sánh.

## Công nghệ sử dụng
- **Frontend:** HTML5, CSS3, JavaScript (DOM, Events, Form Validation)
- **Quản lý dữ liệu:** JSON giả lập `assets/data/data.json`
- **Quy trình làm việc:** Git, GitHub, [Trello/Jira/Notion]
- **Thiết kế:** https://www.figma.com/design/Cj1buthUhvqMWrCSWhMjR6/Untitled?node-id=0-1&t=ds9PjqhDfzBV073Y-1

## Thành viên nhóm và Trách nhiệm
| Tên thành viên | Vai trò phụ trách | Trách nhiệm chéo xuyên suốt |
|---|---|---|
| [SV1: Họ và tên] | **Người tìm nhà** (Tìm, lưu, so sánh) & **Môi giới** (Quản lý listing và lead) | Hệ thống thiết kế (Design System) / Điều hướng / Khả năng tiếp cận (Accessibility) / Kiến trúc JavaScript / Dữ liệu giả lập / Tương tác AI UX |
| [SV2: Nguyễn Chí Tâm] | **Kiểm duyệt viên** & **Quản trị viên** (Duyệt tin, quản lý user, taxonomy) | Responsive / Tích hợp bố cục / Phát hành (Deployment) & Đảm bảo chất lượng (QA) |

## Quy trình làm việc (Git & Task Management)
- **Quản lý công việc:** [Link Trello/Jira/Notion của nhóm]
- **Chiến lược nhánh Git:**
  - `main`: Code ổn định.
  - `dev`: Nhánh phát triển chung.
  - `feature/tên-tính-năng`: Nhánh phát triển tính năng riêng.
  - `fix/tên-lỗi`: Nhánh sửa lỗi.
- **Quy trình hợp nhất:** Viết mã $\rightarrow$ Ghi nhận (Conventional Commits) $\rightarrow$ Tạo Pull Request $\rightarrow$ Đánh giá chéo (Peer Review) $\rightarrow$ Hợp nhất vào `dev`.

## Bản thiết kế (Figma / Canva)
- **Liên kết thiết kế:** [https://www.figma.com/design/Cj1buthUhvqMWrCSWhMjR6/Untitled?node-id=0-1&t=ds9PjqhDfzBV073Y-1]

## Minh chứng OBS
- **Liên kết thư mục Video OBS:** https://www.youtube.com/playlist?list=PLd6lUOwQqQXk

## Khai báo sử dụng AI
Chi tiết về việc sử dụng công cụ AI trong dự án vui lòng xem tại tệp: `docs/ai-usage-report.md`.
