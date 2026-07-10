import React, { useState } from "react";
import ReactDOM from "react-dom";
import classNames from "classnames/bind";
import styles from "./CompleteAppointmentDialog.module.scss";
import { completeBooking } from "~/services/bookingService";
import { useToast } from "~/context/ToastContext";
import { X, Upload, Loader2, CheckCircle2 } from "lucide-react";

const cx = classNames.bind(styles);

function CompleteAppointmentDialog({ open, onClose, appointment }) {
  const { showToast } = useToast();
  const [description, setDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [images, setImages] = useState({
    front: null,
    left: null,
    right: null,
    back: null,
  });

  if (!open || !appointment) return null;

  const handleFileChange = (e, position) => {
    const file = e.target.files[0];
    if (file) {
      setImages((prev) => ({ ...prev, [position]: file }));
    } else {
      setImages((prev) => ({ ...prev, [position]: null }));
    }
  };

  const truncateFileName = (name, maxLength = 12) => {
    if (name.length <= maxLength) return name;
    const ext = name.split(".").pop();
    return name.substring(0, maxLength) + "... ." + ext;
  };

  const handleSubmit = async () => {
    if (isLoading) {
      return;
    }
    const uploadedCount = Object.values(images).filter((img) => img !== null).length;

    if (uploadedCount < 4) {
      showToast({ text: "Vui lòng upload đủ 4 ảnh (FRONT, LEFT, RIGHT, BACK) trước khi hoàn thành.", type: "error" });
      return;
    }

    setIsLoading(true);

    const formData = new FormData();
    formData.append("description", description);
    formData.append("idBarber", appointment.idBarber);
    formData.append("idCustomer", appointment.idCustomer);
    formData.append("idBooking", appointment.idBooking);

    Object.entries(images).forEach(([key, file]) => {
      if (file) formData.append(key, file);
    });

    try {
      const result = await completeBooking(appointment.idBooking, formData);
      console.log("Kết quả hoàn tất:", result);
      showToast({ text: "Hoàn tất dịch vụ thành công!", type: "success" });
      onClose();
    } catch (err) {
      console.error(err);
      showToast({ text: "Lỗi khi hoàn tất dịch vụ.", type: "error" });
    } finally {
      setIsLoading(false);
    }
  };

  const isAllImagesUploaded = Object.values(images).every((img) => img !== null);
  const isSubmitDisabled = !isAllImagesUploaded || isLoading;

  return ReactDOM.createPortal(
    <div className={cx("overlay")}>
      <div className={cx("dialog")}>
        <div className={cx("header")}>
          <h2>Hoàn tất dịch vụ</h2>
          <button className={cx("closeBtn")} onClick={onClose} disabled={isLoading}>
            <X size={20} />
          </button>
        </div>

        <p className={cx("description")}>
          Tải ảnh trước/sau khi cắt để lưu vào bộ sưu tập
        </p>

        <div className={cx("body")}>
          <fieldset disabled={isLoading}>
            <div className={cx("formGroup")}>
              <label>Tên khách hàng</label>
              <input type="text" value={appointment.customerName || "Khách vãng lai"} readOnly />
            </div>

            <div className={cx("formGroup")}>
              <label>Dịch vụ đã thực hiện</label>
              <input type="text" value={appointment.services || "—"} readOnly />
            </div>

            <div className={cx("formGroup")}>
              <label>Mô tả</label>
              <textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Ghi chú thêm về kiểu tóc..." />
            </div>

            <div className={cx("formGroup")}>
              <label>Upload ảnh (tải đủ 4 ảnh)</label>
              <div className={cx("uploadGrid")}>
                {["front", "left", "right", "back"].map((pos) => (
                  <div key={pos} className={cx("uploadBox", { hasFile: !!images[pos] })}>
                    <div className={cx("uploadBoxHeader")}>
                      <span className={cx("uploadBoxLabel")}>{pos.toUpperCase()}</span>
                      {images[pos] && <CheckCircle2 size={14} className={cx("checkIcon")} />}
                    </div>
                    <label className={cx("fileLabel")}>
                      <Upload size={16} />
                      <span>{images[pos] ? "Đổi ảnh" : "Chọn ảnh"}</span>
                      <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, pos)} hidden />
                    </label>
                    {images[pos] && <span className={cx("fileName")}>{truncateFileName(images[pos].name)}</span>}
                  </div>
                ))}
              </div>
            </div>
          </fieldset>
        </div>

        <div className={cx("footer")}>
          <button className={cx("cancelBtn")} onClick={onClose} disabled={isLoading}>
            Hủy
          </button>
          <button className={cx("submitBtn")} onClick={handleSubmit} disabled={isSubmitDisabled}>
            {isLoading ? (
              <><Loader2 size={16} className={cx("spin")} /> Đang tải...</>
            ) : (
              <><CheckCircle2 size={16} /> Hoàn thành</>
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

export default CompleteAppointmentDialog;