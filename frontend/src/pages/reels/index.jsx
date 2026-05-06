import React, { useEffect, useState, useRef } from "react";
import styles from "./reels.module.scss";
import ReelPlayer from "~/components/ReelPlayer";
import VideoDetailDialog from "~/components/VideoDetailDialog";
import VideoCard from "~/components/VideoCard";
import { fetchReelsPaged, searchReels } from "~/services/reelService";
import { getHashtags, getTopHashtags } from "~/services/hashtagService";
import { useAuth } from "~/context/AuthContext";
import { useToast } from "~/context/ToastContext";
import { useLocation } from "react-router-dom";

const PAGE_SIZE = 3;
const SCROLL_COOLDOWN_MS = 1500;

function Reel() {
  const location = useLocation();
  const { accessToken, isLogin, loading: isAuthLoading } = useAuth();
  const { showToast } = useToast();

  const [hashtagSuggestions, setHashtagSuggestions] = useState([]);
  const [topHashtags, setTopHashtags] = useState([]);

  // --- logic load reel
  const [reels, setReels] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showDetail, setShowDetail] = useState(false);
  const [detailIndex, setDetailIndex] = useState(0);
  const [keyword, setKeyword] = useState("");
  const [canScroll, setCanScroll] = useState(true);
  const [globalMuted, setGlobalMuted] = useState(true);

  // --- trạng thái search
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);

  const rightColumnRef = useRef(null);
  const touchStartY = useRef(0);
  const isFetchingRef = useRef(false);

  const [pendingOpenId, setPendingOpenId] = useState(null);

  const loadMore = async () => {
    if (loading || !hasMore || isFetchingRef.current) return;
    isFetchingRef.current = true;
    setLoading(true);
    try {
      const data = await fetchReelsPaged(page, PAGE_SIZE, accessToken);
      if (data.length === 0) setHasMore(false);
      else {
        setReels((prev) => {
          const newOnes = data.filter((d) => !prev.some((p) => p.idReel === d.idReel));
          return [...prev, ...newOnes];
        });
        setPage((prev) => prev + 1);
        if (data.length < PAGE_SIZE) setHasMore(false);
      }
    } catch (err) {
      console.error("Lỗi tải reels:", err);
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  };

  useEffect(() => {
    const tag = location.state?.keyword;
    const openId = location.state?.openReelId;

    if (tag) {
      setKeyword(tag);
      performSearch(tag);
    } else {
      setIsSearching(false);
      setSearchResults([]);
      setKeyword("");
    }

    // Nếu có openReelId → đợi reels load xong rồi mở đúng video
    if (openId) {
      setPendingOpenId(openId);
    }

    window.scrollTo({ top: 0 });
    if (rightColumnRef.current) {
      rightColumnRef.current.scrollTop = 0;
    }
  }, [location.state]);

  // Chỉ cuộn đến đúng video
  useEffect(() => {
    if (!pendingOpenId || reels.length === 0) return;

    const idx = reels.findIndex((r) => r.idReel === pendingOpenId);
    if (idx !== -1) {
      setCurrentIndex(idx);
      setPendingOpenId(null);
    }
  }, [reels, pendingOpenId]);

  useEffect(() => {
    getTopHashtags()
      .then((data) => setTopHashtags(data || []))
      .catch((err) => console.error("Lỗi load top hashtag:", err));
  }, []);

  useEffect(() => {
    const match = keyword.match(/#(\w+)$/);
    if (match && match[1]) {
      const query = match[1];
      getHashtags(query)
        .then((data) => setHashtagSuggestions(data || []))
        .catch(() => setHashtagSuggestions([]));
    } else {
      setHashtagSuggestions([]);
    }
  }, [keyword]);

  useEffect(() => {
    if (!isAuthLoading && reels.length === 0 && page === 1) {
      loadMore();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthLoading]);

  useEffect(() => {
    if (accessToken && page === 1 && reels.length > 0) {
      setReels([]);
      setPage(1);
      setHasMore(true);
      setCurrentIndex(0);
      loadMore();
    } else if (accessToken && currentIndex >= reels.length - 2 && hasMore && !loading) {
      loadMore();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex, accessToken, loading]);

  const handleLike = (idReel, liked, count) => {
    if (!isLogin) {
      showToast({
        text: "Vui lòng đăng nhập để thực hiện hành động này",
        type: "error",
      });
      return;
    }
    setReels((prev) => prev.map((r) => (r.idReel === idReel ? { ...r, isLiked: liked, likesCount: count } : r)));
    setSearchResults((prev) =>
      prev.map((r) => (r.idReel === idReel ? { ...r, isLiked: liked, likesCount: count } : r)),
    );
  };

  const handleCommentClick = (i) => {
    if (!isLogin) {
      showToast({
        text: "Vui lòng đăng nhập để thực hiện hành động này",
        type: "error",
      });
      return;
    }
    setDetailIndex(i);
    setShowDetail(true);
  };

  const scrollToVideo = (index) => {
    const container = rightColumnRef.current;
    const videoEl = container?.querySelector(`[data-reel-index="${index}"]`);
    if (videoEl) videoEl.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const handleNext = () => {
    if (currentIndex + 1 >= reels.length) return;
    const next = currentIndex + 1;
    setCurrentIndex(next);
    scrollToVideo(next);
    setCanScroll(false);
    setTimeout(() => setCanScroll(true), SCROLL_COOLDOWN_MS);
  };

  const handlePrev = () => {
    if (currentIndex <= 0) return;
    const prev = currentIndex - 1;
    setCurrentIndex(prev);
    scrollToVideo(prev);
    setCanScroll(false);
    setTimeout(() => setCanScroll(true), SCROLL_COOLDOWN_MS);
  };

  const handleChangeVideo = (newIndex) => setDetailIndex(newIndex);

  const handleHashtagSearch = (tag) => {
    const q = `#${tag.trim()}`;
    setKeyword(q);
    performSearch(q);
  };

  const performSearch = async (q) => {
    if (!q) return;
    try {
      setSearchLoading(true);
      const data = await searchReels(q, accessToken);
      setSearchResults(data || []);
      setIsSearching(true);
      setTimeout(() => {
        if (rightColumnRef.current) {
          rightColumnRef.current.scrollTo({ top: 0, behavior: "smooth" });
        }
      }, 50);
    } catch (err) {
      console.error("Lỗi tìm kiếm:", err);
      showToast({ text: "Lỗi tìm kiếm video, vui lòng thử lại", type: "error" });
    } finally {
      setSearchLoading(false);
      window.history.replaceState({}, document.title);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const q = keyword.trim();
    if (!q) {
      setIsSearching(false);
      setSearchResults([]);
      return;
    }
    performSearch(q);
  };

  useEffect(() => {
    if (!keyword || !keyword.trim()) {
      setIsSearching(false);
      setSearchResults([]);
    }
  }, [keyword]);

  useEffect(() => {
    const container = rightColumnRef.current;
    if (!container) return;

    const handleWheel = (e) => {
      if (isSearching) return;
      e.preventDefault();
      if (!canScroll) return;
      const dir = e.deltaY > 50 ? "down" : e.deltaY < -50 ? "up" : null;
      if (dir === "down") handleNext();
      else if (dir === "up") handlePrev();
    };

    const handleTouchStart = (e) => (touchStartY.current = e.touches[0].clientY);
    const handleTouchEnd = (e) => {
      if (isSearching) return;
      if (!canScroll) return;
      const delta = touchStartY.current - e.changedTouches[0].clientY;
      if (Math.abs(delta) < 50) return;
      if (delta > 0) handleNext();
      else handlePrev();
    };

    container.addEventListener("wheel", handleWheel, { passive: false });
    container.addEventListener("touchstart", handleTouchStart, { passive: true });
    container.addEventListener("touchend", handleTouchEnd, { passive: true });

    return () => {
      container.removeEventListener("wheel", handleWheel);
      container.removeEventListener("touchstart", handleTouchStart);
      container.removeEventListener("touchend", handleTouchEnd);
    };
  }, [canScroll, currentIndex, reels, isSearching]);

  useEffect(() => {
    const container = rightColumnRef.current;
    if (!container) return;

    const videos = container.querySelectorAll(`[data-reel-index] video`);
    videos.forEach((video) => {
      if (showDetail) {
        video.pause();
      } else if (video.closest(`[data-reel-index="${currentIndex}"]`)) {
        video.play().catch(() => {});
      }
    });
  }, [showDetail, currentIndex]);

  if (!isSearching && loading && reels.length === 0)
    return (
      <div className={styles.centerContainer}>
        <div className={styles.grainOverlay}></div>
        <p>ĐANG TẢI VIDEO...</p>
      </div>
    );

  if (!isSearching && reels.length === 0)
    return (
      <div className={styles.centerContainer}>
        <div className={styles.grainOverlay}></div>
        <p>CHƯA CÓ VIDEO NÀO.</p>
      </div>
    );

  return (
    <div className={styles.pageWrapper}>
      <div className={styles.grainOverlay}></div>

      {/* CỘT TRÁI - TÌM KIẾM */}
      <div className={styles.leftColumn}>
        <form onSubmit={handleSearchSubmit} className={styles.searchBar}>
          <input
            type="text"
            placeholder="TÌM KIẾM HASHTAG, THỢ CẮT..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
          />
          <button type="submit">TÌM</button>
        </form>

        {hashtagSuggestions.length > 0 && (
          <div className={styles.suggestionBox}>
            <p className={styles.suggestionTitle}>Gợi ý Hashtag</p>
            <div className={styles.hashtagList}>
              {hashtagSuggestions.map((tag) => (
                <button
                  key={tag.idHashtag}
                  className={styles.hashtagItem}
                  onClick={() => handleHashtagSearch(tag.name)}
                >
                  #{tag.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {keyword && (
          <button
            type="button"
            className={styles.clearBtn}
            onClick={() => {
              setKeyword("");
              setIsSearching(false);
              setSearchResults([]);
            }}
          >
            <span>XÓA TÌM KIẾM</span>
          </button>
        )}

        {topHashtags.length > 0 && (
          <div className={styles.topHashtagBox}>
            <p className={styles.topHashtagTitle}>Xu hướng nổi bật</p>
            <div className={styles.hashtagList}>
              {topHashtags.map((tag) => (
                <button
                  key={tag.idHashtag}
                  className={styles.hashtagItem}
                  onClick={() => handleHashtagSearch(tag.name)}
                >
                  #{tag.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* CỘT PHẢI - VIDEO REELS HOẶC GRID TIKTOK */}
      <div className={`${styles.rightColumn} ${isSearching ? styles.searchingMode : ""}`} ref={rightColumnRef}>
        <div className={styles.rightContentInner}>
          {isSearching ? (
            <>
              {searchLoading && <p className={styles.loadingText}>ĐANG TÌM KIẾM...</p>}

              {!searchLoading && searchResults.length > 0 ? (
                <div className={styles.gridContainer}>
                  {searchResults.map((reel, i) => (
                    <div key={reel.idReel} className={styles.gridItem}>
                      <VideoCard
                        reel={reel}
                        onToggleLike={() =>
                          handleLike(reel.idReel, !reel.isLiked, reel.likesCount + (reel.isLiked ? -1 : 1))
                        }
                        onOpenDetail={() => {
                          if (!isLogin) {
                            showToast({
                              text: "Vui lòng đăng nhập để xem chi tiết video",
                              type: "error",
                            });
                            return;
                          }
                          setDetailIndex(i);
                          setShowDetail(true);
                        }}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                !searchLoading && <p className={styles.noResult}>Không tìm thấy kết quả phù hợp.</p>
              )}
            </>
          ) : (
            // MODE XEM REEL BÌNH THƯỜNG (Vuốt dọc)
            reels.map((reel, i) => (
              <div
                key={reel.idReel}
                data-reel-index={i}
                className={styles.reelWrapper}
                style={{
                  display: i === currentIndex ? "flex" : "none",
                }}
              >
                <div className={styles.videoHighlightContainer}>
                  <ReelPlayer
                    reel={reel}
                    token={accessToken}
                    isActive={i === currentIndex && !showDetail}
                    globalMuted={globalMuted}
                    onToggleGlobalMuted={() => setGlobalMuted((prev) => !prev)}
                    onLike={() => handleLike(reel.idReel, !reel.isLiked, reel.likesCount + (reel.isLiked ? -1 : 1))}
                    onComment={() => handleCommentClick(i)}
                    onNavUp={handlePrev}
                    onNavDown={handleNext}
                    onHashtagClick={handleHashtagSearch}
                    hasPrev={currentIndex > 0}
                    hasNext={currentIndex + 1 < reels.length}
                  />
                </div>
              </div>
            ))
          )}

          {/* Dialog chi tiết video */}
          {showDetail && (
            <VideoDetailDialog
              reels={isSearching ? searchResults : reels}
              currentIndex={detailIndex}
              onClose={() => setShowDetail(false)}
              onToggleLike={handleLike}
              onChangeVideo={handleChangeVideo}
              token={accessToken}
              globalMuted={globalMuted}
              onToggleGlobalMuted={() => setGlobalMuted((prev) => !prev)}
              fromReelPlayer={!isSearching}
              onHashtagClick={handleHashtagSearch}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default Reel;
