import { useState } from "react";
import classNames from "classnames/bind";
import { useToast } from "~/context/ToastContext";
import { useAuth } from "~/context/AuthContext";
import { AuthAPI } from "~/apis/AuthAPI";
import { GoogleLogin } from "@react-oauth/google";
import { useNavigate } from "react-router-dom"; // 🔥 THÊM IMPORT NÀY

import Input from "~/components/Input";
import Button from "~/components/Button";
import styles from "./Login.module.scss";

const cx = classNames.bind(styles);

function Login({ onSwitch, onClose, onLoginSuccess }) {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const { login: authLogin } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  // 🔥 THÊM: function chào theo role
  const getWelcomeMessage = (user) => {
    const name = user.fullName || user.name || "bạn";

    switch (user.role) {
      case "admin":
        return `Chào mừng Admin ${name}, Hệ thống đã sẵn sàng!`;
      case "barber":
        return `Chào Barber ${name}, hôm nay có nhiều khách đang chờ bạn đó!`;
      case "customer":
        return `Chào ${name} đến với Barber Shop Nam, đặt lịch thôi nào!`;
      case "receptionist":
        return `Chào ${name}, lịch cắt tóc của chi nhánh đã sẵn sàng!`;
      default:
        return `Chào mừng ${name}`;
    }
  };

  const handleChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // HÀM XỬ LÝ CHUYỂN HƯỚNG THEO ROLE
  const handleRedirectByRole = (role) => {
    // Luôn đóng modal login và chạy callback success trước
    if (onLoginSuccess) onLoginSuccess();
    if (onClose) onClose();

    // Điều hướng thẳng vào trang quản lý tương ứng
    switch (role) {
      case "admin":
        navigate("/admin");
        break;
      case "barber":
        navigate("/tho-cat-toc");
        break;
      case "receptionist":
        navigate("/receptionist");
        break;
      default:
        // Nếu là customer (khách hàng), cứ để họ ở lại trang hiện tại (trang chủ)
        break;
    }
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

      if (result.needPhone) {
        onSwitch("add-phone", {
          accessToken: result.accessToken,
          refreshToken: result.refreshToken,
          user: result.user,
        });
        return;
      }

      if (result.accessToken) {
        const userWithAvatar = {
          ...result.user,
          avatar: result.user.image || "/user.png",
        };

        authLogin(userWithAvatar, result.accessToken, result.refreshToken);

        // 🔥 SỬA: toast theo role
        showToast({
          text: getWelcomeMessage(result.user),
          type: "success",
        });

        handleRedirectByRole(result.user.role);

        if (onLoginSuccess) onLoginSuccess();
        if (onClose) onClose();
      }
    } catch (err) {
      const message = err.response?.data?.message || "Email hoặc mật khẩu không đúng";
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
          refreshToken: result.refreshToken,
          user: result.user,
        });
        return;
      }

      if (result.accessToken) {
        const userWithAvatar = {
          ...result.user,
          avatar: result.user.image || "/user.png",
        };

        // Lưu Auth
        authLogin(userWithAvatar, result.accessToken, result.refreshToken);

        // 🔥 SỬA: toast theo role
        showToast({
          text: getWelcomeMessage(result.user),
          type: "success",
        });

        // 🚀 redirect theo role
        const role = result.user.role;

        if (role === "admin") {
          navigate("/admin");
        } else if (role === "barber") {
          navigate("/tho-cat-toc");
        } else if (role === "receptionist") {
          navigate("/receptionist");
        } else {
          navigate("/");
        }

        // 🔥 GỌI HÀM ĐIỀU HƯỚNG
        handleRedirectByRole(result.user.role);
      }
    } catch (err) {
      const message = err.response?.data?.message || "Đăng nhập Google thất bại";
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
              <div className={cx("forgetpass")} onClick={() => onSwitch("forgetpass")}>
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
