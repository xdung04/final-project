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

  const handleSendOtp = async () => {
    setLoading(true);
    try {
      if (step === "setupPassword") {
        await AuthAPI.forgotPassword({ email: formData.email });
        showToast({ text: "Mã xác thực đã được gửi", type: "success" });
        setOtpSent(true);
        return;
      }

      const res = await AuthAPI.register({
        fullName: formData.fullName,
        email: formData.email,
        phoneNumber: formData.phoneNumber,
        password: formData.password,
        confirmPassword: formData.confirmPassword,
      });

      if (res?.isGoogleAccount) {
        setStep("googleChoice");
        showToast({ text: res.message, type: "info" });
        return;
      }

      showToast({ text: "Mã OTP đã gửi đến email", type: "success" });
      setOtpSent(true);
    } catch (error) {
      showToast({ text: error.response?.data?.error || "Lỗi gửi OTP", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={cx("wrapper")}>
      <div className={cx("inner")}>
        <div className={cx("headerText")}>
          <h4 className={cx("heading")}>
            {step === "setupPassword" ? "Mật khẩu mới" : step === "googleChoice" ? "Liên kết Google" : "Tạo tài khoản"}
          </h4>
          <p className={cx("subTitle")}>
            Đã có tài khoản?{" "}
            <span className={cx("linkText")} onClick={() => onSwitch("login")}>Đăng nhập</span>
          </p>
        </div>

        <div className={cx("body")}>
          {/* STEP: FORM ĐĂNG KÝ CHÍNH */}
          {step === "form" && (
            <form className={cx("registerForm")} onSubmit={(e) => e.preventDefault()}>
              <div className={cx("inputGroup")}>
                <Input name="fullName" placeholder="Họ và tên" onChange={handleChange} />
                <Input name="email" placeholder="Email" onChange={handleChange} />
                <Input name="phoneNumber" placeholder="Số điện thoại" onChange={handleChange} />
                <Input name="password" type="password" placeholder="Mật khẩu" onChange={handleChange} />
                <Input name="confirmPassword" type="password" placeholder="Xác nhận mật khẩu" onChange={handleChange} />

                <div className={cx("otpGroup")}>
                  <div className={cx("otpInputWrapper")}>
                    <Input
                      name="otp"
                      placeholder="Mã OTP"
                      disabled={!otpSent}
                      onChange={handleChange}
                      maxLength={6}
                    />
                  </div>
                  <Button type="button" onClick={handleSendOtp} disabled={loading} className={cx("otpBtn")}>
                    {loading ? "..." : otpSent ? "Gửi lại" : "Lấy mã"}
                  </Button>
                </div>
              </div>
              <Button primary className={cx("submitBtn")} disabled={!otpSent}>Đăng ký ngay</Button>
            </form>
          )}

          {/* STEP: LỰA CHỌN KHI TRÙNG GOOGLE */}
          {step === "googleChoice" && (
            <div className={cx("choiceGroup")}>
              <p className={cx("infoText")}>Email này đã được đăng ký qua Google.</p>
              <Button primary className={cx("submitBtn")} onClick={() => setStep("setupPassword")}>
                Thiết lập mật khẩu riêng
              </Button>
              <div className={cx("divider")}><span>HOẶC</span></div>
              <Button outline className={cx("submitBtn")} onClick={() => onSwitch("login")}>
                Tiếp tục với Google
              </Button>
            </div>
          )}

          {/* STEP: THIẾT LẬP MẬT KHẨU (CHO GOOGLE USER) */}
          {step === "setupPassword" && (
            <form className={cx("registerForm")} onSubmit={(e) => e.preventDefault()}>
              <div className={cx("inputGroup")}>
                <Input value={formData.email} disabled />
                <Input name="password" type="password" placeholder="Mật khẩu mới" onChange={handleChange} />
                <Input name="confirmPassword" type="password" placeholder="Nhập lại mật khẩu" onChange={handleChange} />
                <div className={cx("otpGroup")}>
                  <div className={cx("otpInputWrapper")}>
                    <Input name="otp" placeholder="Mã OTP" disabled={!otpSent} onChange={handleChange} maxLength={6} />
                  </div>
                  <Button type="button" onClick={handleSendOtp} className={cx("otpBtn")}>
                    {otpSent ? "Gửi lại" : "Lấy mã"}
                  </Button>
                </div>
              </div>
              <Button primary className={cx("submitBtn")} disabled={!otpSent}>Xác nhận thay đổi</Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default Register;