import React, { useEffect, useState, useMemo } from "react";
import classNames from "classnames/bind";
import styles from "../ThoCatToc.module.scss";
import Toast from "~/components/Toast";
import LockDateModal from "~/components/LockBarberModal";
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
  Loader2,
  X,
  Award,
  Sparkles,
  BookOpen,
  Heart,
  Clock,
  CalendarOff,
} from "lucide-react";

import { BarberAPI } from "~/apis/barberAPI";
import { BranchAPI } from "~/apis/branchAPI";

const cx = classNames.bind(styles);

// ── State khởi tạo ────────────────────────────────────────────────────────────
const EMPTY_FORM = {
  email: "",
  password: "",
  fullName: "",
  phoneNumber: "",
  idBranch: "",
  profileDescription: "",
  experienceYears: "",
  specialty: "",
  style: "",
  certificates: "",
  philosophy: "",
};

function BarberTab() {
  const [toastList, setToastList] = useState([]);

  const showToast = (type, text, duration = 3000) => {
    const id = Date.now();
    setToastList((prev) => [...prev, { id, type, text, duration }]);
  };

  const [barbers, setBarbers] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState("");
  const [filterBranch, setFilterBranch] = useState("");

  const [selectedBarber, setSelectedBarber] = useState(null);
  const [barberDetail, setBarberDetail] = useState(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showChangeBranch, setShowChangeBranch] = useState(false);
  const [showLockModal, setShowLockModal] = useState(false);

  const [formData, setFormData] = useState({ ...EMPTY_FORM });

  const [editData, setEditData] = useState({ ...EMPTY_FORM });

  const [newBranchId, setNewBranchId] = useState("");

  // ── Fetch ────────────────────────────────────────────────────────────────────
  const fetchBarbers = async () => {
    try {
      const barberList = await BarberAPI.getAll();
      setBarbers(barberList || []);

      if (barberList.length > 0 && !selectedBarber) {
        setSelectedBarber(barberList[0]);
      } else if (selectedBarber) {
        const updated = barberList.find((b) => b.idBarber === selectedBarber.idBarber);
        if (updated) setSelectedBarber(updated);
      }
    } catch (error) {
      showToast("error", error?.message || "Không thể tải danh sách barber!");
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

  useEffect(() => {
    const fetchBarberDetail = async () => {
      if (!selectedBarber?.idBarber) return;
      setIsLoadingDetail(true);
      try {
        const detail = await BarberAPI.getProfile(selectedBarber.idBarber);
        setBarberDetail(detail);
      } catch (error) {
        console.error("Lỗi tải chi tiết thợ:", error);
      } finally {
        setIsLoadingDetail(false);
      }
    };
    fetchBarberDetail();
  }, [selectedBarber?.idBarber]);

  const currentProfile = selectedBarber ? { ...selectedBarber, ...barberDetail } : null;

  const filteredBarbers = useMemo(() => {
    return barbers.filter((b) => {
      const matchName = b.fullName?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchBranch = filterBranch ? Number(b.idBranch) === Number(filterBranch) : true;
      return matchName && matchBranch;
    });
  }, [barbers, searchQuery, filterBranch]);

  // ── Actions ──────────────────────────────────────────────────────────────────
  const handleToggleAccount = async (barber) => {
    const isLocked = barber.isLocked;
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

  const handleAddChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
  const handleEditChange = (e) => setEditData({ ...editData, [e.target.name]: e.target.value });

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    try {
      await BarberAPI.createBarber({
        ...formData,
        experienceYears: formData.experienceYears !== "" ? Number(formData.experienceYears) : undefined,
      });
      showToast("success", "Thêm thợ cắt tóc thành công!");
      setShowAddModal(false);
      setFormData({ ...EMPTY_FORM });
      await fetchBarbers();
    } catch (error) {
      showToast("error", error?.response?.data?.message || error?.message || "Không thể tạo thợ mới!");
    }
  };

  const openEditModal = () => {
    if (!currentProfile) return;
    setEditData({
      fullName: currentProfile.fullName || "",
      phoneNumber: currentProfile.phoneNumber || "",
      email: currentProfile.email || "",
      password: "",
      idBranch: currentProfile.idBranch || "",
      profileDescription: currentProfile.profileDescription?.trim() || "",
      experienceYears: currentProfile.experienceYears ?? "",
      specialty: currentProfile.specialty || "",
      style: currentProfile.style || "",
      certificates: currentProfile.certificates || "",
      philosophy: currentProfile.philosophy || "",
    });
    setShowEditModal(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...editData,
        experienceYears: editData.experienceYears !== "" ? Number(editData.experienceYears) : undefined,
      };
      // Không gửi password nếu để trống (không đổi mật khẩu)
      if (!payload.password) delete payload.password;
      await BarberAPI.updateBarber(selectedBarber.idBarber, payload);
      showToast("success", "Cập nhật thông tin thợ thành công!");
      setShowEditModal(false);
      await fetchBarbers();
      const updatedDetail = await BarberAPI.getProfile(selectedBarber.idBarber);
      setBarberDetail(updatedDetail);
    } catch (error) {
      showToast("error", error?.response?.data?.message || "Không thể cập nhật!");
    }
  };

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

  const handleCancelLockDate = async () => {
    if (!window.confirm(`Hủy lịch khóa của ${currentProfile?.fullName}?`)) return;
    try {
      const res = await BarberAPI.cancelLockDate(currentProfile.idBarber);
      if (res?.success) {
        showToast("success", res.message);
        await fetchBarbers();
        const updatedDetail = await BarberAPI.getProfile(currentProfile.idBarber);
        setBarberDetail(updatedDetail);
      }
    } catch (err) {
      showToast("error", err?.message || "Không thể hủy lịch khóa!");
    }
  };

  const formatDate = (d) => {
    if (!d) return "";
    return new Date(d).toLocaleDateString("vi-VN");
  };

  const getStatusBadgeClass = () => {
    if (currentProfile?.isLocked) return "locked";
    if (currentProfile?.lockDate) return "scheduled";
    return "";
  };

  const getStatusLabel = () => {
    if (currentProfile?.isLocked) return "Đã khóa";
    if (currentProfile?.lockDate) return `Khóa lúc ${formatDate(currentProfile.lockDate)}`;
    return "Đang làm việc";
  };

  if (loading) return <div className={cx("loading")}>Đang tải dữ liệu...</div>;

  return (
    <div className={cx("container")}>
      {/* ── HEADER ──────────────────────────────────────────────────────────── */}
      <div className={cx("headerArea")}>
        <div className={cx("titleBox")}>
          <Scissors size={26} strokeWidth={1.5} className={cx("titleIcon")} />
          <div>
            <h2>
              Quản lý <em>Thợ Cắt Tóc</em>
            </h2>
            <p className={cx("titleMeta")}>{barbers.length} thợ trong hệ thống</p>
          </div>
        </div>
        <button
          className={cx("addBtn")}
          onClick={() => {
            setFormData({ ...EMPTY_FORM });
            setShowAddModal(true);
          }}
        >
          <Plus size={16} strokeWidth={2.5} />
          Thêm thợ mới
        </button>
      </div>

      {/* ── MAIN LAYOUT ─────────────────────────────────────────────────────── */}
      <div className={cx("mainLayout")}>
        {/* ── SIDEBAR ─────────────────────────────────────────────────── */}
        <div className={cx("sidebar")}>
          <div className={cx("filterBox")}>
            <div className={cx("searchWrapper")}>
              <Search size={15} className={cx("icon")} />
              <input
                type="text"
                placeholder="Tìm tên thợ..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className={cx("filterWrapper")}>
              <Filter size={15} className={cx("icon")} />
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
                    locked: b.isLocked,
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
                  {b.isLocked && <Lock size={13} className={cx("lockIcon")} />}
                </div>
              ))
            )}
          </div>
        </div>

        {/* ── PROFILE AREA ────────────────────────────────────────── */}
        <div className={cx("profileArea")}>
          {!currentProfile ? (
            <div className={cx("placeholder")}>
              <User size={56} strokeWidth={1} />
              <p>Chọn một thợ cắt tóc để xem hồ sơ chi tiết</p>
            </div>
          ) : isLoadingDetail ? (
            <div className={cx("placeholder")}>
              <Loader2 size={40} className={cx("spinIcon")} strokeWidth={1.5} color="#C9A84C" />
              <p>Đang tải hồ sơ...</p>
            </div>
          ) : (
            <div className={cx("profileCard")}>
              {/* Header */}
              <div className={cx("profileHeader")}>
                <div className={cx("avatarLarge")}>
                  {currentProfile.image ? (
                    <img src={currentProfile.image} alt={currentProfile.fullName} className={cx("avatarImg")} />
                  ) : (
                    currentProfile.fullName?.charAt(0) || <User size={36} />
                  )}
                </div>
                <div className={cx("headerInfo")}>
                  <div className={cx("nameRow")}>
                    <h3>{currentProfile.fullName || "Chưa có tên"}</h3>
                    <span className={cx("statusBadge", getStatusBadgeClass())}>{getStatusLabel()}</span>
                  </div>
                  <div className={cx("statsRow")}>
                    <span className={cx("stat")}>
                      <Star size={14} className={cx("star")} fill="currentColor" />
                      {currentProfile.rating || currentProfile.avgRate || "0.0"}
                    </span>
                    <span className={cx("divider")}>·</span>
                    <span className={cx("stat")}>
                      <Users size={14} />
                      {currentProfile.customers || 0} khách
                    </span>
                    {currentProfile.experienceYears > 0 && (
                      <>
                        <span className={cx("divider")}>·</span>
                        <span className={cx("stat")}>
                          <Clock size={14} />
                          {currentProfile.experienceYears} năm kinh nghiệm
                        </span>
                      </>
                    )}
                    {currentProfile.branchName && (
                      <>
                        <span className={cx("divider")}>·</span>
                        <span className={cx("stat")}>
                          <MapPin size={14} />
                          {currentProfile.branchName}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Details */}
              <div className={cx("profileDetails")}>
                <div className={cx("infoGroup")}>
                  <Mail size={16} className={cx("infoIcon")} />
                  <div>
                    <label>Email liên hệ</label>
                    <p className={!currentProfile.email ? "empty" : ""}>{currentProfile.email || "Chưa cập nhật"}</p>
                  </div>
                </div>
                <div className={cx("infoGroup")}>
                  <Phone size={16} className={cx("infoIcon")} />
                  <div>
                    <label>Số điện thoại</label>
                    <p className={!currentProfile.phoneNumber ? "empty" : ""}>
                      {currentProfile.phoneNumber || "Chưa cập nhật"}
                    </p>
                  </div>
                </div>
                <div className={cx("infoGroup")}>
                  <Award size={16} className={cx("infoIcon")} />
                  <div>
                    <label>Chuyên môn</label>
                    <p className={cx(!currentProfile.specialty ? "empty" : "")}>
                      {currentProfile.specialty || "Chưa cập nhật"}
                    </p>
                  </div>
                </div>
                <div className={cx("infoGroup")}>
                  <Sparkles size={16} className={cx("infoIcon")} />
                  <div>
                    <label>Phong cách</label>
                    <p className={cx(!currentProfile.style ? "empty" : "")}>
                      {currentProfile.style || "Chưa cập nhật"}
                    </p>
                  </div>
                </div>
                <div className={cx("infoGroup", "fullWidth")}>
                  <BookOpen size={16} className={cx("infoIcon")} />
                  <div>
                    <label>Chứng chỉ / Bằng cấp</label>
                    <p className={cx("desc", !currentProfile.certificates ? "empty" : "")}>
                      {currentProfile.certificates || "Chưa cập nhật"}
                    </p>
                  </div>
                </div>
                <div className={cx("infoGroup", "fullWidth")}>
                  <Heart size={16} className={cx("infoIcon")} />
                  <div>
                    <label>Triết lý nghề nghiệp</label>
                    <p className={cx("desc", !currentProfile.philosophy ? "empty" : "")}>
                      {currentProfile.philosophy || "Chưa cập nhật"}
                    </p>
                  </div>
                </div>
                <div className={cx("infoGroup", "fullWidth")}>
                  <FileText size={16} className={cx("infoIcon")} />
                  <div>
                    <label>Mô tả kỹ năng / Hồ sơ</label>
                    <p className={cx("desc", !currentProfile.profileDescription ? "empty" : "")}>
                      {currentProfile.profileDescription || "Thợ cắt tóc chưa cập nhật mô tả kỹ năng làm việc."}
                    </p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className={cx("profileActions")}>
                <button className={cx("actionBtn", "edit")} onClick={openEditModal}>
                  <Edit2 size={14} /> Chỉnh sửa
                </button>
                <button
                  className={cx("actionBtn", "branch")}
                  onClick={() => {
                    setNewBranchId(currentProfile.idBranch || "");
                    setShowChangeBranch(true);
                  }}
                >
                  <ArrowRightLeft size={14} /> Đổi chi nhánh
                </button>
                {!currentProfile.isLocked && currentProfile?.lockDate && (
                  <button className={cx("actionBtn", "cancel")} onClick={handleCancelLockDate}>
                    <CalendarOff size={14} /> Hủy lịch khóa
                  </button>
                )}
                {!currentProfile.isLocked && (
                  <button className={cx("actionBtn", "lock")} onClick={() => setShowLockModal(true)}>
                    <Lock size={14} />
                    {currentProfile?.lockDate ? `Sẽ khóa ${formatDate(currentProfile.lockDate)}` : "Lên lịch khóa"}
                  </button>
                )}
                {currentProfile.isLocked && (
                  <button className={cx("actionBtn", "unlock")} onClick={() => handleToggleAccount(currentProfile)}>
                    <Unlock size={14} /> Mở khóa tài khoản
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════
          MODAL THÊM THỢ MỚI — đầy đủ tất cả fields
      ══════════════════════════════════════════════════════════════ */}
      {showAddModal && (
        <div className={cx("modalOverlay")}>
          <div className={cx("modal")}>
            <h3>Thêm thợ cắt tóc mới</h3>
            <div className={cx("modalBody")}>
              <form id="add-form" onSubmit={handleAddSubmit}>
                {/* Thông tin tài khoản */}
                <div className={cx("modalSection")}>
                  <p className={cx("sectionLabel")}>Thông tin tài khoản</p>
                  <div className={cx("formGrid")}>
                    <div className={cx("formGroup")}>
                      <label>Họ và tên *</label>
                      <input
                        type="text"
                        name="fullName"
                        value={formData.fullName}
                        onChange={handleAddChange}
                        placeholder="Nguyễn Văn A"
                        required
                      />
                    </div>
                    <div className={cx("formGroup")}>
                      <label>Số điện thoại *</label>
                      <input
                        type="text"
                        name="phoneNumber"
                        value={formData.phoneNumber}
                        onChange={handleAddChange}
                        placeholder="09xxxxxxxxx"
                        required
                      />
                    </div>
                    <div className={cx("formGroup")}>
                      <label>Email *</label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleAddChange}
                        placeholder="tho@barber.com"
                        required
                      />
                    </div>
                    <div className={cx("formGroup")}>
                      <label>Mật khẩu *</label>
                      <input
                        type="password"
                        name="password"
                        value={formData.password}
                        onChange={handleAddChange}
                        placeholder="Nhập mật khẩu..."
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Phân công & Kinh nghiệm */}
                <div className={cx("modalSection")}>
                  <p className={cx("sectionLabel")}>Phân công & Kinh nghiệm</p>
                  <div className={cx("formGrid")}>
                    <div className={cx("formGroup")}>
                      <label>Chi nhánh làm việc</label>
                      <select name="idBranch" value={formData.idBranch} onChange={handleAddChange}>
                        <option value="">-- Chưa phân công --</option>
                        {branches.map((br) => (
                          <option key={br.idBranch} value={br.idBranch}>
                            {br.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className={cx("formGroup")}>
                      <label>Số năm kinh nghiệm</label>
                      <input
                        type="number"
                        name="experienceYears"
                        min="0"
                        max="50"
                        value={formData.experienceYears}
                        onChange={handleAddChange}
                        placeholder="VD: 3"
                      />
                    </div>
                  </div>
                </div>

                {/* Chuyên môn & Phong cách */}
                <div className={cx("modalSection")}>
                  <p className={cx("sectionLabel")}>Chuyên môn & Phong cách</p>
                  <div className={cx("formGrid")}>
                    <div className={cx("formGroup")}>
                      <label>Chuyên môn</label>
                      <input
                        type="text"
                        name="specialty"
                        value={formData.specialty}
                        onChange={handleAddChange}
                        placeholder="VD: Cắt undercut, fade..."
                      />
                    </div>
                    <div className={cx("formGroup")}>
                      <label>Phong cách</label>
                      <input
                        type="text"
                        name="style"
                        value={formData.style}
                        onChange={handleAddChange}
                        placeholder="VD: Classic, Modern, Korean..."
                      />
                    </div>
                  </div>
                </div>

                {/* Chi tiết hồ sơ */}
                <div className={cx("modalSection")}>
                  <p className={cx("sectionLabel")}>Chi tiết hồ sơ</p>
                  <div className={cx("formGrid", "singleCol")}>
                    <div className={cx("formGroup")}>
                      <label>Chứng chỉ / Bằng cấp</label>
                      <textarea
                        name="certificates"
                        value={formData.certificates}
                        onChange={handleAddChange}
                        rows="3"
                        placeholder="VD: Chứng chỉ nghề Hàn Quốc, Bằng kỹ thuật viên tóc..."
                      />
                    </div>
                    <div className={cx("formGroup")}>
                      <label>Triết lý nghề nghiệp</label>
                      <textarea
                        name="philosophy"
                        value={formData.philosophy}
                        onChange={handleAddChange}
                        rows="3"
                        placeholder="VD: Mỗi mái tóc là một tác phẩm nghệ thuật..."
                      />
                    </div>
                    <div className={cx("formGroup")}>
                      <label>Mô tả kỹ năng / Hồ sơ tổng quát</label>
                      <textarea
                        name="profileDescription"
                        value={formData.profileDescription}
                        onChange={handleAddChange}
                        rows="4"
                        placeholder="Mô tả chung về kỹ năng, kinh nghiệm làm việc..."
                      />
                    </div>
                  </div>
                </div>
              </form>
            </div>
            <div className={cx("modalActions")}>
              <button
                type="button"
                className={cx("cancelBtn")}
                onClick={() => {
                  setShowAddModal(false);
                  setFormData({ ...EMPTY_FORM });
                }}
              >
                <X size={14} /> Hủy
              </button>
              <button type="submit" form="add-form" className={cx("saveBtn")}>
                <Plus size={14} /> Thêm thợ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          MODAL SỬA HỒ SƠ THỢ
      ══════════════════════════════════════════════════════════════ */}
      {showEditModal && (
        <div className={cx("modalOverlay")}>
          <div className={cx("modal")}>
            <h3>Cập nhật hồ sơ thợ</h3>
            <div className={cx("modalBody")}>
              <form id="edit-form" onSubmit={handleEditSubmit}>
                <div className={cx("modalSection")}>
                  <p className={cx("sectionLabel")}>Thông tin cơ bản</p>
                  <div className={cx("formGrid")}>
                    <div className={cx("formGroup")}>
                      <label>Họ và tên *</label>
                      <input
                        type="text"
                        name="fullName"
                        value={editData.fullName}
                        onChange={handleEditChange}
                        placeholder="Nguyễn Văn A"
                        required
                      />
                    </div>
                    <div className={cx("formGroup")}>
                      <label>Số điện thoại</label>
                      <input
                        type="text"
                        name="phoneNumber"
                        value={editData.phoneNumber}
                        onChange={handleEditChange}
                        placeholder="09xxxxxxxxx"
                      />
                    </div>
                    <div className={cx("formGroup")}>
                      <label>Email</label>
                      <input
                        type="email"
                        name="email"
                        value={editData.email}
                        onChange={handleEditChange}
                        placeholder="tho@barber.com"
                      />
                    </div>
                    <div className={cx("formGroup")}>
                      <label>Mật khẩu mới</label>
                      <input
                        type="password"
                        name="password"
                        value={editData.password}
                        onChange={handleEditChange}
                        placeholder="Để trống nếu không đổi"
                      />
                    </div>
                    <div className={cx("formGroup")}>
                      <label>Số năm kinh nghiệm</label>
                      <input
                        type="number"
                        name="experienceYears"
                        min="0"
                        max="50"
                        value={editData.experienceYears}
                        onChange={handleEditChange}
                        placeholder="VD: 5"
                      />
                    </div>
                  </div>
                </div>
                <div className={cx("modalSection")}>
                  <p className={cx("sectionLabel")}>Chuyên môn & Phong cách</p>
                  <div className={cx("formGrid")}>
                    <div className={cx("formGroup")}>
                      <label>Chuyên môn</label>
                      <input
                        type="text"
                        name="specialty"
                        value={editData.specialty}
                        onChange={handleEditChange}
                        placeholder="VD: Cắt undercut, fade..."
                      />
                    </div>
                    <div className={cx("formGroup")}>
                      <label>Phong cách</label>
                      <input
                        type="text"
                        name="style"
                        value={editData.style}
                        onChange={handleEditChange}
                        placeholder="VD: Classic, Modern, Korean..."
                      />
                    </div>
                  </div>
                </div>
                <div className={cx("modalSection")}>
                  <p className={cx("sectionLabel")}>Chi tiết hồ sơ</p>
                  <div className={cx("formGrid", "singleCol")}>
                    <div className={cx("formGroup")}>
                      <label>Chứng chỉ / Bằng cấp</label>
                      <textarea
                        name="certificates"
                        value={editData.certificates}
                        onChange={handleEditChange}
                        rows="3"
                        placeholder="VD: Chứng chỉ nghề Hàn Quốc..."
                      />
                    </div>
                    <div className={cx("formGroup")}>
                      <label>Triết lý nghề nghiệp</label>
                      <textarea
                        name="philosophy"
                        value={editData.philosophy}
                        onChange={handleEditChange}
                        rows="3"
                        placeholder="VD: Mỗi mái tóc là một tác phẩm..."
                      />
                    </div>
                    <div className={cx("formGroup")}>
                      <label>Mô tả kỹ năng / Hồ sơ tổng quát</label>
                      <textarea
                        name="profileDescription"
                        value={editData.profileDescription}
                        onChange={handleEditChange}
                        rows="4"
                        placeholder="Mô tả chung về kỹ năng..."
                      />
                    </div>
                  </div>
                </div>
              </form>
            </div>
            <div className={cx("modalActions")}>
              <button type="button" className={cx("cancelBtn")} onClick={() => setShowEditModal(false)}>
                <X size={14} /> Hủy
              </button>
              <button type="submit" form="edit-form" className={cx("saveBtn")}>
                <Edit2 size={14} /> Lưu thay đổi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          MODAL ĐỔI CHI NHÁNH
      ══════════════════════════════════════════════════════════════ */}
      {showChangeBranch && (
        <div className={cx("modalOverlay")}>
          <div className={cx("modal", "smallModal")}>
            <h3>Đổi chi nhánh</h3>
            <div className={cx("modalBody")}>
              <p className={cx("subTitle")}>
                Chọn chi nhánh mới cho <strong>{currentProfile?.fullName}</strong>
              </p>
              <form id="branch-form" onSubmit={handleChangeBranch}>
                <div className={cx("formGroup")}>
                  <label>Chi nhánh *</label>
                  <select value={newBranchId} onChange={(e) => setNewBranchId(e.target.value)} required>
                    <option value="">-- Chọn chi nhánh --</option>
                    {branches.map((br) => (
                      <option key={br.idBranch} value={br.idBranch}>
                        {br.name}
                      </option>
                    ))}
                  </select>
                </div>
              </form>
            </div>
            <div className={cx("modalActions")}>
              <button type="button" className={cx("cancelBtn")} onClick={() => setShowChangeBranch(false)}>
                <X size={14} /> Hủy
              </button>
              <button type="submit" form="branch-form" className={cx("saveBtn")}>
                <ArrowRightLeft size={14} /> Cập nhật
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          MODAL LOCK DATE
      ══════════════════════════════════════════════════════════════ */}
      {showLockModal && currentProfile && (
        <LockDateModal
          barber={currentProfile}
          onClose={() => setShowLockModal(false)}
          onSuccess={async () => {
            await fetchBarbers();
            const updatedDetail = await BarberAPI.getProfile(selectedBarber.idBarber);
            setBarberDetail(updatedDetail);
            const updatedList = await BarberAPI.getAll();
            const updatedSel = updatedList.find((b) => b.idBarber === selectedBarber.idBarber);
            if (updatedSel) setSelectedBarber(updatedSel);
            setShowLockModal(false);
          }}
          showToast={showToast}
        />
      )}

      {/* ── Toasts ─────────────────────────────────────────────────────────── */}
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

export default BarberTab;
