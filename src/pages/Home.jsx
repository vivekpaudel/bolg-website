import { useEffect, useState, useMemo } from 'react';
import { supabase } from '../lib/supabaseClient';
import ArticleCard from '../components/ArticleCard';

const POSTS_PER_PAGE = 7;

function SkeletonCards() {
  return (
    <div className="home-grid" aria-hidden="true">
      {[1, 2, 3].map((n) => (
        <div key={n} className="skeleton-card">
          <div className="skeleton skeleton-title" />
          <div className="skeleton skeleton-date" />
          <div className="skeleton skeleton-excerpt" />
          <div className="skeleton skeleton-excerpt skeleton-excerpt--short" />
        </div>
      ))}
    </div>
  );
}

export default function Home() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const totalPages = Math.ceil(totalCount / POSTS_PER_PAGE);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    const fetchPosts = async () => {
      setLoading(true);
      setError(null);

      const from = (currentPage - 1) * POSTS_PER_PAGE;
      const to = currentPage * POSTS_PER_PAGE - 1;

      const { data, count, error: fetchError } = await supabase
        .from('posts')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(from, to);

      if (fetchError) {
        setError(fetchError.message);
      } else {
        setPosts(data);
        setTotalCount(count);
      }
      setLoading(false);
    };

    fetchPosts();
  }, [currentPage]);

  const filteredPosts = useMemo(() => {
    if (!search.trim()) return posts;
    const q = search.toLowerCase();
    return posts.filter(
      ({ title, excerpt }) =>
        title.toLowerCase().includes(q) ||
        (excerpt && excerpt.toLowerCase().includes(q))
    );
  }, [posts, search]);

  // Reset to page 1 when search changes (filters current page results)
  // and disable pagination UI while searching
  const isSearching = search.trim().length > 0;

  // Generate visible page numbers (show at most 5 around current)
  const pageNumbers = useMemo(() => {
    if (totalPages <= 1) return [];
    const pages = [];
    let start = Math.max(1, currentPage - 2);
    let end = Math.min(totalPages, currentPage + 2);
    // Expand if we're near the edges
    if (currentPage <= 3) end = Math.min(totalPages, 5);
    if (currentPage > totalPages - 3) start = Math.max(1, totalPages - 4);
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  }, [currentPage, totalPages]);

  return (
    <section className="home">
      <header className="home-hero">
        <h1>Welcome to the Blog</h1>
        <p className="home-subtitle">
          Thoughts on web development, design, and technology.
        </p>
      </header>

      <div className="home-search">
        <svg className="home-search-icon" viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          type="search"
          className="home-search-input"
          placeholder="Search posts…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Search blog posts"
        />
        {search && (
          <button
            className="home-search-clear"
            onClick={() => setSearch('')}
            aria-label="Clear search"
            type="button"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}
      </div>

      {loading && <SkeletonCards />}

      {error && (
        <p className="home-error">Failed to load posts: {error}</p>
      )}

      {!loading && !error && filteredPosts.length === 0 && (
        <p className="home-empty">
          {isSearching
            ? `No posts matching "${search.trim()}".`
            : 'No posts yet. Check back soon!'}
        </p>
      )}

      {!loading && !error && filteredPosts.length > 0 && (
        <div className="home-grid">
          {filteredPosts.map(({ slug, title, excerpt, created_at }) => (
            <ArticleCard
              key={slug}
              slug={slug}
              title={title}
              excerpt={excerpt}
              date={created_at}
            />
          ))}
        </div>
      )}

      {/* ── Pagination ── */}
      {!loading && !error && !isSearching && totalPages > 1 && (
        <nav className="pagination" aria-label="Pagination">
          <button
            className="pagination-arrow"
            onClick={() => setCurrentPage((p) => p - 1)}
            disabled={currentPage === 1}
            aria-label="Previous page"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 18l-6-6 6-6" /></svg>
            Prev
          </button>

          <div className="pagination-pages">
            {pageNumbers.map((page) => (
              <button
                key={page}
                className={`pagination-page${page === currentPage ? ' is-current' : ''}`}
                onClick={() => setCurrentPage(page)}
                aria-label={`Page ${page}`}
                aria-current={page === currentPage ? 'page' : undefined}
              >
                {page}
              </button>
            ))}
          </div>

          <button
            className="pagination-arrow"
            onClick={() => setCurrentPage((p) => p + 1)}
            disabled={currentPage === totalPages}
            aria-label="Next page"
          >
            Next
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 18l6-6-6-6" /></svg>
          </button>
        </nav>
      )}
    </section>
  );
}
