import React, { useRef, useState } from "react";
import classNames from "classnames/bind";
import styles from "./UploadPhotos.module.scss";
import { Upload, Image as ImageIcon } from "lucide-react";

const cx = classNames.bind(styles);

function UploadPhotos({ onUpload }) {
  const fileInputRef = useRef(null);
  const [files, setFiles] = useState([]);

  const handleFileChange = (e) => {
    const newFiles = Array.from(e.target.files);
    setFiles((prev) => [...prev, ...newFiles]);
    if (onUpload) onUpload(newFiles);
  };

  return (
    <div className={cx("wrapper")}>
      <input
        type="file"
        ref={fileInputRef}
        multiple
        accept="image/*"
        className={cx("input")}
        onChange={handleFileChange}
      />
      <button
        className={cx("btn")}
        onClick={() => fileInputRef.current.click()}
      >
        <Upload size={16} /> Upload ảnh
      </button>
      <div className={cx("preview")}>
        {files.map((file, idx) => (
          <img
            key={idx}
            src={URL.createObjectURL(file)}
            alt={`upload-${idx}`}
            className={cx("thumb")}
          />
        ))}
      </div>
    </div>
  );
}

export default UploadPhotos;