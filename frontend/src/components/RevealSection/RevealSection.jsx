import React, { useRef, useState, useEffect } from "react";
import styles from "./RevealSection.module.scss";

const RevealSection = ({ children, className, style }) => {
  const ref = useRef();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting); // true khi vào viewport, false khi ra
      },
      { threshold: 0.2 }
    );

    if (ref.current) observer.observe(ref.current);

    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`${className} ${isVisible ? styles.revealActive : styles.reveal}`}
      style={style} // <--- thêm dòng này để backgroundImage hoạt động
    >
      {children}
    </div>
  );
};

export default RevealSection;
