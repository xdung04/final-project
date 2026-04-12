import { useState } from "react";
import classNames from "classnames/bind";

import Input from "~/components/Input";
import Button from "~/components/Button";
import styles from "./ForgetPass.module.scss";

import { AuthAPI } from "~/apis/AuthAPI";
import { useToast } from "~/context/ToastContext";

const cx = classNames.bind(styles);

function ForgetPass({ onSwitch }) {
  const [formData, setFormData] = useState({ email: "", otp: "" });
  const [otpSent, setOtpSent] = useState(false);
  const { showToast } = useToast();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // gửi OTP
  const handleSendOtp = async () => {
    try {
      const res = await AuthAPI.forgotPassword({ email: formData.email });
      showToast({
        text: res.message || "OTP đã gửi về email",
        type: "success",
      });
      setOtpSent(true);
    } catch (err) {
      showToast({ text: err.error || "Không gửi được OTP", type: "error" });
    }
  };

  // xác thực OTP
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await AuthAPI.verifyForgotOtp({
        email: formData.email,
        otp: formData.otp,
      });
      showToast({
        text: res.message || "Xác thực OTP thành công",
        type: "success",
      });
      onSwitch("newpass", { email: formData.email }); // truyền email sang bước nhập mật khẩu mới
    } catch (err) {
      showToast({ text: err.error || "OTP không hợp lệ", type: "error" });
    }
  };

return (
    <div className={cx("wrapper")}>
      <div className={cx("inner")}>
        <h4 className={cx("heading")}>Quên mật khẩu</h4>
        <div className={cx("body")}>
          <p>
            Bạn đã nhớ lại mật khẩu?
            <a href="#" onClick={(e) => { e.preventDefault(); onSwitch("Login"); }}>
              Đăng nhập
            </a>
          </p>
          <form onSubmit={handleSubmit}>
            <Input
              name="email"
              required
              placeholder="Email đăng ký"
              value={formData.email}
              onChange={handleChange}
            />

            <div className={cx("otp")}>
              <Input
                name="otp"
                required
                placeholder="OTP"
                type="number"
                value={formData.otp}
                onChange={handleChange}
              />
              <Button
                type="button"
                onClick={handleSendOtp}
                disabled={otpSent}
                className={cx("otpBtn")} // Thêm class này
              >
                {otpSent ? "Gửi lại" : "Lấy mã"}
              </Button>
            </div>

            <Button type="submit" className={cx("submitBtn")}> {/* Thêm class này */}
              Xác nhận OTP
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default ForgetPass;
