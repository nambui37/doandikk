export const FUNNY_PROMPTS = [
  'Con mèo lái máy bay đi mua phở',
  'Chú gấu trúc trượt ván trên mặt trăng',
  'Con vịt mặc áo vest đi phỏng vấn xin việc',
  'Người ngoài hành tinh đang nấu bánh chưng',
  'Khủng long nhảy hiphop dưới trời mưa',
  'Cá voi tập gym dưới đáy biển',
  'Chim cánh cụt nướng xúc xích trên bãi biển',
  'Ninja cưỡi ốc sên đi giải cứu thế giới',
  'Siêu nhân vừa khóc vừa ăn ớt cay',
  'Bà cụ lái trực thăng đi chợ hoa',
  'Con chó mặc áo choàng đỏ bay qua cầu vồng',
  'Con khỉ đeo tai nghe nhảy K-Pop',
  'Người nhện đi xe xích lô đón người yêu',
  'Chuột túi đeo ba lô đi học võ karate',
  'Robot quét rác bị sét đánh trúng',
  'Củ cà rốt khổng lồ đuổi theo con thỏ',
  'Hổ vằn câu cá trên đỉnh núi tuyết',
  'Cá sấu đánh răng bằng chổi lau nhà',
  'Chú gà trống tập bay vào vũ trụ',
  'Ông mặt trời đeo kính râm uống trà sữa',
];

export function getRandomPrompt(): string {
  const index = Math.floor(Math.random() * FUNNY_PROMPTS.length);
  return FUNNY_PROMPTS[index];
}
