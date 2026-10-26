import { useEffect, useMemo, useRef, useState } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight, FlaskConical, LayoutGrid, RefreshCcw, Save, Stethoscope } from 'lucide-react';
import { api } from '../api/client.js';
import { PageHeader } from '../components/PageHeader.jsx';
import { StatusBadge } from '../components/StatusBadge.jsx';
import { EmptyState } from '../components/EmptyState.jsx';
import { LoadingError } from '../components/LoadingError.jsx';
import { DetailsModal } from '../components/DetailsModal.jsx';
import { formatDate, formatOnlyDate } from '../utils/format.js';

const medicalStatuses = ['', 'ABERTO', 'CONFIRMADO', 'EM_ANDAMENTO', 'CONCLUIDO', 'CANCELADO'];
const examStatuses = ['', 'ABERTO', 'CONFIRMADO', 'CANCELADO'];
const emptyFilters = { status: '', specialtyId: '', doctorId: '', examTypeId: '', date: '' };
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
  const [kind, setKind] = useState('medical');
  const [items, setItems] = useState([]);
  const [specialties, setSpecialties] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [examTypes, setExamTypes] = useState([]);
  const [filters, setFilters] = useState(emptyFilters);
  const [view, setView] = useState('calendar');
  const [calendarMonth, setCalendarMonth] = useState(() => new Date());
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const requestId = useRef(0);
  const activeKind = useRef(kind);

  async function load() {
    const currentRequest = ++requestId.current;
    setLoading(true);
    setError('');
    try {
      if (kind === 'exams') {
        const [records, types] = await Promise.all([
          api.examAppointments({ status: filters.status, examTypeId: filters.examTypeId, date: filters.date }),
          api.examTypes()
        ]);
        if (currentRequest !== requestId.current) return;
        setItems(records);
        setExamTypes(types);
      } else {
        const [records, specialtyList, doctorList] = await Promise.all([
          api.appointments({ status: filters.status, specialtyId: filters.specialtyId, doctorId: filters.doctorId, date: filters.date }),
          api.specialties(),
          api.doctors()
        ]);
        if (currentRequest !== requestId.current) return;
        setItems(records);
        setSpecialties(specialtyList);
        setDoctors(doctorList);
      }
    } catch (err) {
      if (currentRequest === requestId.current) setError(err.message);
    } finally {
      if (currentRequest === requestId.current) setLoading(false);
    }
  }

  async function update(id, payload) {
    try {
      if (kind === 'exams') await api.updateExamAppointment(id, payload);
      else await api.updateAppointment(id, payload);
      if (activeKind.current === kind) await load();
    } catch (err) {
      if (activeKind.current === kind) setError(err.message);
    }
  }

  useEffect(() => { load(); }, [kind, filters.status, filters.specialtyId, filters.doctorId, filters.examTypeId, filters.date]);

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

  function switchKind(nextKind) {
    if (nextKind === kind) return;
    requestId.current += 1;
    activeKind.current = nextKind;
    setKind(nextKind);
    setFilters(emptyFilters);
    setItems([]);
    setSelectedAppointment(null);
  }

  const isExamView = kind === 'exams';
  const statuses = isExamView ? examStatuses : medicalStatuses;

  return (
    <section className={`page-appointments${isExamView ? ' is-exams' : ''}`}>
      <PageHeader
        eyebrow="Fluxo 1"
        title={isExamView ? 'Agendamentos de exames' : 'Agendamentos médicos'}
        description={isExamView
          ? 'Exames registrados pela IA com paciente, tipo de exame, data e horário.'
          : 'Consultas registradas pela IA com paciente, especialidade, médico, data e horário.'}
        action={<button className="primary" onClick={load}><RefreshCcw size={16} />Atualizar</button>}
      />
      <div className="view-switcher" aria-label="Tipo de agendamento">
        <span>Agendamentos</span>
        <div className="view-switcher-options">
          <button type="button" className={!isExamView ? 'active' : ''} onClick={() => switchKind('medical')} aria-pressed={!isExamView}>
            <Stethoscope size={16} />Médicos
          </button>
          <button type="button" className={isExamView ? 'active' : ''} onClick={() => switchKind('exams')} aria-pressed={isExamView}>
            <FlaskConical size={16} />Exames
          </button>
        </div>
      </div>
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
        {isExamView ? (
          <>
            <label>Tipo de exame</label>
            <select value={filters.examTypeId} onChange={(e) => setFilter('examTypeId', e.target.value)}>
              <option value="">Todos</option>
              {examTypes.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </select>
          </>
        ) : (
          <>
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
          </>
        )}
        <label>Data</label>
        <input type="date" value={filters.date} onChange={(e) => setFilter('date', e.target.value)} />
      </div>
      <LoadingError loading={loading} error={error} />
      {!loading && !error && !items.length && <EmptyState />}
      {view === 'calendar' ? (
        <AppointmentCalendar days={days} month={calendarMonth} items={items} kind={kind} onSelect={setSelectedAppointment} onPrevious={() => setCalendarMonth((current) => new Date(current.getFullYear(), current.getMonth() - 1, 1))} onNext={() => setCalendarMonth((current) => new Date(current.getFullYear(), current.getMonth() + 1, 1))} />
      ) : (
        <div className="card-list">
          {sortedItems.map((item) => <AppointmentCard key={`${kind}-${item.id}`} item={item} kind={kind} onSave={update} />)}
        </div>
      )}
      {selectedAppointment && (
        <DetailsModal title={selectedAppointment.patientName} eyebrow={selectedAppointment.code} onClose={() => setSelectedAppointment(null)}>
          <StatusBadge value={selectedAppointment.status} />
          <div className="details-grid modal-details-grid">
            {isExamView ? (
              <>
                <span>Tipo de exame <b>{selectedAppointment.examType?.name || '-'}</b></span>
                <span>Duração <b>{selectedAppointment.examType?.durationMinutes || '-'} min</b></span>
                <span>Preparo <b>{selectedAppointment.examType?.preparation || 'Sem orientação cadastrada'}</b></span>
              </>
            ) : (
              <>
                <span>Especialidade <b>{selectedAppointment.specialty?.name || '-'}</b></span>
                <span>Médico <b>{selectedAppointment.doctor?.name || '-'}</b></span>
                <span>CRM <b>{selectedAppointment.doctor?.crm || '-'}</b></span>
              </>
            )}
            <span>Data <b>{formatOnlyDate(selectedAppointment.appointmentDate)}</b></span>
            <span>Horário <b>{selectedAppointment.startTime || '-'} - {selectedAppointment.endTime || '-'}</b></span>
            <span>Telefone <b>{selectedAppointment.phone || '-'}</b></span>
            <span>E-mail <b>{selectedAppointment.email || '-'}</b></span>
            <span>Criado em <b>{formatDate(selectedAppointment.createdAt)}</b></span>
          </div>
          {!isExamView && <p className="reason">{selectedAppointment.reason || 'Sem motivo informado.'}</p>}
          {selectedAppointment.notes && <p className="modal-note"><strong>Notas internas</strong>{selectedAppointment.notes}</p>}
        </DetailsModal>
      )}
    </section>
  );
}

