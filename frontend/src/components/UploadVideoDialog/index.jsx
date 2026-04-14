import React, { useState, useEffect } from "react";
import styles from "./UploadVideoDialog.module.scss";
import { uploadReel } from "~/services/reelService";
import { getHashtags } from "~/services/hashtagService";
import { useAuth } from "~/context/AuthContext";

function UploadVideoDialog({ open, onClose, onUpload }) {
  const { accessToken,user, isLogin } = useAuth();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [videoFile, setVideoFile] = useState(null);
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const idBarber = user.idUser;

  useEffect(() => {
    const match = title.match(/#(\w+)$/);
    if (match && match[1]) {
      const query = match[1];
      getHashtags(query)
        .then(setSuggestions)
        .catch(() => setSuggestions([]));
    } else {
      setSuggestions([]);
    }
  }, [title]);

  // ✅ Khi chọn hashtag trong danh sách
  const handleSelectHashtag = (tag) => {
    setTitle((prev) => prev.replace(/#\w*$/, `#${tag.name} `));
    setSuggestions([]);
  };

  if (!open) return null;

  const handleSubmit = async () => {
    if (!videoFile) {
      alert("Vui lòng chọn video!");
      return;
    }

    // ✅ Kiểm tra thời lượng video
    const videoUrl = URL.createObjectURL(videoFile);
    const tempVideo = document.createElement("video");
    tempVideo.src = videoUrl;

    tempVideo.onloadedmetadata = async () => {
      if (tempVideo.duration > 90) {
        alert("Video quá dài! Vui lòng chọn video dưới 1 phút 30 giây.");
        URL.revokeObjectURL(videoUrl); // giải phóng bộ nhớ
        return;
      }

      if (!accessToken) {
        alert("Vui lòng đăng nhập để tải video lên!");
        return;
      }

      setLoading(true);

      const extractedTags = Array.from(
        new Set(title.match(/#(\w+)/g)?.map((t) => t.slice(1)) || [])
      );

      const formData = new FormData();
      formData.append("video", videoFile);
      if (thumbnailFile) formData.append("thumbnail", thumbnailFile);
      formData.append("title", title);
      formData.append("description", description);
      formData.append("idBarber", idBarber); 
      formData.append("hashtags", JSON.stringify(extractedTags));

      try {
        const newReel = await uploadReel(formData, accessToken);
        onUpload(newReel);
        onClose();
      } catch (err) {
        console.error(err);
        alert("Lỗi khi upload video. Vui lòng kiểm tra lại thông tin và đăng nhập.");
      } finally {
        setLoading(false);
        URL.revokeObjectURL(videoUrl); // giải phóng bộ nhớ
      }
    };

    tempVideo.onerror = () => {
      alert("Không thể đọc video. Vui lòng thử lại với file khác.");
      URL.revokeObjectURL(videoUrl);
    };
  };


  return (
    <div className={styles.overlay}>
      <div className={styles.dialog}>
        <div className={styles.header}>
          <h2>Tải lên video tay nghề</h2>
          <button className={styles.closeBtn} onClick={onClose} disabled={loading}>
            ✕
          </button>
        </div>
        <p className={styles.description}>Chia sẻ kỹ năng và thu hút khách hàng mới</p>

        <div className={styles.body}>
          <div className={styles.formGroup} style={{ position: "relative" }}>
            <label>Tiêu đề video</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={loading}
            />
            {/* ✅ Hiển thị gợi ý hashtag */}
            {suggestions.length > 0 && (
              <ul className={styles.suggestionList}>
                {suggestions.map((tag) => (
                  <li key={tag.idHashtag} onClick={() => handleSelectHashtag(tag)}>
                    #{tag.name}
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className={styles.formGroup}>
            <label>Mô tả</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={loading}
            />
          </div>
          <div className={styles.formGroup}>
            <label>Chọn video</label>
            <input
              type="file"
              accept="video/*"
              onChange={(e) => setVideoFile(e.target.files[0])}
              disabled={loading}
            />
            {videoFile && <p className={styles.fileName}>{videoFile.name}</p>}
          </div>
          <div className={styles.formGroup}>
            <label>Chọn thumbnail (tùy chọn)</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setThumbnailFile(e.target.files[0])}
              disabled={loading}
            />
            {thumbnailFile && <p className={styles.fileName}>{thumbnailFile.name}</p>}
          </div>
        </div>

        <div className={styles.footer}>
          <button className={styles.cancelBtn} onClick={onClose} disabled={loading}>
            Hủy
          </button>
          <button className={styles.submitBtn} onClick={handleSubmit} disabled={loading}>
            {loading ? "Đang tải..." : "Tải lên"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default UploadVideoDialog;
