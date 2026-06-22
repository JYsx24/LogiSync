import React, { createContext, useContext, useState, useCallback } from 'react';
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
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="glass-panel rounded-2xl p-6 w-full max-w-sm border border-[var(--panel-border)] shadow-2xl"
            >
              <p className="text-sm text-[var(--text-color)] leading-relaxed mb-6">{state.message}</p>
              <div className="flex gap-3">
                <button
                  onClick={() => handle(false)}
                  className="flex-1 py-2.5 bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--text-muted)] rounded-xl text-sm font-semibold hover:bg-[var(--panel-bg)] transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handle(true)}
                  className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-semibold transition-colors"
                >
                  Confirm
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  return useContext(ConfirmContext);
}
