import React, { useState, useEffect } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged 
} from 'firebase/auth';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc,
  setDoc,
  doc, 
  onSnapshot,
  increment,
  serverTimestamp,
  query,
  where,
  orderBy,
  limit
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { motion, AnimatePresence } from 'framer-motion';
import { auth, db, storage } from './firebase';

const translations = {
  en: {
    dashboard: "Dashboard",
    profile: "Profile",
    settings: "Settings",
    logout: "Logout",
    searchPlaceholder: "Search stock SKU or location...",
    registerSKU: "Register New Stock",
    noInventory: "No Inventory Found",
    emptyFolder: "Empty folder or no SKUs match query search.",
    operator: "Operator",
    folders: "Inventory Folders",
    allStock: "All Stock",
    uncategorized: "Uncategorized",
    customFolders: "Custom Folders",
    createNewFolder: "Create New Folder",
    folderPlaceholder: "Folder name...",
    profileHeader: "Operator Profile",
    registeredEmail: "Registered Email",
    displayName: "Operator Display Name",
    displayNamePlaceholder: "Enter display name...",
    saveProfile: "Save Profile Changes",
    savingProfile: "Saving Changes...",
    profileUpdatedSuccess: "Profile updated successfully!",
    profileUpdatedError: "Error saving profile.",
    themeLabel: "Theme Settings",
    langLabel: "Language Settings",
    lightMode: "Light Mode",
    darkMode: "Dark Mode",
    english: "English",
    chinese: "Chinese (中文)",
    cancel: "Cancel",
    commitStock: "Commit Stock",
    editingStock: "Edit Registered Stock",
    detailsModified: "Details Modified",
    skuRegistered: "SKU Registered",
    changeLogHistory: "Change Log History",
    createSKUToLog: "Create new stock item to begin logging history events.",
    noChangesLogged: "No changes logged for this item yet.",
    itemName: "Item Name",
    storageLocation: "Storage Location",
    quantity: "Quantity",
    associateFolder: "Associate with Folder",
    stockPhoto: "Stock Photo",
    choosePhoto: "Choose Stock Photo",
    photoSelected: "Photo Selected ✓",
    photoUrlActive: "Photo URL active on cloud",
    confirmDelete: "Remove this item from the cloud inventory?",
    deleteStock: "Remove Stock",
    adjust: "Adjust",
    inStock: "In Stock",
    units: "units",
    editState: "Edit State",
    closeEdit: "Close Edit",
    details: "Details",
    delete: "Delete",
    loadingSession: "Resolving Cloud PERSISTENCE session...",
    appName: "LogiSync Cloud",
    opsCenter: "Production Operations Center",
    loginSubmit: "Authenticate Operator",
    signupSubmit: "Establish Operator Account",
    switchSignup: "New operator? Request Cloud Credentials",
    switchLogin: "Already registered? Login here"
  },
  zh: {
    dashboard: "仪表板",
    profile: "个人资料",
    settings: "设置",
    logout: "注销登出",
    searchPlaceholder: "搜索库存商品或存放位置...",
    registerSKU: "登记新库存",
    noInventory: "未找到库存项",
    emptyFolder: "文件夹为空或没有匹配的商品。",
    operator: "操作员",
    folders: "库存文件夹",
    allStock: "所有库存",
    uncategorized: "未分类",
    customFolders: "自定义文件夹",
    createNewFolder: "创建新文件夹",
    folderPlaceholder: "文件夹名称...",
    profileHeader: "操作员个人资料",
    registeredEmail: "注册电子邮箱",
    displayName: "操作员显示名称",
    displayNamePlaceholder: "请输入显示名称...",
    saveProfile: "保存个人资料修改",
    savingProfile: "正在保存...",
    profileUpdatedSuccess: "个人资料更新成功！",
    profileUpdatedError: "保存个人资料时出错。",
    themeLabel: "主题设置",
    langLabel: "语言设置",
    lightMode: "浅色模式",
    darkMode: "深色模式",
    english: "英文 (English)",
    chinese: "中文",
    cancel: "取消",
    commitStock: "提交入库",
    editingStock: "编辑已登记库存",
    detailsModified: "详情已修改",
    skuRegistered: "商品已登记",
    changeLogHistory: "变更日志历史",
    createSKUToLog: "创建新库存项以开始记录变更日志。",
    noChangesLogged: "此项暂无变更记录。",
    itemName: "商品名称",
    storageLocation: "存放位置",
    quantity: "数量",
    associateFolder: "关联文件夹",
    stockPhoto: "商品图片",
    choosePhoto: "选择商品图片",
    photoSelected: "图片已选择 ✓",
    photoUrlActive: "云端图片链接有效",
    confirmDelete: "确定从云端库存中移除此项吗？",
    deleteStock: "移除库存",
    adjust: "调整",
    inStock: "当前库存",
    units: "件",
    editState: "编辑状态",
    closeEdit: "关闭编辑",
    details: "详情",
    delete: "删除",
    loadingSession: "正在解析云端持久化会话...",
    appName: "LogiSync 云端仓储",
    opsCenter: "云端生产操作中心",
    loginSubmit: "操作员登录验证",
    signupSubmit: "注册操作员账户",
    switchSignup: "新操作员？申请云端访问权限",
    switchLogin: "已有账户？在此登录"
  }
};

