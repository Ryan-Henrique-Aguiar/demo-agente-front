import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { CalendarDays, Headset, LayoutDashboard, ListChecks, RefreshCcw, Sparkles, Stethoscope, TrendingUp, UsersRound } from 'lucide-react';
import './styles.css';
import { Dashboard } from './pages/Dashboard.jsx';
import { Appointments } from './pages/Appointments.jsx';
import { Specialties } from './pages/Specialties.jsx';
import { Doctors } from './pages/Doctors.jsx';
import { Opportunities } from './pages/Opportunities.jsx';
import { Tickets } from './pages/Tickets.jsx';

const pages = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, component: Dashboard },
  { id: 'appointments', label: 'Agendamentos médicos', icon: CalendarDays, component: Appointments },
  { id: 'specialties', label: 'Especialidades', icon: UsersRound, component: Specialties },
  { id: 'doctors', label: 'Médicos', icon: Stethoscope, component: Doctors },
  { id: 'opportunities', label: 'Comercial', icon: TrendingUp, component: Opportunities },
  { id: 'tickets', label: 'Suporte', icon: Headset, component: Tickets }
];

function App() {
  const [active, setActive] = useState('dashboard');
  const ActivePage = pages.find((page) => page.id === active)?.component ?? Dashboard;

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon"><Sparkles size={22} /></div>
          <div>
            <strong>Demo Agente Inteligente</strong>
            <span>Painel demo saúde</span>
          </div>
        </div>

        <nav className="nav">
          {pages.map((page) => {
            const Icon = page.icon;
            return (
              <button key={page.id} className={active === page.id ? 'active' : ''} onClick={() => setActive(page.id)}>
                <Icon size={18} />
                {page.label}
              </button>
            );
          })}
        </nav>

        <div className="demo-note">
          <RefreshCcw size={18} />
          <p>Sem atualização em tempo real. Use F5 ou o botão de atualizar nas telas.</p>
        </div>
      </aside>

      <main className="content">
        <ActivePage />
      </main>
    </div>
  );
}

createRoot(document.getElementById('root')).render(<App />);
