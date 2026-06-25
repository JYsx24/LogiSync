import React, { useState, useEffect } from 'react';
import {
  signInWithEmailAndPassword, createUserWithEmailAndPassword,
  signOut, onAuthStateChanged,
} from 'firebase/auth';
import {
  collection, addDoc, updateDoc, deleteDoc,
  setDoc, doc, onSnapshot, increment,
  serverTimestamp, query, where,
} from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import { auth, db } from './firebase';

import { ToastProvider, useToast } from './components/Toast';
import { ConfirmProvider, useConfirm } from './components/ConfirmDialog';
import DashboardStats from './components/DashboardStats';
import SortBar, { applySort } from './components/SortBar';
import FolderSidebar from './components/FolderSidebar';
import InventoryCard from './components/InventoryCard';
import AddEditModal from './components/AddEditModal';

const translations = {
  en: {
    dashboard: 'Dashboard', profile: 'Profile', settings: 'Settings', logout: 'Sign Out',
    searchPlaceholder: 'Search by name or location…',
    registerSKU: 'Add Stock', noInventory: 'No Items Found',
    emptyFolder: 'This folder is empty or no items match your search.',
    emptyInventory: 'Your inventory is empty',
    emptyInventoryHint: 'Start by registering your first stock item.',
    operator: 'Operator', folders: 'Folders', allStock: 'All Stock',
    uncategorized: 'Uncategorized', customFolders: 'Custom Folders',
    createNewFolder: 'New Folder', folderPlaceholder: 'Folder name…',
    profileHeader: 'Operator Profile', registeredEmail: 'Email Address',
    displayName: 'Display Name', displayNamePlaceholder: 'Your name…',
    saveProfile: 'Save Changes', savingProfile: 'Saving…',
    profileUpdatedSuccess: 'Profile saved!', profileUpdatedError: 'Failed to save profile.',
    themeLabel: 'Appearance', langLabel: 'Language',
    lightMode: 'Light', darkMode: 'Dark',
    english: 'English', chinese: '中文',
    cancel: 'Cancel', commitStock: 'Save',
    editingStock: 'Edit Item',
    changeLogHistory: 'Change History',
    createSKUToLog: 'History will appear here after saving.',
    noChangesLogged: 'No changes recorded yet.',
    itemName: 'Item Name', storageLocation: 'Location', quantity: 'Quantity',
    associateFolder: 'Folder', stockPhoto: 'Photo',
    photoUrlActive: 'Current photo saved',
    deleteStock: 'Delete', adjust: 'Adjust',
    inStock: 'In Stock', units: 'units', editState: 'Edit', closeEdit: 'Done',
    loadingSession: 'Loading…',
    appName: 'LogiSync', opsCenter: 'Cloud Inventory',
    loginSubmit: 'Sign In', signupSubmit: 'Create Account',
    switchSignup: "Don't have an account? Sign up",
    switchLogin: 'Already have an account? Sign in',
    lowStockThreshold: 'Low Stock Alert',
    exportCSV: 'Export CSV',
    statTotalSKUs: 'Total SKUs', statTotalUnits: 'Total Units',
    statLowStock: 'Low Stock', statOutOfStock: 'Out of Stock',
    authHeadline: 'Smart inventory,\nsimplified.',
    authSub: 'Real-time cloud sync across all your devices.',
    authFeature1: 'Real-time Firestore sync',
    authFeature2: 'Low-stock alerts & CSV export',
    authFeature3: 'Multi-folder organisation',
  },
  zh: {
    dashboard: '仪表板', profile: '个人资料', settings: '设置', logout: '退出',
    searchPlaceholder: '搜索名称或位置…',
    registerSKU: '添加库存', noInventory: '未找到商品',
    emptyFolder: '此文件夹为空或无匹配商品。',
    emptyInventory: '库存为空',
    emptyInventoryHint: '从添加第一件库存商品开始。',
    operator: '操作员', folders: '文件夹', allStock: '全部库存',
    uncategorized: '未分类', customFolders: '自定义文件夹',
    createNewFolder: '新建文件夹', folderPlaceholder: '文件夹名称…',
    profileHeader: '操作员资料', registeredEmail: '电子邮箱',
    displayName: '显示名称', displayNamePlaceholder: '您的名称…',
    saveProfile: '保存修改', savingProfile: '保存中…',
    profileUpdatedSuccess: '资料已保存！', profileUpdatedError: '保存失败。',
    themeLabel: '外观', langLabel: '语言',
    lightMode: '浅色', darkMode: '深色',
    english: 'English', chinese: '中文',
    cancel: '取消', commitStock: '保存',
    editingStock: '编辑商品',
    changeLogHistory: '变更历史',
    createSKUToLog: '保存后此处将显示历史记录。',
    noChangesLogged: '暂无变更记录。',
    itemName: '商品名称', storageLocation: '存放位置', quantity: '数量',
    associateFolder: '文件夹', stockPhoto: '商品图片',
    photoUrlActive: '当前图片已保存',
    deleteStock: '删除', adjust: '调整',
    inStock: '当前库存', units: '件', editState: '编辑', closeEdit: '完成',
    loadingSession: '加载中…',
    appName: 'LogiSync', opsCenter: '云端库存',
    loginSubmit: '登录', signupSubmit: '注册账户',
    switchSignup: '没有账户？立即注册',
    switchLogin: '已有账户？立即登录',
    lowStockThreshold: '低库存预警',
    exportCSV: '导出CSV',
    statTotalSKUs: '商品总数', statTotalUnits: '总库存量',
    statLowStock: '低库存', statOutOfStock: '缺货',
    authHeadline: '智能库存，\n简单高效。',
    authSub: '实时云端同步，随处可用。',
    authFeature1: 'Firestore 实时同步',
    authFeature2: '低库存预警与CSV导出',
    authFeature3: '多文件夹管理',
  },
};

