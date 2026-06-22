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
    dashboard: 'Dashboard', profile: 'Profile', settings: 'Settings', logout: 'Logout',
    searchPlaceholder: 'Search stock SKU or location...',
    registerSKU: 'Register New Stock', noInventory: 'No Inventory Found',
    emptyFolder: 'Empty folder or no SKUs match query search.',
    operator: 'Operator', folders: 'Inventory Folders', allStock: 'All Stock',
    uncategorized: 'Uncategorized', customFolders: 'Custom Folders',
    createNewFolder: 'Create New Folder', folderPlaceholder: 'Folder name...',
    profileHeader: 'Operator Profile', registeredEmail: 'Registered Email',
    displayName: 'Operator Display Name', displayNamePlaceholder: 'Enter display name...',
    saveProfile: 'Save Profile Changes', savingProfile: 'Saving Changes...',
    profileUpdatedSuccess: 'Profile updated successfully!', profileUpdatedError: 'Error saving profile.',
    themeLabel: 'Theme Settings', langLabel: 'Language Settings',
    lightMode: 'Light Mode', darkMode: 'Dark Mode',
    english: 'English', chinese: 'Chinese (中文)',
    cancel: 'Cancel', commitStock: 'Commit Stock',
    editingStock: 'Edit Registered Stock',
    changeLogHistory: 'Change Log History',
    createSKUToLog: 'Create new stock item to begin logging history events.',
    noChangesLogged: 'No changes logged for this item yet.',
    itemName: 'Item Name', storageLocation: 'Storage Location', quantity: 'Quantity',
    associateFolder: 'Associate with Folder', stockPhoto: 'Stock Photo',
    choosePhoto: 'Choose Stock Photo', photoUrlActive: 'Photo URL active on cloud',
    deleteStock: 'Remove Stock', adjust: 'Adjust',
    inStock: 'In Stock', units: 'units', editState: 'Edit State', closeEdit: 'Close Edit',
    loadingSession: 'Resolving Cloud PERSISTENCE session...',
    appName: 'LogiSync Cloud', opsCenter: 'Production Operations Center',
    loginSubmit: 'Authenticate Operator', signupSubmit: 'Establish Operator Account',
    switchSignup: 'New operator? Request Cloud Credentials',
    switchLogin: 'Already registered? Login here',
    lowStockThreshold: 'Low Stock Alert (qty)',
    exportCSV: 'Export CSV',
  },
  zh: {
    dashboard: '仪表板', profile: '个人资料', settings: '设置', logout: '注销登出',
    searchPlaceholder: '搜索库存商品或存放位置...',
    registerSKU: '登记新库存', noInventory: '未找到库存项',
    emptyFolder: '文件夹为空或没有匹配的商品。',
    operator: '操作员', folders: '库存文件夹', allStock: '所有库存',
    uncategorized: '未分类', customFolders: '自定义文件夹',
    createNewFolder: '创建新文件夹', folderPlaceholder: '文件夹名称...',
    profileHeader: '操作员个人资料', registeredEmail: '注册电子邮箱',
    displayName: '操作员显示名称', displayNamePlaceholder: '请输入显示名称...',
    saveProfile: '保存个人资料修改', savingProfile: '正在保存...',
    profileUpdatedSuccess: '个人资料更新成功！', profileUpdatedError: '保存个人资料时出错。',
    themeLabel: '主题设置', langLabel: '语言设置',
    lightMode: '浅色模式', darkMode: '深色模式',
    english: '英文 (English)', chinese: '中文',
    cancel: '取消', commitStock: '提交入库',
    editingStock: '编辑已登记库存',
    changeLogHistory: '变更日志历史',
    createSKUToLog: '创建新库存项以开始记录变更日志。',
    noChangesLogged: '此项暂无变更记录。',
    itemName: '商品名称', storageLocation: '存放位置', quantity: '数量',
    associateFolder: '关联文件夹', stockPhoto: '商品图片',
    choosePhoto: '选择商品图片', photoUrlActive: '云端图片链接有效',
    deleteStock: '移除库存', adjust: '调整',
    inStock: '当前库存', units: '件', editState: '编辑状态', closeEdit: '关闭编辑',
    loadingSession: '正在解析云端持久化会话...',
    appName: 'LogiSync 云端仓储', opsCenter: '云端生产操作中心',
    loginSubmit: '操作员登录验证', signupSubmit: '注册操作员账户',
    switchSignup: '新操作员？申请云端访问权限',
    switchLogin: '已有账户？在此登录',
    lowStockThreshold: '低库存预警数量',
    exportCSV: '导出CSV',
  },
};

