import React, { useState, useEffect } from 'react';
import {
  Download,
  Share,
  PlusSquare,
  CheckCircle,
  X,
  Smartphone,
  Laptop,
  Sparkles,
} from 'lucide-react';
import { soundManager } from '../lib/soundManager';

interface Props {
  className?: string;
}

export default function InstallAppModal({ className }: Props) {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [platform, setPlatform] = useState<'ios' | 'android' | 'desktop'>('desktop');

  useEffect(() => {
    // 1. Kiểm tra nếu app đã được mở ở chế độ Standalone (đã cài đặt)
    const checkStandalone = () => {
      const isStandalone =
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone === true;
      setIsInstalled(isStandalone);
    };
    checkStandalone();

    // 2. Nhận diện nền tảng thiết bị
    const ua = navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(ua);
    const isAndroidDevice = /android/.test(ua);

    if (isIOSDevice) {
      setPlatform('ios');
    } else if (isAndroidDevice) {
      setPlatform('android');
    } else {
      setPlatform('desktop');
    }

    // 3. Bắt sự kiện beforeinstallprompt của Chromium (Android & Desktop)
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const handleInstallClick = async () => {
    soundManager.playPop();

    // Nếu đã có sẵn prompt của Android hoặc Desktop Chromium
    if (deferredPrompt) {
      try {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
          setIsInstalled(true);
        }
        setDeferredPrompt(null);
      } catch (err) {
        setIsOpen(true);
      }
    } else {
      // Mở modal hướng dẫn chi tiết (đặc biệt cho iOS Safari và Desktop)
      setIsOpen(true);
    }
  };

  // Nếu đã cài đặt thành công, không cần hiển thị nút
  if (isInstalled) {
    return null;
  }

  return (
    <>
      {/* NÚT THÊM VỀ MÀN HÌNH CHÍNH (PWA INSTALL BUTTON) */}
      <button
        type="button"
        className={`install-pwa-button ${className || ''}`}
        onClick={handleInstallClick}
        title="Thêm game về màn hình chính điện thoại hoặc máy tính"
      >
        <div className="install-icon-badge">
          <Download size={16} className="download-bounce" />
        </div>
        <span className="install-text">Thêm về màn hình</span>
      </button>

      {/* MODAL HƯỚNG DẪN CÀI ĐẶT CHI TIẾT */}
      {isOpen && (
        <div className="install-modal-overlay fade-in" onClick={() => setIsOpen(false)}>
          <div
            className="install-modal-card scale-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* HEADER MODAL */}
            <div className="install-modal-header">
              <div className="install-modal-brand">
                <img
                  src="/app-icon-192.png"
                  alt="Nam Phone Logo"
                  className="install-app-logo"
                />
                <div>
                  <h3 className="install-modal-title">Nam PHONE 3D</h3>
                  <p className="install-modal-subtitle">Thêm vào Màn hình chính</p>
                </div>
              </div>
              <button
                type="button"
                className="install-modal-close-btn"
                onClick={() => setIsOpen(false)}
                title="Đóng"
              >
                <X size={18} />
              </button>
            </div>

            {/* NỘI DUNG THEO NỀN TẢNG */}
            <div className="install-modal-body">
              {platform === 'ios' ? (
                /* HƯỚNG DẪN DÀNH CHO IPHONE / IPAD (IOS SAFARI) */
                <div className="install-platform-guide ios">
                  <div className="platform-tag ios">
                    <Smartphone size={14} /> Dành cho iPhone & iPad (Safari)
                  </div>

                  <div className="install-steps-list">
                    <div className="install-step-item">
                      <div className="step-num-badge">1</div>
                      <div className="step-content">
                        <span>Nhấn vào nút <strong>Chia sẻ</strong></span>
                        <div className="step-highlight-icon">
                          <Share size={18} className="text-blue-400" />
                          <small>(Ở thanh công cụ dưới đáy Safari)</small>
                        </div>
                      </div>
                    </div>

                    <div className="install-step-item">
                      <div className="step-num-badge">2</div>
                      <div className="step-content">
                        <span>Cuộn xuống và chọn <strong>"Thêm vào MH chính"</strong></span>
                        <div className="step-highlight-icon">
                          <PlusSquare size={18} className="text-emerald-400" />
                          <small>(Biểu tượng hình vuông có dấu cộng)</small>
                        </div>
                      </div>
                    </div>

                    <div className="install-step-item">
                      <div className="step-num-badge">3</div>
                      <div className="step-content">
                        <span>Nhấn <strong>"Thêm" (Add)</strong> ở góc trên bên phải</span>
                        <div className="step-highlight-icon">
                          <CheckCircle size={18} className="text-yellow-400" />
                          <small>Icon game sẽ xuất hiện ngay ngoài màn hình điện thoại!</small>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : platform === 'android' ? (
                /* HƯỚNG DẪN DÀNH CHO ANDROID (CHROME / COC COC) */
                <div className="install-platform-guide android">
                  <div className="platform-tag android">
                    <Smartphone size={14} /> Dành cho điện thoại Android
                  </div>

                  <div className="install-steps-list">
                    <div className="install-step-item">
                      <div className="step-num-badge">1</div>
                      <div className="step-content">
                        <span>Nhấn vào menu <strong>3 dấu chấm (⋮)</strong> ở góc trên trình duyệt</span>
                      </div>
                    </div>

                    <div className="install-step-item">
                      <div className="step-num-badge">2</div>
                      <div className="step-content">
                        <span>Chọn <strong>"Cài đặt ứng dụng"</strong> hoặc <strong>"Thêm vào Màn hình chính"</strong></span>
                      </div>
                    </div>

                    <div className="install-step-item">
                      <div className="step-num-badge">3</div>
                      <div className="step-content">
                        <span>Nhấn <strong>Cài đặt</strong> để mở game như App chính thức với độ mượt tối đa!</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* HƯỚNG DẪN DÀNH CHO MÁY TÍNH (PC / LAPTOP / MAC) */
                <div className="install-platform-guide desktop">
                  <div className="platform-tag desktop">
                    <Laptop size={14} /> Dành cho Máy tính & Laptop (Chrome / Edge)
                  </div>

                  <div className="install-steps-list">
                    <div className="install-step-item">
                      <div className="step-num-badge">1</div>
                      <div className="step-content">
                        <span>Nhìn lên thanh địa chỉ trình duyệt, bấm vào biểu tượng <strong>Cài đặt (⊕)</strong> ở góc phải thanh URL</span>
                      </div>
                    </div>

                    <div className="install-step-item">
                      <div className="step-num-badge">2</div>
                      <div className="step-content">
                        <span>Nhấn <strong>Cài đặt (Install)</strong> để mở cửa sổ Game độc lập không thanh cuộn</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* LỢI ÍCH KHI THÊM RA MÀN HÌNH CHÍNH */}
              <div className="install-benefits-box">
                <span className="benefits-title">
                  <Sparkles size={14} /> Lợi ích khi thêm ra màn hình chính:
                </span>
                <ul className="benefits-list">
                  <li>✨ Mở game ngay trong 1 chạm từ màn hình, không cần gõ link</li>
                  <li>📱 Màn hình vẽ toàn cảnh không bị thanh trình duyệt che khuất</li>
                  <li>⚡ Tốc độ mượt mà, tải nhanh và trải nghiệm như app tải từ AppStore/CH Play</li>
                </ul>
              </div>
            </div>

            {/* FOOTER */}
            <div className="install-modal-footer">
              <button
                type="button"
                className="install-modal-done-btn"
                onClick={() => setIsOpen(false)}
              >
                Đã hiểu
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
