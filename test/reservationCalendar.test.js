import test from 'node:test';
import assert from 'node:assert/strict';
import { reservationColorIndex, reservationMonthSegments } from '../src/utils/reservationCalendar.js';

function booking(id, checkIn, checkOut) {
  return { id, checkIn: `${checkIn}T00:00:00.000Z`, checkOut: `${checkOut}T00:00:00.000Z` };
}

const october = new Date(2026, 9, 1);

test('bar begins and ends at the midpoint of its dates', () => {
  const { segments, laneCount } = reservationMonthSegments(october, [booking('a', '2026-10-20', '2026-10-23')]);
  assert.equal(laneCount, 1);
  assert.deepEqual([segments[0].start, segments[0].end, segments[0].startsHere, segments[0].endsHere], [19.5, 22.5, true, true]);
});

test('a reservation across months is clipped and stays visible in both', () => {
  const reservation = booking('a', '2026-10-30', '2026-11-03');
  const inOctober = reservationMonthSegments(october, [reservation]).segments[0];
  const inNovember = reservationMonthSegments(new Date(2026, 10, 1), [reservation]).segments[0];
  assert.deepEqual([inOctober.start, inOctober.end, inOctober.startsHere, inOctober.endsHere], [29.5, 31, true, false]);
  assert.deepEqual([inNovember.start, inNovember.end, inNovember.startsHere, inNovember.endsHere], [0, 2.5, false, true]);
});

test('overlapping bookings use separate lanes, while same-day changeovers can share a lane', () => {
  const { segments, laneCount } = reservationMonthSegments(october, [
    booking('a', '2026-10-19', '2026-10-21'),
    booking('b', '2026-10-20', '2026-10-22'),
    booking('c', '2026-10-21', '2026-10-23'),
  ]);
  assert.equal(laneCount, 2);
  assert.deepEqual(Object.fromEntries(segments.map(({ reservation, lane }) => [reservation.id, lane])), { a: 0, b: 1, c: 0 });
});

test('invalid and out-of-month dates are omitted', () => {
  const { segments } = reservationMonthSegments(october, [
    booking('past', '2026-09-01', '2026-09-30'),
    booking('invalid', '2026-02-30', '2026-10-21'),
    booking('reversed', '2026-10-22', '2026-10-20'),
  ]);
  assert.deepEqual(segments, []);
});

test('a booking keeps the same color index across renders', () => {
  assert.equal(reservationColorIndex('RS-42'), reservationColorIndex('RS-42'));
  assert.ok(reservationColorIndex('RS-42') >= 0 && reservationColorIndex('RS-42') < 6);
});
