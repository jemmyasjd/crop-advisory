import { dashboardApi } from '../api/services';
import useFetch from '../hooks/useFetch';
import Loader from '../components/Loader';

const CARDS = [
  { key: 'totalFarmers', label: 'Total Farmers', icon: '👨‍🌾' },
  { key: 'totalFields', label: 'Total Fields', icon: '🗺️' },
  { key: 'totalAdvisories', label: 'Total Advisories', icon: '📋' },
  { key: 'activeCrops', label: 'Active Crops', icon: '🌱' },
];

export default function Dashboard() {
  const { data, loading } = useFetch(() => dashboardApi.stats(), []);

  if (loading) return <Loader />;
  const stats = data || {};
  const sync = stats.weatherSyncStatus || {};

  return (
    <>
      <div className="stat-grid">
        {CARDS.map((c) => (
          <div className="stat-card" key={c.key}>
            <div className="stat-icon">{c.icon}</div>
            <div>
              <div className="stat-value">{stats[c.key] ?? 0}</div>
              <div className="stat-label">{c.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="card-header">
          <h2>Weather Sync Status</h2>
        </div>
        <div className="card-body">
          <dl className="detail-grid">
            <dt>Status</dt>
            <dd>
              <span className={`badge ${sync.status === 'OK' ? 'badge-green' : 'badge-amber'}`}>
                {sync.status || 'UNKNOWN'}
              </span>
            </dd>
            <dt>Last Synced</dt>
            <dd>{sync.lastSyncedAt ? new Date(sync.lastSyncedAt).toLocaleString() : '—'}</dd>
          </dl>
        </div>
      </div>
    </>
  );
}
