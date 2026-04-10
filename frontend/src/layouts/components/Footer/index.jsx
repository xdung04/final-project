import React, { useEffect, useState } from "react";
import styles from "./Footer.module.scss";
import { BranchAPI } from "~/apis/branchAPI";

export default function Footer() {
  const [branches, setBranches] = useState([]);

  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const res = await BranchAPI.getAll(); 
        setBranches(res);
      } catch (err) {
        console.error("Lỗi khi lấy chi nhánh:", err);
      }
    };
    fetchBranches();
  }, []);

  return (
    <footer className={styles.footer}>
      <div className={styles.footerGrid}>
        
        {/* Cột 1: Thông tin thương hiệu */}
        <div className={styles.footerBrand}>
          <a href="/" className={styles.navLogo}>
            <div className={styles.logoIcon}>
              <svg viewBox="0 0 24 24"><path d="M12 2L2 22h20L12 2zm0 4.5l6.5 13.5h-13L12 6.5z"/></svg>
            </div>
            <div>
              <div className={styles.logoText}>NOBLE</div>
              <div className={styles.logoSub}>Barbershop</div>
            </div>
          </a>
          <p className={styles.footerDesc}>
            Khởi nguồn từ đam mê và kỹ năng điêu luyện, chúng tôi mang đến trải nghiệm cắt tóc đẳng cấp dành riêng cho những quý ông hiện đại.
          </p>
        </div>

        {/* Cột 2: Khám phá */}
        <div className={styles.footerCol}>
          <h4 className={styles.footerTitle}>Khám phá</h4>
          <ul className={styles.footerLinks}>
            <li><a href="/">Trang chủ</a></li>
            <li><a href="/about">Về chúng tôi</a></li>
            <li><a href="/services">Dịch vụ</a></li>
            <li><a href="/booking">Đặt lịch</a></li>
          </ul>
        </div>

        {/* Cột 3: Chi nhánh (Đổ từ API của bạn) */}
        <div className={styles.footerCol}>
          <h4 className={styles.footerTitle}>Chi nhánh</h4>
          <ul className={styles.footerBranches}>
            {branches.length > 0 ? (
              branches.map(branch => (
                <li key={branch.idBranch}>
                  <strong>{branch.name}</strong>
                  <span>{branch.address}</span>
                </li>
              ))
            ) : (
              <li><span className={styles.loadingText}>Đang tải chi nhánh...</span></li>
            )}
          </ul>
        </div>

        {/* Cột 4: Mạng xã hội */}
        <div className={styles.footerCol}>
          <h4 className={styles.footerTitle}>Kết nối</h4>
          <div className={styles.footerSocials}>
            <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className={styles.socialLink}>FB</a>
            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className={styles.socialLink}>IG</a>
            <a href="https://tiktok.com" target="_blank" rel="noopener noreferrer" className={styles.socialLink}>TT</a>
          </div>
        </div>

      </div>

      <div className={styles.footerBottom}>
        <p>&copy; {new Date().getFullYear()} NOBLE Barbershop. All rights reserved.</p>
      </div>
    </footer>
  );
}