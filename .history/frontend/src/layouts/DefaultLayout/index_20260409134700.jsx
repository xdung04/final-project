import styles from "./DefaultLayout.module.scss";
import classNames from "classnames/bind";
import PropTypes from "prop-types";

import Header from "../components/Header";
import Footer from "../components/Footer"; // <-- import Footer
const cx = classNames.bind(styles);

function DefaultLayout({ children, hideFooter }) {
  return (
    <div className={cx("wrapper")}>
      <Header />
      <div className={cx("container")}>
        <div className={cx("content")}>{children}</div>
      </div>
      {!hideFooter && <Footer />}
    </div>
  );
}


DefaultLayout.propTypes = {
  children: PropTypes.node.isRequired,
  hideFooter: PropTypes.bool, 
};

export default DefaultLayout;
