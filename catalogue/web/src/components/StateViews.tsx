export function Loading({ label = 'Loading…' }: { label?: string }) {
  return <div className="state-panel" role="status"><p>{label}</p></div>;
}

export function ErrorMessage({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="state-panel" role="alert">
      <p>{message}</p>
      <button className="button button-secondary" data-testid="retry-button" type="button" onClick={onRetry}>Try again</button>
    </div>
  );
}

export function EmptyState({ message = 'No products matched that search.' }: { message?: string }) {
  return <div className="state-panel" data-testid="no-results"><p>{message}</p></div>;
}
