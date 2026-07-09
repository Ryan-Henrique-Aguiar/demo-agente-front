import { useEffect, useMemo, useState } from 'react';
import { CalendarSearch, RefreshCcw, Save, X, Settings, Trash2, Plus } from 'lucide-react';
import { api } from '../api/client.js';
import { PageHeader } from '../components/PageHeader.jsx';
import { EmptyState } from '../components/EmptyState.jsx';
import { LoadingError } from '../components/LoadingError.jsx';
import { activeText, formatDate, formatOnlyDate, weekdayText } from '../utils/format.js';

const WEEKDAYS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];

export function Doctors() {
  const [items, setItems] = useState([]);
  const [specialties, setSpecialties] = useState([]);
  const [specialtyId, setSpecialtyId] = useState('');
  const [isActive, setIsActive] = useState('true');
  const [form, setForm] = useState({ name: '', crm: '', specialtyId: '' });
  const [availabilityDate, setAvailabilityDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // painel único: { doctorId, type: 'availability' | 'schedule' } ou null
  const [openPanel, setOpenPanel] = useState(null);
  const [availability, setAvailability] = useState(null);

  // grade (schedules)
  const [schedules, setSchedules] = useState([]);
  const [schedulesLoading, setSchedulesLoading] = useState(false);
  const [scheduleForm, setScheduleForm] = useState({ weekday: 'MONDAY', startTime: '08:00', endTime: '12:00' });
  const [scheduleError, setScheduleError] = useState('');

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

  function closePanel() {
    setOpenPanel(null);
    setAvailability(null);
    setSchedules([]);
    setScheduleError('');
  }

  async function toggleAvailability(doctor) {
    const isSame = openPanel?.doctorId === doctor.id && openPanel?.type === 'availability';
    if (isSame) {
      closePanel();
      return;
    }
    setOpenPanel({ doctorId: doctor.id, type: 'availability' });
    setAvailability(null);
    try {
      const result = await api.doctorAvailability(doctor.id, availabilityDate, 7);
      setAvailability(result);
    } catch (err) {
      setError(err.message);
    }
  }

  async function toggleSchedule(doctor) {
    const isSame = openPanel?.doctorId === doctor.id && openPanel?.type === 'schedule';
    if (isSame) {
      closePanel();
      return;
    }
    setOpenPanel({ doctorId: doctor.id, type: 'schedule' });
    setScheduleForm({ weekday: 'MONDAY', startTime: '08:00', endTime: '12:00' });
    setScheduleError('');
    await loadSchedules(doctor.id);
  }

  async function loadSchedules(doctorId) {
    setSchedulesLoading(true);
    try {
      const list = await api.doctorSchedules(doctorId);
      setSchedules(list);
    } catch (err) {
      setScheduleError(err.message);
    } finally {
      setSchedulesLoading(false);
    }
  }

  async function addSchedule(doctorId) {
    setScheduleError('');
    if (scheduleForm.startTime >= scheduleForm.endTime) {
      setScheduleError('Horário final deve ser depois do inicial.');
      return;
    }
    try {
      await api.createDoctorSchedule(doctorId, scheduleForm);
      await loadSchedules(doctorId);
    } catch (err) {
      setScheduleError(err.message);
    }
  }

  async function removeSchedule(doctorId, scheduleId) {
    setScheduleError('');
    try {
      await api.deleteDoctorSchedule(doctorId, scheduleId);
      await loadSchedules(doctorId);
    } catch (err) {
      setScheduleError(err.message);
    }
  }

  useEffect(() => { load(); }, [specialtyId, isActive]);
  useEffect(() => {
    if (openPanel?.type === 'availability') {
      const doctor = items.find((d) => d.id === openPanel.doctorId);
      if (doctor) toggleReloadAvailability(doctor);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [availabilityDate]);

  async function toggleReloadAvailability(doctor) {
    setAvailability(null);
    try {
      const result = await api.doctorAvailability(doctor.id, availabilityDate, 7);
      setAvailability(result);
    } catch (err) {
      setError(err.message);
    }
  }

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
          const isAvailabilityOpen = openPanel?.doctorId === item.id && openPanel?.type === 'availability';
          const isScheduleOpen = openPanel?.doctorId === item.id && openPanel?.type === 'schedule';
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
                <button onClick={() => toggleAvailability(item)}><CalendarSearch size={15} />Ver disponibilidade</button>
                <button onClick={() => toggleSchedule(item)}><Settings size={15} />Gerenciar grade</button>
              </div>

              {isAvailabilityOpen && (
                <div className="availability-panel-inline">
                  <button className="close-btn" onClick={closePanel} aria-label="Fechar">
                    <X size={16} />
                  </button>
                  <h4>Disponibilidade — {item.name}</h4>
                  {!availability && <p>Carregando disponibilidade...</p>}
                  {availability && <AvailabilityContent data={availability} />}
                </div>
              )}

              {isScheduleOpen && (
                <SchedulePanel
                  doctor={item}
                  schedules={schedules}
                  loading={schedulesLoading}
                  error={scheduleError}
                  form={scheduleForm}
                  onFormChange={setScheduleForm}
                  onAdd={() => addSchedule(item.id)}
                  onRemove={(sid) => removeSchedule(item.id, sid)}
                  onClose={closePanel}
                />
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}

function SchedulePanel({ doctor, schedules, loading, error, form, onFormChange, onAdd, onRemove, onClose }) {
  return (
    <div className="availability-panel-inline schedule-panel">
      <button className="close-btn" onClick={onClose} aria-label="Fechar">
        <X size={16} />
      </button>
      <h4>Grade semanal — {doctor.name}</h4>

      {loading && <p>Carregando grade...</p>}
      {error && <p className="error-text">{error}</p>}

      {!loading && (
        <div className="schedule-list">
          {schedules.length === 0 && <p>Nenhuma faixa cadastrada.</p>}
          {schedules.map((s) => (
            <div className="schedule-row" key={s.id}>
              <span>{weekdayText(s.weekday)}</span>
              <span>{s.startTime} - {s.endTime}</span>
              <button className="danger-btn" onClick={() => onRemove(s.id)} aria-label="Excluir faixa">
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="schedule-form">
        <select value={form.weekday} onChange={(e) => onFormChange({ ...form, weekday: e.target.value })}>
          {WEEKDAYS.map((day) => <option key={day} value={day}>{weekdayText(day)}</option>)}
        </select>
        <input type="time" value={form.startTime} onChange={(e) => onFormChange({ ...form, startTime: e.target.value })} />
        <input type="time" value={form.endTime} onChange={(e) => onFormChange({ ...form, endTime: e.target.value })} />
        <button onClick={onAdd}><Plus size={14} />Adicionar</button>
      </div>
    </div>
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