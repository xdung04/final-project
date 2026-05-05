import React, { useState, useEffect } from "react";
import classNames from "classnames/bind";
import styles from "./ThuNhap.module.scss";
import { 
  CalendarDays, CheckCircle2, AlertCircle, 
  Clock, Banknote, MessageSquareWarning, Send, 
  ChevronDown, ChevronUp, History, Wallet,
  TriangleAlert, CircleCheck, CircleDashed, 
  Ban, BadgeDollarSign,
} from "lucide-react";

import { SalaryAPI } from "~/apis/salaryAPI"; 
import { useAuth } from "~/context/AuthContext";

const cx = classNames.bind(styles);

const fmt = (amount) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount || 0);

const fmtDate = (dateStr) =>
  dateStr ? new Date(dateStr).toLocaleDateString("vi-VN") : null;

// ── Status config ──────────────────────────────────────────────────────────────
const STATUS_CONFIG = {
  PENDING:       { label: "Chờ xác nhận",  icon: <Clock size={13} />,         cls: "pending"       },
  CONFIRMED:     { label: "Đã xác nhận",   icon: <CircleCheck size={13} />,   cls: "confirmed"     },
  AUTOCONFIRMED: { label: "Tự xác nhận",   icon: <CircleCheck size={13} />,   cls: "autoconfirmed" },
  DISPUTED:      { label: "Đang khiếu nại",icon: <TriangleAlert size={13} />, cls: "disputed"      },
  PAID:          { label: "Đã thanh toán", icon: <BadgeDollarSign size={13} />,cls: "paid"         },
  LOCKED:        { label: "Đã khóa",       icon: <Ban size={13} />,           cls: "locked"        },
};

