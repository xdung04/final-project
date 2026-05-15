import React, { useEffect, useState } from "react";
import classNames from "classnames/bind";
import styles from "./DichVu.module.scss";
import { Plus, Edit2, Scissors } from "lucide-react";
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

  if (loading) return <div className={cx("loading")}>Đang tải dữ liệu...</div>;

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
        <button
          className={cx("addButton")}
          onClick={() => { setSelectedService(null); setFormVisible(true); }}
        >
          <Plus size={15} strokeWidth={2} /> Thêm dịch vụ
        </button>
      </div>

      {/* ── SECTION CARD (khớp TongQuan) ─────────────────────────────── */}
      <div className={cx("sectionCard")}>

        {/* Dark header */}
        <div className={cx("sectionHead")}>
          <div className={cx("sectionHead__left")}>
            <Scissors size={16} strokeWidth={1.5} className={cx("sectionHead__icon")} />
            <span className={cx("sectionHead__title")}>Dịch vụ đang hoạt động</span>
          </div>
          <span style={{ fontSize: 11, color: "rgba(245,240,232,0.4)" }}>
            {services.length} dịch vụ
          </span>
        </div>

        {/* Table */}
        <div className={cx("tableWrap")}>
          <table className={cx("table")}>
            <thead>
              <tr>
                <th>Tên dịch vụ</th>
                <th>Mô tả</th>
                <th>Giá</th>
                <th>Thời lượng</th>
                <th>Trạng thái</th>
                <th className={cx("textCenter")}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {services.length > 0 ? services.map((s) => (
                <tr key={s.idService}>
                  <td><span className={cx("serviceName")}>{s.name}</span></td>
                  <td><span className={cx("desc")}>{s.description}</span></td>
                  <td><span className={cx("price")}>{parseInt(s.price).toLocaleString()}đ</span></td>
                  <td>{s.duration} phút</td>
                  <td>
                    <span className={cx("statusBadge", s.status === "Active" ? "active" : "inactive")}>
                      {s.status === "Active" ? "Hoạt động" : "Ngừng"}
                    </span>
                  </td>
                  <td className={cx("textCenter")}>
                    <button
                      className={cx("editBtn")}
                      onClick={() => { setSelectedService(s.idService); setFormVisible(true); }}
                      title="Chỉnh sửa dịch vụ"
                    >
                      <Edit2 size={14} strokeWidth={2} />
                    </button>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={6}><div className={cx("empty")}>Chưa có dịch vụ nào</div></td>
                </tr>
              )}
            </tbody>
          </table>
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