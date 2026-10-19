import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { BedDouble, CalendarDays, ClipboardList, FlaskConical, Headset, LayoutDashboard, RefreshCcw, Sparkles, Stethoscope, TrendingUp, UsersRound } from 'lucide-react';
import './styles/index.css';
import { Dashboard } from './pages/Dashboard.jsx';
import { Appointments } from './pages/Appointments.jsx';
import { Specialties } from './pages/Specialties.jsx';
import { Doctors } from './pages/Doctors.jsx';
import { Opportunities } from './pages/Opportunities.jsx';
import { Tickets } from './pages/Tickets.jsx';
import { Changelog } from './pages/Changelog.jsx';
import { Hotel } from './pages/Hotel.jsx';
import { Exams } from './pages/Exams.jsx';

const pages = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    component: Dashboard,
    category: 'dashboard'
  },
  {
    id: 'appointments',
    label: 'Agendamentos médicos',
    icon: CalendarDays,
    component: Appointments,
    category: 'medical'
  },
  {
    id: 'specialties',
    label: 'Especialidades',
    icon: UsersRound,
    component: Specialties,
    category: 'medical'
  },
  {
    id: 'doctors',
    label: 'Médicos',
    icon: Stethoscope,
    component: Doctors,
    category: 'medical'
  },
  {
    id: 'exams',
    label: 'Exames',
    icon: FlaskConical,
    component: Exams,
    category: 'medical'
  },
  {
    id: 'opportunities',
    label: 'Comercial',
    icon: TrendingUp,
    component: Opportunities,
    category: 'commercial'
  },
  {
    id: 'tickets',
    label: 'Suporte',
    icon: Headset,
    component: Tickets,
    category: 'support'
  },
  {
    id: 'hotel',
    label: 'Hotel',
    icon: BedDouble,
    component: Hotel,
    category: 'hotel'
  },
  {
    id: 'changelog',
    label: 'Atualizações',
    icon: ClipboardList,
    component: Changelog,
    category: 'updates',
    muted: true
  }
];

function App() {
  const [active, setActive] = useState('dashboard');

  const activePage =
    pages.find((page) => page.id === active) ?? pages[0];

  const ActivePage = activePage.component;

  return (
   <div className={`app-shell category-${activePage.category}`}>
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

                  const classes = [
                    active === page.id ? 'active' : '',
                    page.muted ? 'nav-link-muted' : '',
                    `nav-category-${page.category}`
                  ]
                    .filter(Boolean)
                    .join(' ');

              return (
                <button
                  key={page.id}
                  type="button"
                  className={classes}
                  onClick={() => setActive(page.id)}
            >
              <span className="nav-icon">
                <Icon size={18} />
              </span>

              <span className="nav-label">
                {page.label}
              </span>
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
