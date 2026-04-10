import { useState } from "react";
import Login from "./Login";
import Register from "./Register";
import ForgetPass from "./ForgetPass";
import NewPass from "./NewPass";
import AddPhone from "./AddPhone";           // ← MỚI
import styles from "./Modal.module.scss";
import classNames from "classnames/bind";

const cx = classNames.bind(styles);

function Modal({ isOpen, onClose }) {
  const [modalType, setModalType] = useState("login");
  const [modalData, setModalData] = useState({});

  const handleSwitch = (type, data = {}) => {
    setModalType(type);
    setModalData(data);
  };

  const handleLoginSuccess = () => {
    setModalType(null);
    if (onClose) onClose();
  };

  const renderModalContent = () => {
    switch (modalType) {
      case "register":
        return <Register onSwitch={handleSwitch} onClose={onClose} />;
      case "forgetpass":
        return <ForgetPass onSwitch={handleSwitch} />;
      case "newpass":
        return <NewPass onSwitch={handleSwitch} email={modalData.email} />;
      case "add-phone":
        return (
          <AddPhone
            onClose={onClose}
            onSuccess={handleLoginSuccess}
            initialData={modalData}
          />
        );
      default:
        return <Login onSwitch={handleSwitch} onClose={onClose} onLoginSuccess={handleLoginSuccess} />;
    }
  };

  if (!isOpen) return null;

  return (
    <div className={cx("overlay")} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={cx("modal")} onClick={(e) => e.stopPropagation()}>
        <button className={cx("close")} onClick={onClose}>×</button>
        {renderModalContent()}
      </div>
    </div>
  );
}

export default Modal;