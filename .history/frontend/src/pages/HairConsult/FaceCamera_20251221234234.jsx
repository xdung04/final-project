import React, { useRef, useEffect, useState } from "react";
import { FaceMesh } from "@mediapipe/face_mesh";
import { Camera } from "@mediapipe/camera_utils";

/**
 * FaceCamera (CLEAN)
 * - Không vẽ mesh / landmark
 * - Chỉ dùng MediaPipe để detect + align
 * - Capture ảnh gốc
 */

const FaceCamera = ({ visible, onClose, onCapture }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const cameraRef = useRef(null);
  const countdownRef = useRef(null);
  const lastLandmarksRef = useRef(null);

  const [displayCountdown, setDisplayCountdown] = useState(null);
  const [capturedImage, setCapturedImage] = useState(null);
  const [foreheadVisible, setForeheadVisible] = useState(true);

  const COUNTDOWN_START = 5;

  // stop camera helper
  const stopCamera = () => {
    try {
      cameraRef.current?.stop();
      cameraRef.current = null;
      videoRef.current?.srcObject?.getTracks()?.forEach((t) => t.stop());
      if (videoRef.current) videoRef.current.srcObject = null;
    } catch {}
  };

  // init camera + mediapipe
  useEffect(() => {
    if (!visible) return;
    let mounted = true;

    const initCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user" },
        });

        if (!mounted || !videoRef.current) return;

        videoRef.current.srcObject = stream;
        await videoRef.current.play();

        const faceMesh = new FaceMesh({
          locateFile: (file) =>
            `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`,
        });

        faceMesh.setOptions({
          maxNumFaces: 1,
          refineLandmarks: true,
          minDetectionConfidence: 0.7,
          minTrackingConfidence: 0.7,
        });

        faceMesh.onResults((results) => {
          if (!mounted || !canvasRef.current || !videoRef.current) return;

          const ctx = canvasRef.current.getContext("2d");
          const w = canvasRef.current.width;
          const h = canvasRef.current.height;

          ctx.clearRect(0, 0, w, h);

          if (!results.multiFaceLandmarks?.length) {
            lastLandmarksRef.current = null;
            setForeheadVisible(false);
            countdownRef.current = null;
            setDisplayCountdown(null);
            return;
          }

          const lm = results.multiFaceLandmarks[0];
          lastLandmarksRef.current = lm;

          // =====================
          // GUIDE BOX
          // =====================
          const guideW = 150;
          const guideH = 170;
          const guideX = w / 2 - guideW / 2;
          const guideY = h / 2 - guideH / 2 - 40;

          ctx.strokeStyle = "#00ff00";
          ctx.lineWidth = 3;
          ctx.setLineDash([6]);
          ctx.strokeRect(guideX, guideY, guideW, guideH);
          ctx.setLineDash([]);

          // =====================
          // ALIGNMENT CHECK
          // =====================
          const nose = lm[1];
          const leftEye = lm[33];
          const rightEye = lm[263];

          const noseX = nose.x * w;
          const noseY = nose.y * h;
          const midX = ((leftEye.x + rightEye.x) / 2) * w;
          const eyeDy = Math.abs((leftEye.y - rightEye.y) * h);
          const noseDx = Math.abs(noseX - midX);

          const inFrame =
            noseX > guideX &&
            noseX < guideX + guideW &&
            noseY > guideY &&
            noseY < guideY + guideH;

          const isStraight = eyeDy < 10 && noseDx < 8;

          // =====================
          // FOREHEAD VISIBILITY
          // =====================
          const foreheadIndexes = [10, 67, 71, 63, 105, 66, 107, 55];
          const foreheadYs = foreheadIndexes.map((i) =>
            lm[i] ? lm[i].y * h : Infinity
          );
          const minForeheadY = Math.min(...foreheadYs);
          const foreheadOK = minForeheadY < h * 0.35;
          setForeheadVisible(foreheadOK);

          // =====================
          // COUNTDOWN LOGIC
          // =====================
          if (!capturedImage) {
            if (
              inFrame &&
              isStraight &&
              foreheadOK &&
              countdownRef.current === null
            ) {
              countdownRef.current = COUNTDOWN_START;
              setDisplayCountdown(COUNTDOWN_START);
            } else if (!inFrame || !isStraight || !foreheadOK) {
              countdownRef.current = null;
              setDisplayCountdown(null);
            }
          }

          // =====================
          // TEXT GUIDE
          // =====================
          if (!foreheadOK) {
            ctx.fillStyle = "#fff";
            ctx.font = "18px Arial";
            ctx.textAlign = "center";
            ctx.fillText(
              "Vuốt tóc lên để lộ trán",
              w / 2,
              30
            );
          }

          if (!capturedImage && countdownRef.current !== null) {
            ctx.fillStyle = "#fff";
            ctx.font = "30px Arial";
            ctx.textAlign = "center";
            ctx.fillText(
              countdownRef.current,
              w / 2,
              60
            );
          }
        });

        cameraRef.current = new Camera(videoRef.current, {
          onFrame: async () => {
            await faceMesh.send({ image: videoRef.current });
          },
          width: 500,
          height: 375,
        });

        cameraRef.current.start();
      } catch (err) {
        console.error("Camera error:", err);
      }
    };

    initCamera();

    return () => {
      mounted = false;
      countdownRef.current = null;
      setDisplayCountdown(null);
      stopCamera();
    };
  }, [visible, capturedImage]);

  // =====================
  // COUNTDOWN HANDLER
  // =====================
  useEffect(() => {
    if (countdownRef.current === null) return;

    const timer = setTimeout(() => {
      if (
        countdownRef.current === 0 &&
        videoRef.current &&
        lastLandmarksRef.current
      ) {
        const out = document.createElement("canvas");
        out.width = videoRef.current.videoWidth || 500;
        out.height = videoRef.current.videoHeight || 375;

        const ctx = out.getContext("2d");
        ctx.drawImage(videoRef.current, 0, 0, out.width, out.height);

        const imgData = out.toDataURL("image/png");
        setCapturedImage(imgData);

        onCapture?.({
          image: imgData,
          meta: {
            foreheadVisible,
            alignment: "ok",
          },
        });

        stopCamera();
        countdownRef.current = null;
        setDisplayCountdown(null);
        return;
      }

      countdownRef.current -= 1;
      setDisplayCountdown(countdownRef.current);
    }, 1000);

    return () => clearTimeout(timer);
  }, [displayCountdown, onCapture, foreheadVisible]);

  if (!visible) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: capturedImage
          ? "transparent"
          : "rgba(0,0,0,0.7)",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 9999,
      }}
    >
      <div style={{ position: "relative" }}>
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          style={{
            width: 500,
            borderRadius: 12,
            display: capturedImage ? "none" : "block",
          }}
        />
        <canvas
          ref={canvasRef}
          width={500}
          height={375}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            display: capturedImage ? "none" : "block",
          }}
        />
      </div>

      {capturedImage && (
        <img
          src={capturedImage}
          alt="captured"
          style={{
            width: 500,
            borderRadius: 12,
            marginTop: 10,
          }}
        />
      )}

      <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
        <button
          onClick={() => {
            stopCamera();
            onClose();
          }}
          style={{
            padding: "10px 16px",
            borderRadius: 8,
            backgroundColor: "#ff5555",
            color: "#fff",
            border: "none",
            cursor: "pointer",
          }}
        >
          Đóng
        </button>

        <button
          onClick={() => {
            setCapturedImage(null);
            countdownRef.current = null;
            setDisplayCountdown(null);
            setForeheadVisible(true);
          }}
          style={{
            padding: "10px 16px",
            borderRadius: 8,
            backgroundColor: "#4CAF50",
            color: "#fff",
            border: "none",
            cursor: "pointer",
          }}
        >
          Chụp lại
        </button>
      </div>
    </div>
  );
};

export default FaceCamera;
