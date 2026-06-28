import { useParams, Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

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

  if (loading) return <p className="loading">Loading…</p>;

  if (error) {
    return (
      <article className="blog-post">
        <Link to="/" className="blog-post-back">← Back to all posts</Link>
        <h1>Post not found</h1>
        <p className="blog-post-error">{error}</p>
      </article>
    );
  }

  if (!post) {
    return (
      <article className="blog-post">
        <Link to="/" className="blog-post-back">← Back to all posts</Link>
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
          ← Back to all posts
        </Link>
        <h1>{post.title}</h1>
        <time className="blog-post-date">{formattedDate}</time>
      </header>

      <div className="blog-post-content">
        {post.content?.split('\n').map((paragraph, i) => (
          paragraph.trim() ? <p key={i}>{paragraph}</p> : null
        ))}
      </div>
    </article>
  );
}
