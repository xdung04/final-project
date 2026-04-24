import React, { useEffect, useState, useMemo } from "react";
import classNames from "classnames/bind";
import styles from "./ThoCatToc.module.scss";
import Toast from "~/components/Toast";
import {
  Plus,
  MapPin,
  ArrowRightLeft,
  Star,
  Edit2,
  Lock,
  Unlock,
  User,
  Scissors,
  Search,
  Filter,
  Phone,
  Mail,
  FileText,
  Users,
  Loader2, // Thêm icon loading
} from "lucide-react";

import { BarberAPI } from "~/apis/barberAPI";
import { BranchAPI } from "~/apis/branchAPI";

const cx = classNames.bind(styles);

function ThoCatToc() {
  const [toastList, setToastList] = useState([]);

  const showToast = (type, text, duration = 3000) => {
    const id = Date.now();
    setToastList((prev) => [...prev, { id, type, text, duration }]);
  };

  // State dữ liệu danh sách
  const [barbers, setBarbers] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);

  // State tìm kiếm & lọc
  const [searchQuery, setSearchQuery] = useState("");
  const [filterBranch, setFilterBranch] = useState("");

  // State UI
  const [selectedBarber, setSelectedBarber] = useState(null);
  const [barberDetail, setBarberDetail] = useState(null); // Lưu chi tiết hồ sơ gọi từ API
  const [isLoadingDetail, setIsLoadingDetail] = useState(false); // Trạng thái đang tải chi tiết

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showChangeBranch, setShowChangeBranch] = useState(false);

  // Dữ liệu form
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    fullName: "",
    phoneNumber: "",
    idBranch: "",
    profileDescription: "",
  });
  const [editData, setEditData] = useState({
    fullName: "",
    phoneNumber: "",
    email: "",
    idBranch: "",
    profileDescription: "",
  });
  const [newBranchId, setNewBranchId] = useState("");

  // 🔹 Tải danh sách thợ
  const fetchBarbers = async () => {
    try {
      const data = await BarberAPI.getAll();
      setBarbers(data || []);

      if (data?.length > 0 && !selectedBarber) {
        setSelectedBarber(data[0]);
      } else if (selectedBarber) {
        const updatedSelected = data.find((b) => b.idBarber === selectedBarber.idBarber);
        if (updatedSelected) setSelectedBarber(updatedSelected);
      }
    } catch (error) {
      console.error("Lỗi khi tải danh sách barber:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBranches = async () => {
    try {
      const data = await BranchAPI.getAll();
      setBranches(data || []);
    } catch (error) {
      console.error("Lỗi khi tải danh sách chi nhánh:", error);
    }
  };

  useEffect(() => {
    fetchBarbers();
    fetchBranches();
  }, []);

  // 🔹 TỰ ĐỘNG GỌI API LẤY CHI TIẾT KHI CHỌN THỢ
  useEffect(() => {
    const fetchBarberDetail = async () => {
      if (!selectedBarber?.idBarber) return;

      setIsLoadingDetail(true);
      try {
        const detail = await BarberAPI.getProfile(selectedBarber.idBarber);
        setBarberDetail(detail);
      } catch (error) {
        console.error("Lỗi tải chi tiết thợ:", error);
        // showToast("error", "Không thể tải chi tiết hồ sơ!");
      } finally {
        setIsLoadingDetail(false);
      }
    };

    fetchBarberDetail();
  }, [selectedBarber?.idBarber]); // Chỉ chạy lại khi đổi thợ khác

  // Kết hợp dữ liệu từ danh sách (đánh giá, khách, trạng thái) và chi tiết (email, sđt, mô tả)
  const currentProfile = selectedBarber ? { ...selectedBarber, ...barberDetail } : null;

  // Lọc danh sách thợ theo Search và Chi nhánh
  const filteredBarbers = useMemo(() => {
    return barbers.filter((b) => {
      const matchName = b.fullName?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchBranch = filterBranch ? b.idBranch === filterBranch : true;
      return matchName && matchBranch;
    });
  }, [barbers, searchQuery, filterBranch]);

  // 🔹 Khóa/Mở khóa tài khoản
  const handleToggleAccount = async (barber) => {
    const isLocked = barber.status === "locked" || barber.status === "LOCKED";
    const action = isLocked ? "mở" : "khóa";

    if (!window.confirm(`Xác nhận ${action} tài khoản của ${barber.fullName}?`)) return;

    try {
      if (isLocked) {
        await BarberAPI.unlock(barber.idBarber);
        showToast("success", "Tài khoản đã được mở khóa!");
      } else {
        await BarberAPI.lock(barber.idBarber);
        showToast("success", "Tài khoản đã bị khóa!");
      }
      await fetchBarbers();
    } catch (error) {
      showToast("error", error?.response?.data?.message || `Không thể ${action} tài khoản!`);
    }
  };

  // 🔹 Handlers cho Add
  const handleAddChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
  const handleAddSubmit = async (e) => {
    e.preventDefault();
    try {
      await BarberAPI.createBarber(formData);
      showToast("success", "Thêm thợ cắt tóc thành công!");
      setShowAddModal(false);
      await fetchBarbers();
    } catch (error) {
      showToast("error", error?.response?.data?.message || "Không thể tạo thợ mới!");
    }
  };

  // 🔹 Handlers cho Edit
  const openEditModal = () => {
    // Đã có dữ liệu chi tiết ở currentProfile, truyền thẳng vào form
    if (currentProfile) {
      setEditData({
        fullName: currentProfile.fullName || "",
        phoneNumber: currentProfile.phoneNumber || "",
        email: currentProfile.email || "",
        idBranch: currentProfile.idBranch || "",
        profileDescription: currentProfile.profileDescription?.trim() || "",
      });
      setShowEditModal(true);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      await BarberAPI.updateBarber(selectedBarber.idBarber, editData);
      showToast("success", "Cập nhật thông tin thợ thành công!");
      setShowEditModal(false);

      // Gọi lại cả danh sách & chi tiết để làm mới giao diện
      await fetchBarbers();
      const updatedDetail = await BarberAPI.getProfile(selectedBarber.idBarber);
      setBarberDetail(updatedDetail);
    } catch (error) {
      showToast("error", error?.response?.data?.message || "Không thể cập nhật!");
    }
  };

  // 🔹 Đổi chi nhánh
  const handleChangeBranch = async (e) => {
    e.preventDefault();
    if (!selectedBarber || !newBranchId) {
      showToast("error", "Vui lòng chọn chi nhánh mới!");
      return;
    }
    try {
      const res = await BarberAPI.assignBranch({
        idBarber: selectedBarber.idBarber,
        idBranch: newBranchId,
      });
      if (res.success) {
        showToast("success", res.message);
        setShowChangeBranch(false);
        await fetchBarbers();
      } else {
        showToast("error", res.message);
      }
    } catch (error) {
      showToast("error", error?.message || "Không thể đổi chi nhánh!");
    }
  };

  if (loading) return <div className={cx("loading")}>Đang tải dữ liệu...</div>;

  return (
    <div className={cx("container")}>
      <div className={cx("headerArea")}>
        <div className={cx("titleBox")}>
          <Scissors size={28} strokeWidth={1.5} className={cx("titleIcon")} />
          <h2>Quản lý Thợ Cắt Tóc</h2>
        </div>
        <button className={cx("addBtn")} onClick={() => setShowAddModal(true)}>
          <Plus size={18} strokeWidth={2} /> Thêm thợ mới
        </button>
      </div>

      <div className={cx("mainLayout")}>
        {/* === SIDEBAR: DANH SÁCH THỢ === */}
        <div className={cx("sidebar")}>
          <div className={cx("filterBox")}>
            <div className={cx("searchWrapper")}>
              <Search size={18} className={cx("icon")} />
              <input
                type="text"
                placeholder="Tìm tên thợ..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className={cx("filterWrapper")}>
              <Filter size={18} className={cx("icon")} />
              <select value={filterBranch} onChange={(e) => setFilterBranch(e.target.value)}>
                <option value="">Tất cả chi nhánh</option>
                {branches.map((br) => (
                  <option key={br.idBranch} value={br.idBranch}>
                    {br.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className={cx("barberList")}>
            {filteredBarbers.length === 0 ? (
              <p className={cx("noData")}>Không tìm thấy thợ nào.</p>
            ) : (
              filteredBarbers.map((b) => (
                <div
                  key={b.idBarber}
                  className={cx("barberCard", {
                    active: selectedBarber?.idBarber === b.idBarber,
                    locked: b.status === "locked" || b.status === "LOCKED",
                  })}
                  onClick={() => setSelectedBarber(b)}
                >
                  <div className={cx("avatarSmall")}>
                    {b.image ? (
                      <img src={b.image} alt={b.fullName} className={cx("avatarImg")} />
                    ) : (
                      b.fullName?.charAt(0) || <User size={14} />
                    )}
                  </div>
                  <div className={cx("cardInfo")}>
                    <h4>{b.fullName || "Chưa có tên"}</h4>
                    <span>{b.branchName || "Chưa phân bổ"}</span>
                  </div>
                  {(b.status === "locked" || b.status === "LOCKED") && <Lock size={14} className={cx("lockIcon")} />}
                </div>
              ))
            )}
          </div>
        </div>

        {/* === MAIN CONTENT: HỒ SƠ CHI TIẾT === */}
        <div className={cx("profileArea")}>
          {!currentProfile ? (
            <div className={cx("placeholder")}>
              <User size={48} strokeWidth={1} />
              <p>Chọn một thợ cắt tóc để xem hồ sơ chi tiết</p>
            </div>
          ) : isLoadingDetail ? (
            <div className={cx("placeholder")}>
              <Loader2 size={40} className={cx("spinIcon")} strokeWidth={1.5} color="var(--gold)" />
              <p>Đang tải thông tin hồ sơ...</p>
            </div>
          ) : (
            <div className={cx("profileCard")}>
              {/* Header Hồ Sơ */}
              <div className={cx("profileHeader")}>
                <div className={cx("avatarLarge")}>
                  {currentProfile.image ? (
                    <img src={currentProfile.image} alt={currentProfile.fullName} className={cx("avatarImg")} />
                  ) : (
                    currentProfile.fullName?.charAt(0) || <User size={40} />
                  )}
                </div>
                <div className={cx("headerInfo")}>
                  <div className={cx("nameRow")}>
                    <h3>{currentProfile.fullName || "Chưa có tên"}</h3>
                    <span
                      className={cx("statusBadge", {
                        locked: currentProfile.status === "locked" || currentProfile.status === "LOCKED",
                      })}
                    >
                      {currentProfile.status === "locked" || currentProfile.status === "LOCKED"
                        ? "Đã khóa"
                        : "Đang làm việc"}
                    </span>
                  </div>
                  <div className={cx("statsRow")}>
                    <span className={cx("stat")}>
                      <Star size={16} className={cx("star")} fill="currentColor" /> {currentProfile.rating || "0.0"}{" "}
                      Đánh giá
                    </span>
                    <span className={cx("divider")}>•</span>
                    <span className={cx("stat")}>
                      <Users size={16} /> {currentProfile.customers || 0} Khách hàng
                    </span>
                  </div>
                </div>
              </div>

              {/* Thông tin chi tiết */}
              <div className={cx("profileDetails")}>
                <div className={cx("infoGroup")}>
                  <Mail size={18} className={cx("infoIcon")} />
                  <div>
                    <label>Email liên hệ</label>
                    <p>{currentProfile.email || "Chưa cập nhật"}</p>
                  </div>
                </div>
                <div className={cx("infoGroup")}>
                  <Phone size={18} className={cx("infoIcon")} />
                  <div>
                    <label>Số điện thoại</label>
                    <p>{currentProfile.phoneNumber || "Chưa cập nhật"}</p>
                  </div>
                </div>
                <div className={cx("infoGroup", "fullWidth")}>
                  <MapPin size={18} className={cx("infoIcon")} />
                  <div>
                    <label>Chi nhánh làm việc</label>
                    <p>{currentProfile.branchName || "Chưa phân bổ chi nhánh"}</p>
                  </div>
                </div>
                <div className={cx("infoGroup", "fullWidth")}>
                  <FileText size={18} className={cx("infoIcon")} />
                  <div>
                    <label>Mô tả kỹ năng / Hồ sơ</label>
                    <p className={cx("desc")}>
                      {currentProfile.profileDescription || "Thợ cắt tóc chưa cập nhật mô tả kỹ năng làm việc."}
                    </p>
                  </div>
                </div>
              </div>

              {/* Khu vực Nút Action cuối hồ sơ */}
              <div className={cx("profileActions")}>
                <button className={cx("actionBtn", "edit")} onClick={openEditModal}>
                  <Edit2 size={16} /> Chỉnh sửa thông tin
                </button>
                <button
                  className={cx("actionBtn", "branch")}
                  onClick={() => {
                    setNewBranchId(currentProfile.idBranch || "");
                    setShowChangeBranch(true);
                  }}
                >
                  <ArrowRightLeft size={16} /> Đổi chi nhánh
                </button>
                <button
                  className={cx(
                    "actionBtn",
                    currentProfile.status === "locked" || currentProfile.status === "LOCKED" ? "unlock" : "lock",
                  )}
                  onClick={() => handleToggleAccount(currentProfile)}
                >
                  {currentProfile.status === "locked" || currentProfile.status === "LOCKED" ? (
                    <>
                      <Unlock size={16} /> Mở khóa tài khoản
                    </>
                  ) : (
                    <>
                      <Lock size={16} /> Khóa tài khoản
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ================= MODAL THÊM THỢ ================= */}
      {showAddModal && (
        <div className={cx("modalOverlay")}>
          <div className={cx("modal")}>
            <h3>Thêm thợ cắt tóc mới</h3>
            <form onSubmit={handleAddSubmit}>
              <div className={cx("formGrid")}>
                <div className={cx("formGroup")}>
                  <label>Họ và tên</label>
                  <input type="text" name="fullName" value={formData.fullName} onChange={handleAddChange} required />
                </div>
                <div className={cx("formGroup")}>
                  <label>Số điện thoại</label>
                  <input
                    type="text"
                    name="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={handleAddChange}
                    required
                  />
                </div>
                <div className={cx("formGroup")}>
                  <label>Email</label>
                  <input type="email" name="email" value={formData.email} onChange={handleAddChange} required />
                </div>
                <div className={cx("formGroup")}>
                  <label>Mật khẩu</label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleAddChange}
                    required
                  />
                </div>
              </div>
              <div className={cx("formGroup")}>
                <label>Chi nhánh làm việc</label>
                <select name="idBranch" value={formData.idBranch} onChange={handleAddChange}>
                  <option value="">-- Không chọn --</option>
                  {branches.map((br) => (
                    <option key={br.idBranch} value={br.idBranch}>
                      {br.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className={cx("formGroup")}>
                <label>Mô tả hồ sơ</label>
                <textarea
                  name="profileDescription"
                  value={formData.profileDescription}
                  onChange={handleAddChange}
                  rows="3"
                />
              </div>
              <div className={cx("modalActions")}>
                <button type="button" className={cx("cancelBtn")} onClick={() => setShowAddModal(false)}>
                  Hủy
                </button>
                <button type="submit" className={cx("saveBtn")}>
                  Thêm thợ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL SỬA THỢ ================= */}
      {showEditModal && (
        <div className={cx("modalOverlay")}>
          <div className={cx("modal")}>
            <h3>Cập nhật hồ sơ thợ</h3>
            <form onSubmit={handleEditSubmit}>
              <div className={cx("formGroup")}>
                <label>Họ và tên</label>
                <input
                  type="text"
                  name="fullName"
                  value={editData.fullName}
                  onChange={(e) => setEditData({ ...editData, fullName: e.target.value })}
                  required
                />
              </div>
              <div className={cx("formGroup")}>
                <label>Email</label>
                <input
                  type="email"
                  name="email"
                  value={editData.email}
                  onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                  required
                />
              </div>
              <div className={cx("formGroup")}>
                <label>Số điện thoại</label>
                <input
                  type="text"
                  name="phoneNumber"
                  value={editData.phoneNumber}
                  onChange={(e) => setEditData({ ...editData, phoneNumber: e.target.value })}
                  required
                />
              </div>
              <div className={cx("formGroup")}>
                <label>Mô tả hồ sơ</label>
                <textarea
                  name="profileDescription"
                  value={editData.profileDescription}
                  onChange={(e) => setEditData({ ...editData, profileDescription: e.target.value })}
                  rows="3"
                />
              </div>
              <div className={cx("modalActions")}>
                <button type="button" className={cx("cancelBtn")} onClick={() => setShowEditModal(false)}>
                  Hủy
                </button>
                <button type="submit" className={cx("saveBtn")}>
                  Lưu thay đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL ĐỔI CHI NHÁNH ================= */}
      {showChangeBranch && (
        <div className={cx("modalOverlay")}>
          <div className={cx("modal", "smallModal")}>
            <h3>Đổi chi nhánh</h3>
            <p className={cx("subTitle")}>
              Chọn chi nhánh mới cho <strong>{currentProfile?.fullName}</strong>
            </p>
            <form onSubmit={handleChangeBranch}>
              <div className={cx("formGroup")}>
                <select value={newBranchId} onChange={(e) => setNewBranchId(e.target.value)} required>
                  <option value="">-- Chọn chi nhánh --</option>
                  {branches.map((br) => (
                    <option key={br.idBranch} value={br.idBranch}>
                      {br.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className={cx("modalActions")}>
                <button type="button" className={cx("cancelBtn")} onClick={() => setShowChangeBranch(false)}>
                  Hủy
                </button>
                <button type="submit" className={cx("saveBtn")}>
                  Cập nhật
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toasts */}
      <div className={cx("toastContainer")}>
        {toastList.map((t) => (
          <Toast
            key={t.id}
            type={t.type}
            text={t.text}
            duration={t.duration}
            onClose={() => setToastList((prev) => prev.filter((toast) => toast.id !== t.id))}
          />
        ))}
      </div>
    </div>
  );
}

export default ThoCatToc;