function exportToCSV(items, folders) {
  const header = ['Name', 'Location', 'Quantity', 'Folder', 'Low Stock Alert'];
  const rows = items.map(item => {
    const folder = folders.find(f => f.id === item.folderId)?.name || 'Uncategorized';
    return [`"${item.name}"`, `"${item.location}"`, item.quantity, `"${folder}"`, item.lowStockThreshold ?? 5].join(',');
  });
  const csv = [header.join(','), ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `logisync-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

/* ── Auth feature bullet ──────────────────────────────────── */
function FeatureBullet({ icon, label }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 rounded-lg bg-white/10 border border-white/15 flex items-center justify-center shrink-0">
        {icon}
      </div>
      <span className="text-sm text-white/75 font-medium">{label}</span>
    </div>
  );
}

/* ── Mobile folder chip ───────────────────────────────────── */
function FolderChip({ label, count, color, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all"
      style={active ? {
        background: color ? `${color}22` : 'var(--primary-glow)',
        color: color || 'var(--primary)',
        borderColor: color ? `${color}55` : 'var(--primary)',
      } : {
        background: 'transparent',
        color: 'var(--text-2)',
        borderColor: 'var(--border)',
      }}
    >
      {color && <span className="w-2 h-2 rounded-full shrink-0" style={{ background: color }} />}
      <span className="max-w-[72px] truncate">{label}</span>
      <span style={{ opacity: 0.55, fontWeight: 400 }}>{count}</span>
    </button>
  );
}

/* ── Nav tab ──────────────────────────────────────────────── */
function NavTab({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`relative px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
        active
          ? 'bg-[var(--primary)] text-zinc-900 shadow-lg shadow-[var(--primary-glow)]'
          : 'text-[var(--text-2)] hover:text-[var(--text)] hover:bg-[var(--surface-raised)]'
      }`}
    >
      {label}
    </button>
  );
}

/* ── Main App inner ───────────────────────────────────────── */
function AppInner() {
  const toast = useToast();
  const confirm = useConfirm();

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [profileName, setProfileName] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  const [language, setLanguage] = useState(() => localStorage.getItem('app_lang') || 'en');
  const [theme, setTheme] = useState(() => localStorage.getItem('app_theme') || 'dark');
  const [isGridView, setIsGridView] = useState(() => localStorage.getItem('app_layout_grid') !== 'false');
  const [sortKey, setSortKey] = useState('name-asc');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  const [folders, setFolders] = useState([]);
  const [activeFolderId, setActiveFolderId] = useState('all');
  const [newFolderName, setNewFolderName] = useState('');
  const [items, setItems] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [scrolled, setScrolled] = useState(false);
  const [statsScrolled, setStatsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const t = key => translations[language]?.[key] ?? translations.en[key] ?? key;

  useEffect(() => { localStorage.setItem('app_lang', language); }, [language]);
  useEffect(() => {
    localStorage.setItem('app_theme', theme);
    document.documentElement.classList.toggle('light', theme === 'light');
  }, [theme]);
  useEffect(() => { localStorage.setItem('app_layout_grid', isGridView); }, [isGridView]);

  useEffect(() => onAuthStateChanged(auth, u => { setUser(u); setLoading(false); }), []);

  useEffect(() => {
    if (!user) { setProfileName(''); return; }
    return onSnapshot(doc(db, 'users', user.uid), snap => {
      if (snap.exists()) setProfileName(snap.data().name || '');
    });
  }, [user]);

  useEffect(() => {
    if (!user) { setFolders([]); return; }
    return onSnapshot(query(collection(db, 'folders'), where('uid', '==', user.uid)), snap =>
      setFolders(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
  }, [user]);

  useEffect(() => {
    if (!user) { setItems([]); return; }
    return onSnapshot(query(collection(db, 'inventory'), where('uid', '==', user.uid)), snap =>
      setItems(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
  }, [user]);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      const s = y > 20;
      const ss = y > 200;
      setScrolled(s);
      setStatsScrolled(ss);
      const baseH = s ? '2.5rem' : '3.5rem';
      document.documentElement.style.setProperty('--header-h', baseH);
      document.documentElement.style.setProperty('--sticky-top', ss ? `calc(${baseH} + 62px)` : baseH);
    };
    document.documentElement.style.setProperty('--header-h', '3.5rem');
    document.documentElement.style.setProperty('--sticky-top', '3.5rem');
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleAuth = async (e) => {
    e.preventDefault();
    setAuthError('');
    setAuthLoading(true);
    try {
      if (isSignUp) {
        const { user: u } = await createUserWithEmailAndPassword(auth, email, password);
        await setDoc(doc(db, 'users', u.uid), { email: u.email, createdAt: serverTimestamp(), role: 'operator', name: '' });
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (err) {
      setAuthError(err.message.replace('Firebase: ', '').replace(/\s*\(.*\)\.?\s*$/, ''));
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => { signOut(auth); setCurrentTab('dashboard'); };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      await setDoc(doc(db, 'users', user.uid), { name: profileName.trim(), email: user.email, role: 'operator' }, { merge: true });
      toast(t('profileUpdatedSuccess'));
    } catch { toast(t('profileUpdatedError'), 'error'); }
    finally { setSavingProfile(false); }
  };

  const handleCreateFolder = async (e) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;
    try {
      await addDoc(collection(db, 'folders'), { name: newFolderName.trim(), uid: user.uid, createdBy: user.uid, createdAt: serverTimestamp() });
      setNewFolderName('');
    } catch (err) { console.error(err); }
  };

  const adjustQuantity = async (itemId, amount, targetQty) => {
    const current = items.find(i => i.id === itemId);
    if (!current) return;
    const newQty = targetQty !== undefined ? targetQty : current.quantity + amount;
    if (newQty < 0) return;
    const delta = newQty - current.quantity;
    if (delta === 0) return;
    try {
      await updateDoc(doc(db, 'inventory', itemId), { quantity: increment(delta) });
      await addDoc(collection(db, 'inventory', itemId, 'history'), {
        quantity: newQty,
        timestamp: serverTimestamp(),
        operator: user.email,
        action: delta > 0 ? `+${delta}` : `${delta}`,
      });
    } catch (err) { console.error(err); }
  };

  const handleDeleteItem = async (itemId, itemName) => {
    const ok = await confirm(`Remove "${itemName}" from inventory?`);
    if (!ok) return;
    try {
      await deleteDoc(doc(db, 'inventory', itemId));
      toast('Item removed');
    } catch { toast('Failed to remove item', 'error'); }
  };

  const filteredItems = applySort(
    items.filter(item => {
      const q = searchQuery.toLowerCase();
      const match = item.name.toLowerCase().includes(q) || item.location.toLowerCase().includes(q);
      if (!match) return false;
      if (activeFolderId === 'all') return true;
      if (activeFolderId === 'uncategorized') return !item.folderId;
      return item.folderId === activeFolderId;
    }),
    sortKey,
  );

  /* ── Loading ── */
  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-[3px] border-teal-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-[var(--text-2)] font-medium">{t('loadingSession')}</p>
        </div>
      </div>
    );
  }

  /* ── Auth ── */
  if (!user) {
    return (
      <div className="min-h-screen bg-[var(--bg)] flex">
        {/* Left branding panel — hidden on mobile */}
        <div className="hidden lg:flex flex-col w-[480px] shrink-0 relative overflow-hidden p-12 bg-gradient-to-br from-teal-950 via-cyan-950 to-zinc-950">
          {/* Background glow orbs */}
          <div className="absolute top-1/4 -left-16 w-80 h-80 bg-teal-600/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-1/4 right-0 w-64 h-64 bg-cyan-600/15 rounded-full blur-3xl pointer-events-none" />

          {/* Logo */}
          <div className="flex items-center gap-3 mb-16">
            <svg width="42" height="38" viewBox="0 0 100 90" xmlns="http://www.w3.org/2000/svg">
              <polygon points="50,8 82,26 50,44 18,26" fill="#2dd4bf"/>
              <polygon points="18,26 50,44 50,80 18,62" fill="#0d9488"/>
              <polygon points="50,44 82,26 82,62 50,80" fill="#0369a1"/>
              <line x1="50" y1="8" x2="82" y2="26" stroke="rgba(255,255,255,.3)" strokeWidth="1"/>
              <line x1="50" y1="8" x2="18" y2="26" stroke="rgba(255,255,255,.15)" strokeWidth="1"/>
            </svg>
            <span className="text-white font-bold text-lg tracking-tight">LogiSync</span>
          </div>

          {/* Headline */}
          <div className="mb-10">
            <h1 className="text-4xl font-black text-white leading-tight mb-3" style={{ whiteSpace: 'pre-line' }}>
              {t('authHeadline')}
            </h1>
            <p className="text-base text-white/55 font-medium">{t('authSub')}</p>
          </div>

          {/* Features */}
          <div className="flex flex-col gap-4">
            <FeatureBullet
              label={t('authFeature1')}
              icon={<svg className="w-4 h-4 text-teal-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>}
            />
            <FeatureBullet
              label={t('authFeature2')}
              icon={<svg className="w-4 h-4 text-teal-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>}
            />
            <FeatureBullet
              label={t('authFeature3')}
              icon={<svg className="w-4 h-4 text-teal-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg>}
            />
          </div>

          <div className="mt-auto pt-10 text-[11px] text-white/25 font-medium">Powered by Firebase · React 19</div>
        </div>

        {/* Right form panel */}
        <div className="flex-1 flex items-center justify-center p-6 sm:p-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="w-full max-w-sm"
          >
            {/* Mobile logo */}
            <div className="flex items-center gap-2.5 mb-8 lg:hidden">
              <svg width="32" height="29" viewBox="0 0 100 90" xmlns="http://www.w3.org/2000/svg">
                <polygon points="50,8 82,26 50,44 18,26" fill="#2dd4bf"/>
                <polygon points="18,26 50,44 50,80 18,62" fill="#0d9488"/>
                <polygon points="50,44 82,26 82,62 50,80" fill="#0369a1"/>
                <line x1="50" y1="8" x2="82" y2="26" stroke="rgba(255,255,255,.22)" strokeWidth="1"/>
                <line x1="50" y1="8" x2="18" y2="26" stroke="rgba(255,255,255,.11)" strokeWidth="1"/>
              </svg>
              <span className="text-[var(--text)] font-bold text-base tracking-tight">LogiSync</span>
            </div>

            <h2 className="text-2xl font-bold text-[var(--text)] mb-1">
              {isSignUp ? 'Create your account' : 'Welcome back'}
            </h2>
            <p className="text-sm text-[var(--text-2)] mb-8">
              {isSignUp ? 'Start managing inventory in seconds.' : 'Sign in to access your inventory.'}
            </p>

            <form onSubmit={handleAuth} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[var(--text-2)] uppercase tracking-wider mb-1.5">Email</label>
                <input
                  id="auth-email-input" type="email" required
                  className="field w-full px-4 py-3 text-sm"
                  placeholder="you@company.com"
                  value={email} onChange={e => setEmail(e.target.value)}
                  autoComplete="email"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[var(--text-2)] uppercase tracking-wider mb-1.5">Password</label>
                <input
                  id="auth-password-input" type="password" required
                  className="field w-full px-4 py-3 text-sm"
                  placeholder="••••••••"
                  value={password} onChange={e => setPassword(e.target.value)}
                  autoComplete={isSignUp ? 'new-password' : 'current-password'}
                />
              </div>

              <AnimatePresence>
                {authError && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 py-3 rounded-xl badge-danger text-xs font-medium">{authError}</div>
                  </motion.div>
                )}
              </AnimatePresence>

              <button
                id="auth-submit-btn" type="submit" disabled={authLoading}
                className="btn-primary w-full py-3 text-sm mt-2 disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {authLoading && <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />}
                {isSignUp ? t('signupSubmit') : t('loginSubmit')}
              </button>
            </form>

            <div className="mt-6 text-center">
              <button
                onClick={() => { setIsSignUp(!isSignUp); setAuthError(''); }}
                className="text-xs text-[var(--text-2)] hover:text-[var(--primary)] transition-colors font-medium"
              >
                {isSignUp ? t('switchLogin') : t('switchSignup')}
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  /* ── Logged-in shell ── */
  const displayName = profileName || user.email.split('@')[0];

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-[var(--border)] backdrop-blur-xl transition-all duration-200" style={{ background: 'var(--header)' }}>
        <div className={`max-w-screen-xl mx-auto px-4 sm:px-6 flex items-center justify-between gap-4 transition-all duration-200 ${scrolled ? 'h-10' : 'h-14'}`}>
          {/* Brand */}
          <div className="flex items-center gap-2.5 shrink-0">
            <svg width="30" height="27" viewBox="0 0 100 90" xmlns="http://www.w3.org/2000/svg">
              <polygon points="50,8 82,26 50,44 18,26" fill="#2dd4bf"/>
              <polygon points="18,26 50,44 50,80 18,62" fill="#0d9488"/>
              <polygon points="50,44 82,26 82,62 50,80" fill="#0369a1"/>
              <line x1="50" y1="8" x2="82" y2="26" stroke="rgba(255,255,255,.22)" strokeWidth="1"/>
              <line x1="50" y1="8" x2="18" y2="26" stroke="rgba(255,255,255,.11)" strokeWidth="1"/>
            </svg>
            <span className="font-bold text-sm text-[var(--text)] tracking-tight">{t('appName')}</span>
            <span className="lg:hidden text-xs text-[var(--text-3)] font-medium">· {t(currentTab)}</span>
          </div>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-1 bg-[var(--input-bg)] border border-[var(--input-border)] rounded-xl p-1">
            {['dashboard', 'profile', 'settings'].map(tab => (
              <NavTab key={tab} label={t(tab)} active={currentTab === tab} onClick={() => setCurrentTab(tab)} />
            ))}
          </nav>

          {/* User + logout + mobile hamburger */}
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="hidden sm:flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-teal-500 to-sky-500 flex items-center justify-center text-white text-[10px] font-bold uppercase">
                {displayName.charAt(0)}
              </div>
              <span className="hidden lg:block text-xs font-medium text-[var(--text-2)] max-w-[100px] truncate">{displayName}</span>
            </div>
            {/* Desktop logout */}
            <button onClick={handleLogout} className="hidden lg:block btn-ghost px-3 py-1.5 text-xs font-semibold">
              {t('logout')}
            </button>
            {/* Mobile hamburger */}
            <button
              className="lg:hidden w-9 h-9 flex items-center justify-center rounded-xl bg-[var(--input-bg)] border border-[var(--input-border)] transition-colors hover:border-[var(--border-strong)]"
              onClick={() => setMobileMenuOpen(v => !v)}
              aria-label="Menu"
            >
              <AnimatePresence mode="wait" initial={false}>
                {mobileMenuOpen ? (
                  <motion.svg key="x" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }}
                    transition={{ duration: 0.13 }} className="w-4 h-4 text-[var(--text-2)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                  </motion.svg>
                ) : (
                  <motion.svg key="menu" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }}
                    transition={{ duration: 0.13 }} className="w-4 h-4 text-[var(--text-2)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                  </motion.svg>
                )}
              </AnimatePresence>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile nav dropdown */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <div className="lg:hidden fixed inset-0 z-[35] bg-black/50 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />
            <motion.div
              key="mobile-nav"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
              className="lg:hidden fixed left-0 right-0 z-40"
              style={{ top: 'var(--header-h)', background: 'var(--surface-overlay)', borderBottom: '1px solid var(--border)' }}
            >
              <div className="max-w-screen-xl mx-auto p-3 flex flex-col gap-1">
                {[
                  { id: 'dashboard', icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z' },
                  { id: 'profile', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
                  { id: 'settings', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z' },
                ].map(({ id, icon }) => (
                  <button key={id}
                    onClick={() => { setCurrentTab(id); setMobileMenuOpen(false); }}
                    className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-semibold transition-colors ${
                      currentTab === id
                        ? 'bg-[var(--primary-glow)] text-[var(--primary)]'
                        : 'text-[var(--text-2)] hover:bg-[var(--surface-raised)] hover:text-[var(--text)]'
                    }`}
                  >
                    <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={icon} />
                    </svg>
                    {t(id)}
                    {currentTab === id && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[var(--primary)]" />}
                  </button>
                ))}
                <div className="border-t border-[var(--border)] my-1" />
                <button
                  onClick={() => { handleLogout(); setMobileMenuOpen(false); }}
                  className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-semibold text-[var(--danger)] hover:bg-[var(--danger-bg)] transition-colors"
                >
                  <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  {t('logout')}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>


      {/* Compact stats strip — fixed overlay, desktop only, no layout impact */}
      <AnimatePresence>
        {statsScrolled && currentTab === 'dashboard' && (
          <motion.div
            key="compact-strip"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="hidden lg:block fixed left-0 right-0 z-30 border-b border-[var(--border)]"
            style={{
              top: 'var(--header-h)',
              background: 'var(--header)',
              backdropFilter: 'blur(20px) saturate(160%)',
              WebkitBackdropFilter: 'blur(20px) saturate(160%)',
            }}
          >
            <div className="max-w-screen-xl mx-auto px-4 sm:px-6 py-2">
              <DashboardStats items={items} compact={true} t={t} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile folder strip — sticky, only on dashboard */}
      {currentTab === 'dashboard' && (
        <div
          className="lg:hidden sticky z-20 border-b border-[var(--border)]"
          style={{ top: 'var(--header-h)', background: 'var(--header)', backdropFilter: 'blur(20px) saturate(160%)', WebkitBackdropFilter: 'blur(20px) saturate(160%)' }}
        >
          <div className="flex items-center gap-2 px-3 py-2.5 overflow-x-auto" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            <FolderChip label={t('allStock')} count={items.length} color={null} active={activeFolderId === 'all'} onClick={() => setActiveFolderId('all')} />
            <FolderChip label={t('uncategorized')} count={items.filter(i => !i.folderId).length} color={null} active={activeFolderId === 'uncategorized'} onClick={() => setActiveFolderId('uncategorized')} />
            {folders.map(f => (
              <FolderChip key={f.id} label={f.name} count={items.filter(i => i.folderId === f.id).length} color={f.color} active={activeFolderId === f.id} onClick={() => setActiveFolderId(f.id)} />
            ))}
          </div>
        </div>
      )}

      {/* Main */}
      <main className="flex-1 max-w-screen-xl w-full mx-auto px-4 sm:px-6 py-6">
        <AnimatePresence mode="wait">

          {/* ── Dashboard ── */}
          {currentTab === 'dashboard' && (
            <motion.div key="dash" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.2 }}
              className="flex flex-col lg:flex-row gap-6">

              <FolderSidebar
                folders={folders} items={items}
                activeFolderId={activeFolderId} setActiveFolderId={setActiveFolderId}
                newFolderName={newFolderName} setNewFolderName={setNewFolderName}
                handleCreateFolder={handleCreateFolder} t={t}
              />

              <div className="flex-1 min-w-0 flex flex-col gap-5">
                <DashboardStats items={items} compact={false} t={t} />

                {/* Toolbar */}
                <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
                  {/* Search */}
                  <div className="relative flex-1 min-w-0">
                    <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-3)] pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                      id="search-input" type="text" placeholder={t('searchPlaceholder')}
                      value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                      className="field w-full pl-10 pr-4 py-2.5 text-sm rounded-xl"
                    />
                  </div>

                  {/* Controls */}
                  <div className="flex items-center gap-2 shrink-0 flex-wrap">
                    <SortBar sortKey={sortKey} setSortKey={setSortKey} />

                    {/* Grid/List toggle */}
                    <div className="flex bg-[var(--input-bg)] border border-[var(--input-border)] rounded-xl p-0.5">
                      {[
                        { grid: true,  icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /> },
                        { grid: false, icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" /> },
                      ].map(({ grid, icon }) => (
                        <button key={String(grid)} onClick={() => setIsGridView(grid)}
                          className={`p-2 rounded-lg transition-all ${isGridView === grid ? 'bg-[var(--primary)] text-white shadow-sm' : 'text-[var(--text-3)] hover:text-[var(--text)]'}`}>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">{icon}</svg>
                        </button>
                      ))}
                    </div>

                    {/* Export */}
                    <button
                      onClick={() => exportToCSV(filteredItems, folders)}
                      className="btn-ghost px-3 py-2 text-xs font-semibold flex items-center gap-1.5"
                      title={t('exportCSV')}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span className="hidden sm:inline">{t('exportCSV')}</span>
                    </button>

                    {/* Add */}
                    <button
                      id="add-item-btn"
                      onClick={() => { setEditingItem(null); setIsModalOpen(true); }}
                      className="btn-primary px-4 py-2 text-sm flex items-center gap-1.5"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
                      </svg>
                      {t('registerSKU')}
                    </button>
                  </div>
                </div>

                {/* Inventory grid / empty */}
                {filteredItems.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="flex-1 flex flex-col items-center justify-center py-20 glass rounded-2xl"
                  >
                    <div className="w-16 h-16 rounded-2xl bg-[var(--surface-raised)] border border-[var(--border-strong)] flex items-center justify-center mb-4">
                      <svg className="w-8 h-8 text-[var(--text-3)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                    </div>
                    <h3 className="text-base font-bold text-[var(--text)] mb-1">
                      {items.length === 0 ? t('emptyInventory') : t('noInventory')}
                    </h3>
                    <p className="text-sm text-[var(--text-2)] mb-5">
                      {items.length === 0 ? t('emptyInventoryHint') : t('emptyFolder')}
                    </p>
                    {items.length === 0 && (
                      <button onClick={() => { setEditingItem(null); setIsModalOpen(true); }} className="btn-primary px-5 py-2.5 text-sm flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" /></svg>
                        {t('registerSKU')}
                      </button>
                    )}
                  </motion.div>
                ) : (
                  <div
                    className={isGridView
                      ? 'grid grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-5'
                      : 'flex flex-col gap-3'}
                  >
                    <AnimatePresence>
                      {filteredItems.map(item => (
                        <InventoryCard
                          key={item.id} item={item} folders={folders}
                          adjustQuantity={adjustQuantity}
                          openEditModal={item => { setEditingItem(item); setIsModalOpen(true); }}
                          handleDeleteItem={handleDeleteItem}
                          isGridView={isGridView} t={t}
                        />
                      ))}
                    </AnimatePresence>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* ── Profile ── */}
          {currentTab === 'profile' && (
            <motion.div key="profile" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.2 }}
              className="max-w-md mx-auto">
              <div className="glass rounded-2xl p-7">
                <h2 className="text-base font-bold text-[var(--text)] mb-6">{t('profileHeader')}</h2>
                <form onSubmit={handleSaveProfile} className="space-y-5">
                  <div>
                    <label className="block text-xs font-semibold text-[var(--text-2)] uppercase tracking-wider mb-1.5">{t('registeredEmail')}</label>
                    <input type="email" disabled value={user.email}
                      className="field w-full px-4 py-2.5 text-sm opacity-50 cursor-not-allowed" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[var(--text-2)] uppercase tracking-wider mb-1.5">{t('displayName')}</label>
                    <input id="profile-name-input" type="text" required placeholder={t('displayNamePlaceholder')}
                      value={profileName} onChange={e => setProfileName(e.target.value)}
                      className="field w-full px-4 py-2.5 text-sm" />
                  </div>
                  <div className="flex gap-3 pt-2 border-t border-[var(--border)]">
                    <button id="profile-save-btn" type="submit" disabled={savingProfile}
                      className="btn-primary px-5 py-2.5 text-sm flex-1 disabled:opacity-60">
                      {savingProfile ? t('savingProfile') : t('saveProfile')}
                    </button>
                    <button type="button" onClick={handleLogout}
                      className="px-5 py-2.5 rounded-xl text-sm font-semibold border border-[var(--danger-border)] text-[var(--danger)] hover:bg-[var(--danger-bg)] transition-colors">
                      {t('logout')}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          )}

          {/* ── Settings ── */}
          {currentTab === 'settings' && (
            <motion.div key="settings" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.2 }}
              className="max-w-md mx-auto">
              <div className="glass rounded-2xl p-7 space-y-7">
                <h2 className="text-base font-bold text-[var(--text)]">{t('settings')}</h2>

                {[
                  {
                    label: t('themeLabel'),
                    options: [['light', '☀️ ' + t('lightMode'), theme], ['dark', '🌙 ' + t('darkMode'), theme]],
                    current: theme, setter: setTheme,
                  },
                  {
                    label: t('langLabel'),
                    options: [['en', t('english'), language], ['zh', t('chinese'), language]],
                    current: language, setter: setLanguage,
                  },
                ].map(group => (
                  <div key={group.label}>
                    <label className="block text-xs font-semibold text-[var(--text-2)] uppercase tracking-wider mb-3">{group.label}</label>
                    <div className="grid grid-cols-2 gap-3">
                      {group.options.map(([val, label]) => (
                        <button key={val} onClick={() => group.setter(val)}
                          className={`py-3 px-4 rounded-xl border text-sm font-semibold transition-all ${
                            group.current === val
                              ? 'bg-[var(--primary)] text-white border-[var(--primary)] shadow-md shadow-[var(--primary-glow)]'
                              : 'btn-ghost'
                          }`}>{label}</button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <AddEditModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        editingItem={editingItem}
        folders={folders}
        user={user}
        activeFolderId={activeFolderId}
        t={t}
      />
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <ConfirmProvider>
        <AppInner />
      </ConfirmProvider>
    </ToastProvider>
  );
}
