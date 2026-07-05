import React, { useState, useEffect, useCallback } from 'react';
import { HairAnalysisAPI } from '~/apis/hairAnalysisAPI';
import { useToast } from '~/context/ToastContext';

const HairConsultResult = ({ recommendation, onReset, error, onRetake }) => {
  const face    = recommendation?.face_analysis;
  const rec     = recommendation?.aiResult;
  const matched = recommendation?.matchedStyles || [];
  const isFlowB = !!rec?.top_picks;

  const { showToast } = useToast();

  const [activePreviewStyle, setActivePreviewStyle] = useState(null);
  const [savedAnalysisId, setSavedAnalysisId]       = useState(null);
  const [isSaving, setIsSaving]                     = useState(false);

  const [showRatingForm, setShowRatingForm]         = useState(false);
  const [rating, setRating]                         = useState(0);
  const [hoveredRating, setHoveredRating]           = useState(0);
  const [feedback, setFeedback]                     = useState("");
  const [isSubmittingRating, setIsSubmittingRating] = useState(false);
  const [ratingDone, setRatingDone]                 = useState(false);

  const [showExitPrompt, setShowExitPrompt]         = useState(false);

  // ── Bắt reload/đóng tab ──
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (!ratingDone) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [ratingDone]);

  // ── Bắt nút Back của browser ──
  useEffect(() => {
    const handlePopState = () => {
      if (!ratingDone) {
        setShowExitPrompt(true);
        window.history.pushState(null, "", window.location.href);
      }
    };
    window.history.pushState(null, "", window.location.href);
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [ratingDone]);

  // ── Lưu kết quả ──
  const handleSave = useCallback(async () => {
    if (isSaving || savedAnalysisId) return;
    setIsSaving(true);
    try {
      const _saveToken = {
        faceShape:         face?.face_shape?.predicted,
        skinToneUndertone: face?.skin_tone?.undertone,
        skinType:          face?.skin_condition?.skin_type_vi, // ← fix
      };
      const res = await HairAnalysisAPI.saveAnalysis({ _saveToken });
      setSavedAnalysisId(res.data.idAnalysis);
      showToast({ text: "Đã lưu kết quả vào hồ sơ!", type: "success" });
      setShowRatingForm(true);
    } catch (err) {
      showToast({ text: "Lưu thất bại, vui lòng thử lại", type: "error" });
    } finally {
      setIsSaving(false);
    }
  }, [isSaving, savedAnalysisId, face]);

  // ── Gửi rating ──
  const handleSubmitRating = async () => {
    if (rating === 0) return;

    // Khách chọn không lưu nhưng vẫn muốn đánh giá → không gọi API, chỉ cảm ơn
    if (!savedAnalysisId) {
      setRatingDone(true);
      setShowRatingForm(false);
      showToast({ text: "Cảm ơn bạn đã đánh giá!", type: "success" });
      onReset();
      return;
    }

    setIsSubmittingRating(true);
    try {
      await HairAnalysisAPI.rateAnalysis(savedAnalysisId, { rating, feedback });
      setRatingDone(true);
      setShowRatingForm(false);
      showToast({ text: "Cảm ơn bạn đã đánh giá!", type: "success" });
      onReset();
    } catch (err) {
      showToast({ text: "Gửi đánh giá thất bại", type: "error" });
    } finally {
      setIsSubmittingRating(false);
    }
  };

  // ── Bỏ qua rating ──
  const handleSkipRating = () => {
    setShowRatingForm(false);
    setRatingDone(true);
    onReset(); // ← fix
  };

  // ── Exit prompt: Có lưu ──
  const handleExitSave = async () => {
    setShowExitPrompt(false);
    if (!savedAnalysisId) await handleSave();
    else setShowRatingForm(true);
  };

  // ── Exit prompt: Không lưu → vẫn hỏi đánh giá ──
  const handleExitNoSave = () => {
    setShowExitPrompt(false);
    setShowRatingForm(true);
  };

  // ✅ FIX (yêu cầu mới): nếu phân tích khuôn mặt lỗi (component cha truyền
  // prop `error`, hoặc `recommendation` rỗng/có field `error`) → hiển thị
  // màn hình lỗi với nút "Chụp lại" thay vì cố render phần phân tích với
  // dữ liệu rỗng (trước đây sẽ ra toàn "undefined"/trắng trang vì face/rec
  // đều undefined).
  const hasAnalysisError = Boolean(error) || !recommendation || Boolean(recommendation?.error);

  if (hasAnalysisError) {
    const errorMessage =
      error || recommendation?.error || "Không thể phân tích ảnh, vui lòng thử lại với ảnh khác.";

    return (
      <div style={{ position: "fixed", inset: 0, background: "#0a0a0a", zIndex: 10000, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'DM Sans', sans-serif", color: "#f5f0e8", padding: 24 }}>
        <div style={{ maxWidth: 420, width: "100%", textAlign: "center" }}>
          <span style={{ fontSize: 40, display: "block", marginBottom: 20 }}>📷</span>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 24, color: "#fafaf8", marginBottom: 12 }}>
            Không thể phân tích khuôn mặt
          </h2>
          <p style={{ fontSize: 14, color: "rgba(245,240,232,0.55)", lineHeight: 1.7, marginBottom: 32 }}>
            {errorMessage}
          </p>
          <button
            onClick={onRetake || onReset}
            style={{
              background: "#b8966a", color: "#0a0a0a", border: "none",
              padding: "16px 40px", fontFamily: "'DM Sans', sans-serif",
              fontSize: 12, letterSpacing: 2, textTransform: "uppercase",
              cursor: "pointer", width: "100%",
            }}
          >
            📸 Chụp lại ảnh
          </button>
        </div>
      </div>
    );
  }

  const faceShapeVI   = { oval: "Trái xoan", round: "Tròn", square: "Vuông", heart: "Trái tim", oblong: "Dài" };
  const undertoneVI   = { warm: "Ấm", cool: "Lạnh", neutral: "Trung tính" };
  const maintenanceVI = { low: "Dễ bảo trì", medium: "Trung bình", high: "Cần chăm chút" };
  const fitzpatrickColor = { 1: "#f5e6d3", 2: "#e8c99a", 3: "#d4a574", 4: "#b8824a", 5: "#8b5e3c", 6: "#5c3d2e" };
  const skinColor = fitzpatrickColor[face?.skin_tone?.fitzpatrick_scale] || "#d4a574";

  return (
    <div style={{ position: "fixed", inset: 0, background: "#0a0a0a", zIndex: 10000, overflowY: "auto", fontFamily: "'DM Sans', sans-serif", color: "#f5f0e8" }}>
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "80px 24px 60px" }}>

        {/* ── HEADER ── */}
        <div style={{ textAlign: "center", marginBottom: 56 }}>
          <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 12, letterSpacing: 5, color: "#b8966a", textTransform: "uppercase", marginBottom: 16 }}>
            Kết quả tư vấn
          </p>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(28px, 4vw, 42px)", fontWeight: 700, color: "#fafaf8", lineHeight: 1.3, marginBottom: 12 }}>
            Dành riêng cho bạn
          </h1>
          <div style={{ width: 48, height: 1, background: "#b8966a", margin: "0 auto" }} />
        </div>

        {/* ── PHÂN TÍCH KHUÔN MẶT ── */}
        <section style={{ marginBottom: 48 }}>
          <SectionLabel>Phân tích khuôn mặt</SectionLabel>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 1, background: "rgba(184,150,106,0.1)", border: "1px solid rgba(184,150,106,0.15)", marginBottom: 24 }}>
            <StatCell label="Hình dạng mặt" value={faceShapeVI[face?.face_shape?.predicted] || face?.face_shape?.predicted} />
            <StatCell label="Độ tin cậy AI"  value={`${Math.round((face?.face_shape?.confidence || 0) * 100)}%`} />
            <StatCell label="Tông da"         value={undertoneVI[face?.skin_tone?.undertone] || face?.skin_tone?.undertone} />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "20px 24px", background: "#111", border: "1px solid rgba(184,150,106,0.1)", marginBottom: 16 }}>
            <div style={{ width: 44, height: 44, borderRadius: "50%", background: skinColor, border: "2px solid rgba(184,150,106,0.3)", flexShrink: 0 }} />
            <div>
              <p style={{ fontSize: 13, color: "#b8966a", marginBottom: 4, letterSpacing: 1 }}>{face?.skin_tone?.fitzpatrick_label}</p>
              <p style={{ fontSize: 12, color: "rgba(245,240,232,0.45)", lineHeight: 1.6 }}>{face?.skin_tone?.reason}</p>
            </div>
          </div>
          {face?.skin_condition && (
            <div style={{ padding: "20px 24px", background: "#111", border: "1px solid rgba(184,150,106,0.1)" }}>
              <p style={{ fontSize: 13, color: "rgba(245,240,232,0.5)", marginBottom: 8 }}>
                Loại da: <span style={{ color: "#b8966a" }}>{face.skin_condition.skin_type_vi}</span>
              </p>
              {face.skin_condition.issues?.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 8 }}>
                  {face.skin_condition.issues.map((issue, i) => (
                    <span key={i} style={{ fontSize: 11, letterSpacing: 1, padding: "4px 12px", border: "1px solid rgba(184,150,106,0.25)", color: "rgba(245,240,232,0.55)" }}>
                      {issue}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
        </section>

        {/* ── FLOW B: TOP PICKS ── */}
        {isFlowB && (
          <section style={{ marginBottom: 48 }}>
            <SectionLabel>Kiểu tóc được gợi ý</SectionLabel>
            <p style={{ fontSize: 14, lineHeight: 1.8, color: "rgba(245,240,232,0.6)", marginBottom: 32, fontStyle: "italic" }}>
              {rec.face_shape_analysis}
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {matched.map((style, i) => (
                <div key={i} style={{ background: i === 0 ? "rgba(184,150,106,0.06)" : "#0f0f0f", border: `1px solid ${i === 0 ? "rgba(184,150,106,0.3)" : "rgba(245,240,232,0.06)"}`, position: "relative", overflow: "hidden" }}>
                  {i === 0 && (
                    <span style={{ position: "absolute", top: 0, right: 20, background: "#b8966a", color: "#0a0a0a", fontSize: 10, letterSpacing: 2, padding: "4px 12px", fontFamily: "'Cormorant Garamond', serif", zIndex: 10 }}>
                      ĐỀ XUẤT HÀNG ĐẦU
                    </span>
                  )}
                  {(style.coverImage || style.sideImage) ? (
                    <ImageHoverContainer onClick={() => setActivePreviewStyle(style)}>
                      {style.coverImage && (
                        <div style={{ flex: style.sideImage ? "0 0 65%" : "1", overflow: "hidden", position: "relative" }}>
                          <img src={style.coverImage} alt={style.dbName || style.aiName} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 60, background: "linear-gradient(transparent, rgba(10,10,10,0.8))" }} />
                          <span style={{ position: "absolute", bottom: 8, left: 12, fontSize: 10, letterSpacing: 1.5, color: "rgba(245,240,232,0.5)" }}>MẶT TRƯỚC</span>
                        </div>
                      )}
                      {style.sideImage && (
                        <div style={{ flex: "0 0 35%", overflow: "hidden", position: "relative" }}>
                          <img src={style.sideImage} alt={`${style.dbName || style.aiName} — góc nghiêng`} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 60, background: "linear-gradient(transparent, rgba(10,10,10,0.8))" }} />
                          <span style={{ position: "absolute", bottom: 8, left: 12, fontSize: 10, letterSpacing: 1.5, color: "rgba(245,240,232,0.5)" }}>GÓC NGHIÊNG</span>
                        </div>
                      )}
                    </ImageHoverContainer>
                  ) : (
                    <div style={{ height: 80, display: "flex", alignItems: "center", justifyContent: "center", background: "#0a0a0a", borderBottom: "1px solid rgba(245,240,232,0.04)" }}>
                      <span style={{ fontSize: 11, color: "rgba(245,240,232,0.2)", letterSpacing: 2 }}>CHƯA CÓ ẢNH MẪU</span>
                    </div>
                  )}
                  <div style={{ padding: "24px 28px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                      <div>
                        <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 700, color: i === 0 ? "#b8966a" : "#fafaf8", marginBottom: 2 }}>
                          {style.dbName || style.aiName}
                        </h3>
                        {style.dbName && style.dbName !== style.aiName && (
                          <p style={{ fontSize: 11, color: "rgba(245,240,232,0.3)", letterSpacing: 1 }}>AI gợi ý: {style.aiName}</p>
                        )}
                      </div>
                      <span style={{ fontSize: 10, letterSpacing: 1.5, color: "rgba(184,150,106,0.6)", border: "1px solid rgba(184,150,106,0.2)", padding: "3px 10px", flexShrink: 0, marginLeft: 12 }}>
                        {maintenanceVI[style.maintenance] || style.maintenance}
                      </span>
                    </div>
                    <p style={{ fontSize: 13, color: "rgba(245,240,232,0.55)", marginBottom: 12, lineHeight: 1.7 }}>{style.description}</p>
                    <p style={{ fontSize: 13, color: "rgba(245,240,232,0.45)", lineHeight: 1.7, marginBottom: 8 }}>
                      <span style={{ color: "#b8966a", marginRight: 6 }}>Lý do phù hợp —</span>{style.why_fits}
                    </p>
                    <p style={{ fontSize: 13, color: "rgba(245,240,232,0.4)", lineHeight: 1.7 }}>
                      <span style={{ color: "rgba(184,150,106,0.7)", marginRight: 6 }}>Tạo kiểu —</span>{style.how_to_style}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── FLOW A ── */}
        {!isFlowB && rec?.recommended_styles && (
          <section style={{ marginBottom: 48 }}>
            <SectionLabel>Đánh giá tính khả thi</SectionLabel>
            <div style={{ padding: "24px 28px", background: "#111", border: `1px solid ${rec.feasibility === "high" ? "rgba(184,150,106,0.4)" : "rgba(245,240,232,0.1)"}`, marginBottom: 24 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 12 }}>
                <span style={{ fontSize: 11, letterSpacing: 2, padding: "4px 14px", background: rec.feasibility === "high" ? "#b8966a" : rec.feasibility === "medium" ? "rgba(184,150,106,0.3)" : "rgba(245,240,232,0.1)", color: rec.feasibility === "high" ? "#0a0a0a" : "#f5f0e8" }}>
                  {rec.feasibility === "high" ? "KHẢ THI CAO" : rec.feasibility === "medium" ? "KHẢ THI TRUNG BÌNH" : "KHÓ KHẢ THI"}
                </span>
              </div>
              <p style={{ fontSize: 14, color: "rgba(245,240,232,0.7)", lineHeight: 1.7 }}>{rec.verdict}</p>
              <p style={{ fontSize: 13, color: "rgba(245,240,232,0.5)", lineHeight: 1.7, marginTop: 8 }}>{rec.face_shape_analysis}</p>
            </div>
            {rec.adjustments?.length > 0 && (
              <div style={{ marginBottom: 24 }}>
                <p style={{ fontSize: 12, letterSpacing: 2, color: "#b8966a", marginBottom: 12 }}>ĐIỀU CHỈNH GỢI Ý</p>
                {rec.adjustments.map((adj, i) => (
                  <div key={i} style={{ padding: "12px 20px", borderLeft: "2px solid #b8966a", marginBottom: 8, background: "rgba(184,150,106,0.04)", fontSize: 13, color: "rgba(245,240,232,0.65)", lineHeight: 1.7 }}>{adj}</div>
                ))}
              </div>
            )}
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {matched.map((style, i) => (
                <div key={i} style={{ background: "#0f0f0f", border: "1px solid rgba(245,240,232,0.06)", overflow: "hidden" }}>
                  {(style.coverImage || style.sideImage) && (
                    <ImageHoverContainer onClick={() => setActivePreviewStyle(style)} style={{ height: 200 }}>
                      {style.coverImage && (
                        <div style={{ flex: style.sideImage ? "0 0 65%" : "1", overflow: "hidden" }}>
                          <img src={style.coverImage} alt={style.dbName || style.aiName} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                        </div>
                      )}
                      {style.sideImage && (
                        <div style={{ flex: "0 0 35%", overflow: "hidden" }}>
                          <img src={style.sideImage} alt={`${style.dbName || style.aiName} — góc nghiêng`} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                        </div>
                      )}
                    </ImageHoverContainer>
                  )}
                  <div style={{ padding: "24px 28px" }}>
                    <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, color: "#fafaf8", marginBottom: 8 }}>{style.dbName || style.aiName}</h3>
                    <p style={{ fontSize: 13, color: "rgba(245,240,232,0.5)", lineHeight: 1.7, marginBottom: 8 }}>{style.description}</p>
                    <p style={{ fontSize: 12, color: "rgba(245,240,232,0.4)", lineHeight: 1.6 }}>
                      <span style={{ color: "#b8966a", marginRight: 6 }}>Lý do —</span>{style.why_fits}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── MÀU NHUỘM ── */}
        {rec?.color_suggestion && (
          <section style={{ marginBottom: 48 }}>
            <SectionLabel>Gợi ý màu nhuộm</SectionLabel>
            <div style={{ padding: "28px", background: "#111", border: "1px solid rgba(184,150,106,0.15)", display: "grid", gridTemplateColumns: "auto 1fr", gap: "0 24px", alignItems: "start" }}>
              <div style={{ width: 52, height: 52, background: "linear-gradient(135deg, #b8966a, #8b6914)", borderRadius: "50%", border: "2px solid rgba(184,150,106,0.4)", gridRow: "1 / 4" }} />
              <div>
                <p style={{ fontSize: 16, fontFamily: "'Playfair Display', serif", color: "#b8966a", marginBottom: 6 }}>{rec.color_suggestion.recommended}</p>
                <p style={{ fontSize: 12, letterSpacing: 1, color: "rgba(245,240,232,0.4)", marginBottom: 10 }}>{rec.color_suggestion.technique}</p>
                <p style={{ fontSize: 13, color: "rgba(245,240,232,0.55)", lineHeight: 1.7 }}>{rec.color_suggestion.reason}</p>
              </div>
            </div>
          </section>
        )}

        {/* ── KIỂU TÓC NÊN TRÁNH ── */}
        {isFlowB && rec?.styles_to_avoid?.length > 0 && (
          <section style={{ marginBottom: 48 }}>
            <SectionLabel>Kiểu tóc nên tránh</SectionLabel>
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {rec.styles_to_avoid.map((s, i) => (
                <div key={i} style={{ padding: "16px 24px", background: "#0f0f0f", border: "1px solid rgba(245,240,232,0.06)", display: "flex", gap: 16, alignItems: "flex-start" }}>
                  <span style={{ color: "rgba(184,150,106,0.4)", fontSize: 18, marginTop: 1 }}>×</span>
                  <div>
                    <p style={{ fontSize: 14, color: "rgba(245,240,232,0.6)", marginBottom: 4 }}>{s.name}</p>
                    <p style={{ fontSize: 12, color: "rgba(245,240,232,0.35)", lineHeight: 1.6 }}>{s.reason}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── SKIN NOTE ── */}
        {isFlowB && rec?.skin_note && (
          <section style={{ marginBottom: 48 }}>
            <SectionLabel>Chăm sóc da sau cắt tóc</SectionLabel>
            <div style={{ padding: "24px 28px", background: "#111", border: "1px solid rgba(184,150,106,0.1)", borderLeft: "3px solid #b8966a" }}>
              <p style={{ fontSize: 13, color: "rgba(245,240,232,0.6)", lineHeight: 1.8 }}>{rec.skin_note}</p>
            </div>
          </section>
        )}

        {/* ── BARBER NOTE ── */}
        {rec?.barber_note && (
          <section style={{ marginBottom: 56 }}>
            <div style={{ padding: "32px", background: "rgba(184,150,106,0.05)", border: "1px solid rgba(184,150,106,0.2)", textAlign: "center" }}>
              <span style={{ fontSize: 24, display: "block", marginBottom: 16 }}>💈</span>
              <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 17, fontStyle: "italic", color: "rgba(245,240,232,0.75)", lineHeight: 1.8 }}>
                "{rec.barber_note}"
              </p>
            </div>
          </section>
        )}

        {/* ── ACTION BUTTONS ── */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
          {!savedAnalysisId ? (
            <button
              onClick={handleSave}
              disabled={isSaving}
              style={{
                background: isSaving ? "rgba(184,150,106,0.3)" : "#b8966a",
                color: isSaving ? "rgba(245,240,232,0.5)" : "#0a0a0a",
                border: "none", padding: "16px 48px",
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 12, letterSpacing: 2, textTransform: "uppercase",
                cursor: isSaving ? "not-allowed" : "pointer",
                width: "100%", maxWidth: 360, transition: "all 0.2s",
              }}
            >
              {isSaving ? "Đang lưu..." : "💾 Lưu kết quả vào hồ sơ"}
            </button>
          ) : (
            <div style={{ fontSize: 13, color: "#b8966a", letterSpacing: 1, padding: "12px 24px", border: "1px solid rgba(184,150,106,0.3)", background: "rgba(184,150,106,0.05)" }}>
              ✓ Đã lưu vào hồ sơ của bạn
            </div>
          )}
          <button
            onClick={() => setShowExitPrompt(true)}
            style={{ background: "transparent", color: "rgba(245,240,232,0.4)", border: "none", padding: "8px", fontFamily: "'DM Sans', sans-serif", fontSize: 12, letterSpacing: 2, textTransform: "uppercase", cursor: "pointer" }}
          >
            Tư vấn lại
          </button>
        </div>

      </div>

      {/* ── MODAL XEM CHI TIẾT ẢNH ── */}
      {activePreviewStyle && (
        <div onClick={() => setActivePreviewStyle(null)} style={{ position: "fixed", inset: 0, background: "rgba(5,5,5,0.9)", backdropFilter: "blur(8px)", zIndex: 20000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: "#0d0d0d", border: "1px solid rgba(184,150,106,0.3)", maxWidth: 640, width: "100%", maxHeight: "90vh", overflowY: "auto", position: "relative", boxShadow: "0 20px 50px rgba(0,0,0,0.8)" }}>
            <button onClick={() => setActivePreviewStyle(null)} style={{ position: "absolute", top: 16, right: 20, background: "transparent", color: "#b8966a", border: "none", fontSize: 24, cursor: "pointer", zIndex: 10 }}>×</button>
            <div style={{ display: "flex", flexDirection: "column", gap: 4, background: "#050505", padding: 4 }}>
              {activePreviewStyle.coverImage && (
                <div style={{ width: "100%", maxHeight: 380, overflow: "hidden" }}>
                  <img src={activePreviewStyle.coverImage} alt="Mặt trước phóng to" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                </div>
              )}
              {activePreviewStyle.sideImage && (
                <div style={{ width: "100%", maxHeight: 300, overflow: "hidden", borderTop: "1px solid rgba(184,150,106,0.15)" }}>
                  <p style={{ fontSize: 10, color: "#b8966a", padding: "8px 12px 0", letterSpacing: 1.5 }}>GÓC NGHIÊNG CHI TIẾT</p>
                  <img src={activePreviewStyle.sideImage} alt="Góc nghiêng phóng to" style={{ width: "100%", height: "100%", objectFit: "contain", padding: 12 }} />
                </div>
              )}
            </div>
            <div style={{ padding: "32px 36px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 16 }}>
                <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 24, color: "#b8966a", fontWeight: 700 }}>{activePreviewStyle.dbName || activePreviewStyle.aiName}</h2>
                <span style={{ fontSize: 11, color: "rgba(245,240,232,0.4)", letterSpacing: 1, border: "1px solid rgba(245,240,232,0.2)", padding: "2px 8px" }}>{maintenanceVI[activePreviewStyle.maintenance] || activePreviewStyle.maintenance}</span>
              </div>
              <p style={{ fontSize: 14, color: "#f5f0e8", lineHeight: 1.8, marginBottom: 16 }}>{activePreviewStyle.description}</p>
              <div style={{ borderTop: "1px solid rgba(184,150,106,0.15)", paddingTop: 16 }}>
                <p style={{ fontSize: 13, color: "rgba(245,240,232,0.7)", marginBottom: 8 }}><strong style={{ color: "#b8966a" }}>Lý do chọn:</strong> {activePreviewStyle.why_fits}</p>
                <p style={{ fontSize: 13, color: "rgba(245,240,232,0.7)" }}><strong style={{ color: "#b8966a" }}>Hướng dẫn tạo kiểu:</strong> {activePreviewStyle.how_to_style}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── EXIT PROMPT ── */}
      {showExitPrompt && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(5,5,5,0.92)", backdropFilter: "blur(8px)", zIndex: 30000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ background: "#0d0d0d", border: "1px solid rgba(184,150,106,0.3)", maxWidth: 440, width: "100%", padding: "40px 36px", textAlign: "center" }}>
            <span style={{ fontSize: 32, display: "block", marginBottom: 20 }}>💾</span>
            <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, color: "#fafaf8", marginBottom: 12 }}>
              Lưu kết quả phân tích?
            </h3>
            <p style={{ fontSize: 14, color: "rgba(245,240,232,0.5)", lineHeight: 1.7, marginBottom: 32 }}>
              Kết quả sẽ được lưu vào hồ sơ để hỗ trợ bạn khi đặt lịch lần sau.
            </p>
            <div style={{ display: "flex", gap: 12 }}>
              <button onClick={handleExitSave} style={{ flex: 1, background: "#b8966a", color: "#0a0a0a", border: "none", padding: "14px", fontFamily: "'DM Sans', sans-serif", fontSize: 12, letterSpacing: 2, textTransform: "uppercase", cursor: "pointer" }}>
                Có, lưu lại
              </button>
              <button onClick={handleExitNoSave} style={{ flex: 1, background: "transparent", color: "rgba(245,240,232,0.5)", border: "1px solid rgba(245,240,232,0.15)", padding: "14px", fontFamily: "'DM Sans', sans-serif", fontSize: 12, letterSpacing: 2, textTransform: "uppercase", cursor: "pointer" }}>
                Không lưu
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── RATING FORM ── */}
      {showRatingForm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(5,5,5,0.92)", backdropFilter: "blur(8px)", zIndex: 30000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ background: "#0d0d0d", border: "1px solid rgba(184,150,106,0.3)", maxWidth: 480, width: "100%", padding: "40px 36px" }}>
            <div style={{ textAlign: "center", marginBottom: 32 }}>
              <span style={{ fontSize: 32, display: "block", marginBottom: 16 }}>⭐</span>
              <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, color: "#fafaf8", marginBottom: 8 }}>
                Kết quả tư vấn có hữu ích không?
              </h3>
              <p style={{ fontSize: 13, color: "rgba(245,240,232,0.4)", lineHeight: 1.6 }}>
                Đánh giá giúp chúng tôi cải thiện chất lượng tư vấn
              </p>
            </div>
            <div style={{ display: "flex", justifyContent: "center", gap: 8, marginBottom: 28 }}>
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  onClick={() => setRating(star)}
                  style={{
                    background: "transparent", border: "none", cursor: "pointer",
                    fontSize: 36,
                    color: star <= (hoveredRating || rating) ? "#b8966a" : "rgba(245,240,232,0.15)",
                    transition: "all 0.15s",
                    transform: star <= (hoveredRating || rating) ? "scale(1.15)" : "scale(1)",
                  }}
                >
                  ★
                </button>
              ))}
            </div>
            <textarea
              placeholder="Chia sẻ thêm cảm nhận của bạn... (không bắt buộc)"
              value={feedback}
              onChange={(e) => setFeedback(e.target.value.slice(0, 255))}
              rows={3}
              style={{ width: "100%", background: "#111", border: "1px solid rgba(184,150,106,0.2)", color: "#f5f0e8", padding: "14px 16px", fontSize: 13, lineHeight: 1.6, resize: "none", fontFamily: "'DM Sans', sans-serif", marginBottom: 8, boxSizing: "border-box", outline: "none" }}
            />
            <p style={{ fontSize: 11, color: "rgba(245,240,232,0.25)", textAlign: "right", marginBottom: 24 }}>{feedback.length}/255</p>
            <div style={{ display: "flex", gap: 12 }}>
              <button
                onClick={handleSubmitRating}
                disabled={rating === 0 || isSubmittingRating}
                style={{ flex: 1, background: rating === 0 ? "rgba(184,150,106,0.2)" : "#b8966a", color: rating === 0 ? "rgba(245,240,232,0.3)" : "#0a0a0a", border: "none", padding: "14px", fontFamily: "'DM Sans', sans-serif", fontSize: 12, letterSpacing: 2, textTransform: "uppercase", cursor: rating === 0 ? "not-allowed" : "pointer" }}
              >
                {isSubmittingRating ? "Đang gửi..." : "Gửi đánh giá"}
              </button>
              <button
                onClick={handleSkipRating}
                style={{ flex: 1, background: "transparent", color: "rgba(245,240,232,0.4)", border: "1px solid rgba(245,240,232,0.1)", padding: "14px", fontFamily: "'DM Sans', sans-serif", fontSize: 12, letterSpacing: 2, textTransform: "uppercase", cursor: "pointer" }}
              >
                Bỏ qua
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ── ImageHoverContainer ──
const ImageHoverContainer = ({ children, onClick, style }) => {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onClick}
      style={{ display: "flex", gap: 2, height: 220, background: "#0a0a0a", cursor: "pointer", position: "relative", overflow: "hidden", transition: "all 0.4s ease", opacity: hovered ? 0.95 : 1, transform: hovered ? "scale(1.005)" : "scale(1)", ...style }}
    >
      {children}
      <div style={{ position: "absolute", inset: 0, background: hovered ? "rgba(184,150,106,0.08)" : "transparent", pointerEvents: "none", transition: "all 0.3s ease", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span style={{ background: "rgba(10,10,10,0.85)", color: "#b8966a", fontSize: 11, letterSpacing: 2, padding: "8px 16px", border: "1px solid rgba(184,150,106,0.4)", opacity: hovered ? 1 : 0, transform: hovered ? "translateY(0)" : "translateY(10px)", transition: "all 0.3s ease" }}>
          BẤM ĐỂ XEM CHI TIẾT ⤢
        </span>
      </div>
    </div>
  );
};

const SectionLabel = ({ children }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24 }}>
    <div style={{ flex: 1, height: 1, background: "rgba(184,150,106,0.15)" }} />
    <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 11, letterSpacing: 4, color: "#b8966a", textTransform: "uppercase", whiteSpace: "nowrap" }}>{children}</p>
    <div style={{ flex: 1, height: 1, background: "rgba(184,150,106,0.15)" }} />
  </div>
);

const StatCell = ({ label, value }) => (
  <div style={{ padding: "20px 16px", background: "#0f0f0f", textAlign: "center" }}>
    <p style={{ fontSize: 10, letterSpacing: 2, color: "rgba(245,240,232,0.35)", textTransform: "uppercase", marginBottom: 8 }}>{label}</p>
    <p style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, color: "#fafaf8" }}>{value}</p>
  </div>
);

export default HairConsultResult;