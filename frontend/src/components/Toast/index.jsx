import classNames from "classnames/bind";
import { SuccessIcon, CloseIcon, ErrorIcon, InfoIcon } from "~/components/Icons";
import styles from "./Toast.module.scss";
import { useEffect, useState } from "react";

const cx = classNames.bind(styles);

const TYPE_LABEL = {
  success: "Thành công",
  error: "Lỗi",
  info: "Thông báo",
};

function Toast({ type, text, message, duration = 3000, onClose }) {
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const fadeTimeout = setTimeout(() => {
      setFadeOut(true);
    }, duration - 400);

    const closeTimeout = setTimeout(() => {
      onClose?.();
    }, duration);

    return () => {
      clearTimeout(fadeTimeout);
      clearTimeout(closeTimeout);
    };
  }, [duration, onClose]);

  const handleClose = () => {
    setFadeOut(true);
    setTimeout(() => onClose?.(), 400);
  };

  return (
    <div className={cx("wrapper", { "fade-out": fadeOut })}>
      <div className={cx("inner", type)}>

        <div className={cx("body")}>
          <div className={cx("icon")}>
            {type === "success" && <SuccessIcon />}
            {type === "error" && <ErrorIcon />}
            {type === "info" && <InfoIcon />}
          </div>

          <div className={cx("content")}>
            <span className={cx("label")}>{TYPE_LABEL[type] ?? type}</span>
            <span className={cx("text")}>{message || text}</span>
          </div>

          <button className={cx("close")} onClick={handleClose} aria-label="Đóng">
            <CloseIcon />
          </button>
        </div>

        <div className={cx("progress-bar")}>
          <div
            className={cx("fill")}
            style={{ animationDuration: `${duration}ms` }}
          />
        </div>

      </div>
    </div>
  );
}

export default Toast;