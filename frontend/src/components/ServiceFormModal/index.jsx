import React, { useState, useEffect } from "react";
import classNames from "classnames/bind";
import styles from "./ServiceFormModal.module.scss";
import { X, ToggleLeft, ToggleRight, UploadCloud, ImageIcon } from "lucide-react";
import ServiceAPI from "~/apis/serviceAPI";
import Toast from "~/components/Toast";

const cx = classNames.bind(styles);

export default function ServiceFormModal({ show, onClose, serviceId, branches, onUpdated }) {
  const [form, setForm] = useState({
    name: "",
    description: "",
    price: "",
    duration: "",
    status: "Active",
    imageFile: null,
    branches: [],
  });

  const [serviceDetail, setServiceDetail] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [showConfirmClose, setShowConfirmClose] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    if (!show) return;

    if (!serviceId) {
      // Tạo mới
      setForm({
        name: "",
        description: "",
        price: "",
        duration: "",
        status: "Active",
        imageFile: null,
        branches: [],
      });
      setEditMode(true);
      setServiceDetail(null);
      setLoadingDetail(false);
      return;
    }

    // Xem chi tiết service
    const loadDetail = async () => {
      setLoadingDetail(true);
      try {
        const data = await ServiceAPI.getById(serviceId);
        setServiceDetail(data);
        setForm({
          name: data.name,
          description: data.description,
          price: data.price,
          duration: data.duration,
          status: data.status,
          imageFile: null,
          branches: data.branches?.map((b) => b.idBranch) || [],
        });
        setEditMode(false); // mặc định không edit nếu đang Active
      } catch (error) {
        setToast({ type: "error", text: "Lỗi tải dữ liệu dịch vụ", duration: 3000 });
      }
      setLoadingDetail(false);
    };

    loadDetail();
  }, [show, serviceId]);

  if (!show) return null;

  if (loadingDetail)
    return (
      <div className={cx("overlay")}>
        <div className={cx("modal", "loadingModal")}>
          <div className={cx("spinner")}></div>
          <p>Đang tải dữ liệu...</p>
        </div>
      </div>
    );

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleClose = () => {
    if (editMode) setShowConfirmClose(true);
    else onClose();
  };

  const toggleBranch = (id) => {
    if (!editMode) return;
    setForm((prev) => ({
      ...prev,
      branches: prev.branches.includes(id)
        ? prev.branches.filter((x) => x !== id)
        : [...prev.branches, id],
    }));
  };

  // 🔹 Khi nhấn nút Chỉnh sửa
  const handleEditClick = async () => {
    if (!serviceDetail) return;

    if (serviceDetail.status === "Active") {
      try {
        const res = await ServiceAPI.checkAndHide(serviceDetail.idService);
        if (!res.statusUpdated) {
          setToast({ type: "error", text: res.message, duration: 3000 });
          return;
        }

        setForm((prev) => ({ ...prev, status: "Inactive" }));
        setEditMode(true);
        setToast({ type: "success", text: res.message, duration: 3000 });
      } catch (error) {
        setToast({
          type: "error",
          text: error.response?.data?.message || "Lỗi khi kiểm tra dịch vụ",
          duration: 3000,
        });
      }
    } else {
      // nếu đã Inactive thì bật edit trực tiếp
      setEditMode(true);
    }
  };

  const handleSubmit = async () => {
    // Validate
    if (!form.name.trim()) {
      setToast({ type: "error", text: "Tên dịch vụ không được để trống", duration: 3000 });
      return;
    }

    const numericPrice = parseFloat(form.price);
    if (isNaN(numericPrice) || numericPrice <= 0) {
      setToast({ type: "error", text: "Giá phải là số lớn hơn 0", duration: 3000 });
      return;
    }
    if (numericPrice > 99999999.99) {
      setToast({ type: "error", text: "Giá dịch vụ quá lớn, tối đa 99,999,999.99", duration: 3000 });
      return;
    }

    const numericDuration = parseInt(form.duration);
    if (isNaN(numericDuration) || numericDuration <= 0) {
      setToast({ type: "error", text: "Thời lượng phải là số nguyên lớn hơn 0", duration: 3000 });
      return;
    }

    try {
      const formData = new FormData();
      formData.append("name", form.name);
      formData.append("description", form.description);
      formData.append("price", numericPrice);
      formData.append("duration", numericDuration);
      formData.append("status", form.status);
      formData.append("branches", JSON.stringify(form.branches));
      if (form.imageFile) formData.append("image", form.imageFile);

      let res;
      if (!serviceId) {
        res = await ServiceAPI.create(formData);
      } else {
        res = await ServiceAPI.update(serviceDetail.idService, formData);
      }

      setToast({ type: "success", text: res.data?.message || "Thành công!", duration: 3000 });

      setTimeout(() => {
        onUpdated();
        onClose();
      }, 900);
    } catch (error) {
      setToast({
        type: "error",
        text: error.response?.data?.message || "Lỗi khi lưu dữ liệu!",
        duration: 3000,
      });
    }
  };

  return (
    <>
      <div className={cx("overlay")}>
        <div className={cx("modal")}>
          {/* HEADER */}
          <div className={cx("header")}>
            <h3>{serviceId ? "Chi tiết dịch vụ" : "Thêm dịch vụ mới"}</h3>
            <button className={cx("closeBtn")} onClick={handleClose}>
              <X size={24} strokeWidth={1.5} />
            </button>
          </div>

          {/* BODY */}
          <div className={cx("body")}>
            <div className={cx("leftImage")}>
              <div className={cx("imagePreview")}>
                {form.imageFile || serviceDetail?.image ? (
                  <img
                    src={
                      form.imageFile
                        ? URL.createObjectURL(form.imageFile)
                        : serviceDetail?.image
                    }
                    alt="service preview"
                  />
                ) : (
                  <div className={cx("noImage")}>
                    <ImageIcon size={48} strokeWidth={1} />
                    <span>Chưa có ảnh</span>
                  </div>
                )}
              </div>
              <label className={cx("fileButton", { disabled: !editMode })}>
                <UploadCloud size={18} /> Chọn ảnh tải lên
                <input
                  type="file"
                  hidden
                  disabled={!editMode}
                  accept="image/*"
                  onChange={(e) => setForm({ ...form, imageFile: e.target.files[0] })}
                />
              </label>
            </div>

            <div className={cx("rightInfo")}>
              <div className={cx("formGroup")}>
                <label>Tên dịch vụ</label>
                <input
                  disabled={!editMode}
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Nhập tên dịch vụ..."
                />
              </div>

              <div className={cx("formGroup")}>
                <label>Mô tả</label>
                <textarea
                  disabled={!editMode}
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  placeholder="Mô tả chi tiết về dịch vụ..."
                />
              </div>

              <div className={cx("row")}>
                <div className={cx("formGroup")}>
                  <label>Giá (VNĐ)</label>
                  <input
                    type="number"
                    disabled={!editMode}
                    name="price"
                    value={form.price}
                    onChange={handleChange}
                    placeholder="VD: 150000"
                  />
                </div>

                <div className={cx("formGroup")}>
                  <label>Thời lượng (phút)</label>
                  <input
                    type="number"
                    disabled={!editMode}
                    name="duration"
                    value={form.duration}
                    onChange={handleChange}
                    placeholder="VD: 30"
                  />
                </div>
              </div>

              <div className={cx("formGroup")}>
                <label>Chi nhánh áp dụng</label>
                <div className={cx("branchList")}>
                  {branches.map((b) => (
                    <div
                      key={b.idBranch}
                      className={cx("branchBadge", {
                        selected: form.branches.includes(b.idBranch),
                        disabled: !editMode,
                      })}
                      onClick={() => toggleBranch(b.idBranch)}
                    >
                      {b.name}
                    </div>
                  ))}
                </div>
              </div>

              <div className={cx("formGroup")}>
                <label>Trạng thái</label>
                <div
                  className={cx("statusToggle", { disabled: !editMode })}
                  onClick={() =>
                    editMode &&
                    setForm({ ...form, status: form.status === "Active" ? "Inactive" : "Active" })
                  }
                >
                  {form.status === "Active" ? (
                    <ToggleRight size={32} className={cx("iconActive")} strokeWidth={1.5} />
                  ) : (
                    <ToggleLeft size={32} className={cx("iconInactive")} strokeWidth={1.5} />
                  )}
                  <span className={cx(form.status === "Active" ? "textActive" : "textInactive")}>
                    {form.status === "Active" ? "Đang hoạt động" : "Ngừng hoạt động"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* FOOTER */}
          <div className={cx("footer")}>
            <button
              className={cx(editMode ? "saveBtn" : "editBtn")}
              onClick={editMode ? handleSubmit : handleEditClick}
            >
              {serviceId ? (editMode ? "Lưu thay đổi" : "Chỉnh sửa") : "Tạo dịch vụ"}
            </button>
          </div>
        </div>

        {/* Toast */}
        {toast && (
          <Toast
            type={toast.type}
            text={toast.text}
            duration={toast.duration}
            onClose={() => setToast(null)}
          />
        )}
      </div>

      {/* Xác nhận đóng */}
      {showConfirmClose && (
        <div className={cx("confirmOverlay")}>
          <div className={cx("confirmModal")}>
            <h4>Xác nhận thoát</h4>
            <p>Bạn có những thay đổi chưa lưu. Bạn có chắc chắn muốn thoát không?</p>
            <div className={cx("confirmButtons")}>
              <button className={cx("btnCancel")} onClick={() => setShowConfirmClose(false)}>
                Hủy bỏ
              </button>
              <button
                className={cx("btnConfirm")}
                onClick={() => {
                  setShowConfirmClose(false);
                  onClose();
                }}
              >
                Đồng ý thoát
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}