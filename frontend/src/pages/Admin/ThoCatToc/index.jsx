import React, { useEffect, useState, useMemo, useCallback } from "react";
import classNames from "classnames/bind";
import styles from "./ThoCatToc.module.scss";

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

  // ================= STATE DỮ LIỆU =================
  const [barbers, setBarbers] = useState([]);
  const [branches, setBranches] = useState([]);

  const [loading, setLoading] = useState(true);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);

  // ================= SEARCH & FILTER =================
  const [searchQuery, setSearchQuery] = useState("");
  const [filterBranch, setFilterBranch] = useState("");

  // ================= UI =================
  const [selectedBarber, setSelectedBarber] = useState(null);
  const [barberDetail, setBarberDetail] = useState(null);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showChangeBranch, setShowChangeBranch] = useState(false);
  const [showLockModal, setShowLockModal] = useState(false);

  // ================= FORM =================
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

  // ================= LOAD BARBERS =================
  const fetchBarbers = useCallback(async () => {
    try {
      const barberList = await BarberAPI.getAll();

      setBarbers(barberList || []);

      // Nếu chưa chọn barber -> auto chọn barber đầu tiên
      if (!selectedBarber && barberList.length > 0) {
        setSelectedBarber(barberList[0]);
        return;
      }

      // Nếu đã chọn barber -> cập nhật lại barber mới nhất
      if (selectedBarber) {
        const updatedSelected = barberList.find((b) => b.idBarber === selectedBarber.idBarber);

        if (updatedSelected) {
          setSelectedBarber(updatedSelected);
        } else {
          // barber bị xóa
          setSelectedBarber(barberList[0] || null);
        }
      }
    } catch (error) {
      console.error("Lỗi khi tải danh sách barber:", error);

      showToast("error", error?.response?.data?.message || error?.message || "Không thể tải danh sách barber!");
    } finally {
      setLoading(false);
    }
  }, [selectedBarber]);

  // ================= LOAD BRANCHES =================
  const fetchBranches = async () => {
    try {
      const data = await BranchAPI.getAll();

      setBranches(data || []);
    } catch (error) {
      console.error("Lỗi khi tải danh sách chi nhánh:", error);
    }
  };

  // ================= LOAD CHI TIẾT BARBER =================
  const fetchBarberDetail = useCallback(async (idBarber) => {
    if (!idBarber) return;

    setIsLoadingDetail(true);

    try {
      const detail = await BarberAPI.getProfile(idBarber);

      setBarberDetail(detail);
    } catch (error) {
      console.error("Lỗi tải chi tiết thợ:", error);
    } finally {
      setIsLoadingDetail(false);
    }
  }, []);

  // ================= INIT =================
  useEffect(() => {
    const init = async () => {
      await Promise.all([fetchBarbers(), fetchBranches()]);
    };

    init();
  }, [fetchBarbers]);

  // ================= LOAD DETAIL KHI ĐỔI BARBER =================
  useEffect(() => {
    if (selectedBarber?.idBarber) {
      fetchBarberDetail(selectedBarber.idBarber);
    } else {
      setBarberDetail(null);
    }
  }, [selectedBarber?.idBarber, fetchBarberDetail]);

  // ================= PROFILE =================
  const currentProfile = useMemo(() => {
    if (!selectedBarber) return null;

    return {
      ...selectedBarber,
      ...barberDetail,
    };
  }, [selectedBarber, barberDetail]);

  // ================= FILTERED BARBERS =================
  const filteredBarbers = useMemo(() => {
    return barbers.filter((b) => {
      const matchName = b.fullName?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchBranch = filterBranch ? Number(b.idBranch) === Number(filterBranch) : true;

      return matchName && matchBranch;
    });
  }, [barbers, searchQuery, filterBranch]);

  // ================= LOCK / UNLOCK =================
  const handleToggleAccount = async (barber) => {
    const isLocked = barber.isLocked;

    const action = isLocked ? "mở" : "khóa";

    if (!window.confirm(`Xác nhận ${action} tài khoản của ${barber.fullName}?`)) {
      return;
    }

    try {
      if (isLocked) {
        await BarberAPI.unlock(barber.idBarber);

        showToast("success", "Tài khoản đã được mở khóa!");
      } else {
        await BarberAPI.lock(barber.idBarber);

        showToast("success", "Tài khoản đã bị khóa!");
      }

      await fetchBarbers();
      await fetchBarberDetail(barber.idBarber);
    } catch (error) {
      showToast("error", error?.response?.data?.message || `Không thể ${action} tài khoản!`);
    }
  };

  // ================= ADD =================
  const handleAddChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();

    try {
      await BarberAPI.createBarber(formData);

      showToast("success", "Thêm thợ cắt tóc thành công!");

      setShowAddModal(false);

      setFormData({
        email: "",
        password: "",
        fullName: "",
        phoneNumber: "",
        idBranch: "",
        profileDescription: "",
      });

      await fetchBarbers();
    } catch (error) {
      showToast("error", error?.response?.data?.message || "Không thể tạo thợ mới!");
    }
  };

  // ================= EDIT =================
  const openEditModal = () => {
    if (!currentProfile) return;

    setEditData({
      fullName: currentProfile.fullName || "",
      phoneNumber: currentProfile.phoneNumber || "",
      email: currentProfile.email || "",
      idBranch: currentProfile.idBranch || "",
      profileDescription: currentProfile.profileDescription?.trim() || "",
    });

    setShowEditModal(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();

    try {
      await BarberAPI.updateBarber(selectedBarber.idBarber, editData);

      showToast("success", "Cập nhật thông tin thợ thành công!");

      setShowEditModal(false);

      await fetchBarbers();
      await fetchBarberDetail(selectedBarber.idBarber);
    } catch (error) {
      showToast("error", error?.response?.data?.message || "Không thể cập nhật!");
    }
  };

  // ================= CHANGE BRANCH =================
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
        await fetchBarberDetail(selectedBarber.idBarber);
      } else {
        showToast("error", res.message);
      }
    } catch (error) {
      showToast("error", error?.message || "Không thể đổi chi nhánh!");
    }
  };

  // ================= CANCEL LOCK DATE =================
  const handleCancelLockDate = async () => {
    if (!window.confirm(`Hủy lịch khóa của ${currentProfile?.fullName}?`)) {
      return;
    }

    try {
      const res = await BarberAPI.cancelLockDate(currentProfile.idBarber);

      if (res?.success) {
        showToast("success", res.message);

        await fetchBarbers();
        await fetchBarberDetail(currentProfile.idBarber);
      }
    } catch (err) {
      showToast("error", err?.message || "Không thể hủy lịch khóa!");
    }
  };

  // ================= FORMAT DATE =================
  const formatDate = (d) => {
    if (!d) return "";

    return new Date(d).toLocaleDateString("vi-VN");
  };

  // ================= LOADING =================
  if (loading) {
    return <div className={cx("loading")}>Đang tải dữ liệu...</div>;
  }

  return (
    <div className={cx("container")}>
      {/* ================= HEADER ================= */}
      <div className={cx("headerArea")}>
        <div className={cx("titleBox")}>
          <Scissors size={28} strokeWidth={1.5} className={cx("titleIcon")} />

          <h2>Quản lý Thợ Cắt Tóc</h2>
        </div>

        <button className={cx("addBtn")} onClick={() => setShowAddModal(true)}>
          <Plus size={18} strokeWidth={2} />
          Thêm thợ mới
        </button>
      </div>

      {/* ================= MAIN ================= */}
      <div className={cx("mainLayout")}>
        {/* ================= SIDEBAR ================= */}
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

                  {b.isLocked && <Lock size={14} className={cx("lockIcon")} />}
                </div>
              ))
            )}
          </div>
        </div>

        {/* ================= PROFILE ================= */}
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
                        locked: currentProfile.isLocked,
                        scheduled: !currentProfile.isLocked && currentProfile.lockDate,
                      })}
                    >
                      {currentProfile.isLocked
                        ? "Đã khóa"
                        : currentProfile.lockDate
                          ? `Sẽ khóa vào ${formatDate(currentProfile.lockDate)}`
                          : "Đang làm việc"}
                    </span>
                  </div>

                  <div className={cx("statsRow")}>
                    <span className={cx("stat")}>
                      <Star size={16} className={cx("star")} fill="currentColor" />
                      {currentProfile.rating || "0.0"}
                      Đánh giá
                    </span>

                    <span className={cx("divider")}>•</span>

                    <span className={cx("stat")}>
                      <Users size={16} />
                      {currentProfile.customers || 0}
                      Khách hàng
                    </span>
                  </div>
                </div>
              </div>

              {/* ================= INFO ================= */}
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

              {/* ================= ACTION ================= */}
              <div className={cx("profileActions")}>
                <button className={cx("actionBtn", "edit")} onClick={openEditModal}>
                  <Edit2 size={16} />
                  Chỉnh sửa thông tin
                </button>

                <button
                  className={cx("actionBtn", "branch")}
                  onClick={() => {
                    setNewBranchId(currentProfile.idBranch || "");

                    setShowChangeBranch(true);
                  }}
                >
                  <ArrowRightLeft size={16} />
                  Đổi chi nhánh
                </button>

                {!currentProfile.isLocked && (
                  <button className={cx("actionBtn", "lock")} onClick={() => setShowLockModal(true)}>
                    <Lock size={16} />

                    {currentProfile.lockDate
                      ? `Tài khoản sẽ bị khóa vào ${formatDate(currentProfile.lockDate)}`
                      : "Lên lịch khóa"}
                  </button>
                )}

                {!currentProfile.isLocked && currentProfile.lockDate && (
                  <button className={cx("actionBtn", "branch")} onClick={handleCancelLockDate}>
                    <X size={16} />
                    Hủy lịch khóa
                  </button>
                )}

                {currentProfile.isLocked && (
                  <button className={cx("actionBtn", "unlock")} onClick={() => handleToggleAccount(currentProfile)}>
                    <Unlock size={16} />
                    Mở khóa tài khoản
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ================= MODAL LOCK DATE ================= */}
      {showLockModal && currentProfile && (
        <LockDateModal
          barber={currentProfile}
          onClose={() => setShowLockModal(false)}
          onSuccess={async () => {
            await fetchBarbers();

            await fetchBarberDetail(currentProfile.idBarber);

            setShowLockModal(false);
          }}
          showToast={showToast}
        />
      )}

      {/* ================= TOAST ================= */}
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
