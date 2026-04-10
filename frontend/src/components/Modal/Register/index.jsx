import { useState } from "react";
import classNames from "classnames/bind";
import { useToast } from "~/context/ToastContext";
import { AuthAPI } from "~/apis/AuthAPI";

import Input from "~/components/Input";
import Button from "~/components/Button";
import styles from "./Register.module.scss";

const cx = classNames.bind(styles);

function Register({ onSwitch, onClose }) {
  const [step, setStep] = useState("form"); 
  // form | googleChoice | setupPassword

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phoneNumber: "",
    password: "",
    confirmPassword: "",
    otp: "",
  });

  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const { showToast } = useToast();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // ==================== GỬI OTP ====================
  const handleSendOtp = async () => {
    setLoading(true);

    try {
      // 🧩 CASE SET PASSWORD (Google)
      if (step === "setupPassword") {
        await AuthAPI.forgotPassword({ email: formData.email });

        showToast({
          text: "OTP đã gửi để thiết lập mật khẩu",
          type: "success",
        });

        setOtpSent(true);
        return;
      }

      // 🧩 CASE REGISTER BÌNH THƯỜNG
      const res = await AuthAPI.register({
        fullName: formData.fullName,
        email: formData.email,
        phoneNumber: formData.phoneNumber,
        password: formData.password,
        confirmPassword: formData.confirmPassword,
      });

      // 👉 Email trùng Google
      if (res?.isGoogleAccount) {
        setStep("googleChoice");
        showToast({
          text: res.message,
          type: "info",
        });
        return;
      }

      showToast({
        text: "OTP đã được gửi đến email của bạn",
        type: "success",
      });

      setOtpSent(true);

    } catch (error) {
      showToast({
        text:
          error.response?.data?.error ||
          error.message ||
          "Không thể gửi OTP",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  // ==================== CHỌN SET PASSWORD ====================
  const handleSetupPassword = () => {
    setStep("setupPassword");
    setOtpSent(false);
    setFormData((prev) => ({
      ...prev,
      otp: "",
      password: "",
      confirmPassword: "",
    }));
  };

  const handleContinueGoogle = () => {
    showToast({
      text: "Vui lòng đăng nhập bằng Google",
      type: "info",
    });
    onSwitch("login");
    onClose?.();
  };

  // ==================== SUBMIT ====================
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.otp) {
      showToast({ text: "Vui lòng nhập OTP", type: "error" });
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      showToast({ text: "Mật khẩu không khớp", type: "error" });
      return;
    }

    try {
      // 🧩 CASE SET PASSWORD GOOGLE
      if (step === "setupPassword") {
        await AuthAPI.verifyForgotOtp({
          email: formData.email,
          otp: formData.otp,
        });

        await AuthAPI.resetPassword({
          email: formData.email,
          newPassword: formData.password,
        });

        showToast({
          text: "Thiết lập mật khẩu thành công!",
          type: "success",
        });
      } else {
        // 🧩 CASE REGISTER
        await AuthAPI.verifyOtp({
          email: formData.email,
          otp: formData.otp,
        });

        showToast({
          text: "Đăng ký thành công",
          type: "success",
        });
      }

      onSwitch("login");
      onClose?.();

    } catch (error) {
      showToast({
        text:
          error.response?.data?.error ||
          error.message ||
          "Xác thực thất bại",
        type: "error",
      });
    }
  };

  return (
    <div className={cx("wrapper")}>
      <div className={cx("inner")}>
        <h4 className={cx("heading")}>
          {step === "setupPassword"
            ? "Thiết lập mật khẩu"
            : "Tạo tài khoản"}
        </h4>

        <div className={cx("body")}>
          <p>
            Đã có tài khoản?{" "}
            <a href="#" onClick={() => onSwitch("login")}>
              Đăng nhập
            </a>
          </p>

          {/* ==================== FORM REGISTER ==================== */}
          {step === "form" && (
            <form onSubmit={handleSubmit}>
              <Input name="fullName" placeholder="Họ tên" required onChange={handleChange} />
              <Input name="email" placeholder="Email" required onChange={handleChange} />
              <Input name="phoneNumber" placeholder="SĐT" required onChange={handleChange} />
              <Input name="password" type="password" placeholder="Mật khẩu" required onChange={handleChange} />
              <Input name="confirmPassword" type="password" placeholder="Nhập lại mật khẩu" required onChange={handleChange} />

              <div className={cx("otp")}>
                <Input
                  name="otp"
                  placeholder="OTP"
                  disabled={!otpSent}
                  onChange={handleChange}
                />
                <Button type="button" onClick={handleSendOtp} disabled={loading}>
                  {loading ? "Đang gửi..." : "Gửi OTP"}
                </Button>
              </div>

              <Button type="submit" disabled={!otpSent}>
                Đăng ký
              </Button>
            </form>
          )}

          {/* ==================== GOOGLE CHOICE ==================== */}
          {step === "googleChoice" && (
            <div>
              <p>Email này đã dùng Google</p>

              <Button onClick={handleSetupPassword}>
                Thiết lập mật khẩu
              </Button>

              <Button outline onClick={handleContinueGoogle}>
                Đăng nhập bằng Google
              </Button>
            </div>
          )}

          {/* ==================== SET PASSWORD ==================== */}
          {step === "setupPassword" && (
            <form onSubmit={handleSubmit}>
              <Input value={formData.email} disabled />

              <Input
                name="password"
                type="password"
                placeholder="Mật khẩu mới"
                onChange={handleChange}
              />
              <Input
                name="confirmPassword"
                type="password"
                placeholder="Nhập lại mật khẩu"
                onChange={handleChange}
              />

              <div className={cx("otp")}>
                <Input
                  name="otp"
                  placeholder="OTP"
                  disabled={!otpSent}
                  onChange={handleChange}
                />
                <Button type="button" onClick={handleSendOtp}>
                  Gửi OTP
                </Button>
              </div>

              <Button type="submit" disabled={!otpSent}>
                Xác nhận
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default Register;