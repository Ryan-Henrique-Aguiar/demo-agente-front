const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
const API_KEY = import.meta.env.VITE_API_KEY || '';

function cleanFilters(filters = {}) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') params.set(key, value);
  });
  return params.toString();
}

async function request(path, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(API_KEY ? { 'x-api-key': API_KEY } : {}),
    ...(options.headers || {})
  };

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Erro HTTP ${response.status}`);
  }

  if (response.status === 204) return null;
  return response.json();
}

export const api = {
  summary: () => request('/dashboard/summary'),

  specialties: () => request('/specialties'),
  specialty: (id) => request(`/specialties/${id}`),
  createSpecialty: (payload) => request('/specialties', { method: 'POST', body: JSON.stringify(payload) }),
  updateSpecialty: (id, payload) => request(`/specialties/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }),
  deleteSpecialty: (id) => request(`/specialties/${id}`, { method: 'DELETE' }),

  doctors: (filters = {}) => {
    const query = cleanFilters(filters);
    return request(`/doctors${query ? `?${query}` : ''}`);
  },
  doctor: (id) => request(`/doctors/${id}`),
  createDoctor: (payload) => request('/doctors', { method: 'POST', body: JSON.stringify(payload) }),
  updateDoctor: (id, payload) => request(`/doctors/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }),
  deleteDoctor: (id) => request(`/doctors/${id}`, { method: 'DELETE' }),
  doctorSchedules: (id) => request(`/doctors/${id}/schedules`),
  createDoctorSchedule: (id, payload) => request(`/doctors/${id}/schedules`, { method: 'POST', body: JSON.stringify(payload) }),
  updateDoctorSchedule: (id, sid, payload) => request(`/doctors/${id}/schedules/${sid}`, { method: 'PATCH', body: JSON.stringify(payload) }),
  deleteDoctorSchedule: (id, sid) => request(`/doctors/${id}/schedules/${sid}`, { method: 'DELETE' }),
  doctorAvailability: (id, from, days = 7) => request(`/doctors/${id}/availability?from=${from}&days=${days}`),

  appointments: (filters = {}) => {
    const query = typeof filters === 'string'
      ? cleanFilters({ status: filters })
      : cleanFilters(filters);
    return request(`/appointments${query ? `?${query}` : ''}`);
  },
  appointment: (id) => request(`/appointments/${id}`),
  createAppointment: (payload) => request('/appointments', { method: 'POST', body: JSON.stringify(payload) }),
  updateAppointment: (id, payload) => request(`/appointments/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }),

  opportunities: (filters = {}) => {
    const query = cleanFilters(filters);
    return request(`/opportunities${query ? `?${query}` : ''}`);
  },
  opportunity: (id) => request(`/opportunities/${id}`),
  updateOpportunity: (id, payload) => request(`/opportunities/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }),

  tickets: ({ status = '', priority = '' } = {}) => {
    const query = cleanFilters({ status, priority });
    return request(`/tickets${query ? `?${query}` : ''}`);
  },
  ticketByCode: (code) => request(`/tickets/${code}`),
  updateTicket: (id, payload) => request(`/tickets/${id}`, { method: 'PATCH', body: JSON.stringify(payload) })
};
