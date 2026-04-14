// src/components/AddBannerModal/AddBannerModal.jsx
import { useState } from "react";
import styles from "./AddBannerModal.module.scss";

const AddBannerModal = ({ isOpen, onClose, onSubmit }) => {
  const [title, setTitle] = useState("");
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [startAt, setStartAt] = useState("");
  const [endAt, setEndAt] = useState("");

  if (!isOpen) return null;

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setImage(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleSubmit = () => {
    if (!image) {
      alert("Vui lòng chọn ảnh banner");
      return;
    }

    onSubmit({
      title: title.trim() || null,     // tùy chọn, để trống → null
      image,
      startAt: startAt || null,
      endAt: endAt || null,
    });

    onClose();
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <h3>Thêm banner mới</h3>

        {/* Title - tùy chọn */}
        <label className={styles.inputGroup}>
          Tiêu đề banner (tùy chọn)
          <input
            type="text"
            placeholder="Ví dụ: Khuyến mãi cắt tóc 20%"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </label>

        {/* Ảnh - BẮT BUỘC, luôn hiển thị */}
        <label className={styles.upload}>
          Chọn ảnh banner <span style={{ color: "#d00" }}>*</span>
          <input type="file" accept="image/*" onChange={handleImageChange} />
        </label>

        {/* Preview */}
        {preview && (
          <div className={styles.preview}>
            <img src={preview} alt="Preview banner" />
          </div>
        )}

        {/* Ngày - đơn giản, tùy chọn */}
        <div className={styles.time}>
          <div className={styles.timeItem}>
            <label>Ngày bắt đầu (tùy chọn)</label>
            <input
              type="date"
              value={startAt}
              onChange={(e) => setStartAt(e.target.value)}
            />
          </div>

          <div className={styles.timeItem}>
            <label>Ngày kết thúc (tùy chọn)</label>
            <input
              type="date"
              value={endAt}
              onChange={(e) => setEndAt(e.target.value)}
            />
          </div>
        </div>

        {/* Actions */}
        <div className={styles.actions}>
          <button className={styles.cancel} onClick={onClose}>
            Hủy
          </button>
          <button className={styles.submit} onClick={handleSubmit}>
            Thêm banner
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddBannerModal;