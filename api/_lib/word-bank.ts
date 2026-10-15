// Kho từ vựng vẽ tranh trực quan, dễ vẽ, độ dài 1 - 3 từ
// Loại bỏ hoàn toàn các từ trừu tượng hoặc không thể vẽ được

export const wordBank: Record<string, string[]> = {
  'Đồ vật quen thuộc': [
    'Cái cốc', 'Tô mì', 'Cái bát', 'Đôi đũa', 'Cái thìa', 'Cái dĩa', 'Cái chảo', 'Bình nước',
    'Quyển sách', 'Bút chì', 'Cái kéo', 'Cục tẩy', 'Thước kẻ', 'Cái bàn', 'Cái ghế', 'Cái giường',
    'Cái gương', 'Cái lược', 'Bàn chải', 'Bánh xà phòng', 'Khăn mặt', 'Đôi dép', 'Đôi giày', 'Chiếc tất',
    'Chiếc mũ', 'Áo phông', 'Chiếc quần', 'Chiếc váy', 'Cà vạt', 'Mắt kính', 'Đồng hồ', 'Chiếc nhẫn',
    'Bao thư', 'Hộp quà', 'Chùm chìa khóa', 'Bóng đèn', 'Cái quạt', 'Cái ô', 'Cái xô nước', 'Cái búa',
    'Cái kìm', 'Cái đinh', 'Cái chổi', 'Bình cứu hỏa', 'Chiếc vali', 'Cái ba lô', 'Ví tiền',
    'Điện thoại', 'Tivi', 'Máy tính', 'Chuột máy tính', 'Tai nghe', 'Máy ảnh', 'Pin sạc', 'Ổ cắm',
    'Tủ lạnh', 'Máy giặt', 'Nồi cơm điện', 'Ấm đun nước', 'Cái thớt', 'Con dao', 'Vá múc canh',
    'Bình hoa', 'Đèn pin', 'Bàn là', 'Máy sấy tóc', 'Kéo bấm móng', 'Gàu hốt rác', 'Cái xẻng',
    'Cây lau nhà', 'Thùng rác', 'Cái bật lửa', 'Bao diêm', 'Móc quần áo', 'Kẹp tóc', 'Kính râm',
    'Khẩu trang', 'Mũ bảo hiểm', 'Xe đẩy em bé', 'Đồng hồ báo thức', 'Nhiệt kế', 'Cây nến', 'Bình gas',
    'Dây thừng', 'Dây xích', 'Ổ khóa', 'Cái phễu', 'Cái rổ', 'Cái chậu', 'Chai nước', 'Hộp sữa',
    'Quyển vở', 'Bút bi', 'Hộp bút', 'Cặp sách', 'Bảng đen', 'Viên phấn', 'Băng dính', 'Cái cân',
    'Kính lúp', 'Cái còi', 'Ống nhòm', 'Microphone', 'Loa cầm tay', 'Cục sạc dự phòng', 'Dây sạc',
    'Tăm bông', 'Bình giữ nhiệt', 'Hộp cơm', 'Chai dầu gội', 'Kem đánh răng', 'Chậu cây', 'Cái gối',
    'Chiếc chiếu', 'Tủ quần áo', 'Kệ sách', 'Bức tranh', 'Khung ảnh', 'Tấm thảm', 'Rèm cửa', 'Chuông cửa',
    'Cờ lê', 'Tua vít', 'Thước cuộn', 'Bình tưới cây', 'Áo mưa', 'Áo khoác', 'Áo len', 'Găng tay',
    'Khăn quàng cổ', 'Mũ len', 'Thắt lưng', 'Túi xách', 'Vòng tay', 'Dây chuyền', 'Bông tai'
  ],

  'Thiên nhiên & Thời tiết': [
    'Mặt trời', 'Mặt trăng', 'Ngôi sao', 'Đám mây', 'Cơn mưa', 'Cầu vồng', 'Tia sét', 'Bông tuyết',
    'Ngọn núi', 'Ngọn đồi', 'Dòng sông', 'Biển cả', 'Hòn đảo', 'Bãi cát', 'Con suối', 'Thác nước',
    'Cây cổ thụ', 'Chiếc lá', 'Bông hoa', 'Cành cây', 'Cây dừa', 'Cây xương rồng', 'Cây nấm', 'Hạt mầm',
    'Trái đất', 'Ngọn lửa', 'Giọt nước', 'Cơn gió', 'Bình minh', 'Hoàng hôn', 'Khói than', 'Cục đá',
    'Núi lửa', 'Sa mạc', 'Cánh đồng', 'Bãi cỏ', 'Rừng cây', 'Cây tre', 'Cây thông', 'Hoa sen',
    'Hoa hướng dương', 'Hoa hồng', 'Bồ công anh', 'Đám sương mù', 'Gió bão', 'Sóng biển', 'Tảng băng',
    'Hang động', 'Sao băng', 'Dải ngân hà', 'Bầu trời', 'Hạt sương', 'Cực quang'
  ],

  'Động vật đáng yêu': [
    'Con mèo', 'Con chó', 'Con cá', 'Con chim', 'Con vịt', 'Con gà', 'Con lợn', 'Con bò',
    'Con dê', 'Con cừu', 'Con ngựa', 'Con thỏ', 'Con chuột', 'Con voi', 'Con hổ', 'Con sư tử',
    'Con khỉ', 'Con gấu', 'Con hươu', 'Con rùa', 'Con ếch', 'Con rắn', 'Con cá sấu', 'Con cá mập',
    'Con cá heo', 'Con cá voi', 'Con cua', 'Con tôm', 'Con ốc sên', 'Con mực', 'Con bướm', 'Con ong',
    'Con chuồn chuồn', 'Con nhện', 'Con kiến', 'Chim cánh cụt', 'Chim bồ câu', 'Cú mèo', 'Con công', 'Con vẹt',
    'Hải cẩu', 'Con sóc', 'Con nhím', 'Đà điểu', 'Chuột túi', 'Gấu trúc', 'Hà mã', 'Tê giác',
    'Lạc đà', 'Đom đóm', 'Bọ rùa', 'Bọ ngựa', 'Sao biển', 'Con sứa', 'Rùa biển', 'Con lươn'
  ],

  'Rau củ & Hoa quả': [
    'Quả táo', 'Quả chuối', 'Quả cam', 'Quả dưa hấu', 'Quả dâu tây', 'Quả xoài', 'Quả nho', 'Quả dứa',
    'Quả dừa', 'Quả chanh', 'Quả ớt', 'Quả cà chua', 'Củ cà rốt', 'Củ khoai tây', 'Bắp ngô', 'Cây nấm',
    'Cây kem', 'Cây kẹo mút', 'Bánh sinh nhật', 'Miếng bánh mì', 'Miếng phô mai', 'Quả trứng', 'Kẹo que', 'Bánh pizza',
    'Sầu riêng', 'Quả mít', 'Quả bơ', 'Quả đu đủ', 'Thanh long', 'Măng cụt', 'Quả vải', 'Quả nhãn',
    'Chôm chôm', 'Quả lựu', 'Quả ổi', 'Khoai lang', 'Củ cải trắng', 'Bắp cải', 'Cà tím', 'Quả bí ngô',
    'Dưa chuột', 'Củ tỏi', 'Hành tây', 'Củ gừng', 'Súp lơ', 'Cây mía', 'Bánh bao', 'Bánh rán'
  ],

  'Phương tiện & Biểu tượng': [
    'Xe đạp', 'Xe máy', 'Ô tô', 'Xe buýt', 'Tàu hỏa', 'Máy bay', 'Trực thăng', 'Tên lửa',
    'Con thuyền', 'Thuyền buồm', 'Tàu ngầm', 'Khinh khí cầu', 'Xe cẩu', 'Xe cứu hỏa', 'Xe cảnh sát', 'Xe cứu thương',
    'Trái tim', 'Mặt cười', 'Vương miện', 'Chiếc cúp', 'Nốt nhạc', 'Ngọn đuốc', 'Kim cương', 'Lá cờ',
    'Xe xích lô', 'Xe ba gác', 'Xe container', 'Xe bán tải', 'Xe trượt scooter', 'Ván trượt', 'Giày patin',
    'Cano', 'Du thuyền', 'Tàu cao tốc', 'Cáp treo', 'Vệ tinh', 'Đĩa bay UFO', 'Huy chương', 'Cái khiên',
    'Thanh kiếm', 'Cây cung tên', 'Chiếc neo tàu', 'Phao bơi', 'Vô lăng', 'Đèn giao thông', 'Biển báo'
  ]
};

export const categories = Object.keys(wordBank);
