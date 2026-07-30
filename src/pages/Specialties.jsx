import { useEffect, useState } from 'react';
import { RefreshCcw, Save, Trash2 } from 'lucide-react';
import { api } from '../api/client.js';
import { PageHeader } from '../components/PageHeader.jsx';
import { EmptyState } from '../components/EmptyState.jsx';
import { LoadingError } from '../components/LoadingError.jsx';
import { activeText, formatDate } from '../utils/format.js';

export function Specialties() {
  const [items, setItems] = useState([]);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function load() {
    setLoading(true);
    setError('');
    try { setItems(await api.specialties()); }
    catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }

  async function create(e) {
    e.preventDefault();
    if (!name.trim()) return;
    await api.createSpecialty({ name: name.trim() });
    setName('');
    await load();
  }

  useEffect(() => { load(); }, []);

  return (
    <section className="page-specialties">
      <PageHeader
        eyebrow="Cadastro médico"
        title="Especialidades"
        description="Especialidades disponíveis para o agente consultar e oferecer no agendamento médico."
        action={<button className="primary" onClick={load}><RefreshCcw size={16} />Atualizar</button>}
      />
      <form className="search-box" onSubmit={create}>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nova especialidade" />
        <button><Save size={16} />Cadastrar</button>
      </form>
      <LoadingError loading={loading} error={error} />
      {!loading && !items.length && <EmptyState />}
      <div className="card-list">
        {items.map((item) => (
          <article className="data-card" key={item.id}>
            <div className="card-top">
              <div><strong>ESPECIALIDADE</strong><h3>{item.name}</h3></div>
              <span className={`badge ${item.isActive ? 'badge-concluido' : 'badge-cancelado'}`}>{activeText(item.isActive)}</span>
            </div>
            <div className="details-grid">
              <span>ID <b>{item.id}</b></span>
              <span>Criado em <b>{formatDate(item.createdAt)}</b></span>
            </div>
            
          </article>
        ))}
      </div>
    </section>
  );
}
