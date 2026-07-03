import { useEffect, useMemo, useState } from 'react';
import { CalendarSearch, RefreshCcw, Save, X } from 'lucide-react';
import { api } from '../api/client.js';
import { PageHeader } from '../components/PageHeader.jsx';
import { EmptyState } from '../components/EmptyState.jsx';
import { LoadingError } from '../components/LoadingError.jsx';
import { activeText, formatDate, formatOnlyDate, weekdayText } from '../utils/format.js';

export function Doctors() {
  const [items, setItems] = useState([]);
  const [specialties, setSpecialties] = useState([]);
  const [specialtyId, setSpecialtyId] = useState('');
  const [isActive, setIsActive] = useState('true');
  const [form, setForm] = useState({ name: '', crm: '', specialtyId: '' });
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [availability, setAvailability] = useState(null);
  const [availabilityDate, setAvailabilityDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function load() {
    setLoading(true);
    setError('');
    try {
      const [doctors, specialtyList] = await Promise.all([
        api.doctors({ specialtyId, isActive }),
        api.specialties()
      ]);
      setItems(doctors);
      setSpecialties(specialtyList);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function create(e) {
    e.preventDefault();
    if (!form.name.trim() || !form.crm.trim() || !form.specialtyId) return;
    await api.createDoctor({ name: form.name.trim(), crm: form.crm.trim(), specialtyId: form.specialtyId });
    setForm({ name: '', crm: '', specialtyId: '' });
    await load();
  }

  async function showAvailability(doctor) {
    // clicar no mesmo médico que já está aberto, fecha o painel
    if (selectedDoctor?.id === doctor.id) {
      setSelectedDoctor(null);
      setAvailability(null);
      return;
    }
    setSelectedDoctor(doctor);
    setAvailability(null);
    try {
      const result = await api.doctorAvailability(doctor.id, availabilityDate, 7);
      setAvailability(result);
    } catch (err) {
      setError(err.message);
    }
  }

  function closeAvailability() {
    setSelectedDoctor(null);
    setAvailability(null);
  }

  useEffect(() => { load(); }, [specialtyId, isActive]);
  useEffect(() => {
    if (selectedDoctor) showAvailability(selectedDoctor);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [availabilityDate]);

  const activeSpecialties = useMemo(() => specialties.filter((item) => item.isActive), [specialties]);

  return (
    <section>
      <PageHeader
        eyebrow="Cadastro médico"
        title="Médicos"
        description="Médicos, CRM, especialidade e consulta rápida de disponibilidade."
        action={<button className="primary" onClick={load}><RefreshCcw size={16} />Atualizar</button>}
      />

      <form className="search-box" onSubmit={create}>
        <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Nome do médico" />
        <input value={form.crm} onChange={(e) => setForm({ ...form, crm: e.target.value })} placeholder="CRM" />
        <select value={form.specialtyId} onChange={(e) => setForm({ ...form, specialtyId: e.target.value })}>
          <option value="">Especialidade</option>
          {activeSpecialties.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
        </select>
        <button><Save size={16} />Cadastrar</button>
      </form>

      <div className="filters">
        <label>Especialidade</label>
        <select value={specialtyId} onChange={(e) => setSpecialtyId(e.target.value)}>
          <option value="">Todas</option>
          {specialties.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
        </select>
        <label>Status</label>
        <select value={isActive} onChange={(e) => setIsActive(e.target.value)}>
          <option value="">Todos</option>
          <option value="true">Ativos</option>
          <option value="false">Inativos</option>
        </select>
        <label>Disponibilidade a partir de</label>
        <input type="date" value={availabilityDate} onChange={(e) => setAvailabilityDate(e.target.value)} />
      </div>

      <LoadingError loading={loading} error={error} />
      {!loading && !items.length && <EmptyState />}
      <div className="card-list">
        {items.map((item) => {
          const isOpen = selectedDoctor?.id === item.id;
          return (
            <article className="data-card" key={item.id}>
              <div className="card-top">
                <div><strong>{item.crm}</strong><h3>{item.name}</h3></div>
                <span className={`badge ${item.isActive ? 'badge-concluido' : 'badge-cancelado'}`}>{activeText(item.isActive)}</span>
              </div>
              <div className="details-grid">
                <span>Especialidade <b>{item.specialty?.name || '-'}</b></span>
                <span>Criado em <b>{formatDate(item.createdAt)}</b></span>
                <span>Atualizado em <b>{formatDate(item.updatedAt)}</b></span>
              </div>
              <div className="actions-row">
                <button onClick={() => showAvailability(item)}><CalendarSearch size={15} />Ver disponibilidade</button>
              </div>

              {isOpen && (
                <div className="availability-panel-inline">
                  <button className="close-btn" onClick={closeAvailability} aria-label="Fechar">
                    <X size={16} />
                  </button>
                  <h4>Disponibilidade — {item.name}</h4>
                  {!availability && <p>Carregando disponibilidade...</p>}
                  {availability && <AvailabilityContent data={availability} />}
                </div>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}

function AvailabilityContent({ data }) {
  const days = Array.isArray(data) ? data : data.availability || data.days || [];
  if (!days.length) return <p>Nenhum slot disponível retornado para o período.</p>;

  return (
    <div className="availability-grid">
      {days.map((day) => {
        const slots = day.slots || day.availableSlots || [];
        return (
          <div className="availability-day" key={day.date || day.weekday}>
            <strong>{formatOnlyDate(day.date)}</strong>
            {day.weekday && <span>{weekdayText(day.weekday)}</span>}
            <div className="slot-list">
              {slots.length ? slots.map((slot) => <span className="badge" key={typeof slot === 'string' ? slot : slot.startTime}>{typeof slot === 'string' ? slot : slot.startTime}</span>) : <em>Sem horários</em>}
            </div>
          </div>
        );
      })}
    </div>
  );
}