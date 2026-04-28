import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAnalytics, trackEvent } from '../utils/api';
import { saveFilters, loadFilters } from '../utils/cookies';
import FilterPanel from '../components/FilterPanel';
import BarChartWidget from '../components/BarChartWidget';
import LineChartWidget from '../components/LineChartWidget';

const DEFAULT_FILTERS = {
  startDate: (() => { const d = new Date(); d.setDate(d.getDate() - 90); return d; })(),
  endDate: new Date(),
  age: 'All',
  gender: 'All',
};

export default function Dashboard() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('vigility_user') || '{}');

  // Restore filters from cookies, fallback to defaults
  const savedFilters = loadFilters();
  const [filters, setFilters] = useState({
    startDate: savedFilters?.startDate ? new Date(savedFilters.startDate) : DEFAULT_FILTERS.startDate,
    endDate:   savedFilters?.endDate   ? new Date(savedFilters.endDate)   : DEFAULT_FILTERS.endDate,
    age:       savedFilters?.age       || DEFAULT_FILTERS.age,
    gender:    savedFilters?.gender    || DEFAULT_FILTERS.gender,
  });

  const [selectedFeature, setSelectedFeature] = useState(null);
  const [analytics, setAnalytics] = useState({ barData: [], lineData: [], totalClicks: 0, uniqueFeatures: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchAnalytics = useCallback(async (currentFilters, feature) => {
    setLoading(true);
    setError('');
    try {
      const params = {
        startDate: currentFilters.startDate?.toISOString(),
        endDate:   currentFilters.endDate?.toISOString(),
        age:       currentFilters.age,
        gender:    currentFilters.gender,
      };
      if (feature) params.feature = feature;

      const res = await getAnalytics(params);
      setAnalytics(res.data);

      // Auto-select first feature if none selected
      if (!feature && res.data.barData.length > 0) {
        setSelectedFeature(res.data.selectedFeature);
      }
    } catch (err) {
      setError('Failed to load analytics. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchAnalytics(filters, selectedFeature);
  }, []); // eslint-disable-line

  const handleFilterChange = async (key, value) => {
    const updated = { ...filters, [key]: value };
    setFilters(updated);
    saveFilters({ ...updated, startDate: updated.startDate?.toISOString(), endDate: updated.endDate?.toISOString() });

    // Map filter key → tracking feature name
    const trackMap = { startDate: 'date_filter', endDate: 'date_filter', age: 'age_filter', gender: 'gender_filter' };
    if (trackMap[key]) {
      try { await trackEvent(trackMap[key]); } catch { /* silent */ }
    }

    fetchAnalytics(updated, selectedFeature);
  };

  const handleBarClick = async (featureName) => {
    setSelectedFeature(featureName);
    try { await trackEvent('bar_chart_click'); } catch { /* silent */ }
    fetchAnalytics(filters, featureName);
  };

  const handleLogout = () => {
    localStorage.removeItem('vigility_token');
    localStorage.removeItem('vigility_user');
    navigate('/login');
  };

  const avgClicksPerDay = analytics.lineData.length > 0
    ? (analytics.lineData.reduce((s, d) => s + d.count, 0) / analytics.lineData.length).toFixed(1)
    : '—';

  return (
    <div className="dashboard">
      {/* Navbar */}
      <nav className="navbar">
        <div className="navbar-brand">
          <div className="navbar-brand-icon">📊</div>
          <span className="navbar-brand-name">Vigility</span>
          <span className="badge badge-purple" style={{ marginLeft: 8 }}>LIVE</span>
        </div>
        <div className="navbar-right">
          <div className="glow-dot" title="Tracking active" />
          <div className="navbar-user">
            <div className="navbar-avatar">{user.username?.[0]?.toUpperCase() || 'U'}</div>
            <span>{user.username}</span>
          </div>
          <button id="btn-logout" className="btn btn-ghost" onClick={handleLogout}>
            Sign out
          </button>
        </div>
      </nav>

      <main className="dashboard-main">
        {/* Stats Row */}
        <div className="stats-row">
          <div className="card stat-card">
            <div className="stat-icon">🖱️</div>
            <div className="stat-value">{loading ? '…' : analytics.totalClicks.toLocaleString()}</div>
            <div className="stat-label">Total Interactions</div>
          </div>
          <div className="card stat-card">
            <div className="stat-icon">⚡</div>
            <div className="stat-value">{loading ? '…' : analytics.uniqueFeatures}</div>
            <div className="stat-label">Active Features</div>
          </div>
          <div className="card stat-card">
            <div className="stat-icon">📅</div>
            <div className="stat-value">{loading ? '…' : avgClicksPerDay}</div>
            <div className="stat-label">Avg Clicks / Day</div>
          </div>
          <div className="card stat-card">
            <div className="stat-icon">🎯</div>
            <div className="stat-value">{loading ? '…' : (selectedFeature || '—')}</div>
            <div className="stat-label" style={{ textTransform: 'none' }}>Selected Feature</div>
          </div>
        </div>

        {/* Filters */}
        <div className="card filter-panel">
          <span className="filter-panel-title">🔍 Filters</span>
          <FilterPanel filters={filters} onChange={handleFilterChange} />
        </div>

        {/* Error */}
        {error && <div className="alert-error" style={{ marginBottom: 20 }}>{error}</div>}

        {/* Charts */}
        <div className="charts-grid">
          <div className="card chart-card">
            <div className="chart-header">
              <div>
                <div className="chart-title">Feature Usage</div>
                <div className="chart-subtitle">Total clicks by feature • click a bar to drill down</div>
              </div>
              <span className="badge badge-cyan">Bar</span>
            </div>
            <div className="chart-body">
              {loading && (
                <div className="loading-overlay">
                  <div className="spinner" />
                </div>
              )}
              <BarChartWidget
                data={analytics.barData}
                selectedFeature={selectedFeature}
                onBarClick={handleBarClick}
              />
            </div>
          </div>

          <div className="card chart-card">
            <div className="chart-header">
              <div>
                <div className="chart-title">Daily Trend</div>
                <div className="chart-subtitle">
                  {selectedFeature ? `Clicks over time for: ${selectedFeature}` : 'Select a bar to see trend'}
                </div>
              </div>
              <span className="badge badge-purple">Line</span>
            </div>
            <div className="chart-body">
              {loading && (
                <div className="loading-overlay">
                  <div className="spinner" />
                </div>
              )}
              <LineChartWidget data={analytics.lineData} feature={selectedFeature} />
            </div>
          </div>
        </div>
      </main>

      <footer className="footer">
        Vigility — every interaction you make is tracked and feeds back into these charts ·{' '}
        <span style={{ color: 'var(--purple-light)' }}>Self-referential analytics</span>
      </footer>
    </div>
  );
}
