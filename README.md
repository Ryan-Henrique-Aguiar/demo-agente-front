# Front-end Demo Agente Inteligente - Saúde

Painel React + Vite para demonstrar os fluxos do agente inteligente com agendamento médico.

## Rodar localmente

```bash
npm install
cp .env.example .env
npm run dev
```

`.env`:

```env
VITE_API_URL=http://localhost:3001/api
VITE_API_KEY=SUA_CHAVE
```

## Telas

- Dashboard
- Agendamentos médicos
- Especialidades
- Médicos e disponibilidade
- Comercial
- Suporte

## Back-end esperado

- `GET /api/dashboard/summary`
- `GET /api/specialties`
- `POST /api/specialties`
- `DELETE /api/specialties/:id`
- `GET /api/doctors`
- `POST /api/doctors`
- `DELETE /api/doctors/:id`
- `GET /api/doctors/:id/availability?from=YYYY-MM-DD&days=7`
- `GET /api/appointments`
- `PATCH /api/appointments/:id`
