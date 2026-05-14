import { useState, useEffect } from "react";
import classNames from "classnames/bind";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPlus, faPenToSquare, faTrash,
  faTicket, faTag, faUsers, faBullhorn,
} from "@fortawesome/free-solid-svg-icons";
import { useAuth } from "~/context/AuthContext";
import { useToast } from "~/context/ToastContext";
import { fetchAllVouchers, deleteVoucher } from "~/services/voucherService";
import VoucherForm from "~/components/VoucherForm";
import styles from "./Voucher.module.scss";

const cx = classNames.bind(styles);

const TYPE_META = {
  NEW_CUSTOMER:    { label: "Khách mới",        icon: faUsers,    color: "#4ade80" },
  POINTS_EXCHANGE: { label: "Đổi điểm",         icon: faTag,      color: "#60a5fa" },
  RETENTION:       { label: "Giữ chân KH",      icon: faTicket,   color: "#f59e0b" },
  CAMPAIGN:        { label: "Chiến dịch",        icon: faBullhorn, color: "#c084fc" },
};

function formatMoney(amount) {
  return Number(amount).toLocaleString("vi-VN") + "đ";
}

function VoucherRow({ voucher, onEdit, onDelete }) {
  const meta = TYPE_META[voucher.type] || {};

  return (
    <tr className={cx("row", { inactive: !voucher.is_active })}>
      <td>
        <div className={cx("row-name")}>{voucher.name}</div>
        {voucher.description && (
          <div className={cx("row-desc")}>{voucher.description}</div>
        )}
      </td>
      <td>
        <span className={cx("type-badge")} style={{ color: meta.color, borderColor: meta.color }}>
          <FontAwesomeIcon icon={meta.icon} />
          {meta.label}
        </span>
      </td>
      <td className={cx("td-center")}>
        <span className={cx("discount-val")}>{voucher.discount_percent}%</span>
      </td>
      <td className={cx("td-right")}>{formatMoney(voucher.max_discount_amount)}</td>
      <td className={cx("td-right")}>{formatMoney(voucher.min_invoice_amount)}</td>
      <td className={cx("td-center")}>
        {voucher.type === "CAMPAIGN"
          ? `${voucher.issued_count}/${voucher.total_quantity ?? "∞"}`
          : "—"}
      </td>
      <td className={cx("td-center")}>
        {voucher.type === "CAMPAIGN" && voucher.end_date
          ? new Date(voucher.end_date).toLocaleDateString("vi-VN")
          : voucher.valid_days
          ? `${voucher.valid_days} ngày`
          : "Không HH"}
      </td>
      <td className={cx("td-center")}>
        <span className={cx("status-dot", { active: voucher.is_active })}>
          {voucher.is_active ? "Đang chạy" : "Tạm dừng"}
        </span>
      </td>
      <td>
        <div className={cx("row-actions")}>
          <button className={cx("btn-edit")} onClick={() => onEdit(voucher)} title="Chỉnh sửa">
            <FontAwesomeIcon icon={faPenToSquare} />
          </button>
          <button className={cx("btn-delete")} onClick={() => onDelete(voucher.id)} title="Xoá">
            <FontAwesomeIcon icon={faTrash} />
          </button>
        </div>
      </td>
    </tr>
  );
}

