import { useState, useEffect, useRef } from 'react';
import {
  Crown,
  KeyRound,
  Lock,
  Plus,
  Trash2,
  FolderPlus,
  Search,
  UploadCloud,
  RotateCcw,
  Check,
  X,
  Sparkles,
  BookOpen,
  ShieldCheck,
  Flame,
  Code2,
  Smile,
  Gamepad2,
  FileText,
  AlertCircle,
  Save,
  Eye,
  EyeOff,
  Download,
  FileUp,
  Sliders,
} from 'lucide-react';
import { soundManager } from '../lib/soundManager';
import { customWordManager, type ThemePack } from '../lib/customWords';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

type AdminTab = 'categories' | 'manage_packs' | 'security';

export default function AdminDashboardModal({ isOpen, onClose }: Props) {
  // Trạng thái xác thực PIN
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return sessionStorage.getItem('namphone_admin_auth') === 'true';
  });
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<AdminTab>('categories');

  // Danh sách các gói chủ đề (Theme Packs)
  const [packs, setPacks] = useState<ThemePack[]>([]);
  const [selectedPackId, setSelectedPackId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [newWordInput, setNewWordInput] = useState('');

  // Modal tạo gói mới
  const [isCreatingPack, setIsCreatingPack] = useState(false);
  const [newPackName, setNewPackName] = useState('');
  const [newPackDesc, setNewPackDesc] = useState('');
  const [newPackWordsInput, setNewPackWordsInput] = useState('');

  // Nhập hàng loạt vào gói đang chọn
  const [isBulkOpen, setIsBulkOpen] = useState(false);
  const [bulkTextInput, setBulkTextInput] = useState('');
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Đổi mã PIN
  const [currentPinInput, setCurrentPinInput] = useState('');
  const [newPinInput, setNewPinInput] = useState('');
  const [pinChangeMsg, setPinChangeMsg] = useState<{ text: string; isError?: boolean } | null>(null);

  // File upload input ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Lấy mã PIN đã lưu hoặc mặc định '123456'
  const getStoredPin = (): string => {
    return localStorage.getItem('namphone_admin_pin') || '123456';
  };

  // Tải danh sách gói
  const refreshPacks = () => {
    const list = customWordManager.getAllPacks();
    setPacks([...list]);
    if (list.length > 0 && (!selectedPackId || !list.find((p) => p.id === selectedPackId))) {
      setSelectedPackId(list[0].id);
    }
  };

  useEffect(() => {
    if (isOpen) {
      refreshPacks();
      setPinError(null);
      setPinInput('');
      setSuccessToast(null);
    }
  }, [isOpen]);

  const showToast = (msg: string) => {
    setSuccessToast(msg);
    soundManager.playSuccess();
    setTimeout(() => setSuccessToast(null), 3000);
  };

  // XÁC THỰC MÃ PIN
  const handleVerifyPin = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const correctPin = getStoredPin();

    if (pinInput.trim() === correctPin) {
      soundManager.playSuccess();
      setIsAuthenticated(true);
      sessionStorage.setItem('namphone_admin_auth', 'true');
      setPinError(null);
      setPinInput('');
    } else {
      soundManager.playAlarm();
      setPinError('Mã PIN không chính xác! Vui lòng thử lại.');
      setPinInput('');
    }
  };

  // ĐĂNG XUẤT ADMIN
  const handleLogoutAdmin = () => {
    soundManager.playPop();
    setIsAuthenticated(false);
    sessionStorage.removeItem('namphone_admin_auth');
  };

  // ĐỔI MÃ PIN ADMIN
  const handleChangePin = (e: React.FormEvent) => {
    e.preventDefault();
    const correctPin = getStoredPin();
    if (currentPinInput.trim() !== correctPin) {
      soundManager.playAlarm();
      setPinChangeMsg({ text: 'Mã PIN hiện tại không đúng!', isError: true });
      return;
    }
    if (newPinInput.trim().length < 4) {
      setPinChangeMsg({ text: 'Mã PIN mới phải có ít nhất 4 ký tự!', isError: true });
      return;
    }

    localStorage.setItem('namphone_admin_pin', newPinInput.trim());
    soundManager.playSuccess();
    setPinChangeMsg({ text: 'Đổi mã PIN Admin thành công!' });
    setCurrentPinInput('');
    setNewPinInput('');
  };

  // BẬT / TẮT (ẨN / HIỆN) GÓI KHỎI GAME
  const handleTogglePack = (packId: string, packName: string) => {
    soundManager.playPop();
    const isNowEnabled = customWordManager.togglePackEnabled(packId);
    refreshPacks();
    showToast(
      isNowEnabled
        ? `Đã BẬT gói "${packName}" (Hiện trong game)`
        : `Đã ẨN gói "${packName}" khỏi game`
    );
  };

  // TẠO GÓI CHỦ ĐỀ MỚI
  const handleCreatePackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPackName.trim()) return;

    soundManager.playSuccess();
    const words = newPackWordsInput
      .split(/[\n,;]+/)
      .map((w) => w.trim())
      .filter((w) => w.length > 0);

    const created = customWordManager.createPack({
      name: newPackName.trim(),
      description: newPackDesc.trim(),
      words,
    });

    setNewPackName('');
    setNewPackDesc('');
    setNewPackWordsInput('');
    setIsCreatingPack(false);
    refreshPacks();
    setSelectedPackId(created.id);
    showToast(`Đã tạo thành công gói chủ đề mới "${created.name}"!`);
  };

  // XÓA GÓI CHỦ ĐỀ
  const handleDeletePack = (packId: string, packName: string) => {
    if (confirm(`Bạn có chắc chắn muốn xóa hoàn toàn gói "${packName}" không?`)) {
      soundManager.playPop();
      customWordManager.deletePack(packId);
      refreshPacks();
      showToast(`Đã xóa gói "${packName}"`);
    }
  };

  // THÊM TỪ ĐƠN LẺ VÀO GÓI ĐANG CHỌN
  const handleAddWord = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWordInput.trim() || !selectedPackId) return;

    const added = customWordManager.addWordToPack(selectedPackId, newWordInput.trim());
    if (added) {
      soundManager.playPop();
      setNewWordInput('');
      refreshPacks();
      showToast(`Đã thêm từ "${newWordInput.trim()}"`);
    } else {
      soundManager.playAlarm();
      alert('Từ này đã có trong gói rồi!');
    }
  };

  // XÓA TỪ KHỎI GÓI
  const handleRemoveWord = (word: string) => {
    soundManager.playPop();
    customWordManager.removeWordFromPack(selectedPackId, word);
    refreshPacks();
  };

  // NHẬP TỪ HÀNG LOẠT
  const handleBulkImport = () => {
    if (!bulkTextInput.trim() || !selectedPackId) return;
    const count = customWordManager.importBulkWords(selectedPackId, bulkTextInput);
    soundManager.playSuccess();
    setBulkTextInput('');
    setIsBulkOpen(false);
    refreshPacks();
    showToast(`Đã nạp thành công +${count} từ vựng vào gói!`);
  };

  // XUẤT FILE SAO LƯU JSON TẢI VỀ MÁY
  const handleExportBackup = () => {
    soundManager.playPop();
    const jsonStr = customWordManager.exportBackupJSON();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `namphone-tu-vung-backup-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
    showToast('Đã tải file sao lưu từ vựng về máy tính!');
  };

  // NHẬP FILE SAO LƯU JSON TỪ MÁY
  const handleFileImportChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const ok = customWordManager.importBackupJSON(content);
        if (ok) {
          soundManager.playSuccess();
          refreshPacks();
          showToast('Nạp dữ liệu từ file sao lưu thành công!');
        } else {
          soundManager.playAlarm();
          alert('File JSON không hợp lệ. Vui lòng kiểm tra lại!');
        }
      }
    };
    reader.readAsText(file);
    e.target.value = ''; // Reset input
  };

  // KHÔI PHỤC TOÀN BỘ VỀ GỐC
  const handleResetAll = () => {
    if (confirm('Khôi phục toàn bộ các gói và kho từ vựng về cấu hình gốc mặc định?')) {
      soundManager.playSuccess();
      customWordManager.resetToDefault();
      refreshPacks();
      showToast('Đã khôi phục toàn bộ kho từ vựng gốc!');
    }
  };

  if (!isOpen) return null;

  const currentPack = packs.find((p) => p.id === selectedPackId);
  const currentWords = (currentPack?.words || []).filter((w) =>
    w.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="admin-overlay-backdrop fade-in" onClick={onClose}>
      <div
        className="admin-modal-card"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {/* INPUT FILE UPLOAD ẨN DÙNG CHO RESTORE JSON */}
        <input
          type="file"
          ref={fileInputRef}
          accept=".json"
          onChange={handleFileImportChange}
          style={{ display: 'none' }}
        />

        {/* ============================================================
            1. MÀN HÌNH NHẬP MÃ PIN BẢO MẬT (KHI CHƯA AUTH)
        ============================================================ */}
        {!isAuthenticated ? (
          <div className="admin-pin-auth-view fade-in">
            <button type="button" className="admin-close-btn" onClick={onClose}>
              <X size={20} />
            </button>

            <div className="admin-shield-icon-glow">
              <Crown size={48} className="text-yellow-400" />
            </div>

            <h2 className="admin-auth-title">XÁC THỰC QUẢN TRỊ VIÊN</h2>
            <p className="admin-auth-desc">
              Vui lòng nhập mã PIN bảo mật để mở <strong>Bảng Quản Trị Hệ Thống</strong>.
              <br />
              <small>(Mã PIN mặc định ban đầu: <code>123456</code>)</small>
            </p>

            {pinError && <div className="admin-pin-error-alert">{pinError}</div>}

            <form onSubmit={handleVerifyPin} className="admin-pin-form">
              <div className="pin-input-container">
                <Lock size={20} className="pin-lock-icon" />
                <input
                  type="password"
                  maxLength={12}
                  placeholder="Nhập mã PIN bí mật..."
                  value={pinInput}
                  onChange={(e) => {
                    setPinInput(e.target.value);
                    if (pinError) setPinError(null);
                  }}
                  className="admin-pin-field"
                  autoFocus
                />
              </div>

              <button
                type="submit"
                className="admin-unlock-btn"
                disabled={!pinInput.trim()}
              >
                <KeyRound size={18} />
                <span>MỞ BẢNG ĐIỀU KHIỂN</span>
              </button>
            </form>
          </div>
        ) : (
          /* ============================================================
              2. BẢNG ĐIỀU KHIỂN QUẢN TRỊ VIÊN CHÍNH THỨC
          ============================================================ */
          <div className="admin-dashboard-container fade-in">
            {/* TOAST THÔNG BÁO THÀNH CÔNG */}
            {successToast && (
              <div className="admin-toast-notice fade-in">
                <Check size={16} className="text-emerald-400" />
                <span>{successToast}</span>
              </div>
            )}

            {/* HEADER DASHBOARD */}
            <header className="admin-dash-header">
              <div className="admin-brand-col">
                <div className="crown-badge-wrap">
                  <Crown size={24} className="text-amber-400" />
                </div>
                <div>
                  <h1 className="admin-dash-title">NAM PHONE • ADMIN DASHBOARD</h1>
                  <span className="admin-dash-role">
                    <ShieldCheck size={13} className="text-cyan-400" /> Quyền Quản Trị Hệ Thống • F5 Không Mất Dữ Liệu
                  </span>
                </div>
              </div>

              {/* TAB NAVIGATION */}
              <div className="admin-nav-tabs">
                <button
                  type="button"
                  className={`admin-nav-tab-btn ${activeTab === 'categories' ? 'active' : ''}`}
                  onClick={() => {
                    soundManager.playPop();
                    setActiveTab('categories');
                  }}
                >
                  <BookOpen size={16} />
                  <span>TỪ VỰNG TRONG GÓI</span>
                </button>

                <button
                  type="button"
                  className={`admin-nav-tab-btn ${activeTab === 'manage_packs' ? 'active' : ''}`}
                  onClick={() => {
                    soundManager.playPop();
                    setActiveTab('manage_packs');
                  }}
                >
                  <Sliders size={16} />
                  <span>QUẢN LÝ & BẬT/TẮT GÓI</span>
                </button>

                <button
                  type="button"
                  className={`admin-nav-tab-btn ${activeTab === 'security' ? 'active' : ''}`}
                  onClick={() => {
                    soundManager.playPop();
                    setActiveTab('security');
                  }}
                >
                  <KeyRound size={16} />
                  <span>ĐỔI PIN & SAO LƯU</span>
                </button>
              </div>

              <button
                type="button"
                className="admin-close-btn"
                onClick={onClose}
                title="Đóng bảng quản trị"
              >
                <X size={20} />
              </button>
            </header>

            {/* PHẦN THÂN NỘI DUNG TỪNG TAB */}
            <main className="admin-dash-body">
              {/* ========================================================
                  TAB 1: TỪ VỰNG TRONG GÓI
              ======================================================== */}
              {activeTab === 'categories' && (
                <div className="admin-categories-layout fade-in">
                  {/* CỘT TRÁI: DANH SÁCH GÓI VÀ TRẠNG THÁI ẨN / HIỆN */}
                  <aside className="admin-cats-sidebar">
                    <div className="cats-sidebar-top">
                      <span className="sidebar-title">CÁC GÓI ({packs.length})</span>
                      <button
                        type="button"
                        className="btn-add-cat-pill"
                        onClick={() => {
                          soundManager.playPop();
                          setActiveTab('manage_packs');
                          setIsCreatingPack(true);
                        }}
                        title="Tạo thêm gói mới"
                      >
                        <Plus size={15} /> Tạo gói mới
                      </button>
                    </div>

                    {/* DANH SÁCH GÓI */}
                    <div className="cats-items-list">
                      {packs.map((pack) => (
                        <div
                          key={pack.id}
                          className={`cat-menu-item ${selectedPackId === pack.id ? 'active' : ''} ${
                            !pack.isEnabled ? 'is-disabled' : ''
                          }`}
                          onClick={() => {
                            soundManager.playPop();
                            setSelectedPackId(pack.id);
                            setSearchQuery('');
                          }}
                        >
                          <div className="cat-menu-item-info">
                            <span className="cat-name-text">{pack.name}</span>
                            <div className="cat-status-line">
                              {pack.isEnabled ? (
                                <span className="status-live-tag">
                                  <Eye size={11} /> Đang hiện
                                </span>
                              ) : (
                                <span className="status-hidden-tag">
                                  <EyeOff size={11} /> Đã ẩn
                                </span>
                              )}
                            </div>
                          </div>
                          <span className="cat-count-badge">{pack.words.length} từ</span>
                        </div>
                      ))}
                    </div>
                  </aside>

                  {/* CỘT PHẢI: CHI TIẾT TỪ VỰNG CỦA GÓI ĐANG CHỌN */}
                  <section className="admin-words-detail-pane">
                    {currentPack ? (
                      <>
                        <div className="detail-pane-header">
                          <div>
                            <div className="pack-title-row">
                              <h2 className="current-cat-title">{currentPack.name}</h2>
                              {currentPack.isEnabled ? (
                                <span className="badge-pack-active">
                                  <Eye size={13} /> Hiện trong Game
                                </span>
                              ) : (
                                <span className="badge-pack-hidden">
                                  <EyeOff size={13} /> Đang ẩn khỏi Game
                                </span>
                              )}
                            </div>
                            <span className="current-cat-meta">
                              {currentPack.description} • <strong>{currentPack.words.length}</strong> từ khóa
                            </span>
                          </div>

                          <div className="detail-header-actions">
                            <button
                              type="button"
                              className={`btn-quick-toggle-visibility ${
                                currentPack.isEnabled ? 'is-on' : 'is-off'
                              }`}
                              onClick={() => handleTogglePack(currentPack.id, currentPack.name)}
                              title={currentPack.isEnabled ? 'Bấm để ẩn khỏi game' : 'Bấm để hiện trong game'}
                            >
                              {currentPack.isEnabled ? (
                                <>
                                  <EyeOff size={15} /> Ẩn khỏi Game
                                </>
                              ) : (
                                <>
                                  <Eye size={15} /> Bật hiện Game
                                </>
                              )}
                            </button>

                            <button
                              type="button"
                              className="btn-bulk-import-toggle"
                              onClick={() => setIsBulkOpen(!isBulkOpen)}
                            >
                              <UploadCloud size={16} />
                              <span>{isBulkOpen ? 'Đóng nhập nhiều' : 'Dán nhiều từ'}</span>
                            </button>

                            <button
                              type="button"
                              className="btn-delete-cat"
                              onClick={() => handleDeletePack(currentPack.id, currentPack.name)}
                              title="Xóa gói này"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>

                        {/* FORM DÁN NHIỀU TỪ HÀNG LOẠT */}
                        {isBulkOpen && (
                          <div className="bulk-import-box fade-in">
                            <div className="bulk-box-header">
                              <span className="bulk-title">DÁN DANH SÁCH TỪ VỰNG HÀNG LOẠT</span>
                              <small>Mỗi từ cách nhau bằng dấu xuống dòng hoặc dấu phẩy (,)</small>
                            </div>
                            <textarea
                              rows={5}
                              placeholder="Ví dụ:&#10;Bánh mì kẹp thịt&#10;Trà sữa trân châu&#10;Cơm tấm sườn bì chả"
                              value={bulkTextInput}
                              onChange={(e) => setBulkTextInput(e.target.value)}
                              className="bulk-textarea"
                            />
                            <div className="bulk-box-footer">
                              <button
                                type="button"
                                className="btn-bulk-submit"
                                onClick={handleBulkImport}
                                disabled={!bulkTextInput.trim()}
                              >
                                <UploadCloud size={16} />
                                <span>Nạp vào gói ngay</span>
                              </button>
                            </div>
                          </div>
                        )}

                        {/* THANH THÊM TỪ & TÌM KIẾM */}
                        <div className="words-control-bar">
                          <form onSubmit={handleAddWord} className="add-single-word-form">
                            <input
                              type="text"
                              placeholder="Thêm từ mới vào gói này..."
                              value={newWordInput}
                              onChange={(e) => setNewWordInput(e.target.value)}
                              className="input-single-word"
                            />
                            <button
                              type="submit"
                              className="btn-add-word"
                              disabled={!newWordInput.trim()}
                            >
                              <Plus size={16} /> Thêm từ
                            </button>
                          </form>

                          <div className="words-search-box">
                            <Search size={16} className="text-zinc-400" />
                            <input
                              type="text"
                              placeholder="Tìm từ trong gói..."
                              value={searchQuery}
                              onChange={(e) => setSearchQuery(e.target.value)}
                              className="input-search-words"
                            />
                          </div>
                        </div>

                        {/* LƯỚI TỪ KHÓA DẠNG CHIPS */}
                        <div className="words-chips-grid">
                          {currentWords.length === 0 ? (
                            <div className="empty-words-tip">
                              {searchQuery ? 'Không tìm thấy từ nào phù hợp.' : 'Gói này chưa có từ nào. Hãy thêm từ phía trên!'}
                            </div>
                          ) : (
                            currentWords.map((word) => (
                              <div key={word} className="word-chip-item">
                                <span className="word-text">{word}</span>
                                <button
                                  type="button"
                                  className="btn-remove-word"
                                  onClick={() => handleRemoveWord(word)}
                                  title="Xóa từ này"
                                >
                                  <X size={13} />
                                </button>
                              </div>
                            ))
                          )}
                        </div>
                      </>
                    ) : (
                      <div className="no-cat-selected-tip">
                        Vui lòng chọn một gói chủ đề ở cột bên trái.
                      </div>
                    )}
                  </section>
                </div>
              )}

              {/* ========================================================
                  TAB 2: QUẢN LÝ & BẬT / TẮT (ẨN / HIỆN) CÁC GÓI
              ======================================================== */}
              {activeTab === 'manage_packs' && (
                <div className="admin-presets-layout fade-in">
                  <div className="presets-top-actions-bar">
                    <div className="presets-intro-text">
                      <h3>QUẢN LÝ & BẬT / TẮT CÁC GÓI CHỦ ĐỀ</h3>
                      <p>
                        Admin có thể <strong>Ẩn hoặc Hiện</strong> bất kỳ gói nào để quyết định gói đó có xuất hiện trong menu tạo phòng game hay không. F5 không bao giờ mất!
                      </p>
                    </div>

                    <button
                      type="button"
                      className="btn-create-pack-header"
                      onClick={() => setIsCreatingPack(true)}
                    >
                      <Plus size={18} />
                      <span>+ TẠO GÓI MỚI</span>
                    </button>
                  </div>

                  {/* FORM TẠO GÓI MỚI NẾU ĐANG MỞ */}
                  {isCreatingPack && (
                    <div className="create-pack-modal-card fade-in">
                      <div className="create-pack-header">
                        <h4>✨ TẠO GÓI CHỦ ĐỀ TÙY CHỈNH MỚI</h4>
                        <button
                          type="button"
                          className="btn-close-form"
                          onClick={() => setIsCreatingPack(false)}
                        >
                          <X size={18} />
                        </button>
                      </div>

                      <form onSubmit={handleCreatePackSubmit} className="create-pack-form">
                        <div className="form-group-row">
                          <div className="form-field-item flex-1">
                            <label>TÊN GÓI CHỦ ĐỀ (BẮT BUỘC):</label>
                            <input
                              type="text"
                              placeholder="Ví dụ: 🎬 Phim Chiếu Rạp, 🍲 Đặc Sản 3 Miền..."
                              value={newPackName}
                              onChange={(e) => setNewPackName(e.target.value)}
                              className="input-admin-styled"
                              autoFocus
                            />
                          </div>

                          <div className="form-field-item flex-1">
                            <label>MÔ TẢ NGẮN:</label>
                            <input
                              type="text"
                              placeholder="Ví dụ: Tuyển tập các món ăn ngon đường phố..."
                              value={newPackDesc}
                              onChange={(e) => setNewPackDesc(e.target.value)}
                              className="input-admin-styled"
                            />
                          </div>
                        </div>

                        <div className="form-field-item">
                          <label>DANH SÁCH TỪ KHÓA BAN ĐẦU (MỖI TỪ 1 DÒNG HOẶC DẤU PHẨY):</label>
                          <textarea
                            rows={4}
                            placeholder="Phở bò&#10;Bún chả&#10;Bánh xèo&#10;Cơm tấm"
                            value={newPackWordsInput}
                            onChange={(e) => setNewPackWordsInput(e.target.value)}
                            className="input-admin-styled textarea"
                          />
                        </div>

                        <div className="create-pack-actions">
                          <button
                            type="button"
                            className="btn-cancel-create"
                            onClick={() => setIsCreatingPack(false)}
                          >
                            Hủy
                          </button>
                          <button
                            type="submit"
                            className="btn-submit-create"
                            disabled={!newPackName.trim()}
                          >
                            <Save size={16} /> Lưu & Bật gói vào Game
                          </button>
                        </div>
                      </form>
                    </div>
                  )}

                  {/* DANH SÁCH TOÀN BỘ CÁC GÓI HIỆN CÓ CÓ NÚT BẬT / TẮT (ẨN / HIỆN) */}
                  <div className="packs-management-grid">
                    {packs.map((pack) => (
                      <div
                        key={pack.id}
                        className={`pack-card-item ${!pack.isEnabled ? 'disabled-pack' : ''}`}
                      >
                        <div className="pack-card-header">
                          <div className="pack-card-title-col">
                            <h4 className="pack-name-h4">{pack.name}</h4>
                            <span className="pack-count-pill">{pack.words.length} từ khóa</span>
                          </div>

                          {/* CÔNG TẮC BẬT / TẮT (ẨN / HIỆN) */}
                          <button
                            type="button"
                            className={`pack-toggle-switch-btn ${pack.isEnabled ? 'active' : ''}`}
                            onClick={() => handleTogglePack(pack.id, pack.name)}
                            title={pack.isEnabled ? 'Bấm để ẩn khỏi game' : 'Bấm để hiện trong game'}
                          >
                            {pack.isEnabled ? (
                              <>
                                <span className="switch-dot on" />
                                <span className="switch-text">ĐANG HIỆN</span>
                              </>
                            ) : (
                              <>
                                <span className="switch-dot off" />
                                <span className="switch-text">ĐANG ẨN</span>
                              </>
                            )}
                          </button>
                        </div>

                        <p className="pack-desc-text">{pack.description}</p>

                        <div className="pack-card-actions">
                          <button
                            type="button"
                            className="btn-card-edit-words"
                            onClick={() => {
                              setSelectedPackId(pack.id);
                              setActiveTab('categories');
                            }}
                          >
                            <BookOpen size={15} /> Sửa từ khóa ({pack.words.length})
                          </button>

                          <button
                            type="button"
                            className="btn-card-delete"
                            onClick={() => handleDeletePack(pack.id, pack.name)}
                            title="Xóa gói"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* KHỐI SAO LƯU & KHÔI PHỤC DỮ LIỆU */}
                  <div className="backup-sync-bar">
                    <div className="backup-info">
                      <Download size={22} className="text-cyan-400" />
                      <div>
                        <strong>Sao lưu & Phục hồi dữ liệu vĩnh viễn</strong>
                        <p>Tải toàn bộ từ vựng về máy tính dưới dạng file JSON hoặc nạp từ file đã lưu.</p>
                      </div>
                    </div>

                    <div className="backup-btn-group">
                      <button
                        type="button"
                        className="btn-backup-action download"
                        onClick={handleExportBackup}
                      >
                        <Download size={16} /> Tải file JSON về máy
                      </button>

                      <button
                        type="button"
                        className="btn-backup-action upload"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <FileUp size={16} /> Nạp file JSON
                      </button>

                      <button
                        type="button"
                        className="btn-backup-action reset"
                        onClick={handleResetAll}
                      >
                        <RotateCcw size={16} /> Khôi phục gốc
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* ========================================================
                  TAB 3: ĐỔI MÃ PIN & HỆ THỐNG
              ======================================================== */}
              {activeTab === 'security' && (
                <div className="admin-security-layout fade-in">
                  <div className="security-cards-grid">
                    {/* CARD 1: ĐỔI MÃ PIN ADMIN */}
                    <div className="security-card">
                      <div className="sec-card-header">
                        <KeyRound size={22} className="text-amber-400" />
                        <h3>ĐỔI MÃ PIN QUẢN TRỊ VIÊN</h3>
                      </div>
                      <p className="sec-card-sub">
                        Mã PIN này được dùng khi mở bảng quản trị qua tổ hợp <code>Ctrl + Shift + A</code> hoặc click 5 lần vào vương miện.
                      </p>

                      {pinChangeMsg && (
                        <div
                          className={`pin-change-alert ${pinChangeMsg.isError ? 'error' : 'success'}`}
                        >
                          {pinChangeMsg.text}
                        </div>
                      )}

                      <form onSubmit={handleChangePin} className="pin-change-form">
                        <label className="field-lbl">MÃ PIN HIỆN TẠI</label>
                        <input
                          type="password"
                          placeholder="Mã PIN cũ (mặc định: 123456)..."
                          value={currentPinInput}
                          onChange={(e) => setCurrentPinInput(e.target.value)}
                          className="pin-change-field"
                        />

                        <label className="field-lbl">MÃ PIN MỚI (TỐI THIỂU 4 KÝ TỰ)</label>
                        <input
                          type="password"
                          placeholder="Nhập mã PIN mới..."
                          value={newPinInput}
                          onChange={(e) => setNewPinInput(e.target.value)}
                          className="pin-change-field"
                        />

                        <button
                          type="submit"
                          className="btn-save-pin"
                          disabled={!currentPinInput || !newPinInput}
                        >
                          <Save size={16} /> Lưu mã PIN mới
                        </button>
                      </form>
                    </div>

                    {/* CARD 2: THỐNG KÊ HỆ THỐNG */}
                    <div className="security-card">
                      <div className="sec-card-header">
                        <ShieldCheck size={22} className="text-cyan-400" />
                        <h3>THỐNG KÊ DỮ LIỆU GAME</h3>
                      </div>

                      <div className="stats-badges-col">
                        <div className="stat-pill-item">
                          <span>Tổng số gói chủ đề:</span>
                          <strong>{packs.length} gói ({packs.filter((p) => p.isEnabled).length} đang hiện)</strong>
                        </div>
                        <div className="stat-pill-item">
                          <span>Tổng số từ vựng toàn hệ thống:</span>
                          <strong>{customWordManager.getTotalWordCount()} từ</strong>
                        </div>
                        <div className="stat-pill-item">
                          <span>Lối tắt kích hoạt nhanh:</span>
                          <strong>Ctrl + Shift + A</strong>
                        </div>
                        <div className="stat-pill-item">
                          <span>Kích hoạt chuột:</span>
                          <strong>Click 5 lần vào Vương Miện 👑</strong>
                        </div>
                      </div>

                      <div className="admin-session-actions">
                        <button
                          type="button"
                          className="btn-logout-admin"
                          onClick={handleLogoutAdmin}
                        >
                          <Lock size={16} /> Khóa phiên Quản Trị
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </main>
          </div>
        )}
      </div>
    </div>
  );
}
