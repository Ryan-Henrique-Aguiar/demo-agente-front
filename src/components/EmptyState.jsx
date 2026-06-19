export function EmptyState({ title = 'Nenhum registro encontrado', description = 'Os dados aparecerão aqui quando forem cadastrados pela IA.' }) {
  return (
    <div className="empty-state">
      <strong>{title}</strong>
      <p>{description}</p>
    </div>
  );
}
