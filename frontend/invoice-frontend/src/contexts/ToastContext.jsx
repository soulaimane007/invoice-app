import { createContext, useCallback, useContext, useState } from 'react';
import { CheckCircle2, XCircle, AlertTriangle, X } from 'lucide-react';

const ToastContext = createContext(null);

const DEFAULT_DURATIONS = {
  success: 5000,
  error: 5000,
  warning: 9000,
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = 'success', duration) => {
    const id = Date.now() + Math.random();
    const finalDuration = duration ?? DEFAULT_DURATIONS[type] ?? 5000;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, finalDuration);
  }, []);

  const dismiss = (id) => setToasts((prev) => prev.filter((t) => t.id !== id));

  function styleFor(type) {
    if (type === 'error') return 'border-red-200 bg-red-50 text-red-800';
    if (type === 'warning') return 'border-amber-200 bg-amber-50 text-amber-800';
    return 'border-emerald-200 bg-emerald-50 text-emerald-800';
  }

  function iconFor(type) {
    if (type === 'error') return <XCircle size={16} />;
    if (type === 'warning') return <AlertTriangle size={16} />;
    return <CheckCircle2 size={16} />;
  }

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
<div className="fixed bottom-4 left-4 right-4 z-50 flex flex-col gap-2 sm:left-auto">
          {toasts.map((t) => (
          <div
            key={t.id}
            className={`flex max-w-sm items-start gap-2 rounded-lg border px-4 py-3 text-sm shadow-lg ${styleFor(t.type)}`}
          >
            {iconFor(t.type)}
            <span>{t.message}</span>
<button onClick={() => dismiss(t.id)} className="ml-auto shrink-0 opacity-60 hover:opacity-100">
                <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}