import { useState, useEffect } from "react";
import classNames from "classnames/bind";
import { Plus, Ticket, Tag, Users, Megaphone, Edit2, Trash2, Calendar, Layers } from "lucide-react";
import { useAuth } from "~/context/AuthContext";
import { useToast } from "~/context/ToastContext";
import { fetchAllVouchers, deleteVoucher } from "~/services/voucherService";
import VoucherForm from "~/components/VoucherForm";
import styles from "./Voucher.module.scss";

const cx = classNames.bind(styles);

// Cấu hình thông tin màu sắc và tiêu đề cho từng nhóm loại voucher
const SECTION_GROUPS = [
  { key: "NEW_CUSTOMER", label: "Voucher Khách Hàng Mới", icon: Users, color: "#C9A84C" },
  { key: "POINTS_EXCHANGE", label: "Voucher Đổi Điểm Thưởng", icon: Tag, color: "#4A7A96" },
  { key: "RETENTION", label: "Voucher Tri Ân Khách Hàng", icon: Ticket, color: "#A26B43" },
  { key: "CAMPAIGN", label: "Voucher Chiến Dịch Đặc Biệt", icon: Megaphone, color: "#7D4E74" },
];

function formatMoney(amount) {
  return Number(amount).toLocaleString("vi-VN") + "đ";
}

// ── KHỐI XỬ LÝ ĐỊNH DẠNG SỐ CHO "BỐC" VÀ GỌN GÀNG ───────────────────
function renderDiscountValue(voucher) {
  if (voucher.discount_amount) {
    const amount = Number(voucher.discount_amount);
    // Nếu số tiền chẵn nghìn (Ví dụ: 50.000 -> 50k, 100.000 -> 100k)
    if (amount >= 1000 && amount % 1000 === 0) {
      return <span className={cx("amount")}>{amount / 1000}k</span>;
    }
    // Ngược lại hiển thị số tiền bình thường nhưng format chuẩn
    return <span className={cx("amount")}>{formatMoney(amount)}</span>;
  } else {
    // Ép kiểu về float để tự động loại bỏ phần thập phân .00 thừa thãi (10.00% -> 10%)
    const percent = parseFloat(voucher.discount_percent);
    return (
      <span className={cx("percent")}>
        {percent}%<small>GIẢM</small>
      </span>
    );
  }
}

