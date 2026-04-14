import { useState, useEffect } from "react";
import classNames from "classnames/bind";
import { useToast } from "~/context/ToastContext";
import { useAuth } from "~/context/AuthContext";
import { useNavigate } from "react-router-dom";
import { ProfileAPI } from "~/apis/profileApi";
import { AuthAPI } from "~/apis/AuthAPI";
import Input from "~/components/Input";
import Button from "~/components/Button";
import styles from "./AddPhone.module.scss";

const cx = classNames.bind(styles);

function AddPhone({ onClose, onSuccess, initialData }) {
  const { login: authLogin } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const accessToken = initialData?.accessToken;
  const refreshToken = initialData?.refreshToken;
  const user = initialData?.user;

  const [phoneNumber, setPhoneNumber] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    // Kiểm tra định dạng 10 chữ số bắt đầu bằng 0
    const phoneRegex = /^0[0-9]{9}$/;

    if (!phoneNumber || !phoneRegex.test(phoneNumber)) {
      showToast({
        text: "Số điện thoại phải là 10 chữ số và bắt đầu bằng số 0 (ví dụ: 0912345678)",
        type: "error",
      });
      return;
    }

    setLoading(true);
    try {
      await ProfileAPI.updatePhone(accessToken, phoneNumber);

      const userUpdated = {
        ...user,
        phoneNumber,
        avatar: user.image || "/user.png",
      };

      authLogin(userUpdated, accessToken, refreshToken);

      showToast({
        text: "Cập nhật số điện thoại thành công!",
        type: "success",
      });

      // Redirect theo role
      if (user.role === "admin") {
        navigate("/admin");
      } else if (user.role === "barber") {
        navigate("/tho-cat-toc");
      } else if (user.role === "receptionist") {
        navigate("/receptionist");
      } else {
        navigate("/");
      }

      if (onSuccess) onSuccess();
      if (onClose) onClose();
    } catch (err) {
      let errorMessage = "Cập nhật số điện thoại thất bại";

      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.message) {
        errorMessage = err.message;
      } else if (err.status === 409) {
        errorMessage =
          "Số điện thoại này đã được sử dụng bởi một tài khoản khác.";
      }

      showToast({ text: errorMessage, type: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={cx("wrapper")}>
      <div className={cx("inner")}>
        <h4 className={cx("heading")}>Bổ sung số điện thoại</h4>

        <p className={cx("desc")}>
          Để đặt lịch cắt tóc, chúng tôi cần số điện thoại của bạn.
          <br />
          Nếu bạn đã từng cắt ở tiệm, hãy dùng số điện thoại đã đăng ký để có
          lịch sử và điểm tích lũy!
        </p>
        <p className={cx("desc")}></p>

        <Input
          primary
          placeholder="Nhập số điện thoại"
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
        />

        <Button primary onClick={handleSubmit} disabled={loading} fullWidth>
          {loading ? "Đang lưu..." : "Xác nhận"}
        </Button>
      </div>
    </div>
  );
}

export default AddPhone;
