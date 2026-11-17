import { useState } from 'react';
import { Dept, MatchState, SportsEvent } from '../data/sports';

export function Monogram({ code, size = 'md' }: { code: Dept | 'BK' | 'BD' | 'TW'; size?: 'sm' | 'md' }) {
  const known = ['COMP', 'IT', 'ENTC', 'MECH', 'CIVIL'].includes(code);
  return <span className={`monogram mono-${code.toLowerCase()} ${size === 'sm' ? 'mono-sm' : ''} ${known ? 'dept-code' : 'event-code'}`}>{code}</span>;
}

export function StatusPill({ tone, children }: { tone: 'green' | 'amber' | 'red' | 'quiet'; children: React.ReactNode }) {
  return <span className={`status-pill tone-${tone}`}>{children}</span>;
}

export function MatchStateBadge({ state }: { state: MatchState }) {
  const tone = state === 'Live' ? 'green' : state === 'Final' ? 'quiet' : state === 'Rain delay' || state === 'Innings break' ? 'amber' : 'quiet';
  return <StatusPill tone={tone}>{state === 'Live' && <i className="pulse-dot" />}{state.toUpperCase()}</StatusPill>;
}

export function Field({ label, hint, children, required }: { label: string; hint?: string; children: React.ReactNode; required?: boolean }) {
  return <label className="field">
    <span className="field-label">{label}{required && <em>*</em>}{hint && <small>{hint}</small>}</span>
    {children}
  </label>;
}

export function Select({ value, onChange, options, label }: { value: string; onChange: (v: string) => void; options: { value: string; label: string }[]; label: string }) {
  return <div className="select-wrap"><select aria-label={label} value={value} onChange={(e) => onChange(e.target.value)}>{options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select><span className="select-caret">▾</span></div>;
}

export function CopyButton({ text, label = 'Copy link' }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try { await navigator.clipboard.writeText(text); } catch { /* clipboard may be unavailable */ }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };
  return <button type="button" className="text-button" onClick={copy}>{copied ? 'Copied ✓' : label}</button>;
}

export function EmptyState({ title, body, action }: { title: string; body: string; action?: React.ReactNode }) {
  return <div className="empty-state"><span className="empty-mark">∅</span><h3>{title}</h3><p>{body}</p>{action}</div>;
}

/** Shape-matched fallback shown while a portal route chunk loads. */
export function PortalSkeleton() {
  return <div className="portal-skeleton" role="status" aria-live="polite">
    <aside className="ps-rail" aria-hidden="true">
      <span className="sk ps-logo" />
      <span className="sk ps-identity" />
      <div className="ps-nav">{[0, 1, 2, 3].map((i) => <span key={i} className="sk" />)}</div>
      <span className="sk ps-foot" />
    </aside>
    <div className="ps-main" aria-hidden="true">
      <div className="ps-top"><span className="sk" /><span className="sk short" /></div>
      <div className="ps-body">
        <div className="ps-head"><span className="sk ps-kicker" /><span className="sk ps-title" /><span className="sk ps-sub" /></div>
        <span className="sk ps-hero" />
        <div className="ps-stats">{[0, 1, 2, 3].map((i) => <span key={i} className="sk ps-stat" />)}</div>
        <div className="ps-cards">{[0, 1, 2].map((i) => <div key={i} className="ps-card"><span className="sk ps-media" /><span className="sk ps-line" /><span className="sk ps-line short" /></div>)}</div>
      </div>
    </div>
    <span className="sr-only">Loading your workspace…</span>
  </div>;
}

export function CapacityBar({ used, total }: { used: number; total: number }) {
  const pct = Math.min(100, Math.round((used / Math.max(1, total)) * 100));
  return <div className="capacity"><span className="capacity-track"><i style={{ width: `${pct}%` }} className={pct > 88 ? 'is-full' : ''} /></span><small>{used}/{total} filled</small></div>;
}

export function EventMeta({ event }: { event: SportsEvent }) {
  return <div className="event-meta">
    <span><b>{formatDate(event.date)}</b><small>{event.slot}</small></span>
    <span><b>{event.venue}</b><small>{event.format}</small></span>
    <span><b>{event.registered}/{event.capacity}</b><small>registered</small></span>
  </div>;
}

const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

/** Turns `2025-02-19` into `19 FEB`. Safe for invalid inputs. */
export function formatDate(iso: string) {
  if (typeof iso !== 'string') return '—';
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso.trim());
  if (!m) return iso.trim() || '—';
  const month = Number(m[2]);
  const day = Number(m[3]);
  const label = MONTHS[month - 1];
  if (!label || day < 1 || day > 31) return iso;
  return `${String(day).padStart(2, '0')} ${label}`;
}