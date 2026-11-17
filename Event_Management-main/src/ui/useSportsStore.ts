import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  DEPARTMENTS, HEADS, Participant, SportsEvent, Fixture, Payment, Head, Student,
  SI_WORKSPACE, seedEvents, seedFixtures, seedParticipants, seedPayments,
} from '../data/sports';
import {
  APPROVALS, EVENT_STATUSES, FEE_UNITS, ID_STATUSES, MATCH_STATES, PAY_STATES, YEARS,
  asDate, asDept, asString, clamp, cleanName, cleanTeam, isDept, isEmail,
  normalizeCampusId, normalizeEmail, oneOf, parseIntIn, parseMoney, validateEventDraft,
} from './validate';

type State = {
  events: SportsEvent[];
  participants: Participant[];
  fixtures: Fixture[];
  payments: Payment[];
  heads: Head[];
  student: Student;
  enrolled: string[];
};

type Enrolment = { eventId: string; name: string; campusId: string; dept: Student['dept']; year: string; team: string; partner?: string; participantId: string; feeDue: number; feePaid: boolean; paymentRef: string };

const SEED: State = {
  events: seedEvents(),
  participants: seedParticipants(),
  fixtures: seedFixtures(),
  payments: seedPayments(),
  heads: HEADS,
  student: { name: 'Shravani kharade', campusId: '2023BTECH01234', dept: 'COMP', year: 'SE' },
  enrolled: ['EV-01'],
};

const NAMES = ['Shravani Kharade', 'Shreya Vardhe', 'Shravani kharade', 'Ira Menon', 'Vedant Rao', 'Mihir Kale'];

/** The demo student already holds a free Box Cricket entry (matching seed participant P-01). */
const SEED_ENROLMENTS: Enrolment[] = [{
  eventId: 'EV-01', name: 'Shravani kharade', campusId: '2023BTECH01234', dept: 'COMP', year: 'SE',
  team: 'COMP A', participantId: 'P-01', feeDue: 0, feePaid: true, paymentRef: 'No fee',
}];

function cloneSeed(): State {
  return {
    events: seedEvents(),
    participants: seedParticipants(),
    fixtures: seedFixtures(),
    payments: seedPayments(),
    heads: HEADS.map((h) => ({ ...h, sports: [...h.sports] })),
    student: { ...SEED.student },
    enrolled: [...SEED.enrolled],
  };
}

function validId(v: unknown): v is string {
  return typeof v === 'string' && /^[A-Za-z0-9_-]{1,40}$/.test(v);
}

function sanitizeEvent(raw: unknown): SportsEvent | null {
  if (!raw || typeof raw !== 'object') return null;
  const e = raw as Partial<SportsEvent>;
  if (!validId(e.id)) return null;
  const title = asString(e.title, 80) || 'Untitled event';
  const fee = Number.isFinite(e.fee) ? clamp(Math.round(Number(e.fee) * 100) / 100, 0, 50000) : 0;
  const teamSize = Number.isFinite(e.teamSize) ? clamp(Math.trunc(Number(e.teamSize)), 1, 50) : 1;
  const capacity = Number.isFinite(e.capacity) ? clamp(Math.trunc(Number(e.capacity)), 1, 500) : 1;
  const registered = Number.isFinite(e.registered) ? clamp(Math.trunc(Number(e.registered)), 0, capacity) : 0;
  return {
    id: e.id,
    title,
    format: asString(e.format, 80) || '—',
    sport: asString(e.sport, 40) || title,
    venue: asString(e.venue, 60) || 'Main Turf',
    date: asDate(e.date),
    slot: asString(e.slot, 40) || 'TBA',
    fee,
    feeUnit: oneOf(e.feeUnit, FEE_UNITS, 'team'),
    teamSize,
    capacity,
    registered,
    status: oneOf(e.status, EVENT_STATUSES, 'Draft'),
    headId: validId(e.headId) ? e.headId : null,
    headName: asString(e.headName, 60) || null,
    approvals: oneOf(e.approvals, APPROVALS, 'Pending'),
    note: asString(e.note, 240) || undefined,
  };
}

