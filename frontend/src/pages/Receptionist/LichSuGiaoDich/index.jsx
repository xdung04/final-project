import React, { useState, useEffect, useCallback } from "react";
import classNames from "classnames/bind";
import styles from "./LichSuGiaoDich.module.scss";
import { TransactionAPI } from "~/apis/transactionAPI"; // Import theo cấu trúc của bạn
import {
  Search, Download, FileText, Filter,
  CreditCard, Wallet, BadgeDollarSign, TrendingUp,
  ChevronLeft, ChevronRight, Banknote, X, Loader2
} from "lucide-react";

const cx = classNames.bind(styles);

const STATUS_LABEL  = { completed: "Hoàn tất", cancelled: "Đã hủy", pending: "Chờ xử lý" };
const METHOD_LABEL  = { cash: "Tiền mặt", transfer: "Chuyển khoản", momo: "MoMo" };

const fmt = (n) => Number(n || 0).toLocaleString("vi-VN") + "đ";
const initials = (name) => (name || "K").split(" ").slice(-1)[0].charAt(0).toUpperCase();

const STATUS_FILTERS = [
  { id: "all",       label: "Tất cả" },
  { id: "completed", label: "Hoàn tất" },
  { id: "cancelled", label: "Đã hủy" },
  { id: "pending",   label: "Chờ xử lý" },
];

const PAGE_SIZE = 6;

