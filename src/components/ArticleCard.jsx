import { Link } from 'react-router-dom';

export default function ArticleCard({ title, excerpt, slug, date }) {
  const formattedDate = date
    ? new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : null;

  return (
    <article className="article-card">
      <Link to={`/blog/${slug}`} className="article-card-link">
        <h2 className="article-card-title">{title}</h2>
        {formattedDate && (
          <time className="article-card-date" dateTime={date}>
            {formattedDate}
          </time>
        )}
        {excerpt && <p className="article-card-excerpt">{excerpt}</p>}
        <span className="article-card-read">
          Read
          {/* Arrow-right icon */}
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </span>
      </Link>
    </article>
  );
}
