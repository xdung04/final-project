import React, { useEffect, useState } from "react";
import classNames from "classnames/bind";
import styles from "./AiHubTab.module.scss";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell,
} from "recharts";
import { Star, MessageSquare, BrainCircuit, Users } from "lucide-react";
import { StatisticsAPI } from "~/apis/statisticsAPI";
import { SummaryAPI } from "~/apis/summaryAPI";

const cx = classNames.bind(styles);

const GOLD = "#C9A84C";
const INK  = "#2C2720";

const AiHubTab = () => {
  const [ratingSummary,    setRatingSummary]    = useState(null);
  const [ratingByFace,     setRatingByFace]     = useState([]);
  const [aiSummary,        setAiSummary]        = useState(null);
  const [loading,          setLoading]          = useState(true);
  const [loadingAI,        setLoadingAI]        = useState(true);

  // Gọi 2 API thống kê — nhanh
  useEffect(() => {
    const load = async () => {
      try {
        const [summary, byFace] = await Promise.all([
          StatisticsAPI.getAIRatingSummary(),
          StatisticsAPI.getAIRatingByFaceShape(),
        ]);
        setRatingSummary(summary?.data || summary);
        setRatingByFace(byFace?.data  || byFace || []);
      } catch (err) {
        console.error("Lỗi load AI stats:", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // Gọi Gemini — chậm hơn, load riêng
  useEffect(() => {
    const loadAI = async () => {
      try {
        const res = await SummaryAPI.getAISummary();
        setAiSummary(res);
      } catch (err) {
        console.error("Lỗi load AI summary:", err);
      } finally {
        setLoadingAI(false);
      }
    };
    loadAI();
  }, []);

  // Chart data từ ratingByFaceShape
  const chartData = ratingByFace.map((f) => ({
    name:  f.faceShape,
    val:   f.avgRating,
    total: f.total,
    color: f.avgRating >= 4.0 ? GOLD : INK,
  }));

  return (
    <div className={cx("wrapper")}>

      {/* ── KPI ── */}
      <div className={cx("kpiGrid")}>
        <div className={cx("card")}>
          <div className={cx("iconWrap")}><Star size={18} /></div>
          <div className={cx("info")}>
            <span>Điểm hài lòng TB</span>
            <h3>{loading ? "—" : `${ratingSummary?.avgRating ?? "—"}/5`}</h3>
            <small>{ratingSummary?.totalReviewed ?? 0} đánh giá</small>
          </div>
        </div>

        <div className={cx("card")}>
          <div className={cx("iconWrap")}><Users size={18} /></div>
          <div className={cx("info")}>
            <span>Đánh giá 4-5 sao</span>
            <h3>
              {loading ? "—" : ratingSummary
                ? `${Math.round(
                    ((ratingSummary.distribution.star5 + ratingSummary.distribution.star4)
                      / ratingSummary.totalReviewed) * 100
                  )}%`
                : "—"}
            </h3>
            <small>Tỉ lệ hài lòng</small>
          </div>
        </div>

        <div className={cx("card")}>
          <div className={cx("iconWrap")}><MessageSquare size={18} /></div>
          <div className={cx("info")}>
            <span>Khuôn mặt phân tích</span>
            <h3>{loading ? "—" : ratingByFace.length}</h3>
            <small>Nhóm khuôn mặt</small>
          </div>
        </div>
      </div>

      {/* ── Main Grid ── */}
      <div className={cx("mainGrid")}>

        {/* Chart */}
        <div className={cx("chartSection")}>
          <h4>Đánh giá trung bình theo dáng mặt</h4>
          {loading ? (
            <div className={cx("skeleton")} style={{ height: 300 }} />
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis domain={[0, 5]} axisLine={false} tickLine={false} />
                <Tooltip
                  formatter={(val, _, props) => [
                    `${val}/5 (${props.payload.total} đánh giá)`,
                    "Avg Rating",
                  ]}
                  cursor={{ fill: "#f5f5f5" }}
                />
                <Bar dataKey="val" radius={[6, 6, 0, 0]} barSize={40}>
                  {chartData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Gemini Insight */}
        <div className={cx("insightSection")}>
          <h5><BrainCircuit size={18} /> AI Strategy Insight</h5>

          {loadingAI ? (
            <p style={{ color: "rgba(245,240,232,0.4)", fontSize: 13 }}>
              Đang phân tích dữ liệu...
            </p>
          ) : aiSummary?.analysis ? (
            <>
              <p>{aiSummary.analysis.overview}</p>
              <p>{aiSummary.analysis.faceShapeAnalysis}</p>
              {aiSummary.analysis.feedbackInsight && (
                <p>{aiSummary.analysis.feedbackInsight}</p>
              )}
              <div className={cx("recommendation")}>
                <strong>Đề xuất</strong>
                {aiSummary.analysis.action}
              </div>
            </>
          ) : (
            <p style={{ color: "rgba(245,240,232,0.4)", fontSize: 13 }}>
              Chưa có dữ liệu phân tích.
            </p>
          )}
        </div>

      </div>
    </div>
  );
};

export default AiHubTab;