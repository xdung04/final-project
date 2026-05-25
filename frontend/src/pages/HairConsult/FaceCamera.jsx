import React, { useRef, useEffect, useState } from "react";
import { FaceMesh } from "@mediapipe/face_mesh";
import { Camera } from "@mediapipe/camera_utils";
import styles from "./FaceCamera.module.scss";

const FaceCamera = ({ visible, onClose, onCapture }) => {
  const videoRef = useRef(null);
  const cameraRef = useRef(null);
  const countdownRef = useRef(null);
  const faceMeshRef = useRef(null);
  const lastLandmarksRef = useRef(null);

  // Switch giữa 2 chế độ: 'camera' hoặc 'upload'
  const [activeTab, setActiveTab] = useState("camera"); 
  const [displayCountdown, setDisplayCountdown] = useState(null);
  const [capturedImage, setCapturedImage] = useState(null);
  const [guideText, setGuideText] = useState("Vui lòng đưa khuôn mặt vào khung quét");
  const [isReady, setIsReady] = useState(false);
  const [isWarning, setIsWarning] = useState(false);
  
  // Ref đánh dấu hệ thống đang xử lý tệp ảnh tải lên
  const isUploadProcessing = useRef(false);
  const COUNTDOWN_START = 3; // Rút ngắn xuống 3 giây cho khách đỡ đợi lâu khi chụp trực tiếp

  const stopCamera = () => {
    try {
      cameraRef.current?.stop();
      cameraRef.current = null;
      videoRef.current?.srcObject?.getTracks()?.forEach((t) => t.stop());
      if (videoRef.current) videoRef.current.srcObject = null;
    } catch {}
  };

  useEffect(() => {
    if (!visible) return;
    let mounted = true;

    // Khởi tạo lõi AI nhận diện FaceMesh chung cho cả 2 chế độ
    const faceMesh = new FaceMesh({
      locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`,
    });

    faceMesh.setOptions({
      maxNumFaces: 1,
      refineLandmarks: true,
      minDetectionConfidence: 0.7,
      minTrackingConfidence: 0.7,
    });

    faceMesh.onResults((results) => {
      if (!mounted) return;

      // TRƯỜNG HỢP 1: ĐANG CHECK ẢNH TẢI LÊN (UPLOAD)
      if (isUploadProcessing.current) {
        if (!results.multiFaceLandmarks?.length) {
          setIsReady(false);
          setIsWarning(true);
          setGuideText("Không tìm thấy khuôn mặt trong ảnh! Vui lòng chọn ảnh khác.");
          setCapturedImage(null);
          return;
        }

        const lm = results.multiFaceLandmarks[0];
        // Tính toán ma trận dựa trên tỉ lệ chuẩn hóa gốc của ảnh tải lên
        const foreheadIndexes = [10, 67, 71, 63, 105, 66, 107, 55];
        const foreheadOK = Math.min(...foreheadIndexes.map(i => lm[i].y)) < 0.38;

        const eyeDy = Math.abs(lm[33].y - lm[263].y);
        const noseDx = Math.abs(lm[1].x - (lm[33].x + lm[263].x) / 2);
        const isStraight = eyeDy < 0.03 && noseDx < 0.025;

        if (!foreheadOK) {
          setIsReady(false);
          setIsWarning(true);
          setGuideText("Ảnh từ chối: Vùng trán bị tóc che khuất, không thể đo dáng mặt!");
          setCapturedImage(null);
        } else if (!isStraight) {
          setIsReady(false);
          setIsWarning(true);
          setGuideText("Ảnh từ chối: Khuôn mặt bị nghiêng hoặc quay ngang. Hãy chọn ảnh nhìn thẳng!");
          setCapturedImage(null);
        } else {
          // Ảnh hợp lệ tuyệt đối
          setIsWarning(false);
          setIsReady(true);
          setGuideText("Ảnh tải lên hợp lệ! Hệ thống đã ghi nhận cấu trúc mặt.");
        }
        isUploadProcessing.current = false;
        return;
      }

      // TRƯỜNG HỢP 2: ĐANG CHECK CAMERA LUỒNG TRỰC TIẾP
      if (activeTab === "camera" && videoRef.current) {
        if (!results.multiFaceLandmarks?.length) {
          lastLandmarksRef.current = null;
          countdownRef.current = null;
          setDisplayCountdown(null);
          setIsReady(false);
          setIsWarning(true);
          setGuideText("Không tìm thấy khuôn mặt. Hãy nhìn thẳng vào camera.");
          return;
        }

        const lm = results.multiFaceLandmarks[0];
        lastLandmarksRef.current = lm;

        const w = 500;
        const h = 375;
        const noseX = lm[1].x * w;
        const noseY = lm[1].y * h;

        const eyeDy = Math.abs((lm[33].y - lm[263].y) * h);
        const noseDx = Math.abs(noseX - ((lm[33].x + lm[263].x) / 2) * w);

        const inFrame = noseX > 170 && noseX < 330 && noseY > 110 && noseY < 270;
        const isStraight = eyeDy < 8 && noseDx < 7;
        const foreheadOK = Math.min(...[10, 67, 71, 63, 105, 66, 107, 55].map(i => lm[i].y * h)) < h * 0.38;

        if (!foreheadOK) {
          setIsReady(false);
          setIsWarning(true);
          setGuideText("Vui lòng vén tóc cao lên để lộ rõ vùng trán");
          countdownRef.current = null;
          setDisplayCountdown(null);
        } else if (!inFrame || !isStraight) {
          setIsReady(false);
          setIsWarning(true);
          setGuideText("Giữ đầu thẳng và di chuyển mặt vào tâm khung quét");
          countdownRef.current = null;
          setDisplayCountdown(null);
        } else {
          setIsWarning(false);
          setIsReady(true);
          setGuideText("Giữ nguyên vị trí, hệ thống đang quét...");

          if (!capturedImage && countdownRef.current === null) {
            countdownRef.current = COUNTDOWN_START;
            setDisplayCountdown(COUNTDOWN_START);
          }
        }
      }
    });

    faceMeshRef.current = faceMesh;

    // Chỉ khởi chạy thiết bị Camera vật lý nếu đang ở tab camera
    if (activeTab === "camera" && !capturedImage) {
      const initLiveCamera = async () => {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: "user", width: 640, height: 480 },
          });
          if (!mounted || !videoRef.current) return;
          videoRef.current.srcObject = stream;
          await videoRef.current.play();

          cameraRef.current = new Camera(videoRef.current, {
            onFrame: async () => {
              if (videoRef.current && activeTab === "camera") {
                await faceMesh.send({ image: videoRef.current });
              }
            },
            width: 500,
            height: 375,
          });
          cameraRef.current.start();
        } catch (err) {
          setGuideText("Không thể mở camera. Vui lòng chuyển sang tab 'Tải ảnh lên'.");
        }
      };
      initLiveCamera();
    }

    return () => {
      mounted = false;
      stopCamera();
    };
  }, [visible, activeTab, capturedImage]);

  // Luồng đếm ngược tự động chụp của Camera
  useEffect(() => {
    if (countdownRef.current === null) return;

    const timer = setTimeout(() => {
      if (countdownRef.current === 0) {
        if (videoRef.current && lastLandmarksRef.current) {
          const out = document.createElement("canvas");
          out.width = videoRef.current.videoWidth || 640;
          out.height = videoRef.current.videoHeight || 480;
          const ctx = out.getContext("2d");
          ctx.translate(out.width, 0);
          ctx.scale(-1, 1);
          ctx.drawImage(videoRef.current, 0, 0, out.width, out.height);

          const imgData = out.toDataURL("image/jpeg", 0.9);
          setCapturedImage(imgData);
          onCapture?.({ image: imgData, meta: { source: "live_camera" } });

          stopCamera();
          countdownRef.current = null;
          setDisplayCountdown(null);
        }
        return;
      }
      countdownRef.current -= 1;
      setDisplayCountdown(countdownRef.current);
    }, 1000);

    return () => clearTimeout(timer);
  }, [displayCountdown, onCapture]);

  // Xử lý sự kiện khi khách tải file ảnh lên từ máy
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const imgDataUrl = event.target.result;
      
      // Tạo phần tử ảnh ảo chạy ngầm để nạp dữ liệu pixel vào MediaPipe FaceMesh
      const img = new Image();
      img.src = imgDataUrl;
      img.onload = async () => {
        setGuideText("Hệ thống AI đang phân tích tệp dữ liệu ảnh...");
        setIsWarning(false);
        isUploadProcessing.current = true;
        
        // Đẩy ảnh vào lõi AI check landmark
        await faceMeshRef.current.send({ image: img });

        // Nếu qua được bộ lọc check độc quyền, cập nhật ảnh thành công lên UI dữ liệu gốc
        if (isReady || !isUploadProcessing.current) {
          setCapturedImage(imgDataUrl);
          onCapture?.({ image: imgDataUrl, meta: { source: "user_upload" } });
        }
      };
    };
    reader.readAsDataURL(file);
  };

  const handleTabChange = (tab) => {
    stopCamera();
    setCapturedImage(null);
    countdownRef.current = null;
    setDisplayCountdown(null);
    setIsReady(false);
    setIsWarning(false);
    setGuideText(tab === "camera" ? "Vui lòng đưa khuôn mặt vào khung quét" : "Hãy chọn một bức ảnh chân dung nhìn thẳng rõ mặt");
    setActiveTab(tab);
  };

  if (!visible) return null;

  return (
    <div className={styles.cameraOverlay}>
      <div className={styles.modalCard}>
        
        {/* THANH ĐIỀU HƯỚNG TABS SANG TRỌNG */}
        {!capturedImage && (
          <div className={styles.tabSwitcher}>
            <button 
              className={activeTab === "camera" ? styles.activeTab : ""} 
              onClick={() => handleTabChange("camera")}
            >
              Chụp ảnh trực tiếp
            </button>
            <button 
              className={activeTab === "upload" ? styles.activeTab : ""} 
              onClick={() => handleTabChange("upload")}
            >
              Tải ảnh từ thiết bị
            </button>
          </div>
        )}

        <div className={styles.scannerContainer}>
          {/* Banner hướng dẫn linh hoạt thông minh */}
          <div className={`${styles.guideBanner} ${isWarning ? styles.warning : ""} ${isReady && activeTab === 'upload' ? styles.success : ""}`}>
            <p>{guideText}</p>
          </div>

          {/* CHẾ ĐỘ 1: QUÉT CAMERA */}
          {activeTab === "camera" && !capturedImage && (
            <video ref={videoRef} autoPlay muted playsInline className={styles.videoFeed} />
          )}

          {/* CHẾ ĐỘ 2: KHU VỰC KÉO THẢ / TẢI ẢNH LÊN */}
          {activeTab === "upload" && !capturedImage && (
            <div className={styles.uploadZone}>
              <div className={styles.uploadIcon}>✦</div>
              <p>Kéo thả ảnh chân dung hoặc bấm vào đây để chọn</p>
              <span className={styles.uploadNote}>Yêu cầu: Ảnh chính diện, nhìn thẳng, không che trán</span>
              <input type="file" accept="image/*" onChange={handleFileUpload} className={styles.fileInput} />
            </div>
          )}

          {/* HIỂN THỊ KẾT QUẢ ẢNH ĐÃ ĐƯỢC AI PHÊ DUYỆT */}
          {capturedImage && (
            <img src={capturedImage} alt="AI Approved Face" className={styles.videoFeed} />
          )}

          {/* Khung Oval mạ vàng định vị (Chỉ hiện khi quét camera thực tế) */}
          {activeTab === "camera" && !capturedImage && (
            <div className={`${styles.faceReticle} ${isReady ? styles.ready : ""}`} />
          )}

          {/* Hiệu ứng đếm ngược thời gian thực */}
          {activeTab === "camera" && !capturedImage && displayCountdown !== null && (
            <div className={styles.countdownOverlay}>
              <div className={styles.countNumber}>{displayCountdown}</div>
            </div>
          )}
        </div>

        {/* KHỐI ĐIỀU KHIỂN NÚT CHÂN MÀN HÌNH */}
        <div className={styles.controlGroup}>
          <button
            className={styles.btnCancel}
            onClick={() => {
              stopCamera();
              onClose();
            }}
          >
            Đóng cửa sổ
          </button>

          {capturedImage && (
            <button
              className={styles.btnRecapture}
              onClick={() => {
                setCapturedImage(null);
                countdownRef.current = null;
                setDisplayCountdown(null);
                setIsReady(false);
                if (activeTab === "camera") {
                  setGuideText("Vui lòng đưa khuôn mặt vào khung quét");
                } else {
                  setGuideText("Hãy chọn một bức ảnh chân dung nhìn thẳng rõ mặt");
                }
              }}
            >
              {activeTab === "camera" ? "Chụp lại ảnh" : "Chọn ảnh khác"}
            </button>
          )}
        </div>

      </div>
    </div>
  );
};

export default FaceCamera;