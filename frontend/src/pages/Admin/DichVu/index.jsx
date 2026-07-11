import React, { useEffect, useState } from "react";
import classNames from "classnames/bind";
import styles from "./DichVu.module.scss";
import { Plus, Edit2, Scissors, Clock3, PackageOpen } from "lucide-react";
import ServiceAPI from "~/apis/serviceAPI";
import { BranchAPI } from "~/apis/branchAPI";
import ServiceFormModal from "~/components/ServiceFormModal";

const cx = classNames.bind(styles);

function DichVu() {
  const [services, setServices] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading]   = useState(true);

  const [selectedService, setSelectedService] = useState(null);
  const [formVisible, setFormVisible]         = useState(false);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const s = await ServiceAPI.getAll();
      const b = await BranchAPI.getAll();
      setServices(s);
      setBranches(b);
    } catch (error) {
      console.error("Lỗi khi tải dữ liệu dịch vụ:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  return (
    <div className={cx("serviceList")}>

      {/* ── PAGE HEADING ─────────────────────────────────────────────── */}
      <div className={cx("pageHead")}>
        <div>
          <p className={cx("pageHead__eyebrow")}>Quản lý nội dung</p>
          <h2 className={cx("pageHead__title")}>
            Danh sách <em>Dịch vụ</em>
          </h2>
        </div>
        <div className={cx("headActions")}>
          <span className={cx("countPill")}>{services.length} dịch vụ</span>
          <button
            className={cx("addButton")}
            onClick={() => { setSelectedService(null); setFormVisible(true); }}
          >
            <Plus size={15} strokeWidth={2} /> Thêm dịch vụ
          </button>
        </div>
      </div>

      {/* ── SECTION ──────────────────────────────────────────────────── */}
      <div className={cx("sectionFrame")}>
        <div className={cx("sectionLabel")}>
          <Scissors size={14} strokeWidth={1.5} className={cx("sectionLabel__icon")} />
          <span className={cx("sectionLabel__text")}>Bảng giá dịch vụ</span>
          <span className={cx("sectionLabel__rule")} />
        </div>

        <div className={cx("grid")}>
          {loading ? (
            <div className={cx("loading")}>Đang tải dữ liệu...</div>
          ) : services.length > 0 ? (
            services.map((s) => (
              <div
                key={s.idService}
                className={cx("ticket", { inactiveTicket: s.status !== "Active" })}
              >
                <button
                  className={cx("ticket__editBtn")}
                  onClick={() => { setSelectedService(s.idService); setFormVisible(true); }}
                  title="Chỉnh sửa dịch vụ"
                >
                  <Edit2 size={13} strokeWidth={2} />
                </button>

                <div className={cx("ticket__top")}>
                  <span className={cx("ticket__name")}>{s.name}</span>
                  <span className={cx("ticket__desc")}>{s.description}</span>
                </div>

                <div className={cx("perforation")} />

                <div className={cx("ticket__bottom")}>
                  <div className={cx("priceBlock")}>
                    <span className={cx("priceBlock__label")}>Giá</span>
                    <span className={cx("price")}>{parseInt(s.price).toLocaleString()}đ</span>
                  </div>
                  <div className={cx("metaBlock")}>
                    <span className={cx("duration")}>
                      <Clock3 size={12} strokeWidth={2} /> {s.duration} phút
                    </span>
                    <span className={cx("statusBadge", s.status === "Active" ? "active" : "inactive")}>
                      {s.status === "Active" ? "Hoạt động" : "Ngừng"}
                    </span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className={cx("empty")}>
              <PackageOpen size={22} strokeWidth={1.5} className={cx("emptyIcon")} />
              Chưa có dịch vụ nào
            </div>
          )}
        </div>
      </div>

      {/* ── MODAL ────────────────────────────────────────────────────── */}
      {formVisible && (
        <ServiceFormModal
          show={formVisible}
          onClose={() => setFormVisible(false)}
          serviceId={selectedService}
          branches={branches}
          onUpdated={fetchAll}
        />
      )}
    </div>
  );
}

export default DichVu;