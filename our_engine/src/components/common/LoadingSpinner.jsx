/* ============================================================
   LOADING SPINNER — Full page and inline variants
   ============================================================ */

export default function LoadingSpinner({ fullPage = false, size = 'md', text = '' }) {
  const sizeClass = size === 'sm' ? 'spinner-sm' : size === 'lg' ? 'spinner-lg' : '';

  if (fullPage) {
    return (
      <div className="loading-page">
        <div className={`spinner ${sizeClass}`} />
        {text && <p className="loading-page__text">{text}</p>}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center gap-3 p-4">
      <div className={`spinner ${sizeClass}`} />
      {text && <span className="text-muted" style={{ fontSize: 'var(--font-size-sm)' }}>{text}</span>}
    </div>
  );
}
