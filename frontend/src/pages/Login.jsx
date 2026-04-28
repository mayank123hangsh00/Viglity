import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login, register } from '../utils/api';

export default function Login() {
  const navigate = useNavigate();
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    username: '',
    password: '',
    age: '',
    gender: 'Male',
  });

  const handleChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      let res;
      if (mode === 'login') {
        res = await login({ username: form.username, password: form.password });
      } else {
        if (!form.age || isNaN(parseInt(form.age))) {
          setError('Please enter a valid age');
          setLoading(false);
          return;
        }
        res = await register({
          username: form.username,
          password: form.password,
          age: parseInt(form.age),
          gender: form.gender,
        });
      }
      localStorage.setItem('vigility_token', res.data.token);
      localStorage.setItem('vigility_user', JSON.stringify(res.data.user));
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-bg" />
      <div className="login-orb login-orb-1" />
      <div className="login-orb login-orb-2" />

      <div className="login-card">
        {/* Brand */}
        <div className="login-logo">
          <div className="login-logo-icon">📊</div>
          <span className="login-logo-text">Vigility</span>
        </div>
        <p className="login-subtitle">Self-referential product analytics dashboard</p>

        {/* Tabs */}
        <div className="login-tabs" role="tablist">
          <button
            id="tab-login"
            role="tab"
            aria-selected={mode === 'login'}
            className={`login-tab ${mode === 'login' ? 'active' : ''}`}
            onClick={() => { setMode('login'); setError(''); }}
          >
            Sign In
          </button>
          <button
            id="tab-register"
            role="tab"
            aria-selected={mode === 'register'}
            className={`login-tab ${mode === 'register' ? 'active' : ''}`}
            onClick={() => { setMode('register'); setError(''); }}
          >
            Register
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label className="label" htmlFor="username">Username</label>
            <input
              id="username"
              className="input"
              name="username"
              type="text"
              placeholder="e.g. alice"
              value={form.username}
              onChange={handleChange}
              required
              autoComplete="username"
            />
          </div>

          <div className="form-group">
            <label className="label" htmlFor="password">Password</label>
            <input
              id="password"
              className="input"
              name="password"
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={handleChange}
              required
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            />
          </div>

          {mode === 'register' && (
            <div className="select-row">
              <div className="form-group">
                <label className="label" htmlFor="age">Age</label>
                <input
                  id="age"
                  className="input"
                  name="age"
                  type="number"
                  placeholder="25"
                  min="1"
                  max="120"
                  value={form.age}
                  onChange={handleChange}
                />
              </div>
              <div className="form-group">
                <label className="label" htmlFor="gender">Gender</label>
                <select
                  id="gender"
                  className="select"
                  name="gender"
                  value={form.gender}
                  onChange={handleChange}
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>
          )}

          {error && <div className="alert-error" style={{ marginBottom: 16 }}>{error}</div>}

          <button id="btn-submit" className="btn btn-primary" type="submit" disabled={loading} style={{ width: '100%', justifyContent: 'center' }}>
            {loading ? (
              <>
                <span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />
                {mode === 'login' ? 'Signing in…' : 'Creating account…'}
              </>
            ) : (
              mode === 'login' ? '→ Sign In' : '→ Create Account'
            )}
          </button>
        </form>

        {/* Demo hint */}
        <p style={{ textAlign: 'center', marginTop: 20, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          Demo: <strong style={{ color: 'var(--text-secondary)' }}>alice</strong> / <strong style={{ color: 'var(--text-secondary)' }}>password123</strong>
        </p>
      </div>
    </div>
  );
}
