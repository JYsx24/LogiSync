import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const STEPS = (t) => [
  {
    icon: (
      <svg className="w-10 h-10" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
      </svg>
    ),
    title: t('tutorialStep1Title'),
    desc: t('tutorialStep1Desc'),
    hint: null,
  },
  {
    icon: (
      <svg className="w-10 h-10" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v4m-2-2h4" />
      </svg>
    ),
    title: t('tutorialStep2Title'),
    desc: t('tutorialStep2Desc'),
    hint: t('tutorialStep2Hint'),
  },
  {
    icon: (
      <svg className="w-10 h-10" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
      </svg>
    ),
    title: t('tutorialStep3Title'),
    desc: t('tutorialStep3Desc'),
    hint: t('tutorialStep3Hint'),
  },
  {
    icon: (
      <svg className="w-10 h-10" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 7a2 2 0 012-2h1.5M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H8.5M3 7l4.5 0M8.5 5V3m0 2h7M15.5 5v2M12 12v4m-2-2h4" />
        <circle cx="12" cy="12" r="2.5" strokeWidth="1.5" />
      </svg>
    ),
    title: t('tutorialStep4Title'),
    desc: t('tutorialStep4Desc'),
    hint: t('tutorialStep4Hint'),
  },
  {
    icon: (
      <svg className="w-10 h-10" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
      </svg>
    ),
    title: t('tutorialStep5Title'),
    desc: t('tutorialStep5Desc'),
    hint: t('tutorialStep5Hint'),
  },
];

export default function TutorialModal({ onClose, t }) {
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);
  const [dontShow, setDontShow] = useState(false);

  const steps = STEPS(t);
  const isLast = step === steps.length - 1;
  const cur = steps[step];

  const go = (next) => {
    setDir(next > step ? 1 : -1);
    setStep(next);
  };

  const close = () => {
    if (dontShow) localStorage.setItem('logisync_tutorial_seen', 'true');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}>
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className="relative w-full max-w-md rounded-2xl overflow-hidden"
        style={{ background: 'var(--surface-overlay)', border: '1px solid var(--border-strong)' }}>

        {/* Teal glow top */}
        <div className="absolute pointer-events-none" style={{ top: -60, right: -40, width: 240, height: 240, borderRadius: '50%', background: 'radial-gradient(circle, rgba(20,184,166,0.22) 0%, transparent 70%)', filter: 'blur(40px)' }} />

        {/* Progress bar */}
        <div className="h-1 w-full" style={{ background: 'var(--border)' }}>
          <motion.div className="h-full rounded-r-full"
            style={{ background: 'linear-gradient(90deg, #0d9488, #14b8a6)' }}
            animate={{ width: `${((step + 1) / steps.length) * 100}%` }}
            transition={{ duration: 0.35, ease: 'easeOut' }} />
        </div>

        <div className="p-8 relative">
          {/* Close */}
          <button onClick={close}
            className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-xl transition-colors"
            style={{ background: 'var(--input-bg)', color: 'var(--text-3)' }}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Step content */}
          <AnimatePresence mode="wait" custom={dir}>
            <motion.div key={step}
              custom={dir}
              variants={{
                enter: (d) => ({ opacity: 0, x: d * 32 }),
                center: { opacity: 1, x: 0 },
                exit: (d) => ({ opacity: 0, x: -d * 32 }),
              }}
              initial="enter" animate="center" exit="exit"
              transition={{ duration: 0.22, ease: 'easeOut' }}
              className="flex flex-col items-center text-center gap-3 mb-8">

              {/* Icon orb */}
              <div className="w-20 h-20 rounded-2xl flex items-center justify-center mb-1 relative"
                style={{ background: 'radial-gradient(circle, rgba(20,184,166,0.18) 0%, rgba(20,184,166,0.05) 100%)', border: '1px solid rgba(20,184,166,0.25)' }}>
                <span style={{ color: '#14b8a6' }}>{cur.icon}</span>
              </div>

              {/* Step counter */}
              <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#14b8a6' }}>
                {t('tutorialStepOf').replace('{n}', step + 1).replace('{total}', steps.length)}
              </p>

              <h2 className="text-xl font-black" style={{ color: 'var(--text)' }}>{cur.title}</h2>
              <p className="text-sm leading-relaxed max-w-[320px]" style={{ color: 'var(--text-2)' }}>{cur.desc}</p>

              {cur.hint && (
                <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium mt-1"
                  style={{ background: 'rgba(20,184,166,0.1)', border: '1px solid rgba(20,184,166,0.2)', color: '#14b8a6' }}>
                  <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {cur.hint}
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Step dots */}
          <div className="flex justify-center gap-2 mb-6">
            {steps.map((_, i) => (
              <button key={i} onClick={() => go(i)}
                className="rounded-full transition-all duration-300"
                style={{
                  width: i === step ? 20 : 8, height: 8,
                  background: i === step ? '#14b8a6' : 'var(--border-strong)',
                }} />
            ))}
          </div>

          {/* Don't show again */}
          <div className="flex items-center gap-2.5 mb-5">
            <input type="checkbox" id="tut-dont-show" checked={dontShow} onChange={e => setDontShow(e.target.checked)}
              className="w-4 h-4 rounded cursor-pointer accent-[#14b8a6]" />
            <label htmlFor="tut-dont-show" className="text-sm cursor-pointer select-none font-medium"
              style={{ color: 'var(--text-2)' }}>
              {t('tutorialDontShow')}
            </label>
          </div>

          {/* Navigation */}
          <div className="flex gap-2">
            {step > 0 && (
              <button onClick={() => go(step - 1)}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold btn-ghost">
                {t('tutorialPrev')}
              </button>
            )}
            <button onClick={isLast ? close : () => go(step + 1)}
              className="flex-1 py-2.5 rounded-xl text-sm font-bold btn-primary">
              {isLast ? t('tutorialFinish') : t('tutorialNext')}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
