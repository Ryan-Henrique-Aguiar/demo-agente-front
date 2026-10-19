import { useEffect, useMemo, useState } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight, LayoutGrid, RefreshCcw, Save } from 'lucide-react';
import { api } from '../api/client.js';
import { PageHeader } from '../components/PageHeader.jsx';
import { StatusBadge } from '../components/StatusBadge.jsx';
import { EmptyState } from '../components/EmptyState.jsx';
import { LoadingError } from '../components/LoadingError.jsx';
import { DetailsModal } from '../components/DetailsModal.jsx';
import { formatDate, formatOnlyDate } from '../utils/format.js';

const statuses = ['', 'ABERTO', 'CONFIRMADO', 'EM_ANDAMENTO', 'CONCLUIDO', 'CANCELADO'];
const calendarWeekdays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

function dateKey(value) {
  return String(value || '').split('T')[0];
}

function monthLabel(date) {
  return new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(date);
}

function calendarDays(date) {
  const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
  const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  const leadingDays = firstDay.getDay();
  const totalDays = Math.ceil((leadingDays + lastDay.getDate()) / 7) * 7;

  return Array.from({ length: totalDays }, (_, index) => {
    const day = index - leadingDays + 1;
    return new Date(date.getFullYear(), date.getMonth(), day);
  });
}

function localDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function Appointments() {
  const [items, setItems] = useState([]);
  const [specialties, setSpecialties] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [filters, setFilters] = useState({ status: '', specialtyId: '', doctorId: '', date: '' });
  const [view, setView] = useState('calendar');
  const [calendarMonth, setCalendarMonth] = useState(() => new Date());
  const [selectedAppointment, setSelectedAppointment] = useState(null);
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

  const days = useMemo(() => calendarDays(calendarMonth), [calendarMonth]);

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
      <div className="view-switcher" aria-label="Modo de exibição dos agendamentos">
        <span>Exibir como</span>
        <div className="view-switcher-options">
          <button className={view === 'calendar' ? 'active' : ''} onClick={() => setView('calendar')} aria-pressed={view === 'calendar'}>
            <CalendarDays size={16} />Calendário
          </button>
          <button className={view === 'cards' ? 'active' : ''} onClick={() => setView('cards')} aria-pressed={view === 'cards'}>
            <LayoutGrid size={16} />Cards
          </button>
        </div>
      </div>
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
      {view === 'calendar' ? (
        <AppointmentCalendar days={days} month={calendarMonth} items={items} onSelect={setSelectedAppointment} onPrevious={() => setCalendarMonth((current) => new Date(current.getFullYear(), current.getMonth() - 1, 1))} onNext={() => setCalendarMonth((current) => new Date(current.getFullYear(), current.getMonth() + 1, 1))} />
      ) : (
        <div className="card-list">
          {sortedItems.map((item) => <AppointmentCard key={item.id} item={item} onSave={update} />)}
        </div>
      )}
      {selectedAppointment && (
        <DetailsModal title={selectedAppointment.patientName} eyebrow={selectedAppointment.code} onClose={() => setSelectedAppointment(null)}>
          <StatusBadge value={selectedAppointment.status} />
          <div className="details-grid modal-details-grid">
            <span>Especialidade <b>{selectedAppointment.specialty?.name || '-'}</b></span>
            <span>Médico <b>{selectedAppointment.doctor?.name || '-'}</b></span>
            <span>CRM <b>{selectedAppointment.doctor?.crm || '-'}</b></span>
            <span>Data <b>{formatOnlyDate(selectedAppointment.appointmentDate)}</b></span>
            <span>Horário <b>{selectedAppointment.startTime || '-'} - {selectedAppointment.endTime || '-'}</b></span>
            <span>Telefone <b>{selectedAppointment.phone || '-'}</b></span>
            <span>E-mail <b>{selectedAppointment.email || '-'}</b></span>
            <span>Criado em <b>{formatDate(selectedAppointment.createdAt)}</b></span>
          </div>
          <p className="reason">{selectedAppointment.reason || 'Sem motivo informado.'}</p>
          {selectedAppointment.notes && <p className="modal-note"><strong>Notas internas</strong>{selectedAppointment.notes}</p>}
        </DetailsModal>
      )}
    </section>
  );
}

function AppointmentCalendar({ days, month, items, onSelect, onPrevious, onNext }) {
  const today = new Date();

  return (
    <div className="appointment-calendar">
      <div className="calendar-header">
        <button className="calendar-nav" onClick={onPrevious} aria-label="Mês anterior"><ChevronLeft size={18} /></button>
        <h2>{monthLabel(month)}</h2>
        <button className="calendar-nav" onClick={onNext} aria-label="Próximo mês"><ChevronRight size={18} /></button>
      </div>
      <div className="calendar-weekdays">
        {calendarWeekdays.map((weekday) => <span key={weekday}>{weekday}</span>)}
      </div>
      <div className="calendar-grid">
        {days.map((day) => {
          const dayKey = localDateKey(day);
          const dayItems = items.filter((item) => dateKey(item.appointmentDate) === dayKey);
          const isCurrentMonth = day.getMonth() === month.getMonth();
          const isToday = day.toDateString() === today.toDateString();

          return (
            <div className={`calendar-day${isCurrentMonth ? '' : ' muted'}${isToday ? ' today' : ''}`} key={dayKey}>
              <span className="calendar-day-number">{day.getDate()}</span>
              <div className="calendar-events">
                {dayItems.map((item) => (
                  <div className="calendar-event" key={item.id} role="button" tabIndex="0" onClick={() => onSelect(item)} onKeyDown={(event) => event.key === 'Enter' && onSelect(item)} title={`${item.patientName} - ${item.startTime || 'Horário não informado'}`}>
                    <strong>{item.startTime || '--:--'}</strong>
                    <span>{item.patientName}</span>
                    <small>{item.doctor?.name || item.specialty?.name || 'Agendamento'}</small>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
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
