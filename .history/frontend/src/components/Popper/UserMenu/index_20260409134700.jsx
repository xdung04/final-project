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
  faGift,
  faRightFromBracket,
  faUserCircle,
  faBoxOpen,
  faDashboard,
} from "@fortawesome/free-solid-svg-icons";

const cx = classNames.bind(styles);

function UserMenu({ children }) {
  const { logout, user } = useAuth(); // Lấy user có role
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

  const handleProfileClick = () => {
    navigate("/profile");
    hideMenu();
  };

  // Map role → menu items
  const menuItemsByRole = {
    customer: [
      { icon: faUserCircle, label: "Hồ sơ cá nhân", onClick: handleProfileClick },
      { icon: faCalendar, label: "Lịch hẹn của tôi", onClick: () => navigate("/booking-history") },
    ],
    barber: [
      { icon: faBoxOpen, label: "Quản lý dịch vụ", onClick: () => navigate("/tho-cat-toc") },
    ],
    admin: [
      { icon: faDashboard, label: "Quản lý cửa hàng", onClick: () => navigate("/admin") },
    ],
  };

  const renderResult = (attrs) => (
    <div className={cx("menu-list")} tabIndex="-1" {...attrs}>
      <PopperWrapper className={cx("menu-popper")}>
        <div className={cx("menu-body")}>
          <div className={cx("body")}>
            {menuItemsByRole[user.role]?.map((item, idx) => (
              <button
                key={idx}
                className={cx("menu-item")}
                onClick={() => { item.onClick(); hideMenu(); }}
              >
                <FontAwesomeIcon icon={item.icon} />
                <div>{item.label}</div>
              </button>
            ))}
          </div>

          <div className={cx("footer")}>
            <button className={cx("menu-item")} onClick={handleLogout}>
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
        <div onClick={toggleMenu}>{children}</div>
      </Tippy>
    </div>
  );
}

export default UserMenu;