function Voucher() {
  const { accessToken } = useAuth();
  const { showToast }   = useToast();

  const [vouchers,       setVouchers]       = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [showForm,       setShowForm]       = useState(false);
  const [editingVoucher, setEditingVoucher] = useState(null);
  const [filterType,     setFilterType]     = useState("ALL");
  const [confirmDelete,  setConfirmDelete]  = useState(null);

  const loadVouchers = async () => {
    setLoading(true);
    try {
      const data = await fetchAllVouchers(accessToken);
      setVouchers(data);
    } catch (err) {
      console.error(err);
      showToast({ text: "Lỗi tải danh sách voucher", type: "error", duration: 3000 });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadVouchers(); }, [accessToken]);

  const handleEdit = (voucher) => {
    setEditingVoucher(voucher);
    setShowForm(true);
  };

  const handleCreate = () => {
    setEditingVoucher(null);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    try {
      await deleteVoucher(accessToken, id);
      showToast({ text: "Đã xoá voucher", type: "success", duration: 3000 });
      setConfirmDelete(null);
      loadVouchers();
    } catch (err) {
      showToast({ text: "Lỗi khi xoá voucher", type: "error", duration: 3000 });
    }
  };

  const filtered = filterType === "ALL"
    ? vouchers
    : vouchers.filter((v) => v.type === filterType);

  const filterTabs = [
    { key: "ALL",            label: "Tất cả"    },
    { key: "NEW_CUSTOMER",   label: "Khách mới" },
    { key: "POINTS_EXCHANGE",label: "Đổi điểm"  },
    { key: "RETENTION",      label: "Giữ chân"  },
    { key: "CAMPAIGN",       label: "Chiến dịch" },
  ];

  return (
    <div className={cx("page")}>
      {/* Header */}
      <div className={cx("header")}>
        <div>
          <h2 className={cx("header-title")}>Quản lý Voucher</h2>
          <p className={cx("header-sub")}>Tạo và quản lý các chương trình ưu đãi</p>
        </div>
        <button className={cx("btn-create")} onClick={handleCreate}>
          <FontAwesomeIcon icon={faPlus} />
          Tạo voucher mới
        </button>
      </div>

      {/* Summary cards */}
      <div className={cx("summary")}>
        {Object.entries(TYPE_META).map(([key, meta]) => {
          const count = vouchers.filter((v) => v.type === key).length;
          return (
            <div key={key} className={cx("summary-card")} style={{ "--accent": meta.color }}>
              <FontAwesomeIcon icon={meta.icon} className={cx("summary-icon")} />
              <div className={cx("summary-count")}>{count}</div>
              <div className={cx("summary-label")}>{meta.label}</div>
            </div>
          );
        })}
      </div>

      {/* Filter tabs */}
      <div className={cx("filter-tabs")}>
        {filterTabs.map((tab) => (
          <button
            key={tab.key}
            className={cx("filter-tab", { active: filterType === tab.key })}
            onClick={() => setFilterType(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className={cx("table-wrap")}>
        {loading ? (
          <div className={cx("loading")}>Đang tải...</div>
        ) : filtered.length === 0 ? (
          <div className={cx("empty")}>
            <FontAwesomeIcon icon={faTicket} className={cx("empty-icon")} />
            <p>Chưa có voucher nào trong danh mục này</p>
          </div>
        ) : (
          <table className={cx("table")}>
            <thead>
              <tr>
                <th>Tên voucher</th>
                <th>Loại</th>
                <th className={cx("td-center")}>Giảm</th>
                <th className={cx("td-right")}>Tối đa</th>
                <th className={cx("td-right")}>Đơn tối thiểu</th>
                <th className={cx("td-center")}>Đã phát</th>
                <th className={cx("td-center")}>Thời hạn</th>
                <th className={cx("td-center")}>Trạng thái</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((v) => (
                <VoucherRow
                  key={v.id}
                  voucher={v}
                  onEdit={handleEdit}
                  onDelete={(id) => setConfirmDelete(id)}
                />
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Delete confirm */}
      {confirmDelete && (
        <div className={cx("confirm-overlay")} onClick={() => setConfirmDelete(null)}>
          <div className={cx("confirm-box")} onClick={(e) => e.stopPropagation()}>
            <div className={cx("confirm-title")}>Xác nhận xoá</div>
            <p className={cx("confirm-text")}>Voucher sẽ bị vô hiệu hoá và không thể phát thêm. Tiếp tục?</p>
            <div className={cx("confirm-actions")}>
              <button className={cx("confirm-cancel")} onClick={() => setConfirmDelete(null)}>Huỷ</button>
              <button className={cx("confirm-ok")} onClick={() => handleDelete(confirmDelete)}>Xoá</button>
            </div>
          </div>
        </div>
      )}

      {/* Form modal */}
      {showForm && (
        <VoucherForm
          voucher={editingVoucher}
          onClose={() => setShowForm(false)}
          onSuccess={() => { setShowForm(false); loadVouchers(); }}
        />
      )}
    </div>
  );
}

export default Voucher;
