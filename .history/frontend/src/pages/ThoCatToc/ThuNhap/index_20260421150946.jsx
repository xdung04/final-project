import React, { useState, useEffect } from "react";
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

// Thay đổi đường dẫn này trỏ tới file khai báo API của ông
import { SalaryAPI } from "~/apis/SalaryAPI"; 
import { useAuth } from "~/context/AuthContext";

const cx = classNames.bind(styles);

// Format tiền tệ
const formatCurrency = (amount) => {
  if (!amount) return "0đ";
  return amount.toLocaleString("vi-VN") + "đ";
};

function ThuNhap() {
  const { user, accessToken } = useAuth();
  
  const [payslips, setPayslips] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [disputeFormId, setDisputeFormId] = useState(null);
  const [disputeText, setDisputeText] = useState("");

  // ==========================================
  // 1. TẢI DỮ LIỆU TỪ BACKEND KHI VÀO TRANG
  // ==========================================
  useEffect(() => {
    const fetchMyPayslips = async () => {
      if (!user?.idUser || !accessToken) return;
      
      try {
        setLoading(true);
        // Gọi API lấy dữ liệu phiếu lương
        const response = await SalaryAPI.getMyPayslips(accessToken);
        
        // Đảm bảo lấy đúng mảng data từ response (tuỳ cấu hình axios/fetch của ông)
        const data = response.data || response;

        // Map data backend trả về cho khớp với cấu trúc UI ông đã dựng
        const formattedData = data.map((ps) => ({
          id: ps.idSalary,
          monthYear: `${ps.month}/${ps.year}`,
          branch: "BarberSpace", // Có thể thay bằng ps.branchName nếu DB có lưu
          completedBookings: ps.totalBookings || 0, // Fallback nếu có
          earnings: {
            baseSalary: ps.baseSalary || 0,
            commission: ps.commissionAmount || 0,
            tip: ps.tipAmount || 0,
          },
          deductions: {
            advance: ps.advanceAmount || 0,
            fine: ps.deductionAmount || 0,
            fineReason: ps.adjustmentNote || "",
          },
          status: ps.status.toUpperCase(), // Chuyển về In Hoa (PENDING, CONFIRMED, DISPUTED, PAID)
          disputeReason: ps.disputeReason || "",
        }));

        setPayslips(formattedData);
      } catch (error) {
        console.error("Lỗi khi tải danh sách phiếu lương:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMyPayslips();
  }, [user, accessToken]);

  // ==========================================
  // 2. KỊCH BẢN A: THỢ XÁC NHẬN LƯƠNG
  // ==========================================
  const handleConfirm = async (id) => {
    try {
      // Gọi API xác nhận
      await SalaryAPI.confirmMyPayslip(id, accessToken);
      
      // Update UI sau khi API thành công
      setPayslips((prev) => prev.map((ps) => 
        ps.id === id ? { ...ps, status: "CONFIRMED" } : ps
      ));
    } catch (error) {
      alert("Lỗi khi xác nhận phiếu lương. Vui lòng thử lại!");
      console.error(error);
    }
  };

  const handleOpenDispute = (id) => {
    setDisputeFormId(id);
    setDisputeText("");
  };

  // ==========================================
  // 3. KỊCH BẢN B: THỢ GỬI KHIẾU NẠI
  // ==========================================
  const handleSubmitDispute = async (id) => {
    if (!disputeText.trim()) {
      alert("Vui lòng nhập lý do khiếu nại!");
      return;
    }
    
    try {
      // Gọi API gửi khiếu nại
      await SalaryAPI.disputeMyPayslip(id, disputeText, accessToken);
      
      // Update UI sau khi API thành công
      setPayslips((prev) => prev.map((ps) => 
        ps.id === id ? { ...ps, status: "DISPUTED", disputeReason: disputeText } : ps
      ));
      
      setDisputeFormId(null);
      setDisputeText("");
    } catch (error) {
      alert("Không thể gửi khiếu nại lúc này. Vui lòng thử lại!");
      console.error(error);
    }
  };

  if (loading) {
    return (
      <div className={cx("container")}>
        <div className={cx("headerInfo")}>
          <h2 className={cx("title")}>Phiếu Lương & Thu Nhập</h2>
          <p>Đang tải dữ liệu thu nhập của bạn...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cx("container")}>
      <div className={cx("headerInfo")}>
        <h2 className={cx("title")}>Phiếu Lương & Thu Nhập</h2>
        <p className={cx("subtitle")}>Kiểm tra chi tiết thu nhập, xác nhận bảng lương hoặc báo cáo sai sót cho Quản lý.</p>
      </div>

      {payslips.length === 0 ? (
        <div className={cx("noData")}>
          <p>Bạn chưa có phiếu lương nào trong hệ thống.</p>
        </div>
      ) : (
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
      )}
    </div>
  );
}

export default ThuNhap;