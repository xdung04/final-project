import React, { useState, useEffect } from "react";
import styles from "./News.module.scss";
import { NewsAPI } from "~/apis/newsAPI";

// ── Constants ─────────────────────────────────────────────────────────────────
const CATEGORIES = [
  { value: "ALL",       label: "Tất cả" },
  { value: "NEWS",      label: "Tin tức" },
  { value: "PROMOTION", label: "Khuyến mãi" },
  { value: "STYLE",     label: "Phong cách" },
];

const CATEGORY_LABELS = {
  NEWS:      "Tin tức",
  PROMOTION: "Khuyến mãi",
  STYLE:     "Phong cách",
};

function formatDate(iso) {
  return new Date(iso).toLocaleDateString("vi-VN", {
    day: "2-digit", month: "2-digit", year: "numeric",
  });
}

// ── Components (giữ nguyên UI) ────────────────────────────────────────────────
function CategoryBadge({ category }) {
  return (
    <span className={`${styles.badge} ${styles[`badge_${category}`]}`}>
      {CATEGORY_LABELS[category] || category}
    </span>
  );
}

function FeaturedCard({ article }) {
  return (
    <article className={styles.featuredCard}>
      <div className={styles.featuredCard__image}>
        <img src={article.thumbnail} alt={article.title} loading="lazy" />
        <div className={styles.featuredCard__overlay} />
      </div>
      <div className={styles.featuredCard__body}>
        <CategoryBadge category={article.category} />
        <h2 className={styles.featuredCard__title}>{article.title}</h2>
        <p className={styles.featuredCard__summary}>{article.summary}</p>
        <div className={styles.featuredCard__footer}>
          <span className={styles.date}>{formatDate(article.createdAt)}</span>
          <a href={`/tin-tuc/${article.slug}`} className={styles.readMore}>
            Đọc tiếp
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </a>
        </div>
      </div>
    </article>
  );
}

function NewsCard({ article }) {
  return (
    <article className={styles.newsCard}>
      <a href={`/tin-tuc/${article.slug}`} className={styles.newsCard__imageWrap}>
        <img src={article.thumbnail} alt={article.title} loading="lazy" />
        <CategoryBadge category={article.category} />
      </a>
      <div className={styles.newsCard__body}>
        <span className={styles.date}>{formatDate(article.createdAt)}</span>
        <h3 className={styles.newsCard__title}>
          <a href={`/tin-tuc/${article.slug}`}>{article.title}</a>
        </h3>
        <p className={styles.newsCard__summary}>{article.summary}</p>
      </div>
    </article>
  );
}

// ── Skeleton loader ───────────────────────────────────────────────────────────
function SkeletonCard() {
  return <div className={styles.skeleton} aria-hidden="true" />;
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function NewsPage() {
  const [news, setNews]                   = useState([]);
  const [activeCategory, setActiveCategory] = useState("ALL");
  const [loading, setLoading]             = useState(false);
  const [error, setError]                 = useState(null);

  // Fetch khi category thay đổi
  useEffect(() => {
    const fetchNews = async () => {
      setLoading(true);
      setError(null);
      try {
        const category = activeCategory === "ALL" ? null : activeCategory;
        const data = await NewsAPI.getPublishedNews(category);
        setNews(data);
      } catch (err) {
        console.error("Lỗi tải tin tức:", err);
        setError("Không thể tải bài viết. Vui lòng thử lại sau.");
      } finally {
        setLoading(false);
      }
    };

    fetchNews();
  }, [activeCategory]);

  const [featured, ...rest] = news;

  return (
    <div className={styles.page}>
      {/* Hero */}
      <section className={styles.hero}>
        <div className={styles.hero__noise} />
        <div className={styles.hero__content}>
          <p className={styles.hero__eyebrow}>— NOULE BARBER</p>
          <h1 className={styles.hero__heading}>
            Tin tức &amp; <br />
            <em>Phong Cách</em>
          </h1>
          <p className={styles.hero__sub}>
            Cập nhật xu hướng tóc nam, ưu đãi mới nhất và câu chuyện từ đội ngũ thợ cạo NOULE.
          </p>
        </div>
        <div className={styles.hero__line} />
      </section>

      {/* Filter */}
      <section className={styles.filterBar}>
        <div className={styles.container}>
          {CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              className={`${styles.filterBtn} ${activeCategory === cat.value ? styles.filterBtn__active : ""}`}
              onClick={() => setActiveCategory(cat.value)}
              disabled={loading}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </section>

      {/* Content */}
      <main className={styles.main}>
        <div className={styles.container}>

          {/* Loading */}
          {loading && (
            <div className={styles.grid}>
              {[...Array(3)].map((_, i) => <SkeletonCard key={i} />)}
            </div>
          )}

          {/* Error */}
          {!loading && error && (
            <div className={styles.empty}>{error}</div>
          )}

          {/* Empty */}
          {!loading && !error && news.length === 0 && (
            <div className={styles.empty}>Chưa có bài viết nào.</div>
          )}

          {/* Data */}
          {!loading && !error && news.length > 0 && (
            <>
              {featured && (
                <div className={styles.featuredSection}>
                  <FeaturedCard article={featured} />
                </div>
              )}
              {rest.length > 0 && (
                <div className={styles.grid}>
                  {rest.map((article) => (
                    <NewsCard key={article.idNews} article={article} />
                  ))}
                </div>
              )}
            </>
          )}

        </div>
      </main>

      {/* Decorative divider */}
      <div className={styles.divider}>
        <span />
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2z" fill="var(--color-gold)" fillOpacity=".3" />
          <path d="M12 6v6l4 2" stroke="var(--color-gold)" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        <span />
      </div>
    </div>
  );
}