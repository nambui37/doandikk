// Quản lý kho từ vựng, tạo gói chủ đề tùy biến, ẩn/hiện gói khỏi game và lưu trữ vĩnh viễn
import { wordBank as defaultWordBank } from '../game/words';

export interface ThemePack {
  id: string;
  name: string;
  description: string;
  icon?: string;
  isEnabled: boolean; // Bật / Tắt: true = Hiện trong game, false = Ẩn khỏi game
  isPreset?: boolean;
  words: string[];
}

// Các gói chủ đề mẫu ban đầu
export const INITIAL_PRESET_PACKS: ThemePack[] = [
  {
    id: 'pack_meme',
    name: '🔥 Meme & Cà Khịa Việt Nam',
    description: 'Các câu nói viral, meme bất hủ và tình huống cà khịa đình đám mạng xã hội.',
    icon: '🔥',
    isEnabled: true,
    isPreset: true,
    words: [
      'Đúng nhận sai cãi', 'Cà khịa đam mê', 'Chủ tịch giả vờ', 'Ơ mây zing gút chóp',
      'Ảo ma canada', 'Bất ngờ chưa bà già', 'Hảo hán', 'Ét o ét', 'Gái Nhật đó',
      'Nước đi này chưa tính tới', 'Nhìn sang trái', 'Cơm chó', 'Xu cà na', 'Quá đã luôn',
      'Thần điêu đại hiệp', 'Mũi tên uất hận', 'Phép thuật Winx', 'Quay xe khẩn cấp',
      'Gét gô', 'Alo cảnh sát ơi', 'Dấu chấm hết', 'Tuyệt vời ông mặt trời'
    ],
  },
  {
    id: 'pack_it',
    name: '💻 Dân IT & Lập Trình',
    description: 'Cú đêm, màn hình xanh, bug code và cuộc sống đặc trưng của coder.',
    icon: '💻',
    isEnabled: true,
    isPreset: true,
    words: [
      'Con bọ lập trình', 'Màn hình xanh chết chóc', 'Cú đêm gõ code', 'Cà phê lập trình viên',
      'Bàn phím cơ', 'Máy chủ bốc khói', 'Vòng lặp vô tận', 'Hacker đội mũ đen',
      'Dây cáp mạng', 'Chuột gaming', 'Wifi mất sóng', 'Tràn bộ nhớ RAM',
      'Thẻ HTML', 'Đèn màn hình', 'Trí tuệ nhân tạo AI', 'Bấm nút Deploy', 'Cơ sở dữ liệu'
    ],
  },
  {
    id: 'pack_bua',
    name: '🤪 Bựa & Hài Hước',
    description: 'Những tình huống lầy lội, dở khóc dở cười mang lại tiếng cười cho bạn bè.',
    icon: '🤪',
    isEnabled: true,
    isPreset: true,
    words: [
      'Bị chó rượt chạy', 'Trượt vỏ chuối', 'Ăn trộm gà', 'Tắm mưa cởi truồng',
      'Đánh rắm tập thể', 'Mặt ngáo ngơ', 'Ngủ gật chảy ke', 'Đi dép tổ ong',
      'Quạt nan rách', 'Hát karaoke dở tệ', 'Bị ong chích sưng mỏ', 'Bụng béo bia',
      'Đầu bù tóc rối', 'Cười ngoác mồm', 'Hắt xì hơi bắn tung tóe', 'Mất trộm dép tổ ong'
    ],
  },
  {
    id: 'pack_tuoitho',
    name: '🎮 Tuổi Thơ 9x 2k',
    description: 'Kỷ niệm một thời bắn bi, ô ăn quan, máy game xếp gạch và truyện tranh.',
    icon: '🎮',
    isEnabled: true,
    isPreset: true,
    words: [
      'Bắn bi chai', 'Chơi ô ăn quan', 'Nhảy dây thun', 'Cái ná cao su',
      'Máy bấm game xếp gạch', 'Kem mút que', 'Kẹo kéo chỉ', 'Băng đĩa phim kiếm hiệp',
      'Diều giấy bay cao', 'Xe đạp cọc cạch', 'Trốn tìm', 'Búp bê giấy',
      'Tạt lon', 'Đá cầu lông', 'Truyện tranh Doraemon', 'Máy nuôi thú ảo'
    ],
  },
];

const STORAGE_KEY = 'namphone_theme_packs_v2';

class CustomWordManager {
  private packs: ThemePack[] | null = null;

