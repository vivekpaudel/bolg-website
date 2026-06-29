import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="not-found">
      <span className="not-found-code">404</span>
      <h1 className="not-found-title">Page not found</h1>
      <p className="not-found-body">
        The page you're looking for doesn't exist or has been moved.
      </p>
      <Link to="/" className="not-found-back">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
        Back to home
      </Link>
    </div>
  );
}
