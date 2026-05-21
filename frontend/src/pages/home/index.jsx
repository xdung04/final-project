import React, { useEffect, useState, useRef } from "react";
import styles from "./Home.module.scss";
import { useAuth } from "~/context/AuthContext";
import AIChat from "../../components/AIChat/AIChat";
import Modal from "~/components/Modal";
import { fetchHotServicesPaged } from "~/services/serviceService";
import { fetchHotBarbersPaged } from "~/services/barberService";
import { BranchAPI } from "~/apis/branchAPI";
import LiveChat from "../../components/LiveChat";
import { X, MessageCircle } from "lucide-react";
import { fetchReelsPaged } from "~/services/reelService";
import { useNavigate } from "react-router-dom";

// ✅ Import API của Hairstyle
import { hairStyleAPI } from "~/apis/hairStyleAPI";

const DEFAULT_BANNER =
  "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=1600&q=80";

const FALLBACK_HAIR_IMG = 
  "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=600&q=80";

const HairStyleCard = ({ style, index, activeCat, handleBook, categories }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className={`${styles.hairCard} ${
        index === 0 && activeCat === "all" ? styles.hairFeatured : ""
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Container chứa 2 ảnh chồng lên nhau */}
      <div className={styles.hairImageContainer}>
        {/* Ảnh chính (Cover) */}
        <img
          className={styles.hairImg}
          src={style.img || FALLBACK_HAIR_IMG}
          alt={style.name}
          onError={(e) => {
            e.target.src = FALLBACK_HAIR_IMG;
          }}
        />

        {/* Ảnh side - chỉ hiện khi có dữ liệu */}
        {style.sideImg && style.sideImg !== style.img && (
          <img
            className={`${styles.hairImg} ${styles.hairSideImg} ${
              isHovered ? styles.visible : ""
            }`}
            src={style.sideImg}
            alt={`${style.name} - side view`}
            onError={(e) => {
              e.target.style.display = "none";
            }}
          />
        )}
      </div>

      <div className={styles.hairOverlay} />

      {/* Số thứ tự */}
      <span className={styles.hairNum}>
        {String(index + 1).padStart(2, "0")}
      </span>

      {/* Tag danh mục */}
      <span className={styles.hairTag}>
        {categories.find((c) => c.key === style.cat)?.label}
      </span>

      {/* Thông tin hover */}
      <div className={styles.hairInfo}>
        <p className={styles.hairDesc}>{style.desc}</p>
        <div className={styles.hairLevel}>
          {[1, 2, 3, 4, 5].map((dot) => (
            <span
              key={dot}
              className={`${styles.levelDot} ${
                dot > style.level ? styles.off : ""
              }`}
            />
          ))}
          <span className={styles.levelLabel}>{style.levelLabel}</span>
        </div>
      </div>

      {/* Tên & subtitle */}
      <div className={styles.hairBottom}>
        <p className={styles.hairName}>{style.name}</p>
        <p className={styles.hairSub}>{style.sub}</p>
      </div>

      {/* Nút đặt lịch */}
      <button
        className={styles.hairBtn}
        onClick={() => handleBook(style.name)}
      >
        <svg viewBox="0 0 24 24">
          <path d="M5 12h14M12 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  );
};


// ── Component HairCatalog (Sử dụng Component Card mới) ────────────────────────
const HairCatalog = ({ onBook }) => {
  const [activeCat, setActiveCat] = useState("all");
  const [categories, setCategories] = useState([{ key: "all", label: "Tất cả" }]);
  const [hairstyles, setHairstyles] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchHairStyles = async () => {
      try {
        const res = await hairStyleAPI.getClientCategoriesWithHairstyles();
        if (res) {
          const dynamicCats = [{ key: "all", label: "Tất cả" }];
          const dynamicHairstyles = [];

          res.forEach((cat) => {
            dynamicCats.push({ key: cat.slug, label: cat.name });

            if (cat.hairstyles && cat.hairstyles.length > 0) {
              cat.hairstyles.forEach((hair) => {
                let levelNum = 3;
                let levelText = "Bảo dưỡng trung bình";
                
                if (hair.maintenanceLevel === "High") {
                  levelNum = 5;
                  levelText = "Cần chăm sóc cao";
                } else if (hair.maintenanceLevel === "Low") {
                  levelNum = 2;
                  levelText = "Dễ bảo dưỡng";
                }

                dynamicHairstyles.push({
                  id: hair.idHairstyle,
                  name: hair.name,
                  sub: hair.suitableAge ? `Độ tuổi: ${hair.suitableAge}` : "Phù hợp mọi lứa tuổi",
                  cat: cat.slug,
                  level: levelNum,
                  levelLabel: levelText,
                  desc: hair.shortDescription,
                  // ✅ Lấy cả ảnh chính diện và ảnh side từ Backend
                  img: hair.coverImage || FALLBACK_HAIR_IMG,
                  sideImg: hair.sideImage, // Lưu ảnh side vào đây
                });
              });
            }
          });

          setCategories(dynamicCats);
          // Chỉ lấy 6 kiểu tóc như đã thống nhất
          setHairstyles(dynamicHairstyles.slice(0, 6));
        }
      } catch (error) {
        console.error("Lỗi khi load danh sách kiểu tóc:", error);
      }
    };

    fetchHairStyles();
  }, []);

  const filtered = activeCat === "all"
    ? hairstyles
    : hairstyles.filter((h) => h.cat === activeCat);

  const handleBook = (name) => {
    if (onBook) onBook(name);
    else navigate("/booking");
  };

  return (
    <section id="hairstyles" className={styles.hairCatalog}>
      {/* Header */}
      <div className={styles.hairHeader}>
        <div>
          <div className={styles.sectionLabel}>DANH MỤC KIỂU TÓC</div>
          <h2 className={styles.sectionTitle}>
            Phong cách <em>Cho bạn</em>
          </h2>
        </div>
        <div className={styles.hairFilters}>
          {categories.map((c) => (
            <button
              key={c.key}
              className={`${styles.hairFilter} ${activeCat === c.key ? styles.active : ""}`}
              onClick={() => setActiveCat(c.key)}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className={styles.hairGrid}>
        {/* ✅ Render bằng Component Card con để xử lý logic hover tách biệt */}
        {filtered.map((style, index) => (
          <HairStyleCard
            key={style.id}
            style={style}
            index={index}
            activeCat={activeCat}
            handleBook={handleBook}
            categories={categories}
          />
        ))}
      </div>

      {/* Footer */}
      <div className={styles.hairFooter}>
        <p className={styles.hairCount}>
          Hiển thị <strong>{filtered.length}</strong> /{" "}
          <strong>{hairstyles.length}</strong> kiểu tóc
        </p>
        <button
          className={styles.btnOutline}
          onClick={() => navigate("/hairstyles")}
        >
          <span>Xem toàn bộ danh mục</span>
        </button>
      </div>
    </section>
  );
};

// ── Component Home (Giữ nguyên không thay đổi gì) ─────────────────────────────
const Home = () => {
  const { isLogin, user, accessToken } = useAuth();
  const navigate = useNavigate();

  const [hot, setHot] = useState([]);
  const [hotBarbers, setHotBarbers] = useState([]);
  const [reels, setReels] = useState([]);
  const [page] = useState(1);
  const limit = 5;
  const barberLimit = 4;

  const [showLoginModal, setShowLoginModal] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatType, setChatType] = useState("ai");
  const [branches, setBranches] = useState([]);
  const [activeBranch, setActiveBranch] = useState(null);

  const cursorRef = useRef(null);
  const ringRef = useRef(null);

  const formatPrice = (price) => Number(price).toLocaleString("vi-VN");

  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const data = await BranchAPI.getAll();
        if (data && data.length > 0) {
          const active = data.filter(
            (b) => b.status === "Active" || b.status === "Hoạt động"
          );
          const list = active.length > 0 ? active : data;
          setBranches(list);
          setActiveBranch(list[0]);
        }
      } catch (err) {
        console.error("Lỗi load branches:", err);
      }
    };
    fetchBranches();
  }, []);

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

  useEffect(() => {
    const loadHotBarbers = async () => {
      try {
        const data = await fetchHotBarbersPaged(page, barberLimit);
        setHotBarbers(data.data);
      } catch (err) {
        console.error("Lỗi load barber hot:", err);
      }
    };
    loadHotBarbers();
  }, [page]);

  useEffect(() => {
    const loadReels = async () => {
      try {
        const data = await fetchReelsPaged(1, 4, accessToken);
        setReels(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Lỗi load reels:", err);
      }
    };
    loadReels();
  }, [accessToken]);

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

  const handleBookingClick = () => {
    if (isLogin) {
      window.location.href = "/booking";
    } else {
      setShowLoginModal(true);
    }
  };

  const handleReelClick = (reel) => {
    navigate("/reels", { state: { openReelId: reel.idReel } });
  };

  return (
    <div className={styles.homeWrapper}>
      <div className={styles.grainOverlay}></div>
      <div className={styles.cursor} ref={cursorRef}></div>
      <div className={styles.cursorRing} ref={ringRef}></div>

      {/* ── HERO ── */}
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


        <div className={styles.heroScroll}>
          <span>Scroll</span>
          <div className={styles.scrollLine}></div>
        </div>
      </header>

      {/* ── MARQUEE ── */}
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

      {/* ── SERVICES ── */}
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
          {hot.map((service, index) => (
            <div
              key={service.idService}
              className={`${styles.serviceCard} ${
                index === 0 ? styles.featured : ""
              }`}
            >
              {service.image && (
                <img
                  src={service.image}
                  alt={service.name}
                  className={styles.serviceImg}
                  onError={(e) => {
                    e.target.style.display = "none";
                  }}
                />
              )}
              <div className={styles.serviceOverlay} />
              <div className={styles.serviceContent}>
                <div className={styles.serviceNum}>
                  {String(index + 1).padStart(2, "0")}
                </div>
                <h3 className={styles.serviceName}>{service.name}</h3>
                <p className={styles.serviceDesc}>
                  {service.description || "Dịch vụ đẳng cấp."}
                </p>
                <div className={styles.servicePrice}>
                  {formatPrice(service.price)} <span>VNĐ</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── AI SCAN ── */}
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
            Bạn chưa chắc chắn kiểu tóc nào phù hợp? Hãy quét khuôn mặt bằng
            AI để tìm ra phong cách sinh ra dành riêng cho bạn.
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

      {/* ── BARBERS ── */}
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
                  <span className={styles.barberBadge}>
                    ⭐ {barber.rating}
                  </span>
                  <span className={styles.barberBadge}>
                    {barber.totalBookings} lượt đặt
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── STATS ── */}
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

      {/* ══ HAIRSTYLE CATALOG (RENDER ĐỘNG API) ══ */}
      <HairCatalog onBook={(name) => handleBookingClick()} />

      {/* ══ REELS ══ */}
      <section id="reels" className={styles.reels}>
        <div className={styles.reelsHeader}>
          <div className={styles.sectionLabel}>VIDEO & MEDIA</div>
          <h2 className={styles.sectionTitle}>
            Tác phẩm <em>Mới nhất</em>
          </h2>
        </div>
        {reels.length > 0 ? (
          <div className={styles.reelsGridFour}>
            {reels.map((reel) => (
              <div
                key={reel.idReel}
                className={styles.reelItemFour}
                onClick={() => handleReelClick(reel)}
              >
                <div className={styles.reelThumbWrapper}>
                  <img
                    src={reel.thumbnail}
                    alt={reel.title}
                    className={styles.reelThumb}
                    onError={(e) => {
                      e.target.src =
                        FALLBACK_HAIR_IMG;
                    }}
                  />
                  <div className={styles.reelPlayOverlay}>
                    <svg viewBox="0 0 24 24" className={styles.playIcon}>
                      <polygon points="5,3 19,12 5,21" fill="white" />
                    </svg>
                  </div>
                  <div className={styles.reelStatsOverlay}>
                    <span>❤️ {reel.likesCount || 0}</span>
                    <span>👁 {reel.viewCount || 0}</span>
                  </div>
                </div>
                <div className={styles.reelInfo}>
                  <p className={styles.reelTitle}>
                    {reel.title || "Không có tiêu đề"}
                  </p>
                  <span className={styles.reelBarberName}>
                    {reel.Barber?.user?.fullName || "Barber"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
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
        )}
        <div style={{ textAlign: "center", marginTop: 36 }}>
          <button
            className={styles.btnOutline}
            onClick={() => navigate("/reels")}
            style={{ margin: "0 auto" }}
          >
            <span>Xem tất cả video</span>
          </button>
        </div>
      </section>

      {/* ── BRANCHES ── */}
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
              src={`https://maps.google.com/maps?q=${activeBranch.latitude},${activeBranch.longitude}&z=16&output=embed`}
            />
          ) : (
            <div
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
                ? "Chi nhánh này chưa được cập nhật tọa độ."
                : "Đang tải bản đồ..."}
            </div>
          )}
        </div>
        <div className={styles.branchList}>
          {branches.length > 0 ? (
            branches.map((branch) => (
              <div
                key={branch.idBranch}
                className={`${styles.branchItem} ${
                  activeBranch?.idBranch === branch.idBranch
                    ? styles.active
                    : ""
                }`}
                onClick={() => setActiveBranch(branch)}
                style={{ cursor: "pointer" }}
              >
                <h4 className={styles.branchName}>{branch.name}</h4>
                <p className={styles.branchAddr}>{branch.address}</p>
              </div>
            ))
          ) : (
            <p style={{ color: "var(--text-dim)" }}>
              Chưa có thông tin chi nhánh.
            </p>
          )}
        </div>
      </section>

      {/* ── CHATBOT ── */}
      <div className={styles.chatbotBubble}>
        <div
          className={`${styles.chatbotPopup} ${chatOpen ? styles.open : ""}`}
        >
          {chatOpen && chatType === "ai" && (
            <AIChat
              onSwitchToLive={() => {
                setChatType("live");
                setChatOpen(true);
              }}
              onRequestLogin={() => {
                setChatOpen(false);
                setShowLoginModal(true);
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
            if (chatOpen) setChatType("ai");
          }}
        >
          {chatOpen ? <X size={20} /> : <MessageCircle size={20} />}
        </button>
      </div>

      <Modal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} />
    </div>
  );
};

export default Home;