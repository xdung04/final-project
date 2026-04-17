import React, { useEffect, useState } from "react";
import styles from "./SanPham.module.scss";
import WorkCard from "~/components/CustomerGalleryCard";
import { fetchBarberGallery } from "~/services/customerGalleryService";
import { useAuth } from "~/context/AuthContext";
import { Loader2, Scissors } from "lucide-react";

function SanPham() {
  const [works, setWorks] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user, loading: isAuthLoading } = useAuth();
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
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [idBarber, isAuthLoading]);

  if (isAuthLoading || loading) {
    return (
      <div className={styles.loadingContainer}>
        <Loader2 size={40} className={styles.loadingIcon} />
        <p>Đang tải danh sách tác phẩm...</p>
      </div>
    );
  }
  
  if (!idBarber) {
     return (
      <div className={styles.emptyContainer}>
        <p>Vui lòng đăng nhập bằng tài khoản Barber để xem sản phẩm của mình.</p>
      </div>
     );
  }

  return (
    <div className={styles.container}>
      <div className={styles.headerInfo}>
        <h2 className={styles.title}>Sản Phẩm Đã Hoàn Thành</h2>
        <p className={styles.subtitle}>
          Lưu giữ và trưng bày các tác phẩm nghệ thuật sau khi hoàn thành dịch vụ
        </p>
      </div>

      {works.length > 0 ? (
        <div className={styles.grid}>
          {works.map((work) => (
            <WorkCard key={work.idBooking} work={work} />
          ))}
        </div>
      ) : (
        <div className={styles.emptyState}>
          <Scissors size={48} className={styles.emptyIcon} />
          <p>Chưa có sản phẩm nào được lưu lại.</p>
        </div>
      )}
    </div>
  );
}

export default SanPham;