const DAY_MS = 24 * 60 * 60 * 1000;

function dateNumber(value) {
  const key = String(value || '').slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(key)) return NaN;
  const number = Date.parse(`${key}T00:00:00.000Z`);
  return Number.isFinite(number) && new Date(number).toISOString().slice(0, 10) === key ? number / DAY_MS : NaN;
}

// Positions are measured in days from the start of the displayed month.
// Check-in and check-out sit at the midpoint of their respective days.
export function reservationMonthSegments(month, reservations) {
  const year = month.getFullYear();
  const monthIndex = month.getMonth();
  const first = Date.UTC(year, monthIndex, 1) / DAY_MS;
  const dayCount = new Date(year, monthIndex + 1, 0).getDate();
  const nextMonth = first + dayCount;

  const visible = reservations.flatMap((reservation) => {
    const checkIn = dateNumber(reservation.checkIn);
    const checkOut = dateNumber(reservation.checkOut);
    if (!Number.isFinite(checkIn) || !Number.isFinite(checkOut) || checkOut <= checkIn || checkIn >= nextMonth || checkOut < first) return [];

    return [{
      reservation,
      start: checkIn < first ? 0 : checkIn - first + 0.5,
      end: checkOut >= nextMonth ? dayCount : checkOut - first + 0.5,
      startsHere: checkIn >= first,
      endsHere: checkOut < nextMonth,
    }];
  }).sort((a, b) => a.start - b.start || a.end - b.end || String(a.reservation.id).localeCompare(String(b.reservation.id)));

  const laneEnds = [];
  const segments = visible.map((segment) => {
    let lane = laneEnds.findIndex((end) => end <= segment.start);
    if (lane === -1) lane = laneEnds.length;
    laneEnds[lane] = segment.end;
    return { ...segment, lane };
  });

  return { segments, laneCount: laneEnds.length };
}

export function reservationColorIndex(id, colorCount = 6) {
  const hash = Array.from(String(id || '')).reduce((value, character) => (value * 31 + character.charCodeAt(0)) >>> 0, 0);
  return hash % colorCount;
}
