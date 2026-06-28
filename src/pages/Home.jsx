import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import ArticleCard from '../components/ArticleCard';

export default function Home() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

  return (
    <section className="home">
      <header className="home-hero">
        <h1>Welcome to the Blog</h1>
        <p className="home-subtitle">
          Thoughts on web development, design, and technology.
        </p>
      </header>

      {loading && <p className="loading">Loading posts…</p>}

      {error && (
        <p className="home-error">Failed to load posts: {error}</p>
      )}

      {!loading && !error && posts.length === 0 && (
        <p className="home-empty">No posts yet. Check back soon!</p>
      )}

      {!loading && !error && posts.length > 0 && (
        <div className="home-grid">
          {posts.map(({ slug, title, excerpt, created_at }) => (
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
