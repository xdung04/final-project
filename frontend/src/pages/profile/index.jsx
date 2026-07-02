import { useEffect, useState } from "react";
import classNames from "classnames/bind";
import { useAuth } from "~/context/AuthContext";
import { ProfileAPI } from "~/apis/profileApi";
import { HairAnalysisAPI } from "~/apis/hairAnalysisAPI";
import { useToast } from "~/context/ToastContext";
import styles from "./Profile.module.scss";
import WorkCard from "~/components/CustomerGalleryCard";
import { fetchCustomerGallery } from "~/services/customerGalleryService";

const cx = classNames.bind(styles);

// ── Map tiếng Việt ──
const faceShapeVI   = { oval: "Trái xoan", round: "Tròn", square: "Vuông", heart: "Trái tim", oblong: "Dài" };
const undertoneVI   = { warm: "Ấm 🟡", cool: "Lạnh 🔵", neutral: "Trung tính ⚪" };
const ratingLabel   = { 1: "Không phù hợp", 2: "Tạm được", 3: "Ổn", 4: "Khá tốt", 5: "Rất hữu ích!" };

function Profile() {
  const { isLogin, setUser } = useAuth();
  const { showToast } = useToast();

  const [profile, setProfile]       = useState(null);
  const [loading, setLoading]       = useState(true);
  const [activeTab, setActiveTab]   = useState("profile");

  const [fullName, setFullName]         = useState("");
  const [phoneNumber, setPhoneNumber]   = useState("");
  const [avatarFile, setAvatarFile]     = useState(null);
  const [preview, setPreview]           = useState("/user.png");
  const [isEditing, setIsEditing]       = useState(false);

  const [galleryWorks, setGalleryWorks]       = useState([]);
  const [galleryLoading, setGalleryLoading]   = useState(true);

  // ── Hair Analysis History ──
  const [analysisHistory, setAnalysisHistory]       = useState([]);
  const [analysisLoading, setAnalysisLoading]       = useState(false);
  const [analysisFetched, setAnalysisFetched]       = useState(false); // lazy load

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  useEffect(() => {
    if (!isLogin) return;
    const fetchProfile = async () => {
      setLoading(true);
      try {
        const res = await ProfileAPI.getProfile();
        const userProfile = res.profile;
        setProfile(userProfile);
        setFullName(userProfile.fullName || "");
        setPhoneNumber(userProfile.phoneNumber || "");
        setPreview(userProfile.image || "/user.png");
      } catch (err) {
        console.error("Lỗi khi tải profile:", err);
        showToast({ text: "Lỗi khi tải dữ liệu!", type: "error", duration: 3000 });
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [isLogin]);

  useEffect(() => {
    if (!isLogin) return;
    const loadGallery = async () => {
      setGalleryLoading(true);
      try {
        const data = await fetchCustomerGallery();
        const grouped = {};
        data.forEach((item) => {
          const id = item.idbooking;
          if (!grouped[id]) {
            grouped[id] = { idBooking: id, customerName: item.customerName, barberName: item.barberName, service: item.service, description: item.description || "", date: item.date, photos: [] };
          }
          grouped[id].photos.push(item.photo);
        });
        setGalleryWorks(Object.values(grouped));
      } catch (err) {
        console.error("Lỗi khi tải gallery:", err);
      } finally {
        setGalleryLoading(false);
      }
    };
    loadGallery();
  }, [isLogin]);

  // ── Lazy load lịch sử tư vấn khi chuyển sang tab ──
  useEffect(() => {
    if (activeTab !== "analysis" || analysisFetched) return;
    const loadHistory = async () => {
      setAnalysisLoading(true);
      try {
        const res = await HairAnalysisAPI.getMyHistory();
        setAnalysisHistory(res.data?.history || []);
        setAnalysisFetched(true);
      } catch (err) {
        console.error("Lỗi khi tải lịch sử tư vấn:", err);
        showToast({ text: "Không thể tải lịch sử tư vấn", type: "error" });
      } finally {
        setAnalysisLoading(false);
      }
    };
    loadHistory();
  }, [activeTab, analysisFetched]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setAvatarFile(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleEditProfile = async () => {
    if (!/^(0|\+84)[0-9]{9}$/.test(phoneNumber)) {
      showToast({ text: "Số điện thoại phải là 10 chữ số và bắt đầu bằng số 0 (ví dụ: 0912345678)", type: "error", duration: 3000 });
      return;
    }
    try {
      const formData = new FormData();
      formData.append("fullName", fullName);
      formData.append("phoneNumber", phoneNumber);
      if (avatarFile) formData.append("avatar", avatarFile);
      const res = await ProfileAPI.updateProfile(formData);
      const updatedProfile = res.profile || res;
      setProfile(updatedProfile);
      setPreview(updatedProfile.image || "/user.png");
      setUser((prev) => ({ ...prev, ...updatedProfile, avatar: updatedProfile.image || "/user.png" }));
      showToast({ text: "Cập nhật thành công!", type: "success", duration: 3000 });
    } catch (err) {
      showToast({ text: err.response?.data?.message || err.message || "Có lỗi khi cập nhật!", type: "error", duration: 3000 });
    }
  };

  const handlePasswordInput = (e) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({ ...prev, [name]: value }));
  };

  const handleChangePassword = async () => {
    const { currentPassword, newPassword, confirmPassword } = passwordData;
    if (!currentPassword || !newPassword || !confirmPassword) {
      showToast({ text: "Vui lòng nhập đầy đủ", type: "error" });
      return;
    }
    if (newPassword.length < 6) {
      showToast({ text: "Mật khẩu tối thiểu 6 ký tự", type: "error" });
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast({ text: "Mật khẩu xác nhận không khớp", type: "error" });
      return;
    }
    try {
      const res = await ProfileAPI.changePassword({ currentPassword, newPassword });
      showToast({ text: res.message || "Đổi mật khẩu thành công", type: "success" });
      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err) {
      showToast({ text: err.message || "Đổi mật khẩu thất bại", type: "error" });
    }
  };

  if (loading) return <div className={cx("loading")}>Đang tải...</div>;
  if (!profile) return <div className={cx("loading")}>Không có dữ liệu</div>;

  const { email, profileDetail } = profile;
  const points = profileDetail?.loyaltyPoint || 0;

  return (
    <div className={cx("wrapper")}>
      <div className={cx("grainOverlay")}></div>

      <div className={cx("innerContainer")}>
        <div className={cx("sectionLabel")}>THÔNG TIN CÁ NHÂN</div>
        <h1 className={cx("title")}>Tài khoản <em>Của tôi</em></h1>

        <div className={cx("account-layout")}>
          {/* Sidebar */}
          <div className={cx("sidebar")}>
            <button className={cx("menu-item", { active: activeTab === "profile" })} onClick={() => setActiveTab("profile")}>
              Hồ sơ
            </button>
            {profile?.authProvider !== "google" && (
              <button className={cx("menu-item", { active: activeTab === "password" })} onClick={() => setActiveTab("password")}>
                Đổi mật khẩu
              </button>
            )}
            <button className={cx("menu-item", { active: activeTab === "analysis" })} onClick={() => setActiveTab("analysis")}>
              Lịch sử tư vấn AI
            </button>
          </div>

          {/* Content */}
          <div className={cx("content")}>

            {/* ── Tab: Hồ sơ ── */}
            {activeTab === "profile" && (
              <div className={cx("profile-card")}>
                <div className={cx("avatar")}>
                  <div className={cx("avatar-frame")}>
                    <img src={preview} alt="avatar" />
                  </div>
                  {isEditing && (
                    <>
                      <input type="file" id="avatarUpload" accept="image/*" hidden onChange={handleFileChange} />
                      <label htmlFor="avatarUpload" className={cx("upload-btn")}>Thay đổi ảnh</label>
                    </>
                  )}
                </div>
                <div className={cx("info")}>
                  <div className={cx("form-group")}>
                    <label>Họ và Tên</label>
                    <input type="text" value={fullName} disabled={!isEditing} onChange={(e) => setFullName(e.target.value)} />
                  </div>
                  <div className={cx("form-group")}>
                    <label>Số điện thoại</label>
                    <input type="text" value={phoneNumber} disabled={!isEditing} onChange={(e) => setPhoneNumber(e.target.value)} />
                  </div>
                  <div className={cx("form-group")}>
                    <label>Email</label>
                    <div className={cx("readonly-text")}>{email}</div>
                  </div>
                  <div className={cx("points-box")}>
                    <span className={cx("points-label")}>ĐIỂM TÍCH LŨY</span>
                    <span className={cx("points-value")}>{points}</span>
                  </div>
                  <button className={cx("save-btn")} onClick={async () => {
                    if (!isEditing) { setIsEditing(true); return; }
                    await handleEditProfile();
                    setIsEditing(false);
                  }}>
                    <span>{isEditing ? "Lưu thay đổi" : "Chỉnh sửa hồ sơ"}</span>
                  </button>
                </div>
              </div>
            )}

            {/* ── Tab: Đổi mật khẩu ── */}
            {activeTab === "password" && profile?.authProvider !== "google" && (
              <div className={cx("password-card")}>
                <h2>Thay đổi <em>Mật khẩu</em></h2>
                <div className={cx("form-group")}>
                  <label>Mật khẩu hiện tại</label>
                  <input type="password" name="currentPassword" value={passwordData.currentPassword} onChange={handlePasswordInput} placeholder="Nhập mật khẩu hiện tại..." />
                </div>
                <div className={cx("form-group")}>
                  <label>Mật khẩu mới</label>
                  <input type="password" name="newPassword" value={passwordData.newPassword} onChange={handlePasswordInput} placeholder="Nhập mật khẩu mới..." />
                </div>
                <div className={cx("form-group")}>
                  <label>Xác nhận mật khẩu</label>
                  <input type="password" name="confirmPassword" value={passwordData.confirmPassword} onChange={handlePasswordInput} placeholder="Nhập lại mật khẩu..." />
                </div>
                <button className={cx("save-btn")} onClick={handleChangePassword}><span>Đổi mật khẩu</span></button>
              </div>
            )}

            {/* ── Tab: Lịch sử tư vấn AI ── */}
            {activeTab === "analysis" && (
              <div style={{ width: "100%" }}>
                <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, marginBottom: 24, color: "inherit" }}>
                  Lịch sử <em>Tư vấn AI</em>
                </h2>

                {analysisLoading ? (
                  <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 14 }}>Đang tải...</p>
                ) : analysisHistory.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "48px 0", color: "rgba(255,255,255,0.3)" }}>
                    <div style={{ fontSize: 40, marginBottom: 16 }}>✂️</div>
                    <p style={{ fontSize: 14 }}>Bạn chưa có lần tư vấn nào được lưu.</p>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    {analysisHistory.map((item) => (
                      <AnalysisHistoryCard key={item.idAnalysis} item={item} />
                    ))}
                  </div>
                )}
              </div>
            )}

          </div>
        </div>

        {/* Gallery */}
        <div className={cx("gallery-section")}>
          <div className={cx("sectionLabel")}>BỘ SƯU TẬP</div>
          <h2 className={cx("gallery-title")}>Ảnh sau khi <em>Cắt tóc</em></h2>
          {galleryLoading ? (
            <p className={cx("loading-text")}>Đang tải hình ảnh...</p>
          ) : galleryWorks.length > 0 ? (
            <div className={cx("grid")}>
              {galleryWorks.map((work) => <WorkCard key={work.idBooking} work={work} />)}
            </div>
          ) : (
            <div className={cx("empty")}>
              <div className={cx("empty-icon")}>✂️</div>
              <p>Bạn chưa có hình ảnh tác phẩm nào.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Card lịch sử tư vấn ──
function AnalysisHistoryCard({ item }) {
  const formatDate = (dateStr) => {
    if (!dateStr) return "—";
    const d = new Date(dateStr);
    return d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div style={{
      border: "1px solid rgba(184,150,106,0.2)",
      background: "rgba(184,150,106,0.03)",
      padding: "20px 24px",
      borderRadius: 2,
    }}>
      {/* Header: ngày + rating */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
        <span style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", letterSpacing: 1 }}>
          {formatDate(item.lastAnalysisAt)}
        </span>
        {item.rating ? (
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ color: "#b8966a", fontSize: 14, letterSpacing: 2 }}>
              {"★".repeat(item.rating)}{"☆".repeat(5 - item.rating)}
            </span>
            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>
              {ratingLabel[item.rating]}
            </span>
          </div>
        ) : (
          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.2)", fontStyle: "italic" }}>Chưa đánh giá</span>
        )}
      </div>

      {/* Thông tin phân tích */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 16 }}>
        <InfoChip label="Khuôn mặt" value={faceShapeVI[item.faceShape] || item.faceShape || "—"} />
        <InfoChip label="Tông da" value={undertoneVI[item.skinToneUndertone] || item.skinToneUndertone || "—"} />
        <InfoChip label="Loại da" value={item.skinType || "—"} />
      </div>

      {/* Kiểu tóc đã chọn */}
      {item.selectedHairstyleName && (
        <div style={{ marginBottom: item.feedback ? 12 : 0, padding: "10px 14px", background: "rgba(184,150,106,0.06)", borderLeft: "2px solid #b8966a" }}>
          <span style={{ fontSize: 11, color: "#b8966a", letterSpacing: 1, display: "block", marginBottom: 4 }}>KIỂU TÓC ĐÃ CHỌN</span>
          <span style={{ fontSize: 14, color: "rgba(255,255,255,0.8)" }}>{item.selectedHairstyleName}</span>
        </div>
      )}

      {/* Feedback */}
      {item.feedback && (
        <p style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", fontStyle: "italic", lineHeight: 1.6, marginTop: 12 }}>
          "{item.feedback}"
        </p>
      )}
    </div>
  );
}

function InfoChip({ label, value }) {
  return (
    <div style={{ padding: "10px 12px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", textAlign: "center" }}>
      <p style={{ fontSize: 10, letterSpacing: 1.5, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", marginBottom: 6 }}>{label}</p>
      <p style={{ fontSize: 13, color: "rgba(255,255,255,0.75)" }}>{value}</p>
    </div>
  );
}

export default Profile;