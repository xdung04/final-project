import React, { useEffect, useState } from "react";
import classNames from "classnames/bind";
import styles from "./ChiNhanh.module.scss";
import BranchCard from "~/components/BranchCard";
import Toast from "~/components/Toast";
import { BranchAPI } from "~/apis/branchAPI";
import serviceApi from "~/apis/serviceAPI";
import { useToast } from "~/context/ToastContext";
import { Plus, Store, CalendarClock } from "lucide-react"; // Bổ sung Icon

const cx = classNames.bind(styles);

function ChiNhanh() {
  const [branches, setBranches] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  const [showForm, setShowForm] = useState(false);
  const [editingBranch, setEditingBranch] = useState(null);
  const [formData, setFormData] = useState(getEmptyFormData());

  const [showSuspendForm, setShowSuspendForm] = useState(false);
  const [suspendBranch, setSuspendBranch] = useState(null);
  const [suspendFormData, setSuspendFormData] = useState({ suspendDate: "", resumeDate: "" });
  const [suspendMode, setSuspendMode] = useState("suspend");

  const [allProvinces, setAllProvinces] = useState([]);
  const [allDistricts, setAllDistricts] = useState([]);
  const [allWards, setAllWards] = useState([]);
  const [suggestions, setSuggestions] = useState([]);

  function getEmptyFormData() {
    return {
      name: "",
      address: "",
      openTime: "08:00",
      closeTime: "20:00",
      slotDuration: 30,
      managerId: "",
      selectedServices: [],
      startDate: "",
      isEditable: true,
    };
  }

  const normalize = (str) => str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

  const fetchBranches = async () => {
    try {
      const data = await BranchAPI.getAll();
      const list = Array.isArray(data) ? data : [];

      setBranches(
        list.map((b) => {
          const today = new Date().toISOString().split("T")[0];

          let isSuspended = false;
          let isScheduledSuspend = false;

          if (b.suspendDate && b.resumeDate) {
            if (b.suspendDate > today) {
              isScheduledSuspend = true;
            } else if (b.suspendDate <= today && b.resumeDate > today) {
              isSuspended = true;
            }
          }

          return {
            ...b,
            id: b.idBranch,
            manager: b.manager?.fullName || "Chưa có quản lý",
            staff: b.totalBarbers || 0,
            revenue: b.revenue || "Đang cập nhật",
            status: b.status === "Active" ? "Hoạt động" : "Tạm ngưng",
            suspendInfo: {
              isSuspended,
              isScheduledSuspend,
              suspendDate: b.suspendDate || null,
              resumeDate: b.resumeDate || null,
            },
          };
        })
      );
    } catch (err) {
      console.error(err);
      showToast("error", "Lỗi khi tải chi nhánh");
    }
  };

  const fetchServices = async () => {
    try {
      const data = await serviceApi.getAll();
      setServices(data);
    } catch (err) {
      console.error(err);
      showToast("error", "Không tải được dịch vụ!");
    }
  };

  const showToast = (type, text, duration = 2000) => setToast({ type, text, duration });

  useEffect(() => {
    Promise.all([
      fetch("https://provinces.open-api.vn/api/p/").then((res) => res.json()),
      fetch("https://provinces.open-api.vn/api/d/").then((res) => res.json()),
      fetch("https://provinces.open-api.vn/api/w/").then((res) => res.json()),
    ]).then(([p, d, w]) => {
      setAllProvinces(p);
      setAllDistricts(d);
      setAllWards(w);
    });

    fetchBranches();
    fetchServices();
    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const toggleService = (id) => {
    setFormData((prev) => ({
      ...prev,
      selectedServices: prev.selectedServices.includes(id)
        ? prev.selectedServices.filter((s) => s !== id)
        : [...prev.selectedServices, id],
    }));
  };

  const handleAddressChange = (e) => {
    const value = e.target.value;
    setFormData({ ...formData, address: value });
    if (!value.trim()) return setSuggestions([]);

    const [streetPart, ...rest] = value.split(",");
    const street = streetPart.trim();
    const keywordAddress = normalize(rest.join(",")).trim();
    const actualKeyword = keywordAddress || normalize(street);

    const results = [];

    allWards.forEach((w) => {
      if (normalize(w.name).includes(actualKeyword)) {
        const district = allDistricts.find((d) => d.code === w.district_code);
        const province = allProvinces.find((p) => p.code === district?.province_code);
        results.push(`${street ? street + ", " : ""}${w.name}, ${district?.name}, ${province?.name}`);
      }
    });

    allDistricts.forEach((d) => {
      if (normalize(d.name).includes(actualKeyword)) {
        const province = allProvinces.find((p) => p.code === d.province_code);
        results.push(`${street ? street + ", " : ""}${d.name}, ${province?.name}`);
      }
    });

    allProvinces.forEach((p) => {
      if (normalize(p.name).includes(actualKeyword)) {
        results.push(`${street ? street + ", " : ""}${p.name}`);
      }
    });

    setSuggestions(results.slice(0, 10));
  };

  const selectSuggestion = (address) => {
    setFormData({ ...formData, address });
    setSuggestions([]);
  };

  const openCreateForm = () => {
    setEditingBranch(null);
    setFormData(getEmptyFormData());
    setShowForm(true);
  };

  const openEditForm = (branch) => {
    setEditingBranch(branch);
    setFormData({
      ...branch,
      selectedServices: branch.services?.map((s) => s.idService) || [],
      isEditable: branch.status === "Tạm ngưng",
      startDate: branch.startDate || "",
    });
    setShowForm(true);
  };

  const openSuspendForm = (branch, mode) => {
    setSuspendBranch(branch);
    if (mode === "suspend") {
      setSuspendFormData({ suspendDate: "", resumeDate: "" });
    } else if (mode === "resume") {
      setSuspendFormData({ suspendDate: branch.suspendDate || "", resumeDate: "" });
    }
    setSuspendMode(mode);
    setShowSuspendForm(true);
  };

  const handleSuspendChange = (e) =>
    setSuspendFormData({ ...suspendFormData, [e.target.name]: e.target.value });

  const handleSuspendSubmit = async (e) => {
    e.preventDefault();
    const { suspendDate, resumeDate } = suspendFormData;

    try {
      let res;
      if (suspendMode === "suspend") {
        res = await BranchAPI.setSuspend(suspendBranch.id, { suspendDate });
      } else {
        res = await BranchAPI.setResume(suspendBranch.id, { resumeDate });
      }

      if (res.success) {
        showToast("success", res.message);
        fetchBranches();
        setShowSuspendForm(false);
      } else {
        showToast("error", res.message);
      }
    } catch (err) {
      console.error(err);
      showToast("error", "Lỗi khi lưu ngày!");
    }
  };

  const formatDate = (d) => (d ? `${d} 00:00:00` : null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        startDate: formatDate(formData.startDate),
        selectedServices: formData.selectedServices,
        status: formData.status === "Hoạt động" ? "Active" : "Inactive",
      };

      if (editingBranch) {
        await BranchAPI.update(editingBranch.id, payload);
      } else {
        await BranchAPI.create(payload);
      }

      showToast("success", editingBranch ? "Cập nhật thành công!" : "Thêm chi nhánh thành công!");
      setShowForm(false);
      fetchBranches();
    } catch (err) {
      console.error(err);
      showToast("error", "Lỗi khi lưu chi nhánh!");
    }
  };

  const handleToggleStatus = (branch) => {
    const today = new Date().toISOString().split("T")[0];
    const startDate = branch.resumeDate;
    const { suspendDate, resumeDate } = branch.suspendInfo;

    if (startDate && startDate > today) {
      showToast("info", `Chi nhánh sẽ bắt đầu hoạt động từ ${new Date(startDate).toLocaleDateString("vi-VN")}`, 3000);
      return;
    }
    if (suspendDate && suspendDate > today) {
      showToast("info", `Chi nhánh sẽ tạm ngưng từ ${new Date(suspendDate).toLocaleDateString("vi-VN")}`, 3000);
      return;
    }
    if (suspendDate && suspendDate <= today && (!resumeDate || resumeDate > today)) {
      openSuspendForm(branch, "resume");
      return;
    }
    openSuspendForm(branch, "suspend");
  };

  if (loading) return <div className={cx("loading")}>Đang tải dữ liệu...</div>;

  return (
    <div className={cx("branchList")}>
      <div className={cx("header")}>
        <div className={cx("titleBox")}>
          <Store size={28} strokeWidth={1.5} className={cx("titleIcon")} />
          <h2>Quản lý chi nhánh</h2>
        </div>
        <button className={cx("addBtn")} onClick={openCreateForm}>
          <Plus size={18} strokeWidth={2} />
          Thêm chi nhánh
        </button>
      </div>

      <div className={cx("grid")}>
        {branches.map((branch) => (
          <BranchCard
            key={branch.id}
            {...branch}
            onEdit={() => openEditForm(branch)}
            onToggle={() => handleToggleStatus(branch)}
          />
        ))}
      </div>

      {/* ======================= MODAL FORM CHI NHÁNH ======================= */}
      {showForm && (
        <div className={cx("modalOverlay")}>
          <div className={cx("modal")}>
            <div className={cx("modalHeader")}>
              <h3>{editingBranch ? "Cập nhật chi nhánh" : "Thêm chi nhánh mới"}</h3>
            </div>
            <form onSubmit={handleSubmit}>
              <div className={cx("formGrid")}>
                <div>
                  <label>Tên chi nhánh</label>
                  <input name="name" value={formData.name} onChange={handleChange} required disabled={!formData.isEditable} placeholder="Vd: Barber Quận 1..." />
                </div>
                <div style={{ position: "relative" }}>
                  <label>Địa chỉ</label>
                  <input
                    name="address"
                    value={formData.address}
                    onChange={handleAddressChange}
                    placeholder="Nhập địa chỉ…"
                    autoComplete="off"
                    required
                    disabled={!formData.isEditable}
                  />
                  {suggestions.length > 0 && formData.isEditable && (
                    <ul className={cx("suggestList")}>
                      {suggestions.map((item, idx) => (
                        <li key={idx} onClick={() => selectSuggestion(item)}>{item}</li>
                      ))}
                    </ul>
                  )}
                </div>

                {!editingBranch && (
                  <div>
                    <label>Ngày khai trương</label>
                    <input type="date" name="startDate" required min={new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split("T")[0]} value={formData.startDate} onChange={handleChange} />
                  </div>
                )}

                <div>
                  <label>Giờ mở cửa</label>
                  <input type="time" name="openTime" value={formData.openTime} onChange={handleChange} disabled={!formData.isEditable} />
                </div>

                <div>
                  <label>Giờ đóng cửa</label>
                  <input type="time" name="closeTime" value={formData.closeTime} onChange={handleChange} disabled={!formData.isEditable} />
                </div>

                <div>
                  <label>Thời lượng 1 ca (phút)</label>
                  <input type="number" name="slotDuration" min="10" max="120" value={formData.slotDuration} onChange={handleChange} disabled={!formData.isEditable} />
                </div>
              </div>

              <div className={cx("serviceSection")}>
                <label>Dịch vụ cung cấp</label>
                <div className={cx("serviceListModal")}>
                  {services.map((s) => (
                    <label key={s.idService} className={cx("serviceItem")}>
                      <input type="checkbox" checked={formData.selectedServices.includes(s.idService)} onChange={() => toggleService(s.idService)} disabled={!formData.isEditable} />
                      <span>{s.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className={cx("modalActions")}>
                <button type="button" className={cx("cancelBtn")} onClick={() => setShowForm(false)}>Hủy bỏ</button>
                {formData.isEditable && <button type="submit" className={cx("saveBtn")}>Lưu thông tin</button>}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================= MODAL TẠM NGƯNG/HOẠT ĐỘNG ======================= */}
      {showSuspendForm && (
        <div className={cx("modalOverlay")}>
          <div className={cx("modal", "modalSuspendForm")}>
            <div className={cx("modalHeader")}>
              <CalendarClock size={28} strokeWidth={1.5} style={{ color: "var(--gold-dark)", marginBottom: 10 }} />
              <h3>
                {suspendMode === "suspend"
                  ? "Lịch tạm ngưng hoạt động"
                  : "Lịch mở cửa trở lại"}
              </h3>
            </div>
            <form onSubmit={handleSuspendSubmit}>
              <div className={cx("formGridSuspend")}>
                {suspendMode === "suspend" && (
                  <div>
                    <label>Chọn ngày bắt đầu đóng cửa</label>
                    <input type="date" name="suspendDate" value={suspendFormData.suspendDate} onChange={handleSuspendChange} required />
                  </div>
                )}
                {suspendMode === "resume" && (
                  <div>
                    <label>Chọn ngày mở cửa đón khách</label>
                    <input type="date" name="resumeDate" value={suspendFormData.resumeDate} onChange={handleSuspendChange} required />
                  </div>
                )}
              </div>
              <div className={cx("modalActions")}>
                <button type="button" className={cx("cancelBtn")} onClick={() => setShowSuspendForm(false)}>Hủy</button>
                <button type="submit" className={cx("saveBtn")}>Xác nhận</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {toast && <Toast type={toast.type} text={toast.text} duration={toast.duration} onClose={() => setToast(null)} />}
    </div>
  );
}

export default ChiNhanh;