function exportToCSV(items, folders) {
  const header = ['Name', 'Location', 'Quantity', 'Folder', 'Low Stock Threshold'];
  const rows = items.map(item => {
    const folder = folders.find(f => f.id === item.folderId)?.name || 'Uncategorized';
    return [
      `"${item.name}"`, `"${item.location}"`, item.quantity,
      `"${folder}"`, item.lowStockThreshold ?? 5,
    ].join(',');
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

  useEffect(() => {
    return onAuthStateChanged(auth, u => { setUser(u); setLoading(false); });
  }, []);

  useEffect(() => {
    if (!user) { setProfileName(''); return; }
    return onSnapshot(doc(db, 'users', user.uid), snap => {
      if (snap.exists()) setProfileName(snap.data().name || '');
    });
  }, [user]);

  useEffect(() => {
    if (!user) { setFolders([]); return; }
    const q = query(collection(db, 'folders'), where('uid', '==', user.uid));
    return onSnapshot(q, snap => setFolders(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
  }, [user]);

  useEffect(() => {
    if (!user) { setItems([]); return; }
    const q = query(collection(db, 'inventory'), where('uid', '==', user.uid));
    return onSnapshot(q, snap => setItems(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
  }, [user]);

  const handleAuth = async (e) => {
    e.preventDefault();
    setAuthError('');
    try {
      if (isSignUp) {
        const { user: newUser } = await createUserWithEmailAndPassword(auth, email, password);
        await setDoc(doc(db, 'users', newUser.uid), {
          email: newUser.email, createdAt: serverTimestamp(), role: 'operator', name: '',
        });
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (err) {
      setAuthError(err.message.replace('Firebase: ', ''));
    }
  };

  const handleLogout = () => { signOut(auth); setCurrentTab('dashboard'); };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      await setDoc(doc(db, 'users', user.uid), { name: profileName.trim(), email: user.email, role: 'operator' }, { merge: true });
      toast(t('profileUpdatedSuccess'));
    } catch {
      toast(t('profileUpdatedError'), 'error');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleCreateFolder = async (e) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;
    try {
      await addDoc(collection(db, 'folders'), {
        name: newFolderName.trim(), uid: user.uid, createdBy: user.uid, createdAt: serverTimestamp(),
      });
      setNewFolderName('');
    } catch (err) {
      console.error('Failed to create folder:', err);
    }
  };

  const logChange = async (itemId, quantity, action) => {
    await addDoc(collection(db, 'inventory', itemId, 'history'), {
      quantity: Number(quantity), timestamp: serverTimestamp(), operator: user.email, action,
    });
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
      await logChange(itemId, newQty, delta > 0 ? `+${delta} Increment` : `${delta} Decrement`);
    } catch (err) {
      console.error('Failed to adjust quantity:', err);
    }
  };

  const handleDeleteItem = async (itemId, itemName) => {
    const ok = await confirm(`Remove "${itemName}" from the cloud inventory?`);
    if (!ok) return;
    try {
      await deleteDoc(doc(db, 'inventory', itemId));
      toast('Stock removed');
    } catch (err) {
      console.error('Failed to delete:', err);
      toast('Failed to remove stock', 'error');
    }
  };

  const filteredItems = applySort(
    items.filter(item => {
      const q = searchQuery.toLowerCase();
      const matchSearch = item.name.toLowerCase().includes(q) || item.location.toLowerCase().includes(q);
      if (!matchSearch) return false;
      if (activeFolderId === 'all') return true;
      if (activeFolderId === 'uncategorized') return !item.folderId;
      return item.folderId === activeFolderId;
    }),
    sortKey,
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-400 font-medium">{t('loadingSession')}</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute top-0 -left-4 w-96 h-96 bg-indigo-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" />
        <div className="absolute bottom-0 -right-4 w-96 h-96 bg-violet-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse delay-75" />
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          className="w-full max-w-md glass-panel p-8 rounded-2xl shadow-2xl relative z-10"
        >
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-tr from-indigo-500 to-violet-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20 mb-3">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
              LogiSync Cloud
            </h1>
            <p className="text-sm text-slate-400 mt-1">Production Operations Center</p>
          </div>
          <form onSubmit={handleAuth} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Operator Email</label>
              <input id="auth-email-input" type="email" required className="w-full glass-input px-4 py-3 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none transition-all" placeholder="operator@company.com" value={email} onChange={e => setEmail(e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Password</label>
              <input id="auth-password-input" type="password" required className="w-full glass-input px-4 py-3 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none transition-all" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} />
            </div>
            {authError && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-xs font-medium">{authError}</div>
            )}
            <button id="auth-submit-btn" type="submit" className="w-full py-3 bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white font-semibold rounded-lg shadow-lg shadow-indigo-500/20 transform active:scale-95 transition-all">
              {isSignUp ? t('signupSubmit') : t('loginSubmit')}
            </button>
          </form>
          <div className="mt-6 text-center">
            <button onClick={() => setIsSignUp(!isSignUp)} className="text-xs text-slate-400 hover:text-indigo-400 transition-colors">
              {isSignUp ? t('switchLogin') : t('switchSignup')}
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-color)] text-[var(--text-color)] flex flex-col transition-colors duration-200">
      <header className="w-full bg-[var(--header-bg)] border-b border-[var(--panel-border)] backdrop-blur-md sticky top-0 z-40 p-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 bg-gradient-to-tr from-indigo-500 to-violet-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/10">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-bold bg-gradient-to-r from-[var(--text-color)] to-[var(--text-muted)] bg-clip-text text-transparent">{t('appName')}</h1>
              <p className="text-[10px] text-[var(--text-muted)] font-semibold">{t('operator')}: {profileName || user.email}</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <nav className="flex bg-[var(--input-bg)] rounded-xl p-1 border border-[var(--input-border)]">
              {['dashboard', 'profile', 'settings'].map(tab => (
                <button
                  key={tab}
                  onClick={() => setCurrentTab(tab)}
                  className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors ${currentTab === tab ? 'bg-indigo-500 text-white shadow' : 'text-[var(--text-muted)] hover:text-[var(--text-color)]'}`}
                >
                  {t(tab)}
                </button>
              ))}
            </nav>
            <button onClick={handleLogout} className="px-3.5 py-1.5 bg-[var(--input-bg)] hover:bg-[var(--panel-bg)] border border-[var(--input-border)] text-xs font-semibold text-[var(--text-muted)] rounded-lg hover:text-[var(--text-color)] transition-colors">
              {t('logout')}
            </button>
          </div>
        </div>
      </header>

      <div className="flex-1 max-w-7xl w-full mx-auto flex p-4 md:p-6 items-stretch">
        <AnimatePresence mode="wait">
          {currentTab === 'dashboard' && (
            <motion.div key="dashboard" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} transition={{ duration: 0.2 }} className="w-full flex flex-col md:flex-row gap-6 items-stretch">
              <FolderSidebar
                folders={folders} items={items}
                activeFolderId={activeFolderId} setActiveFolderId={setActiveFolderId}
                newFolderName={newFolderName} setNewFolderName={setNewFolderName}
                handleCreateFolder={handleCreateFolder} t={t}
              />

              <div className="flex-1 flex flex-col gap-4">
                <DashboardStats items={items} />

                <div className="flex flex-col md:flex-row justify-between items-center gap-3">
                  <div className="w-full md:max-w-md relative">
                    <input
                      id="search-input" type="text" placeholder={t('searchPlaceholder')}
                      value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                      className="w-full glass-input pl-11 pr-4 py-2.5 rounded-xl text-[var(--text-color)] placeholder-[var(--text-muted)] focus:outline-none text-sm"
                    />
                    <svg className="w-5 h-5 text-[var(--text-muted)] absolute left-4 top-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>

                  <div className="flex items-center gap-2 w-full md:w-auto flex-wrap">
                    <SortBar sortKey={sortKey} setSortKey={setSortKey} />

                    <div className="bg-[var(--input-bg)] rounded-xl p-1 border border-[var(--input-border)] flex">
                      {[true, false].map(grid => (
                        <button
                          key={String(grid)}
                          onClick={() => setIsGridView(grid)}
                          className={`p-2 rounded-lg transition-colors cursor-pointer ${isGridView === grid ? 'bg-indigo-500 text-white shadow' : 'text-[var(--text-muted)] hover:text-[var(--text-color)]'}`}
                          title={grid ? 'Grid View' : 'List View'}
                        >
                          {grid
                            ? <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
                            : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" /></svg>
                          }
                        </button>
                      ))}
                    </div>

                    <button
                      onClick={() => exportToCSV(filteredItems, folders)}
                      className="px-3 py-2 glass-input rounded-xl text-xs font-semibold text-[var(--text-muted)] hover:text-[var(--text-color)] flex items-center gap-1.5 transition-colors"
                      title={t('exportCSV')}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      {t('exportCSV')}
                    </button>

                    <button
                      id="add-item-btn"
                      onClick={() => { setEditingItem(null); setIsModalOpen(true); }}
                      className="flex-1 md:flex-none px-5 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white font-semibold text-sm rounded-xl shadow-lg shadow-indigo-500/15 flex items-center justify-center gap-2 transition-colors active:scale-95"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                      </svg>
                      {t('registerSKU')}
                    </button>
                  </div>
                </div>

                {filteredItems.length === 0 ? (
                  <div className="text-center py-16 rounded-2xl glass-panel shadow-md flex-1 flex flex-col justify-center items-center border border-[var(--panel-border)]">
                    <svg className="w-12 h-12 text-[var(--text-muted-dark)] mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                    <h3 className="text-base font-bold text-[var(--text-color)]">{t('noInventory')}</h3>
                    <p className="text-xs text-[var(--text-muted)] mt-1">{t('emptyFolder')}</p>
                  </div>
                ) : (
                  <motion.div layout className={isGridView ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6' : 'flex flex-col gap-4'}>
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
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}

          {currentTab === 'profile' && (
            <motion.div key="profile" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} transition={{ duration: 0.2 }} className="w-full max-w-lg mx-auto glass-panel p-8 rounded-2xl shadow-xl border border-[var(--panel-border)] self-start">
              <h2 className="text-lg font-bold text-[var(--text-color)] mb-6 flex items-center gap-2">
                <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                {t('profileHeader')}
              </h2>
              <form onSubmit={handleSaveProfile} className="space-y-5">
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2">{t('registeredEmail')}</label>
                  <input type="email" disabled value={user.email} className="w-full glass-input px-4 py-2.5 rounded-lg text-[var(--text-muted)] cursor-not-allowed opacity-60 text-sm focus:outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2">{t('displayName')}</label>
                  <input id="profile-name-input" type="text" required placeholder={t('displayNamePlaceholder')} value={profileName} onChange={e => setProfileName(e.target.value)} className="w-full glass-input px-4 py-2.5 rounded-lg text-[var(--text-color)] placeholder-[var(--text-muted)] text-sm focus:outline-none" />
                </div>
                <div className="pt-4 border-t border-[var(--panel-border)] flex gap-4">
                  <button id="profile-save-btn" type="submit" disabled={savingProfile} className="px-5 py-2.5 bg-indigo-500 hover:bg-indigo-600 disabled:bg-indigo-800 text-white font-semibold rounded-lg text-sm transition-colors shadow-lg shadow-indigo-500/15">
                    {savingProfile ? t('savingProfile') : t('saveProfile')}
                  </button>
                  <button type="button" onClick={handleLogout} className="px-5 py-2.5 bg-red-500/15 hover:bg-red-500/25 text-red-400 font-semibold rounded-lg text-sm transition-colors border border-red-500/20">
                    {t('logout')}
                  </button>
                </div>
              </form>
            </motion.div>
          )}

          {currentTab === 'settings' && (
            <motion.div key="settings" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} transition={{ duration: 0.2 }} className="w-full max-w-lg mx-auto glass-panel p-8 rounded-2xl shadow-xl border border-[var(--panel-border)] self-start">
              <h2 className="text-lg font-bold text-[var(--text-color)] mb-6 flex items-center gap-2">
                <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {t('settings')}
              </h2>
              <div className="space-y-6">
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-3">{t('themeLabel')}</label>
                  <div className="grid grid-cols-2 gap-4">
                    {[['light', '☀️', t('lightMode')], ['dark', '🌙', t('darkMode')]].map(([val, icon, label]) => (
                      <button key={val} onClick={() => setTheme(val)} className={`py-3 px-4 rounded-xl border text-sm font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${theme === val ? 'bg-indigo-500 text-white border-indigo-400 shadow-lg shadow-indigo-500/10' : 'bg-[var(--input-bg)] hover:bg-[var(--panel-bg)] text-[var(--text-muted)] border-[var(--input-border)]'}`}>
                        <span>{icon}</span> {label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-3">{t('langLabel')}</label>
                  <div className="grid grid-cols-2 gap-4">
                    {[['en', t('english')], ['zh', t('chinese')]].map(([val, label]) => (
                      <button key={val} onClick={() => setLanguage(val)} className={`py-3 px-4 rounded-xl border text-sm font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${language === val ? 'bg-indigo-500 text-white border-indigo-400 shadow-lg shadow-indigo-500/10' : 'bg-[var(--input-bg)] hover:bg-[var(--panel-bg)] text-[var(--text-muted)] border-[var(--input-border)]'}`}>
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
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
