import React, { useRef, useEffect, useState, useCallback } from "react";
import { FaceMesh } from "@mediapipe/face_mesh";
import { Camera } from "@mediapipe/camera_utils";
import { HairConsultAPI } from "~/apis/hairConsultAPI";
import styles from "./FaceCamera.module.scss";

const COUNTDOWN_START = 3;

const FaceCamera = ({ visible, onClose, onCapture }) => {
  const videoRef         = useRef(null);
  const cameraRef        = useRef(null);
  const countdownRef     = useRef(null);
  const faceMeshRef      = useRef(null);
  const lastLandmarksRef = useRef(null);
  const uploadResolveRef = useRef(null);

  const [activeTab,        setActiveTab]        = useState("camera");
  const [displayCountdown, setDisplayCountdown] = useState(null);
  const [capturedImage,    setCapturedImage]    = useState(null);
  const [guideText,        setGuideText]        = useState("Vui lòng đưa khuôn mặt vào khung quét");
  const [isReady,          setIsReady]          = useState(false);
  const [isWarning,        setIsWarning]        = useState(false);
  const [isAnalyzing,      setIsAnalyzing]      = useState(false);

  // =====================
  // VALIDATE LANDMARKS (MediaPipe — local, nhanh)
  // =====================
  const checkLandmarks = (lm, mode = "camera") => {
    const eyeDy      = Math.abs(lm[33].y - lm[263].y);
    const noseDx     = Math.abs(lm[1].x - (lm[33].x + lm[263].x) / 2);
    const foreheadY  = Math.min(...[10, 67, 71, 63, 105, 66, 107, 55].map(i => lm[i].y));
    const foreheadOK = foreheadY < 0.38;

    if (!foreheadOK) {
      return { ok: false, msg: "Vui lòng vén tóc lên để lộ rõ vùng trán" };
    }

    if (mode === "camera") {
      const W = 500, H = 375;
      const noseX    = lm[1].x * W;
      const noseY    = lm[1].y * H;
      const inFrame  = noseX > 170 && noseX < 330 && noseY > 110 && noseY < 270;
      const straight = Math.abs((lm[33].y - lm[263].y) * H) < 8 &&
                       Math.abs(noseX - ((lm[33].x + lm[263].x) / 2) * W) < 7;
      if (!inFrame || !straight) {
        return { ok: false, msg: "Giữ đầu thẳng và di chuyển mặt vào tâm khung quét" };
      }
    } else {
      const straight = eyeDy < 0.03 && noseDx < 0.025;
      if (!straight) {
        return { ok: false, msg: "Khuôn mặt bị nghiêng hoặc quay ngang — hãy chọn ảnh nhìn thẳng" };
      }
    }

    return { ok: true, msg: "" };
  };

  // =====================
  // VALIDATE FACE++ (backend — chính xác hơn)
  // =====================
  const validateWithFacePP = async (imageDataUrl, source) => {
    setIsAnalyzing(true);
    setGuideText("Đang xác thực ảnh...");

    try {
      // Convert base64 → File
      const blob = await fetch(imageDataUrl).then(r => r.blob());
      const file = new File([blob], "face.jpg", { type: "image/jpeg" });

      const result = await HairConsultAPI.validateFace(file);

      // Pass — gọi onCapture
      if (result?.data?.valid) {
        setIsAnalyzing(false);
        setGuideText("✓ Xác thực thành công!");
        onCapture?.({ image: imageDataUrl, meta: { source, ...result.data.meta } });
        return;
      }

      // Không nên vào đây nhưng handle cho chắc
      throw { errors: ["Ảnh không hợp lệ"] };

    } catch (error) {
      setIsAnalyzing(false);
      setCapturedImage(null);
      countdownRef.current = null;
      setDisplayCountdown(null);
      setIsReady(false);
      setIsWarning(true);

      // Lấy message lỗi từ backend
      const errors  = error?.errors || error?.error?.details || [];
      const message = errors[0] || "Ảnh không hợp lệ, vui lòng thử lại";
      setGuideText(message);

      // Restart camera nếu đang ở tab camera
      if (source === "live_camera") {
        setGuideText(`${message} — Chuẩn bị lại và giữ nguyên vị trí`);
      }
    }
  };

  // =====================
  // STOP CAMERA
  // =====================
  const stopCamera = useCallback(() => {
    try {
      cameraRef.current?.stop();
      cameraRef.current = null;
      videoRef.current?.srcObject?.getTracks()?.forEach(t => t.stop());
      if (videoRef.current) videoRef.current.srcObject = null;
    } catch {}
  }, []);

  // =====================
  // KHỞI TẠO FACEMESH
  // =====================
  useEffect(() => {
    if (!visible) return;
    let mounted = true;

    const faceMesh = new FaceMesh({
      locateFile: file => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`,
    });
    faceMesh.setOptions({
      maxNumFaces: 1,
      refineLandmarks: true,
      minDetectionConfidence: 0.7,
      minTrackingConfidence: 0.7,
    });

    faceMesh.onResults(results => {
      if (!mounted) return;

      // ── LUỒNG UPLOAD ──
      if (uploadResolveRef.current) {
        const resolve = uploadResolveRef.current;
        uploadResolveRef.current = null;
        if (!results.multiFaceLandmarks?.length) {
          resolve({ ok: false, msg: "Không tìm thấy khuôn mặt trong ảnh — hãy chọn ảnh khác" });
          return;
        }
        resolve(checkLandmarks(results.multiFaceLandmarks[0], "upload"));
        return;
      }

      // ── LUỒNG CAMERA ──
      if (activeTab !== "camera" || !videoRef.current) return;

      if (!results.multiFaceLandmarks?.length) {
        lastLandmarksRef.current = null;
        countdownRef.current     = null;
        setDisplayCountdown(null);
        setIsReady(false);
        setIsWarning(true);
        setGuideText("Không tìm thấy khuôn mặt — hãy nhìn thẳng vào camera");
        return;
      }

      const lm    = results.multiFaceLandmarks[0];
      lastLandmarksRef.current = lm;
      const check = checkLandmarks(lm, "camera");

      if (!check.ok) {
        setIsReady(false);
        setIsWarning(true);
        setGuideText(check.msg);
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
    });

    faceMeshRef.current = faceMesh;

    if (activeTab === "camera" && !capturedImage) {
      (async () => {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: "user", width: 640, height: 480 },
          });
          if (!mounted || !videoRef.current) return;
          videoRef.current.srcObject = stream;
          await videoRef.current.play();

          cameraRef.current = new Camera(videoRef.current, {
            onFrame: async () => {
              if (videoRef.current && faceMeshRef.current) {
                await faceMeshRef.current.send({ image: videoRef.current });
              }
            },
            width: 500,
            height: 375,
          });
          cameraRef.current.start();
        } catch {
          setGuideText("Không thể mở camera — hãy chuyển sang tab 'Tải ảnh lên'");
          setIsWarning(true);
        }
      })();
    }

    return () => {
      mounted = false;
      stopCamera();
    };
  }, [visible, activeTab, capturedImage]);

  // =====================
  // ĐẾM NGƯỢC → CHỤP → VALIDATE FACE++
  // =====================
  useEffect(() => {
    if (countdownRef.current === null) return;

    const timer = setTimeout(async () => {
      if (countdownRef.current === 0) {
        if (videoRef.current && lastLandmarksRef.current) {
          // Chụp frame
          const canvas  = document.createElement("canvas");
          canvas.width  = videoRef.current.videoWidth  || 640;
          canvas.height = videoRef.current.videoHeight || 480;
          const ctx     = canvas.getContext("2d");
          ctx.translate(canvas.width, 0);
          ctx.scale(-1, 1);
          ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

          const imgData = canvas.toDataURL("image/jpeg", 0.92);
          stopCamera();
          setCapturedImage(imgData);
          countdownRef.current = null;
          setDisplayCountdown(null);

          // ← Validate Face++ sau khi chụp
          await validateWithFacePP(imgData, "live_camera");
        }
        return;
      }
      countdownRef.current -= 1;
      setDisplayCountdown(countdownRef.current);
    }, 1000);

    return () => clearTimeout(timer);
  }, [displayCountdown, stopCamera]);

  // =====================
  // UPLOAD ẢNH → VALIDATE FACE++
  // =====================
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setIsWarning(true);
      setGuideText("Ảnh quá lớn! Vui lòng chọn ảnh dưới 5MB");
      return;
    }

    setIsAnalyzing(true);
    setIsWarning(false);
    setGuideText("AI đang kiểm tra ảnh...");

    const imgDataUrl = await new Promise(resolve => {
      const reader = new FileReader();
      reader.onload  = ev => resolve(ev.target.result);
      reader.readAsDataURL(file);
    });

    const img = await new Promise((resolve, reject) => {
      const i   = new Image();
      i.onload  = () => resolve(i);
      i.onerror = reject;
      i.src     = imgDataUrl;
    });

    // Bước 1 — MediaPipe check local (nhanh)
    const localResult = await new Promise(resolve => {
      uploadResolveRef.current = resolve;
      faceMeshRef.current.send({ image: img });
    });

    if (!localResult.ok) {
      setIsAnalyzing(false);
      setIsWarning(true);
      setIsReady(false);
      setGuideText(localResult.msg);
      e.target.value = "";
      return;
    }

    // Bước 2 — Face++ check backend (chính xác)
    setCapturedImage(imgDataUrl);
    await validateWithFacePP(imgDataUrl, "user_upload");
    e.target.value = "";
  };

  // =====================
  // ĐỔI TAB
  // =====================
  const handleTabChange = (tab) => {
    stopCamera();
    setCapturedImage(null);
    countdownRef.current = null;
    setDisplayCountdown(null);
    setIsReady(false);
    setIsWarning(false);
    setIsAnalyzing(false);
    setGuideText(
      tab === "camera"
        ? "Vui lòng đưa khuôn mặt vào khung quét"
        : "Hãy chọn ảnh chân dung nhìn thẳng, lộ rõ trán"
    );
    setActiveTab(tab);
  };

  if (!visible) return null;

  return (
    <div className={styles.cameraOverlay}>
      <div className={styles.modalCard}>

        {/* TABS */}
        {!capturedImage && (
          <div className={styles.tabSwitcher}>
            <button
              className={activeTab === "camera" ? styles.activeTab : ""}
              onClick={() => handleTabChange("camera")}
            >
              📷 Chụp trực tiếp
            </button>
            <button
              className={activeTab === "upload" ? styles.activeTab : ""}
              onClick={() => handleTabChange("upload")}
            >
              🖼️ Tải ảnh lên
            </button>
          </div>
        )}

        <div className={styles.scannerContainer}>

          {/* GUIDE BANNER */}
          <div className={`
            ${styles.guideBanner}
            ${isWarning   ? styles.warning   : ""}
            ${isReady && !isAnalyzing ? styles.success : ""}
            ${isAnalyzing ? styles.analyzing : ""}
          `}>
            {isAnalyzing
              ? <><span className={styles.spinner} /> {guideText}</>
              : <p>{guideText}</p>
            }
          </div>

          {/* CAMERA */}
          {activeTab === "camera" && !capturedImage && (
            <video ref={videoRef} autoPlay muted playsInline className={styles.videoFeed} />
          )}

          {/* UPLOAD */}
          {activeTab === "upload" && !capturedImage && (
            <label className={styles.uploadZone}>
              <div className={styles.uploadIcon}>✦</div>
              <p>Kéo thả hoặc bấm để chọn ảnh</p>
              <span className={styles.uploadNote}>
                Yêu cầu: chính diện · nhìn thẳng · lộ rõ trán · dưới 5MB
              </span>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleFileUpload}
                className={styles.fileInput}
                disabled={isAnalyzing}
              />
            </label>
          )}

          {/* ẢNH ĐÃ CHỤP/UPLOAD — hiện trong lúc đang validate */}
          {capturedImage && (
            <div className={styles.previewWrapper}>
              <img
                src={capturedImage}
                alt="Đang xác thực..."
                className={`${styles.videoFeed} ${isAnalyzing ? styles.dimmed : ""}`}
              />
              {isAnalyzing && (
                <div className={styles.analyzingOverlay}>
                  <span className={styles.spinnerLarge} />
                  <p>Đang xác thực ảnh...</p>
                </div>
              )}
            </div>
          )}

          {/* KHUNG OVAL */}
          {activeTab === "camera" && !capturedImage && (
            <div className={`${styles.faceReticle} ${isReady ? styles.ready : ""}`} />
          )}

          {/* ĐẾM NGƯỢC */}
          {activeTab === "camera" && !capturedImage && displayCountdown !== null && (
            <div className={styles.countdownOverlay}>
              <div className={styles.countNumber}>{displayCountdown}</div>
            </div>
          )}

        </div>

        {/* CONTROLS */}
        <div className={styles.controlGroup}>
          <button
            className={styles.btnCancel}
            onClick={() => { stopCamera(); onClose(); }}
            disabled={isAnalyzing}
          >
            Đóng
          </button>

          {capturedImage && !isAnalyzing && (
            <button
              className={styles.btnRecapture}
              onClick={() => {
                setCapturedImage(null);
                countdownRef.current = null;
                setDisplayCountdown(null);
                setIsReady(false);
                setIsWarning(false);
                setGuideText(
                  activeTab === "camera"
                    ? "Vui lòng đưa khuôn mặt vào khung quét"
                    : "Hãy chọn ảnh chân dung nhìn thẳng, lộ rõ trán"
                );
              }}
            >
              {activeTab === "camera" ? "Chụp lại" : "Chọn ảnh khác"}
            </button>
          )}
        </div>

      </div>
    </div>
  );
};

export default FaceCamera;