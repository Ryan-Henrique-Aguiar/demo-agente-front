import { useEffect, useMemo, useState } from 'react';
import { RefreshCcw, Save } from 'lucide-react';
import { api } from '../api/client.js';
import { PageHeader } from '../components/PageHeader.jsx';
import { StatusBadge } from '../components/StatusBadge.jsx';
import { EmptyState } from '../components/EmptyState.jsx';
import { LoadingError } from '../components/LoadingError.jsx';
import { formatDate, formatOnlyDate } from '../utils/format.js';

const statuses = ['', 'ABERTO', 'EM_ANDAMENTO', 'CONCLUIDO', 'CANCELADO'];

export function Appointments() {
  const [items, setItems] = useState([]);
  const [specialties, setSpecialties] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [filters, setFilters] = useState({ status: '', specialtyId: '', doctorId: '', date: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function loadOptions() {
    const [specialtyList, doctorList] = await Promise.all([api.specialties(), api.doctors()]);
    setSpecialties(specialtyList);
    setDoctors(doctorList);
  }

  async function load() {
    setLoading(true);
    setError('');
    try {
      const [records] = await Promise.all([api.appointments(filters), loadOptions()]);
      setItems(records);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function update(id, payload) {
    await api.updateAppointment(id, payload);
    await load();
  }

  useEffect(() => { load(); }, [filters.status, filters.specialtyId, filters.doctorId, filters.date]);

  const filteredDoctors = useMemo(() => {
    if (!filters.specialtyId) return doctors;
    return doctors.filter((doctor) => doctor.specialtyId === filters.specialtyId);
  }, [doctors, filters.specialtyId]);

  const sortedItems = useMemo(() => {
  return [...items].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}, [items]);

  function setFilter(name, value) {
    setFilters((current) => ({
      ...current,
      [name]: value,
      ...(name === 'specialtyId' ? { doctorId: '' } : {})
    }));
  }

  return (
    <section className="page-appointments">
      <PageHeader
        eyebrow="Fluxo 1"
        title="Agendamentos médicos"
        description="Consultas registradas pela IA com paciente, especialidade, médico, data e horário."
        action={<button className="primary" onClick={load}><RefreshCcw size={16} />Atualizar</button>}
      />
      <div className="filters">
        <label>Status</label>
        <select value={filters.status} onChange={(e) => setFilter('status', e.target.value)}>
          {statuses.map((item) => <option key={item} value={item}>{item || 'Todos'}</option>)}
        </select>
        <label>Especialidade</label>
        <select value={filters.specialtyId} onChange={(e) => setFilter('specialtyId', e.target.value)}>
          <option value="">Todas</option>
          {specialties.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
        </select>
        <label>Médico</label>
        <select value={filters.doctorId} onChange={(e) => setFilter('doctorId', e.target.value)}>
          <option value="">Todos</option>
          {filteredDoctors.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
        </select>
        <label>Data</label>
        <input type="date" value={filters.date} onChange={(e) => setFilter('date', e.target.value)} />
      </div>
      <LoadingError loading={loading} error={error} />
      {!loading && !items.length && <EmptyState />}
      <div className="card-list">
        {sortedItems.map((item) => <AppointmentCard key={item.id} item={item} onSave={update} />)}
      </div>
    </section>
  );
}

function AppointmentCard({ item, onSave }) {
  const [localStatus, setLocalStatus] = useState(item.status || 'ABERTO');
  const [notes, setNotes] = useState(item.notes || '');

  return (
    <article className="data-card">
      <div className="card-top">
        <div><strong>{item.code}</strong><h3>{item.patientName}</h3></div>
        <StatusBadge value={item.status} />
      </div>
      <div className="details-grid">
        <span>Especialidade <b>{item.specialty?.name || '-'}</b></span>
        <span>Médico <b>{item.doctor?.name || '-'}</b></span>
        <span>CRM <b>{item.doctor?.crm || '-'}</b></span>
        <span>Data <b>{formatOnlyDate(item.appointmentDate)}</b></span>
        <span>Horário <b>{item.startTime} - {item.endTime}</b></span>
        <span>Telefone <b>{item.phone}</b></span>
        <span>E-mail <b>{item.email}</b></span>
        <span>Criado em <b>{formatDate(item.createdAt)}</b></span>
      </div>
      <p className="reason">{item.reason || 'Sem motivo informado.'}</p>
      <div className="edit-row">
        <select value={localStatus} onChange={(e) => setLocalStatus(e.target.value)}>{statuses.filter(Boolean).map((s) => <option key={s}>{s}</option>)}</select>
        <input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notas internas" />
        <button onClick={() => onSave(item.id, { status: localStatus, notes })}><Save size={15} />Salvar</button>
      </div>
    </article>
  );
}
