import React, { useEffect, useState, useRef } from "react";
import styles from "./Home.module.scss";
import { useAuth } from "~/context/AuthContext";
import ServiceCard from "~/components/ServiceCard";
import AIChat from "../../components/AIChat/AIChat";
import Modal from "~/components/Modal";
import { fetchHotServicesPaged } from "~/services/serviceService";
import AddBannerModal from "~/components/AddBannerModal";
import { fetchActiveBanners, uploadBanner } from "~/services/bannerService";
import { useToast } from "~/context/ToastContext";

// Import Header và Footer của bạn

const DEFAULT_BANNER = "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=1600&q=80";

const Home = () => {
  const { isLogin, user, accessToken } = useAuth();
  const [hot, setHot] = useState([]);
  const [page, setPage] = useState(1);
  const limit = 3; 
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [nextRoute, setNextRoute] = useState(null);
  const [showAddBanner, setShowAddBanner] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);

  // References cho Custom Cursor
  const cursorRef = useRef(null);
  const ringRef = useRef(null);

  /* ===== BANNER API ===== */
  const [currentBanner, setCurrentBanner] = useState(0);
  const { showToast } = useToast();


  /* ===== HOT SERVICES API ===== */
  useEffect(() => {
    const loadHot = async () => {
      try {
        const data = await fetchHotServicesPaged(page, limit);
        setHot(data.data);
      } catch (err) {
        console.error("Lỗi load dịch vụ hot:", err);
      }
    };
    loadHot();
  }, [page]);

  /* ===== CUSTOM CURSOR ===== */
  useEffect(() => {
    let mx = 0, my = 0, rx = 0, ry = 0;
    const handleMouseMove = (e) => {
      mx = e.clientX;
      my = e.clientY;
    };
    window.addEventListener("mousemove", handleMouseMove);

    const animateCursor = () => {
      if (cursorRef.current && ringRef.current) {
        cursorRef.current.style.left = mx + 'px';
        cursorRef.current.style.top = my + 'px';
        rx += (mx - rx) * 0.12;
        ry += (my - ry) * 0.12;
        ringRef.current.style.left = rx + 'px';
        ringRef.current.style.top = ry + 'px';
      }
      requestAnimationFrame(animateCursor);
    };
    const animId = requestAnimationFrame(animateCursor);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      cancelAnimationFrame(animId);
    };
  }, []);

  /* ===== ACTIONS ===== */
  const handleBookingClick = () => {
    if (isLogin) {
      window.location.href = "/booking";
    } else {
      setNextRoute("/booking");
      setShowLoginModal(true);
    }
  };



  return (
    <div className={styles.homeWrapper}>
      {/* GRAIN OVERLAY */}
      <div className={styles.grainOverlay}></div>

      {/* CUSTOM CURSOR */}
      <div className={styles.cursor} ref={cursorRef}></div>
      <div className={styles.cursorRing} ref={ringRef}></div>

    

      {/* HERO SECTION */}
      <header className={styles.hero}>
        <div className={styles.heroBg} style={{ backgroundImage: `url(${DEFAULT_BANNER})` }}></div>
        <div className={styles.heroLines}></div>

        <div className={styles.heroTag}>NOBLE CUT EXPERIENCE</div>
        <h1 className={styles.heroTitle}>Phong cách <em>Chất lượng</em></h1>
        
        <div className={styles.heroBottom}>
          <p className={styles.heroDesc}>
            Chăm sóc tóc cho quý ông – Đẳng cấp và sự tinh tế trong từng chi tiết.
          </p>
          <div className={styles.heroActions}>
            <button className={styles.btnPrimary} onClick={handleBookingClick}>
              <span>Đặt lịch ngay</span>
            </button>
            <button className={styles.btnOutline} onClick={() => setChatOpen(true)}>
              <span>Tư vấn AI</span>
            </button>
          </div>
        </div>

        {user?.role === "admin" && (
          <button className={styles.addBannerBtn} onClick={() => setShowAddBanner(true)}>
            + Thêm banner
          </button>
        )}

        <div className={styles.heroScroll}>
          <span>Scroll</span>
          <div className={styles.scrollLine}></div>
        </div>
      </header>

      {/* MARQUEE */}
      <div className={styles.marqueeBar}>
        <div className={styles.marqueeTrack}>
          {[1,2,3,4,5].map((_, i) => (
            <React.Fragment key={i}>
              <div className={styles.marqueeItem}>
                <div className={styles.marqueeDot}></div> PRECISE FADES
              </div>
              <div className={styles.marqueeItem}>
                <div className={styles.marqueeDot}></div> HOT TOWEL SHAVES
              </div>
              <div className={styles.marqueeItem}>
                <div className={styles.marqueeDot}></div> BEARD SCULPTING
              </div>
              <div className={styles.marqueeItem}>
                <div className={styles.marqueeDot}></div> CLASSIC CUTS
              </div>
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* SERVICES */}
      <section id="services" className={styles.services}>
        <div className={styles.servicesHeader}>
          <div>
            <div className={styles.sectionLabel}>BẢNG GIÁ DỊCH VỤ</div>
            <h2 className={styles.sectionTitle}>Các dịch vụ <em>Nổi bật</em></h2>
          </div>
        </div>
        <div className={styles.servicesGrid}>
          <div className={`${styles.serviceCard} ${styles.featured}`}>
            <div className={styles.serviceNum}>01</div>
            <h3 className={styles.serviceName}>Combo Cắt Gội VIP</h3>
            <p className={styles.serviceDesc}>Tư vấn kiểu tóc, cắt tạo kiểu, gội massage thư giãn, cạo mặt, sấy tạo kiểu với sáp cao cấp.</p>
            <div className={styles.servicePrice}>250.000 <span>VNĐ</span></div>
          </div>

          {hot.map((service, index) => (
            <div key={service.idService} className={styles.serviceCard}>
               <div className={styles.serviceNum}>0{index + 2}</div>
               <div className={styles.serviceIcon}>
                 <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></svg>
               </div>
               <h3 className={styles.serviceName}>{service.name}</h3>
               <p className={styles.serviceDesc}>{service.description || "Dịch vụ đẳng cấp."}</p>
               <div className={styles.servicePrice}>{service.price} <span>VNĐ</span></div>
            </div>
          ))}
        </div>
      </section>

      {/* AI SCAN SECTION */}
      <section className={styles.aiScanSection}>
        <div className={styles.aiContent}>
          <div className={styles.aiBadge}>
            <div className={styles.aiBadgeDot}></div>
            Tư vấn tự động
          </div>
          <h2 className={styles.aiTitle}>Tìm kiểu tóc <em>Hoàn hảo</em></h2>
          <p className={styles.aiDesc}>
            Bạn chưa chắc chắn kiểu tóc nào phù hợp? Hãy quét khuôn mặt bằng AI để tìm ra phong cách sinh ra dành riêng cho bạn.
          </p>
          <button className={styles.aiScanBtn} onClick={() => (window.location.href = "/hair-consult")}>
            <div className={styles.aiBtnInner}>
              <div className={styles.aiBtnIcon}>
                <div className={styles.scanRing}></div>
                <svg viewBox="0 0 24 24"><path d="M3 7v-2c0-1.1.9-2 2-2h2M19 7v-2c0-1.1-.9-2-2-2h-2M3 17v2c0 1.1.9 2 2 2h2M19 17v2c0 1.1-.9 2-2 2h-2"/><circle cx="12" cy="12" r="3"/></svg>
              </div>
              <div className={styles.aiBtnText}>
                <span className={styles.aiBtnLabel}>Hair Consult AI</span>
                <span className={styles.aiBtnTitle}>Bắt đầu quét AI</span>
              </div>
              <div className={styles.aiBtnArrow}>
                <svg viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              </div>
            </div>
          </button>
        </div>
        <div className={styles.aiVisual}>
          <div className={styles.aiVisualImg}>
            <img src="/consult.png" alt="Consult AI" />
          </div>
          <div className={styles.aiScanOverlay}>
            <div className={styles.scanLine}></div>
            <div className={`${styles.aiScanCorner} ${styles.tl}`}></div>
            <div className={`${styles.aiScanCorner} ${styles.tr}`}></div>
            <div className={`${styles.aiScanCorner} ${styles.bl}`}></div>
            <div className={`${styles.aiScanCorner} ${styles.br}`}></div>
          </div>
        </div>
      </section>

      {/* BARBERS (Tĩnh) */}
      <section id="barbers" className={styles.barbers}>
        <div className={styles.barbersHeader}>
          <div className={styles.sectionLabel}>MASTER BARBERS</div>
          <h2 className={styles.sectionTitle}>Đội ngũ <em>Thợ Cạo</em></h2>
        </div>
        <div className={styles.barbersGrid}>
          {[1,2,3,4].map(num => (
            <div key={num} className={styles.barberCard}>
              <div className={styles.barberPhoto}>
                <img src={`https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=400&q=80`} alt="Barber" />
              </div>
              <div className={styles.barberOverlay}>
                <span className={styles.barberRole}>Master Barber</span>
                <h4 className={styles.barberName}>John Doe {num}</h4>
                <span className={styles.barberExp}>Kinh nghiệm 5 năm</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* STATS (Tĩnh) */}
      <section className={styles.stats}>
        <div className={styles.statItem}>
          <div className={styles.statNum}>10<span className={styles.statUnit}>K+</span></div>
          <div className={styles.statLabel}>Khách hàng hài lòng</div>
        </div>
        <div className={styles.statItem}>
          <div className={styles.statNum}>15<span className={styles.statUnit}>+</span></div>
          <div className={styles.statLabel}>Thợ cạo tay nghề cao</div>
        </div>
        <div className={styles.statItem}>
          <div className={styles.statNum}>5<span className={styles.statUnit}>+</span></div>
          <div className={styles.statLabel}>Chi nhánh trên toàn quốc</div>
        </div>
        <div className={styles.statItem}>
          <div className={styles.statNum}>4.9<span className={styles.statUnit}>/5</span></div>
          <div className={styles.statLabel}>Đánh giá trung bình</div>
        </div>
      </section>

      {/* REELS / VIDEO (Tĩnh) */}
      <section id="reels" className={styles.reels}>
         <div className={styles.reelsHeader}>
          <div className={styles.sectionLabel}>VIDEO & MEDIA</div>
          <h2 className={styles.sectionTitle}>Tác phẩm <em>Mới nhất</em></h2>
        </div>
        <div className={styles.reelsGrid}>
          <div className={`${styles.reelItem} ${styles.main}`}>
             <img src="https://images.unsplash.com/photo-1593702275687-f8b402bf1fb5?w=800&q=80" alt="Reel" />
          </div>
          <div className={styles.reelItem}>
             <img src="https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=400&q=80" alt="Reel" />
          </div>
          <div className={styles.reelItem}>
             <img src="https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=400&q=80" alt="Reel" />
          </div>
        </div>
      </section>

      {/* BRANCHES (Tĩnh) */}
      <section id="branches" className={styles.branches}>
         <div className={styles.branchesMap}>
           <p className={styles.branchesMapPlaceholder}>Bản đồ chi nhánh</p>
         </div>
         <div className={styles.branchList}>
            <div className={`${styles.branchItem} ${styles.active}`}>
              <div>
                <h4 className={styles.branchName}>CN1: Quận 1, TP.HCM</h4>
                <p className={styles.branchAddr}>123 Nguyễn Huệ, Bến Nghé</p>
              </div>
            </div>
            <div className={styles.branchItem}>
              <div>
                <h4 className={styles.branchName}>CN2: Quận 3, TP.HCM</h4>
                <p className={styles.branchAddr}>456 Lê Văn Sỹ, Phường 14</p>
              </div>
            </div>
         </div>
      </section>

      {/* CHATBOT POPUP */}
      <div className={styles.chatbotBubble}>
        <div className={`${styles.chatbotPopup} ${chatOpen ? styles.open : ""}`}>
           {chatOpen && <AIChat />}
        </div>
        <button className={styles.chatbotBtn} onClick={() => setChatOpen(!chatOpen)}>
          {chatOpen ? '✕' : <svg viewBox="0 0 24 24"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2v10z"/></svg>}
        </button>
      </div>

      <Modal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} />
     

  
      
    </div>
  );
};

export default Home;