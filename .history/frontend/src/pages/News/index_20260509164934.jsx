import React, { useState } from "react";
import styles from "./News.module.scss";

// ── Mock data based on migration schema ──────────────────────────────────────
const MOCK_NEWS = [
  {
    idNews: 1,
    title: "Xu hướng tóc nam hot nhất 2025: Buzz Cut trở lại mạnh mẽ",
    slug: "xu-huong-toc-nam-hot-nhat-2025",
    thumbnail: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=800&q=80",
    summary: "Buzz Cut không chỉ là kiểu tóc quân đội nữa — nó đang được giới trẻ Việt cải biến theo hướng cá tính và hiện đại hơn.",
    category: "STYLE",
    status: "PUBLISHED",
    createdAt: "2025-04-15T08:00:00Z",
  },
  {
    idNews: 2,
    title: "NOULE Barber khai trương chi nhánh mới tại Quận 7",
    slug: "noule-barber-khai-truong-chi-nhanh-quan-7",
    thumbnail: "https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?w=800&q=80",
    summary: "Chính thức mở cửa từ ngày 01/05/2025, chi nhánh Quận 7 mang đến không gian mới sang trọng và đẳng cấp hơn.",
    category: "NEWS",
    status: "PUBLISHED",
    createdAt: "2025-05-01T09:00:00Z",
  },
  {
    idNews: 3,
    title: "Khuyến mãi tháng 5: Giảm 30% tất cả dịch vụ cắt tóc",
    slug: "khuyen-mai-thang-5-giam-30-phan-tram",
    thumbnail: "https://images.unsplash.com/photo-1599351431202-1e0f0137899a?w=800&q=80",
    summary: "Chào mừng tháng 5, NOULE tặng ngay ưu đãi 30% cho toàn bộ dịch vụ cắt tóc. Đặt lịch ngay hôm nay!",
    category: "PROMOTION",
    status: "PUBLISHED",
    createdAt: "2025-05-01T00:00:00Z",
  },
  {
    idNews: 4,
    title: "Cách chăm sóc tóc sau khi uốn sóng để giữ form lâu hơn",
    slug: "cach-cham-soc-toc-sau-khi-uon-song",
    thumbnail: "https://images.unsplash.com/photo-1622286342621-4bd786c2447c?w=800&q=80",
    summary: "Tóc uốn sóng cần được chăm sóc đúng cách để giữ được độ bóng và form sóng bền đẹp theo thời gian.",
    category: "STYLE",
    status: "PUBLISHED",
    createdAt: "2025-04-20T10:00:00Z",
  },
  {
    idNews: 5,
    title: "Beard Styling: Nghệ thuật tạo hình râu chuẩn barber",
    slug: "beard-styling-nghe-thuat-tao-hinh-rau",
    thumbnail: "https://images.unsplash.com/photo-1582893561942-d61bfb62f5ad?w=800&q=80",
    summary: "Từ fade beard đến full beard — mỗi kiểu râu đều cần kỹ thuật tỉa và tạo hình riêng để phù hợp với khuôn mặt.",
    category: "STYLE",
    status: "PUBLISHED",
    createdAt: "2025-04-10T08:00:00Z",
  },
  {
    idNews: 6,
    title: "NOULE tham dự Vietnam Barber Championship 2025",
    slug: "noule-tham-du-vietnam-barber-championship-2025",
    thumbnail: "https://images.unsplash.com/photo-1493106641515-6b5631de4bb9?w=800&q=80",
    summary: "Đội ngũ thợ cạo của NOULE sẽ góp mặt tại giải vô địch barber toàn quốc, tranh tài cùng hàng trăm tài năng.",
    category: "NEWS",
    status: "PUBLISHED",
    createdAt: "2025-03-28T07:00:00Z",
  },
];

const CATEGORIES = [
  { value: "ALL", label: "Tất cả" },
  { value: "NEWS", label: "Tin tức" },
  { value: "PROMOTION", label: "Khuyến mãi" },
  { value: "STYLE", label: "Phong cách" },
];

const CATEGORY_LABELS = {
  NEWS: "Tin tức",
  PROMOTION: "Khuyến mãi",
  STYLE: "Phong cách",
};

function formatDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
}

// ── Components ────────────────────────────────────────────────────────────────

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

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function NewsPage() {
  const [activeCategory, setActiveCategory] = useState("ALL");

  const filtered =
    activeCategory === "ALL"
      ? MOCK_NEWS
      : MOCK_NEWS.filter((n) => n.category === activeCategory);

  const [featured, ...rest] = filtered;

  return (
    <div className={styles.page}>
      {/* ── Hero ── */}
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

      {/* ── Filter ── */}
      <section className={styles.filterBar}>
        <div className={styles.container}>
          {CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              className={`${styles.filterBtn} ${activeCategory === cat.value ? styles.filterBtn__active : ""}`}
              onClick={() => setActiveCategory(cat.value)}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </section>

      {/* ── Content ── */}
      <main className={styles.main}>
        <div className={styles.container}>
          {filtered.length === 0 ? (
            <div className={styles.empty}>Chưa có bài viết nào.</div>
          ) : (
            <>
              {/* Featured */}
              {featured && (
                <div className={styles.featuredSection}>
                  <FeaturedCard article={featured} />
                </div>
              )}

              {/* Grid */}
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

      {/* ── Decorative divider ── */}
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