function sanitizeParticipant(raw: unknown, eventIds: Set<string>): Participant | null {
  if (!raw || typeof raw !== 'object') return null;
  const p = raw as Partial<Participant>;
  if (!validId(p.id) || !validId(p.eventId) || !eventIds.has(p.eventId)) return null;
  const name = cleanName(p.name, 60) || 'Participant';
  return {
    id: p.id,
    name,
    campusId: asString(p.campusId, 80) || undefined,
    dept: asDept(p.dept),
    year: typeof p.year === 'string' && YEARS.has(p.year) ? p.year : 'SE',
    eventId: p.eventId,
    team: cleanTeam(p.team, p.dept as string),
    idStatus: oneOf(p.idStatus, ID_STATUSES, 'Pending'),
    payment: oneOf(p.payment, PAY_STATES, 'Not required'),
    partner: asString(p.partner, 60) || undefined,
    role: p.role === 'walk-in' ? 'walk-in' : 'campus',
    enrolledAt: asString(p.enrolledAt, 30) || undefined,
  };
}

function sanitizeHead(raw: unknown): Head | null {
  if (!raw || typeof raw !== 'object') return null;
  const h = raw as Partial<Head>;
  if (!validId(h.id)) return null;
  const name = cleanName(h.name, 60);
  if (!name) return null;
  const sports = Array.isArray(h.sports) ? h.sports.map((s) => asString(s, 60)).filter(Boolean).slice(0, 20) : [];
  return {
    id: h.id,
    name,
    dept: asDept(h.dept),
    phone: asString(h.phone, 30) || '—',
    email: normalizeEmail(h.email) || 'head@mitwpu.edu.in',
    sports,
    status: h.status === 'Invited' ? 'Invited' : 'Active',
  };
}

function sanitizeFixture(raw: unknown, eventIds: Set<string>): Fixture | null {
  if (!raw || typeof raw !== 'object') return null;
  const f = raw as Partial<Fixture>;
  if (!validId(f.id) || !validId(f.eventId) || !eventIds.has(f.eventId)) return null;
  return {
    id: f.id,
    eventId: f.eventId,
    round: asString(f.round, 60) || 'Round',
    teamA: asDept(f.teamA),
    teamB: asDept(f.teamB),
    venue: asString(f.venue, 60) || 'Main Turf',
    time: asString(f.time, 60) || 'TBA',
    state: oneOf(f.state, MATCH_STATES, 'Upcoming'),
    scoreA: asString(f.scoreA, 20) || '—',
    scoreB: asString(f.scoreB, 20) || '—',
  };
}

function sanitizePayment(raw: unknown, eventIds: Set<string>, participantIds: Set<string>): Payment | null {
  if (!raw || typeof raw !== 'object') return null;
  const p = raw as Partial<Payment>;
  if (!validId(p.id) || !validId(p.eventId) || !eventIds.has(p.eventId)) return null;
  const amount = Number.isFinite(p.amount) ? clamp(Math.round(Number(p.amount) * 100) / 100, 0, 50000) : 0;
  return {
    id: p.id,
    eventId: p.eventId,
    amount,
    dept: asDept(p.dept),
    team: cleanTeam(p.team, p.dept as string),
    method: asString(p.method, 40) || 'UPI',
    ref: asString(p.ref, 40) || p.id,
    received: asString(p.received, 30) || '—',
    participantId: validId(p.participantId) && participantIds.has(p.participantId) ? p.participantId : undefined,
  };
}

function read(): State {
  try {
    const raw = localStorage.getItem(SI_WORKSPACE);
    if (!raw) return cloneSeed();
    const saved = JSON.parse(raw) as Partial<State> | null;
    if (!saved || typeof saved !== 'object') return cloneSeed();
    const eventsRaw = Array.isArray(saved.events) ? saved.events : [];
    const events = eventsRaw.map(sanitizeEvent).filter((e): e is SportsEvent => !!e).slice(0, 200);
    const base = events.length ? events : cloneSeed().events;
    const eventIds = new Set(base.map((e) => e.id));
    const participantsRaw = Array.isArray(saved.participants) ? saved.participants : [];
    const participants = participantsRaw.map((p) => sanitizeParticipant(p, eventIds)).filter((p): p is Participant => !!p).slice(0, 2000);
    const participantIds = new Set(participants.map((p) => p.id));
    const headsRaw = Array.isArray(saved.heads) ? saved.heads : [];
    const heads = headsRaw.map(sanitizeHead).filter((h): h is Head => !!h).slice(0, 200);
    const fixturesRaw = Array.isArray(saved.fixtures) ? saved.fixtures : [];
    const fixtures = fixturesRaw.map((f) => sanitizeFixture(f, eventIds)).filter((f): f is Fixture => !!f).slice(0, 500);
    const paymentsRaw = Array.isArray(saved.payments) ? saved.payments : [];
    const payments = paymentsRaw.map((p) => sanitizePayment(p, eventIds, participantIds)).filter((p): p is Payment => !!p).slice(0, 2000);
    const enrolled = Array.isArray(saved.enrolled) ? saved.enrolled.filter((id): id is string => validId(id) && eventIds.has(id)).slice(0, 200) : [];
    const st = saved.student && typeof saved.student === 'object' ? (saved.student as Partial<Student>) : {};
    const student: Student = {
      name: cleanName(st.name, 60) || SEED.student.name,
      campusId: normalizeCampusId(asString(st.campusId, 80)) || SEED.student.campusId,
      dept: asDept(st.dept, SEED.student.dept),
      year: typeof st.year === 'string' && YEARS.has(st.year) ? st.year : SEED.student.year,
    };
    return { events: base, participants, fixtures, payments, heads: heads.length ? heads : cloneSeed().heads, student, enrolled };
  } catch {
    return cloneSeed();
  }
}

