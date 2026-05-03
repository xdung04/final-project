import classNames from "classnames/bind";
import { SuccessIcon, CloseIcon, ErrorIcon, InfoIcon } from "~/components/Icons";
import styles from "./Toast.module.scss";
import { useEffect, useState } from "react";

const cx = classNames.bind(styles);

function Toast({ type, text, duration = 3000, onClose }) {
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

  return (
    <div className={cx("wrapper", { "fade-out": fadeOut })}>
      <div className={cx("inner", type)}>
        <div className={cx("body")}>
          
          {/* ✅ FIX LOGIC ICON */}
          <div className={cx("icon")}>
            {type === "success" && <SuccessIcon />}
            {type === "error" && <ErrorIcon />}
            {type === "info" && <InfoIcon />}
          </div>

          <div className={cx("text")}>{text}</div>

          <button className={cx("close")} onClick={() => setFadeOut(true)}>
            <CloseIcon />
          </button>
        </div>

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