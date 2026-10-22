import { useEffect, useMemo, useState } from 'react';
import { BedDouble, CalendarDays, CalendarPlus, ChevronLeft, ChevronRight, Copy, LayoutGrid, Pencil, Plus, RefreshCcw, Save } from 'lucide-react';
import { api } from '../api/client.js';
import { EmptyState } from '../components/EmptyState.jsx';
import { LoadingError } from '../components/LoadingError.jsx';
import { PageHeader } from '../components/PageHeader.jsx';
import { StatusBadge } from '../components/StatusBadge.jsx';
import { DetailsModal } from '../components/DetailsModal.jsx';
import { formatDate, formatOnlyDate } from '../utils/format.js';
import { reservationColorIndex, reservationMonthSegments } from '../utils/reservationCalendar.js';

const emptyHotel = { name: '', city: '', state: '' };
const emptyRoom = { name: '', description: '', price: '' };
const emptyReservation = { hotelId: '', roomId: '', guestName: '', email: '', phone: '', checkIn: '', checkOut: '' };
const calendarWeekdays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

function money(value) {
  return Number(value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function calendarDays(date) {
  const count = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  return Array.from({ length: count }, (_, index) => new Date(date.getFullYear(), date.getMonth(), index + 1));
}

function localDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function monthLabel(date) {
  const label = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(date);
  return label[0].toUpperCase() + label.slice(1);
}

export function Hotel() {
  const [tab, setTab] = useState('reservations');
  const [hotels, setHotels] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [hotelForm, setHotelForm] = useState(emptyHotel);
  const [roomForm, setRoomForm] = useState(emptyRoom);
  const [reservationForm, setReservationForm] = useState(emptyReservation);
  const [editingHotel, setEditingHotel] = useState(null);
  const [selectedReservation, setSelectedReservation] = useState(null);

  async function load() {
    setLoading(true);
    setError('');
    try {
      const [hotelList, reservationList] = await Promise.all([api.hotels(), api.hotelReservations()]);
      setHotels(hotelList);
      setReservations(reservationList);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  const rooms = useMemo(() => hotels.flatMap((hotel) => (hotel.rooms || []).map((room) => ({ ...room, hotel }))), [hotels]);

  function updateForm(setter, name, value) {
    setter((current) => ({ ...current, [name]: value }));
  }

  async function submitHotel(event) {
    event.preventDefault();
    setError('');
    try {
      if (editingHotel) await api.updateHotel(editingHotel, hotelForm);
      else await api.createHotel(hotelForm);
      setHotelForm(emptyHotel);
      setEditingHotel(null);
      setNotice(editingHotel ? 'Unidade atualizada.' : 'Unidade cadastrada.');
      await load();
    } catch (err) { setError(err.message); }
  }

  async function submitRoom(event) {
    event.preventDefault();
    setError('');
    try {
      await api.createHotelRoom(roomForm.hotelId, { name: roomForm.name, description: roomForm.description, price: Number(roomForm.price) });
      setRoomForm(emptyRoom);
      setNotice('Quarto cadastrado.');
      await load();
    } catch (err) { setError(err.message); }
  }

  async function submitReservation(event) {
    event.preventDefault();
    setError('');
    try {
      const created = await api.createHotelReservation(reservationForm);
      setReservationForm(emptyReservation);
      setNotice(`Reserva ${created.code} criada. PIX disponível abaixo.`);
      setTab('reservations');
      await load();
    } catch (err) { setError(err.message); }
  }

  async function cancelReservation(id) {
    setError('');
    try { await api.updateHotelReservation(id, { status: 'CANCELLED' }); setNotice('Reserva cancelada.'); await load(); }
    catch (err) { setError(err.message); }
  }

  return (
    <section className="page-hotel">
      <PageHeader eyebrow="Fluxo 4" title="Hotel" description="Unidades, quartos e reservas organizados por hotel, com período, hóspede e pagamento PIX." action={<button className="primary" onClick={load}><RefreshCcw size={16} />Atualizar</button>} />
      <div className="hotel-tabs" role="tablist">
        {[["units", "Unidades"], ["rooms", "Quartos"], ["reservations", "Reservas"]].map(([value, label]) => <button key={value} className={tab === value ? 'active' : ''} onClick={() => setTab(value)} role="tab">{label}</button>)}
      </div>
      <LoadingError loading={loading} error={error} />
      {notice && <div className="notice hotel-notice">{notice}</div>}
      {tab === 'units' && <UnitsTab hotels={hotels} form={hotelForm} editingHotel={editingHotel} onChange={(name, value) => updateForm(setHotelForm, name, value)} onSubmit={submitHotel} onEdit={(hotel) => { setEditingHotel(hotel.id); setHotelForm({ name: hotel.name, city: hotel.city, state: hotel.state }); }} />}
      {tab === 'rooms' && <RoomsTab rooms={rooms} hotels={hotels} form={roomForm} onChange={(name, value) => updateForm(setRoomForm, name, value)} onSubmit={submitRoom} />}
      {tab === 'reservations' && <ReservationsTab reservations={reservations} hotels={hotels} rooms={rooms} form={reservationForm} onChange={(name, value) => updateForm(setReservationForm, name, value)} onSubmit={submitReservation} onCancel={cancelReservation} onSelect={setSelectedReservation} />}
      {selectedReservation && (
        <DetailsModal title={selectedReservation.guestName} eyebrow={selectedReservation.code} onClose={() => setSelectedReservation(null)}>
          <StatusBadge value={selectedReservation.status} />
          <div className="details-grid modal-details-grid">
            <span>Unidade <b>{selectedReservation.hotel?.name || '-'}</b></span>
            <span>Quarto <b>{selectedReservation.room?.name || '-'}</b></span>
            <span>Período <b>{formatOnlyDate(selectedReservation.checkIn)} a {formatOnlyDate(selectedReservation.checkOut)}</b></span>
            <span>E-mail <b>{selectedReservation.email || '-'}</b></span>
            <span>Telefone <b>{selectedReservation.phone || '-'}</b></span>
            <span>Reservado em <b>{formatDate(selectedReservation.createdAt)}</b></span>
          </div>
          {selectedReservation.room?.description && <p className="modal-note"><strong>Descrição do quarto</strong>{selectedReservation.room.description}</p>}
          {selectedReservation.pixCode && <div className="pix-box"><span>PIX demonstrativo</span><b>{selectedReservation.pixCode}</b></div>}
        </DetailsModal>
      )}
    </section>
  );
}

function UnitsTab({ hotels, form, editingHotel, onChange, onSubmit, onEdit }) {
  return <><form className="hotel-form" onSubmit={onSubmit}><h2>{editingHotel ? 'Editar unidade' : 'Nova unidade'}</h2><input required placeholder="Nome do hotel" value={form.name} onChange={(e) => onChange('name', e.target.value)} /><input required placeholder="Cidade" value={form.city} onChange={(e) => onChange('city', e.target.value)} /><input required maxLength="2" placeholder="Estado (UF)" value={form.state} onChange={(e) => onChange('state', e.target.value.toUpperCase())} /><button className="primary"><Save size={16} />{editingHotel ? 'Salvar alterações' : 'Cadastrar unidade'}</button></form><div className="card-list">{!hotels.length ? <EmptyState /> : hotels.map((hotel) => <article className="data-card" key={hotel.id}><div className="card-top"><div><strong>{hotel.code}</strong><h3>{hotel.name}</h3></div><button className="icon-button" title="Editar unidade" onClick={() => onEdit(hotel)}><Pencil size={16} /></button></div><div className="details-grid"><span>Localização <b>{hotel.city} - {hotel.state}</b></span><span>Quartos <b>{hotel.rooms?.length || 0}</b></span><span>Cadastrado em <b>{formatDate(hotel.createdAt)}</b></span></div></article>)}</div></>;
}

function RoomsTab({ rooms, hotels, form, onChange, onSubmit }) {
  return <><form className="hotel-form" onSubmit={onSubmit}><h2>Novo quarto</h2><select required value={form.hotelId || ''} onChange={(e) => onChange('hotelId', e.target.value)}><option value="">Escolha a unidade</option>{hotels.map((hotel) => <option key={hotel.id} value={hotel.id}>{hotel.name} ({hotel.code})</option>)}</select><input required placeholder="Nome do quarto" value={form.name} onChange={(e) => onChange('name', e.target.value)} /><textarea required placeholder="Descrição" value={form.description} onChange={(e) => onChange('description', e.target.value)} /><input required min="0" step="0.01" type="number" placeholder="Preço da diária" value={form.price} onChange={(e) => onChange('price', e.target.value)} /><button className="primary"><Plus size={16} />Cadastrar quarto</button></form><div className="card-list">{!rooms.length ? <EmptyState /> : rooms.map((room) => <article className="data-card" key={room.id}><div className="card-top"><div><strong>{room.hotel.code}</strong><h3>{room.name}</h3></div><span className="badge">{money(room.price)}/noite</span></div><div className="details-grid"><span>Unidade <b>{room.hotel.name}</b></span><span>Descrição <b>{room.description}</b></span><span>Status <b>{room.isActive ? 'Ativo' : 'Inativo'}</b></span></div></article>)}</div></>;
}

function ReservationsTab({ reservations, hotels, rooms, form, onChange, onSubmit, onCancel, onSelect }) {
  const [view, setView] = useState('calendar');
  const [calendarMonth, setCalendarMonth] = useState(() => new Date());
  const availableRooms = rooms.filter((room) => room.hotel.id === form.hotelId);
  const days = useMemo(() => calendarDays(calendarMonth), [calendarMonth]);
  const setMonth = (year, monthIndex) => setCalendarMonth(new Date(year, monthIndex, 1));

  return (
    <>
      <form className="hotel-form" onSubmit={onSubmit}>
        <h2><CalendarPlus size={20} />Nova reserva</h2>
        <select required value={form.hotelId} onChange={(e) => { onChange('hotelId', e.target.value); onChange('roomId', ''); }}><option value="">Escolha a unidade</option>{hotels.map((hotel) => <option key={hotel.id} value={hotel.id}>{hotel.name}</option>)}</select>
        <select required value={form.roomId} onChange={(e) => onChange('roomId', e.target.value)}><option value="">Escolha o quarto</option>{availableRooms.map((room) => <option key={room.id} value={room.id}>{room.name}</option>)}</select>
        <input required placeholder="Nome do hóspede" value={form.guestName} onChange={(e) => onChange('guestName', e.target.value)} />
        <input required type="email" placeholder="E-mail" value={form.email} onChange={(e) => onChange('email', e.target.value)} />
        <input required placeholder="Telefone" value={form.phone} onChange={(e) => onChange('phone', e.target.value)} />
        <label>Entrada<input required type="date" value={form.checkIn} onChange={(e) => onChange('checkIn', e.target.value)} /></label>
        <label>Saída<input required type="date" value={form.checkOut} onChange={(e) => onChange('checkOut', e.target.value)} /></label>
        <button className="primary"><CalendarPlus size={16} />Reservar e gerar PIX</button>
      </form>
      <div className="view-switcher" aria-label="Modo de exibição das reservas">
        <span>Exibir como</span>
        <div className="view-switcher-options">
          <button type="button" className={view === 'calendar' ? 'active' : ''} onClick={() => setView('calendar')} aria-pressed={view === 'calendar'}><CalendarDays size={16} />Calendário</button>
          <button type="button" className={view === 'cards' ? 'active' : ''} onClick={() => setView('cards')} aria-pressed={view === 'cards'}><LayoutGrid size={16} />Cards</button>
        </div>
      </div>
      {view === 'calendar' ? (
        <HotelReservationsCalendar days={days} month={calendarMonth} rooms={rooms} reservations={reservations} onSelect={onSelect} onMonthChange={setMonth} onToday={() => setCalendarMonth(new Date())} onPrevious={() => setCalendarMonth((current) => new Date(current.getFullYear(), current.getMonth() - 1, 1))} onNext={() => setCalendarMonth((current) => new Date(current.getFullYear(), current.getMonth() + 1, 1))} />
      ) : (
        <div className="card-list">{!reservations.length ? <EmptyState /> : reservations.map((reservation) => <article className="data-card" key={reservation.id}><ReservationCard reservation={reservation} onCancel={onCancel} /></article>)}</div>
      )}
    </>
  );
}

function HotelReservationsCalendar({ days, month, rooms, reservations, onSelect, onMonthChange, onToday, onPrevious, onNext }) {
  const today = new Date();
  const roomList = [...rooms].sort((a, b) => a.hotel.name.localeCompare(b.hotel.name, 'pt-BR') || a.name.localeCompare(b.name, 'pt-BR'));
  const reservationYears = reservations.flatMap((reservation) => [Number(String(reservation.checkIn).slice(0, 4)), Number(String(reservation.checkOut).slice(0, 4))]).filter((year) => year >= 1900 && year <= 2100);
  const firstYear = Math.min(today.getFullYear() - 2, month.getFullYear(), ...reservationYears);
  const lastYear = Math.max(today.getFullYear() + 2, month.getFullYear(), ...reservationYears);
  const years = Array.from({ length: lastYear - firstYear + 1 }, (_, index) => firstYear + index);
  const monthNames = Array.from({ length: 12 }, (_, index) => monthLabel(new Date(month.getFullYear(), index, 1)).split(' de ')[0]);
  const reservationsByRoom = new Map();
  reservations.forEach((reservation) => {
    const roomId = reservation.roomId || reservation.room?.id;
    if (!roomId) return;
    if (!reservationsByRoom.has(roomId)) reservationsByRoom.set(roomId, []);
    reservationsByRoom.get(roomId).push(reservation);
  });
  const dayWidth = 48;
  const roomWidth = 174;

  return (
    <div className="appointment-calendar hotel-reservations-calendar" aria-label={`Reservas de ${monthLabel(month)}`}>
      <div className="hotel-timeline-toolbar">
        <button type="button" className="calendar-nav" onClick={onPrevious} aria-label="Mês anterior"><ChevronLeft size={18} /></button>
        <label className="sr-only" htmlFor="hotel-calendar-month">Mês do calendário</label>
        <select id="hotel-calendar-month" value={month.getMonth()} onChange={(event) => onMonthChange(month.getFullYear(), Number(event.target.value))}>
          {monthNames.map((name, index) => <option value={index} key={index}>{name}</option>)}
        </select>
        <label className="sr-only" htmlFor="hotel-calendar-year">Ano do calendário</label>
        <select id="hotel-calendar-year" value={month.getFullYear()} onChange={(event) => onMonthChange(Number(event.target.value), month.getMonth())}>
          {years.map((year) => <option value={year} key={year}>{year}</option>)}
        </select>
        <button type="button" className="calendar-nav" onClick={onNext} aria-label="Próximo mês"><ChevronRight size={18} /></button>
        <button type="button" className="hotel-today-button" onClick={onToday}>Hoje</button>
      </div>
      <div className="hotel-calendar-guide">
        <span><i className="hotel-guide-swatch" />Uma cor por reserva</span>
        <span><i className="hotel-guide-swatch cancelled" />Cancelada</span>
        <small>A faixa começa no check-in e termina no check-out. Clique para ver detalhes.</small>
      </div>
      <div className="hotel-timeline-scroll" tabIndex="0" aria-label={`Linha do tempo de reservas em ${monthLabel(month)}. Role para os lados para ver todos os dias.`}>
        <div className="hotel-timeline" style={{ '--hotel-days': days.length }}>
          <div className="hotel-timeline-head">
            <div className="hotel-timeline-corner"><strong>Quartos</strong><small>{roomList.length} {roomList.length === 1 ? 'quarto' : 'quartos'}</small></div>
            {days.map((day) => <div className={`hotel-timeline-date${day.getDay() === 0 || day.getDay() === 6 ? ' weekend' : ''}${localDateKey(day) === localDateKey(today) ? ' today' : ''}`} key={localDateKey(day)}><span>{calendarWeekdays[day.getDay()]}</span><strong>{day.getDate()}</strong></div>)}
          </div>
          {roomList.length ? roomList.map((room) => {
            const { segments, laneCount } = reservationMonthSegments(month, reservationsByRoom.get(room.id) || []);
            return <div className="hotel-timeline-row" style={{ minHeight: `${Math.max(56, 14 + laneCount * 34)}px` }} key={room.id}>
              <div className="hotel-timeline-room" title={`${room.name} · ${room.hotel.name}`}><strong>{room.name}</strong><small>{room.hotel.name}</small></div>
              {days.map((day) => <div className={`hotel-timeline-cell${day.getDay() === 0 || day.getDay() === 6 ? ' weekend' : ''}${localDateKey(day) === localDateKey(today) ? ' today' : ''}`} key={localDateKey(day)} />)}
              {segments.map(({ reservation, start, end, lane, startsHere, endsHere }) => (
                <button type="button"
                  className={`hotel-booking-bar tone-${reservationColorIndex(reservation.id || reservation.code)}${reservation.status === 'CANCELLED' ? ' cancelled' : ''}${startsHere ? ' starts-here' : ' continues-left'}${endsHere ? ' ends-here' : ' continues-right'}`}
                  key={reservation.id || reservation.code}
                  style={{ left: `${roomWidth + start * dayWidth + 2}px`, width: `${(end - start) * dayWidth - 4}px`, top: `${12 + lane * 34}px` }}
                  onClick={() => onSelect(reservation)}
                  title={`${reservation.guestName} · ${formatOnlyDate(reservation.checkIn)} a ${formatOnlyDate(reservation.checkOut)}${reservation.status === 'CANCELLED' ? ' · Cancelada' : ''}`}
                  aria-label={`${reservation.status === 'CANCELLED' ? 'Reserva cancelada' : 'Reserva confirmada'} de ${reservation.guestName}, quarto ${room.name}, entrada ${formatOnlyDate(reservation.checkIn)}, saída ${formatOnlyDate(reservation.checkOut)}`}>
                  <strong>{reservation.code || reservation.guestName}</strong>
                  {reservation.code && <span>{reservation.guestName}</span>}
                </button>
              ))}
            </div>;
          }) : <div className="hotel-timeline-empty">Cadastre um quarto para visualizar as reservas no calendário.</div>}
        </div>
      </div>
    </div>
  );
}

function ReservationCard({ reservation, onCancel }) {
  return <>
    <div className="card-top"><div><strong>{reservation.code}</strong><h3>{reservation.guestName}</h3></div><StatusBadge value={reservation.status} /></div>
    <div className="details-grid"><span>Unidade <b>{reservation.hotel?.name || '-'}</b></span><span>Quarto <b>{reservation.room?.name || '-'}</b></span><span>Período <b>{formatOnlyDate(reservation.checkIn)} a {formatOnlyDate(reservation.checkOut)}</b></span><span>E-mail <b>{reservation.email || '-'}</b></span><span>Reservado em <b>{formatDate(reservation.createdAt)}</b></span><span>Telefone <b>{reservation.phone || '-'}</b></span></div>
    {reservation.pixCode && <div className="pix-box"><span>PIX demonstrativo</span><b>{reservation.pixCode}</b><button className="icon-button" title="Copiar código PIX" onClick={() => navigator.clipboard?.writeText(reservation.pixCode)}><Copy size={15} /></button></div>}
    {reservation.status !== 'CANCELLED' && <button className="secondary" onClick={() => onCancel(reservation.id)}>Cancelar reserva</button>}
  </>;
}

function LegacyReservationsTab({ reservations, hotels, rooms, form, onChange, onSubmit, onCancel, onSelect }) {
  const availableRooms = rooms.filter((room) => room.hotel.id === form.hotelId);
  return <><form className="hotel-form" onSubmit={onSubmit}><h2><CalendarPlus size={20} />Nova reserva</h2><select required value={form.hotelId} onChange={(e) => { onChange('hotelId', e.target.value); onChange('roomId', ''); }}><option value="">Escolha a unidade</option>{hotels.map((hotel) => <option key={hotel.id} value={hotel.id}>{hotel.name}</option>)}</select><select required value={form.roomId} onChange={(e) => onChange('roomId', e.target.value)}><option value="">Escolha o quarto</option>{availableRooms.map((room) => <option key={room.id} value={room.id}>{room.name}</option>)}</select><input required placeholder="Nome do hóspede" value={form.guestName} onChange={(e) => onChange('guestName', e.target.value)} /><input required type="email" placeholder="E-mail" value={form.email} onChange={(e) => onChange('email', e.target.value)} /><input required placeholder="Telefone" value={form.phone} onChange={(e) => onChange('phone', e.target.value)} /><label>Entrada<input required type="date" value={form.checkIn} onChange={(e) => onChange('checkIn', e.target.value)} /></label><label>Saída<input required type="date" value={form.checkOut} onChange={(e) => onChange('checkOut', e.target.value)} /></label><button className="primary"><CalendarPlus size={16} />Reservar e gerar PIX</button></form><div className="card-list">{!reservations.length ? <EmptyState /> : reservations.map((reservation) => <article className="data-card reservation-card" key={reservation.id} onClick={() => onSelect(reservation)}><div className="card-top"><div><strong>{reservation.code}</strong><h3>{reservation.guestName}</h3></div><StatusBadge value={reservation.status} /></div><div className="details-grid"><span>Unidade <b>{reservation.hotel?.name || '-'}</b></span><span>Quarto <b>{reservation.room?.name || '-'}</b></span><span>Período <b>{formatOnlyDate(reservation.checkIn)} a {formatOnlyDate(reservation.checkOut)}</b></span><span>E-mail <b>{reservation.email}</b></span><span>Reservado em <b>{formatDate(reservation.createdAt)}</b></span><span>Telefone <b>{reservation.phone}</b></span></div>{reservation.pixCode && <div className="pix-box"><span>PIX demonstrativo</span><b>{reservation.pixCode}</b><button className="icon-button" title="Copiar código PIX" onClick={(event) => { event.stopPropagation(); navigator.clipboard?.writeText(reservation.pixCode); }}><Copy size={15} /></button></div>}{reservation.status !== 'CANCELLED' && <button className="secondary" onClick={(event) => { event.stopPropagation(); onCancel(reservation.id); }}>Cancelar reserva</button>}</article>)}</div></>;
}
