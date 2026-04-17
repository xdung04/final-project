import React, { useState } from "react";
import classNames from "classnames/bind";
import styles from "./ThuNhap.module.scss";
import { 
  CalendarDays, 
  MapPin, 
  Scissors, 
  CheckCircle2, 
  AlertCircle, 
  Clock,
  Banknotes,
  MessageSquareWarning,
  Send
} from "lucide-react";

const cx = classNames.bind(styles);

// Format tiền tệ
const formatCurrency = (amount) => {
  return amount.toLocaleString("vi-VN") + "đ";
};

// Dữ liệu mẫu (Mock data) mô phỏng từ Admin gửi xuống
const initialPayslips = [
  {
    id: "ps_10_2023",
    monthYear: "10/2023",
    branch: "BarberSpace Quận 1",
    completedBookings: 145,
    earnings: {
      baseSalary: 5000000,
      commission: 7500000,
      tip: 1200000,
    },
    deductions: {
      advance: 0,
      fine: 200000,
      fineReason: "Đi trễ 2 lần (Ngày 05/10, 12/10)",
    },
    status: "PENDING", // PENDING, CONFIRMED, DISPUTED, PAID
    disputeReason: "",
  },
  {
    id: "ps_09_2023",
    monthYear: "09/2023",
    branch: "BarberSpace Quận 1",
    completedBookings: 130,
    earnings: {
      baseSalary: 5000000,
      commission: 6200000,
      tip: 950000,
    },
    deductions: {
      advance: 1000000,
      fine: 0,
      fineReason: "",
    },
    status: "PAID",
    disputeReason: "",
  }
];

