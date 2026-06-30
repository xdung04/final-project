import { useState } from "react";
import Tippy from "@tippyjs/react/headless";
import classNames from "classnames/bind";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useAuth } from "~/context/AuthContext";
import { useNavigate } from "react-router-dom";
import * as chatService from "~/services/chatService";
import styles from "./UserMenu.module.scss";
import { Wrapper as PopperWrapper } from "~/components/Popper";
import {
  faCalendar,
  faRightFromBracket,
  faUserCircle,
  faDashboard,
  faTicket,
  faCalendarCheck,
  faUserTie,
} from "@fortawesome/free-solid-svg-icons";
import { faGoogle } from "@fortawesome/free-brands-svg-icons";

// Import component GoogleCalendarSync
import GoogleCalendarSync from "~/components/GoogleCalendarSync";

const cx = classNames.bind(styles);

function UserMenu({ children }) {
  const { logout, user } = useAuth();
  const [visible, setVisible] = useState(false);
  const navigate = useNavigate();

  const hideMenu = () => setVisible(false);
  const toggleMenu = () => setVisible((prev) => !prev);

const handleLogout = async () => {
    try {
      // 1. Chỉ gọi API đóng phòng đối với tài khoản có quyền "customer" (Khách hàng chat)
      if (user?.role === "customer") {
        // 🌟 BỔ SUNG QUAN TRỌNG: Chủ động dọn sạch sành sanh sessionStorage của Chat ngay tại đây
        // Tránh việc component AIChat bị unmount quá nhanh không kịp chạy useEffect reset.
        sessionStorage.removeItem("chatMessages");
        sessionStorage.removeItem("chatSessionId");
        sessionStorage.removeItem("chatSessionOwner");
        sessionStorage.removeItem("chatConversationId"); // Giết ID phòng
        sessionStorage.removeItem("chatMode");           // Giết chế độ Live
        
        console.log("🧹 [UserMenu] Đã chủ động dọn dẹp sạch sẽ Storage Chat của Khách.");
        
        await chatService.closeConversationOnLogout();
      }
    } catch (err) {
      console.error("⚠️ Lỗi dọn dẹp phòng chat khi khách logout:", err);
    } finally {
      // 2. Dù API thành công hay lỗi, vẫn phải cho khách logout hoàn toàn ở client
      logout();
      navigate("/");
      hideMenu();
    }
  };

  // Cấu hình Menu theo Role
  const menuItemsByRole = {
    customer: [
      {
        icon: faUserCircle,
        label: "Hồ sơ cá nhân",
        onClick: () => navigate("/profile"),
      },
      {
        icon: faCalendar,
        label: "Lịch hẹn của tôi",
        onClick: () => navigate("/booking-history"),
      },
      {
        icon: faTicket,
        label: "Kho Voucher ",
        onClick: () => navigate("/my-vouchers"),
      },
      {
        component: (
          <GoogleCalendarSync onCloseMenu={hideMenu} isMenuOpen={visible} />
        ),
        className: cx("google-sync"),
      },
    ],
    barber: [
      {
        icon: faDashboard,
        label: "Không gian làm việc",
        onClick: () => navigate("/tho-cat-toc"),
      },
    ],
    receptionist: [
      {
        icon: faDashboard,
        label: "Quầy lễ tân",
        onClick: () => navigate("/receptionist"),
      },
    ],
    admin: [
      {
        icon: faDashboard,
        label: "Quản trị hệ thống",
        onClick: () => navigate("/admin"),
      },
    ],
  };

  const renderResult = (attrs) => (
    <div className={cx("menu-list")} tabIndex="-1" {...attrs}>
      <PopperWrapper className={cx("menu-popper")}>
        <div className={cx("menu-body")}>
          <div className={cx("body")}>
            {menuItemsByRole[user?.role]?.map((item, idx) =>
              item.component ? (
                // Nếu là component thì render trực tiếp
                <div key={idx} className={cx("menu-item", item.className)}>
                  {item.component}
                </div>
              ) : (
                <button
                  key={idx}
                  className={cx("menu-item", item.className)}
                  onClick={() => {
                    item.onClick();
                    hideMenu();
                  }}
                >
                  <FontAwesomeIcon icon={item.icon} className={cx("icon")} />
                  <div className={cx("label")}>{item.label}</div>
                </button>
              ),
            )}
          </div>

          <div className={cx("footer")}>
            <button
              className={cx("menu-item", "logout")}
              onClick={handleLogout}
            >
              <FontAwesomeIcon icon={faRightFromBracket} />
              <div className={cx("label")}>Đăng xuất</div>
            </button>
          </div>
        </div>
      </PopperWrapper>
    </div>
  );

  return (
    <Tippy
      interactive
      visible={visible}
      placement="bottom-end"
      onClickOutside={hideMenu}
      render={renderResult}
    >
      <div onClick={toggleMenu} style={{ cursor: "pointer" }}>
        {children}
      </div>
    </Tippy>
  );
}

export default UserMenu;
