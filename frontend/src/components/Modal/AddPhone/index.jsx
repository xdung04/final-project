import { useState } from "react";
import classNames from "classnames/bind";
import { useToast } from "~/context/ToastContext";
import {ProfileAPI} from "~/apis/profileApi";
import Input from "~/components/Input";
import Button from "~/components/Button";
import styles from "./AddPhone.module.scss";

const cx = classNames.bind(styles);

function AddPhone({ onClose, onSuccess, initialData }) {
  const  accessToken  = initialData?.accessToken;
  const [phoneNumber, setPhoneNumber] = useState("");
  const [loading, setLoading] = useState(false);

  const { showToast } = useToast();

  const handleSubmit = async () => {
    if (!phoneNumber || !/^[0-9]{10,15}$/.test(phoneNumber)) {
      showToast({ text: "Số điện thoại không hợp lệ", type: "error" });
      return;
    }

    setLoading(true);
    try {
      await ProfileAPI.updatePhone(accessToken, phoneNumber);

      showToast({ text: "Cập nhật thành công", type: "success" });

      if (onSuccess) onSuccess();
      if (onClose) onClose();
    } catch (err) {
      showToast({
        text: err.message || "Cập nhật thất bại",
        type: "error",
      });
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
        </p>

        <Input
          primary
          placeholder="Nhập số điện thoại"
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
        />

        <Button primary onClick={handleSubmit} disabled={loading} fullWidth>
          {loading ? "Đang lưu..." : "Xác nhận"}
        </Button>

        <Button outline onClick={onClose} fullWidth>
          Để sau
        </Button>
      </div>
    </div>
  );
}

export default AddPhone;
