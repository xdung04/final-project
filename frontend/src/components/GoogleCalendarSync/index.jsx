import { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheckCircle, faTrashAlt } from "@fortawesome/free-solid-svg-icons";
import { faGoogle } from "@fortawesome/free-brands-svg-icons";
import { useAuth } from "~/context/AuthContext";
import { useToast } from "~/context/ToastContext";
import {
  getCalendarLinkStatus,
  getGoogleAuthUrl,
  unlinkCalendar,
} from "~/services/calendarService";
import ConfirmModal from "../ComfirmModal/index";
import styles from "./GoogleCalendarSync.module.scss";

function GoogleCalendarSync({ onCloseMenu, isMenuOpen }) {
  const { isLogin } = useAuth();
  const { showToast } = useToast();
  const [status, setStatus] = useState({ linked: false, email: null });
  const [loading, setLoading] = useState(false);
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: "",
    message: "",
    confirmText: "Xác nhận",
    cancelText: "Huỷ",
    confirmType: "danger",
    onConfirm: null,
    onCancel: null,
  });
  const closeConfirmModal = () =>
    setConfirmModal((prev) => ({ ...prev, isOpen: false }));

  // ========== ĐỊNH NGHĨA fetchStatus TRƯỚC KHI DÙNG ==========
const fetchStatus = async () => {
  if (!isLogin) return;        // thay !accessToken
  try {
    const data = await getCalendarLinkStatus(); // bỏ accessToken
    setStatus(data);
  } catch (err) {
    console.error(err);
  }
};

  // ========== XỬ LÝ CALLBACK TỪ GOOGLE (CHẠY 1 LẦN) ==========
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("calendar") === "linked") {
      showToast({
        text: "Liên kết Google Calendar thành công!",
        type: "success",
      });
      const newUrl =
        window.location.pathname +
        window.location.search
          .replace(/[?&]calendar=linked/, "")
          .replace(/^&/, "?");
      window.history.replaceState({}, "", newUrl);
      fetchStatus();             // ✅ giờ đã an toàn
    } else if (params.get("calendar") === "error") {
      const msg = params.get("message") || "Liên kết thất bại";
      showToast({ text: decodeURIComponent(msg), type: "error" });
      const newUrl =
        window.location.pathname +
        window.location.search
          .replace(/[?&]calendar=error[^&]*/, "")
          .replace(/^&/, "?");
      window.history.replaceState({}, "", newUrl);
    }
  }, []); // chỉ phụ thuộc fetchStatus? fetchStatus ổn định nên OK

  // ========== CẬP NHẬT STATUS KHI MỞ MENU ==========
  useEffect(() => {
    if (isMenuOpen && isLogin) {
      fetchStatus();
    }
  }, [isMenuOpen, isLogin]);

  const handleLink = async () => {
    if (!isLogin) {
      showToast({ text: "Vui lòng đăng nhập", type: "error" });
      return;
    }
    setLoading(true);
    try {
      const returnUrl = window.location.pathname + window.location.search;
      const url = await getGoogleAuthUrl( returnUrl);
      window.location.href = url;
    } catch (err) {
      showToast({ text: "Không thể tạo link liên kết", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleUnlink = () => {
    setConfirmModal({
      isOpen: true,
      title: "Hủy liên kết Google Calendar",
      message: "Bạn có chắc muốn hủy liên kết Google Calendar?",
      confirmText: "Hủy liên kết",
      confirmType: "danger",
      onConfirm: async () => {
        closeConfirmModal();
        setLoading(true);
        try {
          await unlinkCalendar();
          showToast({
            text: "Đã hủy liên kết Google Calendar",
            type: "success",
          });
          await fetchStatus();
          if (onCloseMenu) onCloseMenu();
        } catch (err) {
          showToast({ text: "Hủy liên kết thất bại", type: "error" });
        } finally {
          setLoading(false);
        }
      },
      onCancel: closeConfirmModal,
    });
  };

  if (!isLogin) return null;

  return (
    <>
      <div className={styles.container}>
        {!status.linked ? (
          <button
            className={styles.syncButton}
            onClick={handleLink}
            disabled={loading}
          >
            <FontAwesomeIcon icon={faGoogle} className={styles.icon} />
            <div className={styles.label}>
              {loading ? "Đang xử lý..." : "Liên kết Google Calendar"}
            </div>
          </button>
        ) : (
          <>
            <div className={styles.linkedMainItem}>
              <FontAwesomeIcon icon={faGoogle} className={styles.icon} />
              <div className={styles.label}>Google Calendar</div>
            </div>
            <div className={styles.linkedSubRow}>
              <div className={styles.infoLeft}>
                <FontAwesomeIcon
                  icon={faCheckCircle}
                  className={styles.checkIcon}
                />
                <span className={styles.email}>{status.email}</span>
              </div>
              <button
                className={styles.unlinkBtn}
                onClick={handleUnlink}
                disabled={loading}
                title="Hủy liên kết"
              >
                <FontAwesomeIcon
                  icon={faTrashAlt}
                  className={styles.trashIcon}
                />
                <span className={styles.btnText}></span>
              </button>
            </div>
          </>
        )}
      </div>
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmText={confirmModal.confirmText}
        cancelText={confirmModal.cancelText}
        confirmType={confirmModal.confirmType}
        onConfirm={confirmModal.onConfirm}
        onCancel={confirmModal.onCancel}
      />
    </>
  );
}

export default GoogleCalendarSync;