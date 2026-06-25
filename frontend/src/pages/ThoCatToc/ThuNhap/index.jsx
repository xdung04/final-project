import React, { useState, useEffect } from "react";
import classNames from "classnames/bind";
import styles from "./ThuNhap.module.scss";
import {
  CalendarDays, CheckCircle2, AlertCircle,
  Clock, Banknote, MessageSquareWarning, Send,
  ChevronDown, ChevronUp, History, Wallet,
  TriangleAlert, CircleCheck, CircleDashed,
  Ban, BadgeDollarSign, CalendarOff, ChevronRight,
  Info,
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
  PENDING:       { label: "Chờ xác nhận",   icon: <Clock size={13} />,           cls: "pending"       },
  CONFIRMED:     { label: "Đã xác nhận",    icon: <CircleCheck size={13} />,     cls: "confirmed"     },
  AUTOCONFIRMED: { label: "Tự xác nhận",    icon: <CircleCheck size={13} />,     cls: "autoconfirmed" },
  DISPUTED:      { label: "Đang khiếu nại", icon: <TriangleAlert size={13} />,   cls: "disputed"      },
  PAID:          { label: "Đã thanh toán",  icon: <BadgeDollarSign size={13} />, cls: "paid"          },
  LOCKED:        { label: "Đã khóa",        icon: <Ban size={13} />,             cls: "locked"        },
};

