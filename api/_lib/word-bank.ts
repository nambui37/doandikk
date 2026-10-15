// Kho từ vựng vẽ tranh trực quan, dễ vẽ, độ dài 1 - 3 từ
// Loại bỏ hoàn toàn các từ trừu tượng hoặc không thể vẽ được

export const wordBank: Record<string, string[]> = {
  'Đồ vật quen thuộc': [
    'Cái cốc', 'Tô mì', 'Cái bát', 'Đôi đũa', 'Cái thìa', 'Cái dĩa', 'Cái chảo', 'Bình nước',
    'Quyển sách', 'Bút chì', 'Cái kéo', 'Cục tẩy', 'Thước kẻ', 'Cái bàn', 'Cái ghế', 'Cái giường',
    'Cái gương', 'Cái lược', 'Bàn chải', 'Bánh xà phòng', 'Khăn mặt', 'Đôi dép', 'Đôi giày', 'Chiếc tất',
    'Chiếc mũ', 'Áo phông', 'Chiếc quần', 'Chiếc váy', 'Cà vạt', 'Mắt kính', 'Đồng hồ', 'Chiếc nhẫn',
    'Bao thư', 'Hộp quà', 'Chùm chìa khóa', 'Bóng đèn', 'Cái quạt', 'Cái ô', 'Cái xô nước', 'Cái búa',
    'Cái kìm', 'Cây kéo', 'Cái đinh', 'Cái chổi', 'Bình cứu hỏa', 'Chiếc vali', 'Cái ba lô', 'Ví tiền',
    'Điện thoại', 'Tivi', 'Máy tính', 'Chuột máy tính', 'Tai nghe', 'Máy ảnh', 'Pin sạc', 'Ổ cắm'
  ],

  'Thiên nhiên & Thời tiết': [
    'Mặt trời', 'Mặt trăng', 'Ngôi sao', 'Đám mây', 'Cơn mưa', 'Cầu vồng', 'Tia sét', 'Bông tuyết',
    'Ngọn núi', 'Ngọn đồi', 'Dòng sông', 'Biển cả', 'Hòn đảo', 'Bãi cát', 'Con suối', 'Thác nước',
    'Cây cổ thụ', 'Chiếc lá', 'Bông hoa', 'Cành cây', 'Cây dừa', 'Cây xương rồng', 'Cây nấm', 'Hạt mầm',
    'Trái đất', 'Ngọn lửa', 'Giọt nước', 'Cơn gió', 'Bình minh', 'Hoàng hôn', 'Khói than', 'Cục đá'
  ],

  'Động vật đáng yêu': [
    'Con mèo', 'Con chó', 'Con cá', 'Con chim', 'Con vịt', 'Con gà', 'Con lợn', 'Con bò',
    'Con dê', 'Con cừu', 'Con ngựa', 'Con thỏ', 'Con chuột', 'Con voi', 'Con hổ', 'Con sư tử',
    'Con khỉ', 'Con gấu', 'Con hươu', 'Con rùa', 'Con ếch', 'Con rắn', 'Con cá sấu', 'Con cá mập',
    'Con cá heo', 'Con cá voi', 'Con cua', 'Con tôm', 'Con ốc sên', 'Con mực', 'Con bướm', 'Con ong',
    'Con chuồn chuồn', 'Con nhện', 'Con kiến', 'Chim cánh cụt', 'Chim bồ câu', 'Cú mèo', 'Con công', 'Con vẹt'
  ],

  'Rau củ & Hoa quả': [
    'Quả táo', 'Quả chuối', 'Quả cam', 'Quả dưa hấu', 'Quả dâu tây', 'Quả xoài', 'Quả nho', 'Quả dứa',
    'Quả dừa', 'Quả chanh', 'Quả ớt', 'Quả cà chua', 'Củ cà rốt', 'Củ khoai tây', 'Bắp ngô', 'Cây nấm',
    'Cây kem', 'Cây kẹo mút', 'Bánh sinh nhật', 'Miếng bánh mì', 'Miếng phô mai', 'Quả trứng', 'Kẹo que', 'Bánh pizza'
  ],

  'Phương tiện & Biểu tượng': [
    'Xe đạp', 'Xe máy', 'Ô tô', 'Xe buýt', 'Tàu hỏa', 'Máy bay', 'Trực thăng', 'Tên lửa',
    'Con thuyền', 'Thuyền buồm', 'Tàu ngầm', 'Khinh khí cầu', 'Xe cẩu', 'Xe cứu hỏa', 'Xe cảnh sát', 'Xe cứu thương',
    'Trái tim', 'Mặt cười', 'Vương miện', 'Chiếc cúp', 'Nốt nhạc', 'Ngọn đuốc', 'Kim cương', 'Lá cờ'
  ]
};

export const categories = Object.keys(wordBank);
