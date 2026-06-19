import { useEffect, useState } from 'react';
import { CalendarCheck, Headset, RefreshCcw, Stethoscope, TrendingUp, UsersRound } from 'lucide-react';
import { api } from '../api/client.js';
import { PageHeader } from '../components/PageHeader.jsx';
import { LoadingError } from '../components/LoadingError.jsx';

function statusCount(group, status) {
  return group?.byStatus?.[status] ?? group?.[status.toLowerCase()] ?? 0;
}

export function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function load() {
    setLoading(true);
    setError('');
    try {
      setData(await api.summary());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  const openTotal =
    statusCount(data?.appointments, 'ABERTO') +
    statusCount(data?.opportunities, 'ABERTO') +
    statusCount(data?.tickets, 'ABERTO');

  const cards = [
    { label: 'Agendamentos médicos', value: data?.appointments?.total ?? 0, icon: CalendarCheck },
    { label: 'Médicos', value: data?.doctors?.total ?? 0, icon: Stethoscope },
    { label: 'Especialidades', value: data?.specialties?.total ?? 0, icon: UsersRound },
    { label: 'Oportunidades', value: data?.opportunities?.total ?? 0, icon: TrendingUp },
    { label: 'Chamados', value: data?.tickets?.total ?? 0, icon: Headset },
    { label: 'Registros abertos', value: openTotal, icon: RefreshCcw }
  ];

  return (
    <section>
      <PageHeader
        eyebrow="Visão geral"
        title="Painel de demonstração"
        description="Acompanhe os registros simulados criados pelo agente inteligente: agendamentos médicos, oportunidades comerciais e chamados de suporte."
        action={<button className="primary" onClick={load}><RefreshCcw size={16} />Atualizar</button>}
      />
      <LoadingError loading={loading} error={error} />
      <div className="metric-grid metric-grid-wide">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <article className="metric-card" key={card.label}>
              <Icon size={24} />
              <span>{card.label}</span>
              <strong>{card.value}</strong>
            </article>
          );
        })}
      </div>
      <div className="hero-card">
        <h2>Objetivo da demo</h2>
        <p>Mostrar como a IA pode coletar dados simples de pacientes, consultar especialidades e médicos, registrar agendamentos médicos e manter os demais fluxos comerciais e de suporte disponíveis para demonstração.</p>
      </div>
    </section>
  );
}
