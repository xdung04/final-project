import React, { useEffect, useState } from "react";
import styles from "./SanPham.module.scss";
import WorkCard from "~/components/CustomerGalleryCard";
import { fetchBarberGallery } from "~/services/customerGalleryService";
import { useAuth } from "~/context/AuthContext";

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
    return <p className={styles.loading}>Đang tải...</p>;
  }
  
  if (!idBarber) {
     return <p className={styles.empty}>Vui lòng đăng nhập bằng tài khoản Barber để xem sản phẩm của mình.</p>;
  }

  if (loading) {
    return <p className={styles.loading}>Đang tải...</p>;
  }

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Sản phẩm đã hoàn thành</h2>
      <p className={styles.subtitle}>
        Ảnh sản phẩm sau khi hoàn thành dịch vụ
      </p>

      {works.length > 0 ? (
        <div className={styles.grid}>
          {works.map((work) => (
            <WorkCard key={work.idBooking} work={work} />
          ))}
        </div>
      ) : (
        <p className={styles.empty}>Chưa có sản phẩm nào</p>
      )}
    </div>
  );
}

export default SanPham;