// Thiết kế Card Voucher dạng cuống vé Barber cao cấp
function VoucherCard({ voucher, color, onEdit, onDelete }) {
  return (
    <div className={cx("voucherTicket", { inactive: !voucher.is_active })} style={{ "--ticket-color": color }}>
      {/* Khối trái: Giá trị giảm giá đã được xử lý làm đẹp */}
      <div className={cx("ticketLeft")}>
        <div className={cx("discountBadge")}>{renderDiscountValue(voucher)}</div>
        <div className={cx("conditionText")}>Đơn tối thiểu: {formatMoney(voucher.min_invoice_amount)}</div>
      </div>

      {/* Đường xé vé răng cưa ở giữa */}
      <div className={cx("ticketDivider")}>
        <div className={cx("notchTop")}></div>
        <div className={cx("dashLine")}></div>
        <div className={cx("notchBottom")}></div>
      </div>

      {/* Khối phải: Chi tiết thông tin và Action */}
      <div className={cx("ticketRight")}>
        <div className={cx("ticketHeader")}>
          <h4 className={cx("ticketName")}>{voucher.name}</h4>
          <span className={cx("statusBadge", { active: voucher.is_active })}>
            {voucher.is_active ? "Đang chạy" : "Tạm dừng"}
          </span>
        </div>

        {voucher.description && <p className={cx("ticketDesc")}>{voucher.description}</p>}

        <div className={cx("ticketFooter")}>
          <div className={cx("metaInfo")}>
            {voucher.type === "CAMPAIGN" && (
              <div className={cx("metaItem")}>
                <span>
                  Đã phát:{" "}
                  <strong>
                    {voucher.issued_count}/{voucher.total_quantity ?? "∞"}
                  </strong>
                </span>
              </div>
            )}
            <div className={cx("metaItem", "expiry")}>
              <Calendar size={12} />
              <span>
                {voucher.type === "CAMPAIGN" && voucher.end_date
                  ? new Date(voucher.end_date).toLocaleDateString("vi-VN")
                  : voucher.valid_days
                    ? `Hạn ${voucher.valid_days} ngày`
                    : "Không giới hạn"}
              </span>
            </div>
          </div>

          <div className={cx("ticketActions")}>
            <button className={cx("btnEdit")} onClick={() => onEdit(voucher)} title="Sửa">
              <Edit2 size={12} />
            </button>
            <button className={cx("btnDelete")} onClick={() => onDelete(voucher.id)} title="Xoá">
              <Trash2 size={12} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Voucher() {
  const { showToast } = useToast();

  const [vouchers, setVouchers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingVoucher, setEditingVoucher] = useState(null);
  const [filterType, setFilterType] = useState("ALL");
  const [confirmDelete, setConfirmDelete] = useState(null);

  const loadVouchers = async () => {
    setLoading(true);
    try {
      const data = await fetchAllVouchers();
      setVouchers(data);
    } catch (err) {
      console.error(err);
      showToast({ text: "Lỗi tải danh sách voucher", type: "error", duration: 3000 });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVouchers();
  }, []);

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
      await deleteVoucher(id);
      showToast({ text: "Đã xoá voucher", type: "success", duration: 3000 });
      setConfirmDelete(null);
      loadVouchers();
    } catch (err) {
      showToast({ text: "Lỗi khi xoá voucher", type: "error", duration: 3000 });
    }
  };

  // Mảng cấu hình các Tab lọc
  const filterTabs = [
    { key: "ALL", label: "Tất cả" },
    { key: "NEW_CUSTOMER", label: "Khách mới" },
    { key: "POINTS_EXCHANGE", label: "Đổi điểm" },
    { key: "RETENTION", label: "Giữ chân" },
    { key: "CAMPAIGN", label: "Chiến dịch" },
  ];

  // Lọc danh sách các group sẽ được hiển thị trên giao diện dựa vào tab đang chọn
  const activeGroups = filterType === "ALL" ? SECTION_GROUPS : SECTION_GROUPS.filter((g) => g.key === filterType);

  // Kiểm tra tổng số voucher sau khi lọc để hiển thị màn hình trống nếu không có gì
  const currentFilteredVouchers = filterType === "ALL" ? vouchers : vouchers.filter((v) => v.type === filterType);

  return (
    <div className={cx("voucherPage")}>
      {/* ── PAGE HEADING ──────────────────────────────────────────────── */}
      <div className={cx("pageHead")}>
        <div>
          <h2 className={cx("pageHead__title")}>
            Chương trình <em>Voucher</em>
          </h2>
        </div>
        <div className={cx("pageHead__actions")}>
          <button className={cx("addButton")} onClick={handleCreate}>
            <Plus size={15} strokeWidth={2} /> Tạo voucher mới
          </button>
        </div>
      </div>

      {/* ── GIỮ NGUYÊN FILTER TABS ───────────────────────────────────── */}
      <div className={cx("filterTabs")}>
        {filterTabs.map((tab) => (
          <button
            key={tab.key}
            className={cx("filterTab", { active: filterType === tab.key })}
            onClick={() => setFilterType(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── HIỂN THỊ DANH SÁCH THEO ZONE CÓ ĐƯỜNG NÉT LIỀN ĐẸP MẮT ───── */}
      {loading ? (
        <div className={cx("loading")}>Đang tải bộ sưu tập vé ưu đãi...</div>
      ) : currentFilteredVouchers.length === 0 ? (
        <div className={cx("globalEmpty")}>
          <Ticket size={32} strokeWidth={1} className={cx("emptyIcon")} />
          <p>Không tìm thấy chương trình ưu đãi nào trong danh mục này</p>
        </div>
      ) : (
        <div className={cx("zonesContainer")}>
          {activeGroups.map((group) => {
            const groupVouchers = vouchers.filter((v) => v.type === group.key);

            // Nếu chọn Tab "Tất cả" mà nhóm này không có voucher thì ẩn cả nhóm đi cho gọn
            if (filterType === "ALL" && groupVouchers.length === 0) return null;

            return (
              <div key={group.key} className={cx("zoneBlock")}>
                {/* Tên nhóm Voucher */}
                <h3 className={cx("zoneTitle")} style={{ "--title-color": group.color }}>
                  {group.label}
                </h3>

                {/* Đường phân cách NÉT LIỀN tinh tế theo yêu cầu của bạn */}
                <div className={cx("zoneLine")} style={{ "--line-color": group.color }}></div>

                {/* Grid chứa Card Voucher */}
                <div className={cx("ticketGrid")}>
                  {groupVouchers.map((v) => (
                    <VoucherCard
                      key={v.id}
                      voucher={v}
                      color={group.color}
                      onEdit={handleEdit}
                      onDelete={(id) => setConfirmDelete(id)}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── CONFIRM DELETE MODAL ──────────────────────────────────────── */}
      {confirmDelete && (
        <div className={cx("modalOverlay")} onClick={() => setConfirmDelete(null)}>
          <div className={cx("modalBox")} onClick={(e) => e.stopPropagation()}>
            <div className={cx("modalBox__head")}>
              <Layers size={16} strokeWidth={1.5} className={cx("modalBox__icon")} />
              <span>Xác nhận thu hồi voucher</span>
            </div>
            <div className={cx("modalBox__body")}>
              <p>
                Mã voucher này sẽ bị đóng lập tức, khách hàng không thể nhìn thấy hoặc áp dụng mã này nữa. Bạn chắc chắn
                chứ?
              </p>
            </div>
            <div className={cx("modalBox__actions")}>
              <button className={cx("btnCancel")} onClick={() => setConfirmDelete(null)}>
                Huỷ
              </button>
              <button className={cx("btnConfirmDelete")} onClick={() => handleDelete(confirmDelete)}>
                Đồng ý xoá
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── FORM MODAL ────────────────────────────────────────────────── */}
      {showForm && (
        <VoucherForm
          voucher={editingVoucher}
          onClose={() => setShowForm(false)}
          onSuccess={() => {
            setShowForm(false);
            loadVouchers();
          }}
        />
      )}
    </div>
  );
}

export default Voucher;
