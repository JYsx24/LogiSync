import { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const ConfirmContext = createContext(null);

export function ConfirmProvider({ children }) {
  const [state, setState] = useState(null);

  const confirm = useCallback((message) => {
    return new Promise(resolve => setState({ message, resolve }));
  }, []);

  const handle = (result) => {
    state?.resolve(result);
    setState(null);
  };

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <AnimatePresence>
        {state && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-5 bg-slate-950/85 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.92, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.92, opacity: 0, y: 10 }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
              className="glass-raised rounded-2xl p-6 w-full max-w-xs shadow-2xl"
            >
              {/* Warning icon */}
              <div className="w-10 h-10 rounded-xl bg-[var(--danger-bg)] border border-[var(--danger-border)] flex items-center justify-center mb-4">
                <svg className="w-5 h-5 text-[var(--danger)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>

              <p className="text-sm font-semibold text-[var(--text)] leading-relaxed mb-5">{state.message}</p>

              <div className="flex gap-2.5">
                <button
                  onClick={() => handle(false)}
                  className="btn-ghost flex-1 py-2.5 text-sm font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handle(true)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-[var(--danger)] hover:opacity-90 text-white transition-opacity"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </ConfirmContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useConfirm() {
  return useContext(ConfirmContext);
}
