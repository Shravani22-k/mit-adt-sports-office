import { FormEvent, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { DEPARTMENTS, Dept, MatchState, Participant, SportsEvent } from '../data/sports';
import { useApp } from '../ui/AppContext';
import { CapacityBar, Field, Select, StatusPill, formatDate } from '../ui/components';
import { asString, cleanTeam } from '../ui/validate';

const nav = [
  { to: '/head', label: 'Overview', hint: 'Today at a glance' },
  { to: '/head/participants', label: 'Participants', hint: 'ID checks and squads' },
  { to: '/head/fixtures', label: 'Fixtures', hint: 'Scores and schedules' },
];

/** The signed-in head. Kept in one place so the whole desk stays consistent. */
const HEAD_ID = 'H-01';

export function useHead() {
  const { store } = useApp();
  const head = store.state.heads.find((h) => h.id === HEAD_ID) ?? store.state.heads[0];
  const events = store.state.events.filter((e) => e.headId === head.id);
  const participants = store.state.participants.filter((p) => events.some((e) => e.id === p.eventId));
  const fixtures = store.state.fixtures.filter((f) => events.some((e) => e.id === f.eventId));
  return { head, events, participants, fixtures };
}

export function HeadShell({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  const { store, openModal, notify } = useApp();
  const { pathname } = useLocation();
  const { head, events, participants, fixtures } = useHead();
  const pending = participants.filter((p) => p.idStatus === 'Pending').length;
  const sportsLabel = events.map((e) => e.title).join(' · ') || 'No sport assigned';

  const exportDesk = () => {
    const rows = [['Participant', 'Dept', 'Event', 'Team', 'ID status', 'Payment'], ...participants.map((p) => [p.name, p.dept, events.find((e) => e.id === p.eventId)?.title ?? '', p.team, p.idStatus, p.payment])];
    const blob = new Blob([rows.map((r) => r.join(',')).join('\n')], { type: 'text/csv' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${head.name.replace(/\s+/g, '-').toLowerCase()}-desk.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
    notify(`Desk export downloaded · ${participants.length} participant rows.`);
  };

  const requestAction = () => openModal({ title: 'Request a change from the Sports Office', sub: 'Anything outside your remit is logged here.', body: <HeadRequestForm /> });

  return <div className="workspace">
    <aside className="shell-aside head-aside">
      <Link to="/head" className="wordmark"><span className="crest">M</span><span>MIT-ADT<small>SPORTS OFFICE</small></span></Link>
      <div className="aside-identity"><span className="overline">SPORT HEAD DESK</span><b>{head.name}</b><small>{sportsLabel}</small></div>
      <nav className="shell-nav" aria-label="Sport head navigation">{nav.map((item) => <Link key={item.to} to={item.to} className={`shell-link ${pathname === item.to ? 'current' : ''}`} aria-current={pathname === item.to ? 'page' : undefined}><span><b>{item.label}{item.to === '/head/participants' && pending > 0 && <em className="nav-count warn">{pending}</em>}</b><small>{item.hint}</small></span><i>{pathname === item.to ? '→' : ''}</i></Link>)}</nav>
      <div className="aside-foot">
        <div className="scope-note"><span className="overline">YOUR REMIT</span><p>Entries, ID checks, fixtures and match results for <b>{sportsLabel}</b>. Fees, new events and schedule overrides sit with the Sports Office.</p></div>
        <button className="text-button" onClick={requestAction}>Request admin action</button>
        <button className="text-button" onClick={exportDesk}>Download desk CSV</button>
        <p className="aside-legal">{participants.length} participants · {fixtures.length} fixtures · {store.state.events.filter((e) => e.headId === head.id && e.status === 'Open').length} open events</p>
        <Link className="text-button" to="/login">Sign out</Link>
      </div>
    </aside>
    <main className="shell-main">
      <header className="shell-top"><span>SPORT HEAD DESK <i>/</i> <b>{sportsLabel.toUpperCase()}</b></span><span className="shell-top-right"><span className="live-dot amber-dot" /> {pending > 0 ? `${pending} ID CHECK${pending === 1 ? '' : 'S'} PENDING` : 'ALL IDS CLEAR'}</span></header>
      <section className="shell-body">
        <div className="page-head"><div><span className="page-kicker">SPORT HEAD DESK · 2025—26</span><h1>{title}</h1><p>{subtitle}</p></div><div className="head-actions"><span className="role-note"><b>{head.name}</b><small>{head.email}</small></span></div></div>
        {children}
        <footer className="shell-footer"><span>MIT-ADT SPORTS OFFICE · PUNE</span><a href="mailto:sports.office@mitwpu.edu.in">Escalate to Sports Office</a></footer>
      </section>
    </main>
  </div>;
}

function HeadRequestForm() {
  const { notify, closeModal } = useApp();
  const [type, setType] = useState('Schedule override');
  const [detail, setDetail] = useState('');
  const [error, setError] = useState('');
  return <form className="stack" onSubmit={(e: FormEvent) => {
    e.preventDefault();
    const clean = asString(detail, 400).trim();
    if (clean.length < 10) { setError('Add a short reason (at least 10 characters) so the Sports Office can act on it.'); return; }
    notify(`${type} request sent to the Sports Office.`);
    closeModal();
  }}>
    <Field label="REQUEST TYPE"><Select value={type} onChange={setType} label="Request type" options={['Schedule override', 'Fee or refund change', 'Add participant after deadline', 'New event', 'Eligibility exception'].map((v) => ({ value: v, label: v }))} /></Field>
    <Field label="DETAILS" required><textarea rows={3} value={detail} onChange={(e) => { setDetail(e.target.value); setError(''); }} placeholder="What needs to change, and why?" maxLength={400} required /></Field>
    {error && <p className="form-error">{error}</p>}
    <p className="quiet tiny">The Sports Office reviews requests in their console. You keep working while it is pending.</p>
    <div className="modal-actions"><button type="button" className="button ghost" onClick={closeModal}>Cancel</button><button className="button primary" type="submit">Send request</button></div>
  </form>;
}

export function HeadOverview() {
  const { openModal } = useApp();
  const { events, participants, fixtures } = useHead();
  const pending = participants.filter((p) => p.idStatus === 'Pending');
  const next = fixtures.find((f) => f.state === 'Upcoming') ?? fixtures[0];
  const verified = participants.filter((p) => p.idStatus === 'Verified').length;
  const unpaid = participants.filter((p) => p.payment === 'Pending').length;
  const openEvents = events.filter((e) => e.status === 'Open');

  return <HeadShell title="Today at your desk" subtitle="Verify before the fixture locks, then run the match.">
    <div className="stat-row">
      <div className="stat-card"><span className="overline">REGISTERED PLAYERS</span><b>{participants.length}</b><small>{events.reduce((s, e) => s + e.registered, 0)} places filled</small></div>
      <div className={`stat-card ${pending.length ? 'accent-amber' : ''}`}><span className="overline">ID CHECKS PENDING</span><b>{pending.length}</b><small>{pending.length ? 'Blocks fixture lock' : 'All clear'}</small></div>
      <div className="stat-card"><span className="overline">FIXTURES</span><b>{String(fixtures.length).padStart(2, '0')}</b><small>{next ? `Next: ${next.time}` : 'None scheduled'}</small></div>
      <div className="stat-card"><span className="overline">READY TO PLAY</span><b>{verified}<em>/{participants.length}</em></b><small>{unpaid} fee{unpaid === 1 ? '' : 's'} outstanding</small></div>
    </div>

    <div className="split-grid">
      <section className="panel">
        <div className="panel-label"><span className="overline">ACTION REQUIRED</span><Link className="text-button" to="/head/participants">Open list →</Link></div>
        <h2 className="panel-h2">ID verification queue</h2>
        {pending.length === 0 ? <p className="quiet">No pending checks. Everyone in your sport is verified.</p> : <ul className="queue-list">{pending.slice(0, 4).map((p) => <li key={p.id}><div><b>{p.name}</b><small>{p.campusId ?? p.id} · {p.dept} · {p.team}</small></div><button className="button sm primary" onClick={() => openModal({ title: `Verify ${p.name}`, sub: `${p.dept} · ${p.team} · ${events.find((e) => e.id === p.eventId)?.title}`, body: <VerifyBody participantId={p.id} /> })}>Review ID</button></li>)}</ul>}
        <p className="quiet tiny">Check the campus ID against the current MIT-ADT roll. Fee disputes and eligibility exceptions are not yours to settle.</p>
      </section>
      <section className="panel">
        <div className="panel-label"><span className="overline">NEXT ON YOUR LIST</span><span className={`match-tag ${next?.state === 'Live' ? 'is-live' : ''}`}>{next?.state.toUpperCase() ?? 'NONE'}</span></div>
        <h2 className="panel-h2">{next ? `${next.teamA} vs ${next.teamB}` : 'No fixture scheduled'}<small>{next?.round ?? 'Schedule one from the fixtures page'}</small></h2>
        <div className="keyfacts"><div><span>WHEN</span><b>{next?.time ?? '—'}</b></div><div><span>VENUE</span><b>{next?.venue ?? '—'}</b></div><div><span>STATUS</span><b>{next?.state ?? '—'}</b></div></div>
        <div className="panel-actions"><Link className="button primary" to="/head/fixtures">Open match centre</Link>{next && <button className="button ghost" onClick={() => openModal({ title: 'Send run-sheet to captains', sub: `${next.teamA} vs ${next.teamB} · ${next.time}`, body: <RunSheet fixtureId={next.id} /> })}>Send run-sheet</button>}</div>
      </section>
    </div>

    <div className="split-grid">
      <section className="panel">
        <div className="panel-label"><span className="overline">YOUR EVENTS</span><span className="quiet tiny">Entries open</span></div>
        <h2 className="panel-h2">Registration progress</h2>
        <div className="entry-progress">{openEvents.map((e) => <div key={e.id}><div className="entry-progress-top"><b>{e.title}</b><span className="mono-cell">{e.registered}/{e.capacity}</span></div><CapacityBar used={e.registered} total={e.capacity} /><small className="quiet">{formatDate(e.date)} · {e.slot} · {e.venue}</small></div>)}{openEvents.length === 0 && <p className="quiet">No open events right now.</p>}</div>
        <Link className="text-button" to="/head/participants">Manage squad lists →</Link>
      </section>
      <section className="panel">
        <div className="panel-label"><span className="overline">CHECKLIST</span><span className="quiet tiny">Per fixture</span></div>
        <h2 className="panel-h2">Before the first ball</h2>
        <ol className="checklist compact">
          <li><span className={`check-index ${pending.length === 0 ? 'done' : ''}`}>{pending.length === 0 ? '✓' : '01'}</span><div><b>Squad IDs verified</b><p>{pending.length ? `${pending.length} still need a check.` : 'Every player is cleared.'}</p></div></li>
          <li><span className={`check-index ${next ? 'done' : ''}`}>{next ? '✓' : '02'}</span><div><b>Fixture published</b><p>Visible to students on the results board.</p></div></li>
          <li><span className="check-index">03</span><div><b>Result submitted</b><p>Post the final score; the office confirms GC points.</p></div></li>
        </ol>
      </section>
    </div>
  </HeadShell>;
}

function VerifyBody({ participantId }: { participantId: string }) {
  const { store, notify, closeModal } = useApp();
  const participant = store.state.participants.find((p) => p.id === participantId);
  const [status, setStatus] = useState<Participant['idStatus']>(participant?.idStatus ?? 'Pending');
  const [note, setNote] = useState('');
  if (!participant) return <p className="quiet">This participant is no longer in your squad.</p>;
  const event = store.state.events.find((e) => e.id === participant.eventId);
  const save = () => {
    store.actions.verifyParticipant(participant.id, status);
    notify(`${participant.name} marked ${status.toLowerCase()}.${note ? ' Note saved for the Sports Office.' : ''}`, status === 'Rejected' ? 'warn' : 'ok');
    closeModal();
  };
  return <div className="stack">
    <dl className="entry-details"><div><dt>NAME</dt><dd>{participant.name}</dd></div><div><dt>CAMPUS ID</dt><dd className="mono-cell">{participant.campusId ?? 'Not provided'}</dd></div><div><dt>DEPARTMENT</dt><dd>{participant.dept} · {participant.year}</dd></div><div><dt>EVENT</dt><dd>{event?.title}</dd></div><div><dt>TEAM</dt><dd>{participant.team}</dd></div><div><dt>PARTNER</dt><dd>{participant.partner ?? '—'}</dd></div></dl>
    <div className={`verify-strip ${participant.role === 'walk-in' ? 'warn' : ''}`}><span>{participant.role === 'walk-in' ? 'WALK-IN ENTRY' : 'CAMPUS REGISTRATION'}</span><b>{participant.role === 'walk-in' ? 'Check the physical ID card closely' : `Registered ${participant.enrolledAt ?? 'today'}`}</b></div>
    <Field label="VERIFICATION DECISION"><div className="segmented">{(['Verified', 'Pending', 'Rejected'] as const).map((s) => <button key={s} type="button" className={status === s ? 'active' : ''} onClick={() => setStatus(s)}>{s}</button>)}</div></Field>
    {status === 'Rejected' && <Field label="REASON FOR REJECTION" required><input value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. ID not on current roll" /></Field>}
    <p className="quiet tiny">{status === 'Verified' ? 'You are confirming the student’s identity, not their payment.' : status === 'Rejected' ? 'Rejection removes the player from the squad and notifies the Sports Office.' : 'Pending keeps the player in the queue for a later check.'}</p>
    <div className="modal-actions"><button className="button ghost" onClick={closeModal}>Cancel</button><button className="button primary" onClick={save} disabled={status === 'Rejected' && !note.trim()}>Save decision</button></div>
  </div>;
}

function RunSheet({ fixtureId }: { fixtureId: string }) {
  const { store, notify, closeModal } = useApp();
  const fixture = store.state.fixtures.find((f) => f.id === fixtureId);
  if (!fixture) return null;
  return <div className="stack">
    <dl className="entry-details"><div><dt>FIXTURE</dt><dd>{fixture.teamA} vs {fixture.teamB}</dd></div><div><dt>ROUND</dt><dd>{fixture.round}</dd></div><div><dt>VENUE</dt><dd>{fixture.venue}</dd></div><div><dt>SLOT</dt><dd>{fixture.time}</dd></div></dl>
    <div className="modal-actions"><button className="button ghost" onClick={closeModal}>Cancel</button><button className="button primary" onClick={() => { notify(`Run-sheet sent to ${fixture.teamA} and ${fixture.teamB} captains.`); closeModal(); }}>Send to both captains</button></div>
  </div>;
}

export function HeadParticipants() {
  const { notify, openModal } = useApp();
  const { events, participants } = useHead();
  const [filter, setFilter] = useState<'All' | Participant['idStatus']>('All');
  const [dept, setDept] = useState('All');
  const [query, setQuery] = useState('');
  const rows = participants
    .filter((p) => filter === 'All' || p.idStatus === filter)
    .filter((p) => dept === 'All' || p.dept === dept)
    .filter((p) => `${p.name} ${p.campusId ?? ''}`.toLowerCase().includes(query.toLowerCase()));
  const count = (status?: Participant['idStatus']) => status ? participants.filter((p) => p.idStatus === status).length : participants.length;

  const exportCsv = () => {
    const data = [['Participant', 'Campus ID', 'Dept', 'Event', 'Team', 'ID status', 'Payment'], ...rows.map((p) => [p.name, p.campusId ?? '', p.dept, events.find((e) => e.id === p.eventId)?.title ?? '', p.team, p.idStatus, p.payment])];
    const blob = new Blob([data.map((r) => r.join(',')).join('\n')], { type: 'text/csv' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob); link.download = 'box-cricket-participants.csv'; link.click(); URL.revokeObjectURL(link.href);
    notify(`${rows.length} participant rows exported.`);
  };

  const verifiedCount = participants.filter((p) => p.idStatus === 'Verified').length;
  const pendingCount = participants.filter((p) => p.idStatus === 'Pending').length;
  const unpaidCount = participants.filter((p) => p.payment === 'Pending').length;
  return <HeadShell title="Participants" subtitle="Check campus IDs and keep the squad list accurate.">
    <div className="stat-row" style={{ marginBottom: 14 }}>
      <div className="stat-card"><span className="overline">IN YOUR SQUADS</span><b>{participants.length}</b><small>Across {events.length} assigned event{events.length === 1 ? '' : 's'}</small></div>
      <div className={`stat-card ${pendingCount ? 'accent-amber' : ''}`}><span className="overline">PENDING ID CHECKS</span><b>{pendingCount}</b><small>{pendingCount ? 'Review before fixture lock' : 'All identities cleared'}</small></div>
      <div className="stat-card"><span className="overline">VERIFIED</span><b>{verifiedCount}</b><small>Ready for match day</small></div>
      <div className="stat-card"><span className="overline">FEES OUTSTANDING</span><b>{unpaidCount}</b><small>Payment follow-up needed</small></div>
    </div>
    <div className="toolbar">
      <div className="segmented">{(['All', 'Pending', 'Verified', 'Rejected'] as const).map((f) => <button key={f} className={filter === f ? 'active' : ''} onClick={() => setFilter(f)}>{f}<span className="count">{count(f === 'All' ? undefined : f)}</span></button>)}</div>
      <div className="toolbar-right"><Select label="Department" value={dept} onChange={setDept} options={[{ value: 'All', label: 'All departments' }, ...DEPARTMENTS.map((d) => ({ value: d.code, label: d.code }))]} /><input className="search" placeholder="Search name or ID" value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Search participants" /><button className="button ghost" onClick={exportCsv}>Export CSV</button><button className="button primary" onClick={() => openModal({ title: 'Add a walk-in participant', sub: 'Only for approved walk-ins. Creates a pending ID check.', body: <AddParticipantForm /> })}>+ Add participant</button></div>
    </div>
    <div className="table-shell"><table className="data-table"><thead><tr><th>PARTICIPANT</th><th>DEPT</th><th>EVENT / TEAM</th><th>PAYMENT</th><th>ID STATUS</th><th>ACTION</th></tr></thead><tbody>{rows.map((p) => <tr key={p.id}><td><b>{p.name}</b><small className="cell-sub">{p.campusId ?? 'Walk-in · ID not on file'}</small></td><td><span className="team-cell"><span className={`monogram mono-${p.dept.toLowerCase()} mono-sm`}>{p.dept}</span></span></td><td>{events.find((e) => e.id === p.eventId)?.title}<small className="cell-sub">{p.team}</small></td><td>{p.payment === 'Paid' ? <StatusPill tone="green">PAID</StatusPill> : p.payment === 'Pending' ? <StatusPill tone="amber">UNPAID</StatusPill> : <span className="quiet">No fee</span>}</td><td><StatusPill tone={p.idStatus === 'Verified' ? 'green' : p.idStatus === 'Rejected' ? 'red' : 'amber'}>{p.idStatus.toUpperCase()}</StatusPill></td><td>{p.idStatus === 'Verified' ? <button className="text-button" onClick={() => openModal({ title: p.name, sub: 'Participant record', body: <VerifyBody participantId={p.id} /> })}>Edit</button> : <button className="button sm primary" onClick={() => openModal({ title: `Verify ${p.name}`, sub: `${p.dept} · ${p.team}`, body: <VerifyBody participantId={p.id} /> })}>Verify ID</button>}</td></tr>)}{rows.length === 0 && <tr><td colSpan={6} className="quiet pad">No participants match this filter.</td></tr>}</tbody></table></div>
    <div className="block"><div className="block-head"><div><span className="overline">SQUAD COVERAGE</span><h2>Players by department</h2></div><span className="quiet tiny">Across your open events</span></div>
      <div className="dept-bars">{DEPARTMENTS.map((d) => { const n = participants.filter((p) => p.dept === d.code).length; return <div key={d.code}><span className="dept-label"><span className={`monogram mono-${d.code.toLowerCase()} mono-sm`}>{d.code}</span>{d.code}</span><span className="dept-track"><i style={{ width: `${Math.min(100, n * 14)}%` }} /></span><b>{n}</b></div>; })}</div>
    </div>
  </HeadShell>;
}

function AddParticipantForm() {
  const { store, notify, closeModal } = useApp();
  const { events } = useHead();
  const [eventId, setEventId] = useState(events[0]?.id ?? '');
  const [dept, setDept] = useState<Dept>('COMP');
  const [team, setTeam] = useState('');
  const [error, setError] = useState('');
  const selected = events.find((e) => e.id === eventId);
  const full = !!selected && selected.registered >= selected.capacity;
  return <form className="stack" onSubmit={(e: FormEvent) => {
    e.preventDefault();
    if (!selected) { setError('Select an event.'); return; }
    if (full) { setError(`${selected.title} is already full.`); return; }
    const safeTeam = cleanTeam(team, dept);
    const name = store.actions.addParticipant(eventId, dept, safeTeam);
    if (!name) { setError('Could not add this participant. The event may be full or unavailable.'); return; }
    notify(`${name} added as a walk-in · ID check pending.`);
    closeModal();
  }}>
    <Field label="EVENT"><Select label="Event" value={eventId} onChange={(v) => { setEventId(v); setError(''); }} options={events.map((e) => ({ value: e.id, label: `${e.title} · ${e.registered}/${e.capacity}` }))} /></Field>
    <Field label="DEPARTMENT"><Select label="Department" value={dept} onChange={(v) => { setDept(v as Dept); setError(''); }} options={DEPARTMENTS.map((d) => ({ value: d.code, label: `${d.code} · ${d.name}` }))} /></Field>
    <Field label="TEAM NAME" hint="Blank uses the department code"><input value={team} onChange={(e) => { setTeam(e.target.value); setError(''); }} placeholder="e.g. COMP A" maxLength={40} /></Field>
    {full && <p className="form-error">{selected?.title} is at capacity. Ask the Sports Office to raise the cap if needed.</p>}
    {error && <p className="form-error">{error}</p>}
    <p className="quiet tiny">Walk-ins are flagged for a closer physical ID check and are visible to the Sports Office.</p>
    <div className="modal-actions"><button type="button" className="button ghost" onClick={closeModal}>Cancel</button><button type="submit" className="button primary" disabled={!events.length || full}>Add to squad</button></div>
  </form>;
}

export function HeadFixtures() {
  const { openModal } = useApp();
  const { events, fixtures } = useHead();
  const [requested, setRequested] = useState('');
  const selected = fixtures.find((f) => f.id === requested) ?? fixtures[0];

  const schedule = () => openModal({ title: 'Schedule a fixture', sub: 'New fixtures publish to students immediately.', body: <NewFixtureForm /> });
  const scoreboard = (id: string) => openModal({ title: 'Update match centre', sub: 'Score and state publish straight to the student board.', body: <ScoreForm fixtureId={id} /> });

  const liveCount = fixtures.filter((f) => f.state === 'Live').length;
  const upcomingCount = fixtures.filter((f) => f.state === 'Upcoming').length;
  const finalCount = fixtures.filter((f) => f.state === 'Final').length;
  return <HeadShell title="Fixtures" subtitle="Run the schedule and post results. The office confirms GC points.">
    <div className="stat-row" style={{ marginBottom: 14 }}>
      <div className="stat-card"><span className="overline">TOTAL FIXTURES</span><b>{fixtures.length}</b><small>Published for your events</small></div>
      <div className="stat-card accent-amber"><span className="overline">UPCOMING</span><b>{upcomingCount}</b><small>Ready for run-sheets</small></div>
      <div className="stat-card"><span className="overline">LIVE NOW</span><b>{liveCount}</b><small>{liveCount ? 'Score updates in progress' : 'No live matches'}</small></div>
      <div className="stat-card"><span className="overline">COMPLETED</span><b>{finalCount}</b><small>Awaiting GC confirmation where applicable</small></div>
    </div>
    <div className="toolbar"><div className="chip-row">{fixtures.map((f) => <button key={f.id} className={`chip ${selected?.id === f.id ? 'active' : ''}`} onClick={() => setRequested(f.id)}>{f.teamA} vs {f.teamB}<small>{f.time.split(' · ')[1] ?? f.time}</small></button>)}{fixtures.length === 0 && <span className="quiet">No fixtures yet.</span>}</div><button className="button primary" onClick={schedule}>+ Schedule fixture</button></div>
    {selected && <section className="match-centre">
      <div className="match-centre-top"><div><span className="overline">{selected.round} · {selected.venue}</span><h2>{events.find((e) => e.id === selected.eventId)?.title}</h2><p className="quiet">{selected.time}</p></div><span className={`match-tag ${selected.state === 'Live' ? 'is-live' : ''}`}>{selected.state.toUpperCase()}</span></div>
      <div className="scoreboard"><div className="score-side"><span className={`monogram mono-${selected.teamA.toLowerCase()}`}>{selected.teamA}</span><b>{selected.teamA}</b><strong>{selected.scoreA}</strong></div><span className="scoreboard-sep">—</span><div className="score-side right"><strong>{selected.scoreB}</strong><b>{selected.teamB}</b><span className={`monogram mono-${selected.teamB.toLowerCase()}`}>{selected.teamB}</span></div></div>
      <div className="match-centre-actions"><button className="button primary" onClick={() => scoreboard(selected.id)}>Update score &amp; state</button><button className="button ghost" onClick={() => openModal({ title: 'Send run-sheet', sub: `${selected.teamA} vs ${selected.teamB}`, body: <RunSheet fixtureId={selected.id} /> })}>Send run-sheet</button><button className="button ghost" onClick={() => openModal({ title: 'Request a schedule change', sub: 'Published slots need Sports Office approval.', body: <HeadRequestForm /> })}>Request reschedule</button></div>
    </section>}
    <div className="table-shell"><table className="data-table"><thead><tr><th>FIXTURE</th><th>EVENT</th><th>TIME</th><th>VENUE</th><th>SCORE</th><th>STATE</th><th /></tr></thead><tbody>{fixtures.map((f) => <tr key={f.id}><td><b>{f.teamA} vs {f.teamB}</b><small className="cell-sub">{f.round}</small></td><td>{events.find((e) => e.id === f.eventId)?.title}</td><td>{f.time}</td><td>{f.venue}</td><td className="mono-cell">{f.scoreA} — {f.scoreB}</td><td><StatusPill tone={f.state === 'Live' ? 'green' : f.state === 'Final' ? 'quiet' : 'amber'}>{f.state.toUpperCase()}</StatusPill></td><td><button className="text-button" onClick={() => scoreboard(f.id)}>Manage</button></td></tr>)}{fixtures.length === 0 && <tr><td colSpan={7} className="quiet pad">No fixtures scheduled. Use “Schedule fixture” to publish the first round.</td></tr>}</tbody></table></div>
    <div className="block"><div className="block-head"><div><span className="overline">RESULTS AWAITING CONFIRMATION</span><h2>Submitted to the Sports Office</h2></div></div><ul className="plain-list">{fixtures.filter((f) => f.state === 'Final').map((f) => <li key={f.id}><div><b>{f.teamA} {f.scoreA} — {f.scoreB} {f.teamB}</b><small>{f.round} · {f.time}</small></div><StatusPill tone="amber">GC POINTS PENDING</StatusPill></li>)}{fixtures.filter((f) => f.state === 'Final').length === 0 && <li className="quiet">No completed fixtures awaiting confirmation.</li>}</ul></div>
  </HeadShell>;
}

function ScoreForm({ fixtureId }: { fixtureId: string }) {
  const { store, notify, closeModal } = useApp();
  const fixture = store.state.fixtures.find((f) => f.id === fixtureId);
  const [scoreA, setScoreA] = useState(fixture?.scoreA === '—' ? '' : fixture?.scoreA ?? '');
  const [scoreB, setScoreB] = useState(fixture?.scoreB === '—' ? '' : fixture?.scoreB ?? '');
  const [state, setState] = useState<MatchState>(fixture?.state ?? 'Upcoming');
  const [error, setError] = useState('');
  if (!fixture) return null;
  return <form className="stack" onSubmit={(e: FormEvent) => {
    e.preventDefault();
    const a = asString(scoreA, 20).trim();
    const b = asString(scoreB, 20).trim();
    if (state === 'Final' && (!a || !b)) { setError('Enter both scores before marking the fixture final.'); return; }
    if (state === 'Live' && (!a || !b)) { setError('Enter both scores for a live fixture.'); return; }
    store.actions.updateFixture(fixture.id, { scoreA: a || '—', scoreB: b || '—', state });
    notify(`Match centre updated · ${fixture.teamA} ${a || '—'} — ${b || '—'} ${fixture.teamB} · ${state}.`);
    closeModal();
  }}>
    <div className="score-inputs"><Field label={fixture.teamA}><input value={scoreA} onChange={(e) => { setScoreA(e.target.value); setError(''); }} placeholder="42/3" maxLength={20} /></Field><span className="score-dash">—</span><Field label={fixture.teamB}><input value={scoreB} onChange={(e) => { setScoreB(e.target.value); setError(''); }} placeholder="38/5" maxLength={20} /></Field></div>
    <Field label="MATCH STATE"><Select label="Match state" value={state} onChange={(v) => { setState(v as MatchState); setError(''); }} options={['Upcoming', 'Live', 'Innings break', 'Rain delay', 'Walkover', 'Final'].map((s) => ({ value: s, label: s }))} /></Field>
    {error && <p className="form-error">{error}</p>}
    {state === 'Final' && <p className="inline-note small">Saving as Final sends the result to the Sports Office for GC points confirmation.</p>}
    <div className="modal-actions"><button className="button ghost" type="button" onClick={closeModal}>Cancel</button><button className="button primary" type="submit">Publish update</button></div>
  </form>;
}

function NewFixtureForm() {
  const { store, notify, closeModal } = useApp();
  const { events, fixtures } = useHead();
  const [eventId, setEventId] = useState(events[0]?.id ?? '');
  const [teamA, setTeamA] = useState<Dept>('COMP');
  const [teamB, setTeamB] = useState<Dept>('ENTC');
  const [round, setRound] = useState(`Pool A · Match ${String(fixtures.length + 8).padStart(2, '0')}`);
  const [time, setTime] = useState('Feb 20 · 10:30 AM');
  const [venue, setVenue] = useState('Main Turf');
  const [error, setError] = useState('');
  const duplicate = teamA === teamB;
  return <form className="stack" onSubmit={(e: FormEvent) => {
    e.preventDefault();
    const r = asString(round, 60).trim();
    const t = asString(time, 60).trim();
    const v = asString(venue, 60).trim();
    if (!eventId) { setError('Select an event.'); return; }
    if (duplicate) { setError('Choose two different departments.'); return; }
    if (!r || !t || !v) { setError('Round, slot, and venue are required.'); return; }
    const id = store.actions.createFixture(eventId, r, teamA, teamB, t, v);
    if (!id) { setError('Could not publish this fixture. Check the event and details.'); return; }
    notify(`Fixture published · ${teamA} vs ${teamB} · ${t} · ${v}.`);
    closeModal();
  }}>
    <Field label="EVENT"><Select label="Event" value={eventId} onChange={(v) => { setEventId(v); setError(''); }} options={events.map((e) => ({ value: e.id, label: e.title }))} /></Field>
    <div className="modal-grid">
      <Field label="TEAM A"><Select label="Team A" value={teamA} onChange={(v) => { setTeamA(v as Dept); setError(''); }} options={DEPARTMENTS.map((d) => ({ value: d.code, label: d.code }))} /></Field>
      <Field label="TEAM B"><Select label="Team B" value={teamB} onChange={(v) => { setTeamB(v as Dept); setError(''); }} options={DEPARTMENTS.map((d) => ({ value: d.code, label: d.code }))} /></Field>
      <Field label="ROUND"><input value={round} onChange={(e) => { setRound(e.target.value); setError(''); }} maxLength={60} required /></Field>
      <Field label="SLOT"><input value={time} onChange={(e) => { setTime(e.target.value); setError(''); }} maxLength={60} required /></Field>
      <Field label="VENUE"><Select label="Venue" value={venue} onChange={(v) => { setVenue(v); setError(''); }} options={['Main Turf', 'Indoor Gymkhana', 'Basketball Court 1', 'Outdoor Arena'].map((v) => ({ value: v, label: v }))} /></Field>
    </div>
    {duplicate && <p className="form-error">Choose two different departments.</p>}
    {error && <p className="form-error">{error}</p>}
    <p className="quiet tiny">Publishing sends it to the student fixtures board. Both squads should already be verified.</p>
    <div className="modal-actions"><button className="button ghost" type="button" onClick={closeModal}>Cancel</button><button className="button primary" type="submit" disabled={duplicate || !events.length}>Publish fixture</button></div>
  </form>;
}

export type { SportsEvent };