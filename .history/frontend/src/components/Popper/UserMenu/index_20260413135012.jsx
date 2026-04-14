import { useState, useRef } from "react";
import Tippy from "@tippyjs/react/headless";
import classNames from "classnames/bind";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useAuth } from "~/context/AuthContext"; 
import { useNavigate } from "react-router-dom";

import styles from "./UserMenu.module.scss";
import { Wrapper as PopperWrapper } from "~/components/Popper";
import {
  faCalendar,
  faRightFromBracket,
  faUserCircle,
  faDashboard,
  faCalendarCheck,
  faTicket,
  faUserTie,
} from "@fortawesome/free-solid-svg-icons";
import { faGoogle } from "@fortawesome/free-brands-svg-icons"; // Dùng icon Google cho Calendar

const cx = classNames.bind(styles);

function UserMenu({ children }) {
  const { logout, user } = useAuth();
  const [visible, setVisible] = useState(false);
  const triggerRef = useRef();
  const navigate = useNavigate();

  const hideMenu = () => setVisible(false);
  const toggleMenu = () => setVisible((prev) => !prev);

  const handleLogout = () => {
    logout();
    navigate("/");
    hideMenu();
  };

  // Map role → menu items
  const menuItemsByRole = {
    customer: [
      { icon: faUserCircle, label: "Hồ sơ cá nhân", onClick: () => navigate("/profile") },
      { icon: faCalendar, label: "Lịch hẹn của tôi", onClick: () => navigate("/booking-history") },
      { icon: faTicketIcon, label: "Kho Voucher", onClick: () => navigate("/my-vouchers") },
      { 
        icon: faGoogle, 
        label: "Đồng bộ Google Calendar", 
        onClick: () => window.open("https://calendar.google.com", "_blank"), // Thay bằng logic đồng bộ của bạn
        className: cx('google-btn') 
      },
    ],
    barber: [
      { icon: faDashboard, label: "Không gian làm việc", onClick: () => navigate("/tho-cat-toc") },
      { icon: faCalendarCheck, label: "Lịch cắt hôm nay", onClick: () => navigate("/tho-cat-toc/schedule") },
    ],
    receptionist: [
      { icon: faDashboard, label: "Quầy lễ tân", onClick: () => navigate("/receptionist") },
      { icon: faCalendar, label: "Quản lý lịch hẹn", onClick: () => navigate("/receptionist/bookings") },
    ],
    branch_manager: [
      { icon: faUserTie, label: "Quản lý chi nhánh", onClick: () => navigate("/admin/branch-management") },
      { icon: faDashboard, label: "Báo cáo doanh thu", onClick: () => navigate("/admin/reports") },
    ],
    admin: [
      { icon: faDashboard, label: "Quản trị hệ thống", onClick: () => navigate("/admin") },
    ],
  };

  const renderResult = (attrs) => (
    <div className={cx("menu-list")} tabIndex="-1" {...attrs}>
      <PopperWrapper className={cx("menu-popper")}>
        <div className={cx("menu-body")}>
          <div className={cx("body")}>
            {/* Thêm check user?.role để tránh crash nếu chưa kịp load user */}
            {(menuItemsByRole[user?.role] || []).map((item, idx) => (
              <button
                key={idx}
                className={cx("menu-item", item.className)}
                onClick={() => { item.onClick(); hideMenu(); }}
              >
                <FontAwesomeIcon icon={item.icon} className={cx('icon')} />
                <div>{item.label}</div>
              </button>
            ))}
          </div>

          <div className={cx("footer")}>
            <button className={cx("menu-item", "logout-btn")} onClick={handleLogout}>
              <FontAwesomeIcon icon={faRightFromBracket} />
              <div>Đăng xuất</div>
            </button>
          </div>
        </div>
      </PopperWrapper>
    </div>
  );

  return (
    <div ref={triggerRef}>
      <Tippy
        interactive
        visible={visible}
        placement="bottom-end"
        onClickOutside={hideMenu}
        render={renderResult}
      >
        <div onClick={toggleMenu} style={{ cursor: 'pointer' }}>
            {children}
        </div>
      </Tippy>
    </div>
  );
}

export default UserMenu;