function AppointmentCalendar({ days, month, items, kind, onSelect, onPrevious, onNext }) {
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
                    <small>{kind === 'exams' ? item.examType?.name || 'Exame' : item.doctor?.name || item.specialty?.name || 'Consulta'}</small>
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

function AppointmentCard({ item, kind, onSave }) {
  const [localStatus, setLocalStatus] = useState(item.status || 'ABERTO');
  const [notes, setNotes] = useState(item.notes || '');
  const isExam = kind === 'exams';
  const cardStatuses = isExam ? examStatuses.filter(Boolean) : medicalStatuses.filter(Boolean);

  useEffect(() => {
    setLocalStatus(item.status || 'ABERTO');
    setNotes(item.notes || '');
  }, [item.status, item.notes]);

  return (
    <article className="data-card">
      <div className="card-top">
        <div><strong>{item.code}</strong><h3>{item.patientName}</h3></div>
        <StatusBadge value={item.status} />
      </div>
      <div className="details-grid">
        {isExam ? (
          <>
            <span>Tipo de exame <b>{item.examType?.name || '-'}</b></span>
            <span>Duração <b>{item.examType?.durationMinutes || '-'} min</b></span>
            <span>Preparo <b>{item.examType?.preparation || 'Sem orientação cadastrada'}</b></span>
          </>
        ) : (
          <>
            <span>Especialidade <b>{item.specialty?.name || '-'}</b></span>
            <span>Médico <b>{item.doctor?.name || '-'}</b></span>
            <span>CRM <b>{item.doctor?.crm || '-'}</b></span>
          </>
        )}
        <span>Data <b>{formatOnlyDate(item.appointmentDate)}</b></span>
        <span>Horário <b>{item.startTime || '-'} - {item.endTime || '-'}</b></span>
        <span>Telefone <b>{item.phone || '-'}</b></span>
        <span>E-mail <b>{item.email || '-'}</b></span>
        <span>Criado em <b>{formatDate(item.createdAt)}</b></span>
      </div>
      {!isExam && <p className="reason">{item.reason || 'Sem motivo informado.'}</p>}
      <div className="edit-row">
        <select value={localStatus} disabled={isExam && item.status === 'CANCELADO'} onChange={(e) => setLocalStatus(e.target.value)}>{cardStatuses.map((s) => <option key={s}>{s}</option>)}</select>
        <input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notas internas" />
        <button onClick={() => onSave(item.id, { status: localStatus, notes })}><Save size={15} />Salvar</button>
      </div>
    </article>
  );
}
