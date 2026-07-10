import React, { useEffect, useState } from "react";
import classNames from "classnames/bind";
import styles from "./SanPham.module.scss";
import WorkCard from "~/components/CustomerGalleryCard";
import { fetchBarberGallery } from "~/services/customerGalleryService";
import { useAuth } from "~/context/AuthContext";
import { useToast } from "~/context/ToastContext";
import { Loader2, Scissors, Image as ImageIcon } from "lucide-react";

const cx = classNames.bind(styles);

function SanPham() {
  const [works, setWorks] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user, loading: isAuthLoading } = useAuth();
  const { showToast } = useToast();
  const idBarber = user?.idUser;

  useEffect(() => {
    if (isAuthLoading || !idBarber) {
      if (!isAuthLoading) setLoading(false);
      return;
    }

    const loadData = async () => {
      setLoading(true);
      try {
        const data = await fetchBarberGallery(idBarber); 

        // ✅ Gom nhóm theo idbooking (giữ nguyên logic)
        const grouped = {};
        data.forEach((item) => {
          const id = item.idbooking;
          if (!grouped[id]) {
            grouped[id] = {
              idBooking: id,
              customerName: item.customerName,
              barberName: item.barberName,
              service: item.service,
              description: item.description || "",
              date: item.date,
              photos: [],
            };
          }
          grouped[id].photos.push(item.photo);
        });

        setWorks(Object.values(grouped));
      } catch (err) {
        console.error("Lỗi khi tải gallery:", err);
        showToast({ text: "Không thể tải danh sách sản phẩm. Vui lòng thử lại.", type: "error" });
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [idBarber, isAuthLoading]);

  if (isAuthLoading || loading) {
    return (
      <div className={cx("loadingContainer")}>
        <Loader2 size={40} className={cx("loadingIcon")} />
        <p>Đang tải danh sách tác phẩm...</p>
      </div>
    );
  }
  
  if (!idBarber) {
     return (
      <div className={cx("emptyContainer")}>
        <p>Vui lòng đăng nhập bằng tài khoản Barber để xem sản phẩm của mình.</p>
      </div>
     );
  }

  return (
    <div className={cx("container")}>
      <div className={cx("headerInfo")}>
        <div>
          <h2 className={cx("title")}>
            <ImageIcon className={cx("titleIcon")} size={24} /> Sản Phẩm Đã Hoàn Thành
          </h2>
          <p className={cx("subtitle")}>
            Lưu giữ và trưng bày các tác phẩm nghệ thuật sau khi hoàn thành dịch vụ
          </p>
        </div>
      </div>

      {works.length > 0 ? (
        <div className={cx("grid")}>
          {works.map((work) => (
            <WorkCard key={work.idBooking} work={work} />
          ))}
        </div>
      ) : (
        <div className={cx("emptyState")}>
          <Scissors size={48} className={cx("emptyIcon")} />
          <p>Chưa có sản phẩm nào được lưu lại.</p>
        </div>
      )}
    </div>
  );
}

export default SanPham;