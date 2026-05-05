import React, { useState, useEffect } from "react";
import classNames from "classnames/bind";
import styles from "./ThuNhap.module.scss";
import { 
  CalendarDays, CheckCircle2, AlertCircle, 
  Clock, Banknote, MessageSquareWarning, Send, 
  ChevronDown, ChevronUp, User, History, Wallet, Scissors
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
  const [expandedId, setExpandedId] = useState(null); 
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
        console.error("Lỗi:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchMyPayslips();
  }, [user, accessToken]);

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const handleConfirm = async (id) => {
    try {
      await SalaryAPI.confirmMyPayslip(id, accessToken);
      setPayslips(prev => prev.map(ps => ps.idSalary === id ? { ...ps, status: "Confirmed" } : ps));
    } catch (error) {
      alert("Lỗi xác nhận!");
    }
  };

  const handleSubmitDispute = async (id) => {
    if (!disputeText.trim()) return alert("Vui lòng nhập lý do!");
    try {
      await SalaryAPI.disputeMyPayslip(id, disputeText, accessToken);
      setPayslips(prev => prev.map(ps => ps.idSalary === id ? { ...ps, status: "Disputed", disputeReason: disputeText } : ps));
      setDisputeFormId(null);
      setDisputeText("");
    } catch (error) {
      alert("Lỗi gửi khiếu nại!");
    }
  };

  if (loading) {
    return (
      <div className={cx("loadingContainer")}>
        <Clock className={cx("loadingIcon")} size={40} />
        <p>Đang tải dữ liệu thu nhập...</p>
      </div>
    );
  }

  return (
    <div className={cx("container")}>
      <div className={cx("headerInfo")}>
        <h1 className={cx("title")}>
          <Wallet className={cx("titleIcon")} /> PHIẾU LƯƠNG CHI TIẾT
        </h1>
        <p className={cx("subtitle")}>Minh bạch thu nhập & Lịch sử phục vụ</p>
      </div>

      {payslips.length === 0 ? (
        <div className={cx("emptyContainer")}>
          <AlertCircle className={cx("emptyIcon")} size={40} />
          <p>Hiện chưa có dữ liệu phiếu lương.</p>
        </div>
      ) : (
        <div className={cx("payslipList")}>
          {payslips.map((ps) => {
            const isExpanded = expandedId === ps.idSalary;
            const uiStatus = ps.status.toUpperCase();
            const advance = ps.DeductionsList?.filter(d => d.type === "Tạm ứng").reduce((sum, d) => sum + parseFloat(d.amount), 0) || 0;
            const fine = ps.DeductionsList?.filter(d => d.type !== "Tạm ứng").reduce((sum, d) => sum + parseFloat(d.amount), 0) || 0;

            return (
              <div key={ps.idSalary} className={cx("payslipCard", { expanded: isExpanded })}>
                {/* TÓM TẮT CARD */}
                <div className={cx("cardSummary")} onClick={() => toggleExpand(ps.idSalary)}>
                  <div className={cx("headerRow")}>
                    <h3>Tháng {ps.month} / {ps.year}</h3>
                    <span className={cx("badge", ps.status.toLowerCase())}>{uiStatus}</span>
                  </div>
                  
                  <div className={cx("summaryMain")}>
                    <div className={cx("netPayBox")}>
                      <span className={cx("label")}>THỰC NHẬN</span>
                      <span className={cx("value")}>{formatCurrency(ps.netSalary)}</span>
                    </div>
                    {isExpanded ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
                  </div>
                </div>

                {/* CHI TIẾT XỔ XUỐNG */}
                {isExpanded && (
                  <div className={cx("cardDetails")}>
                    <div className={cx("statsGrid")}>
                      <div className={cx("statCard")}>
                        <div className={cx("statLabel")}>Lương Cứng</div>
                        <div className={cx("statValue")}>{formatCurrency(ps.baseSalary)}</div>
                      </div>
                      <div className={cx("statCard")}>
                        <div className={cx("statLabel")}>Hoa Hồng</div>
                        <div className={cx("statValue")}>{formatCurrency(ps.commission)}</div>
                      </div>
                      <div className={cx("statCard")}>
                        <div className={cx("statLabel")}>Tiền Tip</div>
                        <div className={cx("statValue")}>{formatCurrency(ps.tips)}</div>
                      </div>
                      <div className={cx("statCard", "deduction")}>
                        <div className={cx("statLabel")}>Khấu Trừ</div>
                        <div className={cx("statValue")}>-{formatCurrency(advance + fine)}</div>
                      </div>
                    </div>

                    {/* TABLE LỊCH SỬ */}
                    <div className={cx("tableSection")}>
                      <h3><History size={14} /> NHẬT KÝ CHI TIẾT</h3>
                      <div className={cx("tableWrapper")}>
                        <table className={cx("rewardTable")}>
                          <thead>
                            <tr>
                              <th>Ngày</th>
                              <th>Khách hàng</th>
                              <th>Dịch vụ</th>
                              <th>Tip</th>
                            </tr>
                          </thead>
                          <tbody>
                            {ps.workHistory?.map((log, idx) => (
                              <tr key={idx}>
                                <td>{new Date(log.date).toLocaleDateString('vi-VN')}</td>
                                <td>{log.customerName}</td>
                                <td>{log.services}</td>
                                <td className={cx("amountCol")}>+{formatCurrency(log.tipAmount)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* HÀNH ĐỘNG */}
                    <div className={cx("actionSection")}>
                      {uiStatus === "PENDING" && !disputeFormId && (
                        <div className={cx("btnGroup")}>
                          <button onClick={() => handleConfirm(ps.idSalary)} className={cx("btnMain")}>
                            XÁC NHẬN BẢNG LƯƠNG
                          </button>
                          <button onClick={() => setDisputeFormId(ps.idSalary)} className={cx("btnOutline")}>
                            BÁO SAI SÓT
                          </button>
                        </div>
                      )}

                      {disputeFormId === ps.idSalary && (
                        <div className={cx("disputeForm")}>
                          <textarea 
                            value={disputeText} 
                            onChange={(e) => setDisputeText(e.target.value)}
                            placeholder="Nhập chi tiết sai sót..."
                          />
                          <div className={cx("btnGroup")}>
                            <button onClick={() => setDisputeFormId(null)} className={cx("btnText")}>Hủy</button>
                            <button onClick={() => handleSubmitDispute(ps.idSalary)} className={cx("btnDanger")}>GỬI KHIẾU NẠI</button>
                          </div>
                        </div>
                      )}

                      {uiStatus === "DISPUTED" && (
                        <div className={cx("statusInfo", "warning")}>
                          <AlertCircle size={16} /> Đang khiếu nại: {ps.disputeReason}
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