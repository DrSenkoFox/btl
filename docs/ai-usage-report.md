Model AI sử dụng: gemini 3.8 flash, gemini 3.1 pro, gemini 4 argon, Claude Opus 4.6, copilot, Qwen 3.8-flash.
Prompt sử dụng: Bao gồm hình ảnh Figma về trang web đang làm kèm mô tả chức năng cho AI.
Sản phẩm AI gồm toàn bộ phần code : html, css, js
Lỗi của AI: Gemini có cái trò chơi bẩn để lách các yêu cầu gây các lỗi như overlap các mục, thiếu các phần code quan trọng, không hiện đầy đủ toàn bộ phần code cần dùng, giao diện tĩnh không có functions, code rác không cần thiết, đọc file sai và thêm các phần không đúng, hiểu sai vấn đề, etc...
Cách sửa lỗi: tách bài thành các Chunk nhỏ, bắt đầu từ các phần quan trọng như giao diện, rồi dùng ai đưa các function vào, Tách các lỗi thành các yêu cầu nhỏ gửi cho AI và để ai sửa các lỗi nhỏ, trước khi rà soát tổng thể và tối ưu lại code. tách các giao diện sai, lỗi và gửi lên cho ai kèm theo figma bản thảo.
Tổng kết:
gần như 100% code là sử dụng ai để tạo ra, SV1 và SV2 chỉ đóng vai trò tổng hợp thông tin, ý tưởng, thiết kế, dò lỗi, đánh dấu và hướng dẫn AI.
Ví dụ:
<img width="717" height="539" alt="image" src="https://github.com/user-attachments/assets/b483a0a5-7946-4f70-96cf-7e6aea954e33" />
AI sinh ra 2 mục gồm tóm tắt yêu cầu và thay đổi, phần code thực hiện
<img width="847" height="791" alt="image" src="https://github.com/user-attachments/assets/300d0505-8fa9-4486-9535-0e961af9f552" />
Sinh viên thay đổi các code cũ bằng code mới, đồng thời rà soát lại các phần code rác như lặp lại 1 quy trình, hay các quy trình thừa như ảnh bên dưới:
<img width="805" height="630" alt="image" src="https://github.com/user-attachments/assets/cdd5e804-254e-4c35-89fb-d14fc6734fc2" />
để kiểm tra, sinh viên chạy live phần code lên web, chạy qua toàn bộ các trang để kiểm tra lỗi css và javascript, sau đó chạy test các function ở phần mới cập nhật, ghi chú lại các lỗi và tổng hợp lại trước khi lặp lại quá trình hỏi, sửa, kiểm.
Điều học được là sự tiên lợi của AI khi làm các tác vụ yêu cầu tạo các function đơn giản và dài dòng, từ đó có thể tận dụng và tối ưu thời gian, tuy vậy, AI cũng có khả năng mắc lỗi từ prompt sai, cách hiểu của sinh viên về vấn đề chưa đúng hay feed sai hoặc thừa dữ liệu, vì vậy để có thể tối ưu quy trình sử dụng ai cần phải kiểm soát các thông tin đầu vào, context và yêu cầu muốn đặt ra, không được ném toàn bộ các yêu cầu lên và bắt ai làm toàn bộ, chia nhỏ work load thành các chunk nhỏ, đưa chunk công việc có độ dễ cao và lặp lại cho các model nhanh như flash hay flash lite, giao phần khung quan trọng cho các model thông minh như gemini pro, gemini 4, rồi liên kết tất cả lại thông qua việc kết hợp các workload với nhau để tạo ra thành phẩm hoàn chỉnh
Một điều nữa là cần phải có sự hiểu biết sâu về thứ mình đang làm, hiểu sai có thể khiến ai lẫn người dùng bị chệch khỏi quỹ đạo và lan man bên ngoài vấn đề gốc cần được giải quyết, gây lãng phí thời gian, tài nguyên và token.