let counter = 0;
function makeId(prefix: string) {
  counter += 1;
  return `${prefix}-${Date.now().toString(36).slice(-4)}${counter.toString(36).slice(-2)}`.toUpperCase();
}

/** Single source of truth for what an entry costs. */
export function priceFor(event: SportsEvent, players = 1): number {
  if (!event || event.fee <= 0) return 0;
  if (event.feeUnit === 'player') return event.fee * Math.max(1, Math.trunc(players) || 1);
  return event.fee;
}

const TODAY = '17 Feb 2025';

type ReserveDetails = { name: string; campusId: string; dept: Student['dept']; year: string; team: string; partner?: string };
type ReserveResult = { ok: true; participant: Participant; price: number } | { ok: false; error: string };
type PayResult = { ok: true; ref: string } | { ok: false; error: string };

export function useSportsStore() {
  const [state, setState] = useState<State>(read);
  const [enrolments, setEnrolments] = useState<Enrolment[]>(SEED_ENROLMENTS);
  const [sessionName, setSessionName] = useState('Shravani kharade');

  useEffect(() => {
    try { localStorage.setItem(SI_WORKSPACE, JSON.stringify(state)); } catch { /* ignore quota/private mode */ }
  }, [state]);

  /* An enrolment for an event is paid iff this session has recorded a payment for it. */
  const paidEvents = useMemo(() => new Set(enrolments.filter((e) => e.feePaid).map((e) => e.eventId)), [enrolments]);

  const reset = useCallback(() => { setState(cloneSeed()); setEnrolments(SEED_ENROLMENTS); setSessionName('Shravani kharade'); }, []);

  /** Reserve a place. Creates a pending entry; no payment is taken yet. Validated and guarded. */
  const reserve = useCallback((event: SportsEvent, details: ReserveDetails, players = 1): ReserveResult => {
    const name = cleanName(details?.name, 60);
    const campusId = normalizeCampusId(asString(details?.campusId, 80));
    const team = cleanTeam(details?.team, asDept(details?.dept));
    const year = typeof details?.year === 'string' && YEARS.has(details.year) ? details.year : '';
    const dept = asDept(details?.dept);
    const partner = cleanName(details?.partner, 60) || undefined;
    const isEmailId = isEmail(campusId);
    const idOk = isEmailId ? true : /^[A-Z0-9]{6,20}$/.test(campusId);
    if (!name) return { ok: false, error: 'Add the name that appears on your campus ID.' };
    if (!idOk) return { ok: false, error: 'Enter a valid campus ID or MIT-ADT email.' };
    if (!year) return { ok: false, error: 'Select your year.' };
    if (!event?.id) return { ok: false, error: 'This event is unavailable.' };

    const live = state.events.find((e) => e.id === event.id);
    if (!live) return { ok: false, error: 'This event is no longer available.' };
    if (live.approvals !== 'Approved' || live.status !== 'Open') return { ok: false, error: 'Registration is not open for this event.' };
    if (live.registered >= live.capacity) return { ok: false, error: 'This event is full.' };
    if (enrolments.some((e) => e.eventId === live.id)) return { ok: false, error: 'You are already registered for this event.' };
    if (live.teamSize > 1 && !team) return { ok: false, error: 'Add a team name for this entry.' };
    if (live.teamSize === 2 && !partner) return { ok: false, error: 'Add your doubles partner.' };

    const price = priceFor(live, players);
    const participant: Participant = {
      id: makeId('P'), name, campusId, dept, year,
      eventId: live.id, team, idStatus: 'Pending',
      payment: price > 0 ? 'Pending' : 'Not required', partner, role: 'campus',
      enrolledAt: TODAY,
    };
    const enrolment: Enrolment = {
      eventId: live.id, name, campusId, dept, year,
      team, partner, participantId: participant.id,
      feeDue: price, feePaid: price === 0, paymentRef: price === 0 ? 'No fee' : '',
    };
    setSessionName(name);
    setEnrolments((prev) => (prev.some((e) => e.eventId === live.id) ? prev : [...prev, enrolment]));
    setState((prev) => {
      const ev = prev.events.find((e) => e.id === live.id);
      if (!ev || ev.registered >= ev.capacity || prev.enrolled.includes(live.id)) return prev;
      return {
        ...prev,
        student: { name, campusId, dept, year },
        participants: [participant, ...prev.participants],
        enrolled: [...prev.enrolled, live.id],
        events: prev.events.map((e) => (e.id === live.id ? { ...e, registered: Math.min(e.capacity, e.registered + 1) } : e)),
      };
    });
    return { ok: true, participant, price };
  }, [state.events, enrolments]);

  const pay = useCallback((eventId: string, method: string): PayResult => {
    const safeMethod = asString(method, 40) || 'UPI';
    const target = enrolments.find((e) => e.eventId === eventId);
    if (!target) return { ok: false, error: 'No entry found for this event.' };
    if (target.feePaid) return { ok: true, ref: target.paymentRef || 'Paid' };
    if (!(target.feeDue > 0)) return { ok: true, ref: target.paymentRef || 'No fee' };

    const ref = `${safeMethod.split(/[\s·]/)[0].toUpperCase().replace(/[^A-Z]/g, '') || 'PAY'}-${Math.floor(100000 + Math.random() * 899999)}`;
    setState((prev) => {
      const event = prev.events.find((e) => e.id === eventId);
      const participant = prev.participants.find((p) => p.id === target.participantId);
      if (!event || !participant || participant.payment === 'Paid') return prev;
      const payment: Payment = { id: makeId('PAY'), eventId, amount: target.feeDue, dept: target.dept, team: target.team, method: safeMethod, ref, received: 'Just now', participantId: target.participantId };
      return {
        ...prev,
        participants: prev.participants.map((p) => (p.id === target.participantId ? { ...p, payment: 'Paid' } : p)),
        payments: prev.payments.some((p) => p.ref === ref) ? prev.payments : [payment, ...prev.payments],
      };
    });
    setEnrolments((prev) => prev.map((e) => (e.eventId === eventId ? { ...e, feePaid: true, paymentRef: e.paymentRef && e.feePaid ? e.paymentRef : ref } : e)));
    return { ok: true, ref };
  }, [enrolments]);

  const withdraw = useCallback((eventId: string) => {
    if (!validId(eventId)) return;
    const target = enrolments.find((e) => e.eventId === eventId);
    if (!target) return;
    setEnrolments((prev) => prev.filter((e) => e.eventId !== eventId));
    setState((prev) => ({
      ...prev,
      enrolled: prev.enrolled.filter((id) => id !== eventId),
      participants: prev.participants.filter((p) => p.id !== target.participantId),
      payments: prev.payments.filter((p) => p.participantId !== target.participantId),
      events: prev.events.map((e) => (e.id === eventId ? { ...e, registered: Math.max(0, e.registered - 1) } : e)),
    }));
  }, [enrolments]);

  const isRegistered = useCallback((eventId: string) => state.enrolled.includes(eventId) && enrolments.some((e) => e.eventId === eventId), [state.enrolled, enrolments]);

  const actions = useMemo(() => ({
    reserve, pay, withdraw,
    verifyParticipant: (participantId: string, status: 'Verified' | 'Rejected' | 'Pending') => {
      if (!validId(participantId) || !ID_STATUSES.has(status)) return;
      setState((prev) => ({
        ...prev, participants: prev.participants.map((p) => (p.id === participantId ? { ...p, idStatus: status } : p)),
      }));
    },
    addParticipant: (eventId: string, dept: Participant['dept'], team: string) => {
      const safeDept = asDept(dept);
      const safeTeam = cleanTeam(team, safeDept);
      const name = NAMES[Math.floor(Math.random() * NAMES.length)];
      let added = false;
      setState((prev) => {
        const ev = prev.events.find((e) => e.id === eventId);
        if (!ev || ev.registered >= ev.capacity) return prev;
        added = true;
        return {
          ...prev,
          participants: [{ id: makeId('P'), name, campusId: `${2023 - Math.floor(Math.random() * 3)}BTECH0${Math.floor(1000 + Math.random() * 8999)}`, dept: safeDept, year: 'TE', eventId, team: safeTeam, idStatus: 'Pending', payment: ev.fee > 0 ? 'Pending' : 'Not required', role: 'walk-in', enrolledAt: TODAY }, ...prev.participants],
          events: prev.events.map((e) => (e.id === eventId ? { ...e, registered: Math.min(e.capacity, e.registered + 1) } : e)),
        };
      });
      return added ? name : '';
    },
    updateFixture: (fixtureId: string, patch: Partial<Fixture>) => {
      if (!validId(fixtureId) || !patch || typeof patch !== 'object') return;
      setState((prev) => ({
        ...prev, fixtures: prev.fixtures.map((f) => {
          if (f.id !== fixtureId) return f;
          const next: Fixture = { ...f };
          if (patch.state && MATCH_STATES.has(patch.state)) next.state = patch.state;
          if (patch.scoreA != null) next.scoreA = asString(patch.scoreA, 20) || '—';
          if (patch.scoreB != null) next.scoreB = asString(patch.scoreB, 20) || '—';
          if (patch.round != null) next.round = asString(patch.round, 60) || next.round;
          if (patch.time != null) next.time = asString(patch.time, 60) || next.time;
          if (patch.venue != null) next.venue = asString(patch.venue, 60) || next.venue;
          if (patch.teamA && isDept(patch.teamA)) next.teamA = patch.teamA;
          if (patch.teamB && isDept(patch.teamB)) next.teamB = patch.teamB;
          return next;
        }),
      }));
    },
    createFixture: (eventId: string, round: string, teamA: Participant['dept'], teamB: Participant['dept'], time: string, venue: string) => {
      if (!validId(eventId) || !isDept(teamA) || !isDept(teamB) || teamA === teamB) return '';
      const r = asString(round, 60);
      const t = asString(time, 60);
      const v = asString(venue, 60);
      if (!r || !t || !v) return '';
      const id = makeId('FX');
      let created = '';
      setState((prev) => {
        if (!prev.events.some((e) => e.id === eventId)) return prev;
        created = id;
        return {
          ...prev, fixtures: [{ id, eventId, round: r, teamA, teamB, time: t, venue: v, state: 'Upcoming', scoreA: '—', scoreB: '—' }, ...prev.fixtures],
        };
      });
      return created;
    },
    saveEvent: (eventId: string, patch: Partial<SportsEvent>) => {
      if (!validId(eventId) || !patch || typeof patch !== 'object') return;
      setState((prev) => ({
        ...prev, events: prev.events.map((e) => {
          if (e.id !== eventId) return e;
          const next: SportsEvent = { ...e };
          if (patch.title != null) { const t = cleanName(patch.title, 80); if (t) next.title = t; }
          if (patch.sport != null) { const s = cleanName(patch.sport, 40); if (s) next.sport = s; }
          if (patch.format != null) next.format = asString(patch.format, 80) || next.format;
          if (patch.venue != null) next.venue = asString(patch.venue, 60) || next.venue;
          if (patch.date != null) next.date = asDate(patch.date, next.date);
          if (patch.slot != null) next.slot = asString(patch.slot, 40) || next.slot;
          if (patch.fee != null) { const f = parseMoney(patch.fee, 50000); if (!Number.isNaN(f)) next.fee = f; }
          if (patch.feeUnit && FEE_UNITS.has(patch.feeUnit)) next.feeUnit = patch.feeUnit;
          if (patch.teamSize != null) { const n = parseIntIn(patch.teamSize, 1, 50); if (!Number.isNaN(n)) next.teamSize = n; }
          if (patch.capacity != null) { const n = parseIntIn(patch.capacity, 1, 500); if (!Number.isNaN(n)) { next.capacity = n; next.registered = Math.min(next.registered, n); } }
          if (patch.status && EVENT_STATUSES.has(patch.status)) next.status = patch.status;
          if (patch.approvals && APPROVALS.has(patch.approvals)) next.approvals = patch.approvals;
          if (patch.headId !== undefined) next.headId = validId(patch.headId) ? patch.headId : null;
          if (patch.headName !== undefined) next.headName = asString(patch.headName, 60) || null;
          if (patch.note !== undefined) next.note = asString(patch.note, 240) || undefined;
          return next;
        }),
      }));
    },
    createEvent: (draft: Omit<SportsEvent, 'id' | 'registered' | 'approvals'>) => {
      const v = validateEventDraft(draft as any);
      if (!v.ok) return null;
      const event: SportsEvent = { ...v.value, id: makeId('EV'), registered: 0, approvals: 'Pending', status: 'Needs approval' };
      setState((prev) => ({ ...prev, events: [event, ...prev.events] }));
      return event;
    },
    decideEvent: (eventId: string, decision: 'Approved' | 'Rejected', headId: string | null) => {
      if (!validId(eventId) || !APPROVALS.has(decision)) return;
      setState((prev) => {
        if (!prev.events.some((e) => e.id === eventId)) return prev;
        const resolvedHeadId = validId(headId) ? headId : null;
        return {
          ...prev,
          events: prev.events.map((e) => {
            if (e.id !== eventId) return e;
            if (decision === 'Rejected') return { ...e, approvals: 'Rejected', status: 'Closed', headId: resolvedHeadId ?? e.headId };
            const targetHeadId = resolvedHeadId ?? e.headId;
            const next = prev.heads.find((h) => h.id === targetHeadId && h.status === 'Active');
            if (!next) return e; // cannot approve without an active head
            return { ...e, approvals: 'Approved', status: 'Open', headId: next.id, headName: next.name };
          }),
          heads: prev.heads.map((h) => {
            const title = prev.events.find((e) => e.id === eventId)?.title ?? '';
            const sports = h.sports.filter((s) => s !== title);
            const targetHeadId = resolvedHeadId ?? prev.events.find((e) => e.id === eventId)?.headId;
            if (decision === 'Approved' && h.id === targetHeadId && h.status === 'Active') return { ...h, sports: [...sports, title] };
            return { ...h, sports };
          }),
        };
      });
    },
    assignHead: (eventId: string, headId: string) => {
      if (!validId(eventId) || !validId(headId)) return;
      setState((prev) => {
        const title = prev.events.find((e) => e.id === eventId)?.title ?? '';
        const head = prev.heads.find((h) => h.id === headId && h.status === 'Active');
        if (!head) return prev;
        return {
          ...prev,
          events: prev.events.map((e) => (e.id === eventId ? { ...e, headId, headName: head.name } : e)),
          heads: prev.heads.map((h) => {
            const cleaned = h.sports.filter((s) => s !== title);
            return h.id === headId ? { ...h, sports: [...cleaned, title] } : { ...h, sports: cleaned };
          }),
        };
      });
    },
    inviteHead: (draft: Omit<Head, 'id' | 'status'>) => {
      const name = cleanName(draft?.name, 60);
      const email = normalizeEmail(draft?.email);
      if (name.length < 2) return null;
      if (!isEmail(email)) return null;
      const head: Head = {
        id: makeId('H'), name, dept: asDept(draft?.dept),
        phone: asString(draft?.phone, 30) || '—', email,
        sports: Array.isArray(draft?.sports) ? draft.sports.map((s) => asString(s, 60)).filter(Boolean).slice(0, 10) : [],
        status: 'Invited',
      };
      setState((prev) => (prev.heads.some((h) => h.email === head.email) ? prev : { ...prev, heads: [...prev.heads, head] }));
      return head;
    },
    activateHead: (headId: string) => {
      if (!validId(headId)) return;
      setState((prev) => ({ ...prev, heads: prev.heads.map((h) => (h.id === headId ? { ...h, status: 'Active' } : h)) }));
    },
    refund: (paymentId: string) => {
      if (!validId(paymentId)) return;
      setState((prev) => ({ ...prev, payments: prev.payments.filter((p) => p.id !== paymentId) }));
    },
  }), [reserve, pay, withdraw]);

  const totals = useMemo(() => {
    const collected = state.payments.reduce((sum, p) => sum + p.amount, 0);
    const verified = state.participants.filter((p) => p.idStatus === 'Verified').length;
    const pendingEvents = state.events.filter((e) => e.approvals === 'Pending').length;
    const unassigned = state.events.filter((e) => !e.headId && e.approvals !== 'Rejected').length;
    const openEvents = state.events.filter((e) => e.status === 'Open').length;
    return { collected, verified, pendingEvents, unassigned, openEvents, byDept: DEPARTMENTS };
  }, [state]);

  return { state, actions, totals, reset, enrolments, paidEvents, isRegistered, sessionName };
}

export type Store = ReturnType<typeof useSportsStore>;
export type { Enrolment };