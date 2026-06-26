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
import Sidebar from './components/Sidebar';
import InventoryCard from './components/InventoryCard';
import AddEditModal from './components/AddEditModal';
import ItemDetailView from './components/ItemDetailView';
import ProfileSettings from './components/ProfileSettings';

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
  },
};

function exportToCSV(items, folders) {
  const header = ['Name', 'SKU', 'Location', 'Quantity', 'Price', 'Folder', 'Low Stock Alert'];
  const rows = items.map(item => {
    const folder = folders.find(f => f.id === item.folderId)?.name || 'Uncategorized';
    return [`"${item.name}"`, `"${item.sku || ''}"`, `"${item.location}"`, item.quantity, item.price || '', `"${folder}"`, item.lowStockThreshold ?? 5].join(',');
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

const LogoMark = ({ size = 30 }) => (
  <svg width={size} height={Math.round(size * 0.88)} viewBox="0 0 100 90" xmlns="http://www.w3.org/2000/svg">
    <polygon points="50,8 82,26 50,44 18,26" fill="#2dd4bf"/>
    <polygon points="18,26 50,44 50,80 18,62" fill="#0d9488"/>
    <polygon points="50,44 82,26 82,62 50,80" fill="#0369a1"/>
    <line x1="50" y1="8" x2="82" y2="26" stroke="rgba(255,255,255,.22)" strokeWidth="1"/>
    <line x1="50" y1="8" x2="18" y2="26" stroke="rgba(255,255,255,.11)" strokeWidth="1"/>
  </svg>
);

/* ── Main App ── */
function AppInner() {
  const toast = useToast();
  const confirm = useConfirm();

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [selectedItem, setSelectedItem] = useState(null);
  const [profileName, setProfileName] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [language, setLanguage] = useState(() => localStorage.getItem('app_lang') || 'en');
  const [theme, setTheme] = useState(() => localStorage.getItem('app_theme') || 'dark');
  const [isGridView, setIsGridView] = useState(() => localStorage.getItem('app_layout_grid') !== 'false');
  const [sortKey, setSortKey] = useState('name-asc');

  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
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

  // Sync selectedItem when items update
  useEffect(() => {
    if (selectedItem) {
      const fresh = items.find(i => i.id === selectedItem.id);
      if (fresh) setSelectedItem(fresh);
    }
  }, [items]);

  const handleAuth = async (e) => {
    e.preventDefault();
    setAuthError('');
    if (isSignUp && password !== confirmPassword) { setAuthError('Passwords do not match'); return; }
    setAuthLoading(true);
    try {
      if (isSignUp) {
        const { user: u } = await createUserWithEmailAndPassword(auth, email, password);
        await setDoc(doc(db, 'users', u.uid), { email: u.email, createdAt: serverTimestamp(), role: 'operator', name: fullName.trim() });
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (err) {
      setAuthError(err.message.replace('Firebase: ', '').replace(/\s*\(.*\)\.?\s*$/, ''));
    } finally { setAuthLoading(false); }
  };

  const handleLogout = () => { signOut(auth); setCurrentTab('dashboard'); setSelectedItem(null); };

  const handleSaveProfile = async (e) => {
    e?.preventDefault();
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
        quantity: newQty, timestamp: serverTimestamp(), operator: user.email,
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
      if (selectedItem?.id === itemId) setSelectedItem(null);
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
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-[3px] border-teal-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-[var(--text-2)] font-medium">{t('loadingSession')}</p>
        </div>
      </div>
    );
  }

  /* ── Auth ── */
  if (!user) {
    /* Register */
    if (isSignUp) {
      return (
        <div className="min-h-screen flex items-center justify-center relative overflow-hidden"
          style={{ background: '#0a0f1a' }}>
          {/* Blob shapes */}
          <div className="absolute pointer-events-none" style={{ top: '-15%', left: '-12%', width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(20,184,166,0.35) 0%, rgba(13,148,136,0.1) 60%, transparent 80%)', filter: 'blur(80px)' }} />
          <div className="absolute pointer-events-none" style={{ bottom: '-20%', right: '-10%', width: 520, height: 520, borderRadius: '50%', background: 'radial-gradient(circle, rgba(56,189,248,0.25) 0%, rgba(3,105,161,0.1) 60%, transparent 80%)', filter: 'blur(90px)' }} />
          <div className="absolute pointer-events-none" style={{ top: '40%', right: '20%', width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, rgba(20,184,166,0.15) 0%, transparent 70%)', filter: 'blur(60px)' }} />

          <div className="relative z-10 flex flex-col lg:flex-row items-center gap-12 lg:gap-20 px-6 py-12 w-full max-w-4xl mx-auto">
            {/* Left text */}
            <div className="hidden lg:flex flex-col gap-5">
              <LogoMark size={52} />
              <h1 className="text-5xl font-black text-white leading-tight">Join<br/>LogiSync</h1>
              <p className="text-base text-white/40 font-medium max-w-[220px]">Start managing your inventory in minutes.</p>
            </div>

            {/* Form card */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}
              className="w-full max-w-sm rounded-2xl p-8 flex flex-col gap-5"
              style={{ background: 'rgba(20,26,42,0.85)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.08)' }}>

              {/* Mobile logo */}
              <div className="flex items-center gap-2.5 mb-1 lg:hidden">
                <LogoMark size={24} />
                <span className="text-white font-bold text-base">LogiSync</span>
              </div>

              <form onSubmit={handleAuth} className="flex flex-col gap-4">
                {[
                  { label: 'Full Name', value: fullName, setter: setFullName, type: 'text', ph: 'Your full name', id: 'reg-name' },
                  { label: 'Email', value: email, setter: setEmail, type: 'email', ph: 'you@company.com', id: 'reg-email' },
                  { label: 'Password', value: password, setter: setPassword, type: 'password', ph: '••••••••', id: 'reg-pw', auto: 'new-password' },
                  { label: 'Confirm Password', value: confirmPassword, setter: setConfirmPassword, type: 'password', ph: '••••••••', id: 'reg-cpw', auto: 'new-password' },
                ].map(({ label, value, setter, type, ph, id, auto }) => (
                  <div key={id}>
                    <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-1.5">{label}</label>
                    <input id={id} type={type} required placeholder={ph} value={value} onChange={e => setter(e.target.value)}
                      autoComplete={auto} className="field w-full px-4 py-3 text-sm" />
                  </div>
                ))}

                <AnimatePresence>
                  {authError && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                      <div className="px-4 py-3 rounded-xl badge-danger text-xs font-medium">{authError}</div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <button id="auth-submit-btn" type="submit" disabled={authLoading}
                  className="btn-primary w-full py-3 text-sm mt-1 disabled:opacity-60 flex items-center justify-center gap-2">
                  {authLoading && <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />}
                  Create Account
                </button>
              </form>

              <div className="text-center">
                <button onClick={() => { setIsSignUp(false); setAuthError(''); }}
                  className="text-xs text-white/40 hover:text-[var(--primary)] transition-colors font-medium">
                  Back to Login
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      );
    }

    /* Login */
    return (
      <div className="min-h-screen flex">
        {/* Left panel */}
        <div className="hidden lg:flex w-[45%] relative flex-col p-12 overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #0d2218 0%, #0a1a2e 50%, #06101a 100%)' }}>
          {/* Grid overlay */}
          <div className="absolute inset-0 pointer-events-none opacity-[0.07]"
            style={{ backgroundImage: 'linear-gradient(rgba(20,184,166,1) 1px, transparent 1px), linear-gradient(90deg, rgba(20,184,166,1) 1px, transparent 1px)', backgroundSize: '48px 48px' }} />
          {/* Glow orbs */}
          <div className="absolute pointer-events-none" style={{ top: '10%', left: '20%', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(20,184,166,0.18) 0%, transparent 70%)', filter: 'blur(60px)' }} />
          <div className="absolute pointer-events-none" style={{ bottom: '15%', right: '-5%', width: 320, height: 320, borderRadius: '50%', background: 'radial-gradient(circle, rgba(56,189,248,0.12) 0%, transparent 70%)', filter: 'blur(60px)' }} />

          {/* Logo */}
          <div className="relative flex items-center gap-3 mb-auto">
            <LogoMark size={36} />
            <span className="text-white font-bold text-xl tracking-tight">LogiSync</span>
          </div>

          {/* Warehouse illustration */}
          <div className="relative flex-1 flex items-center justify-center">
            <svg viewBox="0 0 400 280" className="w-full max-w-[360px] opacity-30" fill="none" xmlns="http://www.w3.org/2000/svg">
              {/* Floor grid */}
              {[0,1,2,3,4].map(i => (
                <line key={`h${i}`} x1="20" y1={140+i*28} x2="380" y2={140+i*28} stroke="#14b8a6" strokeWidth="0.5" opacity="0.4"/>
              ))}
              {[0,1,2,3,4,5,6].map(i => (
                <line key={`v${i}`} x1={20+i*60} y1="140" x2={20+i*60} y2="252" stroke="#14b8a6" strokeWidth="0.5" opacity="0.4"/>
              ))}
              {/* Shelf boxes */}
              {[40,130,220,310].map((x,ci) => (
                <g key={ci}>
                  <rect x={x} y="40" width="50" height="90" rx="4" fill="rgba(20,184,166,0.12)" stroke="#14b8a6" strokeWidth="1"/>
                  <rect x={x+5} y="50" width="18" height="22" rx="2" fill="rgba(20,184,166,0.3)"/>
                  <rect x={x+27} y="50" width="18" height="22" rx="2" fill="rgba(56,189,248,0.25)"/>
                  <rect x={x+5} y="78" width="40" height="18" rx="2" fill="rgba(20,184,166,0.2)"/>
                  <rect x={x+5} y="102" width="18" height="18" rx="2" fill="rgba(13,148,136,0.35)"/>
                  <rect x={x+27} y="102" width="18" height="18" rx="2" fill="rgba(20,184,166,0.2)"/>
                </g>
              ))}
              {/* Conveyor belt */}
              <rect x="60" y="195" width="280" height="18" rx="9" fill="rgba(20,184,166,0.15)" stroke="#14b8a6" strokeWidth="1"/>
              {[0,1,2,3,4,5].map(i => (
                <rect key={i} x={80+i*44} y="198" width="28" height="12" rx="3" fill="rgba(20,184,166,0.25)" stroke="#14b8a6" strokeWidth="0.5"/>
              ))}
              {/* Boxes on belt */}
              <rect x="108" y="178" width="28" height="20" rx="3" fill="rgba(20,184,166,0.4)" stroke="#14b8a6" strokeWidth="1"/>
              <rect x="196" y="178" width="28" height="20" rx="3" fill="rgba(56,189,248,0.3)" stroke="#38bdf8" strokeWidth="1"/>
              <rect x="284" y="178" width="28" height="20" rx="3" fill="rgba(20,184,166,0.4)" stroke="#14b8a6" strokeWidth="1"/>
              {/* Status lights */}
              <circle cx="100" cy="160" r="5" fill="#14b8a6" opacity="0.8"/>
              <circle cx="188" cy="160" r="5" fill="#14b8a6" opacity="0.6"/>
              <circle cx="276" cy="160" r="5" fill="#22c55e" opacity="0.8"/>
            </svg>
          </div>

          {/* Tagline */}
          <div className="relative">
            <h2 className="text-3xl font-black text-white mb-2 leading-tight">Smart inventory,<br/>simplified.</h2>
            <p className="text-sm text-white/40">Real-time cloud sync across all your devices.</p>
          </div>
        </div>

        {/* Right form panel */}
        <div className="flex-1 flex items-center justify-center p-8" style={{ background: 'var(--bg)' }}>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}
            className="w-full max-w-sm">
            {/* Mobile logo */}
            <div className="flex items-center gap-2.5 mb-8 lg:hidden">
              <LogoMark size={28} />
              <span className="text-[var(--text)] font-bold text-base tracking-tight">LogiSync</span>
            </div>

            <h2 className="text-2xl font-bold text-[var(--text)] mb-1">Sign In</h2>
            <p className="text-sm text-[var(--text-2)] mb-8">Access your cloud inventory.</p>

            <form onSubmit={handleAuth} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[var(--text-2)] uppercase tracking-wider mb-1.5">Email</label>
                <input id="auth-email-input" type="email" required className="field w-full px-4 py-3 text-sm"
                  placeholder="you@company.com" value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[var(--text-2)] uppercase tracking-wider mb-1.5">Password</label>
                <input id="auth-password-input" type="password" required className="field w-full px-4 py-3 text-sm"
                  placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} autoComplete="current-password" />
              </div>
              <div className="flex items-center gap-2.5 pt-1">
                <input type="checkbox" id="remember-me" className="w-4 h-4 rounded accent-[#14b8a6]" />
                <label htmlFor="remember-me" className="text-sm text-[var(--text-2)] font-medium cursor-pointer select-none">Remember me</label>
              </div>

              <AnimatePresence>
                {authError && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                    <div className="px-4 py-3 rounded-xl badge-danger text-xs font-medium">{authError}</div>
                  </motion.div>
                )}
              </AnimatePresence>

              <button id="auth-submit-btn" type="submit" disabled={authLoading}
                className="btn-primary w-full py-3 text-sm mt-2 disabled:opacity-60 flex items-center justify-center gap-2">
                {authLoading && <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />}
                Sign In
              </button>
            </form>

            <div className="mt-6 text-center">
              <button onClick={() => { setIsSignUp(true); setAuthError(''); }}
                className="text-sm text-[var(--text-2)] hover:text-[var(--primary)] transition-colors font-medium">
                Don't have an account? <span className="font-bold">Register</span>
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  /* ── Main app ── */
  const displayName = profileName || user.email.split('@')[0];

  return (
    <div className="min-h-screen flex text-[var(--text)]" style={{ background: 'var(--bg)' }}>
      <Sidebar
        user={user}
        displayName={displayName}
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        folders={folders}
        items={items}
        activeFolderId={activeFolderId}
        setActiveFolderId={setActiveFolderId}
        newFolderName={newFolderName}
        setNewFolderName={setNewFolderName}
        handleCreateFolder={handleCreateFolder}
        handleLogout={handleLogout}
        t={t}
        mobileOpen={mobileMenuOpen}
        onMobileClose={() => setMobileMenuOpen(false)}
        onClearSelectedItem={() => setSelectedItem(null)}
      />

      {/* Content area */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Top stats bar */}
        <div className="sticky top-0 z-30 border-b border-[var(--border)]"
          style={{ background: 'var(--header)', backdropFilter: 'blur(20px) saturate(160%)', WebkitBackdropFilter: 'blur(20px) saturate(160%)' }}>
          <div className="flex items-center gap-3 px-4 sm:px-6 h-14">
            {/* Mobile hamburger */}
            <button onClick={() => setMobileMenuOpen(v => !v)}
              className="lg:hidden w-9 h-9 flex items-center justify-center rounded-xl bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--text-2)] shrink-0">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            {/* Mobile logo */}
            <div className="flex items-center gap-2 lg:hidden mr-2">
              <LogoMark size={22} />
              <span className="font-bold text-sm text-[var(--text)]">LogiSync</span>
            </div>
            {/* Stats */}
            <div className="flex-1">
              <DashboardStats items={items} compact={true} t={t} />
            </div>
          </div>
        </div>

        {/* Page */}
        <main className="flex-1 px-4 sm:px-6 py-6 pb-12 overflow-y-auto">
          <AnimatePresence mode="wait">
            {/* Item detail view */}
            {selectedItem && (
              <motion.div key="item-detail" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.2 }}>
                <ItemDetailView
                  item={selectedItem}
                  folders={folders}
                  adjustQuantity={adjustQuantity}
                  openEditModal={item => { setEditingItem(item); setIsModalOpen(true); }}
                  onBack={() => setSelectedItem(null)}
                  t={t}
                />
              </motion.div>
            )}

            {/* Dashboard */}
            {!selectedItem && currentTab === 'dashboard' && (
              <motion.div key="dashboard" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.2 }}
                className="flex flex-col gap-5">

                {/* Toolbar */}
                <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
                  <div className="relative flex-1 min-w-0">
                    <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-3)] pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input id="search-input" type="text" placeholder={t('searchPlaceholder')}
                      value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                      className="field w-full pl-10 pr-4 py-2.5 text-sm rounded-xl" />
                  </div>

                  <div className="flex items-center gap-2 shrink-0 flex-wrap">
                    <SortBar sortKey={sortKey} setSortKey={setSortKey} />

                    <div className="flex bg-[var(--input-bg)] border border-[var(--input-border)] rounded-xl p-0.5">
                      {[
                        { grid: true, d: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z' },
                        { grid: false, d: 'M4 6h16M4 12h16M4 18h16' },
                      ].map(({ grid, d }) => (
                        <button key={String(grid)} onClick={() => setIsGridView(grid)}
                          className={`p-2 rounded-lg transition-all ${isGridView === grid ? 'bg-[var(--primary)] text-white shadow-sm' : 'text-[var(--text-3)] hover:text-[var(--text)]'}`}>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={d} />
                          </svg>
                        </button>
                      ))}
                    </div>

                    <button onClick={() => exportToCSV(filteredItems, folders)}
                      className="btn-ghost px-3 py-2 text-xs font-semibold flex items-center gap-1.5" title={t('exportCSV')}>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span className="hidden sm:inline">{t('exportCSV')}</span>
                    </button>

                    <button id="add-item-btn"
                      onClick={() => { setEditingItem(null); setIsModalOpen(true); }}
                      className="btn-primary px-4 py-2 text-sm flex items-center gap-1.5">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
                      </svg>
                      {t('registerSKU')}
                    </button>
                  </div>
                </div>

                {/* Folder chip bar */}
                {(
                  <div className="flex items-center gap-2 overflow-x-auto py-0.5" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                    {[
                      { id: 'all', label: t('allStock'), count: items.length, color: null },
                      { id: 'uncategorized', label: t('uncategorized'), count: items.filter(i => !i.folderId).length, color: null },
                      ...folders.map(f => ({ id: f.id, label: f.name, count: items.filter(i => i.folderId === f.id).length, color: f.color || null })),
                    ].map(({ id, label, count, color }) => {
                      const active = activeFolderId === id;
                      return (
                        <button
                          key={id}
                          onClick={() => setActiveFolderId(id)}
                          className="shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all"
                          style={active ? {
                            background: color ? `${color}20` : 'var(--primary-glow)',
                            color: color || 'var(--primary)',
                            borderColor: color ? `${color}55` : 'var(--primary)',
                            boxShadow: `0 0 10px ${color || 'var(--primary)'}30`,
                          } : {
                            background: 'var(--input-bg)',
                            color: 'var(--text-3)',
                            borderColor: 'var(--input-border)',
                          }}
                        >
                          {color && <span className="w-2 h-2 rounded-full shrink-0" style={{ background: color, boxShadow: `0 0 4px ${color}` }} />}
                          <span className="max-w-[100px] truncate">{label}</span>
                          <span className="opacity-55 font-normal tabular-nums">{count}</span>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Grid / empty state */}
                {filteredItems.length === 0 ? (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="flex-1 flex flex-col items-center justify-center py-20 glass rounded-2xl">
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
                      <button onClick={() => { setEditingItem(null); setIsModalOpen(true); }}
                        className="btn-primary px-5 py-2.5 text-sm flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" /></svg>
                        {t('registerSKU')}
                      </button>
                    )}
                  </motion.div>
                ) : (
                  <div className={isGridView ? 'grid grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-5' : 'flex flex-col gap-3'}>
                    <AnimatePresence>
                      {filteredItems.map(item => (
                        <InventoryCard
                          key={item.id} item={item} folders={folders}
                          adjustQuantity={adjustQuantity}
                          openEditModal={item => { setEditingItem(item); setIsModalOpen(true); }}
                          handleDeleteItem={handleDeleteItem}
                          onViewDetail={item => setSelectedItem(item)}
                          isGridView={isGridView} t={t}
                        />
                      ))}
                    </AnimatePresence>
                  </div>
                )}
              </motion.div>
            )}

            {/* Profile & Settings */}
            {!selectedItem && currentTab === 'profile' && (
              <motion.div key="profile" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.2 }}>
                <ProfileSettings
                  user={user}
                  profileName={profileName}
                  setProfileName={setProfileName}
                  savingProfile={savingProfile}
                  handleSaveProfile={handleSaveProfile}
                  theme={theme}
                  setTheme={setTheme}
                  language={language}
                  setLanguage={setLanguage}
                  t={t}
                />
              </motion.div>
            )}

          </AnimatePresence>
        </main>
      </div>

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
