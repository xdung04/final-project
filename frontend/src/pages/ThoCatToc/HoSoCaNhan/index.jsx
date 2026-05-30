import React, { useEffect, useState } from "react";
import styles from "./HoSoCaNhan.module.scss";
import { BarberAPI } from "~/apis/barberAPI";
import { useAuth } from "~/context/AuthContext";
import {
  Mail,
  Phone,
  MapPin,
  Star,
  Camera,
  Edit3,
  Save,
  X,
  Loader2,
  Scissors,
  Award,
  BookOpen,
  Palette,
} from "lucide-react";

const PHONE_REGEX = /^0\d{9}$/;

const emptyForm = (data = {}) => ({
  fullName: data.fullName || "",
  phoneNumber: data.phoneNumber || "",
  email: data.email || "",
  profileDescription: data.profileDescription || "",
  experienceYears: data.experienceYears ?? 0,
  specialty: data.specialty || "",
  style: data.style || "",
  certificates: data.certificates || "",
  philosophy: data.philosophy || "",
});

function HoSoCaNhan() {
  const { user, accessToken, loading: isAuthLoading } = useAuth();
  const idBarber = user?.idUser;

  const [barber, setBarber] = useState(null);
  const [formData, setFormData] = useState({});
  const [selectedImg, setSelectedImg] = useState(null);
  const [previewImg, setPreviewImg] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  /* ── Fetch ──────────────────────────────────────────── */
  useEffect(() => {
    if (isAuthLoading || !idBarber) {
      if (!isAuthLoading) setLoading(false);
      return;
    }
    (async () => {
      setLoading(true);
      try {
        const data = await BarberAPI.getProfile(idBarber);
        setBarber(data);
        setFormData(emptyForm(data));
      } catch (err) {
        console.error("Lỗi tải hồ sơ:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, [idBarber, isAuthLoading]);

  /* ── Handlers ───────────────────────────────────────── */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setSelectedImg(file);
    setPreviewImg(URL.createObjectURL(file));
  };

  const validate = () => {
    const errs = {};
    if (!formData.fullName?.trim()) errs.fullName = "Họ tên không được để trống.";
    if (formData.phoneNumber && !PHONE_REGEX.test(formData.phoneNumber))
      errs.phoneNumber = "Số điện thoại phải là 10 số, bắt đầu bằng 0.";
    const exp = Number(formData.experienceYears);
    if (formData.experienceYears !== "" && (isNaN(exp) || exp < 0 || exp > 50))
      errs.experienceYears = "Số năm kinh nghiệm phải từ 0 đến 50.";
    return errs;
  };

  const handleSave = async () => {
    if (!idBarber || !accessToken) return;
    const errs = validate();
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }

    setSaving(true);
    try {
      const form = new FormData();
      form.append("fullName", formData.fullName);
      form.append("phoneNumber", formData.phoneNumber);
      form.append("profileDescription", formData.profileDescription);
      form.append("experienceYears", Number(formData.experienceYears) || 0);
      form.append("specialty", formData.specialty || "");
      form.append("style", formData.style || "");
      form.append("certificates", formData.certificates || "");
      form.append("philosophy", formData.philosophy || "");
      if (selectedImg) form.append("image", selectedImg);

      await BarberAPI.updateProfile(idBarber, form, accessToken);

      const updated = {
        ...barber,
        ...formData,
        image: previewImg || barber.image,
      };
      setBarber(updated);
      setFormData(emptyForm(updated));
      setIsEditing(false);
      setSelectedImg(null);
      setPreviewImg(null);
      setErrors({});
    } catch (err) {
      console.error("Lỗi khi lưu:", err);
      setErrors({ _server: err?.message || "Lưu thất bại. Vui lòng thử lại." });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData(emptyForm(barber));
    setPreviewImg(null);
    setSelectedImg(null);
    setErrors({});
    setIsEditing(false);
  };

  /* ── Render helpers ─────────────────────────────────── */
  const Field = ({ label, name, as = "input", placeholder = "", type = "text" }) => {
    const hasError = !!errors[name];
    return (
      <div className={styles.fieldGroup}>
        <label className={styles.fieldLabel}>{label}</label>
        {as === "textarea" ? (
          <textarea
            name={name}
            value={formData[name]}
            onChange={handleChange}
            className={`${styles.textarea} ${hasError ? styles.inputError : ""}`}
            placeholder={placeholder}
            rows={4}
          />
        ) : (
          <input
            name={name}
            type={type}
            value={formData[name]}
            onChange={handleChange}
            className={`${styles.input} ${hasError ? styles.inputError : ""}`}
            placeholder={placeholder}
          />
        )}
        {hasError && <p className={styles.errorText}>{errors[name]}</p>}
      </div>
    );
  };

  /* ── Loading / empty ────────────────────────────────── */
  if (loading)
    return (
      <div className={styles.loadingContainer}>
        <Loader2 size={40} className={styles.loadingIcon} />
        <p>Đang tải thông tin hồ sơ...</p>
      </div>
    );
  if (!barber)
    return (
      <div className={styles.emptyContainer}>
        <p>Không tìm thấy dữ liệu hồ sơ.</p>
      </div>
    );

  /* ── Render ─────────────────────────────────────────── */
  return (
    <div className={`${styles.container} ${saving ? styles.savingState : ""}`}>
      {/* ── Header ── */}
      <div className={styles.header}>
        <div className={styles.avatarBox}>
          <img
            src={previewImg || barber.image || "/default-avatar.png"}
            alt={barber.fullName}
            className={styles.avatar}
          />
          {isEditing && (
            <>
              <label htmlFor="uploadImage" className={styles.changeAvatar}>
                <Camera size={16} />
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
            <div className={styles.editForm}>
              <Field label="Họ và tên *" name="fullName" placeholder="Nguyễn Văn A" />
              <Field label="Số điện thoại" name="phoneNumber" placeholder="0912345678" />
              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>Email</label>
                <input
                  value={formData.email}
                  disabled
                  className={`${styles.input} ${styles.disabled}`}
                  title="Không thể chỉnh sửa email"
                />
              </div>
            </div>
          ) : (
            <>
              <h2 className={styles.name}>{barber.fullName}</h2>
              <p className={styles.branch}>
                <MapPin size={16} />
                {barber.branchName || "Chưa có chi nhánh"}
                {barber.branchAddress ? ` • ${barber.branchAddress}` : ""}
              </p>
              <div className={styles.contact}>
                <span>
                  <Mail size={16} /> {barber.email || "—"}
                </span>
                <span>
                  <Phone size={16} /> {barber.phoneNumber || "—"}
                </span>
              </div>
              {barber.experienceYears > 0 && (
                <div className={styles.expBadge}>
                  <Scissors size={14} />
                  {barber.experienceYears} năm kinh nghiệm
                </div>
              )}
            </>
          )}

          <div className={styles.ratingBox}>
            <Star size={18} fill="currentColor" className={styles.starIcon} />
            <span className={styles.rating}>
              <strong>{Number(barber.avgRate || 0).toFixed(1)}</strong> / 5 &nbsp;({barber.totalRate || 0} lượt đánh
              giá)
            </span>
          </div>
        </div>
      </div>

      {/* ── Lỗi server ── */}
      {errors._server && <div className={styles.serverError}>{errors._server}</div>}

      {/* ── Section: Giới thiệu ── */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>
          <BookOpen size={14} /> Giới thiệu bản thân
        </h3>
        {isEditing ? (
          <Field
            label="Mô tả / Giới thiệu"
            name="profileDescription"
            as="textarea"
            placeholder="Chia sẻ về kinh nghiệm và phong cách cắt tóc của bạn..."
          />
        ) : (
          <pre className={styles.desc}>{barber.profileDescription || "Chưa có thông tin giới thiệu."}</pre>
        )}
      </div>

      {/* ── Section: Chuyên môn ── */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>
          <Scissors size={14} /> Chuyên môn & Phong cách
        </h3>
        {isEditing ? (
          <div className={styles.grid2}>
            <Field label="Số năm kinh nghiệm" name="experienceYears" type="number" placeholder="0" />
            <Field label="Chuyên môn" name="specialty" placeholder="VD: Fade, Undercut, Pompadour..." />
            <Field label="Phong cách" name="style" placeholder="VD: Classic, Modern, Korean..." />
          </div>
        ) : (
          <div className={styles.infoGrid}>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Kinh nghiệm</span>
              <span className={styles.infoValue}>{barber.experienceYears ? `${barber.experienceYears} năm` : "—"}</span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Chuyên môn</span>
              <span className={styles.infoValue}>{barber.specialty || "—"}</span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Phong cách</span>
              <span className={styles.infoValue}>{barber.style || "—"}</span>
            </div>
          </div>
        )}
      </div>

      {/* ── Section: Bằng cấp & Triết lý ── */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>
          <Award size={14} /> Bằng cấp & Triết lý
        </h3>
        {isEditing ? (
          <div className={styles.grid1}>
            <Field
              label="Bằng cấp / Chứng chỉ"
              name="certificates"
              as="textarea"
              placeholder="VD: Chứng chỉ cắt tóc nam, Khóa học tạo kiểu quốc tế..."
            />
            <Field
              label="Triết lý nghề nghiệp"
              name="philosophy"
              as="textarea"
              placeholder="Chia sẻ quan điểm và tâm huyết của bạn với nghề..."
            />
          </div>
        ) : (
          <div className={styles.infoGrid}>
            <div className={styles.infoItem} style={{ gridColumn: "1/-1" }}>
              <span className={styles.infoLabel}>Bằng cấp / Chứng chỉ</span>
              <span className={styles.infoValue}>{barber.certificates || "—"}</span>
            </div>
            <div className={styles.infoItem} style={{ gridColumn: "1/-1" }}>
              <span className={styles.infoLabel}>Triết lý nghề nghiệp</span>
              <span className={styles.infoValue}>{barber.philosophy || "—"}</span>
            </div>
          </div>
        )}
      </div>

      {/* ── Actions ── */}
      <div className={styles.actions}>
        {isEditing ? (
          <>
            <button className={styles.cancelBtn} onClick={handleCancel} disabled={saving}>
              <X size={18} /> Hủy
            </button>
            <button className={styles.saveBtn} onClick={handleSave} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 size={18} className={styles.spin} /> Đang lưu...
                </>
              ) : (
                <>
                  <Save size={18} /> Lưu thay đổi
                </>
              )}
            </button>
          </>
        ) : (
          <button className={styles.editBtn} onClick={() => setIsEditing(true)}>
            <Edit3 size={18} /> Chỉnh sửa hồ sơ
          </button>
        )}
      </div>
    </div>
  );
}

export default HoSoCaNhan;
