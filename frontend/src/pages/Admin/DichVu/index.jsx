import React, { useEffect, useState } from "react";
import classNames from "classnames/bind";
import styles from "./DichVu.module.scss";
import { Plus, Edit2, Scissors } from "lucide-react"; // Dùng lucide-react thay cho FontAwesome
import ServiceAPI from "~/apis/serviceAPI";
import { BranchAPI } from "~/apis/branchAPI";
import ServiceFormModal from "~/components/ServiceFormModal";

const cx = classNames.bind(styles);

function DichVu() {
  const [services, setServices] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedService, setSelectedService] = useState(null); // null = thêm mới
  const [formVisible, setFormVisible] = useState(false);

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

  useEffect(() => {
    fetchAll();
  }, []);

  if (loading) return <div className={cx("loading")}>Đang tải dữ liệu...</div>;

  return (
    <div className={cx("serviceList")}>
      <div className={cx("header")}>
        <div className={cx("titleBox")}>
          <Scissors size={28} strokeWidth={1.5} className={cx("titleIcon")} />
          <h2>Quản lý dịch vụ</h2>
        </div>

        <button
          className={cx("addButton")}
          onClick={() => {
            setSelectedService(null);
            setFormVisible(true);
          }}
        >
          <Plus size={18} strokeWidth={2} /> Thêm dịch vụ
        </button>
      </div>

      <div className={cx("tableContainer")}>
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
            {services.map((s) => (
              <tr key={s.idService}>
                <td className={cx("fw-bold")}>{s.name}</td>
                <td className={cx("desc")}>{s.description}</td>
                <td className={cx("price")}>{parseInt(s.price).toLocaleString()} đ</td>
                <td>{s.duration} phút</td>
                <td>
                  <span className={cx("statusBadge", s.status === "Active" ? "active" : "inactive")}>
                    {s.status === "Active" ? "Hoạt động" : "Ngừng"}
                  </span>
                </td>
                <td className={cx("textCenter")}>
                  <button
                    className={cx("editBtn")}
                    onClick={() => {
                      setSelectedService(s.idService);
                      setFormVisible(true);
                    }}
                    title="Chỉnh sửa dịch vụ"
                  >
                    <Edit2 size={16} strokeWidth={2} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal create/update */}
      {formVisible && (
        <ServiceFormModal
          show={formVisible}
          onClose={() => setFormVisible(false)}
          serviceId={selectedService} // null = tạo mới
          branches={branches}
          onUpdated={fetchAll}
        />
      )}
    </div>
  );
}

export default DichVu;