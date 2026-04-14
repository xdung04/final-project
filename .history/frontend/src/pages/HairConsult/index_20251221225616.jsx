// HairConsult.jsx
import React, { useState, useEffect } from "react";
import styles from "./HairConsult.module.scss";
import RevealSection from "~/components/RevealSection/RevealSection";
import { HairConsultAPI } from "~/apis/hairConsultAPI";
import FaceCamera from "./FaceCamera";

const HairConsult = () => {
  const [quizData, setQuizData] = useState(null);
  const [currentFlow, setCurrentFlow] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [faceMetrics, setFaceMetrics] = useState(null);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [recommendation, setRecommendation] = useState(null);
  const [sending, setSending] = useState(false);
  const [showOverlay, setShowOverlay] = useState(false);


  // Load quiz & sessionStorage
  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        const data = await HairConsultAPI.getQuiz();
        setQuizData(data.quiz);

        const savedAnswers = sessionStorage.getItem("hairConsultAnswers");
        const savedFlow = sessionStorage.getItem("hairConsultFlow");
        const savedIndex = sessionStorage.getItem("hairConsultIndex");

        if (savedAnswers) setAnswers(JSON.parse(savedAnswers));
        if (savedFlow) setCurrentFlow(savedFlow);
        if (savedIndex) setCurrentQuestionIndex(Number(savedIndex));
      } catch (error) {
        console.error("Lỗi fetch quiz:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchQuiz();
  }, []);

  // Lưu sessionStorage khi thay đổi
  useEffect(() => {
    if (!quizData) return;
    sessionStorage.setItem("hairConsultAnswers", JSON.stringify(answers));
    if (currentFlow) sessionStorage.setItem("hairConsultFlow", currentFlow);
    sessionStorage.setItem("hairConsultIndex", currentQuestionIndex);
  }, [answers, currentFlow, currentQuestionIndex, quizData]);

  if (loading) return <div>Đang tải quiz...</div>;
  if (!quizData) return <div>Không có dữ liệu quiz</div>;

  const handleAnswer = (qid, value) => setAnswers({ ...answers, [qid]: value });

  const handleNext = () => {
    const flow = currentFlow ? quizData.flows[currentFlow] : null;
    const qid = currentFlow ? flow.questions[currentQuestionIndex].id : quizData.startQuestion.id;

    if (!answers[qid]) return alert("Vui lòng chọn hoặc nhập câu trả lời!");

    const isLastQuestion = currentFlow && currentQuestionIndex === flow.questions.length - 1;
    if (isLastQuestion) return setIsCameraOpen(true);

    if (!currentFlow) {
      const selectedOption = quizData.startQuestion.options.find(
        (o) => (typeof o === "string" ? o === answers[qid] : o.label === answers[qid])
      );
      setCurrentFlow(selectedOption.nextFlow);
      setCurrentQuestionIndex(0);
    } else {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handleBack = () => {
    if (!currentFlow) return;
    if (currentQuestionIndex > 0) setCurrentQuestionIndex(currentQuestionIndex - 1);
    else {
      setCurrentFlow(null);
      setCurrentQuestionIndex(0);
    }
  };

  // Gửi quiz + metrics xuống backend
 // Gửi quiz + metrics xuống backend
const handleSendMetrics = async () => {
  if (!faceMetrics || !currentFlow) return;

  try {
    setSending(true);

    const flowData = quizData.flows[currentFlow];
    const filteredAnswers = {};
    flowData.questions.forEach((q) => {
      const ans = answers[q.id];
      if (ans) filteredAnswers[q.id] = { question: q.question, answer: ans };
    });

    const startOptions = quizData.startQuestion.options;
    const selectedOption = startOptions.find(
      (o) => (typeof o === "string" ? o === answers[quizData.startQuestion.id] : o.nextFlow === currentFlow)
    );

    const payload = {
      flow: { id: currentFlow, label: selectedOption?.label || currentFlow },
      quizAnswers: filteredAnswers,
      faceMetrics: {
        foreheadVisible: faceMetrics.foreheadVisible,
        raw: faceMetrics.raw,
        ratios: faceMetrics.ratios,
      },
    };

    console.log("Payload gửi xuống backend:", payload);

    // Gọi API
    const res = await HairConsultAPI.generateRecommendation(payload);

   
    setRecommendation(res);
    setQuizCompleted(true);
    setShowOverlay(false);
    setIsCameraOpen(false);
    sessionStorage.clear();
  } catch (err) {
    console.error("Lỗi gửi dữ liệu:", err);
    alert("Lỗi khi gửi dữ liệu phân tích khuôn mặt");
  } finally {
    setSending(false);
  }
};


  const currentQuestion = !currentFlow
    ? quizData.startQuestion
    : quizData.flows[currentFlow]?.questions[currentQuestionIndex];

  const progress = currentFlow
    ? ((currentQuestionIndex + 1) / quizData.flows[currentFlow]?.questions.length) * 100
    : 0;

  return (
    <div className={styles.hairConsult}>
      <div className={styles.quizContainer}>
        {!isCameraOpen && !faceMetrics && !quizCompleted && (
          <RevealSection className={styles.quizCard}>
            <h2>{currentQuestion.question}</h2>

            {currentQuestion.type === "single_choice" && (
              <div className={styles.options}>
                {currentQuestion.options.map((opt) => {
                  const label = typeof opt === "string" ? opt : opt.label;
                  return (
                    <button
                      key={label}
                      className={answers[currentQuestion.id] === label ? styles.selected : ""}
                      onClick={() => handleAnswer(currentQuestion.id, label)}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            )}

            {currentQuestion.type === "text" && (
              <input
                type="text"
                placeholder="Nhập câu trả lời..."
                value={answers[currentQuestion.id] || ""}
                onChange={(e) => handleAnswer(currentQuestion.id, e.target.value)}
              />
            )}

            <div className={styles.btnGroup}>
              <button
                className={styles.btnPrimary}
                onClick={handleBack}
                disabled={!currentFlow && currentQuestionIndex === 0}
              >
                Quay lại
              </button>
              <button className={styles.btnPrimary} onClick={handleNext}>
                {currentFlow && currentQuestionIndex === quizData.flows[currentFlow]?.questions.length - 1
                  ? "Quét khuôn mặt"
                  : "Tiếp theo"}
              </button>
            </div>

            {currentFlow && (
              <>
                <div className={styles.progress} style={{ marginTop: "1rem" }}>
                  Câu {currentQuestionIndex + 1}/{quizData.flows[currentFlow]?.questions.length}
                </div>
                <div className={styles.progressBar}>
                  <div className={styles.progressFill} style={{ width: `${progress}%` }} />
                </div>
              </>
            )}
          </RevealSection>
        )}

{/* Face camera */}
{isCameraOpen && !quizCompleted && (
  <FaceCamera
    visible={isCameraOpen}
    onCapture={({ metrics }) => {
      setFaceMetrics(metrics);
      setIsCameraOpen(false);
      setShowOverlay(true); // bật overlay
    }}
    onClose={() => setIsCameraOpen(false)}
  />
)}

{/* Overlay phân tích & gửi */}
{showOverlay && !quizCompleted && faceMetrics && (
  <div
    style={{
      position: "fixed",
      inset: 0,
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: "rgba(0,0,0,0.8)",
      zIndex: 9999,
      flexDirection: "column",
    }}
  >
    <button
      onClick={handleSendMetrics}
      disabled={sending}
      style={{
        padding: "16px 24px",
        fontSize: 24,
        borderRadius: 12,
        backgroundColor: "#4CAF50",
        color: "#fff",
        border: "none",
        cursor: sending ? "not-allowed" : "pointer",
        marginBottom: 20,
      }}
    >
      {sending ? "Đang phân tích..." : "Phân tích & Gửi dữ liệu"}
    </button>

    {sending && (
      <div
        style={{
          border: "6px solid #f3f3f3",
          borderTop: "6px solid #4CAF50",
          borderRadius: "50%",
          width: 60,
          height: 60,
          animation: "spin 1s linear infinite",
        }}
      />
    )}

    <style>{`
      @keyframes spin {
        0% { transform: rotate(0deg);}
        100% { transform: rotate(360deg);}
      }
    `}</style>
  </div>
)}

{/* Quiz completed */}
{/* Quiz completed overlay */}

{quizCompleted && recommendation && (
  <div
    style={{
      position: "fixed",
      inset: 0,
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: "rgba(0,0,0,0.9)",
      zIndex: 10000,
      flexDirection: "column",
      padding: 30,
      color: "#fff",
      textAlign: "center",
      borderRadius: 12,
      fontFamily: "Arial, sans-serif",
      lineHeight: 1.6,
    }}
  >
    <h1 style={{ fontSize: 32, marginBottom: 20, color: "#FFD700" }}>Kết quả phân tích khuôn mặt</h1>

    <div
      style={{
        backgroundColor: "rgba(255,255,255,0.1)",
        padding: 20,
        borderRadius: 12,
        width: "100%",
        maxWidth: 500,
      }}
    >
      <p style={{ fontSize: 14 }}>
        <b>Loại khuôn mặt:</b> {recommendation.faceType || "Không có thông tin"}
      </p>
      <p style={{ fontSize: 14 }}>
        <b>Gợi ý kiểu tóc:</b>{" "}
        {recommendation.recommendedStyles?.length
          ? recommendation.recommendedStyles.join(", ")
          : "Không có gợi ý"}
      </p>
      <p style={{ fontSize: 14 }}>
        <b>Lý do chọn:</b> {recommendation.reasoning || "Không có thông tin"}
      </p>
      <p style={{ fontSize: 14 }}>
        <b>Lời khuyên chăm sóc tóc:</b> {recommendation.careAdvice || "Không có thông tin"}
      </p>
    </div>

    <button
      onClick={() => {
        // reset quiz state
        setQuizCompleted(false);
        setRecommendation(null);
        setFaceMetrics(null);
        setIsCameraOpen(false);
        setShowOverlay(false);
        sessionStorage.clear();
        window.location.href = "/"; // chuyển về trang Home
      }}
      style={{
        marginTop: 25,
        padding: "14px 28px",
        fontSize: 20,
        fontWeight: "bold",
        borderRadius: 10,
        backgroundColor: "#4CAF50",
        color: "#fff",
        border: "none",
        cursor: "pointer",
      }}
    >
      Đóng
    </button>
  </div>
)}


      </div>
    </div>
  );
};

export default HairConsult;
