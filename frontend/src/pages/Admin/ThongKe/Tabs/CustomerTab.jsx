import { useState, useEffect, useMemo } from "react";
import classNames from "classnames/bind";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  Users,
  UserPlus,
  Clock,
  Star,
  UserX,
  Send,
  TrendingUp,
  TrendingDown,
  Minus,
} from "lucide-react";
import { useAuth } from "~/context/AuthContext";
import { useToast } from "~/context/ToastContext";
import {
  fetchMonthlyStats,
  fetchCustomerSegments,
} from "~/services/customerStatsService";
import {
  fetchAllVouchers,
  sendRetentionVoucher,
} from "~/services/voucherService";
import styles from "./CustomerTab.module.scss";

const cx = classNames.bind(styles);

// ── Config ───────────────────────────────────────────────────────────────────
const SEGMENT_CONFIG = {
  new: {
    label: "Khách mới",
    desc: "Lần đầu trong tháng",
    icon: UserPlus,
    color: "#185FA5",
    bg: "#E6F1FB",
  },
  occasional: {
    label: "Thỉnh thoảng",
    desc: "Quay lại không đều",
    icon: Clock,
    color: "#854F0B",
    bg: "#FAEEDA",
  },
  regular: {
    label: "Thường xuyên",
    desc: "Khách trung thành",
    icon: Star,
    color: "#0F6E56",
    bg: "#E1F5EE",
  },
  inactive: {
    label: "Không hoạt động",
    desc: "Vắng trên 90 ngày",
    icon: UserX,
    color: "#A32D2D",
    bg: "#FCEBEB",
  },
};

const VOUCHER_LABELS = { A: "Đang có voucher", B: "Đã dùng", C: "Chưa nhận" };
const FILTER_TO_TYPE = { all: null, ready: "C", used: "B", active: "A" };
const formatMoney = (v) => Number(v).toLocaleString("vi-VN") + "đ";

// ── Custom tooltip biểu đồ ────────────────────────────────────────────────────
function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const rv =
    payload.find((p) => p.dataKey === "returningCustomers")?.value || 0;
  const nv = payload.find((p) => p.dataKey === "newCustomers")?.value || 0;
  const total = rv + nv;
  const rate = total > 0 ? Math.round((rv / total) * 100) : 0;
  return (
    <div className={cx("chartTooltip")}>
      <p className={cx("ttMonth")}>{label}</p>
      <div className={cx("ttRow")}>
        <span className={cx("ttDot")} style={{ background: "#1D9E75" }} />
        <span className={cx("ttKey")}>Quay lại</span>
        <strong className={cx("ttVal")}>{rv}</strong>
      </div>
      <div className={cx("ttRow")}>
        <span className={cx("ttDot")} style={{ background: "#9FE1CB" }} />
        <span className={cx("ttKey")}>Khách mới</span>
        <strong className={cx("ttVal")}>{nv}</strong>
      </div>
      <div className={cx("ttSep")} />
      <div className={cx("ttFooter")}>
        <span>
          Tổng <strong>{total}</strong>
        </span>
        <span className={cx("ttRate")}>↩ {rate}%</span>
      </div>
    </div>
  );
}

// ── Summary bar — Tổng khách (không phải segment) ────────────────────────────
function SummaryBar({ summary }) {
  const total = summary.totalActive || 0;
  const walkIn = summary.walkInCount || 0;
  const verified = total - walkIn;
  return (
    <div className={cx("summaryBar")}>
      <div className={cx("summaryLeft")}>
        <div className={cx("summaryIconBox")}>
          <Users size={18} />
        </div>
        <div>
          <p className={cx("summaryLabel")}>Tổng khách đang hoạt động</p>
          <p className={cx("summaryCount")}>{total.toLocaleString("vi-VN")}</p>
        </div>
      </div>
      <div className={cx("summaryRight")}>
        <div className={cx("summaryPill", "pillGold")}>
          <span className={cx("pillDot")} style={{ background: "#C9A84C" }} />
          <strong>{verified.toLocaleString("vi-VN")}</strong>&nbsp;đã kích hoạt
        </div>
        {walkIn >= 0 && (
          <div className={cx("summaryPill", "pillGray")}>
            <span className={cx("pillDot")} style={{ background: "#BBB" }} />
            <strong>{walkIn}</strong>&nbsp;chưa kích hoạt
          </div>
        )}
      </div>
    </div>
  );
}

