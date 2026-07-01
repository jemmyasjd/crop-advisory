import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';

const LINKS = [
  { to: '/fields', label: 'My Fields' },
  { to: '/profile', label: 'Profile' },
];

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const initials = (user?.name || 'F')
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out');
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <NavLink to="/fields" className="navbar-brand">
        <span>🍉</span>
        <span>Crop Advisory</span>
      </NavLink>

      <div className="navbar-links">
        {LINKS.map((l) => (
          <NavLink
            key={l.to}
            to={l.to}
            className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
          >
            {l.label}
          </NavLink>
        ))}
      </div>

      <div className="navbar-user">
        <div className="user-meta" style={{ textAlign: 'right' }}>
          <div style={{ fontWeight: 600, fontSize: 13 }}>{user?.name}</div>
          <div style={{ fontSize: 11, color: 'var(--gray-500)' }}>{user?.email}</div>
        </div>
        <div className="avatar">{initials}</div>
        <button className="btn btn-secondary btn-sm" onClick={handleLogout}>
          Logout
        </button>
        <button className="nav-toggle" onClick={() => setOpen((o) => !o)} aria-label="Menu">
          ☰
        </button>
      </div>

      {open && (
        <div className="mobile-menu">
          {LINKS.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
              onClick={() => setOpen(false)}
            >
              {l.label}
            </NavLink>
          ))}
        </div>
      )}
    </nav>
  );
}
