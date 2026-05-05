import React, { useState, useEffect } from "react";
import classNames from "classnames/bind";
import styles from "./ThuNhap.module.scss";
import { 
  CalendarDays, CheckCircle2, AlertCircle, 
  Clock, Banknotes, MessageSquareWarning, Send, 
  ChevronDown, ChevronUp, User, History
} from "lucide-react";

import { SalaryAPI } from "~/apis/salaryAPI"; 
import { useAuth } from "~/context/AuthContext";

const cx = classNames.bind(styles);

const formatCurrency = (amount) => {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount || 0);
};

function ThuNhap() {
  const { user, accessToken } = useAuth();
  const [payslips, setPayslips] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // State cho UI
  const [expandedId, setExpandedId] = useState(null); 
  
  // State cho luồng Khiếu nại
  const [disputeFormId, setDisputeFormId] = useState(null);
  const [disputeText, setDisputeText] = useState("");

  useEffect(() => {
    const fetchMyPayslips = async () => {
      if (!user?.idUser || !accessToken) return;
      try {
        setLoading(true);
        const response = await SalaryAPI.getMyPayslips(accessToken);
        setPayslips(response.data || response);
      } catch (error) {
        console.error("Lỗi khi tải danh sách phiếu lương:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchMyPayslips();
  }, [user, accessToken]);

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  // ==========================================
  // KỊCH BẢN A: THỢ XÁC NHẬN LƯƠNG
  // ==========================================
  const handleConfirm = async (id) => {
    try {
      await SalaryAPI.confirmMyPayslip(id, accessToken);
      setPayslips((prev) => prev.map((ps) => 
        ps.idSalary === id ? { ...ps, status: "Confirmed" } : ps
      ));
    } catch (error) {
      alert("Lỗi khi xác nhận phiếu lương. Vui lòng thử lại!");
      console.error(error);
    }
  };

  // Mở form khiếu nại
  const handleOpenDispute = (id) => {
    setDisputeFormId(id);
    setDisputeText("");
  };

  // ==========================================
  // KỊCH BẢN B: THỢ GỬI KHIẾU NẠI
  // ==========================================
  const handleSubmitDispute = async (id) => {
    if (!disputeText.trim()) {
      alert("Vui lòng nhập lý do khiếu nại chi tiết!");
      return;
    }
    
    try {
      await SalaryAPI.disputeMyPayslip(id, disputeText, accessToken);
      setPayslips((prev) => prev.map((ps) => 
        ps.idSalary === id ? { ...ps, status: "Disputed", disputeReason: disputeText } : ps
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
      <div className={cx("wrapper")}>
        <div className={cx("luxuryHeader")}>
          <h1 className={cx("goldText")}>BẢNG VÀNG THU NHẬP</h1>
          <p className={cx("subtitle")}>Đang tải dữ liệu minh bạch...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cx("wrapper")}>
      <div className={cx("luxuryHeader")}>
        <h1 className={cx("goldText")}>BẢNG VÀNG THU NHẬP</h1>
        <p className={cx("subtitle")}>Nơi ghi nhận sự tận tâm và tay nghề của quý ông</p>
        <div className={cx("divider")}></div>
      </div>

      {payslips.length === 0 ? (
        <div className={cx("noData")}>
          <p>Chưa có dữ liệu phiếu lương nào trong hệ thống.</p>
        </div>
      ) : (
        <div className={cx("payslipContainer")}>
          {payslips.map((ps) => {
            const isExpanded = expandedId === ps.idSalary;
            const advance = ps.DeductionsList?.filter(d => d.type === "Tạm ứng").reduce((sum, d) => sum + parseFloat(d.amount), 0) || 0;
            const fine = ps.DeductionsList?.filter(d => d.type !== "Tạm ứng").reduce((sum, d) => sum + parseFloat(d.amount), 0) || 0;
            const uiStatus = ps.status.toUpperCase();
            
            return (
              <div key={ps.idSalary} className={cx("luxuryCard", { expanded: isExpanded, [`status-${ps.status.toLowerCase()}`]: true })}>
                {/* PHẦN TỔNG QUAN */}
                <div className={cx("mainInfo")} onClick={() => toggleExpand(ps.idSalary)}>
                  <div className={cx("timeSection")}>
                    <CalendarDays size={20} className={cx("goldIcon")} />
                    <div>
                      <span className={cx("monthLabel")}>THÁNG {ps.month}</span>
                      <span className={cx("yearLabel")}>/{ps.year}</span>
                    </div>
                  </div>
                  
                  <div className={cx("revenueSection")}>
                    <div className={cx("stat")}>
                      <span>Thực nhận</span>
                      <strong className={cx("goldAmount")}>{formatCurrency(ps.netSalary)}</strong>
                    </div>
                  </div>

                  <div className={cx("statusSection")}>
                    <span className={cx("statusBadge", ps.status.toLowerCase())}>
                      {uiStatus === "PENDING" && <><Clock size={14} /> CHỜ XÁC NHẬN</>}
                      {uiStatus === "CONFIRMED" && <><CheckCircle2 size={14} /> ĐÃ XÁC NHẬN</>}
                      {uiStatus === "DISPUTED" && <><AlertCircle size={14} /> ĐANG KHIẾU NẠI</>}
                      {uiStatus === "PAID" && <><CheckCircle2 size={14} /> ĐÃ THANH TOÁN</>}
                    </span>
                    {isExpanded ? <ChevronUp className={cx("goldIcon")}/> : <ChevronDown className={cx("goldIcon")}/>}
                  </div>
                </div>

                {/* PHẦN CHI TIẾT */}
                {isExpanded && (
                  <div className={cx("detailsContent")}>
                    <div className={cx("gridInfo")}>
                      {/* Cột 1: Các khoản cộng */}
                      <div className={cx("detailCol")}>
                        <h4 className={cx("sectionTitle")}><Banknotes size={16}/> Thu Nhập Chi Tiết</h4>
                        <div className={cx("row")}><span>Lương cơ bản</span> <span>{formatCurrency(ps.baseSalary)}</span></div>
                        <div className={cx("row")}><span>Hoa hồng dịch vụ</span> <span>{formatCurrency(ps.commission)}</span></div>
                        <div className={cx("row")}><span>Tiền Tip từ khách</span> <span>{formatCurrency(ps.tips)}</span></div>
                        <div className={cx("row", "bonus")}><span>Thưởng KPI</span> <span>{formatCurrency(ps.bonus)}</span></div>
                      </div>

                      {/* Cột 2: Các khoản trừ */}
                      <div className={cx("detailCol")}>
                        <h4 className={cx("sectionTitle")}><AlertCircle size={16}/> Khấu Trừ</h4>
                        <div className={cx("row")}><span>Tạm ứng</span> <span>-{formatCurrency(advance)}</span></div>
                        <div className={cx("row", "fine")}><span>Vi phạm/Phạt</span> <span>-{formatCurrency(fine)}</span></div>
                        {ps.adjustmentNote && <p className={cx("note")}>* Ghi chú: {ps.adjustmentNote}</p>}
                      </div>
                    </div>

                    {/* BẢNG LỊCH SỬ CHI TIẾT */}
                    <div className={cx("workHistory")}>
                      <h4 className={cx("sectionTitle")}><History size={16}/> Nhật Ký Phục Vụ & Tip</h4>
                      <div className={cx("tableWrapper")}>
                        <table className={cx("historyTable")}>
                          <thead>
                            <tr>
                              <th>Ngày</th>
                              <th>Khách hàng</th>
                              <th>Dịch vụ</th>
                              <th>Tiền Tip</th>
                            </tr>
                          </thead>
                          <tbody>
                            {ps.workHistory && ps.workHistory.length > 0 ? (
                              ps.workHistory.map((log, idx) => (
                                <tr key={idx}>
                                  <td>{new Date(log.date).toLocaleDateString('vi-VN')}</td>
                                  <td><User size={12} style={{marginRight: 4}}/>{log.customerName}</td>
                                  <td className={cx("serviceCell")}>{log.services}</td>
                                  <td className={cx("goldText")}>+{formatCurrency(log.tipAmount)}</td>
                                </tr>
                              ))
                            ) : (
                              <tr>
                                <td colSpan="4" style={{textAlign: "center"}}>Không có dữ liệu lịch sử cho tháng này.</td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* PHẦN TƯƠNG TÁC KHIẾU NẠI / XÁC NHẬN */}
                    <div className={cx("actionArea")}>
                      {uiStatus === "PENDING" && !disputeFormId && (
                        <div className={cx("btnGroup")}>
                          <button onClick={() => handleConfirm(ps.idSalary)} className={cx("btnLuxury", "btnConfirm")}>
                            <CheckCircle2 size={18} /> Ký xác nhận
                          </button>
                          <button onClick={() => handleOpenDispute(ps.idSalary)} className={cx("btnLuxury", "btnDispute")}>
                            <MessageSquareWarning size={18} /> Báo cáo sai sót
                          </button>
                        </div>
                      )}

                      {/* Form nhập lý do khiếu nại */}
                      {disputeFormId === ps.idSalary && uiStatus === "PENDING" && (
                        <div className={cx("disputeBox")}>
                          <textarea 
                            className={cx("luxuryTextarea")}
                            placeholder="Chi tiết vấn đề (VD: Ca làm ngày 12/05 chưa có hoa hồng uốn tóc)..."
                            value={disputeText}
                            onChange={(e) => setDisputeText(e.target.value)}
                            rows={3}
                          />
                          <div className={cx("disputeActions")}>
                            <button onClick={() => setDisputeFormId(null)} className={cx("btnCancel")}>Hủy bỏ</button>
                            <button onClick={() => handleSubmitDispute(ps.idSalary)} className={cx("btnSubmitDispute")}>
                              <Send size={14} /> Gửi cho Quản lý
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Hiển thị dòng trạng thái nếu đã xử lý */}
                      {uiStatus === "DISPUTED" && (
                        <div className={cx("alertBox", "warning")}>
                          <AlertCircle size={18} />
                          <div>
                            <strong>Đang xử lý khiếu nại:</strong> "{ps.disputeReason || "Chờ quản lý kiểm tra"}"
                          </div>
                        </div>
                      )}

                      {uiStatus === "CONFIRMED" && (
                        <div className={cx("alertBox", "success")}>
                          <CheckCircle2 size={18} />
                          <span>Chứng từ đã ký duyệt. Vui lòng chờ bộ phận kế toán giải ngân.</span>
                        </div>
                      )}
                    </div>

                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default ThuNhap;