import { createContext, ReactNode, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Store, useSportsStore } from './useSportsStore';

type Toast = { id: number; text: string; tone: 'ok' | 'warn' };
type Modal = { title: string; sub?: string; body: ReactNode; onClose?: () => void };
type UI = {
  store: Store;
  notify: (text: string, tone?: Toast['tone']) => void;
  modal: Modal | null;
  openModal: (config: Modal) => void;
  closeModal: () => void;
};

const Ctx = createContext<UI | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const store = useSportsStore();
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [modal, setModal] = useState<Modal | null>(null);
  const seq = useRef(0);
  const opener = useRef<Element | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  const notify = useCallback((text: string, tone: Toast['tone'] = 'ok') => {
    if (!text) return;
    const id = ++seq.current;
    setToasts((prev) => [...prev.slice(-2), { id, text, tone }]);
    window.setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4600);
  }, []);

  const openModal = useCallback((config: Modal) => {
    opener.current = document.activeElement;
    setModal(config);
  }, []);

  const closeModal = useCallback(() => {
    setModal((prev) => { prev?.onClose?.(); return null; });
    const el = opener.current as HTMLElement | null;
    window.setTimeout(() => el?.focus?.(), 0);
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') closeModal(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [closeModal]);

  useEffect(() => { document.body.style.overflow = modal ? 'hidden' : ''; }, [modal]);

  // Move focus into the dialog and keep Tab inside it while open.
  useEffect(() => {
    if (!modal) return;
    const node = modalRef.current;
    const focusable = () => Array.from(node?.querySelectorAll<HTMLElement>(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
    ) ?? []).filter((el) => el.offsetParent !== null);
    const timer = window.setTimeout(() => {
      const target = node?.querySelector<HTMLElement>('input:not([disabled]), select:not([disabled]), textarea:not([disabled])') ?? focusable()[0] ?? node;
      target?.focus();
    }, 30);
    const onTab = (event: KeyboardEvent) => {
      if (event.key !== 'Tab' || !node) return;
      const items = focusable();
      if (!node.contains(document.activeElement)) {
        event.preventDefault();
        (items[0] ?? node).focus();
        return;
      }
      if (items.length === 0) { event.preventDefault(); node.focus(); return; }
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', onTab);
    return () => { window.clearTimeout(timer); document.removeEventListener('keydown', onTab); };
  }, [modal]);

  const value: UI = { store, notify, modal, openModal, closeModal, reset: store.reset } as UI & { reset: () => void };

  return <Ctx.Provider value={value}>
    {children}
    <div className="toast-stack" aria-live="polite">{toasts.map((t) => <div className={`toast ${t.tone === 'warn' ? 'toast-warn' : ''}`} key={t.id}><span className="toast-mark">{t.tone === 'warn' ? '!' : '✓'}</span><span>{t.text}</span><button className="toast-close" onClick={() => setToasts((prev) => prev.filter((item) => item.id !== t.id))} aria-label="Dismiss notification">×</button></div>)}</div>
    {modal && <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) closeModal(); }}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title" aria-describedby={modal.sub ? 'modal-sub' : undefined} tabIndex={-1} ref={modalRef}>
        <header className="modal-head"><div><h2 id="modal-title">{modal.title}</h2>{modal.sub && <p id="modal-sub">{modal.sub}</p>}</div><button className="icon-button" onClick={closeModal} aria-label="Close dialog">×</button></header>
        <div className="modal-body">{modal.body}</div>
      </div>
    </div>}
  </Ctx.Provider>;
}

export function useApp() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx as UI & { reset: () => void };
}