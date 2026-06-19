import { useState } from "react";
import classNames from "classnames/bind";
import { useToast } from "~/context/ToastContext";
import { useAuth } from "~/context/AuthContext";
import { AuthAPI } from "~/apis/AuthAPI";
import { GoogleLogin } from "@react-oauth/google";
import { useNavigate } from "react-router-dom";

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

  const getWelcomeMessage = (user) => {
    const name = user.fullName || user.name || "bạn";
    switch (user.role) {
      case "admin":       return `Chào mừng Admin ${name}, Hệ thống đã sẵn sàng!`;
      case "barber":      return `Chào Barber ${name}, hôm nay có nhiều khách đang chờ bạn đó!`;
      case "customer":    return `Chào ${name} đến với Barber Shop Nam, đặt lịch thôi nào!`;
      case "receptionist":return `Chào ${name}, lịch cắt tóc của chi nhánh đã sẵn sàng!`;
      default:            return `Chào mừng ${name}`;
    }
  };

  const handleChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  /**
   * FIX 6: Gộp tất cả logic sau login vào đây, tránh gọi onLoginSuccess / onClose 2 lần
   * FIX 7: Chỉ navigate 1 lần tại đây, không navigate thêm ở nơi khác
   */
  const handlePostLogin = (userData) => {
    if (onLoginSuccess) onLoginSuccess(userData);
    if (onClose) onClose();

    switch (userData.role) {
      case "admin":        navigate("/admin");        break;
      case "barber":       navigate("/tho-cat-toc");  break;
      case "receptionist": navigate("/receptionist"); break;
      default:
        break;
    }
  };

  // Helper chung: xử lý kết quả trả về từ login/googleLogin giống nhau,
  // tránh lặp code giữa handleSubmit và handleGoogleSuccess.
  //
  // LƯU Ý CHUYỂN ĐỔI COOKIE: trước đây dùng `if (result.accessToken)` để biết
  // login thành công, vì BE trả token trong JSON. Giờ token thật nằm trong
  // httpOnly cookie, JS không đọc/thấy được giá trị đó nữa. BE hiện tại (giai
  // đoạn chuyển tiếp) vẫn trả accessToken trong JSON nên check cũ còn chạy được,
  // nhưng để không phụ thuộc vào việc BE có dọn JSON đó hay không, ta đổi sang
  // check `result.user` — nếu có user nghĩa là login thành công (BE chỉ trả
  // user khi xác thực đúng).
  const handleLoginResult = (result) => {
    if (result.needPhone) {
      onSwitch("add-phone", {
        user: result.user,
      });
      return;
    }

    if (result.user) {
      const userWithAvatar = {
        ...result.user,
        avatar: result.user.image || "/user.png",
      };

      sessionStorage.removeItem("chatMessages");
      sessionStorage.removeItem("chatSessionId");
      sessionStorage.removeItem("chatSessionOwner");

      authLogin(userWithAvatar);

      showToast({ text: getWelcomeMessage(result.user), type: "success" });

      handlePostLogin(userWithAvatar);
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
      handleLoginResult(result);
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
      handleLoginResult(result);
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