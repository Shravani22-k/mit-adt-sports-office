import { DEPARTMENTS, Dept, EventStatus, MatchState, SportsEvent } from '../data/sports';

export const DEPT_CODES = new Set<Dept>(DEPARTMENTS.map((d) => d.code));
export const EVENT_STATUSES = new Set<EventStatus>(['Open', 'Closed', 'Draft', 'Needs approval']);
export const MATCH_STATES = new Set<MatchState>(['Upcoming', 'Live', 'Innings break', 'Rain delay', 'Walkover', 'Final']);
export const APPROVALS = new Set(['Approved', 'Pending', 'Rejected'] as const);
export const FEE_UNITS = new Set(['player', 'team', 'pair'] as const);
export const YEARS = new Set(['FE', 'SE', 'TE', 'BE', 'ME']);
export const ID_STATUSES = new Set(['Pending', 'Verified', 'Rejected'] as const);
export const PAY_STATES = new Set(['Paid', 'Not required', 'Pending'] as const);

export function asString(v: unknown, max = 120): string {
  if (typeof v !== 'string') return '';
  // strip control chars except normal whitespace, trim, cap length
  return v.replace(/[\u0000-\u001f\u007f]/g, '').trim().slice(0, max);
}

export function asNonEmpty(v: unknown, max = 120): string {
  return asString(v, max);
}

export function isEmail(v: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);
}

export function normalizeEmail(v: unknown): string {
  return asString(v, 120).toLowerCase();
}

export function normalizeCampusId(raw: string): string {
  const v = asString(raw, 80);
  if (isEmail(v)) return v.toLowerCase();
  return v.replace(/[\s-]/g, '').toUpperCase();
}

export function isCampusIdOrEmail(raw: string): boolean {
  const v = asString(raw, 80);
  if (isEmail(v)) return true;
  const id = v.replace(/[\s-]/g, '').toUpperCase();
  return /^[A-Z0-9]{6,20}$/.test(id);
}

export function parseMoney(v: unknown, max = 100000): number {
  const n = typeof v === 'number' ? v : Number(String(v ?? '').trim());
  if (!Number.isFinite(n)) return NaN;
  const r = Math.round(n * 100) / 100;
  if (r < 0 || r > max) return NaN;
  return r;
}

export function parseIntIn(v: unknown, min: number, max: number): number {
  const n = typeof v === 'number' ? v : Number(String(v ?? '').trim());
  if (!Number.isFinite(n)) return NaN;
  const r = Math.trunc(n);
  if (r < min || r > max) return NaN;
  return r;
}

export function isDept(v: unknown): v is Dept {
  return typeof v === 'string' && DEPT_CODES.has(v as Dept);
}

export function asDept(v: unknown, fallback: Dept = 'COMP'): Dept {
  return isDept(v) ? v : fallback;
}

export function isIsoDate(v: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(v));
}

export function asDate(v: unknown, fallback = '2025-03-01'): string {
  const s = asString(v, 20);
  return isIsoDate(s) ? s : fallback;
}

export function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

export function oneOf<T extends string>(v: unknown, set: Set<T>, fallback: T): T {
  return typeof v === 'string' && set.has(v as T) ? (v as T) : fallback;
}

export function cleanTeam(v: unknown, fallback: string): string {
  const s = asString(v, 40).replace(/\s+/g, ' ');
  return s || fallback;
}

export function cleanName(v: unknown, max = 60): string {
  return asString(v, max).replace(/\s+/g, ' ');
}

export function validateEventDraft(d: Partial<SportsEvent> & Record<string, unknown>): { ok: true; value: Omit<SportsEvent, 'id' | 'registered' | 'approvals'> } | { ok: false; error: string } {
  const title = cleanName(d.title, 80);
  if (title.length < 3) return { ok: false, error: 'Event name must be at least 3 characters.' };
  const sport = cleanName(d.sport, 40) || title;
  const format = asString(d.format, 80);
  if (format.length < 3) return { ok: false, error: 'Add a short format (e.g. 6 v 6, department teams).' };
  const venue = cleanName(d.venue, 60) || 'Main Turf';
  const date = asString(d.date, 20);
  if (!isIsoDate(date)) return { ok: false, error: 'Choose a valid event date.' };
  const slot = cleanName(d.slot, 40);
  if (!slot) return { ok: false, error: 'Add a time slot.' };
  const fee = parseMoney(d.fee, 50000);
  if (Number.isNaN(fee)) return { ok: false, error: 'Entry fee must be between ₹0 and ₹50,000.' };
  const feeUnit = oneOf(d.feeUnit, FEE_UNITS, 'team');
  const teamSize = parseIntIn(d.teamSize, 1, 50);
  if (Number.isNaN(teamSize)) return { ok: false, error: 'Team size must be between 1 and 50.' };
  const capacity = parseIntIn(d.capacity, 1, 500);
  if (Number.isNaN(capacity)) return { ok: false, error: 'Capacity must be between 1 and 500.' };
  const status = oneOf(d.status, EVENT_STATUSES, 'Needs approval');
  const headId = asString(d.headId, 40) || null;
  const headName = asString(d.headName, 60) || null;
  const note = asString(d.note, 240) || undefined;
  return { ok: true, value: { title, sport, format, venue, date, slot, fee, feeUnit, teamSize, capacity, status, headId, headName, note } };
}
