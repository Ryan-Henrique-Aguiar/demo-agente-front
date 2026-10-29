import { useEffect, useState } from 'react';
import { CalendarSearch, Plus, RefreshCcw, Save, Settings, Trash2, X } from 'lucide-react';
import { api } from '../api/client.js';
import { PageHeader } from '../components/PageHeader.jsx';
import { EmptyState } from '../components/EmptyState.jsx';
import { LoadingError } from '../components/LoadingError.jsx';
import { formatDate, formatOnlyDate, weekdayText } from '../utils/format.js';

const weekdays = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];
const emptyExam = { name: '', durationMinutes: '15', preparation: '' };
const emptySchedule = { weekday: 'MONDAY', startTime: '08:00', endTime: '12:00' };

function localToday() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function Exams() {
  const [items, setItems] = useState([]);
  const [filter, setFilter] = useState('true');
  const [form, setForm] = useState(emptyExam);
  const [editingId, setEditingId] = useState(null);
  const [openPanel, setOpenPanel] = useState(null);
  const [scheduleForm, setScheduleForm] = useState(emptySchedule);
  const [from, setFrom] = useState(localToday);
  const [availability, setAvailability] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  async function load() {
    setLoading(true);
    setError('');
    try { setItems(await api.examTypes(filter ? { isActive: filter } : {})); }
    catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, [filter]);

  async function run(action, success) {
    setBusy(true);
    setError('');
    setNotice('');
    try {
      await action();
      setNotice(success);
      await load();
    } catch (err) { setError(err.message); }
    finally { setBusy(false); }
  }

  async function saveExam(event) {
    event.preventDefault();
    await run(async () => {
      if (editingId) {
        await api.updateExamType(editingId, { name: form.name.trim(), durationMinutes: Number(form.durationMinutes), preparation: form.preparation.trim() });
      } else {
        await api.createExamType({ name: form.name.trim(), durationMinutes: Number(form.durationMinutes), preparation: form.preparation.trim() });
      }
      setForm(emptyExam);
      setEditingId(null);
    }, editingId ? 'Tipo de exame atualizado.' : 'Tipo de exame cadastrado. Adicione a grade de horários.');
  }

  function editExam(item) {
    setEditingId(item.id);
    setForm({ name: item.name, durationMinutes: String(item.durationMinutes), preparation: item.preparation || '' });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function showAvailability(item) {
    if (openPanel?.id === item.id && openPanel?.type === 'availability') { setOpenPanel(null); return; }
    setOpenPanel({ id: item.id, type: 'availability' });
    setAvailability(null);
    setError('');
    try { setAvailability(await api.examAvailability(item.id, from, 7)); }
    catch (err) { setError(err.message); }
  }

  async function refreshAvailability() {
    if (!openPanel || openPanel.type !== 'availability') return;
    setAvailability(null);
    setError('');
    try { setAvailability(await api.examAvailability(openPanel.id, from, 7)); }
    catch (err) { setError(err.message); }
  }

  async function addSchedule(item) {
    await run(async () => { await api.createExamSchedule(item.id, scheduleForm); }, 'Faixa adicionada.');
  }

  async function deleteSchedule(item, scheduleId) {
    await run(async () => { await api.deleteExamSchedule(item.id, scheduleId); }, 'Faixa removida.');
  }

  return (
    <section className="page-exams">
      <PageHeader eyebrow="Cadastro médico" title="Exames" description="Tipos de exames, preparo e horários que o agente pode oferecer. Agendamentos de exames ficam disponíveis pela API." action={<button className="primary" onClick={load}><RefreshCcw size={16} />Atualizar</button>} />

      <form className="hotel-form" onSubmit={saveExam}>
        <h2>{editingId ? 'Editar tipo de exame' : 'Novo tipo de exame'}</h2>
        <label>Nome<input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Ex.: Hemograma completo" /></label>
        <label>Duração por agendamento (min)<input type="number" min="5" max="120" step="5" required value={form.durationMinutes} onChange={(event) => setForm({ ...form, durationMinutes: event.target.value })} /></label>
        <label className="exam-preparation">Preparo / orientações<textarea value={form.preparation} onChange={(event) => setForm({ ...form, preparation: event.target.value })} placeholder="Orientação a confirmar com a unidade" /></label>
        <button className="primary" disabled={busy}><Save size={16} />{editingId ? 'Salvar' : 'Cadastrar'}</button>
        {editingId && <button type="button" className="secondary" onClick={() => { setEditingId(null); setForm(emptyExam); }}>Cancelar edição</button>}
      </form>

      <div className="filters"><label>Status</label><select value={filter} onChange={(event) => setFilter(event.target.value)}><option value="true">Ativos</option><option value="false">Inativos</option><option value="">Todos</option></select><label>Disponibilidade a partir de</label><input type="date" value={from} onChange={(event) => setFrom(event.target.value)} /><button className="secondary" onClick={refreshAvailability}><RefreshCcw size={15} />Consultar novamente</button></div>
      <LoadingError loading={loading} error={error} />
      {notice && <div className="notice hotel-notice">{notice}</div>}
      {!loading && !items.length && <EmptyState />}

      <div className="card-list">
        {items.map((item) => (
          <article className="data-card" key={item.id}>
            <div className="card-top"><div><strong>{item.durationMinutes} MINUTOS</strong><h3>{item.name}</h3></div><span className={`badge ${item.isActive ? 'badge-concluido' : 'badge-cancelado'}`}>{item.isActive ? 'Ativo' : 'Inativo'}</span></div>
            <div className="details-grid"><span>Preparo <b>{item.preparation || 'Sem orientação cadastrada'}</b></span><span>Faixas semanais <b>{item.schedules?.length || 0}</b></span><span>Criado em <b>{formatDate(item.createdAt)}</b></span></div>
            <div className="actions-row">
              <button onClick={() => editExam(item)}><Settings size={15} />Editar</button>
              <button disabled={!item.isActive} onClick={() => showAvailability(item)}><CalendarSearch size={15} />Ver disponibilidade</button>
              <button onClick={() => { setOpenPanel(openPanel?.id === item.id && openPanel.type === 'schedule' ? null : { id: item.id, type: 'schedule' }); setScheduleForm(emptySchedule); }}><Plus size={15} />Gerenciar grade</button>
              <button disabled={busy} onClick={() => run(() => api.updateExamType(item.id, { isActive: !item.isActive }), item.isActive ? 'Exame inativado.' : 'Exame ativado.')}>{item.isActive ? 'Inativar' : 'Ativar'}</button>
            </div>
            {openPanel?.id === item.id && openPanel.type === 'availability' && <div className="availability-panel-inline"><button className="close-btn" onClick={() => setOpenPanel(null)} aria-label="Fechar"><X size={16} /></button><h4>Próximos horários — {item.name}</h4>{!availability && <p>Carregando disponibilidade...</p>}{availability && (availability.availability.length ? <div className="availability-grid">{availability.availability.map((day) => <div className="availability-day" key={day.date}><strong>{formatOnlyDate(day.date)}</strong><span>{weekdayText(day.weekday)}</span><div className="slot-list">{day.slots.map((slot) => <span className="badge" key={slot}>{slot}</span>)}</div></div>)}</div> : <p>Sem horários livres no período.</p>)}</div>}
            {openPanel?.id === item.id && openPanel.type === 'schedule' && <div className="availability-panel-inline schedule-panel"><button className="close-btn" onClick={() => setOpenPanel(null)} aria-label="Fechar"><X size={16} /></button><h4>Grade semanal — {item.name}</h4><div className="schedule-list">{!item.schedules?.length && <p>Nenhuma faixa cadastrada.</p>}{item.schedules?.map((schedule) => <div className="schedule-row" key={schedule.id}><span>{weekdayText(schedule.weekday)}</span><span>{schedule.startTime} - {schedule.endTime}</span><button className="danger-btn" disabled={busy} onClick={() => deleteSchedule(item, schedule.id)} aria-label="Excluir faixa"><Trash2 size={14} /></button></div>)}</div><div className="schedule-form"><select value={scheduleForm.weekday} onChange={(event) => setScheduleForm({ ...scheduleForm, weekday: event.target.value })}>{weekdays.map((day) => <option key={day} value={day}>{weekdayText(day)}</option>)}</select><input type="time" value={scheduleForm.startTime} onChange={(event) => setScheduleForm({ ...scheduleForm, startTime: event.target.value })} /><input type="time" value={scheduleForm.endTime} onChange={(event) => setScheduleForm({ ...scheduleForm, endTime: event.target.value })} /><button disabled={busy} onClick={() => addSchedule(item)}><Plus size={14} />Adicionar</button></div></div>}
          </article>
        ))}
      </div>
    </section>
  );
}
