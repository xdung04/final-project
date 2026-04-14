import React, { useEffect, useState } from "react";
import classNames from "classnames/bind";
import styles from "./ChiNhanh.module.scss";
import BranchCard from "~/components/BranchCard";
import Toast from "~/components/Toast";
import { BranchAPI } from "~/apis/branchAPI";
import serviceApi from "~/apis/serviceAPI";
import { Plus, Store, CalendarClock, UserPlus, MapPin, Globe } from "lucide-react"; // Đã đổi icon Globe cho Maps

const cx = classNames.bind(styles);

function ChiNhanh() {
  const [branches, setBranches] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  // States quản lý Form Chi nhánh
  const [showForm, setShowForm] = useState(false);
  const [editingBranch, setEditingBranch] = useState(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState(getEmptyFormData());

  const [showSuspendForm, setShowSuspendForm] = useState(false);
  const [suspendBranch, setSuspendBranch] = useState(null);
  const [suspendFormData, setSuspendFormData] = useState({ suspendDate: "", resumeDate: "" });
  const [suspendMode, setSuspendMode] = useState("suspend");

  const [allProvinces, setAllProvinces] = useState([]);
  const [allDistricts, setAllDistricts] = useState([]);
  const [allWards, setAllWards] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [showReceptionistInfo, setShowReceptionistInfo] = useState(false);
  const [selectedReceptionist, setSelectedReceptionist] = useState(null);


  function getEmptyFormData() {
    return {
      // Dữ liệu chi nhánh (Bước 1)
      name: "",
      address: "",
      openTime: "08:00",
      closeTime: "20:00",
      slotDuration: 30,
      selectedServices: [],
      startDate: "",
      googleMapUrl: "", // MỚI: Field ảo để lưu link dán vào
      latitude: "",  
      longitude: "", 
      isEditable: true,
      
      // Dữ liệu Lễ tân (Bước 2)
      receptionistName: "",
      receptionistEmail: "",
      receptionistPhone: "",
      receptionistPassword: "",
    };
  }
const openReceptionistModal = (manager) => {
  if (!manager) {
    showToast("error", "Chi nhánh này chưa có thông tin quản lý!");
    return;
  }
  setSelectedReceptionist(manager);
  setShowReceptionistInfo(true);
};
  const normalize = (str) => str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

  // Tìm đến hàm fetchBranches và sửa đoạn map này:
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
          if (b.suspendDate > today) isScheduledSuspend = true;
          else if (b.suspendDate <= today && b.resumeDate > today) isSuspended = true;
        }

        return {
          ...b,
          id: b.idBranch,
          // manager: b.manager?.fullName || "Chưa có quản lý", // BỎ DÒNG NÀY
          manager: b.manager, // GIỮ NGUYÊN OBJECT ĐỂ LẤY DATA CHI TIẾT
          staff: b.totalBarbers || 0,
          revenue: b.revenue || "Đang cập nhật",
          status: b.status === "Active" ? "Hoạt động" : "Tạm ngưng",
          suspendInfo: { isSuspended, isScheduledSuspend, suspendDate: b.suspendDate || null, resumeDate: b.resumeDate || null },
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

  const showToast = (type, text, duration = 3000) => setToast({ type, text, duration });

  useEffect(() => {
    Promise.all([
      fetch("https://provinces.open-api.vn/api/p/").then((res) => res.json()),
      fetch("https://provinces.open-api.vn/api/d/").then((res) => res.json()),
      fetch("https://provinces.open-api.vn/api/w/").then((res) => res.json()),
    ]).then(([p, d, w]) => {
      setAllProvinces(p); setAllDistricts(d); setAllWards(w);
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

    setSuggestions(results.slice(0, 10));
  };

  const selectSuggestion = (address) => {
    setFormData({ ...formData, address });
    setSuggestions([]);
  };

  // ==========================================
  // MỚI: Logic phân tích Link Google Maps
  // ==========================================
const handleMapUrlChange = (e) => {
    const url = e.target.value;
    setFormData((prev) => ({ ...prev, googleMapUrl: url }));

    if (!url.trim()) return;

    // 1. Kiểm tra link rút gọn (goo.gl / maps.app.goo.gl)
    if (url.includes("goo.gl") || url.includes("maps.app.goo.gl")) {
      showToast("error", "Link rút gọn không chứa tọa độ. Vui lòng copy link dài từ thanh địa chỉ trình duyệt!");
      return;
    }

    // 2. Regex bóc tách Vĩ độ và Kinh độ từ chuỗi chứa @lat,lng
    const regex = /@(-?\d+\.\d+),(-?\d+\.\d+)/;
    const match = url.match(regex);

    if (match) {
      setFormData((prev) => ({
        ...prev,
        latitude: match[1],
        longitude: match[2],
      }));
      showToast("success", "Đã trích xuất tọa độ thành công!");
    } else {
      // 3. Trường hợp dán link dài nhưng chưa chọn địa điểm cụ thể hoặc link không đúng định dạng
      showToast("error", "Không tìm thấy tọa độ trong liên kết. Hãy chọn một địa điểm cụ thể trên bản đồ trước khi copy link!");
    }
  };

  const openGoogleMaps = () => {
    window.open("https://www.google.com/maps", "_blank");
  };
  // ==========================================

  const openCreateForm = () => {
    setEditingBranch(null);
    setFormData(getEmptyFormData());
    setCurrentStep(1); 
    setShowForm(true);
  };

  const openEditForm = (branch) => {
    setEditingBranch(branch);
    setFormData({
      ...branch,
      selectedServices: branch.services?.map((s) => s.idService) || [],
      isEditable: branch.status === "Tạm ngưng",
      startDate: branch.startDate || "",
      latitude: branch.latitude || "",
      longitude: branch.longitude || "",
      googleMapUrl: "", // Reset field dán URL khi mở Edit
    });
    setCurrentStep(1);
    setShowForm(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();

    if (!editingBranch && currentStep === 1) {
      if (formData.selectedServices.length === 0) {
        showToast("error", "Vui lòng chọn ít nhất 1 dịch vụ!");
        return;
      }
      setCurrentStep(2);
      return;
    }

    try {
      const payload = {
        name: formData.name,
        address: formData.address,
        openTime: formData.openTime,
        closeTime: formData.closeTime,
        slotDuration: formData.slotDuration,
        startDate: formData.startDate ? `${formData.startDate} 00:00:00` : null,
        selectedServices: formData.selectedServices,
        status: formData.status === "Hoạt động" ? "Active" : "Inactive",
        latitude: formData.latitude,   
        longitude: formData.longitude, 
      };

      if (!editingBranch) {
        payload.receptionist = {
          fullName: formData.receptionistName,
          email: formData.receptionistEmail,
          phone: formData.receptionistPhone,
          password: formData.receptionistPassword,
        };
      }

      if (editingBranch) {
        await BranchAPI.update(editingBranch.id, payload);
        showToast("success", "Cập nhật thành công!");
      } else {
        await BranchAPI.create(payload);
        showToast("success", "Tạo chi nhánh & tài khoản lễ tân thành công!");
      }

      setShowForm(false);
      fetchBranches();
    } catch (err) {
      console.error(err);
      showToast("error", "Có lỗi xảy ra, vui lòng thử lại!");
    }
  };

  const openSuspendForm = (branch, mode) => {
    setSuspendBranch(branch);
    if (mode === "suspend") setSuspendFormData({ suspendDate: "", resumeDate: "" });
    else if (mode === "resume") setSuspendFormData({ suspendDate: branch.suspendDate || "", resumeDate: "" });
    setSuspendMode(mode);
    setShowSuspendForm(true);
  };
  const handleSuspendChange = (e) => setSuspendFormData({ ...suspendFormData, [e.target.name]: e.target.value });
  const handleSuspendSubmit = async (e) => {
    e.preventDefault();
    try {
      let res = suspendMode === "suspend" 
        ? await BranchAPI.setSuspend(suspendBranch.id, { suspendDate: suspendFormData.suspendDate })
        : await BranchAPI.setResume(suspendBranch.id, { resumeDate: suspendFormData.resumeDate });

      if (res.success) {
        showToast("success", res.message);
        fetchBranches();
        setShowSuspendForm(false);
      } else showToast("error", res.message);
    } catch (err) { showToast("error", "Lỗi khi lưu ngày!"); }
  };
  const handleToggleStatus = (branch) => {
    const today = new Date().toISOString().split("T")[0];
    if (branch.resumeDate && branch.resumeDate > today) return showToast("info", `Chi nhánh mở cửa lại từ ${new Date(branch.resumeDate).toLocaleDateString("vi-VN")}`);
    if (branch.suspendInfo.suspendDate && branch.suspendInfo.suspendDate > today) return showToast("info", `Chi nhánh sẽ ngưng từ ${new Date(branch.suspendInfo.suspendDate).toLocaleDateString("vi-VN")}`);
    if (branch.suspendInfo.suspendDate <= today && (!branch.suspendInfo.resumeDate || branch.suspendInfo.resumeDate > today)) return openSuspendForm(branch, "resume");
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
      // Nếu Card của bạn cần hiển thị tên thì truyền riêng prop managerName
      managerName={branch.manager?.fullName || "Chưa có quản lý"} 
      onEdit={() => openEditForm(branch)} 
      onToggle={() => handleToggleStatus(branch)}
      // THÊM DÒNG NÀY ĐỂ FIX LỖI
      onViewReceptionist={() => openReceptionistModal(branch.manager)} 
    />
  ))}
</div>

      {showForm && (
        <div className={cx("modalOverlay")}>
          <div className={cx("modal")}>
            
            <div className={cx("modalHeader")}>
              <h3>{editingBranch ? "Cập nhật chi nhánh" : "Thêm chi nhánh mới"}</h3>
            </div>

            {!editingBranch && (
              <div className={cx("stepIndicator")}>
                <div className={cx("step", { active: currentStep === 1, completed: currentStep > 1 })}>
                  1. Thông tin Chi nhánh
                </div>
                <div className={cx("step", { active: currentStep === 2 })}>
                  2. Tài khoản Lễ tân
                </div>
              </div>
            )}

            <form onSubmit={handleFormSubmit}>
              
              {currentStep === 1 && (
                <>
                  <div className={cx("formGrid")}>
                    <div>
                      <label>Tên chi nhánh</label>
                      <input name="name" value={formData.name} onChange={handleChange} required disabled={!formData.isEditable} placeholder="Vd: Barber Quận 1..." />
                    </div>
                    <div style={{ position: "relative" }}>
                      <label>Địa chỉ</label>
                      <input name="address" value={formData.address} onChange={handleAddressChange} placeholder="Nhập địa chỉ…" autoComplete="off" required disabled={!formData.isEditable} />
                      {suggestions.length > 0 && formData.isEditable && (
                        <ul className={cx("suggestList")}>
                          {suggestions.map((item, idx) => (
                            <li key={idx} onClick={() => selectSuggestion(item)}>{item}</li>
                          ))}
                        </ul>
                      )}
                    </div>

                    {/* ======================================= */}
                    {/* KHU VỰC CẬP NHẬT TỌA ĐỘ GOOGLE MAPS LẠI  */}
                    {/* ======================================= */}
                    <div style={{ gridColumn: "span 2", background: "#f8fafc", padding: "12px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', margin: 0 }}>
                          <MapPin size={16} color="#0284c7" /> <b>Định vị bản đồ</b>
                        </label>
                        {formData.isEditable && (
                          <button 
                            type="button" 
                            onClick={openGoogleMaps} 
                            style={{ 
                              display: "flex", gap: "6px", alignItems: "center",
                              padding: "6px 12px", background: "#fff", border: "1px solid #cbd5e1", 
                              borderRadius: "6px", cursor: "pointer", fontSize: "13px", fontWeight: "600"
                            }}
                          >
                            <Globe size={14} color="#059669" /> Mở Web Google Maps
                          </button>
                        )}
                      </div>

                      {formData.isEditable && (
                        <input 
                          name="googleMapUrl" 
                          value={formData.googleMapUrl} 
                          onChange={handleMapUrlChange} 
                          placeholder="Dán toàn bộ Link Google Maps vào đây để tự động lấy tọa độ..." 
                          style={{ marginBottom: "10px", borderColor: "#bae6fd" }}
                        />
                      )}

                      <div style={{ display: "flex", gap: "10px" }}>
                        <input name="latitude" value={formData.latitude} onChange={handleChange} placeholder="Vĩ độ (Latitude)" disabled={!formData.isEditable} style={{ flex: 1, backgroundColor: "#fff" }} />
                        <input name="longitude" value={formData.longitude} onChange={handleChange} placeholder="Kinh độ (Longitude)" disabled={!formData.isEditable} style={{ flex: 1, backgroundColor: "#fff" }} />
                      </div>

                      <small style={{ color: "#64748b", marginTop: "8px", display: "block", lineHeight: "1.5" }}>
                        * <b>Hướng dẫn:</b> Bấm Mở Web Google Maps, tìm địa chỉ quán, sau đó copy toàn bộ đường link trên thanh URL (chứa ký tự @) và dán vào ô trên. Hệ thống sẽ tự tách tọa độ.
                      </small>
                    </div>
                    {/* ======================================= */}

                    {!editingBranch && (
                      <div>
                        <label>Ngày khai trương</label>
                        <input type="date" name="startDate" required min={new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split("T")[0]} value={formData.startDate} onChange={handleChange} />
                      </div>
                    )}

                    <div>
                      <label>Giờ mở cửa</label>
                      <input type="time" name="openTime" value={formData.openTime} onChange={handleChange} disabled={!formData.isEditable} required />
                    </div>

                    <div>
                      <label>Giờ đóng cửa</label>
                      <input type="time" name="closeTime" value={formData.closeTime} onChange={handleChange} disabled={!formData.isEditable} required />
                    </div>

                    <div>
                      <label>Thời lượng 1 ca (phút)</label>
                      <input type="number" name="slotDuration" min="10" max="120" value={formData.slotDuration} onChange={handleChange} disabled={!formData.isEditable} required />
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
                </>
              )}

              {currentStep === 2 && !editingBranch && (
                <div className={cx("formGrid")} style={{ marginTop: '20px' }}>
                  <div style={{ gridColumn: 'span 2', display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-dim)', fontSize: '14px', marginBottom: '10px' }}>
                     <UserPlus size={18} /> <span>Hệ thống sẽ tạo tự động 1 tài khoản quản lý chi nhánh (Lễ tân)</span>
                  </div>
                  <div>
                    <label>Họ tên Lễ tân</label>
                    <input name="receptionistName" value={formData.receptionistName} onChange={handleChange} placeholder="Vd: Nguyễn Văn A" required />
                  </div>
                  <div>
                    <label>Số điện thoại</label>
                    <input name="receptionistPhone" value={formData.receptionistPhone} onChange={handleChange} placeholder="09xxxxxxxxx" required />
                  </div>
                  <div>
                    <label>Email đăng nhập</label>
                    <input type="email" name="receptionistEmail" value={formData.receptionistEmail} onChange={handleChange} placeholder="letan@barber.com" required />
                  </div>
                  <div>
                    <label>Mật khẩu</label>
                    <input type="password" name="receptionistPassword" value={formData.receptionistPassword} onChange={handleChange} placeholder="Nhập mật khẩu..." required />
                  </div>
                </div>
              )}

              <div className={cx("modalActions")}>
                {currentStep === 1 ? (
                  <>
                    <button type="button" className={cx("cancelBtn")} onClick={() => setShowForm(false)}>Hủy bỏ</button>
                    {formData.isEditable && (
                      <button type="submit" className={cx("saveBtn")}>
                        {editingBranch ? "Lưu thông tin" : "Tiếp tục (Tạo tài khoản)"}
                      </button>
                    )}
                  </>
                ) : (
                  <>
                    <button type="button" className={cx("cancelBtn")} onClick={() => setCurrentStep(1)}>Quay lại</button>
                    <button type="submit" className={cx("saveBtn")}>Hoàn tất & Khai trương</button>
                  </>
                )}
              </div>

            </form>
          </div>
        </div>
      )}
      

      {showSuspendForm && (
         <div className={cx("modalOverlay")}>
         <div className={cx("modal", "modalSuspendForm")}>
           <div className={cx("modalHeader")}>
             <CalendarClock size={28} strokeWidth={1.5} style={{ color: "var(--gold-dark)", marginBottom: 10 }} />
             <h3>{suspendMode === "suspend" ? "Lịch tạm ngưng hoạt động" : "Lịch mở cửa trở lại"}</h3>
           </div>
           <form onSubmit={handleSuspendSubmit}>
             <div className={cx("formGridSuspend")}>
               {suspendMode === "suspend" ? (
                 <div>
                   <label>Chọn ngày bắt đầu đóng cửa</label>
                   <input type="date" name="suspendDate" value={suspendFormData.suspendDate} onChange={handleSuspendChange} required />
                 </div>
               ) : (
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
      {showReceptionistInfo && selectedReceptionist && (
  <div className={cx("modalOverlay")}>
    <div className={cx("modal")} style={{ maxWidth: "500px" }}>
      <div className={cx("modalHeader")}>
        <h3>Tài khoản quản lý</h3>
      </div>
      <div className={cx("formGrid")} style={{ gridTemplateColumns: "1fr", gap: "15px" }}>
        <div>
          <label>Họ và tên</label>
          <input value={selectedReceptionist.fullName || ""} readOnly />
        </div>
        <div>
          <label>Số điện thoại</label>
          <input value={selectedReceptionist.phone || ""} readOnly />
        </div>
        <div>
          <label>Email đăng nhập</label>
          <input value={selectedReceptionist.email || ""} readOnly />
        </div>
        <div>
          <label>Mật khẩu hệ thống</label>
          <input value={selectedReceptionist.password || "********"} readOnly />
        </div>
      </div>
      <div className={cx("modalActions")}>
        <button className={cx("saveBtn")} style={{ width: "100%" }} onClick={() => setShowReceptionistInfo(false)}>Đóng</button>
      </div>
    </div>
  </div>
)}

      {toast && <Toast type={toast.type} text={toast.text} duration={toast.duration} onClose={() => setToast(null)} />}
    </div>
  );
}

export default ChiNhanh;