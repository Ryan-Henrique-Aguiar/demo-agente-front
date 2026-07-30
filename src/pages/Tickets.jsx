import { useEffect, useState } from 'react';
import { RefreshCcw, Search } from 'lucide-react';
import { api } from '../api/client.js';
import { PageHeader } from '../components/PageHeader.jsx';
import { StatusBadge } from '../components/StatusBadge.jsx';
import { EmptyState } from '../components/EmptyState.jsx';
import { LoadingError } from '../components/LoadingError.jsx';
import { formatDate } from '../utils/format.js';

const statuses = ['', 'ABERTO', 'EM_ANDAMENTO', 'CONCLUIDO', 'CANCELADO'];
const priorities = ['', 'BAIXA', 'MEDIA', 'ALTA', 'URGENTE'];

export function Tickets() {
  const [items, setItems] = useState([]);
  const [status, setStatus] = useState('');
  const [priority, setPriority] = useState('');
  const [code, setCode] = useState('');
  const [found, setFound] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function load() {
    setLoading(true);
    setError('');
    setFound(null);
    try { setItems(await api.tickets({ status, priority })); }
    catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }

  async function searchByCode(e) {
    e.preventDefault();
    if (!code.trim()) return;
    setLoading(true);
    setError('');
    try { setFound(await api.ticketByCode(code.trim())); }
    catch (err) { setError(err.message); setFound(null); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, [status, priority]);

  return (
    <section className="page-tickets">
      <PageHeader
        eyebrow="Fluxo 3"
        title="Suporte"
        description="Chamados abertos pela IA e consulta rápida por código, como SUP-1001."
        action={<button className="primary" onClick={load}><RefreshCcw size={16} />Atualizar</button>}
      />

      <form className="search-box" onSubmit={searchByCode}>
        <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="Consultar chamado por código" />
        <button><Search size={16} />Buscar</button>
      </form>

      <div className="filters">
        <label>Status</label>
        <select value={status} onChange={(e) => setStatus(e.target.value)}>{statuses.map((s) => <option key={s} value={s}>{s || 'Todos'}</option>)}</select>
        <label>Prioridade</label>
        <select value={priority} onChange={(e) => setPriority(e.target.value)}>{priorities.map((p) => <option key={p} value={p}>{p || 'Todas'}</option>)}</select>
      </div>

      <LoadingError loading={loading} error={error} />
      {found && <TicketCard item={found} highlight />}
      {!loading && !found && !items.length && <EmptyState />}
      {!found && <div className="card-list">{items.map((item) => <TicketCard key={item.id} item={item} />)}</div>}
    </section>
  );
}

function TicketCard({ item, highlight = false }) {
  return (
    <article className={`data-card ${highlight ? 'highlight' : ''}`}>
      <div className="card-top">
        <div><strong>{item.code}</strong><h3>{item.company}</h3></div>
        <div className="badge-group"><StatusBadge value={item.status} /><span className="badge priority">{item.priority || '-'}</span></div>
      </div>
      <div className="details-grid">
        <span>Solicitante <b>{item.name}</b></span>
        <span>Tipo <b>{item.requesterType}</b></span>
        <span>Produto <b>{item.product || '-'}</b></span>
        <span>E-mail <b>{item.email || '-'}</b></span>
        <span>Criado em <b>{formatDate(item.createdAt)}</b></span>
      </div>
      <p className="reason">{item.problem}</p>
    </article>
  );
}
