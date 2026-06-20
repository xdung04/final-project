import React, { useState, useRef, useEffect } from "react";
import classNames from "classnames/bind";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronDown } from "@fortawesome/free-solid-svg-icons";
import { faBell } from "@fortawesome/free-regular-svg-icons";

import styles from "./Header.module.scss";
import Button from "~/components/Button";
import Modal from "~/components/Modal";
import UserMenu from "~/components/Popper/UserMenu";
import { useAuth } from "~/context/AuthContext";
import { useToast } from "~/context/ToastContext"; // 🌟 ĐÃ THÊM: Gọi ToastContext để bắn alert xịn
import { fetchMyNotifications, markNotificationAsRead } from "~/services/notificationService";

const cx = classNames.bind(styles);

function Header() {
  const [showModal, setShowModal] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { user, isLogin } = useAuth(); 
  const { showToast } = useToast(); // 🌟 ĐÃ THÊM: Sử dụng bộ Toast của hệ thống

  const [showNotify, setShowNotify] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loadingNotify, setLoadingNotify] = useState(false);

  const [selectedNotification, setSelectedNotification] = useState(null);

  const notifyRef = useRef(null);
  const dialogRef = useRef(null);

  // ==================== 🌟 XỬ LÝ CỜ HẾT HẠN PHIÊN ĐĂNG NHẬP ====================
  useEffect(() => {
    // 1. Kiểm tra xem sau khi F5, máy người dùng có "Cờ báo tử token" không
    const isExpired = localStorage.getItem("SESSION_EXPIRED_FLAG");

    if (isExpired) {
      // 2. Ép mở Modal Đăng nhập lên ngay lập tức
      setShowModal(true);

      // 3. Bắn chiếc Toast thông báo lịch sự tới người dùng
      showToast({
        text: "🔒 Phiên làm việc của bạn đã hết hạn. Vui lòng đăng nhập lại!",
        type: "warning", // Hoặc "error" tùy màu sắc bộ Toast của anh
      });

      // 
      localStorage.removeItem("SESSION_EXPIRED_FLAG");
    }
  }, [showToast]);
  // ============================================================================

  // Hiệu ứng cuộn chuột (Scroll)
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Fetch thông báo
  useEffect(() => {
    if (isLogin ) {
      loadNotifications();
    } else {
      setNotifications([]);
      setUnreadCount(0);
    }
  }, [isLogin]);

  const loadNotifications = async () => {
    setLoadingNotify(true);
    const { unreadCount: count, notifications: list } = await fetchMyNotifications();
    setUnreadCount(count);
    setNotifications(list);
    setLoadingNotify(false);
  };

  const handleNotificationClick = async (noti) => {
    setSelectedNotification(noti);
    if (!noti.isRead ) {
      const success = await markNotificationAsRead(noti.idNotification);
      if (success) {
        setNotifications((prev) =>
          prev.map((n) =>
            n.idNotification === noti.idNotification ? { ...n, isRead: true } : n
          )
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    }
  };

  useEffect(() => {
    function handleClickOutside(event) {
      if (
        notifyRef.current &&
        !notifyRef.current.contains(event.target) &&
        (!dialogRef.current || !dialogRef.current.contains(event.target))
      ) {
        setShowNotify(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <>
      <nav className={cx("nav", { scrolled })}>
        {/* LOGO MẪU */}
        <a href="/" className={cx("navLogo")}>
          <div className={cx("logoIcon")}>
            <svg viewBox="0 0 24 24"><path d="M12 2L2 22h20L12 2zm0 4.5l6.5 13.5h-13L12 6.5z"/></svg>
          </div>
          <div>
            <div className={cx("logoText")}>NOBLE</div>
            <div className={cx("logoSub")}>Barbershop</div>
          </div>
        </a>

        {/* MENU THEO THỨ TỰ */}
        <ul className={cx("navLinks")}>
          <li><Button href="/" text className={cx("menuLink")}>Trang chủ</Button></li>
          <li><Button href="/reels" text className={cx("menuLink")}>Reels</Button></li>
          <li><Button href="/team" text className={cx("menuLink")}>Thợ</Button></li>
          <li><Button href="/news" text className={cx("menuLink")}>Tin tức</Button></li>
          <li><Button href="/about" text className={cx("menuLink")}>Về chúng tôi</Button></li>
        </ul>

        {/* AUTH & NOTIFICATIONS */}
        <div className={cx("rightSection")}>
          {!isLogin ? (
            <button className={cx("navCta")} onClick={() => setShowModal(true)}>
              Đăng nhập
            </button>
          ) : (
            <>
              {/* Notifications */}
              <div className={cx("notificationWrapper")} ref={notifyRef}>
                <div className={cx("bellTrigger")} onClick={() => setShowNotify((prev) => !prev)}>
                  <FontAwesomeIcon icon={faBell} className={cx("bellIcon")} />
                  {unreadCount > 0 && (
                    <span className={cx("badge")}>{unreadCount > 99 ? "99+" : unreadCount}</span>
                  )}
                </div>

                {showNotify && (
                  <div className={cx("notifyDropdown")}>
                    <div className={cx("notifyHeader")}>Thông báo của bạn</div>
                    <div className={cx("notifyList")}>
                      {loadingNotify ? (
                        <div className={cx("notifyItem")}>Đang tải...</div>
                      ) : notifications.length === 0 ? (
                        <div className={cx("notifyItem")}>Không có thông báo</div>
                      ) : (
                        notifications.map((noti) => (
                          <div
                            key={noti.idNotification}
                            className={cx("notifyItem", { unread: !noti.isRead })}
                            onClick={() => handleNotificationClick(noti)}
                          >
                            <p className={cx("title")}>{noti.title}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* User Menu */}
              <UserMenu>
                <div className={cx("loggedUser")}>
                  <div className={cx("userAvatar")}>
                    <img src={user.image || "/user.png"} alt={user.fullName} />
                  </div>
                  <span className={cx("userName")}>{user.fullName}</span>
                  <FontAwesomeIcon icon={faChevronDown} className={cx("chevronIcon")} />
                </div>
              </UserMenu>
            </>
          )}
        </div>
      </nav>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} />

      {/* DIALOG THÔNG BÁO THEO DARK THEME */}
      {selectedNotification && (
        <div className={cx("customDialogOverlay")} onClick={() => setSelectedNotification(null)}>
          <div ref={dialogRef} className={cx("customDialog")} onClick={(e) => e.stopPropagation()}>
            <h3 className={cx("dialogTitle")}>{selectedNotification.title}</h3>
            {selectedNotification.content ? (
              <p className={cx("dialogContent")}>{selectedNotification.content}</p>
            ) : (
              <p className={cx("dialogContent", "noContent")}>Không có nội dung chi tiết.</p>
            )}
            <button className={cx("dialogCloseBtn")} onClick={() => setSelectedNotification(null)}>
              Đóng
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export default Header;