import React, { useState, useEffect } from 'react';
import {
  Settings,
  Volume2,
  VolumeX,
  Music,
  Bell,
  X,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { soundManager } from '../lib/soundManager';

interface Props {
  // Có thể truyền custom className nếu muốn
  className?: string;
}

export default function SoundSettingsModal({ className }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [bgmEnabled, setBgmEnabled] = useState(() => soundManager.getBgm());
  const [sfxEnabled, setSfxEnabled] = useState(() => soundManager.getSfx());
  const [bgmVolume, setBgmVolume] = useState(() => Math.round(soundManager.getBgmVolume() * 100));
  const [sfxVolume, setSfxVolume] = useState(() => Math.round(soundManager.getSfxVolume() * 100));

  // Cập nhật lại state khi mở modal
  useEffect(() => {
    if (isOpen) {
      setBgmEnabled(soundManager.getBgm());
      setSfxEnabled(soundManager.getSfx());
      setBgmVolume(Math.round(soundManager.getBgmVolume() * 100));
      setSfxVolume(Math.round(soundManager.getSfxVolume() * 100));
    }
  }, [isOpen]);

  const handleToggleBgm = () => {
    const next = !bgmEnabled;
    setBgmEnabled(next);
    soundManager.setBgm(next);
  };

  const handleToggleSfx = () => {
    const next = !sfxEnabled;
    setSfxEnabled(next);
    soundManager.setSfx(next);
  };

  const handleChangeBgmVolume = (val: number) => {
    setBgmVolume(val);
    soundManager.setBgmVolume(val / 100);
    if (!bgmEnabled && val > 0) {
      setBgmEnabled(true);
      soundManager.setBgm(true);
    }
  };

  const handleChangeSfxVolume = (val: number) => {
    setSfxVolume(val);
    soundManager.setSfxVolume(val / 100);
    if (!sfxEnabled && val > 0) {
      setSfxEnabled(true);
      soundManager.setSfx(true);
    }
  };

  return (
    <>
      {/* NÚT BÁNH RĂNG CỐ ĐỊNH Ở GÓC PHÒNG */}
      <button
        type="button"
        className={`room-corner-settings-btn ${isOpen ? 'active' : ''} ${className || ''}`}
        onClick={() => {
          soundManager.playClick();
          setIsOpen((prev) => !prev);
        }}
        title="Cài đặt âm thanh & Nhạc nền YouTube"
      >
        <Settings size={20} className="gear-spin-icon" />
      </button>

      {/* MODAL CÀI ĐẶT ÂM THANH */}
      {isOpen && (
        <div className="sound-modal-overlay fade-in" onClick={() => setIsOpen(false)}>
          <div
            className="sound-modal-card scale-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* TIÊU ĐỀ */}
            <div className="sound-modal-header">
              <div className="sound-modal-title">
                <Settings size={20} className="text-yellow-400" />
                <span>Cài Đặt Âm Thanh</span>
              </div>
              <button
                type="button"
                className="sound-modal-close-btn"
                onClick={() => setIsOpen(false)}
                title="Đóng"
              >
                <X size={18} />
              </button>
            </div>

            <div className="sound-modal-body">
              {/* PHẦN 1: NHẠC NỀN BGM (YOUTUBE) */}
              <div className="sound-control-group">
                <div className="sound-group-header">
                  <div className="group-label-with-icon">
                    <Music size={18} className="text-pink-400" />
                    <div>
                      <span className="sound-item-title">Nhạc nền (YouTube BGM)</span>
                      <span className="sound-item-badge">ZX2mjf9dFH8</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    className={`sound-switch-btn ${bgmEnabled ? 'on' : 'off'}`}
                    onClick={handleToggleBgm}
                  >
                    <span className="switch-dot" />
                  </button>
                </div>

                <div className="sound-slider-wrapper">
                  <button
                    type="button"
                    className="slider-mute-btn"
                    onClick={() => handleChangeBgmVolume(bgmVolume > 0 ? 0 : 50)}
                  >
                    {bgmEnabled && bgmVolume > 0 ? <Volume2 size={16} /> : <VolumeX size={16} />}
                  </button>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={bgmVolume}
                    onChange={(e) => handleChangeBgmVolume(Number(e.target.value))}
                    className="sound-range-slider bgm-slider"
                  />
                  <span className="sound-vol-percent">{bgmVolume}%</span>
                </div>
              </div>

              {/* PHẦN 2: HIỆU ỨNG ÂM THANH SFX */}
              <div className="sound-control-group">
                <div className="sound-group-header">
                  <div className="group-label-with-icon">
                    <Bell size={18} className="text-cyan-400" />
                    <div>
                      <span className="sound-item-title">Hiệu ứng (SFX)</span>
                      <span className="sound-item-sub">Tiếng pop, click, reo vui</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    className={`sound-switch-btn ${sfxEnabled ? 'on' : 'off'}`}
                    onClick={handleToggleSfx}
                  >
                    <span className="switch-dot" />
                  </button>
                </div>

                <div className="sound-slider-wrapper">
                  <button
                    type="button"
                    className="slider-mute-btn"
                    onClick={() => handleChangeSfxVolume(sfxVolume > 0 ? 0 : 70)}
                  >
                    {sfxEnabled && sfxVolume > 0 ? <Volume2 size={16} /> : <VolumeX size={16} />}
                  </button>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={sfxVolume}
                    onChange={(e) => handleChangeSfxVolume(Number(e.target.value))}
                    className="sound-range-slider sfx-slider"
                  />
                  <span className="sound-vol-percent">{sfxVolume}%</span>
                </div>
              </div>
            </div>

            {/* FOOTER */}
            <div className="sound-modal-footer">
              <button
                type="button"
                className="sound-done-btn"
                onClick={() => setIsOpen(false)}
              >
                Xong
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
