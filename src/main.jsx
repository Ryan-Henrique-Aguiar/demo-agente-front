import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { BedDouble, CalendarDays, ClipboardList, FlaskConical, Headset, LayoutDashboard, Menu, RefreshCcw, Sparkles, Stethoscope, TrendingUp, UsersRound, X } from 'lucide-react';
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
    category: 'dashboard',
    subtitle: 'Visão geral da demonstração'
  },
  {
    id: 'appointments',
    label: 'Agendamentos médicos',
    icon: CalendarDays,
    component: Appointments,
    category: 'medical',
    subtitle: 'Agendamento Médico'
  },
  {
    id: 'specialties',
    label: 'Especialidades',
    icon: UsersRound,
    component: Specialties,
    category: 'medical',
    subtitle: 'Especialidades médicas'
  },
  {
    id: 'doctors',
    label: 'Médicos',
    icon: Stethoscope,
    component: Doctors,
    category: 'medical',
    subtitle: 'Cadastro de médicos'
  },
  {
    id: 'exams',
    label: 'Exames',
    icon: FlaskConical,
    component: Exams,
    category: 'medical',
    subtitle: 'Exames e disponibilidade'
  },
  {
    id: 'opportunities',
    label: 'Comercial',
    icon: TrendingUp,
    component: Opportunities,
    category: 'commercial',
    subtitle: 'Oportunidades comerciais'
  },
  {
    id: 'tickets',
    label: 'Suporte',
    icon: Headset,
    component: Tickets,
    category: 'support',
    subtitle: 'Chamados de suporte'
  },
  {
    id: 'hotel',
    label: 'Hotel',
    icon: BedDouble,
    component: Hotel,
    category: 'hotel',
    subtitle: 'Unidades, quartos e reservas'
  },
  {
    id: 'changelog',
    label: 'Atualizações',
    icon: ClipboardList,
    component: Changelog,
    category: 'updates',
    subtitle: 'Novidades da plataforma',
    muted: true
  }
];

function App() {
  const [active, setActive] = useState('dashboard');
  const [menuOpen, setMenuOpen] = useState(false);

  const activePage =
    pages.find((page) => page.id === active) ?? pages[0];

  const ActivePage = activePage.component;

  return (
   <div className={`app-shell category-${activePage.category}`}>
      <aside className={`sidebar ${menuOpen ? 'sidebar-open' : ''}`}>
        <div className="sidebar-header"><div className="brand">
          <div className="brand-icon"><Sparkles size={22} /></div>
          <div>
            <strong>Demo Agente Inteligente</strong>
            <span>{activePage.subtitle}</span>
          </div>
        </div>
        <button type="button" className="menu-toggle" aria-label={menuOpen ? 'Fechar menu' : 'Abrir menu'} aria-expanded={menuOpen} aria-controls="primary-navigation" onClick={() => setMenuOpen((open) => !open)}>{menuOpen ? <X size={22} /> : <Menu size={22} />}</button></div>

              <nav id="primary-navigation" className="nav">
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
                  onClick={() => { setActive(page.id); setMenuOpen(false); }}
                  aria-current={active === page.id ? 'page' : undefined}
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
