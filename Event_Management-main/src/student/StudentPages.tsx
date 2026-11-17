import { DEPARTMENTS, type Dept, type SportsEvent, type Fixture } from '../data/sports';
import { useApp } from '../ui/AppContext';
import { CapacityBar, EmptyState, Field, MatchStateBadge, Monogram, Select, StatusPill, formatDate } from '../ui/components';
import { type FormEvent, type ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { priceFor } from '../ui/useSportsStore';

const nav = [
  { to: '/student', label: 'Overview', hint: 'Home & highlights' },
  { to: '/student/events', label: 'Events', hint: 'Browse & register' },
  { to: '/student/entries', label: 'My entries', hint: 'Passes & payments' },
  { to: '/student/results', label: 'Results', hint: 'Scores & standings' },
];

const sportImages: Record<string, string> = {
  Cricket: 'https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=900&q=80&auto=format&fit=crop',
  Badminton: 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=900&q=80&auto=format&fit=crop',
  Futsal: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=900&q=80&auto=format&fit=crop',
  Kabaddi: 'https://images.unsplash.com/photo-1517649763962-0c623066013b?w=900&q=80&auto=format&fit=crop',
  Athletics: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=900&q=80&auto=format&fit=crop',
  'Tug of War': 'https://images.unsplash.com/photo-1526676037777-05a232554f77?w=900&q=80&auto=format&fit=crop',
};

function sportImage(sport: string) {
  return sportImages[sport] ?? sportImages.Athletics;
}

function Spinner() {
  return <span className="button-spinner" aria-hidden />;
}

export function StudentShell({ title, subtitle, children, bare = false }: { title: string; subtitle: string; children: ReactNode; bare?: boolean }) {
  const { store, openModal } = useApp();
  const { pathname } = useLocation();
  const student = store.state.student;
  const openCount = store.state.events.filter((e) => e.status === 'Open' && e.approvals === 'Approved').length;

  return (
    <div className="workspace">
      <aside className="shell-aside">
        <Link to="/student" className="wordmark"><span className="crest">M</span><span>MIT-ADT<small>SPORTS OFFICE</small></span></Link>
        <div className="aside-identity"><span className="overline">STUDENT PORTAL</span><b>{store.sessionName}</b><small>{student.campusId} · {student.dept} · {student.year}</small></div>
        <nav className="shell-nav" aria-label="Student navigation">
          {nav.map((item) => {
            const count = item.to === '/student/entries' ? store.enrolments.length : item.to === '/student/events' ? openCount : 0;
            return (
              <Link key={item.to} to={item.to} className={`shell-link ${pathname === item.to ? 'current' : ''}`} aria-current={pathname === item.to ? 'page' : undefined}>
                <span><b>{item.label}{count > 0 && <em className={`nav-count ${item.to === '/student/events' ? 'warn' : ''}`}>{count}</em>}</b><small>{item.hint}</small></span>
                <i>{pathname === item.to ? '→' : ''}</i>
              </Link>
            );
          })}
        </nav>
        <div className="aside-foot">
          <button className="text-button" onClick={() => openModal({ title: 'How team entries work', sub: 'Captains, partners and substitutes.', body: <TeamHelp /> })}>Team entries help</button>
          <button className="text-button" onClick={() => openModal({ title: 'Sports Office', sub: 'Indoor Gymkhana · 9:00 AM–5:00 PM', body: <OfficeHelp /> })}>Contact the office</button>
          <p className="aside-legal">Open to currently enrolled MIT-ADT students. Carry your physical ID to every fixture.</p>
          <Link className="text-button" to="/login">Sign out</Link>
        </div>
      </aside>
      <main className="shell-main">
        <header className="shell-top"><span>STUDENT PORTAL <i>/</i> <b>{title.toUpperCase()}</b></span><span className="shell-top-right"><span className="live-dot" /> GC 2025—26</span></header>
        <section className="shell-body">
          {!bare && (
            <div className="page-head">
              <div><span className="page-kicker">GC 2025—26 · STUDENT DESK</span><h1>{title}</h1><p>{subtitle}</p></div>
              <div className="head-actions"><span className="role-note"><b>{store.sessionName}</b><small>{student.dept} · {student.campusId}</small></span></div>
            </div>
          )}
          {children}
          {pathname !== '/student/events' && (
            <Link className="sp-mobile-cta" to="/student/events"><span><i /> REGISTRATION OPEN</span><b>Register for an event →</b></Link>
          )}
          <footer className="shell-footer"><span>MIT-ADT SPORTS OFFICE · PUNE</span><a href="mailto:sports.office@mitwpu.edu.in">sports.office@mitwpu.edu.in</a></footer>
        </section>
      </main>
    </div>
  );
}

function TeamHelp() {
  return <div className="stack"><p>For team events the captain registers and names the team. Teammates are verified individually by the sport head before the fixture is locked. Doubles events need a partner&apos;s name at registration.</p><p className="quiet">Fees are charged once per entry unless the event says “per player”.</p></div>;
}

function OfficeHelp() {
  return <div className="stack"><dl className="entry-details"><div><dt>OFFICE</dt><dd>Indoor Gymkhana, MIT-ADT Kothrud</dd></div><div><dt>HOURS</dt><dd>Mon–Sat · 9:00 AM–5:00 PM</dd></div><div><dt>EMAIL</dt><dd>sports.office@mitwpu.edu.in</dd></div><div><dt>PHONE</dt><dd>+91 20 7117 7100</dd></div></dl><p className="quiet tiny">Entry fees, withdrawals and eligibility exceptions are handled by the Sports Office, not the sport head.</p></div>;
}

function EntryProgress({ event, paid, verified }: { event: SportsEvent; paid: boolean; verified: boolean }) {
  const steps = [
    { label: 'Registered', done: true },
    { label: event.fee > 0 ? (paid ? 'Fee paid' : 'Fee due') : 'No fee', done: event.fee === 0 || paid },
    { label: verified ? 'ID verified' : 'ID check', done: verified },
  ];
  const done = steps.filter((s) => s.done).length;
  return (
    <div className="entry-progress">
      <div className="entry-progress-top"><b>{done} of {steps.length} steps ready</b><span className="quiet tiny">Match day checklist</span></div>
      <div>{steps.map((s) => <i key={s.label} style={{ background: s.done ? 'var(--theme-secondary)' : undefined }} />)}</div>
      <div className="checklist compact">
        {steps.map((s) => <li key={s.label}><span className={`check ${s.done ? 'done' : ''}`}>{s.done ? '✓' : '·'}</span><span>{s.label}</span></li>)}
      </div>
    </div>
  );
}

function FixtureDetail({ fixture, event }: { fixture: Fixture; event?: SportsEvent }) {
  const myDept = useApp().store.state.student.dept;
  const mine = fixture.teamA === myDept || fixture.teamB === myDept;
  return (
    <div className="stack">
      {mine && <div className="inline-note small">Your department is in this fixture. Carry your campus ID and report 15 minutes before the slot.</div>}
      <dl className="entry-details">
        <div><dt>EVENT</dt><dd>{event?.title ?? fixture.eventId}</dd></div>
        <div><dt>ROUND</dt><dd>{fixture.round}</dd></div>
        <div><dt>VENUE</dt><dd>{fixture.venue}</dd></div>
        <div><dt>WHEN</dt><dd>{fixture.time}</dd></div>
        <div><dt>TEAMS</dt><dd>{fixture.teamA} vs {fixture.teamB}</dd></div>
        <div><dt>STATE</dt><dd>{fixture.state} · {fixture.scoreA}–{fixture.scoreB}</dd></div>
      </dl>
    </div>
  );
}

export function StudentOverview() {
  const { store, openModal } = useApp();
  const { events, fixtures } = store.state;
  const firstName = store.sessionName.split(' ')[0] || 'there';
  const openEvents = events.filter((e) => e.status === 'Open' && e.approvals === 'Approved');
  const myUpcoming = fixtures.filter((f) => f.state === 'Upcoming' && (f.teamA === store.state.student.dept || f.teamB === store.state.student.dept || store.enrolments.some((en) => en.eventId === f.eventId)));
  const live = fixtures.filter((f) => f.state === 'Live');
  const next = myUpcoming[0] ?? fixtures.find((f) => f.state === 'Upcoming');
  const athletes = openEvents.reduce((sum, e) => sum + e.registered, 0);
  const spotsLeft = openEvents.reduce((sum, e) => sum + Math.max(0, e.capacity - e.registered), 0);
  const standings = [...DEPARTMENTS].sort((a, b) => b.points - a.points);
  const myRank = standings.findIndex((d) => d.code === store.state.student.dept) + 1;
  const hottest = [...openEvents].sort((a, b) => b.registered / b.capacity - a.registered / a.capacity)[0];
  const hottestRegistered = hottest ? store.isRegistered(hottest.id) : false;
  const notices = [
    { time: 'Today', text: 'Carry your physical MIT-ADT ID card to every fixture and check-in desk.' },
    { time: 'Desk', text: 'Entry fees and withdrawals are handled at the Indoor Gymkhana, 9:00 AM–5:00 PM.' },
    { time: 'New', text: `${openEvents.length} events are currently open for registration across campus.` },
  ];

  return (
    <StudentShell bare title={`Welcome back, ${firstName}`} subtitle="Your campus sports hub — fixtures, registrations, passes and standings in one place.">
      <section className="sp-hero sp-hero-v2">
        <div className="sp-hero-photo" aria-hidden style={{ backgroundImage: 'linear-gradient(90deg, color-mix(in srgb, var(--theme-secondary-deep) 94%, transparent) 8%, color-mix(in srgb, var(--theme-secondary) 34%, transparent)), url(https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=1600&q=80&auto=format&fit=crop)' }} />
        <div className="sp-hero-content">
          <span className="sp-live-badge"><i /> REGISTRATION OPEN · 4 DAYS LEFT</span>
          <h1>Bring your<br /><em>a-game.</em></h1>
          <p>Six departments. One championship. {firstName}, register for an event, clear your ID check and show your pass at the gate — {store.state.student.dept} is counting on you.</p>
          <div className="sp-hero-actions">
            <Link className="button primary" to="/student/events">Register for an event →</Link>
            <Link className="button ghost" to="/student/entries">View my pass</Link>
          </div>
          <div className="sp-hero-proof">
            <div className="sp-avatar-stack" aria-hidden><Monogram code="COMP" size="sm" /><Monogram code="ENTC" size="sm" /><Monogram code="IT" size="sm" /><span>+{Math.max(0, athletes - 3)}</span></div>
            <span><b>{athletes} athletes</b> already signed up · <b>{spotsLeft} spots</b> left across {openEvents.length} events</span>
          </div>
        </div>
        <div className="sp-hero-side">
          <div className="sp-deadline">
            <span>REGISTRATION CLOSES</span>
            <div className="sp-clock"><b>04</b><small>DAYS</small><b>12</b><small>HRS</small></div>
            <p>Friday · 6:00 PM · Indoor Gymkhana desk</p>
          </div>
          <div className="sp-hero-card">
            <span className="label">NEXT UP FOR {store.state.student.dept}</span>
            {next ? <><b>{events.find((e) => e.id === next.eventId)?.title ?? next.eventId}</b><small>{next.time} · {next.venue}</small></> : <><b>No fixture yet</b><small>Register to get on the board.</small></>}
          </div>
          <Link className="sp-hero-strip" to="/student/results">
            <span>YOU ARE #{myRank} ON THE BOARD</span><b>{standings.find((d) => d.code === store.state.student.dept)?.points ?? 0} pts →</b>
          </Link>
        </div>
      </section>
      <div className="sp-ticker" aria-hidden>
        <div className="sp-ticker-track">{[...Array(2)].flatMap((_, loop) => ['CRICKET', 'BADMINTON', 'FUTSAL', 'KABADDI', 'ATHLETICS', 'TUG OF WAR', 'REGISTER NOW'].map((s) => <span key={`${loop}-${s}`}>{s}<i>✦</i></span>))}</div>
      </div>

      <div className="sp-stats">
        <div className="sp-stat accent"><span className="overline">MY ENTRIES</span><b>{store.enrolments.length}</b><small>Registered this season</small></div>
        <div className="sp-stat"><span className="overline">OPEN EVENTS</span><b>{openEvents.length}</b><small>Accepting registrations</small></div>
        <div className="sp-stat"><span className="overline">MY FIXTURES</span><b>{myUpcoming.length}</b><small>Upcoming matches</small></div>
        <div className="sp-stat"><span className="overline">DEPT POINTS</span><b>{DEPARTMENTS.find((d) => d.code === store.state.student.dept)?.points ?? 0}</b><small>{store.state.student.dept} on the board</small></div>
      </div>

      {live.length > 0 && (
        <section className="sp-section">
          <div className="sp-section-head"><div><h2>Live now</h2><p>Matches in progress across campus.</p></div></div>
          <div className="sp-live-grid">
            {live.map((f) => (
              <div key={f.id} className="sp-live-card sp-live">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                  <span className="overline">{events.find((e) => e.id === f.eventId)?.title}</span>
                  <MatchStateBadge state={f.state} />
                </div>
                <div className="sp-live-match">
                  <div className="sp-live-team"><Monogram code={f.teamA} size="sm" /> {f.teamA}</div>
                  <div className="sp-live-score">{f.scoreA}–{f.scoreB}</div>
                  <div className="sp-live-team">{f.teamB} <Monogram code={f.teamB} size="sm" /></div>
                </div>
                <div className="quiet tiny">{f.round} · {f.venue} · {f.time}</div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="sp-section">
        <div className="sp-section-head"><div><span className="sp-eyebrow">THE PROGRAMME</span><h2>Open for registration</h2><p>Pick an event, confirm your details, and secure your spot.</p></div><Link className="sp-link" to="/student/events">See all {openEvents.length} events →</Link></div>
        <div className="sp-grid-3">{openEvents.slice(0, 3).map((e) => <EventCard key={e.id} event={e} compact />)}</div>
      </section>

      <section className="sp-steps">
        <div className="sp-steps-intro"><span className="sp-eyebrow">HOW IT WORKS</span><h2>From sign-up to start line.</h2><p>Three steps, one pass. Most students finish in under two minutes.</p></div>
        <ol className="sp-step-list">
          <li><span className="sp-step-num">01</span><div><b>Pick your event</b><p>Compare formats, fees and what&apos;s left. Free events confirm instantly.</p></div></li>
          <li><span className="sp-step-num">02</span><div><b>Lock your spot</b><p>Add your team and pay securely — or pay later from My entries.</p></div></li>
          <li><span className="sp-step-num">03</span><div><b>Show your pass</b><p>Clear your ID check, then scan your entry pass at the gate.</p></div></li>
        </ol>
        <Link className="button primary" to="/student/events">Find your event →</Link>
      </section>

      <section className="sp-race">
        <div className="sp-race-intro">
          <span className="sp-eyebrow">THE RACE FOR THE TITLE</span>
          <h2>{store.state.student.dept} is #{myRank}.</h2>
          <p>{myRank <= 3 ? 'You are in medal contention. Every entry can move the board.' : 'One strong week can change everything. Enter an event and climb.'}</p>
          <Link className="sp-link" to="/student/results">Full standings →</Link>
        </div>
        <div className="sp-race-board">
          {standings.slice(0, 3).map((d, i) => (
            <div key={d.code} className={`sp-race-row ${d.code === store.state.student.dept ? 'mine' : ''}`}>
              <span className="sp-rank">{String(i + 1).padStart(2, '0')}</span>
              <Monogram code={d.code} size="sm" />
              <div><b>{d.code}</b><small>{d.name}</small></div>
              <strong>{d.points}<small>PTS</small></strong>
            </div>
          ))}
        </div>
      </section>

      {hottest && (hottestRegistered
        ? <Link className="sp-hot" to="/student/entries">
            <span className="sp-hot-mark">🔥</span>
            <span><b>{hottest.title} is filling fast</b><small>{hottest.capacity - hottest.registered} spots left · your entry is confirmed</small></span>
            <span className="sp-hot-cta">View my pass →</span>
          </Link>
        : <button className="sp-hot" onClick={() => openModal({ title: `Register · ${hottest.title}`, sub: `${formatDate(hottest.date)} · ${hottest.slot} · ${hottest.venue}`, body: <RegisterFlow event={hottest} /> })}>
            <span className="sp-hot-mark">🔥</span>
            <span><b>{hottest.title} is filling fast</b><small>{hottest.capacity - hottest.registered} spots left · {formatDate(hottest.date)} · {hottest.venue}</small></span>
            <span className="sp-hot-cta">Claim a spot →</span>
          </button>)}

      <div className="sp-grid-2">
        <section className="sp-section" style={{ marginBottom: 0 }}>
          <div className="sp-section-head"><div><span className="sp-eyebrow">MATCH DAY</span><h2>Upcoming fixtures</h2><p>What&apos;s scheduled next.</p></div><Link className="sp-link" to="/student/results">Full schedule →</Link></div>
          <div className="sp-fixture">
            {fixtures.filter((f) => f.state === 'Upcoming').slice(0, 4).map((f) => (
              <div key={f.id} className="sp-fixture-row">
                <div className="sp-fixture-when">{f.time.split(' · ')[0]}<br />{f.time.split(' · ')[1]}</div>
                <div><div className="sp-fixture-teams">{f.teamA} <span>vs</span> {f.teamB}</div><div className="quiet tiny">{events.find((e) => e.id === f.eventId)?.title} · {f.round}</div></div>
                <div className="sp-fixture-meta">{f.venue}</div>
                <button className="button ghost sm" onClick={() => openModal({ title: `${f.teamA} vs ${f.teamB}`, sub: `${f.time} · ${f.venue}`, body: <FixtureDetail fixture={f} event={events.find((e) => e.id === f.eventId)} /> })}>Details</button>
              </div>
            ))}
          </div>
        </section>
        <section className="sp-section" style={{ marginBottom: 0 }}>
          <div className="sp-section-head"><div><span className="sp-eyebrow">FROM THE DESK</span><h2>Notices &amp; info</h2><p>Know before you play.</p></div></div>
          <ul className="sp-notice">{notices.map((n) => <li key={n.time}><time>{n.time}</time><span>{n.text}</span></li>)}</ul>
          <div className="sp-banner" style={{ marginTop: 12 }}>
            <div><b>Need help with an entry?</b><p>Visit the Indoor Gymkhana or email the Sports Office.</p></div>
            <button className="button ghost sm" onClick={() => openModal({ title: 'Sports Office', sub: 'Indoor Gymkhana · 9:00 AM–5:00 PM', body: <OfficeHelp /> })}>Contact</button>
          </div>
        </section>
      </div>

      <section className="sp-cta-band">
        <div><span className="sp-eyebrow">DON&apos;T SIT THIS ONE OUT</span><h2>The season won&apos;t wait for you.</h2><p>{spotsLeft} spots left across {openEvents.length} events. Your department needs every point.</p></div>
        <div className="sp-cta-band-actions"><Link className="button primary" to="/student/events">Register now →</Link><Link className="button ghost" to="/student/results">See the board</Link></div>
      </section>
    </StudentShell>
  );
}

function EventCard({ event, compact }: { event: SportsEvent; compact?: boolean }) {
  const { store, openModal } = useApp();
  const enrolled = store.isRegistered(event.id);
  const open = event.status === 'Open' && event.approvals === 'Approved';
  const left = Math.max(0, event.capacity - event.registered);
  const [day, month] = formatDate(event.date).split(' ');
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);
  return (
    <article className="sp-event-card">
      <div className={`sp-event-media ${imageLoaded ? 'is-ready' : 'is-loading'}`}>
        <img className={`sp-event-photo ${imageLoaded && !imageFailed ? 'is-loaded' : ''}`} src={sportImage(event.sport)} alt="" loading="lazy" decoding="async" onLoad={() => setImageLoaded(true)} onError={() => { setImageFailed(true); setImageLoaded(true); }} />
        <span className="sp-event-shade" aria-hidden />
        <span className="sport-tag">{event.sport.toUpperCase()}</span>
        <span className="sport-mark">{event.sport.slice(0, 3).toUpperCase()}</span>
        <span className="sp-event-date"><b>{day}</b><small>{month}</small></span>
        {open && left <= 5 && <span className="sp-event-flag">{left === 0 ? 'FULL' : `${left} SPOTS LEFT`}</span>}
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', gap: 6 }}>
          <StatusPill tone={open ? 'green' : 'quiet'}>{open ? 'OPEN' : event.status.toUpperCase()}</StatusPill>
          {enrolled && <StatusPill tone="green">REGISTERED</StatusPill>}
        </div>
      </div>
      <div className="sp-event-body">
        <div className="sp-event-top"><span className="overline">{event.slot} · {event.venue}</span></div>
        <h3>{event.title}</h3>
        <div className="sp-meta">
          <span><i>FORMAT</i> {event.format}</span>
          {!compact && <span><i>HEAD</i> {event.headName ?? 'Sports Office'}</span>}
        </div>
        <CapacityBar used={event.registered} total={event.capacity} />
        <div className="sp-event-foot">
          <div className="sp-event-price-row">
            <div className="sp-price">{event.fee ? `₹${priceFor(event, event.teamSize)}` : 'Free'}<small>{event.fee ? `₹${event.fee} per ${event.feeUnit}` : 'No entry fee'}</small></div>
            <span className={`sp-spots ${left <= 4 ? 'urgent' : ''}`}><b>{left}</b>spots left</span>
          </div>
          {enrolled
            ? <Link className="button ghost sm" to="/student/entries">View entry pass →</Link>
            : <button className="button primary sm" disabled={!open || left === 0} onClick={() => openModal({ title: `Register · ${event.title}`, sub: `${formatDate(event.date)} · ${event.slot} · ${event.venue}`, body: <RegisterFlow event={event} /> })}>{left === 0 ? 'Sold out' : open ? 'Register now →' : 'Registration closed'}</button>}
        </div>
      </div>
    </article>
  );
}

export function StudentEvents() {
  const { store } = useApp();
  const [sport, setSport] = useState('All');
  const [fee, setFee] = useState<'All' | 'Free' | 'Paid'>('All');
  const [query, setQuery] = useState('');
  const events = store.state.events.filter((e) => e.approvals === 'Approved');
  const sports = ['All', ...Array.from(new Set(events.map((e) => e.sport)))];
  const visible = events.filter((e) => (sport === 'All' || e.sport === sport) && (fee === 'All' || (fee === 'Free' ? e.fee === 0 : e.fee > 0)) && `${e.title} ${e.venue} ${e.sport}`.toLowerCase().includes(query.toLowerCase()));
  const featured = events.find((e) => e.status === 'Open') ?? events[0];
  const hasFilters = sport !== 'All' || fee !== 'All' || query.trim() !== '';
  const clearFilters = () => { setSport('All'); setFee('All'); setQuery(''); };

  return (
    <StudentShell title="Events" subtitle="Discover what’s on, compare formats and fees, and register in a few steps.">
      {featured && (
        <section className="sp-featured">
          <div className="sp-featured-media" style={{ backgroundImage: `linear-gradient(135deg, color-mix(in srgb, var(--theme-secondary-deep) 50%, transparent), color-mix(in srgb, var(--theme-secondary-deep) 86%, transparent)), url(${sportImage(featured.sport)})` }}>
            <span className="sp-kicker">FEATURED EVENT</span>
            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{ font: '600 11px var(--mono)', letterSpacing: '.12em', color: 'var(--theme-accent)' }}>{featured.sport.toUpperCase()}</div>
              <h2>{featured.title}</h2>
              <p style={{ color: 'color-mix(in srgb, var(--theme-dominant) 82%, transparent)', fontSize: 12.5 }}>{formatDate(featured.date)} · {featured.slot} · {featured.venue}</p>
            </div>
            <span className="big">{featured.sport.slice(0, 2).toUpperCase()}</span>
          </div>
          <div className="sp-featured-body">
            <div className="sp-pill-row"><StatusPill tone={featured.status === 'Open' ? 'green' : 'quiet'}>{featured.status.toUpperCase()}</StatusPill><StatusPill tone="quiet">{featured.format}</StatusPill><StatusPill tone="quiet">{featured.fee ? `₹${featured.fee}/${featured.feeUnit}` : 'FREE'}</StatusPill></div>
            <h2>Step onto the field.</h2>
            <p className="quiet"><b style={{ color: 'var(--sage-deep)' }}>{featured.capacity - featured.registered} spots left</b> out of {featured.capacity}. {featured.registered} athletes are already in — entries are verified by {featured.headName ?? 'the Sports Office'} before match day.</p>
            <CapacityBar used={featured.registered} total={featured.capacity} />
            <ul className="sp-benefits">
              <li>Medal &amp; certificate</li>
              <li>Points for your department</li>
              <li>Entry pass on your phone</li>
            </ul>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 4 }}>
              <RegisterButton event={featured} />
              <span className="quiet tiny" style={{ alignSelf: 'center' }}>Captain and team details are collected during registration.</span>
            </div>
          </div>
        </section>
      )}

      <div className="sp-filters">
        <div className="sp-filter-group"><label>SPORT</label><div className="sp-chips">{sports.map((s) => <button key={s} className={`chip ${sport === s ? 'active' : ''}`} aria-pressed={sport === s} onClick={() => setSport(s)}>{s}</button>)}</div></div>
        <div className="sp-filter-group"><label>ENTRY FEE</label><div className="segmented">{(['All', 'Free', 'Paid'] as const).map((f) => <button key={f} className={fee === f ? 'active' : ''} aria-pressed={fee === f} onClick={() => setFee(f)}>{f}</button>)}</div></div>
        <div className="sp-search"><label>SEARCH</label><input placeholder="Search by event, sport or venue…" value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Search events" /></div>
      </div>

      {visible.length === 0
        ? <EmptyState title="No events match" body="Try a different sport, fee filter, or search term." action={hasFilters ? <button className="button ghost sm" onClick={clearFilters}>Clear filters</button> : undefined} />
        : <>
            <div className="sp-result-line"><span aria-live="polite"><b>{visible.length}</b> events matching your filters</span>{hasFilters ? <button className="text-button" onClick={clearFilters}>Clear filters ×</button> : <span className="quiet tiny">Registration closes in 4 days · spots update live</span>}</div>
            <div className="sp-grid-3">{visible.map((e) => <EventCard key={e.id} event={e} />)}</div>
          </>}
    </StudentShell>
  );
}

function RegisterButton({ event }: { event: SportsEvent }) {
  const { store, openModal } = useApp();
  const enrolled = store.isRegistered(event.id);
  const open = event.status === 'Open' && event.approvals === 'Approved';
  if (enrolled) return <Link className="button ghost" to="/student/entries">View your entry pass</Link>;
  return <button className="button primary" disabled={!open} onClick={() => openModal({ title: `Register · ${event.title}`, sub: `${formatDate(event.date)} · ${event.slot} · ${event.venue}`, body: <RegisterFlow event={event} /> })}>{open ? (event.fee ? `Secure my spot · ₹${priceFor(event, event.teamSize)}` : 'Secure my free spot →') : 'Registration closed'}</button>;
}

function RegisterFlow({ event }: { event: SportsEvent }) {
  const { store, notify, closeModal } = useApp();
  const student = store.state.student;
  const [step, setStep] = useState<1 | 2>(1);
  const [form, setForm] = useState({ name: student.name, campusId: student.campusId, dept: student.dept, year: student.year, partner: '', team: `${student.dept} ${event.teamSize > 1 ? 'A' : ''}`.trim() });
  const [method, setMethod] = useState('UPI · GPay');
  const [error, setError] = useState('');
  const [paying, setPaying] = useState(false);
  const payTimer = useRef<number | null>(null);
  useEffect(() => () => { if (payTimer.current !== null) window.clearTimeout(payTimer.current); }, []);
  const price = priceFor(event, event.teamSize);
  const paid = price > 0;
  const change = (key: 'name' | 'campusId' | 'partner' | 'team') => (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [key]: e.target.value });

  const continueToPayment = (ev: FormEvent) => {
    ev.preventDefault();
    const name = form.name.trim();
    if (!name) { setError('Add the name that appears on your campus ID.'); return; }
    const rawId = form.campusId.trim();
    const emailId = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(rawId);
    const campusId = emailId ? rawId.toLowerCase() : rawId.replace(/[\s-]/g, '').toUpperCase();
    if (!emailId && !/^[A-Z0-9]{6,20}$/.test(campusId)) { setError('Enter a campus ID (6–20 letters/numbers) or your MIT-ADT email.'); return; }
    const team = (form.team || form.dept).trim();
    const partner = form.partner.trim();
    if (event.teamSize > 1 && !team) { setError('Add a team name for this entry.'); return; }
    if (event.teamSize === 2 && !partner) { setError('Add your doubles partner.'); return; }
    setError('');
    const clean = { ...form, name, campusId, partner, team };
    setForm(clean);

    if (paid) {
      // Reserve first so checkout has an entry to pay against (and holds the spot if payment is deferred).
      if (!store.isRegistered(event.id)) {
        const res = store.actions.reserve(event, clean, event.teamSize);
        if (!res.ok) { setError(res.error); return; }
      }
      setStep(2);
      return;
    }

    const res = store.actions.reserve(event, clean, event.teamSize);
    if (!res.ok) { setError(res.error); return; }
    notify(`Entry sent for ${event.title}. ${event.headName ?? 'The Sports Office'} will verify your ID next.`);
    closeModal();
  };

  const completePayment = () => {
    if (paying) return;
    setPaying(true);
    payTimer.current = window.setTimeout(() => {
      const res = store.actions.pay(event.id, method);
      if (!res.ok) {
        setPaying(false);
        setError(res.error);
        return;
      }
      notify(`Paid ₹${price} for ${event.title}. Reference ${res.ref}. Entry sent for ID verification.`);
      closeModal();
    }, 380);
  };

  if (step === 2) {
    return <div className="checkout">
      <div className="checkout-summary"><div><span className="overline">PAYING FOR</span><h3>{event.title}</h3><p>{form.team} · {event.format}</p></div><strong>₹{price}</strong></div>
      <div className="checkout-row"><span>Participant</span><b>{form.name} · {form.campusId}</b></div>
      <div className="checkout-row"><span>Slot</span><b>{formatDate(event.date)} · {event.slot} · {event.venue}</b></div>
      <div className="checkout-row"><span>Fee basis</span><b>₹{event.fee} per {event.feeUnit} × {event.feeUnit === 'player' ? event.teamSize : 1}</b></div>
      <Field label="PAYMENT METHOD"><div className="pay-methods">{[['UPI · GPay', 'Instant · UPI'], ['UPI · PhonePe', 'Instant · UPI'], ['Card', 'Visa / RuPay'], ['Cash at Sports Office', 'Pay at Indoor Gymkhana']].map(([v, h], i) => <button type="button" key={v} className={`pay-method ${method === v ? 'active' : ''}`} disabled={paying} autoFocus={i === 0} onClick={() => setMethod(v)}><i />{v}<small>{h}</small></button>)}</div></Field>
      <div className="checkout-total"><span>Total payable</span><b>₹{price}</b></div>
      <div className="checkout-actions"><button className="button ghost" disabled={paying} onClick={() => setStep(1)}>← Back</button><button className={`button primary ${paying ? 'is-loading' : ''}`} onClick={completePayment} disabled={paying} aria-busy={paying}>{paying ? <><Spinner /> Processing payment…</> : `Pay ₹${price} & confirm`}</button></div>
      <p className="quiet tiny">Your spot is held while you complete payment. You can also pay later from My entries.</p>
      <p className="quiet tiny">Prototype checkout: a simulated payment reference is recorded. No real money is charged.</p>
    </div>;
  }

  return <form onSubmit={continueToPayment} className="stack">
    <div className="modal-grid">
      <Field label="FULL NAME" required><input value={form.name} onChange={change('name')} autoComplete="name" /></Field>
      <Field label="CAMPUS ID" required hint="on your MIT-ADT card"><input value={form.campusId} onChange={change('campusId')} autoComplete="off" /></Field>
      <Field label="DEPARTMENT"><Select value={form.dept} onChange={(v) => setForm({ ...form, dept: v as Dept, team: `${v} ${event.teamSize > 1 ? 'A' : ''}`.trim() })} label="Department" options={DEPARTMENTS.map((d) => ({ value: d.code, label: `${d.code} · ${d.name}` }))} /></Field>
      <Field label="YEAR"><Select value={form.year} onChange={(v) => setForm({ ...form, year: v })} label="Year" options={['FE', 'SE', 'TE', 'BE', 'ME'].map((y) => ({ value: y, label: y }))} /></Field>
      {event.teamSize > 1 && <Field label="TEAM NAME" required hint={`${event.teamSize} players per entry`}><input value={form.team} onChange={change('team')} /></Field>}
      {event.teamSize === 2 && <Field label="PARTNER NAME" required><input value={form.partner} onChange={change('partner')} placeholder="Partner's full name" /></Field>}
    </div>
    <div className="fee-summary"><span>{paid ? 'Entry fee' : 'Free entry'}<small>{paid ? `₹${event.fee} per ${event.feeUnit}` : 'No payment step'}</small></span><b>{paid ? `₹${price}` : '₹0'}</b></div>
    {error && <p className="form-error" role="alert">{error}</p>}
    <div className="modal-actions"><button type="button" className="button ghost" onClick={closeModal}>Cancel</button><button type="submit" className="button primary">{paid ? `Continue · pay ₹${price}` : 'Confirm free entry'}</button></div>
    <p className="quiet tiny">The sport head will verify your campus ID before your first fixture.</p>
  </form>;
}

export function StudentEntries() {
  const { store, notify, openModal, closeModal } = useApp();
  const { events, participants, payments } = store.state;
  const [filter, setFilter] = useState<'All' | 'Pending' | 'Verified'>('All');
  const rows = store.enrolments.map((en) => {
    const event = events.find((e) => e.id === en.eventId);
    const participant = participants.find((p) => p.id === en.participantId);
    const payment = payments.find((p) => p.participantId === en.participantId);
    return event ? { en, event, participant, payment } : null;
  }).filter((r): r is NonNullable<typeof r> => !!r);
  const visible = rows.filter((r) => filter === 'All' || (filter === 'Verified' ? r.participant?.idStatus === 'Verified' : r.participant?.idStatus !== 'Verified'));
  const due = rows.filter((r) => r.event.fee > 0 && !r.payment && !r.en.feePaid);

  return (
    <StudentShell title="My entries" subtitle="Your registrations, entry passes, fee receipts and ID verification — all in one place.">
      {due.length > 0 && (
        <div className="sp-banner" style={{ marginBottom: 16 }}>
          <div><b>{due.length} entr{due.length === 1 ? 'y has' : 'ies have'} an outstanding fee</b><p>Complete payment to confirm your spot before the deadline.</p></div>
        </div>
      )}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 14, flexWrap: 'wrap' }}>
        <div className="segmented">{(['All', 'Pending', 'Verified'] as const).map((f) => <button key={f} className={filter === f ? 'active' : ''} aria-pressed={filter === f} onClick={() => setFilter(f)}>{f}</button>)}</div>
        <span className="quiet tiny">{visible.length} shown · {rows.length} total</span>
      </div>
      {visible.length === 0 ? (
        <div className="sp-empty"><h3>No entries in this view</h3><p>{rows.length === 0 ? 'When you register for an event, your pass, payment status and verification will appear here.' : 'Try another filter to see your other entries.'}</p><Link className="button primary" to="/student/events">Browse events</Link></div>
      ) : (
        <div className="sp-entries">
          {visible.map(({ en, event, participant, payment }) => {
            const verified = participant?.idStatus === 'Verified';
            const paid = !!payment || en.feePaid || event.fee === 0;
            return (
              <article key={en.participantId} className={`sp-entry ${!verified ? 'highlight' : ''}`}>
                <div className="sp-entry-head">
                  <span className="overline">ENTRY {event.id} · {event.sport.toUpperCase()}</span>
                  <StatusPill tone={verified ? 'green' : 'amber'}>{verified ? 'ID VERIFIED' : 'PENDING VERIFICATION'}</StatusPill>
                </div>
                <h3>{event.title}</h3>
                <p className="quiet">{event.format} · {formatDate(event.date)} · {event.slot}</p>
                <dl className="sp-entry-grid">
                  <div><dt>TEAM / NAME</dt><dd>{participant?.team ?? en.team}</dd></div>
                  <div><dt>VENUE</dt><dd>{event.venue}</dd></div>
                  <div><dt>SPORT HEAD</dt><dd>{event.headName ?? 'Sports Office'}</dd></div>
                  <div><dt>PARTICIPANTS</dt><dd>{event.teamSize} player{event.teamSize > 1 ? 's' : ''}</dd></div>
                </dl>
                <div className="pass-row"><span className="pass-code">PASS · {event.id} · {store.state.student.campusId}</span><span className="pass-stripes" aria-hidden /><span className="pass-label">SHOW AT CHECK-IN</span></div>
                <EntryProgress event={event} paid={paid} verified={verified} />
                <div className="entry-pay">
                  <span>{event.fee > 0 ? (paid ? `Paid ₹${en.feeDue} · ${payment?.ref ?? en.paymentRef}` : `Fee due ₹${en.feeDue}`) : 'No entry fee'}</span>
                  <StatusPill tone={paid ? 'green' : 'red'}>{event.fee === 0 ? 'NO FEE' : paid ? 'PAID' : 'UNPAID'}</StatusPill>
                </div>
                <div className="sp-entry-actions">
                  {event.fee > 0 && !paid && <button className="button primary sm" onClick={() => openModal({ title: `Pay · ${event.title}`, sub: `${en.team} · ₹${en.feeDue} due`, body: <PayOnly eventId={event.id} /> })}>Pay ₹{en.feeDue}</button>}
                  <button className="button ghost sm" onClick={() => openModal({ title: event.title, sub: `${formatDate(event.date)} · ${event.slot}`, body: <EntryDetail eventId={event.id} /> })}>Details</button>
                  <button className="button ghost sm" onClick={() => openModal({ title: `Withdraw · ${event.title}`, sub: 'This will remove your entry and free the spot.', body: <div className="stack"><p>Withdraw your registration for <b>{event.title}</b>? If a fee was paid, collect your refund at the Sports Office.</p><div className="modal-actions"><button className="button ghost" onClick={closeModal}>Keep entry</button><button className="button danger" onClick={() => { store.actions.withdraw(event.id); notify(`Withdrawn from ${event.title}.`); closeModal(); }}>Withdraw</button></div></div> })}>Withdraw</button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </StudentShell>
  );
}

function EntryDetail({ eventId }: { eventId: string }) {
  const { store } = useApp();
  const event = store.state.events.find((e) => e.id === eventId);
  const en = store.enrolments.find((e) => e.eventId === eventId);
  const participant = store.state.participants.find((p) => p.id === en?.participantId);
  const payment = store.state.payments.find((p) => p.participantId === en?.participantId);
  if (!event) return null;
  return (
    <div className="stack">
      <dl className="entry-details">
        <div><dt>EVENT</dt><dd>{event.title}</dd></div>
        <div><dt>FORMAT</dt><dd>{event.format}</dd></div>
        <div><dt>WHEN</dt><dd>{formatDate(event.date)} · {event.slot}</dd></div>
        <div><dt>VENUE</dt><dd>{event.venue}</dd></div>
        <div><dt>TEAM</dt><dd>{participant?.team ?? '—'}</dd></div>
        <div><dt>ID STATUS</dt><dd>{participant?.idStatus ?? '—'}</dd></div>
        <div><dt>FEE</dt><dd>{event.fee ? `₹${en?.feeDue ?? 0}` : 'Free'}</dd></div>
        <div><dt>PAYMENT</dt><dd>{payment ? `${payment.method} · ${payment.ref} · ${payment.received}` : (event.fee ? (en?.feePaid ? `Paid · ${en.paymentRef}` : 'Not paid') : 'Not required')}</dd></div>
      </dl>
      <p className="quiet tiny">Report 15 minutes before your slot with your campus ID. The sport head verifies identity at check-in.</p>
    </div>
  );
}

function PayOnly({ eventId }: { eventId: string }) {
  const { store, notify, closeModal } = useApp();
  const event = store.state.events.find((e) => e.id === eventId);
  const enrolment = store.enrolments.find((e) => e.eventId === eventId);
  const [method, setMethod] = useState('UPI · GPay');
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState('');
  const payTimer = useRef<number | null>(null);
  useEffect(() => () => { if (payTimer.current !== null) window.clearTimeout(payTimer.current); }, []);
  if (!event || !enrolment) return null;
  const price = enrolment.feeDue > 0 ? enrolment.feeDue : priceFor(event, event.teamSize);
  const completePayment = () => {
    if (paying) return;
    setError('');
    setPaying(true);
    payTimer.current = window.setTimeout(() => {
      const res = store.actions.pay(event.id, method);
      if (!res.ok) { setPaying(false); setError(res.error); return; }
      notify(`Payment recorded · ₹${price} · ${res.ref}.`);
      closeModal();
    }, 380);
  };
  return <div className="checkout">
    <div className="checkout-summary"><div><span className="overline">OUTSTANDING ENTRY FEE</span><h3>{event.title}</h3><p>{enrolment.team ?? event.title}</p></div><strong>₹{price}</strong></div>
    <Field label="PAYMENT METHOD"><div className="pay-methods">{[['UPI · GPay', 'Instant · UPI'], ['UPI · PhonePe', 'Instant · UPI'], ['Card', 'Visa / RuPay'], ['Cash at Sports Office', 'Pay at Indoor Gymkhana']].map(([v, h]) => <button type="button" key={v} className={`pay-method ${method === v ? 'active' : ''}`} disabled={paying} onClick={() => setMethod(v)}><i />{v}<small>{h}</small></button>)}</div></Field>
    <div className="checkout-total"><span>Total payable</span><b>₹{price}</b></div>
    {error && <p className="form-error">{error}</p>}
    <div className="modal-actions"><button className="button ghost" disabled={paying} onClick={closeModal}>Later</button><button className={`button primary ${paying ? 'is-loading' : ''}`} onClick={completePayment} disabled={paying || price <= 0} aria-busy={paying}>{paying ? <><Spinner /> Processing…</> : `Pay ₹${price}`}</button></div>
  </div>;
}

export function StudentResults() {
  const { store, openModal } = useApp();
  const { fixtures, events } = store.state;
  const [tab, setTab] = useState<'Fixtures' | 'Standings'>('Fixtures');
  const [stateFilter, setStateFilter] = useState<'All' | 'Live' | 'Upcoming' | 'Final'>('All');
  const visible = fixtures.filter((f) => stateFilter === 'All' || f.state === stateFilter);
  const sortedDepts = useMemo(() => [...DEPARTMENTS].sort((a, b) => b.points - a.points), []);

  return (
    <StudentShell title="Results & standings" subtitle="Follow live scores, browse the fixture board, and track the department championship race.">
      <div className="tabs" role="tablist" aria-label="Results views">
        <button id="tab-fixtures" role="tab" aria-selected={tab === 'Fixtures'} aria-controls="panel-fixtures" className={tab === 'Fixtures' ? 'active' : ''} onClick={() => setTab('Fixtures')}>Fixtures &amp; scores</button>
        <button id="tab-standings" role="tab" aria-selected={tab === 'Standings'} aria-controls="panel-standings" className={tab === 'Standings' ? 'active' : ''} onClick={() => setTab('Standings')}>Department standings</button>
      </div>

      {tab === 'Fixtures' ? (
        <div id="panel-fixtures" role="tabpanel" aria-labelledby="tab-fixtures">
          <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
            {(['All', 'Live', 'Upcoming', 'Final'] as const).map((s) => <button key={s} className={`chip ${stateFilter === s ? 'active' : ''}`} aria-pressed={stateFilter === s} onClick={() => setStateFilter(s)}>{s}</button>)}
          </div>
          <div className="sp-fixture">
            {visible.length === 0
              ? <div className="sp-empty" style={{ border: 0 }}><h3>No fixtures in this view</h3><p>Try another filter to see upcoming, live or completed matches.</p></div>
              : visible.map((f) => {
                const event = events.find((e) => e.id === f.eventId);
                return (
                  <div key={f.id} className="sp-fixture-row">
                    <div className="sp-fixture-when">{f.time.split(' · ')[0]}<br />{f.time.split(' · ')[1]}</div>
                    <div>
                      <div className="sp-fixture-teams"><Monogram code={f.teamA} size="sm" /> {f.teamA} <span>vs</span> {f.teamB} <Monogram code={f.teamB} size="sm" /></div>
                      <div className="quiet tiny">{event?.title} · {f.round} · {f.venue}</div>
                    </div>
                    <div className="sp-score">{f.scoreA === '—' ? '—' : `${f.scoreA}–${f.scoreB}`}</div>
                    <div className="sp-fixture-actions">
                      <MatchStateBadge state={f.state} />
                      <button className="button ghost sm" onClick={() => openModal({ title: `${f.teamA} vs ${f.teamB}`, sub: `${event?.title ?? ''} · ${f.round}`, body: <FixtureDetail fixture={f} event={event} /> })}>Details</button>
                    </div>
                  </div>
                );
              })}
          </div>
          <div className="sp-banner" style={{ marginTop: 14 }}>
            <div><b>Fixtures update during the day</b><p>Live scores are entered by sport heads and refresh as matches progress.</p></div>
          </div>
        </div>
      ) : (
        <div id="panel-standings" role="tabpanel" aria-labelledby="tab-standings">
          <div className="sp-podium">
            {sortedDepts.slice(0, 3).map((d, i) => (
              <div key={d.code} className={`sp-podium-card ${i === 0 ? 'gold' : ''}`}>
                <span className="place">{['CHAMPION', 'RUNNER-UP', 'THIRD'][i]}</span>
                <Monogram code={d.code} />
                <b>{d.code}</b>
                <div className="quiet tiny">{d.name}</div>
                <strong>{d.points}</strong>
                <div className="sp-medals"><span>🥇 {d.gold}</span><span>🥈 {d.silver}</span><span>🥉 {d.bronze}</span></div>
              </div>
            ))}
          </div>
          <div className="sp-stand">
            {sortedDepts.map((d, i) => (
              <div key={d.code} className="sp-stand-row">
                <span className={`sp-rank ${i < 3 ? 'top' : ''}`}>{String(i + 1).padStart(2, '0')}</span>
                <div className="sp-dept"><Monogram code={d.code} /><div><b>{d.code}</b><small>{d.name}</small></div></div>
                <div className="sp-medals"><span>🥇 {d.gold}</span><span>🥈 {d.silver}</span><span>🥉 {d.bronze}</span></div>
                <div className="sp-points">{d.points}<div className="quiet tiny" style={{ font: '500 9px var(--mono)', textAlign: 'right' }}>PTS</div></div>
              </div>
            ))}
          </div>
          <div className="sp-banner" style={{ marginTop: 14 }}>
            <div><b>Scoring system</b><p>Gold = 10 pts · Silver = 7 pts · Bronze = 5 pts. Points update when fixtures are finalised.</p></div>
          </div>
        </div>
      )}
    </StudentShell>
  );
}
