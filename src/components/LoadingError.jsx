export function LoadingError({ loading, error }) {
  if (loading) return <div className="notice">Carregando informações...</div>;
  if (error) return <div className="notice error">Não foi possível carregar: {error}</div>;
  return null;
}
