export function StatusBadge({ value }) {
  return <span className={`badge badge-${String(value || '').toLowerCase()}`}>{value || '-'}</span>;
}
