import hairConsultService from "../services/hairConsultService.js";
import axios from "axios";
import FormData from "form-data";

export const getQuiz = async (req, res) => {
  try {
    const quiz = await hairConsultService.getQuiz();
    return res.json({ quiz });
  } catch (err) {
    return res.status(500).json({ message: "Lỗi server", error: err.message });
  }
};

export const generateRecommendation = async (req, res) => {
  try {
    console.log("FILE:", req.file);
console.log("BODY:", req.body);
    const { flow, quizAnswers } = req.body;
    const imageFile = req.file;

    if (!flow || !quizAnswers || !imageFile) {
      return res.status(400).json({ message: "Thiếu dữ liệu" });
    }

    const parsedFlow = JSON.parse(flow);
    const parsedAnswers = JSON.parse(quizAnswers);

    const formData = new FormData();
    formData.append("file", imageFile.buffer, imageFile.originalname);

    const faceRes = await axios.post(
      "http://127.0.0.1:8000/predict",
      formData,
      { headers: formData.getHeaders() }
    );

    const faceRaw = faceRes.data;
  console.log("RAW faceRes.data:", faceRes.data);
    const faceMetrics = {
      top_predictions: faceRaw.top_predictions,
      measurements: faceRaw.measurements,
    };

    const recommendation = await hairConsultService.analyzeHairConsult({
      flow: parsedFlow,
      answers: parsedAnswers,
      faceMetrics,
    });

    return res.json({
      ...recommendation,
      aiFaceAnalysis: faceMetrics,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Lỗi server", error: err.message });
  }
};
