import { useState } from "react";
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
  faTicket,
  faCalendarCheck,
  faUserTie,
} from "@fortawesome/free-solid-svg-icons";
import { faGoogle } from "@fortawesome/free-brands-svg-icons";

const cx = classNames.bind(styles);

function UserMenu({ children }) {
  const { logout, user } = useAuth();
  const [visible, setVisible] = useState(false);
  const navigate = useNavigate();

  const hideMenu = () => setVisible(false);
  const toggleMenu = () => setVisible((prev) => !prev);

  const handleLogout = () => {
    logout();
    navigate("/");
    hideMenu();
  };

  // Cấu hình Menu theo Role
  const menuItemsByRole = {
    customer: [
      { icon: faUserCircle, label: "Hồ sơ cá nhân", onClick: () => navigate("/profile") },
      { icon: faCalendar, label: "Lịch hẹn của tôi", onClick: () => navigate("/booking-history") },
      { icon: faTicket, label: "Kho Voucher", onClick: () => navigate("/my-vouchers") },
      { 
        icon: faGoogle, 
        label: "Đồng bộ Google Calendar", 
        onClick: () => window.open("https://calendar.google.com", "_blank"),
        className: cx('google-sync')
      },
    ],
    barber: [
      { icon: faDashboard, label: "Không gian làm việc", onClick: () => navigate("/tho-cat-toc") },
    ],
    receptionist: [
      { icon: faDashboard, label: "Quầy lễ tân", onClick: () => navigate("/receptionist") },
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
            {(menuItemsByRole[user?.role] || []).map((item, idx) => (
              <button
                key={idx}
                className={cx("menu-item", item.className)}
                onClick={() => { item.onClick(); hideMenu(); }}
              >
                <FontAwesomeIcon icon={item.icon} className={cx('icon')} />
                <div className={cx('label')}>{item.label}</div>
              </button>
            ))}
          </div>

          <div className={cx("footer")}>
            <button className={cx("menu-item", "logout")} onClick={handleLogout}>
              <FontAwesomeIcon icon={faRightFromBracket} />
              <div className={cx('label')}>Đăng xuất</div>
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
      <div onClick={toggleMenu} style={{ cursor: 'pointer' }}>
        {children}
      </div>
    </Tippy>
  );
}

export default UserMenu;