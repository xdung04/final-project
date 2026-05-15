import React, { useState } from "react";
import classNames from "classnames/bind";
import styles from "./LichSuGiaoDich.module.scss";
import {
  Search, Download, FileText, Filter,
  CreditCard, Wallet, BadgeDollarSign, TrendingUp,
  ChevronLeft, ChevronRight, Banknote,
} from "lucide-react";

const cx = classNames.bind(styles);

// ── Mock data (xoá khi có API) ────────────────────────────────────────────────
const MOCK_TRANSACTIONS = [
  { id: 101, customer: "Nguyễn Văn Nam",   barber: "Barber Nam",   total: 550000, date: "2025-04-11", time: "14:30", status: "completed",  method: "transfer" },
  { id: 102, customer: "Trần Minh Khôi",   barber: "Barber Tuấn",  total: 850000, date: "2025-04-11", time: "15:15", status: "completed",  method: "cash" },
  { id: 103, customer: "Lê Tuấn Anh",      barber: "Barber Khiêm", total: 200000, date: "2025-04-11", time: "16:00", status: "cancelled",  method: "cash" },
  { id: 104, customer: "Phạm Đức Huy",     barber: "Barber Nam",   total: 320000, date: "2025-04-11", time: "16:45", status: "completed",  method: "momo" },
  { id: 105, customer: "Hoàng Minh Tân",   barber: "Barber Khiêm", total: 450000, date: "2025-04-10", time: "10:00", status: "completed",  method: "cash" },
  { id: 106, customer: "Vũ Thành Đạt",     barber: "Barber Tuấn",  total: 680000, date: "2025-04-10", time: "11:30", status: "completed",  method: "transfer" },
  { id: 107, customer: "Đinh Quang Vinh",  barber: "Barber Nam",   total: 150000, date: "2025-04-10", time: "14:00", status: "cancelled",  method: "cash" },
  { id: 108, customer: "Bùi Văn Khánh",    barber: "Barber Khiêm", total: 500000, date: "2025-04-09", time: "09:30", status: "completed",  method: "transfer" },
];

const STATUS_LABEL  = { completed: "Hoàn tất",    cancelled: "Đã hủy",   pending: "Chờ xử lý" };
const METHOD_LABEL  = { cash: "Tiền mặt",          transfer: "Chuyển khoản", momo: "MoMo" };

const fmt = (n) => Number(n || 0).toLocaleString("vi-VN") + "đ";
const initials = (name) => (name || "K").split(" ").slice(-1)[0].charAt(0).toUpperCase();

const STATUS_FILTERS = [
  { id: "all",       label: "Tất cả" },
  { id: "completed", label: "Hoàn tất" },
  { id: "cancelled", label: "Đã hủy" },
  { id: "pending",   label: "Chờ xử lý" },
];

const PAGE_SIZE = 6;

