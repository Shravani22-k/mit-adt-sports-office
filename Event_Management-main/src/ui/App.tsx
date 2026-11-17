import { FormEvent, Suspense, lazy, useEffect, useState } from 'react';
import { Link, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { AppProvider, useApp } from './AppContext';
import { PortalSkeleton } from './components';
import { DEPARTMENTS } from '../data/sports';

const StudentOverview = lazy(() => import('../student/StudentPages').then((m) => ({ default: m.StudentOverview })));
const StudentEvents = lazy(() => import('../student/StudentPages').then((m) => ({ default: m.StudentEvents })));
const StudentEntries = lazy(() => import('../student/StudentPages').then((m) => ({ default: m.StudentEntries })));
const StudentResults = lazy(() => import('../student/StudentPages').then((m) => ({ default: m.StudentResults })));
const HeadOverview = lazy(() => import('../head/HeadPages').then((m) => ({ default: m.HeadOverview })));
const HeadParticipants = lazy(() => import('../head/HeadPages').then((m) => ({ default: m.HeadParticipants })));
const HeadFixtures = lazy(() => import('../head/HeadPages').then((m) => ({ default: m.HeadFixtures })));
const AdminOverview = lazy(() => import('../admin/AdminPages').then((m) => ({ default: m.AdminOverview })));
const AdminEvents = lazy(() => import('../admin/AdminPages').then((m) => ({ default: m.AdminEvents })));
const AdminHeads = lazy(() => import('../admin/AdminPages').then((m) => ({ default: m.AdminHeads })));
const AdminFinance = lazy(() => import('../admin/AdminPages').then((m) => ({ default: m.AdminFinance })));

const SPORTS = ['Cricket', 'Badminton', 'Futsal', 'Kabaddi', 'Athletics', 'Tug of War'];
const POSTER = 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=1400&q=80&auto=format&fit=crop';

type Role = 'student' | 'head' | 'admin';
const ROLES: Record<Role, { name: string; code: string; blurb: string }> = {
  student: { name: 'Student', code: 'ST', blurb: 'Register for sports, pay entry fees, and check your fixtures.' },
  head: { name: 'Sport head', code: 'SH', blurb: 'Verify IDs and run the fixtures for one assigned sport.' },
  admin: { name: 'Sports office', code: 'AD', blurb: 'Approve events, set fees, assign heads, and review collections.' },
};
const KEY = 'sports-role';

export default function App() {
  const [role, setRole] = useState<Role | null>(() => {
    const saved = localStorage.getItem(KEY) as Role | null;
    return saved && ROLES[saved] ? saved : null;
  });
  const navigate = useNavigate();
  const signIn = (next: Role) => { localStorage.setItem(KEY, next); setRole(next); navigate(`/${next}`); };
  const signOut = () => { localStorage.removeItem(KEY); setRole(null); navigate('/login'); };

  return <AppProvider key={role ?? 'guest'}>
    <Suspense fallback={<PortalSkeleton />}>
      <Routes>
        <Route path="/" element={<Navigate to={role ? `/${role}` : '/login'} replace />} />
        <Route path="/login" element={<Login role={role} onSignIn={signIn} onSignOut={signOut} />} />
        <Route path="/student" element={role === 'student' ? <StudentOverview /> : <Navigate to="/login?role=student" replace />} />
        <Route path="/student/events" element={role === 'student' ? <StudentEvents /> : <Navigate to="/login?role=student" replace />} />
        <Route path="/student/entries" element={role === 'student' ? <StudentEntries /> : <Navigate to="/login?role=student" replace />} />
        <Route path="/student/results" element={role === 'student' ? <StudentResults /> : <Navigate to="/login?role=student" replace />} />
        <Route path="/head" element={role === 'head' ? <HeadOverview /> : <Navigate to="/login?role=head" replace />} />
        <Route path="/head/participants" element={role === 'head' ? <HeadParticipants /> : <Navigate to="/login?role=head" replace />} />
        <Route path="/head/fixtures" element={role === 'head' ? <HeadFixtures /> : <Navigate to="/login?role=head" replace />} />
        <Route path="/admin" element={role === 'admin' ? <AdminOverview /> : <Navigate to="/login?role=admin" replace />} />
        <Route path="/admin/events" element={role === 'admin' ? <AdminEvents /> : <Navigate to="/login?role=admin" replace />} />
        <Route path="/admin/heads" element={role === 'admin' ? <AdminHeads /> : <Navigate to="/login?role=admin" replace />} />
        <Route path="/admin/finance" element={role === 'admin' ? <AdminFinance /> : <Navigate to="/login?role=admin" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  </AppProvider>;
}

function Login({ role, onSignIn, onSignOut }: { role: Role | null; onSignIn: (role: Role) => void; onSignOut: () => void }) {
  const { store } = useApp();
  const openEvents = store.state.events.filter((e) => e.status === 'Open' && e.approvals === 'Approved');
  const athletes = store.state.events.reduce((sum, e) => sum + e.registered, 0);
  const spotsLeft = openEvents.reduce((sum, e) => sum + Math.max(0, e.capacity - e.registered), 0);
  const sportCount = new Set(store.state.events.map((e) => e.sport)).size;
  const location = useLocation();
  const requested = new URLSearchParams(location.search).get('role') as Role | null;
  const [selected, setSelected] = useState<Role>(requested && ROLES[requested] ? requested : 'student');
  const [identity, setIdentity] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (requested && ROLES[requested]) setSelected(requested);
  }, [requested]);

  if (role) {
    return <main className="login-layout">
      <aside className="login-aside"><div className="brand-lockup"><span className="crest">M</span><span>MIT-ADT<small>SPORTS OFFICE · PUNE</small></span></div><div className="login-statement"><span className="overline">SESSION ACTIVE</span><h1>You are already<br />signed in as<br /><em>{ROLES[role].name.toLowerCase()}.</em></h1></div></aside>
      <section className="login-panel"><div className="login-card"><span className="overline">CURRENT WORKSPACE</span><h2>{ROLES[role].name} portal</h2><p className="quiet">{ROLES[role].blurb}</p><div className="stack gap-lg"><Link className="button primary full" to={`/${role}`}>Continue to my workspace →</Link><button className="button ghost full" onClick={onSignOut}>Sign out and switch account</button></div><p className="login-foot">Demo mode: session is kept in this browser only.</p></div></section>
    </main>;
  }

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const raw = identity.trim();
    if (!raw) { setError(selected === 'student' ? 'Enter your campus ID or MIT-ADT email.' : 'Enter your MIT-ADT staff email.'); return; }
    const emailLike = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(raw);
    const campusId = /^[A-Za-z0-9._-]{4,40}$/.test(raw);
    if (selected === 'student') {
      if (!emailLike && !campusId) { setError('Enter a valid campus ID (4–40 characters) or email address.'); return; }
    } else if (!emailLike) {
      setError('Enter a valid staff email address.'); return;
    }
    if (raw.length > 120) { setError('That identifier is too long.'); return; }
    onSignIn(selected);
  };

  return <main className="login-layout">
    <aside className="login-aside">
      <div className="login-poster" aria-hidden style={{ backgroundImage: `linear-gradient(180deg, color-mix(in srgb, var(--theme-secondary) 18%, transparent), color-mix(in srgb, var(--theme-secondary-deep) 92%, transparent)), url(${POSTER})` }} />
      <div className="brand-lockup"><span className="crest">M</span><span>MIT-ADT<small>GENERAL CHAMPIONSHIP 2025—26</small></span></div>
      <div className="login-statement">
        <span className="login-open"><i /> REGISTRATION OPEN · 4 DAYS LEFT</span>
        <h1>The season<br />is <em>yours.</em></h1>
        <p>Six departments. {sportCount || 12} sports. One title. Register your squad, clear your ID check, and show your pass at the gate.</p>
        <div className="login-hero-actions">
          <a className="button primary" href="#signin">Register for an event</a>
          <span className="login-proof"><b>{athletes}</b> athletes already in</span>
        </div>
      </div>
      <ul className="login-facts">
        <li><b>{String(openEvents.length).padStart(2, '0')}</b><span>Events open now</span></li>
        <li><b>{String(DEPARTMENTS.length).padStart(2, '0')}</b><span>Departments competing</span></li>
        <li><b>{String(spotsLeft).padStart(2, '0')}</b><span>Spots left this season</span></li>
      </ul>
      <p className="login-copy">© 2025 MIT-ADT Sports Office · Kothrud, Pune</p>
      <div className="login-ticker" aria-hidden>
        <div className="login-ticker-track">
          {[...SPORTS, ...SPORTS, ...SPORTS].map((s, i) => <span key={`${s}-${i}`}>{s}<i>✦</i></span>)}
        </div>
      </div>
    </aside>
    <section className="login-panel" id="signin">
      <div className="login-card">
        <div className="login-card-head"><span className="overline">SECURE SIGN IN</span><span className="login-spots"><i /> {spotsLeft} spots left</span></div>
        <h2>Get in the game.</h2>
        <p className="quiet">Pick your workspace. Each role sees only the tools and data it needs.</p>
        <div className="role-picker" role="radiogroup" aria-label="Account role">{(Object.keys(ROLES) as Role[]).map((key) => <button key={key} type="button" role="radio" aria-checked={selected === key} className={`role-option ${selected === key ? 'selected' : ''}`} onClick={() => { setSelected(key); setError(''); }}><span className="role-code">{ROLES[key].code}</span><span className="role-text"><b>{ROLES[key].name}</b><small>{ROLES[key].blurb}</small></span><span className="role-radio" /></button>)}</div>
        <form onSubmit={submit} className="login-form">
          <label htmlFor="identity">{selected === 'student' ? 'CAMPUS ID OR EMAIL' : 'MIT-ADT STAFF EMAIL'}</label>
          <input id="identity" value={identity} onChange={(e) => { setIdentity(e.target.value); setError(''); }} placeholder={selected === 'student' ? '2023BTECH01234' : 'name@mitwpu.edu.in'} autoComplete="username" />
          <label htmlFor="password">PASSWORD</label>
          <input id="password" type="password" placeholder="Any password for this demo" autoComplete="current-password" />
          {error && <p className="form-error">{error}</p>}
          <button type="submit" className="button primary full">Enter the {ROLES[selected].name.toLowerCase()} portal →</button>
        </form>
        <p className="login-foot">New season? Student entries are reviewed by your sport head. Prototype demo — no real password check.</p>
        <div className="login-sport-strip">{SPORTS.slice(0, 5).map((s) => <span key={s}>{s}</span>)}</div>
      </div>
    </section>
  </main>;
}