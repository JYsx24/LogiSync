import React, { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const ToastContext = createContext(null);

const TOAST_CONFIG = {
  success: {
    bg: 'bg-[var(--surface-overlay)] border-[var(--success-border)]',
    icon: (
      <svg className="w-4 h-4 text-[var(--success)] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
      </svg>
    ),
    text: 'text-[var(--text)]',
  },
  error: {
    bg: 'bg-[var(--surface-overlay)] border-[var(--danger-border)]',
    icon: (
      <svg className="w-4 h-4 text-[var(--danger)] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
      </svg>
    ),
    text: 'text-[var(--text)]',
  },
  warning: {
    bg: 'bg-[var(--surface-overlay)] border-[var(--warning-border)]',
    icon: (
      <svg className="w-4 h-4 text-[var(--warning)] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    ),
    text: 'text-[var(--text)]',
  },
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000);
  }, []);

  return (
    <ToastContext.Provider value={addToast}>
      {children}
      <div className="fixed bottom-5 right-5 z-[100] flex flex-col gap-2 pointer-events-none max-w-xs w-full">
        <AnimatePresence>
          {toasts.map(toast => {
            const cfg = TOAST_CONFIG[toast.type] ?? TOAST_CONFIG.success;
            return (
              <motion.div
                key={toast.id}
                initial={{ opacity: 0, x: 20, scale: 0.95 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 20, scale: 0.95 }}
                transition={{ duration: 0.18 }}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl border shadow-xl backdrop-blur-xl pointer-events-auto ${cfg.bg}`}
              >
                <div className="w-6 h-6 rounded-lg bg-[var(--surface-raised)] border border-[var(--border)] flex items-center justify-center shrink-0">
                  {cfg.icon}
                </div>
                <span className={`text-sm font-medium ${cfg.text}`}>{toast.message}</span>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
