// components/auth/Login.jsx
import { useState } from "react";
import classNames from "classnames/bind";
import { useToast } from "~/context/ToastContext";
import { useAuth } from "~/context/AuthContext";
import { AuthAPI } from "~/apis/AuthAPI";
import { GoogleLogin } from "@react-oauth/google";

import Input from "~/components/Input";
import Button from "~/components/Button";
import styles from "./Login.module.scss";

const cx = classNames.bind(styles);

function Login({ onSwitch, onClose, onLoginSuccess }) {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);

  const { login: authLogin } = useAuth();
  const { showToast } = useToast();

  const handleChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.email || !formData.password) {
      showToast({ text: "Vui lòng nhập đầy đủ thông tin", type: "error" });
      return;
    }

    setLoading(true);
    try {
      const result = await AuthAPI.login(formData);
      if (result.accessToken) {
        const userWithAvatar = {
          ...result.user,
          avatar: result.user.image || "/user.png",
        };
        authLogin(userWithAvatar, result.accessToken, result.refreshToken);

        showToast({ text: "Đăng nhập thành công", type: "success" });
        if (onLoginSuccess) onLoginSuccess();
        if (onClose) onClose();
      }
    } catch (err) {
      const message =
        err.response?.data?.message || "Email hoặc mật khẩu không đúng";
      showToast({ text: message, type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    const googleIdToken = credentialResponse?.credential;

    if (!googleIdToken) {
      showToast({ text: "Không nhận được dữ liệu từ Google", type: "error" });
      return;
    }

    setLoading(true);
    try {
      const result = await AuthAPI.googleLogin(googleIdToken);

      if (result.needPhone) {
        onSwitch("add-phone", {
          accessToken: result.accessToken,
        });
        return;
      }

      if (result.accessToken) {
        const userWithAvatar = {
          ...result.user,
          avatar: result.user.image || "/user.png",
        };

        authLogin(userWithAvatar, result.accessToken, result.refreshToken);

        showToast({ text: "Đăng nhập Google thành công", type: "success" });

        if (onLoginSuccess) onLoginSuccess();
        if (onClose) onClose();
      }
    } catch (err) {
      const message =
        err.response?.data?.message || "Đăng nhập Google thất bại";
      showToast({ text: message, type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleError = () => {
    showToast({
      text: "Đăng nhập bằng Google thất bại. Vui lòng thử lại.",
      type: "error",
    });
  };

  return (
    <div className={cx("wrapper")}>
      <div className={cx("inner")}>
        <div className={cx("headerText")}>
          <h4 className={cx("heading")}>Đăng nhập</h4>
          <p className={cx("subTitle")}>
            Chưa có tài khoản?{" "}
            <span className={cx("linkText")} onClick={() => onSwitch("register")}>
              Đăng ký ngay
            </span>
          </p>
        </div>

        <div className={cx("body")}>
          <form className={cx("loginForm")} onSubmit={handleSubmit}>
            <div className={cx("inputGroup")}>
              <Input
                primary
                name="email"
                required
                placeholder="Email"
                value={formData.email}
                onChange={(e) => handleChange("email", e.target.value)}
              />
              <Input
                primary
                name="password"
                type="password"
                required
                placeholder="Mật khẩu"
                showToggleIcon
                value={formData.password}
                onChange={(e) => handleChange("password", e.target.value)}
              />
            </div>

            <div className={cx("actionRow")}>
              <div
                className={cx("forgetpass")}
                onClick={() => onSwitch("forgetpass")}
              >
                Quên mật khẩu?
              </div>
            </div>

            <Button primary type="submit" disabled={loading} className={cx("submitBtn")}>
              {loading ? "Đang xử lý..." : "Đăng nhập"}
            </Button>
          </form>

          <div className={cx("divider")}>
            <span>HOẶC</span>
          </div>

          <div className={cx("google-wrapper")}>
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={handleGoogleError}
              useOneTap={false}
              theme="outline"
              size="large"
              text="signin_with"
              shape="rectangular"
              width="100%"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;