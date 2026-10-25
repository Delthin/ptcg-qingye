import { useEffect, useRef, type ReactNode } from 'react';

/** Native modal dialog supplies focus containment, Escape and focus restoration. */
export function DuoDialog({ title, onClose, children, className = '' }: { title: string; onClose: () => void; children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDialogElement>(null);
  // Capture before children's autoFocus runs during commit.
  const opener = useRef<HTMLElement | null>(typeof document === 'undefined' ? null : document.activeElement as HTMLElement);
  useEffect(() => {
    const dialog = ref.current;
    dialog?.showModal();
    return () => {
      if (dialog?.open) dialog.close();
      if (opener.current?.isConnected) opener.current.focus({ preventScroll: true });
    };
  }, []);
  return <dialog ref={ref} className={`duo-dialog ${className}`} aria-label={title} onCancel={event => { event.preventDefault(); onClose(); }}>
    <header><h2>{title}</h2><button type="button" className="duo-icon-button" onClick={onClose} aria-label="关闭">×</button></header>
    {children}
  </dialog>;
}