// Sub-component for individual item card to manage independent gated edit states
function InventoryCard({ item, folders, adjustQuantity, openEditModal, handleDeleteItem, isGridView, t }) {
  const [isEditing, setIsEditing] = React.useState(false);
  const folderName = folders.find(f => f.id === item.folderId)?.name || t('uncategorized');
  const fallbackImg = 'https://images.unsplash.com/photo-1553413719-8758712747d5?auto=format&fit=crop&w=300&q=80';

  // -- COMPACT LIST ROW ------------------------------------------------------
  if (!isGridView) {
    return (
      React.createElement(motion.div, {
        layout: true,
        transition: { type: "spring", stiffness: 300, damping: 25 },
        className: "glass-panel rounded-xl overflow-hidden shadow-sm relative"
      },
        // Main row
        React.createElement('div', { className: "flex items-center gap-3 p-2.5 pr-12" },
          // Thumbnail
          React.createElement('div', { className: "w-14 h-14 rounded-lg overflow-hidden shrink-0 bg-[var(--input-bg)]" },
            React.createElement('img', {
              src: item.photoUrl,
              alt: item.name,
              className: "w-full h-full object-cover",
              onError: (e) => { e.target.onerror = null; e.target.src = fallbackImg; }
            })
          ),
          // Info
          React.createElement('div', { className: "flex-1 min-w-0" },
            React.createElement('h3', { className: "text-sm font-bold text-[var(--text-color)] truncate leading-tight" }, item.name),
            React.createElement('div', { className: "flex items-center gap-2 mt-0.5 flex-wrap" },
              React.createElement('span', { className: "text-[11px] text-[var(--text-muted)] truncate flex items-center gap-0.5" },
                React.createElement('svg', { className: "w-3 h-3 shrink-0", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24" },
                  React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" }),
                  React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M15 11a3 3 0 11-6 0 3 3 0 016 0z" })
                ),
                item.location
              ),
              React.createElement('span', { className: "text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20 text-indigo-500 font-semibold uppercase tracking-wide shrink-0" }, folderName)
            ),
            React.createElement('div', { className: "flex items-center gap-1 mt-1" },
              React.createElement('span', { className: "text-[10px] text-[var(--text-muted-dark)] uppercase tracking-wide font-semibold" }, t('inStock') + ':'),
              React.createElement('span', { className: "text-sm font-black text-[var(--text-color)]" }, item.quantity),
              React.createElement('span', { className: "text-[10px] text-[var(--text-muted)]" }, t('units'))
            )
          )
        ),
        // Edit toggle pinned top-right
        React.createElement('button', {
          onClick: () => setIsEditing(!isEditing),
          className: `absolute top-2 right-2 w-8 h-8 rounded-lg flex items-center justify-center transition-all border ${isEditing ? 'bg-indigo-600 border-indigo-500 text-white shadow-md' : 'bg-[var(--input-bg)] border-[var(--input-border)] text-[var(--text-muted)] hover:text-[var(--text-color)]'}`,
          title: isEditing ? t('closeEdit') : t('editState')
        },
          isEditing
            ? React.createElement('svg', { className: "w-3.5 h-3.5", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24" },
                React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2.5", d: "M6 18L18 6M6 6l12 12" })
              )
            : React.createElement('svg', { className: "w-3.5 h-3.5", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24" },
                React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" })
              )
        ),
        // Expandable controls
        React.createElement(AnimatePresence, { initial: false },
          isEditing && React.createElement(motion.div, {
            key: "list-controls",
            initial: { height: 0, opacity: 0 },
            animate: { height: "auto", opacity: 1 },
            exit: { height: 0, opacity: 0 },
            transition: { duration: 0.18, ease: "easeInOut" },
            className: "overflow-hidden"
          },
            React.createElement('div', { className: "mx-2.5 mb-2.5 bg-[var(--input-bg)] rounded-xl p-2.5 border border-[var(--input-border)] flex items-center justify-between" },
              React.createElement('div', { className: "flex items-center space-x-2" },
                React.createElement('button', { onClick: () => adjustQuantity(item.id, -1), className: "w-8 h-8 bg-[var(--panel-bg)] hover:bg-[var(--input-bg)] text-[var(--text-muted)] hover:text-[var(--text-color)] rounded-lg flex items-center justify-center font-bold text-base transition-colors border border-[var(--input-border)]" }, '-'),
                React.createElement('span', { className: "text-xs font-semibold text-[var(--text-muted)]" }, t('adjust')),
                React.createElement('button', { onClick: () => adjustQuantity(item.id, 1), className: "w-8 h-8 bg-[var(--panel-bg)] hover:bg-[var(--input-bg)] text-[var(--text-muted)] hover:text-[var(--text-color)] rounded-lg flex items-center justify-center font-bold text-base transition-colors border border-[var(--input-border)]" }, '+')
              ),
              React.createElement('div', { className: "flex items-center space-x-1" },
                React.createElement('button', { onClick: () => openEditModal(item), className: "p-2 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-500 rounded-lg transition-colors border border-indigo-500/10", title: "Edit details" },
                  React.createElement('svg', { className: "w-4 h-4", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24" },
                    React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" })
                  )
                ),
                React.createElement('button', { onClick: () => handleDeleteItem(item.id), className: "p-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg transition-colors border border-red-500/10", title: "Remove Stock" },
                  React.createElement('svg', { className: "w-4 h-4", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24" },
                    React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" })
                  )
                )
              )
            )
          )
        )
      )
    );
  }

  // -- GRID CARD -------------------------------------------------------------
  return (
    <motion.div 
      layout
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
      className="glass-panel rounded-2xl overflow-hidden shadow-lg hover:shadow-indigo-500/5 duration-300 flex flex-col relative"
    >
      {/* Photo Header */}
      <div className="h-44 bg-[var(--input-bg)] relative flex items-center justify-center overflow-hidden shrink-0">
        <img 
          src={item.photoUrl} 
          alt={item.name} 
          className="w-full h-full object-cover"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = 'https://images.unsplash.com/photo-1553413719-8758712747d5?auto=format&fit=crop&w=300&q=80';
          }}
        />
        <div className="absolute top-3 right-3 px-2.5 py-1 bg-black/60 backdrop-blur-sm rounded-lg border border-white/10 text-[10px] uppercase font-bold tracking-wider text-indigo-300">
          {item.location}
        </div>
      </div>

      {/* Details Area */}
      <div className="flex-1 flex flex-col justify-between p-2">
        <div className="mb-2">
          <h3 className="text-base font-bold text-[var(--text-color)] mb-1 line-clamp-1">{item.name}</h3>
          <p className="text-xs text-[var(--text-muted)] flex items-center mb-1">
            <svg className="w-3.5 h-3.5 mr-1 text-[var(--text-muted-dark)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {item.location}
          </p>
          <span className="inline-block px-2 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20 text-[10px] text-indigo-500 font-semibold uppercase tracking-wider">
            {t('folders')}: {folderName}
          </span>
        </div>

        <div className="flex flex-col border-t border-[var(--panel-border)] pt-2">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase tracking-wider text-[var(--text-muted-dark)] font-semibold block">{t('inStock')}</span>
              <span className="text-xl font-black text-[var(--text-color)]">{item.quantity} <span className="text-xs font-normal text-[var(--text-muted)]">{t('units')}</span></span>
            </div>

            <button 
              onClick={() => setIsEditing(!isEditing)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                isEditing 
                ? 'bg-indigo-600 border-indigo-500 text-white shadow-md shadow-indigo-600/10' 
                : 'bg-[var(--input-bg)] hover:bg-[var(--panel-bg)] border-[var(--input-border)] text-[var(--text-muted)]'
              }`}
            >
              {isEditing ? t('closeEdit') : t('editState')}
            </button>
          </div>

          {/* Gated Controls Panel */}
          <AnimatePresence initial={false}>
            {isEditing && (
              <motion.div
                initial={{ height: 0, opacity: 0, marginTop: 0 }}
                animate={{ height: "auto", opacity: 1, marginTop: 12 }}
                exit={{ height: 0, opacity: 0, marginTop: 0 }}
                transition={{ duration: 0.2, ease: "easeInOut" }}
                className="overflow-hidden"
              >
                <div className="bg-[var(--input-bg)] rounded-xl p-3 border border-[var(--input-border)] flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <button 
                      onClick={() => adjustQuantity(item.id, -1)}
                      className="w-8 h-8 bg-[var(--panel-bg)] hover:bg-[var(--input-bg)] text-[var(--text-muted)] hover:text-[var(--text-color)] rounded-lg flex items-center justify-center font-bold text-base transition-colors border border-[var(--input-border)]"
                    >
                      -
                    </button>
                    <span className="text-sm font-semibold text-[var(--text-muted)] px-1">{t('adjust')}</span>
                    <button 
                      onClick={() => adjustQuantity(item.id, 1)}
                      className="w-8 h-8 bg-[var(--panel-bg)] hover:bg-[var(--input-bg)] text-[var(--text-muted)] hover:text-[var(--text-color)] rounded-lg flex items-center justify-center font-bold text-base transition-colors border border-[var(--input-border)]"
                    >
                      +
                    </button>
                  </div>

                  <div className="flex items-center space-x-1">
                    <button 
                      onClick={() => openEditModal(item)}
                      className="p-2 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-500 rounded-lg transition-colors border border-indigo-500/10"
                      title="Edit details & history"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </button>
                    <button 
                      onClick={() => handleDeleteItem(item.id)}
                      className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg transition-colors border border-red-500/10"
                      title="Remove Stock"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Navigation: "dashboard", "profile", or "settings"
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [profileName, setProfileName] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  const [language, setLanguage] = useState(() => localStorage.getItem('app_lang') || 'en');
  const [theme, setTheme] = useState(() => localStorage.getItem('app_theme') || 'dark');
  const [isGridView, setIsGridView] = useState(() => localStorage.getItem('app_layout_grid') !== 'false');

  useEffect(() => {
    localStorage.setItem('app_lang', language);
  }, [language]);

  useEffect(() => {
    localStorage.setItem('app_theme', theme);
    if (theme === 'light') {
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
    }
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('app_layout_grid', isGridView);
  }, [isGridView]);

  const t = (key) => translations[language]?.[key] || translations['en']?.[key] || key;

  // Auth states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [authError, setAuthError] = useState('');

  // Folder states
  const [folders, setFolders] = useState([]);
  const [activeFolderId, setActiveFolderId] = useState('all');
  const [newFolderName, setNewFolderName] = useState('');

  // Inventory states
  const [items, setItems] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [itemName, setItemName] = useState('');
  const [itemLocation, setItemLocation] = useState('');
  const [itemQuantity, setItemQuantity] = useState(0);
  const [itemPhotoFile, setItemPhotoFile] = useState(null);
  const [itemPhotoUrl, setItemPhotoUrl] = useState('');
  const [itemFolderId, setItemFolderId] = useState('');
  const [saving, setSaving] = useState(false);
  const [historyLogs, setHistoryLogs] = useState([]);

  // Persistence/session check on load
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  // Fetch operator's profile name in real-time
  useEffect(() => {
    if (!user) {
      setProfileName('');
      return;
    }
    const unsubscribe = onSnapshot(doc(db, 'users', user.uid), (docSnap) => {
      if (docSnap.exists()) {
        setProfileName(docSnap.data().name || '');
      }
    }, (err) => {
      console.error("Profile sync failed:", err);
    });
    return unsubscribe;
  }, [user]);

  // Sync folders list in real-time (current user only)
  useEffect(() => {
    if (!user) {
      setFolders([]);
      return;
    }
    const q = query(
      collection(db, 'folders'),
      where('uid', '==', user.uid)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const folderList = [];
      snapshot.forEach((doc) => {
        folderList.push({ id: doc.id, ...doc.data() });
      });
      setFolders(folderList);
    }, (err) => {
      console.error("Folders sync error:", err);
    });
    return unsubscribe;
  }, [user]);

  // Sync inventory (current user only)
  useEffect(() => {
    if (!user) {
      setItems([]);
      return;
    }

    const q = query(
      collection(db, 'inventory'),
      where('uid', '==', user.uid)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const inventoryList = [];
      snapshot.forEach((doc) => {
        inventoryList.push({ id: doc.id, ...doc.data() });
      });
      setItems(inventoryList);
    }, (error) => {
      console.error("Firestore sync failed:", error);
    });

    return unsubscribe;
  }, [user]);

  // Fetch log history for selected edit item
  useEffect(() => {
    if (!editingItem) {
      setHistoryLogs([]);
      return;
    }
    const historyRef = collection(db, 'inventory', editingItem.id, 'history');
    const q = query(historyRef, orderBy('timestamp', 'desc'), limit(5));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const logs = [];
      snapshot.forEach((doc) => {
        logs.push({ id: doc.id, ...doc.data() });
      });
      setHistoryLogs(logs);
    }, (err) => {
      console.error("History sync error:", err);
    });
    return unsubscribe;
  }, [editingItem]);

  // Auth Operations
  const handleAuth = async (e) => {
    e.preventDefault();
    setAuthError('');
    try {
      if (isSignUp) {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const registeredUser = userCredential.user;
        await setDoc(doc(db, 'users', registeredUser.uid), {
          email: registeredUser.email,
          createdAt: serverTimestamp(),
          role: "operator",
          name: ""
        });
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (err) {
      setAuthError(err.message.replace('Firebase: ', ''));
    }
  };

  const handleLogout = () => {
    signOut(auth);
    setCurrentTab('dashboard');
  };

  // Profile Save
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      await setDoc(doc(db, 'users', user.uid), {
        name: profileName.trim(),
        email: user.email,
        role: "operator"
      }, { merge: true });
      alert(t("profileUpdatedSuccess"));
    } catch (err) {
      console.error("Failed to save profile:", err);
      alert(t("profileUpdatedError"));
    } finally {
      setSavingProfile(false);
    }
  };

  // Folders Operations
  const handleCreateFolder = async (e) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;
    try {
      await addDoc(collection(db, 'folders'), {
        name: newFolderName.trim(),
        uid: user.uid,
        createdBy: user.uid,
        createdAt: serverTimestamp()
      });
      setNewFolderName('');
    } catch (err) {
      console.error("Failed to create folder:", err);
    }
  };

  // Helper log history compiler
  const logInventoryChange = async (itemId, quantity, action) => {
    try {
      await addDoc(collection(db, 'inventory', itemId, 'history'), {
        quantity: Number(quantity),
        timestamp: serverTimestamp(),
        operator: user.email,
        action: action
      });
    } catch (err) {
      console.error("Failed to write history log:", err);
    }
  };

  const adjustQuantity = async (itemId, amount) => {
    try {
      const itemRef = doc(db, 'inventory', itemId);
      const currentItem = items.find(i => i.id === itemId);
      if (currentItem && currentItem.quantity + amount < 0) {
        return;
      }
      
      const newQty = currentItem.quantity + amount;
      await updateDoc(itemRef, {
        quantity: increment(amount)
      });
      
      await logInventoryChange(itemId, newQty, amount > 0 ? "+1 Increment" : "-1 Decrement");
    } catch (err) {
      console.error("Failed to adjust quantity:", err);
    }
  };

  const uploadImage = async (file) => {
    if (!file) return '';
    const fileRef = ref(storage, `photos/${Date.now()}_${file.name}`);
    await uploadBytes(fileRef, file);
    return await getDownloadURL(fileRef);
  };

  const handleSaveItem = async (e) => {
    e.preventDefault();
    if (!itemName || !itemLocation) return;
    setSaving(true);

    try {
      let photoUrlToSave = itemPhotoUrl;

      if (itemPhotoFile) {
        photoUrlToSave = await uploadImage(itemPhotoFile);
      }

      const itemData = {
        name: itemName,
        location: itemLocation,
        quantity: Number(itemQuantity),
        photoUrl: photoUrlToSave || 'https://images.unsplash.com/photo-1553413719-8758712747d5?auto=format&fit=crop&w=300&q=80',
        folderId: itemFolderId,
        uid: user.uid
      };

      if (editingItem) {
        const itemRef = doc(db, 'inventory', editingItem.id);
        await updateDoc(itemRef, itemData);
        await logInventoryChange(editingItem.id, itemQuantity, "Details Modified");
      } else {
        const itemRef = await addDoc(collection(db, 'inventory'), itemData);
        await logInventoryChange(itemRef.id, itemQuantity, "SKU Registered");
      }
      closeModal();
    } catch (err) {
      console.error("Failed to save stock details:", err);
      alert("Error saving stock data to Firestore Cloud.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteItem = async (itemId) => {
    if (!confirm("Remove this item from the cloud inventory?")) return;
    try {
      await deleteDoc(doc(db, 'inventory', itemId));
    } catch (err) {
      console.error("Failed to delete cloud stock:", err);
    }
  };

  const openAddModal = () => {
    setEditingItem(null);
    setItemName('');
    setItemLocation('');
    setItemQuantity(0);
    setItemPhotoFile(null);
    setItemPhotoUrl('');
    setItemFolderId(activeFolderId !== 'all' && activeFolderId !== 'uncategorized' ? activeFolderId : '');
    setIsModalOpen(true);
  };

  const openEditModal = (item) => {
    setEditingItem(item);
    setItemName(item.name);
    setItemLocation(item.location);
    setItemQuantity(item.quantity);
    setItemPhotoFile(null);
    setItemPhotoUrl(item.photoUrl || '');
    setItemFolderId(item.folderId || '');
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingItem(null);
  };

  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          item.location.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (!matchesSearch) return false;

    if (activeFolderId === 'all') return true;
    if (activeFolderId === 'uncategorized') return !item.folderId;
    return item.folderId === activeFolderId;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-400 font-medium">Resolving Cloud PERSISTENCE session...</p>
        </div>
      </div>
    );
  }

  // Authentication Layout
  if (!user) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute top-0 -left-4 w-96 h-96 bg-indigo-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
        <div className="absolute bottom-0 -right-4 w-96 h-96 bg-violet-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse delay-75"></div>
        
        <motion.div 
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
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
              <input 
                id="auth-email-input"
                type="email" 
                required 
                className="w-full glass-input px-4 py-3 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none transition-all"
                placeholder="operator@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Password</label>
              <input 
                id="auth-password-input"
                type="password" 
                required 
                className="w-full glass-input px-4 py-3 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none transition-all"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            {authError && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-xs font-medium">
                {authError}
              </div>
            )}

            <button 
              id="auth-submit-btn"
              type="submit" 
              className="w-full py-3 bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white font-semibold rounded-lg shadow-lg shadow-indigo-500/20 transform active:scale-95 transition-all"
            >
              {isSignUp ? 'Establish Operator Account' : 'Authenticate Operator'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button 
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-xs text-slate-400 hover:text-indigo-400 transition-colors"
            >
              {isSignUp ? 'Already registered? Login here' : 'New operator? Request Cloud Credentials'}
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // Dashboard Layout
  return (
    <div className="min-h-screen bg-[var(--bg-color)] text-[var(--text-color)] flex flex-col transition-colors duration-200">
      {/* Top Header Navigation */}
      <header className="w-full bg-[var(--header-bg)] border-b border-[var(--panel-border)] backdrop-blur-md sticky top-0 z-40 p-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 bg-gradient-to-tr from-indigo-500 to-violet-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/10">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-bold bg-gradient-to-r from-[var(--text-color)] to-[var(--text-muted)] bg-clip-text text-transparent">
                {t('appName')}
              </h1>
              <p className="text-[10px] text-[var(--text-muted)] font-semibold">
                {t('operator')}: {profileName || user.email}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {/* Navigation Tabs */}
            <nav className="flex bg-[var(--input-bg)] rounded-xl p-1 border border-[var(--input-border)]">
              <button
                onClick={() => setCurrentTab('dashboard')}
                className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  currentTab === 'dashboard' 
                  ? 'bg-indigo-500 text-white shadow' 
                  : 'text-[var(--text-muted)] hover:text-[var(--text-color)]'
                }`}
              >
                {t('dashboard')}
              </button>
              <button
                onClick={() => setCurrentTab('profile')}
                className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  currentTab === 'profile' 
                  ? 'bg-indigo-500 text-white shadow' 
                  : 'text-[var(--text-muted)] hover:text-[var(--text-color)]'
                }`}
              >
                {t('profile')}
              </button>
              <button
                onClick={() => setCurrentTab('settings')}
                className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  currentTab === 'settings' 
                  ? 'bg-indigo-500 text-white shadow' 
                  : 'text-[var(--text-muted)] hover:text-[var(--text-color)]'
                }`}
              >
                {t('settings')}
              </button>
            </nav>

            <button 
              onClick={handleLogout}
              className="px-3.5 py-1.5 bg-[var(--input-bg)] hover:bg-[var(--panel-bg)] border border-[var(--input-border)] text-xs font-semibold text-[var(--text-muted)] rounded-lg hover:text-[var(--text-color)] transition-colors"
            >
              {t('logout')}
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex-1 max-w-7xl w-full mx-auto flex p-4 md:p-6 items-stretch">
        <AnimatePresence mode="wait">
          {currentTab === 'dashboard' && (
            /* Dashboard Tab Content */
            <motion.div 
              key="dashboard-view"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
              className="w-full flex flex-col md:flex-row gap-6 items-stretch"
            >
              {/* Folders Sidebar */}
              <aside className="w-full md:w-64 shrink-0 glass-panel rounded-2xl p-5 flex flex-col justify-between self-start">
                <div className="space-y-6">
                  <div className="flex items-center justify-between pb-3 border-b border-[var(--panel-border)]">
                    <h2 className="text-sm font-bold text-[var(--text-color)] uppercase tracking-wider">{t('folders')}</h2>
                    <svg className="w-4 h-4 text-[var(--text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                    </svg>
                  </div>

                  <nav className="flex flex-col space-y-1">
                    <button
                      onClick={() => setActiveFolderId('all')}
                      className={`w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium transition-colors flex items-center justify-between ${
                        activeFolderId === 'all'
                        ? 'bg-indigo-500/15 border-l-2 border-indigo-500 text-indigo-300'
                        : 'hover:bg-[var(--input-bg)] text-[var(--text-muted)] hover:text-[var(--text-color)]'
                      }`}
                    >
                      <span>📁 {t('allStock')}</span>
                      <span className="text-xs bg-[var(--input-bg)] px-2 py-0.5 rounded-md text-[var(--text-muted)]">{items.length}</span>
                    </button>

                    <button
                      onClick={() => setActiveFolderId('uncategorized')}
                      className={`w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium transition-colors flex items-center justify-between ${
                        activeFolderId === 'uncategorized'
                        ? 'bg-indigo-500/15 border-l-2 border-indigo-500 text-indigo-300'
                        : 'hover:bg-[var(--input-bg)] text-[var(--text-muted)] hover:text-[var(--text-color)]'
                      }`}
                    >
                      <span>📄 {t('uncategorized')}</span>
                      <span className="text-xs bg-[var(--input-bg)] px-2 py-0.5 rounded-md text-[var(--text-muted)]">
                        {items.filter(i => !i.folderId).length}
                      </span>
                    </button>

                    <div className="pt-2 border-t border-[var(--panel-border)] space-y-1 max-h-60 overflow-y-auto">
                      <p className="text-[10px] font-bold text-[var(--text-muted-dark)] uppercase px-3 py-1">{t('customFolders')}</p>
                      {folders.map((folder) => {
                        const folderCount = items.filter(i => i.folderId === folder.id).length;
                        return (
                          <button
                            key={folder.id}
                            onClick={() => setActiveFolderId(folder.id)}
                            className={`w-full text-left px-3 py-2 rounded-xl text-sm font-medium transition-colors flex items-center justify-between ${
                              activeFolderId === folder.id
                              ? 'bg-indigo-500/15 border-l-2 border-indigo-500 text-indigo-300'
                              : 'hover:bg-[var(--input-bg)] text-[var(--text-muted)] hover:text-[var(--text-color)]'
                            }`}
                          >
                            <span className="truncate">📁 {folder.name}</span>
                            <span className="text-xs bg-[var(--input-bg)] px-1.5 py-0.5 rounded text-[var(--text-muted)]">{folderCount}</span>
                          </button>
                        );
                      })}
                    </div>
                  </nav>
                </div>

                <form onSubmit={handleCreateFolder} className="mt-6 pt-4 border-t border-[var(--panel-border)]">
                  <label className="block text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2">{t('createNewFolder')}</label>
                  <div className="flex gap-2">
                    <input
                      id="new-folder-input"
                      type="text"
                      placeholder={t('folderPlaceholder')}
                      value={newFolderName}
                      onChange={(e) => setNewFolderName(e.target.value)}
                      className="flex-1 glass-input px-3 py-2 rounded-lg text-xs focus:outline-none text-[var(--text-color)] placeholder-[var(--text-muted)]"
                    />
                    <button
                      id="create-folder-btn"
                      type="submit"
                      className="px-3 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg text-sm font-bold flex items-center justify-center transition-colors"
                    >
                      +
                    </button>
                  </div>
                </form>
              </aside>

              {/* Grid content area */}
              <div className="flex-1 flex flex-col gap-6">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                  <div className="w-full md:max-w-md relative">
                    <input 
                      id="search-input"
                      type="text" 
                      placeholder={t('searchPlaceholder')}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full glass-input pl-11 pr-4 py-2.5 rounded-xl text-[var(--text-color)] placeholder-[var(--text-muted)] focus:outline-none transition-all text-sm"
                    />
                    <svg className="w-5 h-5 text-[var(--text-muted)] absolute left-4 top-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>

                  <div className="flex items-center gap-3 w-full md:w-auto">
                    {/* View Switcher Toggle */}
                    <div className="bg-[var(--input-bg)] rounded-xl p-1 border border-[var(--input-border)] flex">
                      <button
                        onClick={() => setIsGridView(true)}
                        className={`p-2 rounded-lg transition-colors cursor-pointer ${
                          isGridView
                          ? 'bg-indigo-500 text-white shadow'
                          : 'text-[var(--text-muted)] hover:text-[var(--text-color)]'
                        }`}
                        title="Grid View"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => setIsGridView(false)}
                        className={`p-2 rounded-lg transition-colors cursor-pointer ${
                          !isGridView
                          ? 'bg-indigo-500 text-white shadow'
                          : 'text-[var(--text-muted)] hover:text-[var(--text-color)]'
                        }`}
                        title="List View"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                      </button>
                    </div>

                    <button 
                      id="add-item-btn"
                      onClick={openAddModal}
                      className="flex-1 md:flex-none px-5 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white font-semibold text-sm rounded-xl shadow-lg shadow-indigo-500/15 flex items-center justify-center space-x-2 transition-colors transform active:scale-95 cursor-pointer"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                      </svg>
                      <span>{t('registerSKU')}</span>
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
                  <motion.div 
                    layout 
                    className={isGridView ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6" : "flex flex-col gap-4"}
                  >
                    <AnimatePresence>
                      {filteredItems.map((item) => (
                        <InventoryCard 
                          key={item.id} 
                          item={item} 
                          folders={folders}
                          adjustQuantity={adjustQuantity}
                          openEditModal={openEditModal}
                          handleDeleteItem={handleDeleteItem}
                          isGridView={isGridView}
                          t={t}
                        />
                      ))}
                    </AnimatePresence>
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}

          {currentTab === 'profile' && (
            /* User Profile Tab Content */
            <motion.div 
              key="profile-view"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-lg mx-auto glass-panel p-8 rounded-2xl shadow-xl border border-[var(--panel-border)] self-start"
            >
              <h2 className="text-lg font-bold text-[var(--text-color)] mb-6 flex items-center gap-2">
                <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                {t('profileHeader')}
              </h2>

              <form onSubmit={handleSaveProfile} className="space-y-5">
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2">{t('registeredEmail')}</label>
                  <input 
                    type="email" 
                    disabled 
                    value={user.email}
                    className="w-full glass-input px-4 py-2.5 rounded-lg text-[var(--text-muted)] bg-[var(--input-bg)] cursor-not-allowed opacity-60 text-sm focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2">{t('displayName')}</label>
                  <input 
                    id="profile-name-input"
                    type="text" 
                    required 
                    placeholder={t('displayNamePlaceholder')}
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    className="w-full glass-input px-4 py-2.5 rounded-lg text-[var(--text-color)] placeholder-[var(--text-muted)] text-sm focus:outline-none transition-all"
                  />
                </div>

                <div className="pt-4 border-t border-[var(--panel-border)] flex gap-4">
                  <button 
                    id="profile-save-btn"
                    type="submit" 
                    disabled={savingProfile}
                    className="px-5 py-2.5 bg-indigo-500 hover:bg-indigo-600 disabled:bg-indigo-800 text-white font-semibold rounded-lg text-sm transition-colors shadow-lg shadow-indigo-500/15 cursor-pointer"
                  >
                    {savingProfile ? t('savingProfile') : t('saveProfile')}
                  </button>
                  <button 
                    type="button" 
                    onClick={handleLogout}
                    className="px-5 py-2.5 bg-red-500/15 hover:bg-red-500/25 text-red-400 font-semibold rounded-lg text-sm transition-colors border border-red-500/20 cursor-pointer"
                  >
                    {t('logout')}
                  </button>
                </div>
              </form>
            </motion.div>
          )}

          {currentTab === 'settings' && (
            /* Settings Tab Content */
            <motion.div 
              key="settings-view"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-lg mx-auto glass-panel p-8 rounded-2xl shadow-xl border border-[var(--panel-border)] self-start"
            >
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
                    <button
                      onClick={() => setTheme('light')}
                      className={`py-3 px-4 rounded-xl border text-sm font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                        theme === 'light'
                        ? 'bg-indigo-500 text-white border-indigo-400 shadow-lg shadow-indigo-500/10'
                        : 'bg-[var(--input-bg)] hover:bg-[var(--panel-bg)] text-[var(--text-muted)] border-[var(--input-border)]'
                      }`}
                    >
                      <span>☀️</span> {t('lightMode')}
                    </button>
                    <button
                      onClick={() => setTheme('dark')}
                      className={`py-3 px-4 rounded-xl border text-sm font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                        theme === 'dark'
                        ? 'bg-indigo-500 text-white border-indigo-400 shadow-lg shadow-indigo-500/10'
                        : 'bg-[var(--input-bg)] hover:bg-[var(--panel-bg)] text-[var(--text-muted)] border-[var(--input-border)]'
                      }`}
                    >
                      <span>🌙</span> {t('darkMode')}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-3">{t('langLabel')}</label>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={() => setLanguage('en')}
                      className={`py-3 px-4 rounded-xl border text-sm font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                        language === 'en'
                        ? 'bg-indigo-500 text-white border-indigo-400 shadow-lg shadow-indigo-500/10'
                        : 'bg-[var(--input-bg)] hover:bg-[var(--panel-bg)] text-[var(--text-muted)] border-[var(--input-border)]'
                      }`}
                    >
                      {t('english')}
                    </button>
                    <button
                      onClick={() => setLanguage('zh')}
                      className={`py-3 px-4 rounded-xl border text-sm font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                        language === 'zh'
                        ? 'bg-indigo-500 text-white border-indigo-400 shadow-lg shadow-indigo-500/10'
                        : 'bg-[var(--input-bg)] hover:bg-[var(--panel-bg)] text-[var(--text-muted)] border-[var(--input-border)]'
                      }`}
                    >
                      {t('chinese')}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Add / Edit Item Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden border border-[var(--panel-border)] flex flex-col md:flex-row" style={{background: 'var(--modal-bg)'}}
            >
              {/* Form Input Side */}
              <form onSubmit={handleSaveItem} className="p-6 space-y-4 flex-1">
                <div className="pb-3 border-b border-[var(--panel-border)] flex items-center justify-between">
                  <h2 className="text-base font-bold text-[var(--text-color)]">
                    {editingItem ? t('editingStock') : t('registerSKU')}
                  </h2>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-1">{t('itemName')}</label>
                    <input 
                      id="modal-name-input"
                      type="text" 
                      required
                      placeholder={t('itemName')}
                      value={itemName}
                      onChange={(e) => setItemName(e.target.value)}
                      className="w-full glass-input px-4 py-2 rounded-lg text-[var(--text-color)] placeholder-[var(--text-muted)] focus:outline-none transition-all text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-1">{t('storageLocation')}</label>
                    <input 
                      id="modal-location-input"
                      type="text" 
                      required
                      placeholder={t('storageLocation')}
                      value={itemLocation}
                      onChange={(e) => setItemLocation(e.target.value)}
                      className="w-full glass-input px-4 py-2 rounded-lg text-[var(--text-color)] placeholder-[var(--text-muted)] focus:outline-none transition-all text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-1">{t('quantity')}</label>
                    <input 
                      id="modal-quantity-input"
                      type="number" 
                      required
                      min="0"
                      value={itemQuantity}
                      onChange={(e) => setItemQuantity(e.target.value)}
                      className="w-full glass-input px-4 py-2 rounded-lg text-[var(--text-color)] placeholder-[var(--text-muted)] focus:outline-none transition-all text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-1">{t('associateFolder')}</label>
                    <select
                      id="modal-folder-select"
                      value={itemFolderId}
                      onChange={(e) => setItemFolderId(e.target.value)}
                      className="w-full glass-input px-4 py-2 rounded-lg text-[var(--text-color)] bg-[var(--input-bg)] focus:outline-none transition-all text-sm"
                    >
                      <option value="">{t('uncategorized')}</option>
                      {folders.map(f => (
                        <option key={f.id} value={f.id}>{f.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-1">{t('stockPhoto')}</label>
                    <div className="space-y-1">
                      <input 
                        id="modal-photo-file"
                        type="file" 
                        accept="image/*"
                        onChange={(e) => setItemPhotoFile(e.target.files[0])}
                        className="w-full text-xs text-[var(--text-muted)] file:mr-4 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-[10px] file:font-semibold file:bg-[var(--input-bg)] file:text-[var(--text-color)] hover:file:bg-[var(--panel-bg)] file:cursor-pointer"
                      />
                      {itemPhotoUrl && !itemPhotoFile && (
                        <div className="text-[10px] text-[var(--text-muted-dark)] truncate max-w-xs">
                          {t('photoUrlActive')}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-[var(--panel-border)] flex space-x-3">
                  <button 
                    type="button"
                    onClick={closeModal}
                    className="flex-1 py-2 bg-[var(--input-bg)] hover:bg-[var(--panel-bg)] text-[var(--text-muted)] font-semibold rounded-lg text-sm transition-colors border border-[var(--input-border)]"
                  >
                    {t('cancel')}
                  </button>
                  <button 
                    id="modal-submit-btn"
                    type="submit" 
                    disabled={saving}
                    className="flex-1 py-2 bg-indigo-500 hover:bg-indigo-600 disabled:bg-indigo-800 text-white font-semibold rounded-lg text-sm shadow-lg shadow-indigo-500/15 transition-colors flex items-center justify-center"
                  >
                    {saving ? (
                      <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    ) : (
                      t('commitStock')
                    )}
                  </button>
                </div>
              </form>

              {/* History logs sidebar (Only shown when editing item) */}
              <div className="w-full md:w-72 bg-[var(--input-bg)] border-t md:border-t-0 md:border-l border-[var(--panel-border)] p-6 flex flex-col">
                <div className="flex justify-between items-center pb-3 border-b border-[var(--panel-border)] mb-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">{t('changeLogHistory')}</h3>
                  <button onClick={closeModal} className="text-[var(--text-muted-dark)] hover:text-[var(--text-color)]">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {!editingItem ? (
                  <div className="flex-1 flex items-center justify-center text-center text-[var(--text-muted-dark)] text-xs py-8">
                    {t('createSKUToLog')}
                  </div>
                ) : historyLogs.length === 0 ? (
                  <div className="flex-1 flex items-center justify-center text-center text-[var(--text-muted)] text-xs py-8">
                    {t('noChangesLogged')}
                  </div>
                ) : (
                  <div className="space-y-3 overflow-y-auto max-h-80 flex-1 pr-1">
                    {historyLogs.map((log) => {
                      const logDate = log.timestamp?.toDate() 
                        ? log.timestamp.toDate().toLocaleString([], {month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit'})
                        : "Just Now";
                      return (
                        <div key={log.id} className="p-3 bg-[var(--panel-bg)] rounded-xl border border-[var(--panel-border)] text-[11px] space-y-1">
                          <div className="flex items-center justify-between text-indigo-500 font-bold">
                            <span>{log.action}</span>
                            <span className="text-[var(--text-color)] bg-indigo-500/20 px-1.5 py-0.5 rounded text-[9px]">
                              {log.quantity} Qty
                            </span>
                          </div>
                          <div className="text-[10px] text-[var(--text-muted)] truncate">By: {log.operator}</div>
                          <div className="text-[9px] text-[var(--text-muted-dark)] text-right">{logDate}</div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