// ── Segment Card ──────────────────────────────────────────────────────────────
function SegmentCard({ segKey, data, active, onClick }) {
  const cfg = SEGMENT_CONFIG[segKey];
  const Icon = cfg.icon;
  const ch = data.change;
  return (
    <button
      className={cx("segCard", { segCardActive: active })}
      style={{ "--sc": cfg.color, "--sb": cfg.bg }}
      onClick={onClick}
    >
      <div className={cx("scTop")}>
        <div className={cx("scIconBox")}>
          <Icon size={14} color={cfg.color} />
        </div>
        {ch !== undefined && ch !== null && (
          <span
            className={cx("scPill", {
              scPillUp: ch > 0,
              scPillDown: ch < 0,
              scPillFlat: ch === 0,
            })}
          >
            {ch > 0 ? (
              <TrendingUp size={9} />
            ) : ch < 0 ? (
              <TrendingDown size={9} />
            ) : (
              <Minus size={9} />
            )}
            {Math.abs(ch).toFixed(1)}%
          </span>
        )}
      </div>
      <p className={cx("scCount")}>
        {(data.count || 0).toLocaleString("vi-VN")}
      </p>
      <p className={cx("scLabel")}>{cfg.label}</p>
      <p className={cx("scDesc")}>{cfg.desc}</p>
      {data.extra && (
        <p
          className={cx("scExtra", {
            scExtraRed: data.extraRed,
            scExtraAmber: data.extraAmber,
            scExtraGreen: data.extraGreen,
          })}
        >
          {data.extra}
        </p>
      )}
      <div className={cx("scUnderline")} />
    </button>
  );
}

