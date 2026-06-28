import { useParams, Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

function SkeletonPost() {
  return (
    <article className="blog-post" aria-hidden="true">
      <div className="skeleton skeleton-line" style={{ height: '0.75rem', width: '20%', marginBottom: '1.5rem' }} />
      <div className="skeleton skeleton-line" style={{ height: '2rem', width: '75%', marginBottom: '0.75rem' }} />
      <div className="skeleton skeleton-line" style={{ height: '0.75rem', width: '25%', marginBottom: '2.5rem' }} />
      <div className="skeleton skeleton-line" />
      <div className="skeleton skeleton-line" />
      <div className="skeleton skeleton-line skeleton-line--md" />
      <div className="skeleton skeleton-line skeleton-line--sm" />
    </article>
  );
}

export default function BlogPost() {
  const { slug } = useParams();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      setError('Supabase is not configured.');
      return;
    }

    const fetchPost = async () => {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('posts')
        .select('*')
        .eq('slug', slug)
        .single();

      if (fetchError) {
        setError(fetchError.message);
      } else {
        setPost(data);
      }
      setLoading(false);
    };

    fetchPost();
  }, [slug]);

  if (loading) return <SkeletonPost />;

  if (error) {
    return (
      <article className="blog-post">
        <Link to="/" className="blog-post-back">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          All posts
        </Link>
        <h1>Post not found</h1>
        <p className="blog-post-error">{error}</p>
      </article>
    );
  }

  if (!post) {
    return (
      <article className="blog-post">
        <Link to="/" className="blog-post-back">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          All posts
        </Link>
        <h1>Post not found</h1>
        <p>No post exists at this URL.</p>
      </article>
    );
  }

  const formattedDate = new Date(post.created_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <article className="blog-post">
      <header className="blog-post-header">
        <Link to="/" className="blog-post-back">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          All posts
        </Link>
        <h1>{post.title}</h1>
        <time className="blog-post-date" dateTime={post.created_at}>
          {formattedDate}
        </time>
      </header>

      <div className="blog-post-content">
        {post.content?.split('\n').map((paragraph, i) => (
          paragraph.trim() ? <p key={i}>{paragraph}</p> : null
        ))}
      </div>
    </article>
  );
}
