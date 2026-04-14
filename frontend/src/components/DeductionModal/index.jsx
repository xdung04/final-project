import React, { useState } from "react";
import classNames from "classnames/bind";
// Dùng chung SCSS với PayslipModal để đồng bộ giao diện Luxury
import styles from "./DeductionModal.module.scss"; 
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faXmark, faSave } from "@fortawesome/free-solid-svg-icons";

const cx = classNames.bind(styles);

function DeductionModal({ data, onClose, onSave }) {
  // Lấy dữ liệu cũ nếu có (trường hợp sửa lại), không thì mặc định là 0
  const [advance, setAdvance] = useState(data?.advancePayment || 0);
  const [fines, setFines] = useState(data?.fines || 0);
  const [note, setNote] = useState(data?.deductionNote || "");

  // Hàm xử lý chỉ cho nhập số và format hiển thị dấu chấm/phẩy ngay khi gõ
  const handleFormatNumber = (val, setter) => {
    // Loại bỏ tất cả ký tự không phải là số
    const numStr = val.replace(/\D/g, ""); 
    setter(numStr ? Number(numStr) : 0);
  };

  const handleSave = () => {
    // Đóng gói dữ liệu trả về cho LuongThuong.jsx để gọi API
    onSave({
      barberId: data.barberId,
      advancePayment: advance,
      fines: fines,
      deductionNote: note
    });
  };

  return (
    <div className={cx("overlay")} onClick={onClose}>
      <div className={cx("modal")} style={{ width: "420px" }} onClick={(e) => e.stopPropagation()}>
        {/* Nút đóng */}
        <button className={cx("closeBtn")} onClick={onClose}>
          <FontAwesomeIcon icon={faXmark} />
        </button>

        <div className={cx("receipt")} style={{ padding: "30px 40px" }}>
          {/* Header */}
          <div className={cx("header")} style={{ marginBottom: "25px" }}>
            <h1 style={{ fontSize: "20px", marginBottom: "8px" }}>ĐIỀU CHỈNH KHẤU TRỪ</h1>
            <p className={cx("period")}>
              Nhân sự: <strong style={{ color: "#000" }}>{data.barberName}</strong>
            </p>
          </div>

          <div className={cx("divider")} style={{ margin: "0 0 20px 0" }} />

          {/* Form nhập liệu */}
          <div className={cx("section")} style={{ marginTop: "0" }}>
            
            {/* Tạm ứng */}
            <div style={{ marginBottom: "20px" }}>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#888", marginBottom: "8px", letterSpacing: "1px" }}>
                TIỀN TẠM ỨNG (VNĐ)
              </label>
              <input 
                type="text" 
                value={advance === 0 ? "" : advance.toLocaleString("vi-VN")}
                onChange={(e) => handleFormatNumber(e.target.value, setAdvance)}
                placeholder="0"
                style={{ 
                  width: "100%", padding: "12px", border: "1px solid #ddd", 
                  borderRadius: "4px", fontSize: "15px", outline: "none",
                  fontFamily: "'DM Sans', sans-serif", color: "#000", fontWeight: 600
                }}
              />
            </div>

            {/* Phạt / Kỷ luật */}
            <div style={{ marginBottom: "20px" }}>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#888", marginBottom: "8px", letterSpacing: "1px" }}>
                TIỀN PHẠT / KỶ LUẬT (VNĐ)
              </label>
              <input 
                type="text" 
                value={fines === 0 ? "" : fines.toLocaleString("vi-VN")}
                onChange={(e) => handleFormatNumber(e.target.value, setFines)}
                placeholder="0"
                style={{ 
                  width: "100%", padding: "12px", border: "1px solid #ddd", 
                  borderRadius: "4px", fontSize: "15px", outline: "none",
                  fontFamily: "'DM Sans', sans-serif", color: "#8b3a3a", fontWeight: 600
                }}
              />
            </div>

            {/* Ghi chú */}
            <div style={{ marginBottom: "30px" }}>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#888", marginBottom: "8px", letterSpacing: "1px" }}>
                LÝ DO / GHI CHÚ
              </label>
              <textarea 
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="VD: Ứng tiền mặt ngày 15/10, Đi trễ 2 lần..."
                rows="3"
                style={{ 
                  width: "100%", padding: "12px", border: "1px solid #ddd", 
                  borderRadius: "4px", fontSize: "14px", outline: "none", 
                  resize: "none", fontFamily: "'DM Sans', sans-serif"
                }}
              />
            </div>
          </div>
          
          {/* Nút lưu */}
          <button 
            onClick={handleSave}
            style={{ 
              width: "100%", background: "#000", color: "#fff", border: "none", 
              padding: "14px", borderRadius: "4px", fontWeight: 700, 
              fontSize: "14px", letterSpacing: "1px", cursor: "pointer",
              transition: "background 0.3s"
            }}
            onMouseOver={(e) => e.target.style.background = '#4b382a'}
            onMouseOut={(e) => e.target.style.background = '#000'}
          >
            <FontAwesomeIcon icon={faSave} style={{ marginRight: "8px" }} /> LƯU THAY ĐỔI
          </button>
        </div>
      </div>
    </div>
  );
}

export default DeductionModal;