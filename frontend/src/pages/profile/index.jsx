import { useEffect, useState } from "react";
import classNames from "classnames/bind";
import { useAuth } from "~/context/AuthContext";
import { ProfileAPI } from "~/apis/profileApi";
import { useToast } from "~/context/ToastContext";
import styles from "./Profile.module.scss";
import WorkCard from "~/components/CustomerGalleryCard";
import { fetchCustomerGallery } from "~/services/customerGalleryService";

const cx = classNames.bind(styles);

function Profile() {
  const { accessToken, setUser } = useAuth();
  const { showToast } = useToast();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("profile");

  // form state
  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [avatarFile, setAvatarFile] = useState(null);
  const [preview, setPreview] = useState("/user.png");

  // gallery
  const [galleryWorks, setGalleryWorks] = useState([]);
  const [galleryLoading, setGalleryLoading] = useState(true);

  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (!accessToken) return;

    const fetchProfile = async () => {
      setLoading(true);
      try {
        const res = await ProfileAPI.getProfile(accessToken);
        const userProfile = res.profile;

        setProfile(userProfile);
        setFullName(userProfile.fullName || "");
        setPhoneNumber(userProfile.phoneNumber || "");
        setPreview(userProfile.image || "/user.png");
      } catch (err) {
        console.error("Lỗi khi tải profile:", err);
        showToast({
          text: "Lỗi khi tải dữ liệu!",
          type: "error",
          duration: 3000,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [accessToken]);

  useEffect(() => {
    if (!accessToken) return;

    const loadGallery = async () => {
      setGalleryLoading(true);
      try {
        const data = await fetchCustomerGallery(accessToken);

        const grouped = {};
        data.forEach((item) => {
          const id = item.idbooking;
          if (!grouped[id]) {
            grouped[id] = {
              idBooking: id,
              customerName: item.customerName,
              barberName: item.barberName,
              service: item.service,
              description: item.description || "",
              date: item.date,
              photos: [],
            };
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
  }, [accessToken]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setAvatarFile(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleEditProfile = async () => {
    if (!/^(0|\+84)[0-9]{9}$/.test(phoneNumber)) {
      showToast({
        text: "Số điện thoại phải là 10 chữ số và bắt đầu bằng số 0 (ví dụ: 0912345678)",
        type: "error",
        duration: 3000,
      });
      return;
    }

    try {
      const formData = new FormData();
      formData.append("fullName", fullName);
      formData.append("phoneNumber", phoneNumber);
      if (avatarFile) formData.append("avatar", avatarFile);

      const res = await ProfileAPI.updateProfile(accessToken, formData);
      const updatedProfile = res.profile || res;

      setProfile(updatedProfile);
      setPreview(updatedProfile.image || "/user.png");

      setUser((prev) => ({
        ...prev,
        ...updatedProfile,
        avatar: updatedProfile.image || "/user.png",
      }));

      showToast({
        text: "Cập nhật thành công!",
        type: "success",
        duration: 3000,
      });
    } catch (err) {
      const message =
        err.response?.data?.message || err.message || "Có lỗi khi cập nhật!";
      showToast({
        text: message,
        type: "error",
        duration: 3000,
      });
    }
  };
  const handleChangePassword = () => {
    showToast({
      text: "Đổi mật khẩu thành công!",
      type: "success",
      duration: 3000,
    });
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
        <h1 className={cx("title")}>
          Tài khoản <em>Của tôi</em>
        </h1>

        <div className={cx("account-layout")}>
          {/* Sidebar */}
          <div className={cx("sidebar")}>
            <button
              className={cx("menu-item", { active: activeTab === "profile" })}
              onClick={() => setActiveTab("profile")}
            >
              Hồ sơ
            </button>
            <button
              className={cx("menu-item", { active: activeTab === "password" })}
              onClick={() => setActiveTab("password")}
            >
              Đổi mật khẩu
            </button>
          </div>

          {/* Content */}
          <div className={cx("content")}>
            {activeTab === "profile" && (
              <div className={cx("profile-card")}>
                <div className={cx("avatar")}>
                  <div className={cx("avatar-frame")}>
                    <img src={preview} alt="avatar" />
                  </div>
                  {isEditing && (
                    <>
                      <input
                        type="file"
                        id="avatarUpload"
                        accept="image/*"
                        hidden
                        onChange={handleFileChange}
                      />
                      <label
                        htmlFor="avatarUpload"
                        className={cx("upload-btn")}
                      >
                        Thay đổi ảnh
                      </label>
                    </>
                  )}
                </div>

                <div className={cx("info")}>
                  <div className={cx("form-group")}>
                    <label>Họ và Tên</label>
                    <input
                      type="text"
                      value={fullName}
                      disabled={!isEditing}
                      onChange={(e) => setFullName(e.target.value)}
                    />
                  </div>

                  <div className={cx("form-group")}>
                    <label>Số điện thoại</label>
                    <input
                      type="text"
                      value={phoneNumber}
                      disabled={!isEditing}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                    />
                  </div>

                  <div className={cx("form-group")}>
                    <label>Email</label>
                    <div className={cx("readonly-text")}>{email}</div>
                  </div>

                  <div className={cx("points-box")}>
                    <span className={cx("points-label")}>ĐIỂM TÍCH LŨY</span>
                    <span className={cx("points-value")}>{points}</span>
                  </div>

                  <button
                    className={cx("save-btn")}
                    onClick={async () => {
                      if (!isEditing) {
                        setIsEditing(true);
                        return;
                      }

                      await handleEditProfile();
                      setIsEditing(false);
                    }}
                  >
                    <span>
                      {isEditing ? "Lưu thay đổi" : "Chỉnh sửa hồ sơ"}
                    </span>
                  </button>
                </div>
              </div>
            )}

            {activeTab === "password" && (
              <div className={cx("password-card")}>
                <h2>
                  Thay đổi <em>Mật khẩu</em>
                </h2>
                <div className={cx("form-group")}>
                  <label>Mật khẩu mới</label>
                  <input type="password" placeholder="Nhập mật khẩu mới..." />
                </div>
                <div className={cx("form-group")}>
                  <label>Xác nhận mật khẩu</label>
                  <input type="password" placeholder="Nhập lại mật khẩu..." />
                </div>
                <button
                  className={cx("save-btn")}
                  onClick={handleChangePassword}
                >
                  <span>Đổi mật khẩu</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Gallery */}
        <div className={cx("gallery-section")}>
          <div className={cx("sectionLabel")}>BỘ SƯU TẬP</div>
          <h2 className={cx("gallery-title")}>
            Ảnh sau khi <em>Cắt tóc</em>
          </h2>

          {galleryLoading ? (
            <p className={cx("loading-text")}>Đang tải hình ảnh...</p>
          ) : galleryWorks.length > 0 ? (
            <div className={cx("grid")}>
              {galleryWorks.map((work) => (
                <WorkCard key={work.idBooking} work={work} />
              ))}
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

export default Profile;
