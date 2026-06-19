import React, { useEffect, useState, useRef } from "react";
import styles from "./HoSoCaNhan.module.scss";
import { BarberAPI } from "~/apis/barberAPI";
import { useAuth } from "~/context/AuthContext";
import { useToast } from "~/context/ToastContext";
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
  Lock,
  User,
  AlertCircle,
} from "lucide-react";

// ─── Constants ───────────────────────────────────────────────
const PHONE_REGEX = /^0\d{9}$/;
const DESC_MAX = 500;

const emptyForm = (data = {}) => ({
  fullName: data.fullName || "",
  phoneNumber: data.phoneNumber || "",
  email: data.email || "",
  profileDescription: data.profileDescription || "",
  experienceYears: data.experienceYears ?? "",
  specialty: data.specialty || "",
  style: data.style || "",
  certificates: data.certificates || "",
  philosophy: data.philosophy || "",
});

// ─── Star display helper ──────────────────────────────────────
function StarRow({ score, max = 5 }) {
  return (
    <div className={styles.ratingStars}>
      {Array.from({ length: max }).map((_, i) => (
        <Star
          key={i}
          size={14}
          fill={i < Math.round(score) ? "currentColor" : "none"}
          className={i < Math.round(score) ? styles.starFilled : styles.starEmpty}
        />
      ))}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────
function HoSoCaNhan() {
  const { user,  loading: isAuthLoading } = useAuth();
  const { showToast } = useToast();
  const idBarber = user?.idUser;

  const [barber, setBarber] = useState(null);
  const [formData, setFormData] = useState({});
  const [selectedImg, setSelectedImg] = useState(null);
  const [previewImg, setPreviewImg] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [isDirty, setIsDirty] = useState(false);

  const fileInputRef = useRef(null);

  // ─── Fetch ─────────────────────────────────────────────────
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
        showToast({ text: "Không thể tải hồ sơ. Vui lòng thử lại.", type: "error" });
      } finally {
        setLoading(false);
      }
    })();
  }, [idBarber, isAuthLoading]);

  // ─── Handlers ──────────────────────────────────────────────
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setIsDirty(true);
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate type + size
    if (!file.type.startsWith("image/")) {
      showToast({ text: "Chỉ chấp nhận file ảnh (JPG, PNG, WEBP...).", type: "error" });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showToast({ text: "Ảnh không được vượt quá 5MB.", type: "error" });
      return;
    }

    setSelectedImg(file);
    setPreviewImg(URL.createObjectURL(file));
    setIsDirty(true);
  };

  // ─── Validation ────────────────────────────────────────────
  const validate = () => {
    const errs = {};
    const name = formData.fullName?.trim();
    const phone = formData.phoneNumber?.trim();
    const exp = Number(formData.experienceYears);
    const desc = formData.profileDescription || "";

    if (!name) errs.fullName = "Họ tên không được để trống.";

    if (phone && !PHONE_REGEX.test(phone)) errs.phoneNumber = "Số điện thoại phải gồm 10 số, bắt đầu bằng 0.";

    if (formData.experienceYears !== "" && (isNaN(exp) || exp < 0 || exp > 60))
      errs.experienceYears = "Số năm kinh nghiệm phải từ 0 đến 60.";

    if (desc.length > DESC_MAX) errs.profileDescription = `Tối đa ${DESC_MAX} ký tự.`;

    return errs;
  };

  // ─── Save ──────────────────────────────────────────────────
  const handleSave = async () => {
    if (!idBarber ) return;

    const errs = validate();
    if (Object.keys(errs).length) {
      setErrors(errs);
      const firstMsg = Object.values(errs)[0];
      showToast({ text: firstMsg, type: "error" });
      return;
    }

    setSaving(true);
    try {
      const form = new FormData();
      form.append("fullName", formData.fullName.trim());
      form.append("phoneNumber", formData.phoneNumber?.trim() || "");
      form.append("profileDescription", formData.profileDescription || "");
      form.append("experienceYears", Number(formData.experienceYears) || 0);
      form.append("specialty", formData.specialty || "");
      form.append("style", formData.style || "");
      form.append("certificates", formData.certificates || "");
      form.append("philosophy", formData.philosophy || "");
      if (selectedImg) form.append("image", selectedImg);

      await BarberAPI.updateProfile(idBarber, form);

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
      setIsDirty(false);

      showToast({ text: "Hồ sơ đã được cập nhật thành công!", type: "success" });
    } catch (err) {
      console.error("Lỗi khi lưu:", err);
      const msg = err?.response?.data?.message || err?.message || "Lưu thất bại. Vui lòng thử lại.";
      setErrors({ _server: msg });
      showToast({ text: msg, type: "error" });
    } finally {
      setSaving(false);
    }
  };

  // ─── Cancel ────────────────────────────────────────────────
  const handleCancel = () => {
    if (isDirty) {
      showToast({ text: "Đã hủy chỉnh sửa. Thay đổi chưa được lưu.", type: "info" });
    }
    setFormData(emptyForm(barber));
    setPreviewImg(null);
    setSelectedImg(null);
    setErrors({});
    setIsDirty(false);
    setIsEditing(false);
  };

  const startEdit = () => {
    setFormData(emptyForm(barber));
    setErrors({});
    setIsDirty(false);
    setIsEditing(true);
  };

  // ─── Sub-components ─────────────────────────────────────────

  // Generic field
  const Field = ({ label, name, as = "input", type = "text", placeholder = "", hint, maxLength, readOnly = false }) => {
    const hasError = !!errors[name];
    const val = formData[name] ?? "";
    const showLen = as === "textarea" && maxLength;

    return (
      <div className={styles.fieldGroup}>
        <label className={styles.fieldLabel}>{label}</label>
        {readOnly ? (
          <div className={styles.lockHint}>
            <Lock size={12} />
            {val || "Chưa có thông tin"}
          </div>
        ) : as === "textarea" ? (
          <>
            <textarea
              name={name}
              value={val}
              onChange={handleChange}
              maxLength={maxLength}
              className={[styles.textarea, hasError ? styles.inputError : ""].join(" ")}
              placeholder={placeholder}
              rows={4}
            />
            {showLen && (
              <div className={styles.fieldFooter}>
                <span className={[styles.charCount, val.length > maxLength * 0.9 ? styles.warn : ""].join(" ")}>
                  {val.length} / {maxLength}
                </span>
              </div>
            )}
          </>
        ) : (
          <input
            name={name}
            type={type}
            value={val}
            onChange={handleChange}
            className={[styles.input, hasError ? styles.inputError : ""].join(" ")}
            placeholder={placeholder}
          />
        )}
        {hasError && <p className={styles.errorText}>{errors[name]}</p>}
      </div>
    );
  };

  // ─── Loading / Empty ───────────────────────────────────────
  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <Loader2 size={40} className={styles.loadingIcon} />
        <p>Đang tải thông tin hồ sơ...</p>
      </div>
    );
  }
  if (!barber) {
    return (
      <div className={styles.emptyContainer}>
        <User size={40} />
        <p>Không tìm thấy dữ liệu hồ sơ.</p>
      </div>
    );
  }

  const avgRate = Number(barber.avgRate || 0);
  const totalRate = barber.totalRate || 0;

  // ─── Render ────────────────────────────────────────────────
  return (
    <div className={[styles.container, saving ? styles.savingOverlay : ""].join(" ")}>
      {/* ══════════════ HERO HEADER ══════════════ */}
      <div className={styles.hero}>
        {/* Avatar */}
        <div className={styles.avatarWrap}>
          <img
            src={previewImg || barber.image || "/default-avatar.png"}
            alt={barber.fullName}
            className={styles.avatar}
          />
          {isEditing && (
            <>
              <label htmlFor="uploadImage" className={styles.avatarEditLabel} title="Đổi ảnh đại diện">
                <Camera size={20} />
                Đổi ảnh
              </label>
              <input
                id="uploadImage"
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                onChange={handleImageChange}
              />
            </>
          )}
        </div>

        {/* Name + meta */}
        <div className={styles.heroInfo}>
          <h2 className={styles.heroName}>{barber.fullName}</h2>

          {barber.planName && (
            <span className={styles.heroPlan}>
              <Award size={11} /> {barber.planName}
            </span>
          )}

          <div className={styles.heroMeta}>
            {(barber.branchName || barber.branchAddress) && (
              <span className={styles.heroMetaItem}>
                <MapPin size={13} />
                <strong>
                  {barber.branchName}
                  {barber.branchAddress ? ` — ${barber.branchAddress}` : ""}
                </strong>
              </span>
            )}
            {barber.experienceYears > 0 && (
              <span className={styles.heroMetaItem}>
                <Scissors size={13} />
                <strong>{barber.experienceYears} năm kinh nghiệm</strong>
              </span>
            )}

            <span className={styles.heroMetaBreak} />

            <span className={styles.heroMetaItem}>
              <Phone size={13} /> <strong>{barber.phoneNumber || "—"}</strong>
            </span>
            <span className={styles.heroMetaItem}>
              <Mail size={13} /> <strong>{barber.email || "—"}</strong>
            </span>
          </div>
        </div>

        {/* Rating */}
        <div className={styles.heroRating}>
          <span className={styles.ratingScore}>{avgRate.toFixed(1)}</span>
          <StarRow score={avgRate} />
          <span className={styles.ratingCount}>{totalRate.toLocaleString("vi-VN")} lượt đánh giá</span>
        </div>
      </div>

      {/* ══════════════ BODY ══════════════ */}
      <div className={styles.body}>
        {/* Server error banner */}
        {errors._server && (
          <div className={styles.serverError}>
            <AlertCircle size={14} /> {errors._server}
          </div>
        )}

        {/* ── SECTION 1: Giới thiệu bản thân ── */}
        <div className={styles.section}>
          <h3 className={styles.sectionHead}>
            <BookOpen size={13} /> Giới thiệu bản thân
          </h3>

          {isEditing ? (
            <Field
              name="profileDescription"
              as="textarea"
              placeholder="Chia sẻ về kinh nghiệm, phong cách và điểm mạnh của bạn..."
              maxLength={DESC_MAX}
            />
          ) : (
            <pre className={[styles.descPre, !barber.profileDescription ? styles.muted : ""].join(" ")}>
              {barber.profileDescription || "Chưa có thông tin giới thiệu."}
            </pre>
          )}
        </div>

        {/* ── SECTION 2: Liên hệ & Thông tin cá nhân ── */}
        <div className={styles.section}>
          <h3 className={styles.sectionHead}>
            <User size={13} /> Thông tin cá nhân
          </h3>

          {isEditing ? (
            <div className={styles.editForm}>
              <div className={styles.grid2}>
                <Field label="Họ và tên *" name="fullName" placeholder="Nguyễn Văn A" />
                <Field label="Số điện thoại" name="phoneNumber" placeholder="0912345678" />
              </div>

              {/* Email — readonly */}
              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>Email</label>
                <div className={styles.lockHint}>
                  <Lock size={12} />
                  {formData.email || "Chưa có email"} — không thể thay đổi email
                </div>
              </div>

              {/* Branch — readonly */}
              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>Chi nhánh</label>
                <div className={styles.lockHint}>
                  <Lock size={12} />
                  {barber.branchName
                    ? `${barber.branchName}${barber.branchAddress ? " — " + barber.branchAddress : ""}`
                    : "Chưa có chi nhánh"}{" "}
                  — do quản trị viên quản lý
                </div>
              </div>
            </div>
          ) : (
            <div className={styles.infoGrid}>
              <div className={styles.infoCard}>
                <span className={styles.infoLabel}>Họ và tên</span>
                <span className={styles.infoValue}>{barber.fullName || "—"}</span>
              </div>
              <div className={styles.infoCard}>
                <span className={styles.infoLabel}>Số điện thoại</span>
                <span className={[styles.infoValue, !barber.phoneNumber ? styles.muted : ""].join(" ")}>
                  {barber.phoneNumber || "Chưa cập nhật"}
                </span>
              </div>
              <div className={styles.infoCard}>
                <span className={styles.infoLabel}>Email</span>
                <span className={styles.infoValue}>{barber.email || "—"}</span>
              </div>
              <div className={styles.infoCard}>
                <span className={styles.infoLabel}>Chi nhánh</span>
                <span className={[styles.infoValue, !barber.branchName ? styles.muted : ""].join(" ")}>
                  {barber.branchName
                    ? `${barber.branchName}${barber.branchAddress ? " — " + barber.branchAddress : ""}`
                    : "Chưa có chi nhánh"}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* ── SECTION 3: Chuyên môn & Phong cách ── */}
        <div className={styles.section}>
          <h3 className={styles.sectionHead}>
            <Scissors size={13} /> Chuyên môn & Phong cách
          </h3>

          {isEditing ? (
            <div className={styles.editForm}>
              <div className={styles.grid3}>
                <Field label="Số năm kinh nghiệm" name="experienceYears" type="number" placeholder="0" />
                <Field label="Chuyên môn" name="specialty" placeholder="Fade, Undercut, Pompadour..." />
                <Field label="Phong cách" name="style" placeholder="Classic, Modern, Korean..." />
              </div>
            </div>
          ) : (
            <div className={styles.infoGrid}>
              <div className={styles.infoCard}>
                <span className={styles.infoLabel}>Kinh nghiệm</span>
                <span className={[styles.infoValue, !barber.experienceYears ? styles.muted : ""].join(" ")}>
                  {barber.experienceYears ? `${barber.experienceYears} năm` : "Chưa cập nhật"}
                </span>
              </div>
              <div className={styles.infoCard}>
                <span className={styles.infoLabel}>Chuyên môn</span>
                <span className={[styles.infoValue, !barber.specialty ? styles.muted : ""].join(" ")}>
                  {barber.specialty || "Chưa cập nhật"}
                </span>
              </div>
              <div className={styles.infoCard}>
                <span className={styles.infoLabel}>Phong cách</span>
                <span className={[styles.infoValue, !barber.style ? styles.muted : ""].join(" ")}>
                  {barber.style || "Chưa cập nhật"}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* ── SECTION 4: Bằng cấp & Triết lý ── */}
        <div className={styles.section}>
          <h3 className={styles.sectionHead}>
            <Award size={13} /> Bằng cấp & Triết lý
          </h3>

          {isEditing ? (
            <div className={styles.editForm}>
              <Field
                label="Bằng cấp / Chứng chỉ"
                name="certificates"
                as="textarea"
                placeholder="Chứng chỉ cắt tóc nam, Khóa học tạo kiểu quốc tế..."
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
              <div className={[styles.infoCard, styles.wide].join(" ")}>
                <span className={styles.infoLabel}>Bằng cấp / Chứng chỉ</span>
                <span className={[styles.infoValue, !barber.certificates ? styles.muted : ""].join(" ")}>
                  {barber.certificates || "Chưa cập nhật"}
                </span>
              </div>
              <div className={[styles.infoCard, styles.wide].join(" ")}>
                <span className={styles.infoLabel}>Triết lý nghề nghiệp</span>
                <span className={[styles.infoValue, !barber.philosophy ? styles.muted : ""].join(" ")}>
                  {barber.philosophy || "Chưa cập nhật"}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ══════════════ ACTIONS BAR ══════════════ */}
      <div className={styles.actions}>
        {isEditing ? (
          <>
            <button className={styles.btnCancel} onClick={handleCancel} disabled={saving}>
              <X size={15} /> Hủy
            </button>
            <button className={styles.btnSave} onClick={handleSave} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 size={15} className={styles.spin} /> Đang lưu...
                </>
              ) : (
                <>
                  <Save size={15} />
                  Lưu thay đổi
                  {isDirty && <span className={styles.unsavedDot} />}
                </>
              )}
            </button>
          </>
        ) : (
          <button className={styles.btnEdit} onClick={startEdit}>
            <Edit3 size={15} /> Chỉnh sửa hồ sơ
          </button>
        )}
      </div>
    </div>
  );
}

export default HoSoCaNhan;
