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

const SEGMENT_CONFIG = {
  new: {
    label: "Khách mới",
    desc: "Đặt lịch lần đầu trong tháng",
    icon: UserPlus,
    color: "#185FA5",
    bg: "#E6F1FB",
  },
  regular: {
    label: "Thường xuyên",
    desc: "Khách trung thành, quay lại đều đặn",
    icon: Star,
    color: "#0F6E56",
    bg: "#E1F5EE",
  },
  occasional: {
    label: "Tiềm năng",
    desc:
      "Khách quay lại không đều \n" + "Khách mới tạo tài khoản chưa đặt lịch",
    icon: Clock,
    color: "#854F0B",
    bg: "#FAEEDA",
  },
  inactive: {
    label: "Không hoạt động",
    desc:
      "Khách vắng trên 90 ngày \n" + "Khách đăng ký >30 ngày chưa đặt lịch",
    icon: UserX,
    color: "#A32D2D",
    bg: "#FCEBEB",
  },
};

const VOUCHER_LABELS = { A: "Đang có voucher", B: "Đã dùng", C: "Chưa nhận" };
const FILTER_TO_TYPE = { all: null, ready: "C", used: "B", active: "A" };
const formatMoney = (v) => Number(v).toLocaleString("vi-VN") + "đ";

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
            {isV && <th>Ngày tạo</th>}
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
                {isV && (
                  <td className={cx("tdDate")}>
                    {c.joinedAt
                      ? new Date(c.joinedAt).toLocaleDateString("vi-VN")
                      : "—"}
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
                  <td>
                    {!isA && (
                      <button
                        className={cx("sendRowBtn")}
                        onClick={() => onSendSingle(c.id)}
                      >
                        <Send size={11} /> Gửi
                      </button>
                    )}
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default function CustomerTab() {
  // accessToken không còn cần thiết để truyền vào các service nữa (cookie tự
  // gửi kèm). Giữ destructure phòng khi cần check trạng thái đăng nhập, có
  // thể xoá nếu không dùng tới ở đâu khác trong file.
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
  const [showNoBooking, setShowNoBooking] = useState(false);

  useEffect(() => {
    loadMonthly();
    loadSegments();
    loadVouchers();
  }, []);

  const loadMonthly = async () => {
    setLoadingMonthly(true);
    try {
      setMonthly(await fetchMonthlyStats(6));
    } catch {
      showToast({ text: "Lỗi tải biểu đồ", type: "error" });
    } finally {
      setLoadingMonthly(false);
    }
  };
  const loadSegments = async () => {
    setLoadingSegments(true);
    try {
      setSegmentsData(await fetchCustomerSegments());
    } catch {
      showToast({ text: "Lỗi tải phân loại", type: "error" });
    } finally {
      setLoadingSegments(false);
    }
  };
  const loadVouchers = async () => {
    try {
      const data = await fetchAllVouchers();
      const rv = data.filter((v) => v.type === "RETENTION" && v.is_active);
      setVouchers(rv);
      if (rv.length) setSelectedVoucherId(String(rv[0].id));
    } catch {}
  };

  const getFilteredList = (segKey) => {
    const t = FILTER_TO_TYPE[filterStatus];
    let list = segmentsData?.segments?.[segKey] || [];

    if (segKey === "occasional") {
      list = list.filter((c) => {
        if (showNoBooking) {
          return c.totalBookings === 0;
        }
        if (c.totalBookings === 0) return false;
        if (c.daysAgo === null) return false;
        return c.daysAgo >= occasionalMinDays && c.daysAgo <= 90;
      });
    } else if (segKey === "inactive") {
      list = list.filter((c) => {
        if (showNoBooking) {
          return c.totalBookings === 0;
        }
        if (c.totalBookings === 0) return false;
        if (c.daysAgo === null) return false;
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
      // sendRetentionVoucher giờ trả thẳng data (đã bóc .data sẵn ở
      // voucherService.js -> httpRequest.js), nên đọc res.issued thay vì
      // res.data.issued như trước (axios gốc).
      const res = await sendRetentionVoucher(selectedVoucherId, ids);
      const issuedCount = res.issued;
      const skipped = res.skipped || [];
      const alreadyHasCount = skipped.filter(
        (s) => s.reason === "already_has_available",
      ).length;
      const maxUsageCount = skipped.filter(
        (s) => s.reason === "max_usage_reached",
      ).length;

      let message = `Đã gửi: ${issuedCount} khách\n`;
      if (alreadyHasCount > 0) {
        message += `Bỏ qua: ${alreadyHasCount} khách (Đã có voucher) \n`;
      }
      if (maxUsageCount > 0) {
        message += `Bỏ qua: ${maxUsageCount} khách (Đạt giới hạn sử dụng)\n`;
      }
      if (skipped.length > 0 && alreadyHasCount === 0 && maxUsageCount === 0) {
        message += `❓ Lý do khác: ${skipped.length} khách\n`;
      }

      showToast({
        text: message.trim(),
        type: "success",
        duration: 5000,
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
    showNoBooking,
  ]);

  return (
    <div className={cx("wrapper")}>
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

            {isVoucherSeg && (
              <div className={cx("vToolbar")}>
                <div className={cx("vRow", "vFiltersRow")}>
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
                      onChange={(e) => setFilterStatus(e.target.value)}
                    >
                      <option value="all">Tất cả</option>
                      <option value="ready">Chưa nhận</option>
                      <option value="used">Đã dùng</option>
                      <option value="active">Đang có voucher</option>
                    </select>
                  </div>

                  <div className={cx("fGroup")}>
                    <label className={cx("fLabel")}>
                      Khách chưa có đơn hàng
                    </label>

                    <label className={cx("fCheckLabel")}>
                      <input
                        type="checkbox"
                        checked={showNoBooking}
                        onChange={(e) => setShowNoBooking(e.target.checked)}
                      />
                    </label>
                  </div>
                </div>

                <div className={cx("vRow", "vActionsRow")}>
                  <div className={cx("fGroup", "vSelectGroup")}>
                    <label className={cx("fLabel")}>Voucher gửi</label>
                    {!vouchers.length ? (
                      <span className={cx("noVoucher")}>
                        Chưa có voucher RETENTION
                      </span>
                    ) : (
                      <select
                        className={cx("fSelect", "voucherSelect")}
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