// ═══════════════════════════════════════════════════════════════════════════
// Sub: Deduction List — hiển thị chi tiết từng khoản khấu trừ
// ═══════════════════════════════════════════════════════════════════════════
function DeductionList({ deductions, totalDeductions }) {
  if (!deductions || deductions.length === 0) {
    return (
      <div className={cx("deductionEmpty")}>
        <CircleDashed size={14} /> Không có khoản khấu trừ nào
      </div>
    );
  }

  return (
    <div className={cx("deductionSection")}>
      <div className={cx("deductionHeader")}>
        <span className={cx("deductionHeaderTitle")}>
          <TriangleAlert size={13} /> Chi tiết khấu trừ
        </span>
        <span className={cx("deductionHeaderTotal")}>
          Tổng: −{fmt(totalDeductions)}
        </span>
      </div>

      <div className={cx("deductionList")}>
        {deductions.map((d) => (
          <div key={d.idDeduction} className={cx("deductionItem")}>
            {/* Cột trái: Lý do + ngày */}
            <div className={cx("deductionLeft")}>
              <span className={cx("deductionReason")}>{d.reason}</span>
              <div className={cx("deductionMeta")}>
                {/* Ngày vi phạm — quan trọng nhất, hiện nổi bật */}
                {d.violationDate && (
                  <span className={cx("deductionViolation")}>
                    <TriangleAlert size={11} />
                    Vi phạm: {fmtDate(d.violationDate)}
                  </span>
                )}
                {/* Ngày admin nhập */}
                <span className={cx("deductionCreated")}>
                  <CalendarDays size={11} />
                  Ghi nhận: {fmtDate(d.createdAt)}
                </span>
              </div>
            </div>

            {/* Cột phải: Số tiền */}
            <span className={cx("deductionAmount")}>
              −{fmt(d.amount)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Main Component
// ═══════════════════════════════════════════════════════════════════════════
function ThuNhap() {
  const { user, accessToken } = useAuth();
  const [payslips,      setPayslips]      = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [expandedId,    setExpandedId]    = useState(null);
  const [disputeFormId, setDisputeFormId] = useState(null);
  const [disputeText,   setDisputeText]   = useState("");

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

  const toggleExpand = (id) =>
    setExpandedId(expandedId === id ? null : id);

  const handleConfirm = async (id) => {
    try {
      await SalaryAPI.confirmMyPayslip(id, accessToken);
      setPayslips((prev) =>
        prev.map((ps) => ps.idSalary === id ? { ...ps, status: "Confirmed" } : ps)
      );
    } catch {
      alert("Lỗi xác nhận!");
    }
  };

  const handleSubmitDispute = async (id) => {
    if (!disputeText.trim()) return alert("Vui lòng nhập lý do!");
    try {
      await SalaryAPI.disputeMyPayslip(id, disputeText, accessToken);
      setPayslips((prev) =>
        prev.map((ps) =>
          ps.idSalary === id
            ? { ...ps, status: "Disputed", disputeReason: disputeText }
            : ps
        )
      );
      setDisputeFormId(null);
      setDisputeText("");
    } catch {
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
        <p className={cx("subtitle")}>Minh bạch thu nhập &amp; Lịch sử phục vụ</p>
      </div>

      {payslips.length === 0 ? (
        <div className={cx("emptyContainer")}>
          <AlertCircle size={40} />
          <p>Hiện chưa có dữ liệu phiếu lương.</p>
        </div>
      ) : (
        <div className={cx("payslipList")}>
          {payslips.map((ps) => {
            const isExpanded  = expandedId === ps.idSalary;
            const uiStatus    = ps.status?.toUpperCase();
            const statusMeta  = STATUS_CONFIG[uiStatus] || {};

            // FIX: Bỏ filter theo type — dùng tổng cached từ backend
            const deductions     = ps.DeductionsList || [];
            const totalDeductions = parseFloat(ps.deductions || 0);

            return (
              <div
                key={ps.idSalary}
                className={cx("payslipCard", { expanded: isExpanded })}
              >
                {/* ── TÓM TẮT CARD ── */}
                <div
                  className={cx("cardSummary")}
                  onClick={() => toggleExpand(ps.idSalary)}
                >
                  <div className={cx("headerRow")}>
                    <h3>Tháng {ps.month} / {ps.year}</h3>
                    <span className={cx("badge", statusMeta.cls)}>
                      {statusMeta.icon} {statusMeta.label}
                    </span>
                  </div>

                  <div className={cx("summaryMain")}>
                    <div className={cx("netPayBox")}>
                      <span className={cx("label")}>THỰC NHẬN</span>
                      <span className={cx("value")}>{fmt(ps.netSalary)}</span>
                    </div>
                    {isExpanded ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
                  </div>
                </div>

                {/* ── CHI TIẾT XỔ XUỐNG ── */}
                {isExpanded && (
                  <div className={cx("cardDetails")}>

                    {/* Thu nhập */}
                    <div className={cx("statsGrid")}>
                      <div className={cx("statCard")}>
                        <div className={cx("statLabel")}>Lương cứng</div>
                        <div className={cx("statValue")}>{fmt(ps.baseSalary)}</div>
                      </div>
                      <div className={cx("statCard")}>
                        <div className={cx("statLabel")}>Hoa hồng</div>
                        <div className={cx("statValue")}>{fmt(ps.commission)}</div>
                      </div>
                      <div className={cx("statCard")}>
                        <div className={cx("statLabel")}>Tiền tip</div>
                        <div className={cx("statValue")}>{fmt(ps.tips)}</div>
                      </div>
                      <div className={cx("statCard")}>
                        <div className={cx("statLabel")}>Thưởng KPI</div>
                        <div className={cx("statValue")}>{fmt(ps.bonus)}</div>
                      </div>
                    </div>

                    {/* Tổng thu nhập */}
                    <div className={cx("incomeRow")}>
                      <span>Tổng thu nhập</span>
                      <span className={cx("cGreen")}>{fmt(ps.totalSalary)}</span>
                    </div>

                    {/* Khấu trừ — component riêng, hiện rõ từng khoản */}
                    <DeductionList
                      deductions={deductions}
                      totalDeductions={totalDeductions}
                    />

                    {/* Thực nhận */}
                    <div className={cx("netRow")}>
                      <span>Thực nhận</span>
                      <span className={cx("cGold")}>{fmt(ps.netSalary)}</span>
                    </div>

                    {/* Nhật ký làm việc */}
                    <div className={cx("tableSection")}>
                      <h3><History size={14} /> NHẬT KÝ LÀM VIỆC</h3>
                      <div className={cx("tableWrapper")}>
                        <table className={cx("rewardTable")}>
                          <thead>
                            <tr>
                              <th>Ngày</th>
                              <th>Khách hàng</th>
                              <th>Dịch vụ</th>
                              <th>Doanh thu</th>
                              <th>Tip</th>
                            </tr>
                          </thead>
                          <tbody>
                            {ps.workHistory?.length > 0 ? (
                              ps.workHistory.map((log, idx) => (
                                <tr key={idx}>
                                  <td>{fmtDate(log.date)}</td>
                                  <td>{log.customerName}</td>
                                  <td>{log.services}</td>
                                  <td className={cx("amountCol")}>{fmt(log.servicePrice)}</td>
                                  <td className={cx("amountCol")}>
                                    {log.tipAmount > 0 ? `+${fmt(log.tipAmount)}` : "—"}
                                  </td>
                                </tr>
                              ))
                            ) : (
                              <tr>
                                <td colSpan={5} className={cx("emptyRow")}>
                                  Không có lịch sử làm việc
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Hành động */}
                    <div className={cx("actionSection")}>
                      {uiStatus === "PENDING" && !disputeFormId && (
                        <div className={cx("btnGroup")}>
                          <button
                            onClick={() => handleConfirm(ps.idSalary)}
                            className={cx("btnMain")}
                          >
                            <CheckCircle2 size={15} /> Xác nhận bảng lương
                          </button>
                          <button
                            onClick={() => setDisputeFormId(ps.idSalary)}
                            className={cx("btnOutline")}
                          >
                            <MessageSquareWarning size={15} /> Báo sai sót
                          </button>
                        </div>
                      )}

                      {disputeFormId === ps.idSalary && (
                        <div className={cx("disputeForm")}>
                          <textarea
                            value={disputeText}
                            onChange={(e) => setDisputeText(e.target.value)}
                            placeholder="Mô tả chi tiết sai sót bạn phát hiện..."
                            rows={3}
                          />
                          <div className={cx("btnGroup")}>
                            <button
                              onClick={() => setDisputeFormId(null)}
                              className={cx("btnText")}
                            >
                              Hủy
                            </button>
                            <button
                              onClick={() => handleSubmitDispute(ps.idSalary)}
                              className={cx("btnDanger")}
                            >
                              <Send size={14} /> Gửi khiếu nại
                            </button>
                          </div>
                        </div>
                      )}

                      {uiStatus === "DISPUTED" && (
                        <div className={cx("statusInfo", "warning")}>
                          <TriangleAlert size={14} />
                          Đang khiếu nại: {ps.disputeReason}
                        </div>
                      )}

                      {uiStatus === "PAID" && (
                        <div className={cx("statusInfo", "success")}>
                          <CheckCircle2 size={14} />
                          Đã thanh toán {ps.paidAmount ? fmt(ps.paidAmount) : ""}
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
