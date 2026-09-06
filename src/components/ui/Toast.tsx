'use client';

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { Icon } from '@/components/media/Icon';
import { clsx } from '@/lib/clsx';

type ToastTone = 'success' | 'info';

interface ToastInput {
  message: string;
  tone?: ToastTone;
}

interface ToastItem extends Required<ToastInput> {
  id: number;
}

interface ToastContextValue {
  toast: (input: string | ToastInput) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);
const TOAST_DURATION_MS = 4_000;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const nextId = useRef(0);

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((item) => item.id !== id));
  }, []);

  const toast = useCallback((input: string | ToastInput) => {
    const item = typeof input === 'string' ? { message: input, tone: 'success' as const } : input;
    const id = nextId.current++;
    setToasts((current) => [
      ...current,
      { id, message: item.message, tone: item.tone ?? 'success' },
    ]);
  }, []);

  useEffect(() => {
    function dismissNewest(event: KeyboardEvent) {
      if (event.key !== 'Escape') return;
      setToasts((current) => current.slice(0, -1));
    }

    window.addEventListener('keydown', dismissNewest);
    return () => window.removeEventListener('keydown', dismissNewest);
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <ol
        aria-label="Notifications"
        className="fixed top-[84px] right-margin-mobile md:right-margin-desktop z-[120] flex w-[min(22rem,calc(100vw-2rem))] flex-col gap-sm pointer-events-none"
      >
        {toasts.map((item) => (
          <ToastMessage key={item.id} item={item} onDismiss={dismiss} />
        ))}
      </ol>
    </ToastContext.Provider>
  );
}

function ToastMessage({
  item,
  onDismiss,
}: {
  item: ToastItem;
  onDismiss: (id: number) => void;
}) {
  useEffect(() => {
    const timeout = window.setTimeout(() => onDismiss(item.id), TOAST_DURATION_MS);
    return () => window.clearTimeout(timeout);
  }, [item.id, onDismiss]);

  return (
    <li
      role="status"
      className={clsx(
        'pointer-events-auto flex items-start gap-sm rounded-lg border p-md shadow-ambient-card animate-fade-in-up',
        item.tone === 'success'
          ? 'border-primary/25 bg-surface-container-lowest text-on-surface'
          : 'border-surface-container-highest bg-surface-container-lowest text-on-surface'
      )}
    >
      <Icon
        name={item.tone === 'success' ? 'check_circle' : 'info'}
        filled
        className={clsx(
          'mt-0.5 shrink-0 text-[20px]',
          item.tone === 'success' ? 'text-primary' : 'text-on-surface-variant'
        )}
      />
      <p className="min-w-0 flex-1 font-body-sm text-body-sm font-semibold">{item.message}</p>
      <button
        type="button"
        onClick={() => onDismiss(item.id)}
        aria-label="Dismiss notification"
        className="-m-1 rounded-full p-1 text-on-surface-variant hover:bg-surface-container focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        <Icon name="close" className="text-[18px]" />
      </button>
    </li>
  );
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within ToastProvider');
  return context;
}