function ThuNhap() {
  const [payslips, setPayslips] = useState(initialPayslips);
  const [disputeFormId, setDisputeFormId] = useState(null);
  const [disputeText, setDisputeText] = useState("");

  // Kịch bản A: Thợ đồng ý (Xác nhận)
  const handleConfirm = (id) => {
    setPayslips(prev => prev.map(ps => 
      ps.id === id ? { ...ps, status: "CONFIRMED" } : ps
    ));
    // Thực tế: Call API update status lên server
  };

  // Mở form khiếu nại
  const handleOpenDispute = (id) => {
    setDisputeFormId(id);
    setDisputeText("");
  };

  // Kịch bản B: Thợ gửi khiếu nại
  const handleSubmitDispute = (id) => {
    if (!disputeText.trim()) return;
    
    setPayslips(prev => prev.map(ps => 
      ps.id === id ? { ...ps, status: "DISPUTED", disputeReason: disputeText } : ps
    ));
    setDisputeFormId(null);
    setDisputeText("");
    // Thực tế: Call API gửi nội dung khiếu nại lên Admin
  };

  return (
    <div className={cx("container")}>
      <div className={cx("headerInfo")}>
        <h2 className={cx("title")}>Phiếu Lương & Thu Nhập</h2>
        <p className={cx("subtitle")}>Kiểm tra chi tiết thu nhập, xác nhận bảng lương hoặc báo cáo sai sót cho Quản lý.</p>
      </div>

      <div className={cx("payslipList")}>
        {payslips.map((ps) => {
          // Tính toán tổng tiền
          const totalEarnings = ps.earnings.baseSalary + ps.earnings.commission + ps.earnings.tip;
          const totalDeductions = ps.deductions.advance + ps.deductions.fine;
          const netPay = totalEarnings - totalDeductions;

          return (
            <div key={ps.id} className={cx("payslipCard", `status-${ps.status.toLowerCase()}`)}>
              
              {/* Header của Phiếu lương */}
              <div className={cx("cardHeader")}>
                <div className={cx("monthLabel")}>
                  <CalendarDays size={22} className={cx("iconGold")} />
                  <h3>Kỳ Lương Tháng {ps.monthYear}</h3>
                </div>
                <div className={cx("statusBadge", ps.status.toLowerCase())}>
                  {ps.status === "PENDING" && <><Clock size={14} /> Chờ xác nhận</>}
                  {ps.status === "CONFIRMED" && <><CheckCircle2 size={14} /> Đã xác nhận</>}
                  {ps.status === "DISPUTED" && <><AlertCircle size={14} /> Đang khiếu nại</>}
                  {ps.status === "PAID" && <><CheckCircle2 size={14} /> Đã thanh toán</>}
                </div>
              </div>

              {/* Thông tin chung */}
              <div className={cx("generalInfo")}>
                <div className={cx("infoItem")}>
                  <MapPin size={16} />
                  <span>{ps.branch}</span>
                </div>
                <div className={cx("infoItem")}>
                  <Scissors size={16} />
                  <span>Hoàn thành: <strong>{ps.completedBookings} booking</strong></span>
                </div>
              </div>

              {/* Chi tiết Thu - Chi */}
              <div className={cx("financialGrid")}>
                {/* Cột Thu nhập */}
                <div className={cx("finColumn")}>
                  <h4 className={cx("colTitle", "plus")}>Cộng (+)</h4>
                  <div className={cx("finRow")}>
                    <span>Lương cơ bản</span>
                    <span>{formatCurrency(ps.earnings.baseSalary)}</span>
                  </div>
                  <div className={cx("finRow")}>
                    <span>Hoa hồng (Dịch vụ & SP)</span>
                    <span>{formatCurrency(ps.earnings.commission)}</span>
                  </div>
                  <div className={cx("finRow")}>
                    <span>Tiền Tip</span>
                    <span>{formatCurrency(ps.earnings.tip)}</span>
                  </div>
                </div>

                {/* Cột Khấu trừ */}
                <div className={cx("finColumn")}>
                  <h4 className={cx("colTitle", "minus")}>Trừ (-)</h4>
                  <div className={cx("finRow")}>
                    <span>Tạm ứng</span>
                    <span>{formatCurrency(ps.deductions.advance)}</span>
                  </div>
                  <div className={cx("finRow")}>
                    <div className={cx("hasTooltip")}>
                      <span>Tiền phạt</span>
                      {ps.deductions.fineReason && (
                        <div className={cx("reasonHint")}>{ps.deductions.fineReason}</div>
                      )}
                    </div>
                    <span>{formatCurrency(ps.deductions.fine)}</span>
                  </div>
                </div>
              </div>

              {/* Dòng Tổng Thực Nhận */}
              <div className={cx("totalRow")}>
                <span className={cx("totalLabel")}>THỰC NHẬN</span>
                <span className={cx("totalAmount")}>{formatCurrency(netPay)}</span>
              </div>

              {/* Khu vực Tương tác theo Trạng thái */}
              <div className={cx("actionArea")}>
                {ps.status === "PENDING" && !disputeFormId && (
                  <div className={cx("btnGroup")}>
                    <button onClick={() => handleConfirm(ps.id)} className={cx("btnConfirm")}>
                      <CheckCircle2 size={18} /> Xác nhận bảng lương
                    </button>
                    <button onClick={() => handleOpenDispute(ps.id)} className={cx("btnDispute")}>
                      <MessageSquareWarning size={18} /> Báo cáo sai sót
                    </button>
                  </div>
                )}

                {/* Form nhập lý do khiếu nại */}
                {disputeFormId === ps.id && ps.status === "PENDING" && (
                  <div className={cx("disputeBox")}>
                    <textarea 
                      placeholder="Nhập lý do (VD: Thiếu 2 bill uốn tóc ngày 29)..."
                      value={disputeText}
                      onChange={(e) => setDisputeText(e.target.value)}
                      rows={2}
                    />
                    <div className={cx("disputeActions")}>
                      <button onClick={() => setDisputeFormId(null)} className={cx("btnCancel")}>Hủy</button>
                      <button onClick={() => handleSubmitDispute(ps.id)} className={cx("btnSubmitDispute")}>
                        <Send size={14} /> Gửi khiếu nại
                      </button>
                    </div>
                  </div>
                )}

                {/* Trạng thái đã khiếu nại */}
                {ps.status === "DISPUTED" && (
                  <div className={cx("alertBox", "warning")}>
                    <AlertCircle size={18} />
                    <div>
                      <strong>Bạn đã gửi khiếu nại:</strong> "{ps.disputeReason}"
                      <p>Vui lòng đợi Quản lý kiểm tra và gửi lại phiếu lương mới.</p>
                    </div>
                  </div>
                )}

                {/* Trạng thái chờ thanh toán */}
                {ps.status === "CONFIRMED" && (
                  <div className={cx("alertBox", "success")}>
                    <CheckCircle2 size={18} />
                    <span>Bạn đã xác nhận bảng lương. Vui lòng chờ Quản lý chuyển khoản thanh toán.</span>
                  </div>
                )}
                
                 {/* Trạng thái hoàn tất */}
                 {ps.status === "PAID" && (
                  <div className={cx("stampPaid")}>
                    ĐÃ THANH TOÁN
                  </div>
                )}
              </div>

            </div>
          );
        })}
      </div>
    </div>
  );
}

export default ThuNhap;