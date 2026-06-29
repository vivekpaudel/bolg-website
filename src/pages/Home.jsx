import { useEffect, useState, useMemo } from 'react';
import { supabase } from '../lib/supabaseClient';
import ArticleCard from '../components/ArticleCard';

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

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    const fetchPosts = async () => {
      const { data, error: fetchError } = await supabase
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) {
        setError(fetchError.message);
      } else {
        setPosts(data);
      }
      setLoading(false);
    };

    fetchPosts();
  }, []);

  const filteredPosts = useMemo(() => {
    if (!search.trim()) return posts;
    const q = search.toLowerCase();
    return posts.filter(
      ({ title, excerpt }) =>
        title.toLowerCase().includes(q) ||
        (excerpt && excerpt.toLowerCase().includes(q))
    );
  }, [posts, search]);

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
          {search.trim()
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
    </section>
  );
}
