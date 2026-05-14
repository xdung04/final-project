ç// pages/NewsDetail/NewsDetail.jsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import styles from "./NewsDetail.module.scss";
import { NewsAPI } from "~/apis/newsAPI";

// ── Helpers ───────────────────────────────────────────────────────────────────
const CATEGORY_META = {
  NEWS:      { label: "Tin tức",     mod: "news" },
  PROMOTION: { label: "Khuyến mãi", mod: "promo" },
  STYLE:     { label: "Phong cách",  mod: "style" },
};

function formatDate(iso) {
  return new Date(iso).toLocaleDateString("vi-VN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

// ── Skeleton ──────────────────────────────────────────────────────────────────
function Skeleton() {
  return (
    <div className={styles.wrap}>
      <div className={`${styles.skeleton} ${styles.skeleton__back}`} />
      <div className={`${styles.skeleton} ${styles.skeleton__title}`} />
      <div className={`${styles.skeleton} ${styles.skeleton__titleSm}`} />
      <div className={`${styles.skeleton} ${styles.skeleton__summary}`} />
      <div className={`${styles.skeleton} ${styles.skeleton__hero}`} />
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className={`${styles.skeleton} ${styles.skeleton__line}`} />
      ))}
    </div>
  );
}

// ── Related card ──────────────────────────────────────────────────────────────
function RelatedCard({ article }) {
  const meta = CATEGORY_META[article.category];
  return (
    <Link to={`/tin-tuc/${article.slug}`} className={styles.relCard}>
      <div className={styles.relCard__imgWrap}>
        {article.thumbnail ? (
          <img src={article.thumbnail} alt={article.title} loading="lazy" />
        ) : (
          <div className={styles.relCard__imgPh} />
        )}
      </div>
      <div className={styles.relCard__body}>
        <p className={styles.relCard__cat}>{meta?.label}</p>
        <p className={styles.relCard__title}>{article.title}</p>
        <p className={styles.relCard__date}>{formatDate(article.createdAt)}</p>
      </div>
    </Link>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function NewsDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();

  const [article, setArticle]   = useState(null);
  const [related, setRelated]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);
  const [copied, setCopied]     = useState(false);

  // ── Fetch bài viết theo slug ──
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    NewsAPI.getNewsBySlug(slug)
      .then((data) => {
        if (cancelled) return;
        if (!data) {
          setError("Không tìm thấy bài viết.");
          return;
        }
        setArticle(data);

        // Fetch bài liên quan cùng danh mục
        return NewsAPI.getPublishedNews(data.category);
      })
      .then((list) => {
        if (cancelled || !list) return;
        // Loại bài hiện tại, lấy tối đa 4 bài
        setRelated(list.filter((a) => a.slug !== slug).slice(0, 4));
      })
      .catch(() => {
        if (!cancelled) setError("Không thể tải bài viết. Vui lòng thử lại.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [slug]);

  // ── Copy link ──
  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  // ── Share Facebook ──
  const handleShareFacebook = () => {
    const url = encodeURIComponent(window.location.href);
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, "_blank");
  };

  // ── Loading ──
  if (loading) return <Skeleton />;

  // ── Error / 404 ──
  if (error || !article) {
    return (
      <div className={styles.wrap}>
        <div className={styles.errorState}>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <p>{error || "Không tìm thấy bài viết."}</p>
          <button className={styles.btnBack} onClick={() => navigate("/tin-tuc")}>
            Quay lại trang tin tức
          </button>
        </div>
      </div>
    );
  }

  const catMeta = CATEGORY_META[article.category];

  return (
    <div className={styles.wrap}>
      {/* ── Back ── */}
      <button className={styles.back} onClick={() => navigate("/tin-tuc")}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="19" y1="12" x2="5" y2="12" />
          <polyline points="12 19 5 12 12 5" />
        </svg>
        Quay lại Tin tức
      </button>

      {/* ── Meta row ── */}
      <div className={styles.metaRow}>
        <span className={`${styles.catBadge} ${styles[`catBadge__${catMeta?.mod}`]}`}>
          {catMeta?.label}
        </span>
        <span className={styles.metaDate}>{formatDate(article.createdAt)}</span>
      </div>

      {/* ── Title ── */}
      <h1 className={styles.title}>{article.title}</h1>

      {/* ── Summary / lead ── */}
      {article.summary && (
        <p className={styles.summary}>{article.summary}</p>
      )}

      {/* ── Hero image ── */}
      {article.thumbnail && (
        <img
          className={styles.heroImg}
          src={article.thumbnail}
          alt={article.title}
          loading="eager"
        />
      )}

      {/* ── Body content ── */}
      <div
        className={styles.contentBody}
        dangerouslySetInnerHTML={{ __html: article.content }}
      />

      {/* ── Divider ── */}
      <div className={styles.divider}>
        <span />
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path d="M6 3a3 3 0 0 1 3 3c0 1.5-1 3-3 5.5S3 16 3 18a3 3 0 0 0 6 0"
            stroke="#C9A84C" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M18 3a3 3 0 0 0-3 3c0 1.5 1 3 3 5.5s3 4.5 3 6.5a3 3 0 0 1-6 0"
            stroke="#C9A84C" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M9 18a3 3 0 0 0 6 0"
            stroke="#C9A84C" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        <span />
      </div>

      {/* ── Footer bar ── */}
      <div className={styles.footerBar}>
        <span className={styles.footerBar__left}>NOULE Barber · Tin tức &amp; Phong cách</span>
        <div className={styles.shareRow}>
          <button className={styles.shareBtn} onClick={handleCopyLink}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
            </svg>
            {copied ? "Đã sao chép!" : "Sao chép link"}
          </button>
          <button className={styles.shareBtn} onClick={handleShareFacebook}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
            </svg>
            Chia sẻ
          </button>
        </div>
      </div>

      {/* ── Related articles ── */}
      {related.length > 0 && (
        <div className={styles.related}>
          <div className={styles.related__label}>
            Bài viết liên quan
            <span />
          </div>
          <div className={styles.related__grid}>
            {related.map((a) => (
              <RelatedCard key={a.idNews} article={a} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}