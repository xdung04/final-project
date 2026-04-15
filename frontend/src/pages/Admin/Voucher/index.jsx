import React, { useState, useEffect } from "react";
import classNames from "classnames/bind";
import styles from "./Voucher.module.scss";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus } from "@fortawesome/free-solid-svg-icons";
import PromoCard from "~/components/PromoCard";
import VoucherForm from "~/components/VoucherForm";
import { VoucherAPI } from "~/apis/voucherAPI";

const cx = classNames.bind(styles);

function Voucher() {
  const [vouchers, setVouchers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingVoucher, setEditingVoucher] = useState(null);

  const fetchVouchers = async () => {
    try {
      const res = await VoucherAPI.getAll();
      if (res.success) setVouchers(res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchVouchers();
  }, []);

  const handleCreateClick = () => {
    setEditingVoucher(null);
    setShowForm(true);
  };

  const handleEditVoucher = (voucher) => {
    setEditingVoucher(voucher);
    setShowForm(true);
  };

  const handleDeleteVoucher = async (idVoucher) => {
    try {
      const res = await VoucherAPI.delete(idVoucher);
      if (res.success) fetchVouchers();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className={cx("voucherPage")}>
      <div className={cx("header")}>
        <h2>Quản lý Voucher</h2>
        <button className={cx("addBtn")} onClick={handleCreateClick}>
          <FontAwesomeIcon icon={faPlus} /> Tạo voucher mới
        </button>
      </div>

      <div className={cx("voucherList")}>
        {vouchers.length > 0 ? (
          vouchers.map((v) => (
            <PromoCard
              key={v.idVoucher}
              voucher={v}
              onEdit={() => handleEditVoucher(v)}
              onDelete={handleDeleteVoucher}
            />
          ))
        ) : (
          <div className={cx("emptyState")}>Chưa có voucher nào được tạo.</div>
        )}
      </div>

      {showForm && (
        <VoucherForm
          voucher={editingVoucher}
          onClose={() => setShowForm(false)}
          onVoucherCreated={fetchVouchers}
          onVoucherUpdated={fetchVouchers}
        />
      )}
    </div>
  );
}

export default Voucher;
