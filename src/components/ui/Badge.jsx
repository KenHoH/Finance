export default function Badge({ children, color = 'muted' }) {
  return <span className={`badge badge-${color}`}>{children}</span>;
}
