import { useEffect, useState } from 'react';
import { RefreshCcw } from 'lucide-react';
import { api } from '../api/client.js';
import { PageHeader } from '../components/PageHeader.jsx';
import { StatusBadge } from '../components/StatusBadge.jsx';
import { EmptyState } from '../components/EmptyState.jsx';
import { LoadingError } from '../components/LoadingError.jsx';
import { boolText, formatDate } from '../utils/format.js';
import { Download} from 'lucide-react';


export function Opportunities() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [agentName, setAgentName] = useState('');
  const [downloading, setDownloading] = useState(false);

  const agents = [
  ...new Set(
    items
      .map((item) => item.agent)
      .filter(Boolean)
  )
];

  async function load() {
    setLoading(true);
    setError('');
    try { setItems(await api.opportunities()); }
    catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }
  async function exportCsv() {
  setDownloading(true);
  setError('');

  try {
    await api.opportunityByAgentCsv({
      agent: agentName || undefined
    });
  } catch (err) {
    setError(err.message);
  } finally {
    setDownloading(false);
  }
}
  

  useEffect(() => { load(); }, []);

  return (
    <section className="page-opportunities">
      <PageHeader
        eyebrow="Fluxo 2"
        title="Comercial"
        description="Oportunidades simuladas para interessados em PABX, atendimento, omnichannel e IA."
        
        action={
          <div className="header-actions">

            <button className="primary" onClick={load}>
              <RefreshCcw size={16} />
              Atualizar
            </button>
          </div>
        }
      />
    
      
      <LoadingError loading={loading} error={error} />
      {!loading && !items.length && <EmptyState />}

        <p>Selecione o Agente e gere um arquivo CSV dos atendimentos.</p>
      <div className="filters">
        
      
        <select className="agent-select" value={agentName} onChange={(event) => setAgentName(event.target.value)}>
          <option value="">Agentes</option>
            
          {agents.map((agent) => (

            <option key={agent} value={agent}>{agent}</option>
          ))}
        </select>
        <button
            className="primary"
            onClick={exportCsv}
            disabled={downloading || !agentName}
            >
            <Download size={16} />
            {downloading ? 'Gerando...' : 'Exportar CSV'}
        </button>
        
      </div>
      <div className="card-list">
        {items.map((item) => (
          <article className="data-card" key={item.id}>
            <div className="card-top">
              <div><strong>{item.code}</strong><h3>{item.company}</h3></div>
              <StatusBadge value={item.status} />
            </div>
            <div className="details-grid">
              <span>Contato <b>{item.contactName}</b></span>
              <span>E-mail <b>{item.email}</b></span>
              <span>Telefone <b>{item.phone}</b></span>
              <span>Criado em <b>{formatDate(item.createdAt)}</b></span>
              <span>Possui PABX <b>{boolText(item.hasPabx)}</b></span>
              <span>Alto volume <b>{boolText(item.highVolume)}</b></span>
              <span>Canais digitais <b>{item.digitalChannels || '-'}</b></span>
              <span>Agente <b>{item.agent || '-'}</b></span>
            </div>
            <p className="reason">{item.need}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
