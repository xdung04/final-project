import React, { useEffect, useState, useRef } from "react";
import styles from "./Home.module.scss";
import { useAuth } from "~/context/AuthContext";
import ServiceCard from "~/components/ServiceCard";
import AIChat from "../../components/AIChat/AIChat";
import Modal from "~/components/Modal";
import { fetchHotServicesPaged } from "~/services/serviceService";
import { fetchHotBarbersPaged } from "~/services/barberService";
import AddBannerModal from "~/components/AddBannerModal";
import { fetchActiveBanners, uploadBanner } from "~/services/bannerService";
import { useToast } from "~/context/ToastContext";
import { BranchAPI } from "~/apis/branchAPI";
import LiveChat from "../../components/LiveChat";

// Import Header và Footer của bạn

const DEFAULT_BANNER =
  "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=1600&q=80";

const Home = () => {
  const { isLogin, user, accessToken } = useAuth();
  const [hot, setHot] = useState([]);
  const [hotBarbers, setHotBarbers] = useState([]);
  const [page, setPage] = useState(1);
  const limit = 5;
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [nextRoute, setNextRoute] = useState(null);
  const [showAddBanner, setShowAddBanner] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatType, setChatType] = useState("ai");
  const [branches, setBranches] = useState([]);
  const [activeBranch, setActiveBranch] = useState(null);
  // References cho Custom Cursor
  const cursorRef = useRef(null);
  const ringRef = useRef(null);

  /* ===== BANNER API ===== */
  const [currentBanner, setCurrentBanner] = useState(0);
  const { showToast } = useToast();
  const formatPrice = (price) => {
    return Number(price).toLocaleString("vi-VN");
  };

  useEffect(() => {
    const fetchBranches = async () => {
      try {
        // Gọi API lấy danh sách chi nhánh giống bên trang Quản lý
        const data = await BranchAPI.getAll();
        if (data && data.length > 0) {
          // Chỉ lấy những chi nhánh đang hoạt động (nếu cần)
          const activeBranches = data.filter(
            (b) => b.status === "Active" || b.status === "Hoạt động",
          );

          setBranches(activeBranches.length > 0 ? activeBranches : data);
          // Set chi nhánh đầu tiên làm mặc định để hiển thị bản đồ
          setActiveBranch(
            activeBranches.length > 0 ? activeBranches[0] : data[0],
          );
        }
      } catch (err) {
        console.error("Lỗi load danh sách chi nhánh:", err);
      }
    };
    fetchBranches();
  }, []);
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
    let mx = 0,
      my = 0,
      rx = 0,
      ry = 0;
    const handleMouseMove = (e) => {
      mx = e.clientX;
      my = e.clientY;
    };
    window.addEventListener("mousemove", handleMouseMove);

    const animateCursor = () => {
      if (cursorRef.current && ringRef.current) {
        cursorRef.current.style.left = mx + "px";
        cursorRef.current.style.top = my + "px";
        rx += (mx - rx) * 0.12;
        ry += (my - ry) * 0.12;
        ringRef.current.style.left = rx + "px";
        ringRef.current.style.top = ry + "px";
      }
      requestAnimationFrame(animateCursor);
    };
    const animId = requestAnimationFrame(animateCursor);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      cancelAnimationFrame(animId);
    };
  }, []);

  useEffect(() => {
    const loadHotBarbers = async () => {
      try {
        const data = await fetchHotBarbersPaged(page, limit);
        setHotBarbers(data.data);
      } catch (err) {
        console.error("Lỗi load barber hot:", err);
      }
    };

    loadHotBarbers();
  }, [page]);

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
        <div
          className={styles.heroBg}
          style={{ backgroundImage: `url(${DEFAULT_BANNER})` }}
        ></div>
        <div className={styles.heroLines}></div>

        <div className={styles.heroTag}>NOBLE CUT EXPERIENCE</div>
        <h1 className={styles.heroTitle}>
          Phong cách <em>Chất lượng</em>
        </h1>

        <div className={styles.heroBottom}>
          <p className={styles.heroDesc}>
            Chăm sóc tóc cho quý ông – Đẳng cấp và sự tinh tế trong từng chi
            tiết.
          </p>
          <div className={styles.heroActions}>
            <button className={styles.btnPrimary} onClick={handleBookingClick}>
              <span>Đặt lịch ngay</span>
            </button>
            <button
              className={styles.btnOutline}
              onClick={() => setChatOpen(true)}
            >
              <span>Tư vấn AI</span>
            </button>
          </div>
        </div>

        {user?.role === "admin" && (
          <button
            className={styles.addBannerBtn}
            onClick={() => setShowAddBanner(true)}
          >
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
          {[1, 2, 3, 4, 5].map((_, i) => (
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
            <h2 className={styles.sectionTitle}>
              Các dịch vụ <em>Nổi bật</em>
            </h2>
          </div>
        </div>

        <div className={styles.servicesGrid}>
          {/* CARD ĐẦU TIÊN - LỚN, ẢNH TRÀN VIỀN */}
          {hot[0] && (
            <div
              className={`${styles.serviceCard} ${styles.featured}`}
              style={{
                backgroundImage: `url(${hot[0].image})`,
              }}
            >
              <div className={styles.serviceNum}>01</div>
              <h3 className={styles.serviceName}>{hot[0].name}</h3>
              <p className={styles.serviceDesc}>{hot[0].description}</p>
              <div className={styles.servicePrice}>
                {formatPrice(hot[0].price)} <span>VNĐ</span>
              </div>
            </div>
          )}

          {/* 4 CARD CÒN LẠI - CŨNG ẢNH TRÀN VIỀN */}
          {hot.slice(1, 5).map((service, index) => (
            <div
              key={service.idService}
              className={styles.serviceCard}
              style={{
                backgroundImage: `url(${service.image})`,
              }}
            >
              <div className={styles.serviceNum}>
                {String(index + 2).padStart(2, "0")}
              </div>

              {/* KHÔNG CÒN serviceIcon nữa */}

              <h3 className={styles.serviceName}>{service.name}</h3>
              <p className={styles.serviceDesc}>
                {service.description || "Dịch vụ đẳng cấp."}
              </p>
              <div className={styles.servicePrice}>
                {formatPrice(service.price)} <span>VNĐ</span>
              </div>
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
          <h2 className={styles.aiTitle}>
            Tìm kiểu tóc <em>Hoàn hảo</em>
          </h2>
          <p className={styles.aiDesc}>
            Bạn chưa chắc chắn kiểu tóc nào phù hợp? Hãy quét khuôn mặt bằng AI
            để tìm ra phong cách sinh ra dành riêng cho bạn.
          </p>
          <button
            className={styles.aiScanBtn}
            onClick={() => (window.location.href = "/hair-consult")}
          >
            <div className={styles.aiBtnInner}>
              <div className={styles.aiBtnIcon}>
                <div className={styles.scanRing}></div>
                <svg viewBox="0 0 24 24">
                  <path d="M3 7v-2c0-1.1.9-2 2-2h2M19 7v-2c0-1.1-.9-2-2-2h-2M3 17v2c0 1.1.9 2 2 2h2M19 17v2c0 1.1-.9 2-2 2h-2" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              </div>
              <div className={styles.aiBtnText}>
                <span className={styles.aiBtnLabel}>Hair Consult AI</span>
                <span className={styles.aiBtnTitle}>Bắt đầu quét AI</span>
              </div>
              <div className={styles.aiBtnArrow}>
                <svg viewBox="0 0 24 24">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
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

      {/* BARBERS (API) */}
      <section id="barbers" className={styles.barbers}>
        <div className={styles.barbersHeader}>
          <div className={styles.sectionLabel}>MASTER BARBERS</div>
          <h2 className={styles.sectionTitle}>
            Đội ngũ <em>Thợ Cạo</em>
          </h2>
        </div>

        <div className={styles.barbersGrid}>
          {hotBarbers.map((barber, index) => (
            <div key={barber.idBarber} className={styles.barberCard}>
              <div className={styles.barberPhoto}>
                <img src={barber.avatar} alt={barber.name} />
              </div>

              <span className={styles.barberRole}>TOP #{index + 1}</span>

              <div className={styles.barberOverlay}>
                <h4 className={styles.barberName}>{barber.name}</h4>

                <span className={styles.barberExp}>{barber.branch}</span>

                <div className={styles.barberStats}>
                  <span className={styles.barberBadge}>⭐ {barber.rating}</span>
                  <span className={styles.barberBadge}>
                    {barber.totalBookings} lượt đặt
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* STATS (Tĩnh) */}
      <section className={styles.stats}>
        <div className={styles.statItem}>
          <div className={styles.statNum}>
            10<span className={styles.statUnit}>K+</span>
          </div>
          <div className={styles.statLabel}>Khách hàng hài lòng</div>
        </div>
        <div className={styles.statItem}>
          <div className={styles.statNum}>
            15<span className={styles.statUnit}>+</span>
          </div>
          <div className={styles.statLabel}>Thợ cạo tay nghề cao</div>
        </div>
        <div className={styles.statItem}>
          <div className={styles.statNum}>
            5<span className={styles.statUnit}>+</span>
          </div>
          <div className={styles.statLabel}>Chi nhánh trên toàn quốc</div>
        </div>
        <div className={styles.statItem}>
          <div className={styles.statNum}>
            4.9<span className={styles.statUnit}>/5</span>
          </div>
          <div className={styles.statLabel}>Đánh giá trung bình</div>
        </div>
      </section>

      {/* REELS / VIDEO (Tĩnh) */}
      <section id="reels" className={styles.reels}>
        <div className={styles.reelsHeader}>
          <div className={styles.sectionLabel}>VIDEO & MEDIA</div>
          <h2 className={styles.sectionTitle}>
            Tác phẩm <em>Mới nhất</em>
          </h2>
        </div>
        <div className={styles.reelsGrid}>
          <div className={`${styles.reelItem} ${styles.main}`}>
            <img
              src="https://images.unsplash.com/photo-1593702275687-f8b402bf1fb5?w=800&q=80"
              alt="Reel"
            />
          </div>
          <div className={styles.reelItem}>
            <img
              src="https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=400&q=80"
              alt="Reel"
            />
          </div>
          <div className={styles.reelItem}>
            <img
              src="https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=400&q=80"
              alt="Reel"
            />
          </div>
        </div>
      </section>

      {/* BRANCHES (Động từ API) */}
      <section id="branches" className={styles.branches}>
        <div className={styles.branchesMap}>
          {activeBranch && activeBranch.latitude && activeBranch.longitude ? (
            <iframe
              title={`Bản đồ chi nhánh ${activeBranch.name}`}
              width="100%"
              height="100%"
              style={{ border: 0, borderRadius: "8px" }}
              loading="lazy"
              allowFullScreen
              // Truyền Kinh độ và Vĩ độ vào URL của Google Maps
              src={`https://maps.google.com/maps?q=${activeBranch.latitude},${activeBranch.longitude}&z=16&output=embed`}
            ></iframe>
          ) : (
            <div
              className={styles.branchesMapPlaceholder}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                height: "100%",
                background: "#1a1a1a",
                borderRadius: "8px",
              }}
            >
              {activeBranch
                ? "Chi nhánh này chưa được cập nhật tọa độ bản đồ."
                : "Đang tải bản đồ..."}
            </div>
          )}
        </div>

        <div className={styles.branchList}>
          {branches.length > 0 ? (
            branches.map((branch) => (
              <div
                key={branch.idBranch}
                // Thêm class active nếu id trùng với chi nhánh đang được chọn
                className={`${styles.branchItem} ${activeBranch?.idBranch === branch.idBranch ? styles.active : ""}`}
                onClick={() => setActiveBranch(branch)}
                style={{ cursor: "pointer" }}
              >
                <div>
                  <h4 className={styles.branchName}>{branch.name}</h4>
                  <p className={styles.branchAddr}>{branch.address}</p>
                </div>
              </div>
            ))
          ) : (
            <p style={{ color: "var(--text-dim)" }}>
              Chưa có thông tin chi nhánh.
            </p>
          )}
        </div>
      </section>

      {/* CHATBOT POPUP */}
      <div className={styles.chatbotBubble}>
        <div
          className={`${styles.chatbotPopup} ${chatOpen ? styles.open : ""}`}
        >
          {chatOpen && chatType === "ai" && (
            <AIChat
              onSwitchToLive={() => {
                setChatType("live");
                setChatOpen(true); // 🔥 đảm bảo popup mở
              }}
            />
          )}

          {chatOpen && chatType === "live" && (
            <LiveChat customerId={user?.idUser} token={accessToken} />
          )}
        </div>

        <button
          className={styles.chatbotBtn}
          onClick={() => {
            setChatOpen(!chatOpen);

            // 🔥 reset về AI khi đóng
            if (chatOpen) setChatType("ai");
          }}
        >
          {chatOpen ? "✕" : "💬"}
        </button>
      </div>

      <Modal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} />
    </div>
  );
};

export default Home;
