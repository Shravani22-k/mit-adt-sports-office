import { FormEvent, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { DEPARTMENTS, Dept, SportsEvent } from '../data/sports';
import { useApp } from '../ui/AppContext';
import { CapacityBar, Field, Monogram, Select, StatusPill, formatDate } from '../ui/components';
import { asDate, cleanName, isEmail, normalizeEmail, parseIntIn, parseMoney, validateEventDraft } from '../ui/validate';

const nav = [
  { to: '/admin', label: 'Overview', hint: 'Decisions waiting' },
  { to: '/admin/events', label: 'Events', hint: 'Create and approve' },
  { to: '/admin/heads', label: 'Sport heads', hint: 'Assign and invite' },
  { to: '/admin/finance', label: 'Finance', hint: 'Collections and refunds' },
];

export function AdminShell({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  const { store, reset, notify } = useApp();
  const { pathname } = useLocation();
  return <div className="workspace">
    <aside className="shell-aside admin-aside">
      <Link to="/admin" className="wordmark"><span className="crest">M</span><span>MIT-ADT<small>SPORTS OFFICE</small></span></Link>
      <div className="aside-identity"><span className="overline">ADMIN CONSOLE</span><b>Sports Office</b><small>General Championship 2025—26</small></div>
      <nav className="shell-nav" aria-label="Admin navigation">{nav.map((item) => <Link key={item.to} to={item.to} className={`shell-link ${pathname === item.to ? 'current' : ''}`} aria-current={pathname === item.to ? 'page' : undefined}><span><b>{item.label}</b><small>{item.hint}</small></span><i>{pathname === item.to ? '→' : ''}</i></Link>)}</nav>
      <div className="aside-foot">
        <div className="scope-note"><span className="overline">FINAL AUTHORITY</span><p>Event approval, fee setting, head allocation and GC points rest here. Sport heads run the day-to-day of their own sport.</p></div>
        <button className="text-button" onClick={() => { reset(); notify('Demo data restored to the opening state.'); }}>Reset demo data</button>
        <Link className="text-button" to="/login">Sign out</Link>
        <p className="aside-legal">{store.state.events.length} events · {store.state.heads.length} heads · {store.state.participants.length} participants</p>
      </div>
    </aside>
    <main className="shell-main">
      <header className="shell-top"><span>ADMIN CONSOLE <i>/</i> <b>{title.toUpperCase()}</b></span><span className="shell-top-right"><span className="live-dot" /> GC 2025—26 ACTIVE</span></header>
      <section className="shell-body">
        <div className="page-head"><div><span className="page-kicker">ADMIN CONSOLE · 2025—26</span><h1>{title}</h1><p>{subtitle}</p></div><div className="head-actions"><span className="role-note"><b>Dr. Meera Joshi</b><small>Director of Sports · admin@mitwpu.edu.in</small></span></div></div>
        {children}
        <footer className="shell-footer"><span>MIT-ADT SPORTS OFFICE · PUNE</span><a href="mailto:sports.office@mitwpu.edu.in">sports.office@mitwpu.edu.in</a></footer>
      </section>
    </main>
  </div>;
}

export function AdminOverview() {
  const { store, openModal, notify } = useApp();
  const { events, heads, payments, participants } = store.state;
  const pending = events.filter((e) => e.approvals === 'Pending');
  const unassigned = events.filter((e) => !e.headId);
  const collected = payments.reduce((sum, p) => sum + p.amount, 0);
  const settle = events.filter((e) => e.status === 'Open').slice(0, 4);

  return <AdminShell title="Sports office overview" subtitle="The decisions only the office can make, and the numbers behind them.">
    <div className="stat-row">
      <div className="stat-card accent-amber"><span className="overline">AWAITING YOUR DECISION</span><b>{pending.length}</b><small>Events need approval</small></div>
      <div className="stat-card"><span className="overline">FEES COLLECTED</span><b>₹{collected.toLocaleString('en-IN')}</b><small>{payments.length} recorded payments</small></div>
      <div className="stat-card"><span className="overline">SPORTS WITH A HEAD</span><b>{events.filter((e) => e.headId).length}<em>/{events.length}</em></b><small>{unassigned.length} unassigned</small></div>
      <div className="stat-card"><span className="overline">VERIFICATION GAP</span><b>{participants.filter((p) => p.idStatus === 'Pending').length}</b><small>Players awaiting ID checks</small></div>
    </div>

    <div className="split-grid wide-left">
      <section className="panel">
        <div className="panel-label"><span className="overline">APPROVAL QUEUE</span><Link className="text-button" to="/admin/events">Manage events →</Link></div>
        <h2 className="panel-h2">Events waiting on the office</h2>
        {pending.length === 0 ? <p className="quiet">Nothing pending. Every submitted event has a decision.</p> : <ul className="approval-list">{pending.map((e) => <li key={e.id}><div className="approval-main"><div><span className="overline">{e.id} · {e.sport.toUpperCase()}</span><b>{e.title}</b><small>{formatDate(e.date)} · {e.slot} · {e.venue} · {e.fee ? `₹${e.fee} / ${e.feeUnit}` : 'no fee'}</small></div><div className="approval-side"><span>HEAD</span><b>{e.headName ?? 'Unassigned'}</b><button className="button sm primary" onClick={() => openModal({ title: `Decision · ${e.title}`, sub: 'Approval publishes the event and its fee to students.', body: <ApprovalForm eventId={e.id} /> })}>Review</button></div></div></li>)}</ul>}
      </section>
      <section className="panel">
        <div className="panel-label"><span className="overline">UNASSIGNED</span><Link className="text-button" to="/admin/heads">Assign →</Link></div>
        <h2 className="panel-h2">Sports without a head</h2>
        {unassigned.length === 0 ? <p className="quiet">Every event has an owner.</p> : <ul className="plain-list">{unassigned.map((e) => <li key={e.id}><div><b>{e.title}</b><small>{e.id} · {e.status}</small></div><button className="text-button" onClick={() => openModal({ title: `Assign a sport head · ${e.title}`, sub: 'Sport heads run entries, ID checks and fixtures for one sport.', body: <AssignForm eventId={e.id} /> })}>Assign</button></li>)}</ul>}
        <div className="hairline" />
        <div className="panel-label"><span className="overline">SPORT HEADS</span><span className="quiet tiny">{heads.filter((h) => h.status === 'Active').length} active · {heads.filter((h) => h.status === 'Invited').length} invited</span></div>
        <ul className="plain-list">{heads.map((h) => <li key={h.id}><div><b>{h.name}</b><small>{h.sports.join(' · ') || 'No sport yet'}</small></div><StatusPill tone={h.status === 'Active' ? 'green' : 'amber'}>{h.status.toUpperCase()}</StatusPill></li>)}</ul>
      </section>
    </div>

    <section className="panel flush">
      <div className="panel-label pad"><span className="overline">ENTRY MOVEMENT · THIS WEEK</span><button className="text-button" onClick={() => notify('Entry report downloaded as CSV.')}>Download CSV</button></div>
      <div className="table-shell bare"><table className="data-table"><thead><tr><th>EVENT</th><th>HEAD</th><th>ENTRIES</th><th>FILL</th><th>FEE</th><th>APPROVAL</th><th /></tr></thead><tbody>{settle.map((e) => <tr key={e.id}><td><b>{e.title}</b><small className="cell-sub">{formatDate(e.date)} · {e.slot}</small></td><td>{e.headName ?? <em className="warn-text">Unassigned</em>}</td><td className="mono-cell">{e.registered}/{e.capacity}</td><td><CapacityBar used={e.registered} total={e.capacity} /></td><td className="mono-cell">{e.fee ? `₹${e.fee}` : 'Free'}</td><td><StatusPill tone={e.approvals === 'Approved' ? 'green' : e.approvals === 'Pending' ? 'amber' : 'red'}>{e.approvals.toUpperCase()}</StatusPill></td><td><button className="text-button" onClick={() => openModal({ title: e.title, sub: `${e.id} · ${e.venue}`, body: <EventAdminBody eventId={e.id} /> })}>Details</button></td></tr>)}</tbody></table></div>
    </section>
  </AdminShell>;
}

function EventAdminBody({ eventId }: { eventId: string }) {
  const { store, notify, closeModal, openModal } = useApp();
  const event = store.state.events.find((e) => e.id === eventId);
  if (!event) return <p className="quiet">This event is no longer available.</p>;
  const approved = event.approvals === 'Approved';
  return <div className="stack">
    <dl className="entry-details"><div><dt>APPROVAL</dt><dd>{event.approvals}</dd></div><div><dt>REGISTRATION</dt><dd>{event.status}</dd></div><div><dt>HEAD</dt><dd>{event.headName ?? 'Unassigned'}</dd></div><div><dt>ENTRIES</dt><dd>{event.registered}/{event.capacity}</dd></div><div><dt>FEE</dt><dd>{event.fee ? `₹${event.fee} per ${event.feeUnit}` : 'No fee'}</dd></div><div><dt>NOTE</dt><dd>{event.note ?? '—'}</dd></div></dl>
    <div className="modal-actions"><button className="button ghost" onClick={closeModal}>Close</button>{approved ? <button className="button primary" onClick={() => { store.actions.saveEvent(event.id, { status: event.status === 'Open' ? 'Closed' : 'Open' }); notify(`${event.title} registrations ${event.status === 'Open' ? 'closed' : 'reopened'}.`); closeModal(); }}>{event.status === 'Open' ? 'Close registrations' : 'Reopen registrations'}</button> : <button className="button primary" onClick={() => openModal({ title: `Decision · ${event.title}`, sub: 'Approve or reject this submission.', body: <ApprovalForm eventId={event.id} /> })}>Review submission</button>}</div>
  </div>;
}

function ApprovalForm({ eventId }: { eventId: string }) {
  const { store, notify, closeModal } = useApp();
  const event = store.state.events.find((e) => e.id === eventId);
  const [decision, setDecision] = useState<'Approved' | 'Rejected'>('Approved');
  const [headId, setHeadId] = useState(event?.headId ?? '');
  const [fee, setFee] = useState(String(event?.fee ?? 0));
  const [error, setError] = useState('');
  if (!event) return null;
  const activeHead = store.state.heads.some((h) => h.id === headId && h.status === 'Active');
  return <form className="stack" onSubmit={(e: FormEvent) => {
    e.preventDefault();
    const parsedFee = parseMoney(fee, 50000);
    if (Number.isNaN(parsedFee)) { setError('Enter a valid entry fee (₹0–₹50,000).'); return; }
    if (decision === 'Approved' && !activeHead) { setError('Assign an active sport head before approving this event.'); return; }
    setError('');
    store.actions.saveEvent(event.id, { fee: parsedFee });
    store.actions.decideEvent(event.id, decision, headId || null);
    notify(decision === 'Approved' ? `${event.title} approved. Fee set to ${parsedFee ? `₹${parsedFee}` : 'free'} and published to students.` : `${event.title} rejected; head has been notified.`);
    closeModal();
  }}>
    <dl className="entry-details"><div><dt>SUBMITTED</dt><dd>{formatDate(event.date)} · {event.slot}</dd></div><div><dt>VENUE</dt><dd>{event.venue}</dd></div><div><dt>PROPOSED FEE</dt><dd>{event.fee ? `₹${event.fee} per ${event.feeUnit}` : 'No fee'}</dd></div></dl>
    <p className="quiet">{event.note ?? 'No submission note.'}</p>
    <div className="modal-grid">
      <Field label="DECISION"><div className="segmented">{(['Approved', 'Rejected'] as const).map((d) => <button type="button" key={d} className={decision === d ? 'active' : ''} onClick={() => { setDecision(d); setError(''); }}>{d}</button>)}</div></Field>
      <Field label="ENTRY FEE" hint="₹0 makes the event free"><input type="number" min={0} max={50000} step="1" value={fee} onChange={(e) => { setFee(e.target.value); setError(''); }} /></Field>
      <Field label="SPORT HEAD" hint="Required to run the event"><Select label="Sport head" value={headId} onChange={(v) => { setHeadId(v); setError(''); }} options={[{ value: '', label: 'Select a head' }, ...store.state.heads.filter((h) => h.status === 'Active').map((h) => ({ value: h.id, label: `${h.name} · ${h.sports.join(', ') || 'Available'}` }))]} /></Field>
    </div>
    {(decision === 'Approved' && !activeHead) && <p className="form-error">Assign an active sport head before approving this event.</p>}
    {error && <p className="form-error">{error}</p>}
    <div className="modal-actions"><button type="button" className="button ghost" onClick={closeModal}>Cancel</button><button type="submit" className="button primary">Record decision</button></div>
  </form>;
}

export function AdminEvents() {
  const { store, openModal } = useApp();
  const [tab, setTab] = useState<'Live' | 'Pending' | 'Drafts'>('Live');
  const all = store.state.events;
  const groups = { Live: all.filter((e) => e.approvals === 'Approved'), Pending: all.filter((e) => e.approvals === 'Pending'), Drafts: all.filter((e) => e.approvals === 'Rejected') };
  const list = groups[tab];

  const create = () => openModal({ title: 'Create an event', sub: 'New events wait for a director to approve them before students see them.', body: <NewEventForm /> });

  return <AdminShell title="Events & approvals" subtitle="Publish sports, set fees, and control what students can register for.">
    <section className="panel" style={{ marginBottom: 14, background: 'linear-gradient(120deg, var(--surface), color-mix(in srgb, var(--theme-accent-soft) 55%, var(--surface)))' }}>
      <div className="panel-label"><span className="overline">EVENT CONTROL ROOM</span><span className="quiet tiny">Office decisions that shape the season</span></div>
      <div className="stat-row" style={{ marginTop: 10 }}>
        <div className="stat-card"><span className="overline">LIVE EVENTS</span><b>{groups.Live.length}</b><small>Visible to students now</small></div>
        <div className="stat-card accent-amber"><span className="overline">PENDING APPROVAL</span><b>{groups.Pending.length}</b><small>Need a director decision</small></div>
        <div className="stat-card"><span className="overline">TOTAL CAPACITY</span><b>{all.reduce((s, e) => s + e.capacity, 0)}</b><small>{all.reduce((s, e) => s + e.registered, 0)} places already filled</small></div>
        <div className="stat-card"><span className="overline">UNASSIGNED</span><b>{all.filter((e) => !e.headId).length}</b><small>Sports without an owner</small></div>
      </div>
    </section>
    <div className="toolbar">
      <div className="segmented">{(Object.keys(groups) as (keyof typeof groups)[]).map((g) => <button key={g} className={tab === g ? 'active' : ''} onClick={() => setTab(g)}>{g}<span className="count">{groups[g].length}</span></button>)}</div>
      <div className="toolbar-right"><button className="button ghost" onClick={() => setTab('Pending')}>Review queue</button><button className="button primary" onClick={create}>+ Create event</button></div>
    </div>
    <div className="event-table">
      <div className="event-row event-row-head"><span>DATE</span><span>EVENT</span><span>FEE</span><span>ENTRIES</span><span>SPORT HEAD</span><span>APPROVAL</span><span /></div>
      {list.map((e) => <div className="event-row" key={e.id}>
        <span className="date-cell"><b>{formatDate(e.date)}</b><small>{e.slot}</small></span>
        <span className="event-name-cell"><b>{e.title}</b><small>{e.format} · {e.venue}</small></span>
        <span className="fee-cell">{e.fee ? <><b>₹{e.fee}</b><small>per {e.feeUnit}</small></> : <><b className="free">Free</b><small>no payment</small></>}</span>
        <span><CapacityBar used={e.registered} total={e.capacity} /></span>
        <span className="head-cell">{e.headName ?? <em className="warn-text">Unassigned</em>}</span>
        <span><StatusPill tone={e.approvals === 'Approved' ? 'green' : e.approvals === 'Pending' ? 'amber' : 'red'}>{e.approvals.toUpperCase()}</StatusPill><small className="cell-sub">{e.status}</small></span>
        <span className="row-actions">{e.approvals === 'Pending' ? <><button className="button ghost sm" onClick={() => openModal({ title: e.title, sub: `${e.id} · ${e.format}`, body: <EventAdminBody eventId={e.id} /> })}>Details</button><button className="button primary sm" onClick={() => openModal({ title: `Decision · ${e.title}`, sub: 'Approval publishes the event and its fee to students.', body: <ApprovalForm eventId={e.id} /> })}>Review</button></> : <button className="button ghost sm" onClick={() => openModal({ title: e.title, sub: `${e.id} · ${e.format}`, body: <EventAdminBody eventId={e.id} /> })}>Manage</button>}</span>
      </div>)}
      {list.length === 0 && <p className="quiet pad">Nothing in this section.</p>}
    </div>
    <div className="block">
      <div className="block-head"><div><span className="overline">APPROVAL LOOP</span><h2>What happens after you approve</h2></div></div>
      <ol className="checklist">
        <li><span className="check-index done">01</span><div><b>The event appears in student registration</b><p>Approved events open immediately with their fee, format, venue and assigned head.</p></div></li>
        <li><span className="check-index">02</span><div><b>The sport head takes over operations</b><p>They verify IDs, manage the squad list, schedule fixtures and post results.</p></div></li>
        <li><span className="check-index">03</span><div><b>Fees flow into the office ledger</b><p>Paid entries are counted in Finance, and refunds stay with the office.</p></div></li>
      </ol>
    </div>
  </AdminShell>;
}

function NewEventForm() {
  const { store, notify, closeModal } = useApp();
  const [form, setForm] = useState({ title: '', sport: '', format: '', venue: 'Main Turf', date: '2025-03-08', slot: '9:00 AM', fee: '0', feeUnit: 'team' as SportsEvent['feeUnit'], teamSize: '6', capacity: '24', headId: '', note: '' });
  const [error, setError] = useState('');
  const set = (k: keyof typeof form) => (value: string) => { setForm({ ...form, [k]: value }); setError(''); };
  return <form className="stack" onSubmit={(e: FormEvent) => {
    e.preventDefault();
    const head = store.state.heads.find((h) => h.id === form.headId && h.status === 'Active');
    const draft = {
      title: cleanName(form.title, 80),
      sport: cleanName(form.sport || form.title, 40),
      format: cleanName(form.format, 80),
      venue: cleanName(form.venue, 60) || 'Main Turf',
      date: asDate(form.date),
      slot: cleanName(form.slot, 40),
      fee: parseMoney(form.fee, 50000),
      feeUnit: form.feeUnit,
      teamSize: parseIntIn(form.teamSize, 1, 50),
      capacity: parseIntIn(form.capacity, 1, 500),
      status: 'Needs approval' as const,
      headId: head?.id ?? null,
      headName: head?.name ?? null,
      note: cleanName(form.note, 240) || undefined,
    };
    const v = validateEventDraft(draft as any);
    if (!v.ok) { setError(v.error); return; }
    const created = store.actions.createEvent(v.value);
    if (!created) { setError('Could not create this event. Check the details and try again.'); return; }
    notify(`${created.title} created and sent to the approval queue.`);
    closeModal();
  }}>
    <div className="modal-grid">
      <Field label="EVENT NAME" required><input value={form.title} onChange={(e) => set('title')(e.target.value)} placeholder="e.g. Box Cricket" maxLength={80} required /></Field>
      <Field label="SPORT"><input value={form.sport} onChange={(e) => set('sport')(e.target.value)} placeholder="Defaults to event name" maxLength={40} /></Field>
      <Field label="FORMAT" required><input value={form.format} onChange={(e) => set('format')(e.target.value)} placeholder="e.g. 6 v 6, department teams" maxLength={80} required /></Field>
      <Field label="VENUE"><Select label="Venue" value={form.venue} onChange={set('venue')} options={['Main Turf', 'Indoor Gymkhana', 'Basketball Court 1', 'Outdoor Arena'].map((v) => ({ value: v, label: v }))} /></Field>
      <Field label="DATE"><input type="date" value={form.date} onChange={(e) => set('date')(e.target.value)} min="2024-01-01" max="2035-12-31" required /></Field>
      <Field label="SLOT"><input value={form.slot} onChange={(e) => set('slot')(e.target.value)} placeholder="e.g. 9:00 AM" maxLength={40} required /></Field>
      <Field label="ENTRY FEE" hint="0 for a free event"><input type="number" min={0} max={50000} step="1" value={form.fee} onChange={(e) => set('fee')(e.target.value)} /></Field>
      <Field label="FEE UNIT"><Select label="Fee unit" value={form.feeUnit} onChange={(v) => set('feeUnit')(v)} options={[{ value: 'team', label: 'per team' }, { value: 'player', label: 'per player' }, { value: 'pair', label: 'per pair' }]} /></Field>
      <Field label="TEAM SIZE"><input type="number" min={1} max={50} step="1" value={form.teamSize} onChange={(e) => set('teamSize')(e.target.value)} /></Field>
      <Field label="CAPACITY"><input type="number" min={1} max={500} step="1" value={form.capacity} onChange={(e) => set('capacity')(e.target.value)} /></Field>
      <Field label="SPORT HEAD" hint="Can be assigned later"><Select label="Sport head" value={form.headId} onChange={set('headId')} options={[{ value: '', label: 'Assign later' }, ...store.state.heads.filter((h) => h.status === 'Active').map((h) => ({ value: h.id, label: h.name }))]} /></Field>
    </div>
    <Field label="SUBMISSION NOTE"><textarea rows={2} value={form.note} onChange={(e) => set('note')(e.target.value)} placeholder="Budget, equipment or approval context for the director" maxLength={240} /></Field>
    {error && <p className="form-error">{error}</p>}
    <div className="modal-actions"><button type="button" className="button ghost" onClick={closeModal}>Cancel</button><button type="submit" className="button primary">Create and submit</button></div>
  </form>;
}

export function AdminHeads() {
  const { store, notify, openModal } = useApp();
  const { heads, events } = store.state;
  const invite = () => openModal({ title: 'Invite a sport head', sub: 'The invitee receives an email and appears as invited until they accept.', body: <InviteHeadForm /> });
  const assign = (eventId: string) => openModal({ title: 'Assign a sport head', sub: 'One head owns every operational task for this sport.', body: <AssignForm eventId={eventId} /> });

  return <AdminShell title="Sport heads" subtitle="Who owns each sport, what they can change, and where the office still decides.">
    <section className="panel" style={{ marginBottom: 14 }}>
      <div className="panel-label"><span className="overline">PEOPLE & OWNERSHIP</span><span className="quiet tiny">Every sport needs a clear owner</span></div>
      <div className="stat-row" style={{ marginTop: 10 }}>
        <div className="stat-card"><span className="overline">ACTIVE HEADS</span><b>{heads.filter((h) => h.status === 'Active').length}</b><small>Ready to run operations</small></div>
        <div className="stat-card accent-amber"><span className="overline">INVITED</span><b>{heads.filter((h) => h.status === 'Invited').length}</b><small>Waiting to accept access</small></div>
        <div className="stat-card"><span className="overline">SPORTS COVERED</span><b>{events.filter((e) => e.headId).length}<em>/{events.length}</em></b><small>Assignments complete</small></div>
        <div className="stat-card"><span className="overline">GAPS</span><b>{events.filter((e) => !e.headId).length}</b><small>Need a head before opening smoothly</small></div>
      </div>
    </section>
    <div className="split-grid">
      <section className="panel">
        <div className="panel-label"><span className="overline">OWNERSHIP</span><span className="quiet tiny">{events.filter((e) => e.headId).length}/{events.length} sports covered</span></div>
        <h2 className="panel-h2">Assignments by sport</h2>
        <div className="ownership-list">{events.map((e) => <div className="ownership-row" key={e.id}><div className="ownership-name"><b>{e.title}</b><small>{e.id} · {e.status}</small></div>{e.headName ? <><div className="ownership-head"><span className="avatar-sm">{e.headName.split(' ').map((n) => n[0]).join('')}</span><span><b>{e.headName}</b><small>{e.headId}</small></span></div><button className="text-button" onClick={() => assign(e.id)}>Change</button></> : <><em className="warn-text">Unassigned</em><button className="button sm primary" onClick={() => assign(e.id)}>Assign head</button></>}</div>)}</div>
      </section>
      <section className="panel">
        <div className="panel-label"><span className="overline">ROLE SCOPES</span><span className="quiet tiny">Read-only</span></div>
        <h2 className="panel-h2">Who can do what</h2>
        <ul className="scope-cards">
          <li><span className="avatar-sm">AD</span><div><b>Administrator</b><small>Approve events, set fees, assign heads, GC points, refunds.</small></div></li>
          <li><span className="avatar-sm">SH</span><div><b>Sport head</b><small>Verify IDs, manage squads, schedule fixtures, post scores.</small></div></li>
          <li><span className="avatar-sm">ST</span><div><b>Student</b><small>Register, pay, view fixtures and results.</small></div></li>
        </ul>
        <div className="hairline" />
        <button className="button primary full" onClick={invite}>+ Invite a sport head</button>
      </section>
    </div>
    <div className="table-shell"><table className="data-table"><thead><tr><th>HEAD</th><th>DEPT</th><th>SPORTS</th><th>CONTACT</th><th>STATUS</th><th>ACTION</th></tr></thead><tbody>{heads.map((h) => <tr key={h.id}><td><b>{h.name}</b><small className="cell-sub">{h.id}</small></td><td><Monogram code={h.dept} size="sm" /></td><td>{h.sports.join(', ') || <em className="warn-text">Unassigned</em>}</td><td className="cell-contact">{h.email}<small className="cell-sub">{h.phone}</small></td><td><StatusPill tone={h.status === 'Active' ? 'green' : 'amber'}>{h.status.toUpperCase()}</StatusPill></td><td>{h.status === 'Invited' ? <button className="button sm primary" onClick={() => { store.actions.activateHead(h.id); notify(`${h.name} activated as sport head.`); }}>Activate access</button> : <button className="text-button" onClick={() => openModal({ title: `${h.name}`, sub: `${h.id} · ${h.dept}`, body: <div className="stack"><dl className="entry-details"><div><dt>SPORTS</dt><dd>{h.sports.join(', ')}</dd></div><div><dt>EMAIL</dt><dd>{h.email}</dd></div><div><dt>PHONE</dt><dd>{h.phone}</dd></div></dl><div className="modal-actions"><button className="button ghost" onClick={() => notify(`Reminder emailed to ${h.email}.`)}>Send reminder</button><Link className="button primary" to="/admin/events">Manage assignments</Link></div></div> })}>View</button>}</td></tr>)}</tbody></table></div>
  </AdminShell>;
}

function AssignForm({ eventId }: { eventId: string }) {
  const { store, notify, closeModal } = useApp();
  const event = store.state.events.find((e) => e.id === eventId);
  const [headId, setHeadId] = useState(event?.headId ?? '');
  const [error, setError] = useState('');
  if (!event) return null;
  return <form className="stack" onSubmit={(e: FormEvent) => {
    e.preventDefault();
    const head = store.state.heads.find((h) => h.id === headId && h.status === 'Active');
    if (!head) { setError('Select an active sport head.'); return; }
    store.actions.assignHead(event.id, headId);
    notify(`${event.title} assigned to ${head.name}. They can now verify IDs and run fixtures.`);
    closeModal();
  }}>
    <Field label="SPORT HEAD" hint="Only active heads can be assigned"><Select label="Sport head" value={headId} onChange={(v) => { setHeadId(v); setError(''); }} options={[{ value: '', label: 'Select a head' }, ...store.state.heads.filter((h) => h.status === 'Active').map((h) => ({ value: h.id, label: `${h.name} · ${h.sports.join(', ') || 'Available'}` }))]} /></Field>
    <div className="permission-box"><span className="overline">THE HEAD WILL BE ABLE TO</span><ul><li>Verify IDs for {event.title}</li><li>Add or reject squad entries</li><li>Schedule and update fixtures</li><li>Submit results for GC confirmation</li></ul><span className="overline">THE OFFICE KEEPS</span><ul><li>Fee setting and refunds</li><li>Event approval and cancellation</li><li>GC points confirmation</li></ul></div>
    {error && <p className="form-error">{error}</p>}
    <div className="modal-actions"><button type="button" className="button ghost" onClick={closeModal}>Cancel</button><button type="submit" className="button primary" disabled={!headId}>Confirm assignment</button></div>
  </form>;
}

function InviteHeadForm() {
  const { store, notify, closeModal } = useApp();
  const [name, setName] = useState('');
  const [dept, setDept] = useState<Dept>('COMP');
  const [sport, setSport] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  return <form className="stack" onSubmit={(e: FormEvent) => {
    e.preventDefault();
    const clean = cleanName(name, 60);
    const mail = normalizeEmail(email);
    if (clean.length < 2) { setError('Enter the head’s full name (at least 2 characters).'); return; }
    if (!isEmail(mail)) { setError('Enter a valid email address.'); return; }
    const created = store.actions.inviteHead({ name: clean, dept, sports: sport.trim() ? [cleanName(sport, 60)] : [], phone: '—', email: mail });
    if (!created) { setError('Could not send this invite. The email may already be invited.'); return; }
    notify(`Invite sent to ${mail}. ${clean} appears as invited until they accept.`);
    closeModal();
  }}>
    <div className="modal-grid">
      <Field label="FULL NAME" required><input value={name} onChange={(e) => { setName(e.target.value); setError(''); }} placeholder="Staff or student head" maxLength={60} required /></Field>
      <Field label="MIT-ADT EMAIL" required><input type="email" value={email} onChange={(e) => { setEmail(e.target.value); setError(''); }} placeholder="name@mitwpu.edu.in" maxLength={120} required /></Field>
      <Field label="DEPARTMENT"><Select label="Department" value={dept} onChange={(v) => { setDept(v as Dept); setError(''); }} options={DEPARTMENTS.map((d) => ({ value: d.code, label: `${d.code} · ${d.name}` }))} /></Field>
      <Field label="SPORT" hint="Can be assigned later"><input value={sport} onChange={(e) => { setSport(e.target.value); setError(''); }} placeholder="e.g. Kabaddi" maxLength={60} /></Field>
    </div>
    {error && <p className="form-error">{error}</p>}
    <p className="quiet tiny">A sport head is limited to ID checks, squad management, fixtures and scores for their assigned sport.</p>
    <div className="modal-actions"><button type="button" className="button ghost" onClick={closeModal}>Cancel</button><button type="submit" className="button primary">Send invite</button></div>
  </form>;
}

export function AdminFinance() {
  const { store, notify, openModal } = useApp();
  const { payments, events } = store.state;
  const collected = store.totals.collected;
  const byDept = useMemo(() => DEPARTMENTS.map((d) => ({ code: d.code, total: payments.filter((p) => p.dept === d.code).reduce((s, p) => s + p.amount, 0) })), [payments]);
  const max = Math.max(1, ...byDept.map((d) => d.total));
  const exportCsv = () => {
    const rows = [['Reference', 'Event', 'Amount', 'Method', 'Department', 'Date'], ...payments.map((p) => [p.ref, events.find((e) => e.id === p.eventId)?.title ?? p.eventId, String(p.amount), p.method, p.dept, p.received])];
    const blob = new Blob([rows.map((r) => r.join(',')).join('\n')], { type: 'text/csv' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob); link.download = 'mit-adt-fee-collections.csv'; link.click(); URL.revokeObjectURL(link.href);
    notify('Fee collections exported as CSV.');
  };
  return <AdminShell title="Finance" subtitle="Entry fee collections, department split, and refunds.">
    <section className="panel" style={{ marginBottom: 14, background: 'linear-gradient(135deg, var(--surface), color-mix(in srgb, var(--sage-soft) 45%, var(--surface)))' }}>
      <div className="panel-label"><span className="overline">FINANCE SNAPSHOT</span><span className="quiet tiny">Collections, dues and reconciliation at a glance</span></div>
      <p className="quiet" style={{ marginTop: 8, maxWidth: 720 }}>Paid entries and refunds recorded by the Sports Office. Use this view to track collections, spot unpaid participants before fixture lock, and keep department-wise totals transparent.</p>
    </section>
    <div className="stat-row">
      <div className="stat-card"><span className="overline">COLLECTED TO DATE</span><b>₹{collected.toLocaleString('en-IN')}</b><small>{payments.length} payments recorded</small></div>
      <div className="stat-card"><span className="overline">PAID EVENTS</span><b>{events.filter((e) => e.fee > 0).length}</b><small>of {events.length} events</small></div>
      <div className="stat-card accent-amber"><span className="overline">UNPAID PARTICIPANTS</span><b>{store.state.participants.filter((p) => p.payment === 'Pending').length}</b><small>Chase before fixture lock</small></div>
      <div className="stat-card"><span className="overline">AVERAGE ENTRY</span><b>₹{payments.length ? Math.round(collected / payments.length).toLocaleString('en-IN') : '0'}</b><small>Per payment record</small></div>
    </div>
    <div className="split-grid wide-left">
      <section className="panel flush">
        <div className="panel-label pad"><span className="overline">COLLECTIONS LEDGER</span><button className="text-button" onClick={exportCsv}>Export CSV ↓</button></div>
        <div className="table-shell bare"><table className="data-table"><thead><tr><th>REFERENCE</th><th>EVENT</th><th>DEPT</th><th>AMOUNT</th><th>METHOD</th><th>RECEIVED</th><th /></tr></thead><tbody>{payments.map((p) => <tr key={p.id}><td className="mono-cell">{p.ref}</td><td>{events.find((e) => e.id === p.eventId)?.title ?? '—'}<small className="cell-sub">{p.team}</small></td><td><Monogram code={p.dept} size="sm" /></td><td className="mono-cell strong">₹{p.amount}</td><td>{p.method}</td><td>{p.received}</td><td><button className="text-button" onClick={() => openModal({ title: `Refund ${p.ref}?`, sub: `₹${p.amount} · ${events.find((e) => e.id === p.eventId)?.title}`, body: <RefundBody paymentId={p.id} /> })}>Refund</button></td></tr>)}{payments.length === 0 && <tr><td colSpan={7} className="quiet pad">No payments recorded yet.</td></tr>}</tbody></table></div>
      </section>
      <section className="panel">
        <div className="panel-label"><span className="overline">DIVISION</span><span className="quiet tiny">By department</span></div>
        <h2 className="panel-h2">Collection split</h2>
        <div className="dept-bars vertical">{byDept.map((d) => <div key={d.code}><span className="dept-label"><Monogram code={d.code} size="sm" />{d.code}</span><span className="dept-track"><i style={{ width: `${(d.total / max) * 100}%` }} /></span><b>₹{d.total.toLocaleString('en-IN')}</b></div>)}</div>
        <div className="hairline" />
        <div className="panel-label"><span className="overline">PAID EVENTS</span></div>
        <ul className="plain-list">{events.filter((e) => e.fee > 0).map((e) => <li key={e.id}><div><b>{e.title}</b><small>₹{e.fee} per {e.feeUnit}</small></div><span className="mono-cell">₹{store.state.payments.filter((p) => p.eventId === e.id).reduce((s, p) => s + p.amount, 0).toLocaleString('en-IN')}</span></li>)}</ul>
      </section>
    </div>
  </AdminShell>;
}

function RefundBody({ paymentId }: { paymentId: string }) {
  const { store, notify, closeModal } = useApp();
  const payment = store.state.payments.find((p) => p.id === paymentId);
  const [reason, setReason] = useState('Withdrawal before deadline');
  if (!payment) return null;
  return <form className="stack" onSubmit={(e: FormEvent) => { e.preventDefault(); store.actions.refund(payment.id); notify(`Refund of ₹${payment.amount} recorded against ${payment.ref}.`); closeModal(); }}>
    <dl className="entry-details"><div><dt>REFERENCE</dt><dd>{payment.ref}</dd></div><div><dt>AMOUNT</dt><dd>₹{payment.amount}</dd></div><div><dt>METHOD</dt><dd>{payment.method}</dd></div><div><dt>TEAM</dt><dd>{payment.team}</dd></div></dl>
    <Field label="REASON"><Select label="Reason" value={reason} onChange={setReason} options={['Withdrawal before deadline', 'Event cancelled', 'Duplicate payment', 'Entry rejected after ID check'].map((r) => ({ value: r, label: r }))} /></Field>
    <p className="quiet tiny">Refunds are an office decision. The sport head cannot action this.</p>
    <div className="modal-actions"><button type="button" className="button ghost" onClick={closeModal}>Cancel</button><button type="submit" className="button danger">Record refund</button></div>
  </form>;
}
