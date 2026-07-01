import { NavLink } from 'react-router-dom';

const NAV = [
  { section: 'Overview' },
  { to: '/dashboard', icon: '📊', label: 'Dashboard' },
  { section: 'Crop Configuration' },
  { to: '/crops', icon: '🌱', label: 'Crops' },
  { to: '/stages', icon: '📈', label: 'Crop Stages' },
  { to: '/diseases', icon: '🦠', label: 'Diseases' },
  { to: '/disease-rules', icon: '⚙️', label: 'Disease Rules' },
  { to: '/risk-levels', icon: '🚦', label: 'Risk Levels' },
  { to: '/nutrient-rules', icon: '🧪', label: 'Nutrient Rules' },
  { section: 'Management' },
  { to: '/farmers', icon: '👨‍🌾', label: 'Farmers' },
  { to: '/fields', icon: '🗺️', label: 'Fields' },
];

export default function Sidebar({ open, onNavigate }) {
  return (
    <aside className={`sidebar${open ? ' open' : ''}`}>
      <div className="sidebar-brand">
        <span>🍉</span>
        <span>Crop Admin</span>
      </div>
      <nav className="sidebar-nav">
        {NAV.map((item, i) =>
          item.section ? (
            <div className="nav-section" key={`s-${i}`}>
              {item.section}
            </div>
          ) : (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
              onClick={onNavigate}
            >
              <span className="nav-icon">{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          )
        )}
      </nav>
    </aside>
  );
}
