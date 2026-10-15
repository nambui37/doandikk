// Audio Manager sử dụng Web Audio API: âm thanh to, rõ, sống động, hỗ trợ toàn bộ nút bấm trong game
import { youtubeBGM } from './youtubeBGM';

class SoundManager {
  private ctx: AudioContext | null = null;
  private sfxEnabled: boolean = true;
  private bgmEnabled: boolean = false;
  private sfxVolume: number = 0.9;
  private bgmVolume: number = 0.45;
  private bgmTimer: number | null = null;
  private isUnlocked: boolean = false;

  constructor() {
    if (typeof window !== 'undefined') {
      const savedSfx = localStorage.getItem('phone_sound_sfx');
      const savedBgm = localStorage.getItem('phone_sound_bgm');
      const savedSfxVol = localStorage.getItem('phone_sound_sfx_vol');
      const savedBgmVol = localStorage.getItem('phone_sound_bgm_vol');

      if (savedSfx !== null) this.sfxEnabled = savedSfx === 'true';
      if (savedBgm !== null) this.bgmEnabled = savedBgm === 'true';
      if (savedSfxVol !== null) this.sfxVolume = parseFloat(savedSfxVol);
      if (savedBgmVol !== null) this.bgmVolume = parseFloat(savedBgmVol);

      // Tự động mở khóa AudioContext ngay khi người dùng chạm hoặc click lần đầu
      const unlock = () => {
        this.unlockAudio();
        window.removeEventListener('pointerdown', unlock);
        window.removeEventListener('keydown', unlock);
      };
      window.addEventListener('pointerdown', unlock, { passive: true });
      window.addEventListener('keydown', unlock, { passive: true });
    }
  }

  // Khởi tạo và mở khóa AudioContext (vượt qua Autoplay Policy)
  unlockAudio() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    this.isUnlocked = true;
  }

  private getContext(): AudioContext | null {
    this.unlockAudio();
    return this.ctx;
  }

  // 1. TIẾNG BẤM NÚT POP/BONG BÓNG GIÒN TAN (Click Sound)
  playPop() {
    if (!this.sfxEnabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      const now = ctx.currentTime;
      // Trượt tần số từ 380Hz lên 880Hz tạo tiếng "pop" đanh giòn
      osc.frequency.setValueAtTime(380, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.1);

      const vol = Math.min(1, this.sfxVolume * 0.75);
      gain.gain.setValueAtTime(vol, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.11);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.12);
    } catch {
      // Bỏ qua
    }
  }

  // 2. TIẾNG CLICK CƠ HỌC NHỎ GỌN (Dành cho toggle, tab, slider)
  playClick() {
    if (!this.sfxEnabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      const now = ctx.currentTime;
      osc.frequency.setValueAtTime(600, now);
      osc.frequency.exponentialRampToValueAtTime(1200, now + 0.05);

      const vol = Math.min(1, this.sfxVolume * 0.6);
      gain.gain.setValueAtTime(vol, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.07);
    } catch {
      // Bỏ qua
    }
  }

  // 3. TIẾNG VÚT GIÓ WHOOSH (Đổi avatar 360 độ, chuyển trang)
  playWhoosh() {
    if (!this.sfxEnabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      const now = ctx.currentTime;
      osc.frequency.setValueAtTime(180, now);
      osc.frequency.exponentialRampToValueAtTime(550, now + 0.12);
      osc.frequency.exponentialRampToValueAtTime(240, now + 0.22);

      const vol = Math.min(1, this.sfxVolume * 0.8);
      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(vol, now + 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.24);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.25);
    } catch {
      // Bỏ qua
    }
  }

  // 4. TIẾNG LENG KENG CHIẾN THẮNG (Bắt đầu, nộp bài, đoán đúng)
  playSuccess() {
    if (!this.sfxEnabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      // Chuỗi 4 nốt Đô - Mi - Sol - Đố (C5, E5, G5, C6)
      const notes = [523.25, 659.25, 783.99, 1046.5];
      notes.forEach((freq, idx) => {
        if (!ctx) return;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        const startTime = ctx.currentTime + idx * 0.07;
        osc.frequency.setValueAtTime(freq, startTime);

        const vol = Math.min(1, this.sfxVolume * 0.5);
        gain.gain.setValueAtTime(vol, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.32);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(startTime);
        osc.stop(startTime + 0.35);
      });
    } catch {
      // Bỏ qua
    }
  }

  // 5. TIẾNG CHUÔNG GẤP RÁP (Cảnh báo 10 giây cuối đồng hồ cát)
  playAlarm() {
    if (!this.sfxEnabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      const now = ctx.currentTime;
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.setValueAtTime(980, now + 0.08);

      const vol = Math.min(1, this.sfxVolume * 0.4);
      gain.gain.setValueAtTime(vol, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.17);
    } catch {
      // Bỏ qua
    }
  }

  // BẬT / TẮT NHẠC NỀN BGM (Sử dụng bài hát YouTube ZX2mjf9dFH8)
  startBGM() {
    this.bgmEnabled = true;
    youtubeBGM.setEnabled(true);
    youtubeBGM.play();
  }

  stopBGM() {
    this.bgmEnabled = false;
    youtubeBGM.setEnabled(false);
    youtubeBGM.pause();
  }

  // Getters & Setters
  getSfx(): boolean {
    return this.sfxEnabled;
  }
  setSfx(val: boolean) {
    this.sfxEnabled = val;
    localStorage.setItem('phone_sound_sfx', String(val));
    if (val) this.playPop();
  }

  getBgm(): boolean {
    return youtubeBGM.getEnabled();
  }
  setBgm(val: boolean) {
    this.bgmEnabled = val;
    youtubeBGM.setEnabled(val);
  }

  getSfxVolume(): number {
    return this.sfxVolume;
  }
  setSfxVolume(val: number) {
    this.sfxVolume = Math.max(0, Math.min(1, val));
    localStorage.setItem('phone_sound_sfx_vol', String(this.sfxVolume));
  }

  getBgmVolume(): number {
    return youtubeBGM.getVolume() / 100;
  }
  setBgmVolume(val: number) {
    this.bgmVolume = Math.max(0, Math.min(1, val));
    youtubeBGM.setVolume(this.bgmVolume * 100);
    localStorage.setItem('phone_sound_bgm_vol', String(this.bgmVolume));
  }
}

export const soundManager = new SoundManager();

// TỰ ĐỘNG GẮN ÂM THANH CHO TẤT CẢ CÁC NÚT BẤM (Global Click Sound Interceptor)
if (typeof window !== 'undefined') {
  window.addEventListener(
    'pointerdown',
    (e: PointerEvent) => {
      // Tìm phần tử có thể click: button, input, thẻ tab, tool button
      const target = (e.target as HTMLElement | null)?.closest(
        'button, [role="button"], .avatar-circle-core, .avatar-refresh-circle-btn, .carousel-dot, .cute-toggle-btn, .test-sound-pill-btn',
      );
      if (target) {
        soundManager.playPop();
      }
    },
    { capture: true, passive: true },
  );
}
