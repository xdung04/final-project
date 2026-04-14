import React, { useRef, useEffect, useState } from "react";
import {
  FaceMesh,
  FACEMESH_TESSELATION,
  FACEMESH_LIPS,
  FACEMESH_LEFT_EYE,
  FACEMESH_RIGHT_EYE,
  FACEMESH_LEFT_EYEBROW,
  FACEMESH_RIGHT_EYEBROW,
} from "@mediapipe/face_mesh";
import { Camera } from "@mediapipe/camera_utils";
import { drawConnectors } from "@mediapipe/drawing_utils";

/**
 * FaceCamera (improved)
 * - Remove shape prediction & head-top extrapolation
 * - Use inter-eye distance as normalization baseline (more stable)
 * - Use actual detected forehead landmarks only (no prediction). If forehead landmarks are too low / occluded,
 *   overlay a prompt: "Hãy vuốt tóc lên và đặt trán trong khung".
 *
 * onCapture: ({ image, metrics }) => void
 */

const FaceCamera = ({ visible, onClose, onCapture }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const cameraRef = useRef(null);
  const countdownRef = useRef(null);
  const lastLandmarksRef = useRef(null);

  const [displayCountdown, setDisplayCountdown] = useState(null);
  const [capturedImage, setCapturedImage] = useState(null);
  const [faceMetrics, setFaceMetrics] = useState(null);
  const [foreheadVisible, setForeheadVisible] = useState(true);

  const COUNTDOWN_START = 5;

  // Utility: euclidean in pixel-space
  const d = (a, b, w, h) => (a && b ? Math.hypot((a.x - b.x) * w, (a.y - b.y) * h) : 0);
  const angleBetween = (pA, pB, pC) => {
    if (!pA || !pB || !pC) return 0;
    const v1 = { x: pA.x - pB.x, y: pA.y - pB.y };
    const v2 = { x: pC.x - pB.x, y: pC.y - pB.y };
    const dot = v1.x * v2.x + v1.y * v2.y;
    const mag1 = Math.hypot(v1.x, v1.y);
    const mag2 = Math.hypot(v2.x, v2.y);
    if (mag1 * mag2 === 0) return 0;
    const cos = Math.min(1, Math.max(-1, dot / (mag1 * mag2)));
    return (Math.acos(cos) * 180) / Math.PI;
  };

  // Calculate face metrics using only detected landmarks.
  // Normalization baseline: inter-eye distance (more robust than jaw width).
  const calculateFaceMetrics = (lm, width, height) => {
    // indices from MediaPipe FaceMesh (common ones)
    const leftEyeIdx = 33;
    const rightEyeIdx = 263;
    const chinIdx = 152; // bottom chin
    // forehead-related landmarks (use only actual detected forehead points)
    const foreheadIndexes = [10, 67, 71, 63, 105, 66, 107, 55]; // same set but we'll NOT extrapolate beyond them

    // compute pixel distances
    const interEyePx = d(lm[leftEyeIdx], lm[rightEyeIdx], width, height) || 1;
    const jawLeftIdx = 234;
    const jawRightIdx = 454;
    const jawWidthPx = d(lm[jawLeftIdx], lm[jawRightIdx], width, height) || interEyePx;

    // Forehead top = smallest y among foreheadIndexes (closest to top of image)
    const foreheadYs = foreheadIndexes.map((i) => (lm[i] ? lm[i].y * height : Infinity));
    const foreheadXs = foreheadIndexes.map((i) => (lm[i] ? lm[i].x * width : null));
    const minForeheadY = Math.min(...foreheadYs);
    const foreheadTop = { x: null, y: minForeheadY };
    // pick a forehead x by averaging those forehead points that sit near minForeheadY
    const closeIndexes = foreheadIndexes.filter((i, idx) => Math.abs(foreheadYs[idx] - minForeheadY) < 8);
    if (closeIndexes.length) {
      const avgX = closeIndexes.reduce((s, i) => s + lm[i].x * width, 0) / closeIndexes.length;
      foreheadTop.x = avgX;
    } else {
      // fallback: use landmark 10
      foreheadTop.x = lm[10] ? lm[10].x * width : width / 2;
    }

    // face_length measured from foreheadTop (actual detected) to chin
    const face_length_px = Math.hypot((foreheadTop.x - (lm[chinIdx].x * width || 0)), (foreheadTop.y - (lm[chinIdx].y * height || 0)));
    const foreheadWidthPx = (() => {
      // choose leftmost and rightmost forehead-related points to estimate width
      const xs = foreheadIndexes.map((i) => (lm[i] ? lm[i].x * width : null)).filter((x) => x !== null);
      if (xs.length >= 2) return Math.max(...xs) - Math.min(...xs);
      return foreheadWidthPx || jawWidthPx * 0.6;
    })();

    const chinLeftIdx = 199; // approximate
    const chinRightIdx = 429; // approximate
    const chinWidthPx = d(lm[199] ?? lm[152], lm[429] ?? lm[152], width, height);
    const cheekLeftIdx = 127; // approximate cheek points
    const cheekRightIdx = 356;
    const cheekWidthPx = d(lm[cheekLeftIdx] ?? lm[234], lm[cheekRightIdx] ?? lm[454], width, height);

    const jawAngle = angleBetween(lm[jawLeftIdx], lm[152], lm[jawRightIdx]);

    // normalization baseline: interEyePx (fallback to jawWidthPx)
    const base = interEyePx || jawWidthPx || 1;
    const normalize = (v) => v / base;

    // check forehead visibility: if minForeheadY is too low (i.e., forehead landmarks near bottom area) => occluded
    const foreheadVisibleFlag = minForeheadY < height * 0.35; // heuristics: forehead should be within top ~35% of frame

    return {
      foreheadVisible: foreheadVisibleFlag,
      raw: {
        interEyePx,
        face_length_px,
        jawWidthPx,
        foreheadWidthPx,
        chinWidthPx,
        cheekWidthPx,
        jawAngle,
        foreheadTop,
      },
      ratios: {
        length_to_interEye: normalize(face_length_px),
        jaw_to_interEye: normalize(jawWidthPx),
        forehead_to_interEye: normalize(foreheadWidthPx),
        chin_to_interEye: normalize(chinWidthPx || 0),
        cheek_to_interEye: normalize(cheekWidthPx || 0),
      },
    };
  };

  // Draw face mesh and only the actual forehead points (no prediction / extrapolation)
  const drawFaceWithForehead = (ctx, lm, width, height) => {
    if (!ctx || !lm) return;
    drawConnectors(ctx, lm, FACEMESH_TESSELATION, { color: "#32EEDB", lineWidth: 0.6 });
    drawConnectors(ctx, lm, FACEMESH_LIPS, { color: "#FF2C55", lineWidth: 1 });
    drawConnectors(ctx, lm, FACEMESH_LEFT_EYE, { color: "#FFD700", lineWidth: 1 });
    drawConnectors(ctx, lm, FACEMESH_RIGHT_EYE, { color: "#FFD700", lineWidth: 1 });
    drawConnectors(ctx, lm, FACEMESH_LEFT_EYEBROW, { color: "#FFA500", lineWidth: 1 });
    drawConnectors(ctx, lm, FACEMESH_RIGHT_EYEBROW, { color: "#FFA500", lineWidth: 1 });

    // Draw actual forehead landmark polyline (no extrapolation)
    const foreheadIndexes = [10, 67, 71, 63, 105, 66, 107, 55];
    const available = foreheadIndexes.filter((i) => Boolean(lm[i]));
    if (available.length >= 2) {
      ctx.beginPath();
      const p0 = lm[available[0]];
      ctx.moveTo(p0.x * width, p0.y * height);
      available.slice(1).forEach((i) => {
        const p = lm[i];
        ctx.lineTo(p.x * width, p.y * height);
      });
      ctx.strokeStyle = "rgba(0,200,120,0.95)";
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 3]);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  };

  // Stop camera helper
  const stopCamera = () => {
    try {
      cameraRef.current?.stop();
      cameraRef.current = null;
      videoRef.current?.srcObject?.getTracks()?.forEach((t) => t.stop());
      if (videoRef.current) videoRef.current.srcObject = null;
    } catch {}
  };

  // Init camera + mediapipe
  useEffect(() => {
    if (!visible) return;
    let mounted = true;

    const initCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
        if (!mounted || !videoRef.current) return;
        videoRef.current.srcObject = stream;
        await videoRef.current.play();

        const faceMesh = new FaceMesh({ locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}` });
        faceMesh.setOptions({ maxNumFaces: 1, refineLandmarks: true, minDetectionConfidence: 0.7, minTrackingConfidence: 0.7 });

        faceMesh.onResults((results) => {
          if (!mounted || !canvasRef.current || !videoRef.current) return;
          const ctx = canvasRef.current.getContext("2d");
          ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
          ctx.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);

          if (!results.multiFaceLandmarks?.length) {
            // no face detected - reset prompts and countdown
            lastLandmarksRef.current = null;
            setForeheadVisible(false);
            countdownRef.current = null;
            setDisplayCountdown(null);
            return;
          }

          const lm = results.multiFaceLandmarks[0];
          lastLandmarksRef.current = lm;
          drawFaceWithForehead(ctx, lm, canvasRef.current.width, canvasRef.current.height);

          // Guide rectangle - center
          const guideW = 150, guideH = 170;
          const guideX = canvasRef.current.width / 2 - guideW / 2;
          const guideY = canvasRef.current.height / 2 - guideH / 2 - 40;
          ctx.strokeStyle = "#00ff00";
          ctx.lineWidth = 3;
          ctx.setLineDash([6]);
          ctx.strokeRect(guideX, guideY, guideW, guideH);
          ctx.setLineDash([]);

          // Basic alignment checks
          const nose = lm[1], leftEye = lm[33], rightEye = lm[263];
          const noseX = nose.x * canvasRef.current.width;
          const noseY = nose.y * canvasRef.current.height;
          const midX = ((leftEye.x + rightEye.x) / 2) * canvasRef.current.width;
          const eyeDy = Math.abs((leftEye.y - rightEye.y) * canvasRef.current.height);
          const noseDx = Math.abs(noseX - midX);
          const inFrame = noseX > guideX && noseX < guideX + guideW && noseY > guideY && noseY < guideY + guideH;
          const isStraight = eyeDy < 10 && noseDx < 8;

          // Forehead visibility check using forehead landmarks (must be in upper area)
          const foreheadIndexes = [10, 67, 71, 63, 105, 66, 107, 55];
          const foreheadYs = foreheadIndexes.map((i) => (lm[i] ? lm[i].y * canvasRef.current.height : Infinity));
          const minForeheadY = Math.min(...foreheadYs);
          const foreheadOK = minForeheadY < canvasRef.current.height * 0.35; // heuristics
          setForeheadVisible(foreheadOK);

          // Countdown logic only proceeds when inFrame, straight and forehead visible
          if (!capturedImage) {
            if (inFrame && isStraight && foreheadOK && countdownRef.current === null) {
              countdownRef.current = COUNTDOWN_START;
              setDisplayCountdown(COUNTDOWN_START);
            } else if (!inFrame || !isStraight || !foreheadOK) {
              countdownRef.current = null;
              setDisplayCountdown(null);
            }
          }

          // Draw guidance text if forehead not visible
          if (!foreheadOK) {
            ctx.fillStyle = "rgba(255,255,255,0.95)";
            ctx.font = "18px Arial";
            ctx.textAlign = "center";
            ctx.fillText("Vuốt tóc lên để lộ trán, đặt mặt vào trong khung", canvasRef.current.width / 2, 30);
          }

          // countdown overlay
          if (!capturedImage && countdownRef.current !== null) {
            ctx.fillStyle = "#fff";
            ctx.font = "30px Arial";
            ctx.textAlign = "center";
            ctx.fillText(countdownRef.current, canvasRef.current.width / 2, 50);
          }
        });

        cameraRef.current = new Camera(videoRef.current, { onFrame: async () => await faceMesh.send({ image: videoRef.current }), width: 500, height: 375 });
        cameraRef.current.start();
      } catch (err) {
        console.error("Camera/Permission error:", err);
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

  // Countdown handler
  useEffect(() => {
    if (countdownRef.current === null) return;
    const timer = setTimeout(() => {
      if (countdownRef.current === 0 && videoRef.current && lastLandmarksRef.current) {
        const lm = lastLandmarksRef.current;
        // capture canvas sized to video
        const out = document.createElement("canvas");
        out.width = videoRef.current.videoWidth || 500;
        out.height = videoRef.current.videoHeight || 375;
        const ctx = out.getContext("2d");
        ctx.drawImage(videoRef.current, 0, 0, out.width, out.height);
        // draw actual forehead polyline onto capture (consistent with preview)
        const foreheadIndexes = [10, 67, 71, 63, 105, 66, 107, 55];
        const available = foreheadIndexes.filter((i) => Boolean(lm[i]));
        if (available.length >= 2) {
          ctx.beginPath();
          const p0 = lm[available[0]];
          ctx.moveTo(p0.x * out.width, p0.y * out.height);
          available.slice(1).forEach((i) => {
            const p = lm[i];
            ctx.lineTo(p.x * out.width, p.y * out.height);
          });
          ctx.strokeStyle = "rgba(0,200,120,0.95)";
          ctx.lineWidth = 2;
          ctx.setLineDash([6, 3]);
          ctx.stroke();
          ctx.setLineDash([]);
        }

        const imgData = out.toDataURL("image/png");
        setCapturedImage(imgData);

        const metrics = calculateFaceMetrics(lm, out.width, out.height);
        setFaceMetrics(metrics);

        // call onCapture with only image + metrics (no shape prediction)
        onCapture?.({ image: imgData, metrics });

        stopCamera();
        countdownRef.current = null;
        setDisplayCountdown(null);
        return;
      }
      countdownRef.current -= 1;
      setDisplayCountdown(countdownRef.current);
    }, 1000);
    return () => clearTimeout(timer);
  }, [displayCountdown, onCapture]);

  if (!visible) return null;

  return (
  <div
  style={{
    position: "fixed",
    inset: 0,
    backgroundColor: capturedImage ? "transparent" : "rgba(0,0,0,0.7)",  // ← FIX LỖI LỚP ĐEN
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
      <>
        {/* Chỉ hiện ảnh chụp – KHÔNG hiện metrics */}
        <img
          src={capturedImage}
          alt="captured"
          style={{
            width: 500,
            borderRadius: 12,
            marginTop: 10,
          }}
        />
      </>
    )}

    <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
      <button
        onClick={() => {
          stopCamera();
          onClose(); // ← đóng popup, HairConsult sẽ đổi sang 'Phân tích'
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
          // reset chụp lại
          setCapturedImage(null);
          setFaceMetrics(null);
          countdownRef.current = null;
          setDisplayCountdown(null);
          setForeheadVisible(true);

          if (videoRef.current && !videoRef.current.srcObject) {
            navigator.mediaDevices
              .getUserMedia({ video: { facingMode: "user" } })
              .then((s) => {
                videoRef.current.srcObject = s;
                videoRef.current.play();
              })
              .catch(() => {});
          }
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