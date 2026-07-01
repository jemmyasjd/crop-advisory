import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import Sidebar from './Sidebar';
import { useAuth } from '../context/AuthContext';

const TITLES = {
  '/dashboard': 'Dashboard',
  '/crops': 'Crops',
  '/stages': 'Crop Stages',
  '/diseases': 'Diseases',
  '/disease-rules': 'Disease Rules',
  '/risk-levels': 'Risk Levels',
  '/nutrient-rules': 'Nutrient Rules',
  '/farmers': 'Farmers',
  '/fields': 'Fields',
};

export default function Layout() {
  const [open, setOpen] = useState(false);
  const { user, logout } = useAuth();
  const { pathname } = useLocation();

  const title =
    TITLES[pathname] ||
    (pathname.startsWith('/farmers') ? 'Farmer Details' : '') ||
    (pathname.startsWith('/fields') ? 'Field Details' : 'Admin');

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out');
  };

  const initials = (user?.name || 'A')
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div className="layout">
      <Sidebar open={open} onNavigate={() => setOpen(false)} />
      <div className={`backdrop${open ? ' show' : ''}`} onClick={() => setOpen(false)} />

      <div className="main">
        <header className="topbar">
          <div className="topbar-left">
            <button className="hamburger" onClick={() => setOpen((o) => !o)} aria-label="Menu">
              ☰
            </button>
            <span className="page-title">{title}</span>
          </div>
          <div className="user-chip">
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontWeight: 600, fontSize: 13 }}>{user?.name}</div>
              <div style={{ fontSize: 11, color: 'var(--gray-500)' }}>{user?.email}</div>
            </div>
            <div className="avatar">{initials}</div>
            <button className="btn btn-secondary btn-sm" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </header>

        <main className="content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
