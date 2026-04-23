import React, { useEffect, useState } from "react";
import styles from "./HoSoCaNhan.module.scss";
import { BarberAPI } from "~/apis/barberAPI";
import { useAuth } from "~/context/AuthContext";

function HoSoCaNhan() {
  const { user, accessToken, loading: isAuthLoading } = useAuth();
  const idBarber = user?.idUser;
  const [barber, setBarber] = useState(null);
  const [formData, setFormData] = useState({});
  const [selectedImage, setSelectedImage] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [phoneError, setPhoneError] = useState("");


  useEffect(() => {
    if (isAuthLoading || !idBarber) {
      if (!isAuthLoading) setLoading(false);
      return;
    }

    const fetchProfile = async () => {
      setLoading(true);
      try {
        const data = await BarberAPI.getProfile(idBarber);
        setBarber(data);
        setFormData(data);
      } catch (err) {
        console.error("Lỗi tải hồ sơ:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [idBarber, isAuthLoading]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };
  const isValidPhone = (phone) => {
    const regex = /^0\d{9}$/; // phải có 10 số và bắt đầu bằng 0
    return regex.test(phone);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedImage(file);
      setPreviewImage(URL.createObjectURL(file));
    }
  };

  const handleSave = async () => {
    if (!idBarber || !accessToken) return;

    // 🚨 Validate số điện thoại trước khi gửi API
    if (!isValidPhone(formData.phoneNumber)) {
      setPhoneError("Số điện thoại không hợp lệ! Vui lòng nhập 10 số và bắt đầu bằng 0.");
      return;
    } else {
      setPhoneError("");
    }

    setSaving(true);
    try {
      const form = new FormData();
      form.append("fullName", formData.fullName);
      form.append("phoneNumber", formData.phoneNumber);
      form.append("profileDescription", formData.profileDescription);
      if (selectedImage) form.append("image", selectedImage);

      await BarberAPI.updateProfile(idBarber, form, accessToken);

      setBarber({
        ...formData,
        image: previewImage || formData.image,
      });

      setIsEditing(false);
    } catch (err) {
      console.error("Lỗi khi lưu:", err);
    } finally {
      setSaving(false);
    }
  };


  const handleCancel = () => {
    setFormData(barber);
    setPreviewImage(null);
    setSelectedImage(null);
    setIsEditing(false);
  };

  if (loading) return <div className={styles.loading}>Đang tải...</div>;
  if (!barber) return <div className={styles.empty}>Không có dữ liệu.</div>;

  return (
    <div
      className={`${styles.container} ${saving ? styles.savingState : ""}`}
    >
      <div className={styles.header}>
        <div className={styles.avatarBox}>
          <img
            src={previewImage || barber.image || "/default-avatar.png"}
            alt={barber.fullName}
            className={styles.avatar}
          />
          {isEditing && (
            <>
              <label htmlFor="uploadImage" className={styles.changeAvatar}>
                Đổi ảnh
              </label>
              <input
                id="uploadImage"
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                onChange={handleImageChange}
              />
            </>
          )}
        </div>

        <div className={styles.info}>
          {isEditing ? (
            <>
              <input
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                className={styles.input}
                placeholder="Họ và tên"
              />
              <input
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleChange}
                className={styles.input}
                placeholder="Số điện thoại"
              />

              {phoneError && (
                <p className={styles.errorText}>{phoneError}</p>
              )}

              <input
                name="email"
                value={formData.email}
                disabled
                className={`${styles.input} ${styles.disabled}`}
                title="Không thể chỉnh sửa email"
              />
            </>
          ) : (
            <>
              <h2 className={styles.name}>{barber.fullName}</h2>
              <p className={styles.branch}>
                {barber.branchName} • {barber.branchAddress}
              </p>
              <p className={styles.contact}>
                📧 {barber.email} | ☎️ {barber.phoneNumber}
              </p>
            </>
          )}

          <div className={styles.ratingBox}>
            <span className={styles.star}>⭐</span>
            <span className={styles.rating}>
              {barber.avgRate} / 5 ({barber.totalRate} lượt đánh giá)
            </span>
          </div>
        </div>
      </div>

      <div className={styles.section}>
        <h3>Giới thiệu & Kinh nghiệm</h3>
        {isEditing ? (
          <textarea
            name="profileDescription"
            value={formData.profileDescription}
            onChange={handleChange}
            className={styles.textarea}
            rows={7}
          />
        ) : (
          <pre className={styles.desc}>{barber.profileDescription}</pre>
        )}
      </div>

      <div className={styles.actions}>
        {isEditing ? (
          <>
            <button
              className={styles.saveBtn}
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? "Đang lưu..." : "Lưu thay đổi"}
            </button>
            <button
              className={styles.cancelBtn}
              onClick={handleCancel}
              disabled={saving}
            >
              Hủy
            </button>
          </>
        ) : (
          <button
            className={styles.editBtn}
            onClick={() => setIsEditing(true)}
            disabled={saving}
          >
            Chỉnh sửa hồ sơ
          </button>
        )}
      </div>
    </div>
  );
}

export default HoSoCaNhan;
