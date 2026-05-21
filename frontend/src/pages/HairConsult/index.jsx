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

  const handleSelectOption = (qid, label) => {
    setAnswers({
      ...answers,
      [qid]: { value: label, customText: answers[qid]?.value === label ? answers[qid]?.customText : "" }
    });
  };

  const handleCustomInputChange = (qid, text) => {
    setAnswers({
      ...answers,
      [qid]: { ...answers[qid], customText: text }
    });
  };

  const handlePureTextChange = (qid, text) => {
    setAnswers({
      ...answers,
      [qid]: { value: text, customText: "" }
    });
  };

  const handleNext = () => {
    const flow = currentFlow ? quizData.flows[currentFlow] : null;
    const currentQuestion = !currentFlow ? quizData.startQuestion : flow.questions[currentQuestionIndex];
    const qid = currentQuestion.id;
    const userAnswer = answers[qid];

    if (!userAnswer || !userAnswer.value) {
      return showToast({ text: "Vui lòng chọn hoặc nhập câu trả lời!", type: "error" });
    }

    if (currentQuestion.type === "single_choice") {
      const selectedOptObj = currentQuestion.options.find(o => o.label === userAnswer.value);
      if (selectedOptObj?.requires_custom_input && (!userAnswer.customText || !userAnswer.customText.trim())) {
        return showToast({ text: "Vui lòng nhập nội dung chi tiết vào ô trống!", type: "error" });
      }
    }

    const isLastQuestion = currentFlow && currentQuestionIndex === flow.questions.length - 1;
    if (isLastQuestion) return setIsCameraOpen(true);

    if (!currentFlow) {
      const selectedOption = quizData.startQuestion.options.find(o => o.label === userAnswer.value);
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
        const ansObj = answers[q.id];
        if (ansObj) {
          const optConfig = q.options?.find(o => o.label === ansObj.value);
          const finalAnswerString = optConfig?.requires_custom_input ? ansObj.customText : ansObj.value;
          
          filteredAnswers[q.id] = {
            question: q.question,
            answer: finalAnswerString
          };
        }
      });

      const startOptions = quizData.startQuestion.options;
      const selectedOption = startOptions.find(o => o.nextFlow === currentFlow);

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

  const totalQuestions = currentFlow ? quizData.flows[currentFlow]?.questions.length : 0;
  const currentStepDisplay = currentFlow ? currentQuestionIndex + 1 : 0;
  const progress = currentFlow ? (currentStepDisplay / totalQuestions) * 100 : 0;

  return (
    <div className={styles.hairConsult}>
      <div className={styles.quizContainer}>
        {!isCameraOpen && !quizCompleted && (
          <RevealSection className={styles.quizWrapper}>
            {currentFlow && (
              <div className={styles.stepLabel}>
                Câu hỏi {currentStepDisplay} / {totalQuestions}
              </div>
            )}
            
            <h2 className={styles.questionTitle}>{currentQuestion.question}</h2>
            
            {currentQuestion.type === "single_choice" && (
              <div className={styles.options}>
                {currentQuestion.options.map((opt, idx) => {
                  const label = typeof opt === "string" ? opt : opt.label;
                  const isSelected = answers[currentQuestion.id]?.value === label;
                  const hasCustomInput = typeof opt === "object" && opt.requires_custom_input;

                  return (
                    <div key={idx} className={styles.optionWrapper}>
                      <button 
                        className={`${styles.optionBtn} ${isSelected ? styles.selected : ""}`} 
                        onClick={() => handleSelectOption(currentQuestion.id, label)}
                      >
                        {label}
                      </button>
                      
                      {isSelected && hasCustomInput && (
                        <input
                          type="text"
                          className={styles.customInputField}
                          placeholder="Mô tả cụ thể ý của bạn tại đây..."
                          value={answers[currentQuestion.id]?.customText || ""}
                          onChange={(e) => handleCustomInputChange(currentQuestion.id, e.target.value)}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {currentQuestion.type === "text" && (
              <input 
                type="text" 
                className={styles.pureTextInput}
                placeholder="Nhập câu trả lời của bạn..." 
                value={answers[currentQuestion.id]?.value || ""} 
                onChange={(e) => handlePureTextChange(currentQuestion.id, e.target.value)} 
              />
            )}

            <div className={styles.btnGroup}>
              <button 
                className={styles.btnOutline} 
                onClick={handleBack} 
                disabled={!currentFlow && currentQuestionIndex === 0}
              >
                Quay lại
              </button>
              
              <button className={styles.btnPrimary} onClick={handleNext}>
                {currentFlow && currentQuestionIndex === totalQuestions - 1 
                  ? "Quét khuôn mặt" 
                  : "Tiếp theo"}
              </button>
            </div>
            
          </RevealSection>
        )}

        {isCameraOpen && !quizCompleted && (
          <FaceCamera 
            visible={isCameraOpen} 
            onCapture={({ image }) => { setCapturedImage(image); setIsCameraOpen(false); setShowOverlay(true); }} 
            onClose={() => setIsCameraOpen(false)} 
          />
        )}

        {showOverlay && !quizCompleted && (
          <div className={styles.overlay}>
            <button className={styles.btnPrimary} onClick={handleSendMetrics} disabled={sending}>
              {sending ? "Đang phân tích..." : "Bắt đầu phân tích khuôn mặt"}
            </button>
            {sending && <div className={styles.spinner}></div>}
          </div>
        )}

        {/* Kết quả phân tích */}
        {quizCompleted && recommendation && (
          <div className={styles.quizResult}>
            <h2>Kết quả phân tích</h2>
            
            <div className={styles.faceProgress}>
              {recommendation.faceBlend?.map((f, i) => (
                <div className={styles.faceItem} key={i}>
                  <div className={styles.faceLabel}>{f.faceType}</div>
                  <div className={styles.progressTrack}>
                    <div className={styles.progressFillBar} style={{ width: `${f.ratio * 100}%` }} />
                  </div>
                  <div className={styles.faceValue}>{Math.round(f.ratio * 100)}%</div>
                </div>
              ))}
            </div>

            <div className={styles.resultDetails}>
              <p><b>Dáng mặt chính:</b> {recommendation.primaryFaceType}</p>
              <p><b>Độ tự tin (AI):</b> {recommendation.confidenceLevel}</p>
              <p><b>Gợi ý kiểu tóc:</b> {recommendation.recommendedStyles?.join(", ")}</p>
              <p><b>Lý do chọn:</b> {recommendation.reasoning}</p>
              <p><b>Chăm sóc tóc:</b> {recommendation.careAdvice}</p>
            </div>
            
            <button className={styles.btnPrimary} onClick={() => window.location.href = "/"}>
              Hoàn tất
            </button>
          </div>
        )}
      </div>

      {/* Tiến độ mượt mà kẹp sát đáy màn hình */}
      {!isCameraOpen && !quizCompleted && currentFlow && (
        <div className={styles.progressContainer}>
          <div className={styles.progressFill} style={{ width: `${progress}%` }} />
        </div>
      )}
    </div>
  );
};

export default HairConsult;