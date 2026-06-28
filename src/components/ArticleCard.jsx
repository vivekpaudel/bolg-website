import { Link } from 'react-router-dom';

export default function ArticleCard({ title, excerpt, slug, date }) {
  const formattedDate = date
    ? new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : null;

  return (
    <article className="article-card">
      <Link to={`/blog/${slug}`} className="article-card-link">
        <h2 className="article-card-title">{title}</h2>
        {formattedDate && (
          <time className="article-card-date">{formattedDate}</time>
        )}
        {excerpt && <p className="article-card-excerpt">{excerpt}</p>}
        <span className="article-card-read">Read more →</span>
      </Link>
    </article>
  );
}
