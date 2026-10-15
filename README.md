# Hai Bộ Óc Một Ý (3D Game Vẽ & Đoán Trực Tuyến) 🧠🎨

Trò chơi đối kháng & hợp tác dành cho 2 người: một người nhận từ khóa bí mật để vẽ hoặc nói gợi ý, người còn lại đoán nhanh trong 60 giây.

---

## 🌟 Tính năng nổi bật

1. **Bảng vẽ không giới hạn:**
   - Vẽ nét dài hay ngắn tùy ý, không bị đứt gãy, không bị mất nét.
   - Hỗ trợ chọn màu sắc (Đen, Đỏ, Xanh lá, Xanh dương, Vàng cam, Tím), điều chỉnh kích cỡ nét bút (Mảnh, Vừa, Dày), công cụ tẩy và hoàn tác.
   - Đồng bộ thời gian thực siêu tốc 60 FPS qua WebRTC P2P giữa hai trình duyệt.

2. **Chế độ phòng trực tuyến siêu ổn định:**
   - Tạo phòng nhận mã 6 ký tự hoặc bấm **Sao chép link mời** gửi cho bạn bè (`/?room=ABCDEF`). Bạn bè chỉ cần click link là tự động vào phòng chơi ngay!
   - Tự động kết nối P2P (0ms lag, không tốn tài nguyên server) kèm Serverless API Relay backup.
   - Chế độ tính điểm chuẩn xác: Cộng điểm theo tốc độ đoán đúng cho người đoán (`100 điểm + 20 × giây còn lại`).
   - Tự động chuyển câu khi hết thời gian, không bao giờ bị lỗi HTTP 403.
   - Hiệu ứng pháo hoa Confetti rực rỡ khi đoán đúng và khi vinh danh người chiến thắng.

3. **Kho từ vựng tiếng Việt phong phú (>200 từ):**
   - 6 chủ đề sinh động: *Đời thường*, *Phim & hoạt hình*, *Ăn uống*, *Hành động*, *Ca dao & Trend mạng xã hội*, *Động vật & Thiên nhiên*.
   - Xáo trộn ngẫu nhiên Fischer-Yates, không lặp lại từ trong cùng một ván.

4. **Đồ họa 3D ấn tượng:**
   - Bàn cờ 3D lơ lửng với Three.js + React Three Fiber, tự động fallback mượt mà trên mọi thiết bị di động.

---

## 🚀 Hướng dẫn chạy trên máy (Local)

```bash
# 1. Cài đặt thư viện
npm install

# 2. Chạy môi trường phát triển (Frontend + Backend proxy)
npm run dev
# Truy cập: http://localhost:5173

# 3. Hoặc chạy máy chủ Node.js độc lập
npm run server
# Truy cập: http://localhost:3001
```

---

## 🌐 Hướng dẫn Deploy lên Vercel (1-Click)

Dự án đã được cấu hình sẵn chuẩn mực cho **Vercel**:
- Frontend: Vite React biên dịch ra thư mục `dist`.
- Backend: Thư mục `api/` tự động được Vercel triển khai thành Serverless Functions.
- Cấu hình điều hướng: `vercel.json` định tuyến tự động.

### Các bước deploy:
1. Đẩy code lên kho lưu trữ GitHub của bạn:
   ```bash
   git add .
   git commit -m "Deploy Hai Bo Oc Mot Y to Vercel"
   git push origin main
   ```
2. Mở [Vercel](https://vercel.com) -> Nhấn **Add New Project** -> Chọn repository này.
3. Không cần thay đổi bất kỳ cài đặt nào (Framework tự động nhận diện là **Vite**).
4. Nhấn **Deploy**! Chỉ sau vài chục giây, bạn và bạn bè có thể vào chơi trực tiếp qua link Vercel!