  // Khởi tạo và đọc dữ liệu từ localStorage (F5 KHÔNG HỀ BỊ MẤT)
  getAllPacks(): ThemePack[] {
    if (this.packs) return this.packs;

    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            this.packs = parsed;
            return this.packs!;
          }
        }
      } catch {
        // Fallback
      }
    }

    // Khởi tạo ban đầu: Gói gốc mặc định của game + 4 gói mẫu độc quyền
    const defaultPacks: ThemePack[] = Object.entries(defaultWordBank).map(([name, words], idx) => ({
      id: `default_${idx}`,
      name,
      description: `Chủ đề gốc của game: ${name}`,
      isEnabled: true,
      isPreset: true,
      words: [...words],
    }));

    this.packs = [...defaultPacks, ...INITIAL_PRESET_PACKS];
    this.saveToStorage();
    return this.packs;
  }

  // LƯU VÀO LOCALSTORAGE BẢO MẬT VĨNH VIỄN
  private saveToStorage() {
    if (typeof window !== 'undefined' && this.packs) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.packs));
      } catch (err) {
        console.error('Không thể lưu theme packs vào localStorage:', err);
      }
    }
  }

  // LẤY CÁC GÓI ĐANG ĐƯỢC BẬT (HIỂN THỊ RA NGOÀI MÀN HÌNH TẠO PHÒNG)
  getEnabledPacks(): ThemePack[] {
    return this.getAllPacks().filter((p) => p.isEnabled);
  }

  // Tên các danh mục đang BẬT (cho dropdown chọn phòng)
  getCategoryNames(): string[] {
    return this.getEnabledPacks().map((p) => p.name);
  }

  // Lấy toàn bộ từ khóa dạng Record<string, string[]> (chỉ các gói đang bật)
  getAllCategories(): Record<string, string[]> {
    const result: Record<string, string[]> = {};
    this.getEnabledPacks().forEach((p) => {
      result[p.name] = p.words;
    });
    return result;
  }

  // Lấy từ khóa theo tên danh mục
  getWords(categoryName: string): string[] {
    const pack = this.getAllPacks().find((p) => p.name === categoryName);
    return pack ? pack.words : [];
  }

  // BẬT / TẮT (ẨN / HIỆN) GÓI KHỎI GAME
  togglePackEnabled(packId: string): boolean {
    const packs = this.getAllPacks();
    const target = packs.find((p) => p.id === packId);
    if (!target) return false;

    target.isEnabled = !target.isEnabled;
    this.saveToStorage();
    return target.isEnabled;
  }

  // TẠO GÓI CHỦ ĐỀ MỚI
  createPack(data: { name: string; description?: string; icon?: string; words?: string[] }): ThemePack {
    const packs = this.getAllPacks();
    const cleanName = data.name.trim();

    const newPack: ThemePack = {
      id: `custom_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: cleanName,
      description: data.description?.trim() || `Gói chủ đề tùy chỉnh ${cleanName}`,
      icon: data.icon || '✨',
      isEnabled: true, // Mặc định hiển thị trong game
      isPreset: false,
      words: data.words ? Array.from(new Set(data.words.map((w) => w.trim()).filter(Boolean))) : [],
    };

    packs.push(newPack);
    this.saveToStorage();
    return newPack;
  }

  // XÓA GÓI CHỦ ĐỀ
  deletePack(packId: string): boolean {
    let packs = this.getAllPacks();
    const initialLen = packs.length;
    this.packs = packs.filter((p) => p.id !== packId);
    if (this.packs.length !== initialLen) {
      this.saveToStorage();
      return true;
    }
    return false;
  }

  // CẬP NHẬT TÊN / MÔ TẢ GÓI
  updatePackInfo(packId: string, name: string, description: string) {
    const packs = this.getAllPacks();
    const target = packs.find((p) => p.id === packId);
    if (target) {
      target.name = name.trim();
      target.description = description.trim();
      this.saveToStorage();
    }
  }

  // THÊM TỪ ĐƠN LẺ VÀO GÓI
  addWordToPack(packId: string, word: string): boolean {
    const clean = word.trim();
    if (!clean) return false;
    const pack = this.getAllPacks().find((p) => p.id === packId);
    if (!pack) return false;
    if (pack.words.includes(clean)) return false;

    pack.words.push(clean);
    this.saveToStorage();
    return true;
  }

  // XÓA TỪ KHỎI GÓI
  removeWordFromPack(packId: string, wordToRemove: string) {
    const pack = this.getAllPacks().find((p) => p.id === packId);
    if (!pack) return;
    pack.words = pack.words.filter((w) => w !== wordToRemove);
    this.saveToStorage();
  }

  // NHẬP TỪ HÀNG LOẠT (BULK IMPORT)
  importBulkWords(packId: string, text: string): number {
    const pack = this.getAllPacks().find((p) => p.id === packId);
    if (!pack) return 0;

    const words = text
      .split(/[\n,;]+/)
      .map((w) => w.trim())
      .filter((w) => w.length > 0);

    let added = 0;
    words.forEach((w) => {
      if (!pack.words.includes(w)) {
        pack.words.push(w);
        added++;
      }
    });

    if (added > 0) {
      this.saveToStorage();
    }
    return added;
  }

  // KHÔI PHỤC TOÀN BỘ VỀ MẶC ĐỊNH
  resetToDefault() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY);
    }
    this.packs = null;
    return this.getAllPacks();
  }

  // TỔNG SỐ TỪ VỰNG TOÀN BỘ GAME
  getTotalWordCount(): number {
    return this.getAllPacks().reduce((acc, p) => acc + p.words.length, 0);
  }

  // XUẤT FILE SAO LƯU JSON ĐỂ TẢI VỀ MÁY TÍNH
  exportBackupJSON(): string {
    return JSON.stringify(this.getAllPacks(), null, 2);
  }

  // NHẬP LẠI DỮ LIỆU TỪ FILE SAO LƯU JSON
  importBackupJSON(jsonText: string): boolean {
    try {
      const parsed = JSON.parse(jsonText);
      if (Array.isArray(parsed) && parsed.length > 0) {
        this.packs = parsed;
        this.saveToStorage();
        return true;
      }
    } catch {
      // Parse error
    }
    return false;
  }
}

export const customWordManager = new CustomWordManager();
