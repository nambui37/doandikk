// Kho nét vẽ vector hoạt họa của Bot AI & dữ liệu câu thoại tương tác
import type { DrawingStroke } from './types';

export interface BotDrawingTemplate {
  word: string;
  category: string;
  strokes: DrawingStroke[];
}

// Hàm chuẩn hóa chuỗi tiếng Việt (loại bỏ dấu, khoảng trắng, viết hoa) để so khớp đáp án
export function normalizeAnswer(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9]/g, '');
}

// Dữ liệu nét vẽ hoạt hình chuẩn xác cho các từ vựng Bot vẽ
export const BOT_DRAWING_TEMPLATES: BotDrawingTemplate[] = [
  {
    word: 'Mặt trời',
    category: 'Thiên nhiên & Thời tiết',
    strokes: [
      // Vòng tròn mặt trời
      {
        color: '#f59e0b',
        size: 8,
        points: Array.from({ length: 33 }, (_, i) => {
          const a = (i / 32) * Math.PI * 2;
          return { x: 300 + Math.cos(a) * 90, y: 220 + Math.sin(a) * 90 };
        }),
      },
      // Tia nắng 1 - Trên
      { color: '#f59e0b', size: 6, points: [{ x: 300, y: 120 }, { x: 300, y: 70 }] },
      // Tia nắng 2 - Dưới
      { color: '#f59e0b', size: 6, points: [{ x: 300, y: 320 }, { x: 300, y: 370 }] },
      // Tia nắng 3 - Trái
      { color: '#f59e0b', size: 6, points: [{ x: 200, y: 220 }, { x: 150, y: 220 }] },
      // Tia nắng 4 - Phải
      { color: '#f59e0b', size: 6, points: [{ x: 400, y: 220 }, { x: 450, y: 220 }] },
      // Tia nắng xiên 4 góc
      { color: '#f59e0b', size: 6, points: [{ x: 230, y: 150 }, { x: 195, y: 115 }] },
      { color: '#f59e0b', size: 6, points: [{ x: 370, y: 150 }, { x: 405, y: 115 }] },
      { color: '#f59e0b', size: 6, points: [{ x: 230, y: 290 }, { x: 195, y: 325 }] },
      { color: '#f59e0b', size: 6, points: [{ x: 370, y: 290 }, { x: 405, y: 325 }] },
      // Hai mắt cười
      { color: '#1f2937', size: 7, points: [{ x: 270, y: 205 }, { x: 270, y: 208 }] },
      { color: '#1f2937', size: 7, points: [{ x: 330, y: 205 }, { x: 330, y: 208 }] },
      // Nụ cười cong rực rỡ
      {
        color: '#ef4444',
        size: 6,
        points: Array.from({ length: 17 }, (_, i) => {
          const a = (i / 16) * Math.PI;
          return { x: 300 - Math.cos(a) * 35, y: 235 + Math.sin(a) * 22 };
        }),
      },
    ],
  },

  {
    word: 'Ngôi nhà',
    category: 'Đồ vật quen thuộc',
    strokes: [
      // Thân nhà (Hình vuông/chữ nhật)
      {
        color: '#3b82f6',
        size: 7,
        points: [
          { x: 200, y: 200 },
          { x: 400, y: 200 },
          { x: 400, y: 360 },
          { x: 200, y: 360 },
          { x: 200, y: 200 },
        ],
      },
      // Mái nhà tam giác đỏ
      {
        color: '#ef4444',
        size: 8,
        points: [
          { x: 180, y: 205 },
          { x: 300, y: 110 },
          { x: 420, y: 205 },
          { x: 180, y: 205 },
        ],
      },
      // Ống khói
      {
        color: '#b45309',
        size: 6,
        points: [
          { x: 350, y: 150 },
          { x: 350, y: 110 },
          { x: 375, y: 110 },
          { x: 375, y: 170 },
        ],
      },
      // Làn khói bay
      {
        color: '#9ca3af',
        size: 4,
        points: [
          { x: 362, y: 100 },
          { x: 370, y: 80 },
          { x: 360, y: 65 },
          { x: 375, y: 48 },
        ],
      },
      // Cửa chính
      {
        color: '#10b981',
        size: 6,
        points: [
          { x: 270, y: 360 },
          { x: 270, y: 275 },
          { x: 330, y: 275 },
          { x: 330, y: 360 },
        ],
      },
      // Cửa sổ vuông bên trái
      {
        color: '#f59e0b',
        size: 5,
        points: [
          { x: 220, y: 235 },
          { x: 255, y: 235 },
          { x: 255, y: 270 },
          { x: 220, y: 270 },
          { x: 220, y: 235 },
        ],
      },
      // Khung cửa sổ chữ thập
      { color: '#f59e0b', size: 4, points: [{ x: 237, y: 235 }, { x: 237, y: 270 }] },
      { color: '#f59e0b', size: 4, points: [{ x: 220, y: 252 }, { x: 255, y: 252 }] },
    ],
  },

  {
    word: 'Con mèo',
    category: 'Động vật đáng yêu',
    strokes: [
      // Đầu mèo tròn
      {
        color: '#f97316',
        size: 7,
        points: Array.from({ length: 33 }, (_, i) => {
          const a = (i / 32) * Math.PI * 2;
          return { x: 300 + Math.cos(a) * 85, y: 210 + Math.sin(a) * 75 };
        }),
      },
      // Tai mèo trái tam giác
      {
        color: '#ea580c',
        size: 7,
        points: [{ x: 235, y: 165 }, { x: 215, y: 95 }, { x: 280, y: 140 }],
      },
      // Tai mèo phải tam giác
      {
        color: '#ea580c',
        size: 7,
        points: [{ x: 320, y: 140 }, { x: 385, y: 95 }, { x: 365, y: 165 }],
      },
      // Mắt trái
      { color: '#111827', size: 8, points: [{ x: 265, y: 195 }, { x: 265, y: 198 }] },
      // Mắt phải
      { color: '#111827', size: 8, points: [{ x: 335, y: 195 }, { x: 335, y: 198 }] },
      // Mũi tam giác hồng
      {
        color: '#ec4899',
        size: 6,
        points: [{ x: 292, y: 220 }, { x: 308, y: 220 }, { x: 300, y: 228 }, { x: 292, y: 220 }],
      },
      // Miệng cười mèo chữ w
      {
        color: '#111827',
        size: 5,
        points: [
          { x: 280, y: 238 },
          { x: 292, y: 245 },
          { x: 300, y: 235 },
          { x: 308, y: 245 },
          { x: 320, y: 238 },
        ],
      },
      // Râu mèo bên trái 3 cọng
      { color: '#4b5563', size: 4, points: [{ x: 275, y: 220 }, { x: 200, y: 208 }] },
      { color: '#4b5563', size: 4, points: [{ x: 275, y: 230 }, { x: 195, y: 232 }] },
      { color: '#4b5563', size: 4, points: [{ x: 275, y: 240 }, { x: 205, y: 254 }] },
      // Râu mèo bên phải 3 cọng
      { color: '#4b5563', size: 4, points: [{ x: 325, y: 220 }, { x: 400, y: 208 }] },
      { color: '#4b5563', size: 4, points: [{ x: 325, y: 230 }, { x: 405, y: 232 }] },
      { color: '#4b5563', size: 4, points: [{ x: 325, y: 240 }, { x: 395, y: 254 }] },
    ],
  },

  {
    word: 'Cây kem',
    category: 'Rau củ & Hoa quả',
    strokes: [
      // Ốc quế tam giác
      {
        color: '#d97706',
        size: 7,
        points: [{ x: 240, y: 220 }, { x: 360, y: 220 }, { x: 300, y: 390 }, { x: 240, y: 220 }],
      },
      // Vân kẻ ốc quế
      { color: '#b45309', size: 3, points: [{ x: 260, y: 260 }, { x: 330, y: 330 }] },
      { color: '#b45309', size: 3, points: [{ x: 340, y: 260 }, { x: 270, y: 330 }] },
      // Viên kem tròn hồng
      {
        color: '#ec4899',
        size: 8,
        points: Array.from({ length: 25 }, (_, i) => {
          const a = (i / 24) * Math.PI;
          return { x: 300 - Math.cos(a) * 70, y: 220 - Math.sin(a) * 70 };
        }),
      },
      // Viên kem thứ 2 tầng trên
      {
        color: '#06b6d4',
        size: 8,
        points: Array.from({ length: 25 }, (_, i) => {
          const a = (i / 24) * Math.PI;
          return { x: 300 - Math.cos(a) * 55, y: 170 - Math.sin(a) * 60 };
        }),
      },
      // Quả cherry đỏ trên đỉnh
      {
        color: '#dc2626',
        size: 7,
        points: Array.from({ length: 17 }, (_, i) => {
          const a = (i / 16) * Math.PI * 2;
          return { x: 300 + Math.cos(a) * 16, y: 95 + Math.sin(a) * 16 };
        }),
      },
      // Cuống cherry
      { color: '#15803d', size: 4, points: [{ x: 300, y: 80 }, { x: 320, y: 55 }] },
    ],
  },

  {
    word: 'Ô tô',
    category: 'Phương tiện & Biểu tượng',
    strokes: [
      // Thân xe dưới
      {
        color: '#2563eb',
        size: 8,
        points: [
          { x: 150, y: 290 },
          { x: 450, y: 290 },
          { x: 450, y: 240 },
          { x: 390, y: 240 },
          { x: 350, y: 175 },
          { x: 230, y: 175 },
          { x: 190, y: 240 },
          { x: 150, y: 240 },
          { x: 150, y: 290 },
        ],
      },
      // Cửa sổ xe
      {
        color: '#38bdf8',
        size: 5,
        points: [
          { x: 235, y: 235 },
          { x: 240, y: 185 },
          { x: 285, y: 185 },
          { x: 285, y: 235 },
          { x: 235, y: 235 },
        ],
      },
      {
        color: '#38bdf8',
        size: 5,
        points: [
          { x: 295, y: 235 },
          { x: 295, y: 185 },
          { x: 340, y: 185 },
          { x: 368, y: 235 },
          { x: 295, y: 235 },
        ],
      },
      // Bánh xe trước (Đen)
      {
        color: '#18181b',
        size: 8,
        points: Array.from({ length: 25 }, (_, i) => {
          const a = (i / 24) * Math.PI * 2;
          return { x: 220 + Math.cos(a) * 32, y: 295 + Math.sin(a) * 32 };
        }),
      },
      // Bánh xe sau
      {
        color: '#18181b',
        size: 8,
        points: Array.from({ length: 25 }, (_, i) => {
          const a = (i / 24) * Math.PI * 2;
          return { x: 380 + Math.cos(a) * 32, y: 295 + Math.sin(a) * 32 };
        }),
      },
      // Trục bánh xe bạc
      { color: '#e4e4e7', size: 6, points: [{ x: 220, y: 295 }, { x: 220, y: 296 }] },
      { color: '#e4e4e7', size: 6, points: [{ x: 380, y: 295 }, { x: 380, y: 296 }] },
      // Đèn pha trước vàng
      { color: '#eab308', size: 8, points: [{ x: 445, y: 255 }, { x: 445, y: 265 }] },
    ],
  },

  {
    word: 'Trái tim',
    category: 'Phương tiện & Biểu tượng',
    strokes: [
      {
        color: '#e11d48',
        size: 9,
        points: [
          { x: 300, y: 180 },
          { x: 270, y: 130 },
          { x: 220, y: 130 },
          { x: 190, y: 170 },
          { x: 190, y: 220 },
          { x: 230, y: 270 },
          { x: 300, y: 350 },
          { x: 370, y: 270 },
          { x: 410, y: 220 },
          { x: 410, y: 170 },
          { x: 380, y: 130 },
          { x: 330, y: 130 },
          { x: 300, y: 180 },
        ],
      },
      // Vệt sáng highlight lấp lánh
      {
        color: '#fda4af',
        size: 5,
        points: [
          { x: 220, y: 155 },
          { x: 205, y: 180 },
          { x: 205, y: 205 },
        ],
      },
    ],
  },

  {
    word: 'Bông hoa',
    category: 'Thiên nhiên & Thời tiết',
    strokes: [
      // Cành hoa xanh
      {
        color: '#16a34a',
        size: 7,
        points: [{ x: 300, y: 230 }, { x: 300, y: 370 }],
      },
      // Chiếc lá trái
      {
        color: '#22c55e',
        size: 6,
        points: [{ x: 300, y: 300 }, { x: 240, y: 280 }, { x: 300, y: 320 }],
      },
      // Chiếc lá phải
      {
        color: '#22c55e',
        size: 6,
        points: [{ x: 300, y: 320 }, { x: 360, y: 300 }, { x: 300, y: 340 }],
      },
      // Nhụy hoa tròn vàng
      {
        color: '#eab308',
        size: 8,
        points: Array.from({ length: 25 }, (_, i) => {
          const a = (i / 24) * Math.PI * 2;
          return { x: 300 + Math.cos(a) * 35, y: 190 + Math.sin(a) * 35 };
        }),
      },
      // 5 Cánh hoa hồng đỏ bo tròn
      ...[0, 72, 144, 216, 288].map((deg) => {
        const rad = (deg * Math.PI) / 180;
        const cx = 300 + Math.cos(rad) * 65;
        const cy = 190 + Math.sin(rad) * 65;
        return {
          color: '#ec4899',
          size: 7,
          points: Array.from({ length: 17 }, (_, i) => {
            const a = (i / 16) * Math.PI * 2;
            return { x: cx + Math.cos(a) * 30, y: cy + Math.sin(a) * 30 };
          }),
        };
      }),
    ],
  },

  {
    word: 'Con cá',
    category: 'Động vật đáng yêu',
    strokes: [
      // Thân cá uốn lượn
      {
        color: '#0284c7',
        size: 8,
        points: [
          { x: 190, y: 230 },
          { x: 240, y: 165 },
          { x: 330, y: 170 },
          { x: 390, y: 230 },
          { x: 440, y: 175 },
          { x: 425, y: 230 },
          { x: 440, y: 285 },
          { x: 390, y: 230 },
          { x: 330, y: 290 },
          { x: 240, y: 295 },
          { x: 190, y: 230 },
        ],
      },
      // Mắt cá
      { color: '#0f172a', size: 7, points: [{ x: 235, y: 220 }, { x: 235, y: 222 }] },
      // Vây lưng
      {
        color: '#38bdf8',
        size: 6,
        points: [{ x: 280, y: 168 }, { x: 310, y: 130 }, { x: 340, y: 170 }],
      },
      // Vây bụng
      {
        color: '#38bdf8',
        size: 6,
        points: [{ x: 280, y: 292 }, { x: 310, y: 330 }, { x: 340, y: 290 }],
      },
      // Bọt nước tròn xoe
      { color: '#93c5fd', size: 4, points: [{ x: 160, y: 210 }, { x: 160, y: 212 }] },
      { color: '#93c5fd', size: 5, points: [{ x: 140, y: 185 }, { x: 140, y: 188 }] },
      { color: '#93c5fd', size: 6, points: [{ x: 125, y: 155 }, { x: 125, y: 159 }] },
    ],
  },
];

// Danh sách câu thoại hóm hỉnh của Bot khi đoán tranh của người chơi
export const BOT_GUESS_COMMENTS = [
  'Hmm... để xem nét vẽ này gợi ý điều gì nào! 🤔',
  'Có vẻ bắt đầu từ một đường cong rất nghệ thuật... 🎨',
  'Trông hơi giống một vòng tròn ta? 🧐',
  'A ha! Hình như là một đồ vật quen thuộc...',
  'Nét vẽ tự tin lắm chiến thần ơi! 🤩',
  'Có phải liên quan đến một con vật không nhỉ?',
  'Tôi đang phân tích từng pixel bằng não bộ AI tối tân... 🤖⚡',
  'Ồ ồ! Bắt đầu ra hình dáng rõ rệt rồi nè!',
  'Trời ơi, vẽ siêu ghê ta!',
  'Tôi sắp đoán ra rồi đó nha! 😎',
];