// ─────────────────────────────────────────────────────────────
// Hook: Countdown từ deadlineAt
// ─────────────────────────────────────────────────────────────
function useCountdown(deadlineAt) {
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    if (!deadlineAt) return;
    const tick = () => {
      const msLeft = new Date(deadlineAt) - new Date();
      if (msLeft <= 0) { setTimeLeft("Đã hết hạn"); return; }
      const h = Math.floor(msLeft / (1000 * 60 * 60));
      const m = Math.floor((msLeft % (1000 * 60 * 60)) / (1000 * 60));
      const s = Math.floor((msLeft % (1000 * 60)) / 1000);
      setTimeLeft(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`);
    };
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [deadlineAt]);

  return timeLeft;
}

// ═══════════════════════════════════════════════════════════════════════════
// Sub: DayOffList — hiển thị lịch nghỉ trong tháng
// ═══════════════════════════════════════════════════════════════════════════
function DayOffList({ dayOffList = [], totalDayOffDays = 0, totalDaysInMonth, workingDays, dayOffDeduction }) {
  if (!totalDaysInMonth) return null;

  return (
    <div className={cx("dayOffSection")}>
      <div className={cx("dayOffHeader")}>
        <span className={cx("dayOffHeaderTitle")}>
          <CalendarOff size={13} /> Ngày công
        </span>
        <div className={cx("dayOffHeaderRight")}>
          <span className={cx("dayOffStat")}>
            <span className={cx("dayOffStatNum")}>{workingDays}</span>
            <span className={cx("dayOffStatSep")}>/</span>
            <span className={cx("dayOffStatTotal")}>{totalDaysInMonth} ngày</span>
          </span>
          {dayOffDeduction > 0 && (
            <span className={cx("dayOffDeductBadge")}>
              −{fmt(dayOffDeduction)}
            </span>
          )}
        </div>
      </div>

      {/* Progress bar ngày công */}
      <div className={cx("dayOffProgress")}>
        <div
          className={cx("dayOffProgressFill")}
          style={{ width: `${(workingDays / totalDaysInMonth) * 100}%` }}
        />
      </div>

      {/* Danh sách đợt nghỉ */}
      {dayOffList.length > 0 ? (
        <div className={cx("dayOffList")}>
          {dayOffList.map((d) => (
            <div key={d.idUnavailable} className={cx("dayOffItem")}>
              <div className={cx("dayOffItemLeft")}>
                <CalendarDays size={12} className={cx("dayOffItemIcon")} />
                <div className={cx("dayOffItemInfo")}>
                  <span className={cx("dayOffItemRange")}>
                    {fmtDate(d.startDate)}
                    {d.startDate !== d.endDate && (
                      <>
                        <ChevronRight size={11} />
                        {fmtDate(d.endDate)}
                      </>
                    )}
                  </span>
                  {d.reason && (
                    <span className={cx("dayOffItemReason")}>{d.reason}</span>
                  )}
                </div>
              </div>
              <span className={cx("dayOffItemDays")}>
                {d.daysInMonth} ngày
              </span>
            </div>
          ))}
        </div>
      ) : (
        <div className={cx("dayOffEmpty")}>
          <Info size={12} /> Không có ngày nghỉ trong tháng này
        </div>
      )}

      {/* Chú thích công thức */}
      {dayOffDeduction > 0 && (
        <div className={cx("dayOffFormula")}>
          Lương cứng được tính theo ngày công thực tế:
          ({workingDays}/{totalDaysInMonth} ngày)
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Sub: DeductionList
// ═══════════════════════════════════════════════════════════════════════════
function DeductionList({ deductions, totalDeductions }) {
  if (!deductions || deductions.length === 0) {
    return (
      <div className={cx("deductionEmpty")}>
        <CircleDashed size={14} /> Không có khoản khấu trừ thủ công
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
            <div className={cx("deductionLeft")}>
              <span className={cx("deductionReason")}>{d.reason}</span>
              <div className={cx("deductionMeta")}>
                {d.violationDate && (
                  <span className={cx("deductionViolation")}>
                    <TriangleAlert size={11} />
                    Vi phạm: {fmtDate(d.violationDate)}
                  </span>
                )}
                <span className={cx("deductionCreated")}>
                  <CalendarDays size={11} />
                  Ghi nhận: {fmtDate(d.createdAt)}
                </span>
              </div>
            </div>
            <span className={cx("deductionAmount")}>−{fmt(d.amount)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Sub: WorkHistory — bảng booking có scroll cố định
// ═══════════════════════════════════════════════════════════════════════════
function WorkHistory({ workHistory = [] }) {
  const VISIBLE = 5;
  const [showAll, setShowAll] = useState(false);
  const displayed = showAll ? workHistory : workHistory.slice(0, VISIBLE);
  const hasMore   = workHistory.length > VISIBLE;

  return (
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
            {displayed.length > 0 ? (
              displayed.map((log, idx) => (
                <tr key={idx}>
                  <td>{fmtDate(log.date)}</td>
                  <td>{log.customerName}</td>
                  <td className={cx("serviceCell")}>{log.services}</td>
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

      {/* Nút xem thêm — nằm ngoài bảng, không đẩy action xuống */}
      {hasMore && (
        <button
          className={cx("showMoreBtn")}
          onClick={() => setShowAll((v) => !v)}
        >
          {showAll ? (
            <><ChevronUp size={13} /> Thu gọn</>
          ) : (
            <><ChevronDown size={13} /> Xem thêm {workHistory.length - VISIBLE} lần nữa</>
          )}
        </button>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Sub: PayslipCard
// ═══════════════════════════════════════════════════════════════════════════
function PayslipCard({
  ps,
  expandedId,
  toggleExpand,
  handleConfirm,
  disputeFormId,
  setDisputeFormId,
  disputeText,
  setDisputeText,
  handleSubmitDispute,
}) {
  const isExpanded      = expandedId === ps.idSalary;
  const uiStatus        = ps.status?.toUpperCase();
  const statusMeta      = STATUS_CONFIG[uiStatus] || {};
  const deductions      = ps.DeductionsList || [];
const totalDaysInMonth = ps.totalDaysInMonth
  || new Date(ps.year, ps.month, 0).getDate();

const workingDays = ps.workingDays
  || ps.daysWorked
  || (totalDaysInMonth - (ps.totalDayOffDays || 0));

const dayOffDeduction = ps.dayOffDeduction
  || (ps.totalDayOffDays > 0
      ? Math.round(
          (parseFloat(ps.baseSalary) / workingDays) * totalDaysInMonth
        ) - parseFloat(ps.baseSalary)
      : 0);

const originalBaseSalary = ps.originalBaseSalary
  || (ps.totalDayOffDays > 0
      ? Math.round(
          (parseFloat(ps.baseSalary) / workingDays) * totalDaysInMonth
        )
      : parseFloat(ps.baseSalary));
  // Khấu trừ thủ công (từ DeductionsList) — khác với dayOffDeduction
  const manualDeductions = deductions.reduce((s, d) => s + parseFloat(d.amount || 0), 0);

  const countdown = useCountdown(uiStatus === "PENDING" ? ps.deadlineAt : null);

  return (
    <div className={cx("payslipCard", { expanded: isExpanded })}>

      {/* ── TÓM TẮT CARD ── */}
      <div className={cx("cardSummary")} onClick={() => toggleExpand(ps.idSalary)}>
        <div className={cx("headerRow")}>
          <h3>Tháng {ps.month} / {ps.year}</h3>
          <span className={cx("badge", statusMeta.cls)}>
            {statusMeta.icon} {statusMeta.label}
          </span>
        </div>

        {uiStatus === "PENDING" && countdown && (
          <div className={cx("countdown")}>
            <Clock size={13} />
            Tự xác nhận sau: <strong>{countdown}</strong>
          </div>
        )}

        <div className={cx("summaryMain")}>
          <div className={cx("netPayBox")}>
            <span className={cx("label")}>THỰC NHẬN</span>
            <span className={cx("value")}>{fmt(ps.netSalary)}</span>
          </div>
          {/* Mini info ngày công */}
          {ps.totalDaysInMonth > 0 && (
            <div className={cx("summaryDayOff")}>
              <CalendarOff size={13} />
              <span>
                {ps.workingDays}/{ps.totalDaysInMonth} ngày công
                {ps.dayOffDays > 0 && (
                  <span className={cx("summaryDayOffBadge")}>
                    nghỉ {ps.dayOffDays} ngày
                  </span>
                )}
              </span>
            </div>
          )}
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
  {ps.totalDayOffDays > 0 && (
    <div className={cx("statSub")}>
      gốc {fmt(originalBaseSalary)}
    </div>
  )}
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

          {/* Lịch nghỉ + ngày công */}
        <DayOffList
          dayOffList={ps.dayOffList}
          totalDayOffDays={ps.totalDayOffDays}
          totalDaysInMonth={totalDaysInMonth}
          workingDays={workingDays}
          dayOffDeduction={dayOffDeduction}
        />

          {/* Khấu trừ thủ công */}
          <DeductionList deductions={deductions} totalDeductions={manualDeductions} />

          {/* Thực nhận */}
          <div className={cx("netRow")}>
            <span>Thực nhận</span>
            <span className={cx("cGold")}>{fmt(ps.netSalary)}</span>
          </div>

          {/* Nhật ký làm việc — có scroll / show more */}
          <WorkHistory workHistory={ps.workHistory} />

          {/* Hành động — luôn nằm dưới cùng */}
          <div className={cx("actionSection")}>
            {uiStatus === "PENDING" && !disputeFormId && (
              <>
                <div className={cx("countdownWarning")}>
                  <Clock size={13} />
                  Còn <strong>{countdown}</strong> để xác nhận —
                  sau đó hệ thống sẽ tự động xác nhận.
                </div>
                <div className={cx("btnGroup")}>
                  <button onClick={() => handleConfirm(ps.idSalary)} className={cx("btnMain")}>
                    <CheckCircle2 size={15} /> Xác nhận bảng lương
                  </button>
                  <button onClick={() => setDisputeFormId(ps.idSalary)} className={cx("btnOutline")}>
                    <MessageSquareWarning size={15} /> Báo sai sót
                  </button>
                </div>
              </>
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
                  <button onClick={() => setDisputeFormId(null)} className={cx("btnText")}>Hủy</button>
                  <button onClick={() => handleSubmitDispute(ps.idSalary)} className={cx("btnDanger")}>
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
}

// ═══════════════════════════════════════════════════════════════════════════
// Main Component
// ═══════════════════════════════════════════════════════════════════════════
function ThuNhap() {
  const { user } = useAuth();
  const [payslips,      setPayslips]      = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [expandedId,    setExpandedId]    = useState(null);
  const [disputeFormId, setDisputeFormId] = useState(null);
  const [disputeText,   setDisputeText]   = useState("");

  useEffect(() => {
    const fetchMyPayslips = async () => {
      if (!user?.idUser) return;
      try {
        setLoading(true);
        const response = await SalaryAPI.getMyPayslips();
        setPayslips(response.data || response);
      } catch (error) {
        console.error("Lỗi:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchMyPayslips();
  }, [user]);

  const toggleExpand = (id) => setExpandedId(expandedId === id ? null : id);

  const handleConfirm = async (id) => {
    try {
      await SalaryAPI.confirmMyPayslip(id);
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
      await SalaryAPI.disputeMyPayslip(id, disputeText);
      setPayslips((prev) =>
        prev.map((ps) =>
          ps.idSalary === id ? { ...ps, status: "Disputed", disputeReason: disputeText } : ps
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
          {payslips.map((ps) => (
            <PayslipCard
              key={ps.idSalary}
              ps={ps}
              expandedId={expandedId}
              toggleExpand={toggleExpand}
              handleConfirm={handleConfirm}
              disputeFormId={disputeFormId}
              setDisputeFormId={setDisputeFormId}
              disputeText={disputeText}
              setDisputeText={setDisputeText}
              handleSubmitDispute={handleSubmitDispute}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default ThuNhap;