// ── Bảng chi tiết (không còn checkbox) ─────────────────────────────────────────
function SegmentTable({ customers, segKey, onSendSingle }) {
  const isV = segKey === "occasional" || segKey === "inactive";

  if (!customers.length)
    return (
      <div className={cx("emptyState")}>
        <Users size={28} color="#ccc" />
        <span>Không có khách phù hợp</span>
      </div>
    );

  return (
    <div className={cx("tableWrap")}>
      <table className={cx("table")}>
        <thead>
          <tr>
            <th>Khách hàng</th>
            <th>SĐT</th>
            {segKey === "new" && <th>Email</th>}
            {segKey === "new" && <th>Tham gia</th>}
            {segKey !== "new" && <th>Lần cuối</th>}
            {isV && <th>Vắng</th>}
            {segKey !== "new" && <th>Lượt</th>}
            <th>Chi tiêu</th>
            {isV && <th>Voucher</th>}
            {isV && <th style={{ width: 56 }} />}
          </tr>
        </thead>
        <tbody>
          {customers.map((c) => {
            const isA = c.voucherStatus?.type === "A";
            const days = c.daysAgo || 0;
            return (
              <tr key={c.id}>
                <td>
                  <p className={cx("custName")}>{c.name}</p>
                  {c.email && segKey !== "new" && (
                    <p className={cx("custEmail")}>{c.email}</p>
                  )}
                </td>
                <td className={cx("tdMono")}>{c.phone || "—"}</td>
                {segKey === "new" && (
                  <td className={cx("tdMono")}>{c.email || "—"}</td>
                )}
                {segKey === "new" && (
                  <td className={cx("tdDate")}>
                    {c.joinedAt
                      ? new Date(c.joinedAt).toLocaleDateString("vi-VN")
                      : "—"}
                  </td>
                )}
                {segKey !== "new" && (
                  <td className={cx("tdDate")}>
                    {c.lastBookingDate
                      ? new Date(c.lastBookingDate).toLocaleDateString("vi-VN")
                      : "—"}
                  </td>
                )}
                {isV && (
                  <td>
                    <span
                      className={cx("daysBadge", {
                        daysRed: days >= 90,
                        daysAmber: days >= 60 && days < 90,
                      })}
                    >
                      {c.daysAgo !== null ? `${days}n` : "—"}
                    </span>
                  </td>
                )}
                {segKey !== "new" && (
                  <td className={cx("tdCenter")}>{c.totalBookings}</td>
                )}
                <td className={cx("tdMoney")}>{formatMoney(c.totalSpend)}</td>
                {isV && (
                  <td>
                    <span
                      className={cx("vBadge", {
                        vBadgeGreen: c.voucherStatus?.type === "A",
                        vBadgeAmber: c.voucherStatus?.type === "B",
                        vBadgeGray: c.voucherStatus?.type === "C",
                      })}
                    >
                      {VOUCHER_LABELS[c.voucherStatus?.type] || "—"}
                      {c.voucherStatus?.type === "B" &&
                      c.voucherStatus.usedCount > 0
                        ? ` ×${c.voucherStatus.usedCount}`
                        : ""}
                    </span>
                  </td>
                )}
                {isV && (
                  <tr>
                    {!isA && (
                      <button
                        className={cx("sendRowBtn")}
                        onClick={() => onSendSingle(c.id)}
                      >
                        <Send size={11} /> Gửi
                      </button>
                    )}
                  </tr>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function CustomerTab() {
  const { accessToken } = useAuth();
  const { showToast } = useToast();

  const [monthly, setMonthly] = useState([]);
  const [segmentsData, setSegmentsData] = useState(null);
  const [vouchers, setVouchers] = useState([]);
  const [loadingMonthly, setLoadingMonthly] = useState(true);
  const [loadingSegments, setLoadingSegments] = useState(true);

  const [activeSegment, setActiveSegment] = useState("new");
  const [filterStatus, setFilterStatus] = useState("ready");
  const [selectedVoucherId, setSelectedVoucherId] = useState("");
  const [sending, setSending] = useState(false);

  const [occasionalMinDays, setOccasionalMinDays] = useState(60);
  const [inactiveMaxDays, setInactiveMaxDays] = useState(null);

  useEffect(() => {
    loadMonthly();
    loadSegments();
    loadVouchers();
  }, []);

  const loadMonthly = async () => {
    setLoadingMonthly(true);
    try {
      setMonthly(await fetchMonthlyStats(accessToken, 6));
    } catch {
      showToast({ text: "Lỗi tải biểu đồ", type: "error" });
    } finally {
      setLoadingMonthly(false);
    }
  };
  const loadSegments = async () => {
    setLoadingSegments(true);
    try {
      setSegmentsData(await fetchCustomerSegments(accessToken));
    } catch {
      showToast({ text: "Lỗi tải phân loại", type: "error" });
    } finally {
      setLoadingSegments(false);
    }
  };
  const loadVouchers = async () => {
    try {
      const data = await fetchAllVouchers(accessToken);
      const rv = data.filter((v) => v.type === "RETENTION" && v.is_active);
      setVouchers(rv);
      if (rv.length) setSelectedVoucherId(String(rv[0].id));
    } catch {}
  };

  const getFilteredList = (segKey) => {
    const t = FILTER_TO_TYPE[filterStatus];
    let list = segmentsData?.segments?.[segKey] || [];

    if (segKey === "occasional") {
      const min = occasionalMinDays;
      list = list.filter((c) => {
        if (c.daysAgo === null) return false;
        return c.daysAgo >= min && c.daysAgo <= 90;
      });
    } else if (segKey === "inactive") {
      list = list.filter((c) => {
        if (c.daysAgo === null) return true;
        if (c.daysAgo < 90) return false;
        if (inactiveMaxDays !== null && c.daysAgo > inactiveMaxDays)
          return false;
        return true;
      });
    }

    if (t && segKey !== "new" && segKey !== "regular") {
      list = list.filter((c) => c.voucherStatus?.type === t);
    }
    return list;
  };

  const doSend = async (ids) => {
    if (!selectedVoucherId || !ids.length)
      return showToast({
        text: "Chọn voucher và ít nhất một khách",
        type: "error",
      });
    setSending(true);
    try {
      const res = await sendRetentionVoucher(
        accessToken,
        selectedVoucherId,
        ids,
      );
      showToast({
        text: `Đã gửi ${res.data.issued.length} khách.
Bỏ qua ${res.data.skipped.length} khách (đã có voucher)`,
        type: "success",
        duration: 4000,
      });
      loadSegments();
    } catch (err) {
      showToast({
        text: err.response?.data?.message || "Gửi thất bại",
        type: "error",
      });
    } finally {
      setSending(false);
    }
  };

  const summary = segmentsData?.summary || {};
  const segmentCards = {
    new: {
      count: summary.new || 0,
      change: summary.changes?.new,
      extra:
        summary.retentionRate !== undefined
          ? `↩ Retention ${summary.retentionRate.toFixed(1)}%`
          : null,
      extraRed: (summary.retentionRate || 0) < 40,
      extraGreen: (summary.retentionRate || 0) >= 40,
    },
    occasional: {
      count: summary.occasional || 0,
      change: summary.changes?.occasional,
      extra: summary.occasionalDanger
        ? `${summary.occasionalDanger} sắp inactive`
        : null,
      extraAmber: !!summary.occasionalDanger,
    },
    regular: {
      count: summary.regular || 0,
      change: summary.changes?.regular,
      extra:
        summary.regularRevenuePercent !== undefined
          ? `${summary.regularRevenuePercent.toFixed(1)}% doanh thu`
          : null,
      extraGreen: true,
    },
    inactive: {
      count: summary.inactive || 0,
      change: summary.changes?.inactive,
      extra: summary.inactiveReadyCount
        ? `${summary.inactiveReadyCount} chưa nhận voucher`
        : null,
      extraRed: !!summary.inactiveReadyCount,
    },
  };

  const activeSegData = segmentsData?.segments?.[activeSegment] || [];
  const isVoucherSeg =
    activeSegment === "occasional" || activeSegment === "inactive";
  const ActiveIcon = SEGMENT_CONFIG[activeSegment]?.icon;

  const displayedCustomers = useMemo(() => {
    if (!isVoucherSeg) return activeSegData;
    return getFilteredList(activeSegment);
  }, [
    activeSegment,
    activeSegData,
    filterStatus,
    occasionalMinDays,
    inactiveMaxDays,
  ]);

  return (
    <div className={cx("wrapper")}>
      {/* Summary bar - đưa lên đầu */}
      {!loadingSegments && <SummaryBar summary={summary} />}

      {/* Biểu đồ */}
      <div className={cx("chartCard")}>
        <div className={cx("chartCardHead")}>
          <div>
            <p className={cx("chartTitle")}>Xu hướng 6 tháng gần nhất</p>
            <p className={cx("chartSub")}>Khách mới & quay lại theo tháng</p>
          </div>
          <div className={cx("chartLegend")}>
            <span className={cx("lgItem")}>
              <span className={cx("lgDot")} style={{ background: "#1D9E75" }} />
              Quay lại
            </span>
            <span className={cx("lgItem")}>
              <span className={cx("lgDot")} style={{ background: "#9FE1CB" }} />
              Khách mới
            </span>
          </div>
        </div>
        {loadingMonthly ? (
          <div className={cx("loadingRow")}>Đang tải biểu đồ...</div>
        ) : (
          <ResponsiveContainer width="100%" height={210}>
            <BarChart
              data={monthly}
              barSize={26}
              margin={{ top: 4, right: 8, left: -20, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#EEEEEE"
                vertical={false}
              />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 11, fill: "#999" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "#999" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                content={<ChartTooltip />}
                cursor={{ fill: "rgba(201,168,76,0.07)", rx: 4 }}
              />
              <Bar dataKey="returningCustomers" stackId="a" fill="#1D9E75" />
              <Bar
                dataKey="newCustomers"
                stackId="a"
                fill="#9FE1CB"
                radius={[3, 3, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Segment cards */}
      {loadingSegments ? (
        <div className={cx("loadingRow")}>Đang phân tích khách hàng...</div>
      ) : (
        <>
          <div className={cx("segRow")}>
            {Object.keys(segmentCards).map((key) => (
              <SegmentCard
                key={key}
                segKey={key}
                data={segmentCards[key]}
                active={activeSegment === key}
                onClick={() => {
                  setActiveSegment(key);
                }}
              />
            ))}
          </div>

          {/* Detail card */}
          <div className={cx("detailCard")}>
            <div className={cx("detailHead")}>
              <div className={cx("detailHeadLeft")}>
                <div
                  className={cx("detailIconBox")}
                  style={{
                    background: SEGMENT_CONFIG[activeSegment]?.bg,
                    color: SEGMENT_CONFIG[activeSegment]?.color,
                  }}
                >
                  {ActiveIcon && <ActiveIcon size={14} />}
                </div>
                <div>
                  <p className={cx("detailTitle")}>
                    {SEGMENT_CONFIG[activeSegment]?.label}
                  </p>
                  <p className={cx("detailSub")}>
                    {activeSegData.length} khách trong nhóm
                  </p>
                </div>
              </div>
            </div>

            {/* Voucher toolbar */}
            {isVoucherSeg && (
              <div className={cx("vToolbar")}>
                <div className={cx("vFilters")}>
                  {activeSegment === "occasional" && (
                    <div className={cx("fGroup")}>
                      <label className={cx("fLabel")}>Vắng từ (ngày)</label>
                      <div className={cx("fRangeWrap")}>
                        <input
                          type="number"
                          className={cx("fInput")}
                          value={occasionalMinDays}
                          min="0"
                          max="90"
                          onChange={(e) =>
                            setOccasionalMinDays(Number(e.target.value))
                          }
                        />
                        <span className={cx("fSep")}>–</span>
                        <span className={cx("fStatic")}>90</span>
                        <span className={cx("fUnit")}>ngày</span>
                      </div>
                    </div>
                  )}

                  {activeSegment === "inactive" && (
                    <div className={cx("fGroup")}>
                      <label className={cx("fLabel")}>Vắng từ</label>
                      <div className={cx("fRangeWrap")}>
                        <span className={cx("fStatic")}>90</span>
                        <span className={cx("fSep")}>–</span>
                        <input
                          type="number"
                          className={cx("fInput")}
                          value={
                            inactiveMaxDays === null ? "" : inactiveMaxDays
                          }
                          placeholder="∞"
                          onChange={(e) => {
                            const val =
                              e.target.value === ""
                                ? null
                                : Number(e.target.value);
                            setInactiveMaxDays(val);
                          }}
                        />
                        <span className={cx("fUnit")}>ngày</span>
                      </div>
                    </div>
                  )}

                  <div className={cx("fGroup")}>
                    <label className={cx("fLabel")}>Trạng thái</label>
                    <select
                      className={cx("fSelect")}
                      value={filterStatus}
                      onChange={(e) => {
                        setFilterStatus(e.target.value);
                      }}
                    >
                      <option value="all">Tất cả</option>
                      <option value="ready">Chưa nhận</option>
                      <option value="used">Đã dùng</option>
                      <option value="active">Đang có voucher</option>
                    </select>
                  </div>

                  <div className={cx("fGroup")}>
                    <label className={cx("fLabel")}>Voucher gửi</label>
                    {!vouchers.length ? (
                      <span className={cx("noVoucher")}>
                        Chưa có voucher RETENTION
                      </span>
                    ) : (
                      <select
                        className={cx("fSelect")}
                        value={selectedVoucherId}
                        onChange={(e) => setSelectedVoucherId(e.target.value)}
                      >
                        {vouchers.map((v) => (
                          <option key={v.id} value={v.id}>
                            {v.name} — {v.discount_percent}% ·{" "}
                            {v.valid_days ? `HSD ${v.valid_days}n` : "theo CT"}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>

                {(filterStatus === "ready" || filterStatus === "used") && (
                  <div className={cx("vActions")}>
                    <button
                      className={cx("btnSend")}
                      onClick={() =>
                        doSend(displayedCustomers.map((c) => c.id))
                      }
                      disabled={
                        sending ||
                        !displayedCustomers.length ||
                        !selectedVoucherId
                      }
                    >
                      <Send size={13} />
                      {sending
                        ? "Đang gửi..."
                        : `Gửi voucher (${displayedCustomers.length} khách)`}
                    </button>
                  </div>
                )}
              </div>
            )}

            {activeSegData.length === 0 ? (
              <div className={cx("emptyState")}>
                <Users size={28} color="#CCC" />
                <span>Không có khách hàng trong nhóm này</span>
              </div>
            ) : (
              <SegmentTable
                customers={displayedCustomers}
                segKey={activeSegment}
                onSendSingle={(id) => doSend([id])}
              />
            )}
          </div>
        </>
      )}
    </div>
  );
}