function LichSuGiaoDich() {
  // ── States cho Bộ lọc ──────────────────────────────────────────────────
  const [search,         setSearch]         = useState("");
  const [dateFrom,       setDateFrom]       = useState("");
  const [dateTo,         setDateTo]         = useState("");
  const [statusFilter,   setStatusFilter]   = useState("all");
  const [methodFilter,   setMethodFilter]   = useState("all");
  const [page,           setPage]           = useState(1);
  const [showMoreFilter, setShowMoreFilter] = useState(false);

  // ── States cho Dữ liệu API ──────────────────────────────────────────────
  const [transactions,   setTransactions]   = useState([]);
  const [statsData,      setStatsData]      = useState(null);
  const [totalItems,     setTotalItems]     = useState(0);
  const [totalPages,     setTotalPages]     = useState(1);
  const [loading,        setLoading]        = useState(false);
  const [selectedTx,     setSelectedTx]     = useState(null);

  // ── 1. Lấy danh sách giao dịch (Server-side Filtering) ──────────────────
  const loadTransactions = useCallback(async () => {
    setLoading(true);
    try {
      const filters = {
        search,
        dateFrom,
        dateTo,
        statusFilter,
        methodFilter,
        page,
        limit: PAGE_SIZE
      };
      
      const res = await TransactionAPI.getTransactions(filters);
      if (res.success) {
        setTransactions(res.data);
        setTotalPages(res.totalPages);
        setTotalItems(res.totalItems);
      }
    } catch (error) {
      console.error("Lỗi khi tải giao dịch:", error.message);
    } finally {
      setLoading(false);
    }
  }, [search, dateFrom, dateTo, statusFilter, methodFilter, page]);

  // ── 2. Lấy thống kê tổng hợp (4 thẻ đầu trang) ──────────────────────────
  const loadStats = async () => {
    try {
      const res = await TransactionAPI.getSummaryStats();
      if (res.success) {
        setStatsData(res.data);
      }
    } catch (error) {
      console.error("Lỗi khi tải thống kê:", error.message);
    }
  };

  // Khởi chạy khi component mount hoặc bộ lọc thay đổi
  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  // Chỉ lấy thống kê lại khi có thay đổi quan trọng hoặc khi mount
  useEffect(() => {
    loadStats();
  }, [statusFilter, dateFrom, dateTo]); // Cập nhật stats khi lọc ngày/trạng thái

  // Reset về trang 1 khi thay đổi bất kỳ bộ lọc nào
  const handleFilterChange = (setter, value) => {
    setter(value);
    setPage(1);
  };

  // ── Render Stats Content ────────────────────────────────────────────────
  const stats = [
    {
      icon: <BadgeDollarSign size={18} strokeWidth={1.5} />,
      label: "Tổng doanh thu",
      value: fmt(statsData?.totalRev),
      sub: `${statsData?.completedCount || 0} đơn hoàn tất`,
      highlight: true,
    },
    {
      icon: <Wallet size={18} strokeWidth={1.5} />,
      label: "Tiền mặt",
      value: fmt(statsData?.cashRev),
      sub: "Thu tại quầy",
    },
    {
      icon: <CreditCard size={18} strokeWidth={1.5} />,
      label: "Chuyển khoản",
      value: fmt(statsData?.transRev),
      sub: "Bank / Momo",
    },
    {
      icon: <TrendingUp size={18} strokeWidth={1.5} />,
      label: "Đã hủy",
      value: statsData?.cancelCnt || 0,
      sub: "Số lượng đơn hủy",
    },
  ];

  return (
    <div className={cx("page")}>
      {/* HEADER */}
      <div className={cx("pageHead")}>
        <div>
          <p className={cx("pageEyebrow")}>Lễ tân chi nhánh</p>
          <h1 className={cx("pageTitle")}>Lịch sử <em>Giao dịch</em></h1>
        </div>
        <button className={cx("btnGold")} onClick={() => alert("Đang xử lý xuất file...")}>
          <Download size={14} strokeWidth={2} /> Xuất Excel
        </button>
      </div>

      {/* STATS STRIP */}
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

      {/* FILTER BAR */}
      <div className={cx("filterBar")}>
        <div className={cx("filterLeft")}>
          <div className={cx("searchBox")}>
            <Search size={14} />
            <input
              type="text"
              placeholder="Tìm tên khách, mã đơn..."
              value={search}
              onChange={(e) => handleFilterChange(setSearch, e.target.value)}
            />
          </div>
          <div className={cx("dateRange")}>
            <input type="date" className={cx("dateInput")} value={dateFrom} onChange={(e) => handleFilterChange(setDateFrom, e.target.value)} />
            <span>—</span>
            <input type="date" className={cx("dateInput")} value={dateTo} onChange={(e) => handleFilterChange(setDateTo, e.target.value)} />
          </div>
        </div>

        <div className={cx("filterRight")}>
          <div className={cx("pills")}>
            {STATUS_FILTERS.map((f) => (
              <button
                key={f.id}
                className={cx("pill", { "pill--active": statusFilter === f.id })}
                onClick={() => handleFilterChange(setStatusFilter, f.id)}
              >
                {f.id !== "all" && <span className={cx("pill__dot")} />}
                {f.label}
              </button>
            ))}
          </div>
          <button className={cx("btnGhost", { "btnGhost--active": showMoreFilter })} onClick={() => setShowMoreFilter(!showMoreFilter)}>
            <Filter size={13} strokeWidth={2} /> Lọc thêm
          </button>
        </div>
      </div>

      {showMoreFilter && (
        <div className={cx("moreFilterPanel")}>
          <div className={cx("filterGroup")}>
            <label>Phương thức thanh toán:</label>
            <select value={methodFilter} onChange={(e) => handleFilterChange(setMethodFilter, e.target.value)} className={cx("selectInput")}>
              <option value="all">Tất cả phương thức</option>
              <option value="cash">Tiền mặt</option>
              <option value="transfer">Chuyển khoản</option>
            </select>
          </div>
        </div>
      )}

      {/* TABLE SECTION */}
      <div className={cx("tableWrap")}>
        <div className={cx("tableHead")}>
          <span className={cx("tableHead__title")}>Dữ liệu chi nhánh</span>
          <span className={cx("tableHead__count")}>{totalItems} kết quả</span>
        </div>

        <div className={cx("tableOverflow")}>
          <table className={cx("table")}>
            <thead>
              <tr>
                <th>Thời gian</th>
                <th>Khách hàng</th>
                <th>Thợ thực hiện</th>
                <th>Phương thức</th>
                <th>Tổng tiền</th>
                <th>Trạng thái</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7}>
                    <div className={cx("loadingState")}>
                      <Loader2 className={cx("spinner")} /> Đang tải dữ liệu...
                    </div>
                  </td>
                </tr>
              ) : transactions.length > 0 ? transactions.map((t) => (
                <tr key={t.id}>
                  <td>
                    <div className={cx("timeCell")}>
                      <span className={cx("timeHour")}>{t.time}</span>
                      <span className={cx("timeDate")}>{new Date(t.date).toLocaleDateString("vi-VN")}</span>
                    </div>
                  </td>
                  <td>
                    <div className={cx("customerCell")}>
                      <div className={cx("customerAvatar")}>{initials(t.customer)}</div>
                      <div>
                        <div className={cx("customerName")}>{t.customer}</div>
                        <div className={cx("customerId")}>#{t.id}</div>
                      </div>
                    </div>
                  </td>
                  <td><span className={cx("barberName")}>{t.barber}</span></td>
                  <td>
                    <span className={cx("methodTag", `methodTag--${t.method}`)}>
                      {t.method === "cash" ? <Banknote size={11} /> : <CreditCard size={11} />}
                      {METHOD_LABEL[t.method]}
                    </span>
                  </td>
                  <td><span className={cx("amount", { cMuted: t.status === "cancelled" })}>{t.status === "cancelled" ? "—" : fmt(t.total)}</span></td>
                  <td>
                    <span className={cx("statusTag", `statusTag--${t.status}`)}>
                      <span className={cx("statusTag__dot")} />
                      {STATUS_LABEL[t.status]}
                    </span>
                  </td>
                  <td>
                    <button className={cx("actionBtn")} onClick={() => setSelectedTx(t)}><FileText size={14} /></button>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={7}>
                    <div className={cx("empty")}>Không có dữ liệu giao dịch</div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION */}
        {totalPages > 1 && (
          <div className={cx("pagination")}>
            <span className={cx("pagination__info")}>Trang {page} / {totalPages}</span>
            <div className={cx("pagination__btns")}>
              <button className={cx("pagination__btn")} onClick={() => setPage(p => p - 1)} disabled={page === 1}><ChevronLeft size={14} /></button>
              {[...Array(totalPages)].map((_, i) => (
                <button key={i+1} className={cx("pagination__btn", { "pagination__btn--active": i+1 === page })} onClick={() => setPage(i+1)}>{i+1}</button>
              ))}
              <button className={cx("pagination__btn")} onClick={() => setPage(p => p + 1)} disabled={page === totalPages}><ChevronRight size={14} /></button>
            </div>
          </div>
        )}
      </div>

      {/* MODAL CHI TIẾT */}
      {selectedTx && (
        <div className={cx("modalOverlay")} onClick={() => setSelectedTx(null)}>
          <div className={cx("modalContent")} onClick={(e) => e.stopPropagation()}>
            <div className={cx("modalHeader")}>
              <h3>Chi tiết hoá đơn #{selectedTx.id}</h3>
              <button onClick={() => setSelectedTx(null)}><X size={16} /></button>
            </div>
            <div className={cx("modalBody")}>
              <div className={cx("modalGrid")}>
                <p><strong>Khách hàng:</strong> {selectedTx.customer}</p>
                <p><strong>Thợ:</strong> {selectedTx.barber}</p>
                <p><strong>Ngày:</strong> {new Date(selectedTx.date).toLocaleDateString("vi-VN")} lúc {selectedTx.time}</p>
                <p><strong>Thanh toán:</strong> {METHOD_LABEL[selectedTx.method]}</p>
              </div>
              <hr />
              <div className={cx("modalTotal")}>
                <strong>Tổng cộng:</strong>
                <span>{fmt(selectedTx.total)}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default LichSuGiaoDich;
