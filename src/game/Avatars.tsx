import React from 'react';

export interface AvatarItem {
  id: string;
  name: string;
  bg: string;
  render: (size?: number) => React.ReactNode;
}

export const AVATAR_LIST: AvatarItem[] = [
  // 1. Hiệp sĩ (Knight - Chuẩn như ảnh mẫu của user)
  {
    id: 'knight',
    name: 'Hiệp sĩ dũng cảm',
    bg: '#0284c7',
    render: (size = 100) => (
      <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
        {/* Áo đỏ */}
        <path d="M25 82 C25 65 75 65 75 82 L75 92 L25 92 Z" fill="#e11d48" stroke="#1e293b" strokeWidth="4" />
        <path d="M42 70 L58 70 L54 92 L46 92 Z" fill="#fbbf24" stroke="#1e293b" strokeWidth="3" />
        {/* Mũ sắt */}
        <circle cx="50" cy="46" r="28" fill="#cbd5e1" stroke="#1e293b" strokeWidth="4" />
        <path d="M22 46 C22 30 78 30 78 46 L76 60 C76 68 64 74 50 74 C36 74 24 68 24 60 Z" fill="#94a3b8" stroke="#1e293b" strokeWidth="4" />
        {/* Chỏm lông đỏ */}
        <path d="M42 20 C42 12 58 12 58 20 L55 26 L45 26 Z" fill="#e11d48" stroke="#1e293b" strokeWidth="3" />
        <path d="M47 12 C47 6 53 6 53 12 L52 20 L48 20 Z" fill="#f43f5e" />
        {/* Khe nhìn mũ sắt */}
        <rect x="30" y="44" width="40" height="18" rx="6" fill="#1e293b" />
        {/* Nan che mặt */}
        <line x1="36" y1="46" x2="36" y2="60" stroke="#64748b" strokeWidth="3.5" strokeLinecap="round" />
        <line x1="43" y1="46" x2="43" y2="60" stroke="#64748b" strokeWidth="3.5" strokeLinecap="round" />
        <line x1="50" y1="46" x2="50" y2="60" stroke="#64748b" strokeWidth="3.5" strokeLinecap="round" />
        <line x1="57" y1="46" x2="57" y2="60" stroke="#64748b" strokeWidth="3.5" strokeLinecap="round" />
        <line x1="64" y1="46" x2="64" y2="60" stroke="#64748b" strokeWidth="3.5" strokeLinecap="round" />
      </svg>
    ),
  },

  // 2. Cánh cụt phi công (Aviator Penguin - Chuẩn ảnh mẫu của user)
  {
    id: 'penguin',
    name: 'Cánh cụt phi công',
    bg: '#0f766e',
    render: (size = 100) => (
      <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
        {/* Thân cánh cụt */}
        <path d="M22 84 C22 68 78 68 78 84 L78 92 L22 92 Z" fill="#1e293b" stroke="#0f172a" strokeWidth="4" />
        <circle cx="50" cy="50" r="28" fill="#1e293b" stroke="#0f172a" strokeWidth="4" />
        {/* Mặt trắng */}
        <ellipse cx="50" cy="54" rx="20" ry="20" fill="#f8fafc" />
        {/* Mắt to tròn */}
        <circle cx="43" cy="50" r="4.5" fill="#0f172a" />
        <circle cx="41.5" cy="48.5" r="1.5" fill="#ffffff" />
        <circle cx="57" cy="50" r="4.5" fill="#0f172a" />
        <circle cx="55.5" cy="48.5" r="1.5" fill="#ffffff" />
        {/* Mỏ vàng cam */}
        <polygon points="50,56 42,65 58,65" fill="#f59e0b" stroke="#b45309" strokeWidth="2.5" />
        {/* Mũ phi công da nâu */}
        <path d="M22 46 C22 28 78 28 78 46 L76 56 C76 60 70 60 68 54 L68 40 L32 40 L32 54 C30 60 24 60 24 56 Z" fill="#78350f" stroke="#451a03" strokeWidth="3.5" />
        {/* Kính phi công xanh dương */}
        <rect x="33" y="32" width="14" height="11" rx="4" fill="#38bdf8" stroke="#fbbf24" strokeWidth="3" />
        <rect x="53" y="32" width="14" height="11" rx="4" fill="#38bdf8" stroke="#fbbf24" strokeWidth="3" />
        <line x1="47" y1="37" x2="53" y2="37" stroke="#fbbf24" strokeWidth="3" />
      </svg>
    ),
  },

  // 3. Rồng tím Gamer (Purple Dragon with Gamer Headphones - Chuẩn ảnh mẫu của user)
  {
    id: 'dragon',
    name: 'Rồng tím Gamer',
    bg: '#701a75',
    render: (size = 100) => (
      <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
        {/* Thân áo */}
        <path d="M24 82 C24 68 76 68 76 82 L76 92 L24 92 Z" fill="#4c1d95" stroke="#1e1b4b" strokeWidth="4" />
        {/* Đầu rồng tím */}
        <circle cx="50" cy="48" r="27" fill="#a855f7" stroke="#581c87" strokeWidth="4" />
        {/* Bụng / Mõm rồng */}
        <ellipse cx="50" cy="57" rx="19" ry="14" fill="#e9d5ff" stroke="#7e22ce" strokeWidth="2.5" />
        {/* Sừng rồng vàng */}
        <polygon points="32,26 26,10 40,20" fill="#f59e0b" stroke="#78350f" strokeWidth="3" />
        <polygon points="68,26 74,10 60,20" fill="#f59e0b" stroke="#78350f" strokeWidth="3" />
        {/* Mắt to đen */}
        <circle cx="41" cy="46" r="4.5" fill="#1e1b4b" />
        <circle cx="39.5" cy="44.5" r="1.5" fill="#ffffff" />
        <circle cx="59" cy="46" r="4.5" fill="#1e1b4b" />
        <circle cx="57.5" cy="44.5" r="1.5" fill="#ffffff" />
        {/* Răng nanh cute */}
        <polygon points="43,58 46,65 49,58" fill="#ffffff" stroke="#581c87" strokeWidth="1.5" />
        <polygon points="51,58 54,65 57,58" fill="#ffffff" stroke="#581c87" strokeWidth="1.5" />
        {/* Tai nghe Gaming xanh dương */}
        <path d="M22 48 C22 24 78 24 78 48" stroke="#0284c7" strokeWidth="6" strokeLinecap="round" />
        <rect x="18" y="42" width="10" height="18" rx="4" fill="#38bdf8" stroke="#0369a1" strokeWidth="3" />
        <rect x="72" y="42" width="10" height="18" rx="4" fill="#38bdf8" stroke="#0369a1" strokeWidth="3" />
        {/* Micro */}
        <path d="M23 54 L36 67 L44 64" stroke="#0284c7" strokeWidth="3" strokeLinecap="round" />
        <circle cx="45" cy="64" r="3" fill="#ef4444" />
      </svg>
    ),
  },

  // 4. Robot Cyber (Robot mắt LED)
  {
    id: 'robot',
    name: 'Robot Cyber',
    bg: '#334155',
    render: (size = 100) => (
      <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
        {/* Anten */}
        <line x1="50" y1="24" x2="50" y2="12" stroke="#64748b" strokeWidth="4" />
        <circle cx="50" cy="10" r="5" fill="#22c55e" stroke="#15803d" strokeWidth="2.5" />
        {/* Đầu robot vuông */}
        <rect x="25" y="24" width="50" height="46" rx="12" fill="#94a3b8" stroke="#1e293b" strokeWidth="4" />
        {/* Màn hình hiển thị mắt */}
        <rect x="32" y="34" width="36" height="18" rx="6" fill="#0f172a" />
        {/* Mắt LED xanh sáng */}
        <rect x="37" y="39" width="8" height="8" rx="2" fill="#38bdf8" />
        <rect x="55" y="39" width="8" height="8" rx="2" fill="#38bdf8" />
        {/* Miệng loa */}
        <line x1="38" y1="58" x2="62" y2="58" stroke="#475569" strokeWidth="3" strokeLinecap="round" />
        <line x1="43" y1="62" x2="57" y2="62" stroke="#475569" strokeWidth="3" strokeLinecap="round" />
        {/* Cổ áo */}
        <path d="M28 70 L72 70 L78 92 L22 92 Z" fill="#64748b" stroke="#1e293b" strokeWidth="4" />
      </svg>
    ),
  },

  // 5. Cáo Cam tinh nghịch (Sneaky Fox)
  {
    id: 'fox',
    name: 'Cáo Cam tinh nghịch',
    bg: '#c2410c',
    render: (size = 100) => (
      <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
        {/* Tai cáo */}
        <polygon points="26,42 16,12 40,28" fill="#ea580c" stroke="#7c2d12" strokeWidth="3.5" />
        <polygon points="28,38 22,20 36,30" fill="#fef08a" />
        <polygon points="74,42 84,12 60,28" fill="#ea580c" stroke="#7c2d12" strokeWidth="3.5" />
        <polygon points="72,38 78,20 64,30" fill="#fef08a" />
        {/* Đầu cáo */}
        <circle cx="50" cy="50" r="28" fill="#ea580c" stroke="#7c2d12" strokeWidth="4" />
        {/* Má trắng */}
        <path d="M23 52 C23 68 40 76 50 76 C60 76 77 68 77 52 C70 56 60 48 50 60 C40 48 30 56 23 52 Z" fill="#ffffff" stroke="#7c2d12" strokeWidth="2.5" />
        {/* Mắt hí cute */}
        <path d="M36 46 Q41 42 46 46" stroke="#1e293b" strokeWidth="3.5" strokeLinecap="round" fill="none" />
        <path d="M54 46 Q59 42 64 46" stroke="#1e293b" strokeWidth="3.5" strokeLinecap="round" fill="none" />
        {/* Mũi đen tròn */}
        <circle cx="50" cy="62" r="4" fill="#0f172a" />
        {/* Cổ áo xanh */}
        <path d="M26 80 C26 68 74 68 74 80 L76 92 L24 92 Z" fill="#0284c7" stroke="#075985" strokeWidth="3.5" />
      </svg>
    ),
  },

  // 6. Phi hành gia vũ trụ (Astronaut)
  {
    id: 'astronaut',
    name: 'Phi hành gia',
    bg: '#1e1b4b',
    render: (size = 100) => (
      <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
        {/* Bộ đồ không gian */}
        <path d="M22 80 C22 65 78 65 78 80 L78 92 L22 92 Z" fill="#f8fafc" stroke="#1e293b" strokeWidth="4" />
        <path d="M40 76 L60 76 L58 92 L42 92 Z" fill="#0284c7" stroke="#1e293b" strokeWidth="2.5" />
        {/* Mũ bảo hộ tròn */}
        <circle cx="50" cy="46" r="29" fill="#f8fafc" stroke="#1e293b" strokeWidth="4" />
        {/* Kính phi hành tráng gương vàng cam phản chiếu sao */}
        <rect x="28" y="32" width="44" height="28" rx="14" fill="url(#astroGold)" stroke="#d97706" strokeWidth="3" />
        <defs>
          <linearGradient id="astroGold" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#fbbf24" />
            <stop offset="100%" stopColor="#b45309" />
          </linearGradient>
        </defs>
        {/* Vết sáng phản chiếu */}
        <ellipse cx="40" cy="38" rx="6" ry="2.5" fill="#ffffff" opacity="0.8" transform="rotate(-15 40 38)" />
      </svg>
    ),
  },

  // 7. Ninja Bóng Đêm (Ninja)
  {
    id: 'ninja',
    name: 'Ninja bóng đêm',
    bg: '#18181b',
    render: (size = 100) => (
      <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
        {/* Thân áo đen */}
        <path d="M24 82 C24 66 76 66 76 82 L76 92 L24 92 Z" fill="#09090b" stroke="#27272a" strokeWidth="4" />
        {/* Đầu trùm khăn đen */}
        <circle cx="50" cy="48" r="28" fill="#18181b" stroke="#27272a" strokeWidth="4" />
        {/* Băng trán đỏ rực */}
        <path d="M22 36 L78 36 L78 44 L22 44 Z" fill="#dc2626" />
        {/* Khe mắt lộ mặt */}
        <ellipse cx="50" cy="48" rx="18" ry="8" fill="#fcd34d" stroke="#27272a" strokeWidth="2.5" />
        {/* Ánh mắt sắc bén */}
        <circle cx="43" cy="48" r="3.5" fill="#09090b" />
        <circle cx="41.5" cy="46.5" r="1.2" fill="#ffffff" />
        <circle cx="57" cy="48" r="3.5" fill="#09090b" />
        <circle cx="55.5" cy="46.5" r="1.2" fill="#ffffff" />
        {/* Vết sẹo nhẹ */}
        <line x1="40" y1="44" x2="44" y2="52" stroke="#b45309" strokeWidth="1.5" />
      </svg>
    ),
  },

  // 8. Mèo cưng đáng yêu (Party Cat)
  {
    id: 'cat',
    name: 'Mèo cưng đáng yêu',
    bg: '#db2777',
    render: (size = 100) => (
      <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
        {/* Tai mèo */}
        <polygon points="26,36 20,12 42,24" fill="#f8fafc" stroke="#1e293b" strokeWidth="3.5" />
        <polygon points="28,32 24,18 38,24" fill="#f472b6" />
        <polygon points="74,36 80,12 58,24" fill="#f8fafc" stroke="#1e293b" strokeWidth="3.5" />
        <polygon points="72,32 76,18 62,24" fill="#f472b6" />
        {/* Đầu mèo */}
        <circle cx="50" cy="52" r="27" fill="#f8fafc" stroke="#1e293b" strokeWidth="4" />
        {/* Mắt tròn xoe */}
        <circle cx="40" cy="48" r="5" fill="#0284c7" />
        <circle cx="38" cy="46" r="1.8" fill="#ffffff" />
        <circle cx="60" cy="48" r="5" fill="#0284c7" />
        <circle cx="58" cy="46" r="1.8" fill="#ffffff" />
        {/* Mũi hồng */}
        <polygon points="50,56 46,60 54,60" fill="#ec4899" />
        {/* Râu mèo */}
        <line x1="32" y1="58" x2="18" y2="56" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" />
        <line x1="32" y1="62" x2="18" y2="64" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" />
        <line x1="68" y1="58" x2="82" y2="56" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" />
        <line x1="68" y1="62" x2="82" y2="64" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" />
        {/* Nơ đỏ */}
        <polygon points="44,78 50,82 44,86" fill="#ef4444" stroke="#991b1b" strokeWidth="2" />
        <polygon points="56,78 50,82 56,86" fill="#ef4444" stroke="#991b1b" strokeWidth="2" />
        <circle cx="50" cy="82" r="3" fill="#fbbf24" />
      </svg>
    ),
  },

  // 9. Pháp sư tối thượng (Wizard)
  {
    id: 'wizard',
    name: 'Pháp sư quyền năng',
    bg: '#4c1d95',
    render: (size = 100) => (
      <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
        {/* Đầu mặt */}
        <circle cx="50" cy="48" r="26" fill="#fed7aa" stroke="#1e293b" strokeWidth="3.5" />
        {/* Râu dài trắng */}
        <path d="M34 56 C34 76 50 92 50 92 C50 92 66 76 66 56 Z" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="2.5" />
        {/* Mắt cười */}
        <path d="M38 46 Q43 42 48 46" stroke="#1e293b" strokeWidth="3" strokeLinecap="round" fill="none" />
        <path d="M52 46 Q57 42 62 46" stroke="#1e293b" strokeWidth="3" strokeLinecap="round" fill="none" />
        {/* Mũ pháp sư chóp nhọn màu tím */}
        <ellipse cx="50" cy="38" rx="34" ry="10" fill="#6d28d9" stroke="#3b0764" strokeWidth="3.5" />
        <polygon points="50,6 28,36 72,36" fill="#7c3aed" stroke="#3b0764" strokeWidth="3.5" />
        {/* Sao vàng trên mũ */}
        <polygon points="50,18 52,23 58,23 53,26 55,31 50,28 45,31 47,26 42,23 48,23" fill="#facc15" />
      </svg>
    ),
  },

  // 10. Gấu ngầu (Cool Bear)
  {
    id: 'bear',
    name: 'Gấu ngầu đeo kính',
    bg: '#854d0e',
    render: (size = 100) => (
      <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
        {/* Tai gấu tròn */}
        <circle cx="26" cy="30" r="12" fill="#78350f" stroke="#451a03" strokeWidth="3.5" />
        <circle cx="26" cy="30" r="6" fill="#d97706" />
        <circle cx="74" cy="30" r="12" fill="#78350f" stroke="#451a03" strokeWidth="3.5" />
        <circle cx="74" cy="30" r="6" fill="#d97706" />
        {/* Đầu gấu */}
        <circle cx="50" cy="52" r="28" fill="#78350f" stroke="#451a03" strokeWidth="4" />
        {/* Mõm gấu */}
        <ellipse cx="50" cy="62" rx="16" ry="12" fill="#d97706" stroke="#451a03" strokeWidth="2.5" />
        <circle cx="50" cy="58" r="4.5" fill="#1e293b" />
        {/* Kính râm cực ngầu */}
        <rect x="28" y="42" width="19" height="12" rx="3" fill="#0f172a" stroke="#000000" strokeWidth="2.5" />
        <rect x="53" y="42" width="19" height="12" rx="3" fill="#0f172a" stroke="#000000" strokeWidth="2.5" />
        <line x1="47" y1="46" x2="53" y2="46" stroke="#000000" strokeWidth="3" />
        {/* Ánh kính */}
        <line x1="32" y1="44" x2="42" y2="52" stroke="#38bdf8" strokeWidth="2" opacity="0.7" />
      </svg>
    ),
  },

  // 11. Thỏ hồng công nghệ (Cyber Rabbit)
  {
    id: 'rabbit',
    name: 'Thỏ hồng đáng yêu',
    bg: '#be185d',
    render: (size = 100) => (
      <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
        {/* Tai thỏ dài */}
        <ellipse cx="36" cy="22" rx="8" ry="20" fill="#fbcfe8" stroke="#831843" strokeWidth="3.5" />
        <ellipse cx="36" cy="22" rx="4" ry="14" fill="#f472b6" />
        <ellipse cx="64" cy="22" rx="8" ry="20" fill="#fbcfe8" stroke="#831843" strokeWidth="3.5" />
        <ellipse cx="64" cy="22" rx="4" ry="14" fill="#f472b6" />
        {/* Đầu thỏ */}
        <circle cx="50" cy="54" r="26" fill="#fbcfe8" stroke="#831843" strokeWidth="4" />
        {/* Má hồng */}
        <circle cx="34" cy="58" r="5" fill="#f472b6" opacity="0.6" />
        <circle cx="66" cy="58" r="5" fill="#f472b6" opacity="0.6" />
        {/* Mắt to đen láy */}
        <circle cx="40" cy="50" r="4.5" fill="#1e1b4b" />
        <circle cx="38.5" cy="48.5" r="1.5" fill="#ffffff" />
        <circle cx="60" cy="50" r="4.5" fill="#1e1b4b" />
        <circle cx="58.5" cy="48.5" r="1.5" fill="#ffffff" />
        {/* Mũi & Miệng */}
        <polygon points="50,56 47,59 53,59" fill="#db2777" />
        <path d="M47 62 Q50 65 53 62" stroke="#831843" strokeWidth="2" fill="none" />
      </svg>
    ),
  },

  // 12. Sư tử vương miện (Lion King)
  {
    id: 'lion',
    name: 'Sư tử vương miện',
    bg: '#b45309',
    render: (size = 100) => (
      <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
        {/* Bờm sư tử nâu cam */}
        <circle cx="50" cy="50" r="34" fill="#ea580c" stroke="#7c2d12" strokeWidth="3.5" />
        {/* Mặt sư tử vàng */}
        <circle cx="50" cy="52" r="23" fill="#fde047" stroke="#854d0e" strokeWidth="3.5" />
        {/* Mắt */}
        <circle cx="42" cy="48" r="3.5" fill="#0f172a" />
        <circle cx="58" cy="48" r="3.5" fill="#0f172a" />
        {/* Mũi đen */}
        <polygon points="50,55 45,61 55,61" fill="#0f172a" />
        {/* Vương miện nhỏ trên đầu */}
        <polygon points="38,24 42,14 50,20 58,14 62,24" fill="#facc15" stroke="#a16207" strokeWidth="2.5" />
        <circle cx="50" cy="16" r="2" fill="#ef4444" />
      </svg>
    ),
  },
];

export function getAvatarById(id: string): AvatarItem {
  return AVATAR_LIST.find((a) => a.id === id) || AVATAR_LIST[0];
}
