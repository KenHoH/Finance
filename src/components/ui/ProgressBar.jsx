export default function ProgressBar({ percent, color = 'accent', height = 6 }) {
  const cls = percent >= 100 ? 'progress-red' : percent >= 80 ? 'progress-yellow' : `progress-${color}`;
  return (
    <div className={`progress-bar-wrap ${cls}`} style={{ height }}>
      <div className="progress-bar-fill" style={{ width: `${Math.min(percent, 100)}%` }} />
    </div>
  );
}