// ── Component ─────────────────────────────────────────────────────────────────
function LichSuGiaoDich() {
  const [search,     setSearch]     = useState("");
  const [dateFrom,   setDateFrom]   = useState("");
  const [dateTo,     setDateTo]     = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page,       setPage]       = useState(1);

  // ── Filter logic ───────────────────────────────────────────────────────────
  const filtered = MOCK_TRANSACTIONS.filter((t) => {
    const matchSearch = !search ||
      t.customer.toLowerCase().includes(search.toLowerCase()) ||
      String(t.id).includes(search);
    const matchStatus = statusFilter === "all" || t.status === statusFilter;
    const matchFrom   = !dateFrom || t.date >= dateFrom;
    const matchTo     = !dateTo   || t.date <= dateTo;
    return matchSearch && matchStatus && matchFrom && matchTo;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Reset page khi filter thay đổi
  const handleFilter = (fn) => { fn(); setPage(1); };

  // ── Stats ──────────────────────────────────────────────────────────────────
  const completed = MOCK_TRANSACTIONS.filter((t) => t.status === "completed");
  const totalRev  = completed.reduce((s, t) => s + t.total, 0);
  const cashRev   = completed.filter((t) => t.method === "cash").reduce((s, t) => s + t.total, 0);
  const transRev  = completed.filter((t) => t.method === "transfer").reduce((s, t) => s + t.total, 0);
  const cancelCnt = MOCK_TRANSACTIONS.filter((t) => t.status === "cancelled").length;

  const stats = [
    {
      icon: <BadgeDollarSign size={18} strokeWidth={1.5} />,
      label: "Tổng doanh thu",
      value: fmt(totalRev),
      sub: `${completed.length} giao dịch hoàn tất`,
      highlight: true,
    },
    {
      icon: <Wallet size={18} strokeWidth={1.5} />,
      label: "Tiền mặt",
      value: fmt(cashRev),
      sub: `${completed.filter((t) => t.method === "cash").length} giao dịch`,
    },
    {
      icon: <CreditCard size={18} strokeWidth={1.5} />,
      label: "Chuyển khoản",
      value: fmt(transRev),
      sub: `${completed.filter((t) => t.method === "transfer").length} giao dịch`,
    },
    {
      icon: <TrendingUp size={18} strokeWidth={1.5} />,
      label: "Đã hủy",
      value: cancelCnt,
      sub: "giao dịch bị huỷ",
    },
  ];

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className={cx("page")}>

      {/* ── PAGE HEADER ────────────────────────────────────────────────── */}
      <div className={cx("pageHead")}>
        <div>
          <p className={cx("pageEyebrow")}>Tài chính &amp; Vận hành</p>
          <h1 className={cx("pageTitle")}>Lịch sử <em>Giao dịch</em></h1>
        </div>
        <button className={cx("btnGold")}>
          <Download size={14} strokeWidth={2} /> Xuất Excel
        </button>
      </div>

      {/* ── STATS STRIP ────────────────────────────────────────────────── */}
      <div className={cx("statsStrip")}>
        {stats.map((s, i) => (
          <div key={i} className={cx("statCard", { "statCard--highlight": s.highlight })}>
            <div className={cx("statCard__icon")}>{s.icon}</div>
            <div>
              <div className={cx("statCard__label")}>{s.label}</div>
              <div className={cx("statCard__value")}>{s.value}</div>
              <div className={cx("statCard__sub")}>{s.sub}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── FILTER BAR ─────────────────────────────────────────────────── */}
      <div className={cx("filterBar")}>
        <div className={cx("filterLeft")}>
          {/* Search */}
          <div className={cx("searchBox")}>
            <Search size={14} />
            <input
              type="text"
              placeholder="Tìm tên khách, mã đơn..."
              value={search}
              onChange={(e) => handleFilter(() => setSearch(e.target.value))}
            />
          </div>

          {/* Date range */}
          <div className={cx("dateRange")}>
            <input
              type="date" className={cx("dateInput")}
              value={dateFrom}
              onChange={(e) => handleFilter(() => setDateFrom(e.target.value))}
            />
            <span>—</span>
            <input
              type="date" className={cx("dateInput")}
              value={dateTo}
              onChange={(e) => handleFilter(() => setDateTo(e.target.value))}
            />
          </div>
        </div>

        <div className={cx("filterRight")}>
          {/* Status pills */}
          <div className={cx("pills")}>
            {STATUS_FILTERS.map((f) => (
              <button
                key={f.id}
                className={cx("pill", { "pill--active": statusFilter === f.id })}
                onClick={() => handleFilter(() => setStatusFilter(f.id))}
              >
                {f.id !== "all" && <span className={cx("pill__dot")} />}
                {f.label}
              </button>
            ))}
          </div>
          <button className={cx("btnGhost")}>
            <Filter size={13} strokeWidth={2} /> Lọc thêm
          </button>
        </div>
      </div>

      {/* ── TABLE ──────────────────────────────────────────────────────── */}
      <div className={cx("tableWrap")}>
        {/* Dark header */}
        <div className={cx("tableHead")}>
          <span className={cx("tableHead__title")}>Danh sách giao dịch</span>
          <span className={cx("tableHead__count")}>
            {filtered.length} kết quả
          </span>
        </div>

        <div className={cx("tableOverflow")}>
          <table className={cx("table")}>
            <thead>
              <tr>
                <th>Thời gian</th>
                <th>Khách hàng</th>
                <th>Thợ phụ trách</th>
                <th>Phương thức</th>
                <th>Tổng tiền</th>
                <th>Trạng thái</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {paginated.length > 0 ? paginated.map((t) => (
                <tr key={t.id}>
                  {/* Time */}
                  <td>
                    <div className={cx("timeCell")}>
                      <span className={cx("timeHour")}>{t.time}</span>
                      <span className={cx("timeDate")}>
                        {new Date(t.date).toLocaleDateString("vi-VN")}
                      </span>
                    </div>
                  </td>

                  {/* Customer */}
                  <td>
                    <div className={cx("customerCell")}>
                      <div className={cx("customerAvatar")}>{initials(t.customer)}</div>
                      <div>
                        <div className={cx("customerName")}>{t.customer}</div>
                        <div className={cx("customerId")}>#{t.id}</div>
                      </div>
                    </div>
                  </td>

                  {/* Barber */}
                  <td><span className={cx("barberName")}>{t.barber}</span></td>

                  {/* Method */}
                  <td>
                    <span className={cx("methodTag", `methodTag--${t.method}`)}>
                      {t.method === "cash"     && <Banknote size={11} strokeWidth={2} />}
                      {t.method === "transfer" && <CreditCard size={11} strokeWidth={2} />}
                      {t.method === "momo"     && <Wallet size={11} strokeWidth={2} />}
                      {METHOD_LABEL[t.method]}
                    </span>
                  </td>

                  {/* Amount */}
                  <td>
                    <span className={cx("amount", { cMuted: t.status === "cancelled" })}>
                      {t.status === "cancelled" ? "—" : fmt(t.total)}
                    </span>
                  </td>

                  {/* Status */}
                  <td>
                    <span className={cx("statusTag", `statusTag--${t.status}`)}>
                      <span className={cx("statusTag__dot")} />
                      {STATUS_LABEL[t.status]}
                    </span>
                  </td>

                  {/* Action */}
                  <td>
                    <button className={cx("actionBtn")} title="Chi tiết giao dịch">
                      <FileText size={14} strokeWidth={1.5} />
                    </button>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={7}>
                    <div className={cx("empty")}>
                      <Search size={28} strokeWidth={1} />
                      Không tìm thấy giao dịch nào
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {filtered.length > PAGE_SIZE && (
          <div className={cx("pagination")}>
            <span className={cx("pagination__info")}>
              {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} / {filtered.length}
            </span>
            <div className={cx("pagination__btns")}>
              <button
                className={cx("pagination__btn")}
                onClick={() => setPage((p) => p - 1)}
                disabled={page === 1}
              >
                <ChevronLeft size={14} />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  className={cx("pagination__btn", { "pagination__btn--active": p === page })}
                  onClick={() => setPage(p)}
                >
                  {p}
                </button>
              ))}
              <button
                className={cx("pagination__btn")}
                onClick={() => setPage((p) => p + 1)}
                disabled={page === totalPages}
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default LichSuGiaoDich;