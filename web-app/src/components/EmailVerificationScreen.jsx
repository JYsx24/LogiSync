import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { sendEmailVerification } from 'firebase/auth';
import { auth } from '../firebase';

export default function EmailVerificationScreen({ user, t, onVerified, onLogout }) {
  const [checking, setChecking] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(60);
  const [notYet, setNotYet] = useState(false);

  useEffect(() => {
    const id = setInterval(() => setCooldown(c => Math.max(0, c - 1)), 1000);
    return () => clearInterval(id);
  }, []);

  const handleCheck = async () => {
    setChecking(true);
    setNotYet(false);
    try {
      await auth.currentUser.reload();
      if (auth.currentUser.emailVerified) {
        onVerified();
      } else {
        setNotYet(true);
      }
    } finally {
      setChecking(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    try {
      await sendEmailVerification(auth.currentUser);
      setCooldown(60);
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--bg)' }}>
      <motion.div
        initial={{ scale: 0.96, opacity: 0, y: 16 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className="w-full max-w-sm rounded-2xl shadow-2xl p-8 flex flex-col items-center gap-6"
        style={{ background: 'var(--surface-overlay)', border: '1px solid var(--border-strong)' }}
      >
        {/* Icon */}
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
          style={{ background: 'var(--primary-subtle)' }}>
          <svg className="w-7 h-7 text-[var(--primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
              d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>

        {/* Text */}
        <div className="text-center">
          <h2 className="text-lg font-bold text-[var(--text)]">{t('emailVerifyTitle')}</h2>
          <p className="text-sm text-[var(--text-3)] mt-2">
            {t('emailVerifySentTo')}{' '}
            <span className="font-semibold text-[var(--text-2)]">{user.email}</span>
          </p>
          <p className="text-xs text-[var(--text-3)] mt-2">{t('emailVerifyHint')}</p>
        </div>

        {/* Not verified yet warning */}
        {notYet && (
          <div className="w-full px-4 py-2.5 rounded-xl badge-danger text-xs font-medium text-center">
            {t('emailVerifyNotYet')}
          </div>
        )}

        {/* Check verification button */}
        <button onClick={handleCheck} disabled={checking}
          className="btn-primary w-full py-3 text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-60">
          {checking && <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />}
          {t('emailVerifyCheck')}
        </button>

        {/* Resend */}
        <div className="text-center text-xs text-[var(--text-3)]">
          {cooldown > 0 ? (
            <span>{t('emailVerifyResendIn').replace('{s}', cooldown)}</span>
          ) : (
            <button onClick={handleResend} disabled={resending}
              className="text-[var(--primary)] font-semibold hover:underline disabled:opacity-50">
              {resending ? t('emailVerifyResending') : t('emailVerifyResend')}
            </button>
          )}
        </div>

        {/* Sign out */}
        <button onClick={onLogout}
          className="text-xs text-[var(--text-3)] hover:text-[var(--text-2)] transition-colors underline underline-offset-2">
          {t('emailVerifyCancel')}
        </button>
      </motion.div>
    </div>
  );
}
