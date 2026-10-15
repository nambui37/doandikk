// YouTube Background Music Player chuyên trách phát bài hát YouTube dưới nền
// Video ID: ZX2mjf9dFH8 (theo yêu cầu người dùng)

const YOUTUBE_VIDEO_ID = 'ZX2mjf9dFH8';

class YouTubeBGMService {
  private player: any = null;
  private isReady: boolean = false;
  private pendingPlay: boolean = false;
  private volume: number = 40; // 0 - 100
  private isEnabled: boolean = false;
  private iframeContainer: HTMLDivElement | null = null;
  private initialized: boolean = false;

  constructor() {
    if (typeof window !== 'undefined') {
      const savedBgm = localStorage.getItem('phone_sound_bgm');
      const savedBgmVol = localStorage.getItem('phone_sound_bgm_vol');

      if (savedBgm !== null) {
        this.isEnabled = savedBgm === 'true';
      }
      if (savedBgmVol !== null) {
        this.volume = Math.round(parseFloat(savedBgmVol) * 100);
      }

      // Tự động khởi tạo khi trang đã sẵn sàng
      if (document.readyState === 'complete' || document.readyState === 'interactive') {
        this.init();
      } else {
        window.addEventListener('DOMContentLoaded', () => this.init());
      }
    }
  }

  init() {
    if (this.initialized || typeof window === 'undefined') return;
    this.initialized = true;

    // Tạo phần tử div chứa iframe ẩn
    let container = document.getElementById('youtube-bgm-container') as HTMLDivElement | null;
    if (!container) {
      container = document.createElement('div');
      container.id = 'youtube-bgm-container';
      container.style.position = 'fixed';
      container.style.bottom = '-9999px';
      container.style.right = '-9999px';
      container.style.width = '1px';
      container.style.height = '1px';
      container.style.opacity = '0';
      container.style.pointerEvents = 'none';
      container.style.zIndex = '-9999';
      document.body.appendChild(container);
    }
    this.iframeContainer = container;

    // Tạo iframe trực tiếp hỗ trợ postMessage API
    const iframeId = 'yt-bgm-player-iframe';
    let iframe = document.getElementById(iframeId) as HTMLIFrameElement | null;
    if (!iframe) {
      iframe = document.createElement('iframe');
      iframe.id = iframeId;
      iframe.width = '200';
      iframe.height = '200';
      iframe.src = `https://www.youtube.com/embed/${YOUTUBE_VIDEO_ID}?enablejsapi=1&autoplay=0&loop=1&playlist=${YOUTUBE_VIDEO_ID}&playsinline=1&controls=0&disablekb=1&fs=0&modestbranding=1&rel=0`;
      iframe.title = 'Background Music';
      iframe.allow = 'autoplay; encrypted-media';
      container.appendChild(iframe);
    }

    // Tải YouTube IFrame API nếu chưa có
    if (!(window as any).YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag?.parentNode?.insertBefore(tag, firstScriptTag);
    }

    const setupYTPlayer = () => {
      try {
        if ((window as any).YT && (window as any).YT.Player) {
          this.player = new (window as any).YT.Player(iframeId, {
            events: {
              onReady: () => {
                this.isReady = true;
                this.setVolume(this.volume);
                if (this.isEnabled || this.pendingPlay) {
                  this.play();
                }
              },
              onStateChange: (event: any) => {
                // Tự động lặp lại khi bài hát kết thúc (YT.PlayerState.ENDED = 0)
                if (event.data === 0) {
                  this.play();
                }
              },
              onError: (err: any) => {
                console.warn('YouTube BGM Player notice:', err);
              },
            },
          });
        } else {
          setTimeout(setupYTPlayer, 250);
        }
      } catch {
        setTimeout(setupYTPlayer, 500);
      }
    };

    if ((window as any).YT && (window as any).YT.Player) {
      setupYTPlayer();
    } else {
      const oldOnReady = (window as any).onYouTubeIframeAPIReady;
      (window as any).onYouTubeIframeAPIReady = () => {
        if (typeof oldOnReady === 'function') oldOnReady();
        setupYTPlayer();
      };
      // Timeout fallback
      setTimeout(setupYTPlayer, 1000);
    }

    // Tự động mở phát nhạc khi người dùng tương tác lần đầu nếu bgmEnabled = true
    const handleFirstGesture = () => {
      if (this.isEnabled) {
        this.play();
      }
      window.removeEventListener('pointerdown', handleFirstGesture);
      window.removeEventListener('keydown', handleFirstGesture);
    };
    window.addEventListener('pointerdown', handleFirstGesture, { passive: true });
    window.addEventListener('keydown', handleFirstGesture, { passive: true });
  }

  play() {
    this.pendingPlay = true;
    if (!this.isReady || !this.player) {
      this.sendCommand('playVideo');
      return;
    }

    try {
      if (typeof this.player.playVideo === 'function') {
        this.player.setVolume(this.volume);
        this.player.playVideo();
      } else {
        this.sendCommand('playVideo');
      }
    } catch {
      this.sendCommand('playVideo');
    }
  }

  pause() {
    this.pendingPlay = false;
    if (!this.player) {
      this.sendCommand('pauseVideo');
      return;
    }

    try {
      if (typeof this.player.pauseVideo === 'function') {
        this.player.pauseVideo();
      } else {
        this.sendCommand('pauseVideo');
      }
    } catch {
      this.sendCommand('pauseVideo');
    }
  }

  setVolume(volumePercent: number) {
    this.volume = Math.max(0, Math.min(100, Math.round(volumePercent)));
    if (this.player && typeof this.player.setVolume === 'function') {
      try {
        this.player.setVolume(this.volume);
        if (this.volume === 0) {
          this.player.mute?.();
        } else {
          this.player.unMute?.();
        }
      } catch {
        this.sendCommand('setVolume', [this.volume]);
      }
    } else {
      this.sendCommand('setVolume', [this.volume]);
    }
  }

  getVolume(): number {
    return this.volume;
  }

  setEnabled(enabled: boolean) {
    this.isEnabled = enabled;
    localStorage.setItem('phone_sound_bgm', String(enabled));
    if (enabled) {
      this.play();
    } else {
      this.pause();
    }
  }

  getEnabled(): boolean {
    return this.isEnabled;
  }

  private sendCommand(func: string, args: any[] = []) {
    try {
      const iframe = document.getElementById('yt-bgm-player-iframe') as HTMLIFrameElement | null;
      if (iframe && iframe.contentWindow) {
        iframe.contentWindow.postMessage(
          JSON.stringify({ event: 'command', func, args }),
          '*',
        );
      }
    } catch {
      // Bỏ qua lỗi postMessage
    }
  }
}

export const youtubeBGM = new YouTubeBGMService();
