import React, { useState, useEffect } from "react";
import styles from "./HairConsult.module.scss";
import RevealSection from "~/components/RevealSection/RevealSection";
import { HairConsultAPI } from "~/apis/hairConsultAPI";
import FaceCamera from "./FaceCamera";
import { useToast } from "~/context/ToastContext";
const HairConsult = () => {
  const [quizData, setQuizData] = useState(null);
  const [currentFlow, setCurrentFlow] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [recommendation, setRecommendation] = useState(null);
  const [sending, setSending] = useState(false);
  const [showOverlay, setShowOverlay] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
 const { showToast } = useToast();
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
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchQuiz();
  }, []);

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

    if (!answers[qid]) return showToast({ text: "Vui lòng chọn hoặc nhập câu trả lời!", type: "error" });

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

  const handleSendMetrics = async () => {
    if (!capturedImage || !currentFlow) return;

    setSending(true);
    try {
      const flowData = quizData.flows[currentFlow];
      const filteredAnswers = {};
      flowData.questions.forEach(q => {
        if (answers[q.id]) filteredAnswers[q.id] = { question: q.question, answer: answers[q.id] };
      });

      const startOptions = quizData.startQuestion.options;
      const selectedOption = startOptions.find(
        (o) => typeof o === "string" ? o === answers[quizData.startQuestion.id] : o.nextFlow === currentFlow
      );

      const base64ToBlob = (base64) => {
        const byteString = atob(base64.split(",")[1]);
        const mimeString = base64.split(",")[0].split(":")[1].split(";")[0];
        const ab = new ArrayBuffer(byteString.length);
        const ia = new Uint8Array(ab);
        for (let i = 0; i < byteString.length; i++) ia[i] = byteString.charCodeAt(i);
        return new Blob([ab], { type: mimeString });
      };

      const formData = new FormData();
      formData.append("image", base64ToBlob(capturedImage), "face.jpg");
      formData.append("flow", JSON.stringify({ id: currentFlow, label: selectedOption?.label || currentFlow }));
      formData.append("quizAnswers", JSON.stringify(filteredAnswers));

      const res = await HairConsultAPI.generateRecommendation(formData);
      setRecommendation(res);
      setQuizCompleted(true);
      setShowOverlay(false);
      setIsCameraOpen(false);
      sessionStorage.clear();
    } catch (err) {
      console.error(err);
      return showToast({ text: "Lỗi khi gửi dữ liệu phân tích khuôn mặt", type: "error" });

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
        {!isCameraOpen && !quizCompleted && (
          <RevealSection className={styles.quizCard}>
            <h2>{currentQuestion.question}</h2>
            {currentQuestion.type === "single_choice" && (
              <div className={styles.options}>
                {currentQuestion.options.map(opt => {
                  const label = typeof opt === "string" ? opt : opt.label;
                  return (
                    <button key={label} className={answers[currentQuestion.id] === label ? styles.selected : ""} onClick={() => handleAnswer(currentQuestion.id, label)}>
                      {label}
                    </button>
                  );
                })}
              </div>
            )}
            {currentQuestion.type === "text" && (
              <input type="text" placeholder="Nhập câu trả lời..." value={answers[currentQuestion.id] || ""} onChange={(e) => handleAnswer(currentQuestion.id, e.target.value)} />
            )}
            <div className={styles.btnGroup}>
              <button className={styles.btnPrimary} onClick={handleBack} disabled={!currentFlow && currentQuestionIndex === 0}>Quay lại</button>
              <button className={styles.btnPrimary} onClick={handleNext}>
                {currentFlow && currentQuestionIndex === quizData.flows[currentFlow]?.questions.length - 1 ? "Quét khuôn mặt" : "Tiếp theo"}
              </button>
            </div>
            {currentFlow && (
              <>
                <div className={styles.progress}>
                  Câu {currentQuestionIndex + 1}/{quizData.flows[currentFlow]?.questions.length}
                </div>
                <div className={styles.progressBar}>
                  <div className={styles.progressFill} style={{ width: `${progress}%` }} />
                </div>
              </>
            )}
          </RevealSection>
        )}

        {isCameraOpen && !quizCompleted && (
          <FaceCamera visible={isCameraOpen} onCapture={({ image }) => { setCapturedImage(image); setIsCameraOpen(false); setShowOverlay(true); }} onClose={() => setIsCameraOpen(false)} />
        )}

        {showOverlay && !quizCompleted && (
          <div className={styles.overlay}>
            <button onClick={handleSendMetrics} disabled={sending}>{sending ? "Đang phân tích..." : "Phân tích & Gửi dữ liệu"}</button>
            {sending && <div className="spinner"></div>}
          </div>
        )}

{/* Quiz completed */}
{quizCompleted && recommendation && (
  <div className={styles.quizResult}>
    <h2>Kết quả phân tích của bạn</h2>

    {/* Progress khuôn mặt */}
    <div className={styles.faceProgress}>
      {recommendation.faceBlend.map((f, i) => (
        <div className={styles.faceItem} key={i}>
          <div className={styles.faceLabel}>{f.faceType}</div>
          <div className={styles.progressContainer}>
<div
  className={styles.progressFill}
  style={{ width: `${f.ratio * 100}%` }}
>
  {Math.round(f.ratio * 100)}%
</div>

          </div>
        </div>
      ))}
    </div>

    {/* Thông tin chi tiết */}
    <div className={styles.resultDetails}>
      <p><b>Primary Face Type:</b> {recommendation.primaryFaceType}</p>
      <p><b>Confidence Level:</b> {recommendation.confidenceLevel}</p>
      <p><b>Gợi ý kiểu tóc:</b> {recommendation.recommendedStyles?.join(", ")}</p>
      <p><b>Lý do chọn:</b> {recommendation.reasoning}</p>
      <p><b>Lời khuyên chăm sóc tóc:</b> {recommendation.careAdvice}</p>
    </div>

    <button onClick={() => window.location.href = "/"}>Đóng</button>
  </div>
)}



      </div>
    </div>
  );
};

export default HairConsult;
