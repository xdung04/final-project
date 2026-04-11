import classNames from "classnames/bind";
import { SuccessIcon, CloseIcon, ErrorIcon } from "~/components/Icons";
import styles from "./Toast.module.scss";
import { useEffect, useState } from "react";

const cx = classNames.bind(styles);

function Toast({ type, text, duration = 3000, onClose }) {
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    // Bắt đầu hiệu ứng biến mất trước khi đóng hẳn 400ms (khớp với CSS)
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

  return (
    <div className={cx("wrapper", { "fade-out": fadeOut })}>
      <div className={cx("inner", type)}>
        <div className={cx("body")}>
          <div className={cx("icon")}>
            {type === "success" ? <SuccessIcon /> : <ErrorIcon />}
          </div>
          
          <div className={cx("text")}>{text}</div>

          <button className={cx("close")} onClick={() => setFadeOut(true)}>
            <CloseIcon />
          </button>
        </div>

        {/* Thanh tiến trình màu Gold chạy ngược */}
        <div className={cx("progress-bar")}>
          <div 
            className={cx("fill")} 
            style={{ animationDuration: `${duration}ms` }}
          ></div>
        </div>
      </div>
    </div>
  );
}

export default Toast;