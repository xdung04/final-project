// components/ConfirmModal/ConfirmModal.jsx
import styles from "./ConfirmModal.module.scss";

const ConfirmModal = ({
  isOpen,
  title,
  message,
  confirmText = "Xác nhận",
  cancelText = "Huỷ",
  confirmType = "danger", // "danger" | "warning" | "primary"
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onCancel}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.icon}>
          {confirmType === "danger" && "🚪"}
          {confirmType === "warning" && "⚠️"}
          {confirmType === "primary" && "💬"}
        </div>
        <h3 className={styles.title}>{title}</h3>
        {message && <p className={styles.message}>{message}</p>}
        <div className={styles.actions}>
          <button className={styles.cancelBtn} onClick={onCancel}>
            {cancelText}
          </button>
          <button
            className={`${styles.confirmBtn} ${styles[confirmType]}`}
            onClick={onConfirm}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;