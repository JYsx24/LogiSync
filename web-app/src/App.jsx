import { useState, useEffect, useRef } from 'react';
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
import Sidebar, { ColorSwatch } from './components/Sidebar';
import InventoryCard from './components/InventoryCard';
import AddEditModal from './components/AddEditModal';
import ItemDetailView from './components/ItemDetailView';
import ProfileSettings from './components/ProfileSettings';
import TutorialModal from './components/TutorialModal';
import BarcodeScanner from './components/BarcodeScanner';
import EmailVerificationScreen from './components/EmailVerificationScreen';
import { sendEmailVerification } from 'firebase/auth';

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
    importCSV: 'Import CSV', importCSVSuccess: '{n} items imported', importCSVError: 'Import failed — check CSV format',
    importCSVHint: 'Expected columns: Name, SKU, Location, Quantity (Price, Folder optional)',
    emailVerifyTitle: 'Verify your email',
    emailVerifySentTo: 'We sent a verification link to',
    emailVerifyHint: 'Click the link in the email to activate your account, then come back here.',
    emailVerifyCheck: 'I\'ve verified my email',
    emailVerifyNotYet: 'Not verified yet — please check your inbox and click the link.',
    emailVerifyResend: 'Resend email', emailVerifyResending: 'Sending…', emailVerifyResendIn: 'Resend in {s}s',
    emailVerifyCancel: 'Sign out',
    scanBarcode: 'Scan Barcode', scanBarcodeHint: 'Point camera at any barcode or QR code',
    scanningLabel: 'Scanning…', cameraError: 'Camera unavailable',
    cameraErrorHint: 'Allow camera access in browser settings, then try again.',
    itemFound: 'Item found in inventory', noItemFound: 'No matching item found',
    scannedCode: 'Scanned code', openItem: 'Open Item', addNewItem: 'Add as New Item',
    statTotalSKUs: 'Total SKUs', statTotalUnits: 'Total Units',
    statLowStock: 'Low Stock', statOutOfStock: 'Out of Stock',
    statSKUsShort: 'SKUs', statUnitsShort: 'Units', statLowShort: 'Low Stock', statOutShort: 'Out of Stock',
    // Profile & Settings
    profileAndSettings: 'Profile & Settings', userProfile: 'User Profile',
    nameLabel: 'Name', role: 'Role', admin: 'Admin',
    notificationPrefs: 'Notification Preferences',
    stockAlerts: 'Stock Alerts', lowStockWarnings: 'Low Stock Warnings', systemUpdates: 'System Updates',
    security: 'Security', currentPassword: 'Current Password',
    newPassword: 'New Password', confirmPasswordLabel: 'Confirm Password',
    updatePassword: 'Update Password', passwordMismatch: 'Passwords do not match',
    passwordTooShort: 'Password must be at least 6 characters',
    passwordUpdated: 'Password updated', wrongPassword: 'Current password is incorrect',
    failedUpdatePassword: 'Failed to update password',
    // Item detail
    stockStatus: 'Stock Status',
    noHistoryYet: 'Not enough history to chart yet.',
    inventoryBreadcrumb: 'Inventory', itemDetails: 'Item Details',
    category: 'Category', price: 'Price', currentStockLabel: 'Current Stock',
    pendingLabel: 'pending', confirm: 'Confirm',
    stockHistory: 'Stock History', editItem: 'Edit Item', transferStock: 'Transfer Stock',
    stockChartLabel: 'Stock',
    // Sidebar folders
    folderColour: 'Folder Colour', noColour: 'No Colour',
    folderDeleteConfirm: 'Delete folder "{name}"?',
    folderDeleteConfirmItems: 'Delete "{name}"? {count} item(s) will become uncategorized.',
    folderDeleted: 'Folder deleted', failedDeleteFolder: 'Failed to delete folder',
    failedUpdateColour: 'Failed to update colour',
    // Auth page strings
    signInTitle: 'Sign In', accessInventory: 'Access your cloud inventory.',
    rememberMe: 'Remember me', emailLabel: 'Email', passwordLabel: 'Password',
    fullNameLabel: 'Full Name', confirmPasswordLabel2: 'Confirm Password',
    backToLogin: 'Back to Login',
    loginTagline: 'Smart inventory,\nsimplified.',
    loginSubtext: 'Real-time cloud sync across all your devices.',
    registerSubtext: 'Start managing your inventory in minutes.',
    // Password strength
    pwRuleLength: 'At least 8 characters', pwRuleUppercase: 'Uppercase letter (A-Z)',
    pwRuleLowercase: 'Lowercase letter (a-z)', pwRuleNumber: 'Number (0-9)',
    pwRuleSpecial: 'Special character (!@#$...)',
    pwStrengthWeak: 'Weak', pwStrengthFair: 'Fair', pwStrengthGood: 'Good', pwStrengthStrong: 'Strong',
    pwMatch: 'Passwords match',
    // Tutorial
    tutorialStep1Title: 'Welcome to LogiSync!',
    tutorialStep1Desc: 'Your cloud-based inventory system is ready. Here\'s a quick tour of the core workflow to get you up and running.',
    tutorialStep2Title: 'Add Your Items',
    tutorialStep2Desc: 'Register inventory items with a name, location, quantity, price, SKU, and optional photo. All data syncs to the cloud instantly.',
    tutorialStep2Hint: 'Tap "Add Stock" in the top bar to create your first item.',
    tutorialStep3Title: 'Organize with Folders',
    tutorialStep3Desc: 'Create custom folders to group items by category, product line, or warehouse section. Drag-filter using the sidebar.',
    tutorialStep3Hint: 'Use the sidebar on the left to create and switch folders.',
    tutorialStep4Title: 'Adjust Stock Levels',
    tutorialStep4Desc: 'Click any item card to open its detail view. Use the +/− stepper to stage a quantity change, then confirm to write it — every change is logged with a timestamp.',
    tutorialStep4Hint: 'Click any item card to open its detail view.',
    tutorialStep5Title: 'Monitor Your Dashboard',
    tutorialStep5Desc: 'The Dashboard gives you a real-time overview: total SKUs, units in stock, low-stock alerts, and out-of-stock counts — all updated live.',
    tutorialStep5Hint: 'Switch to Dashboard in the navigation to see live stats.',
    tutorialStepOf: 'Step {n} of {total}',
    tutorialDontShow: "Don't show this again",
    tutorialNext: 'Next', tutorialPrev: 'Back', tutorialFinish: 'Get Started',
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
    importCSV: '导入CSV', importCSVSuccess: '已导入 {n} 件商品', importCSVError: '导入失败——请检查CSV格式',
    importCSVHint: '必填列：Name、SKU、Location、Quantity（Price、Folder可选）',
    emailVerifyTitle: '验证您的邮箱',
    emailVerifySentTo: '我们已向以下邮箱发送了验证链接',
    emailVerifyHint: '请点击邮件中的链接以激活您的账户，然后返回此页面。',
    emailVerifyCheck: '我已验证邮箱',
    emailVerifyNotYet: '尚未验证 — 请检查收件箱并点击链接。',
    emailVerifyResend: '重新发送邮件', emailVerifyResending: '发送中…', emailVerifyResendIn: '{s}秒后可重新发送',
    emailVerifyCancel: '退出登录',
    scanBarcode: '扫描条码', scanBarcodeHint: '将摄像头对准条形码或二维码',
    scanningLabel: '扫描中…', cameraError: '摄像头不可用',
    cameraErrorHint: '请在浏览器设置中允许访问摄像头，然后重试。',
    itemFound: '在库存中找到商品', noItemFound: '未找到匹配商品',
    scannedCode: '扫描结果', openItem: '打开商品', addNewItem: '新增商品',
    statTotalSKUs: '商品总数', statTotalUnits: '总库存量',
    statLowStock: '低库存', statOutOfStock: '缺货',
    statSKUsShort: '商品数', statUnitsShort: '库存量', statLowShort: '低库存', statOutShort: '缺货',
    // Profile & Settings
    profileAndSettings: '个人资料与设置', userProfile: '用户资料',
    nameLabel: '姓名', role: '角色', admin: '管理员',
    notificationPrefs: '通知偏好',
    stockAlerts: '库存提醒', lowStockWarnings: '低库存预警', systemUpdates: '系统更新',
    security: '安全设置', currentPassword: '当前密码',
    newPassword: '新密码', confirmPasswordLabel: '确认密码',
    updatePassword: '更新密码', passwordMismatch: '两次输入的密码不一致',
    passwordTooShort: '密码至少需要6个字符',
    passwordUpdated: '密码更新成功', wrongPassword: '当前密码不正确',
    failedUpdatePassword: '密码更新失败',
    // Item detail
    stockStatus: '库存状态',
    noHistoryYet: '暂无足够历史记录以生成图表。',
    inventoryBreadcrumb: '库存列表', itemDetails: '商品详情',
    category: '分类', price: '价格', currentStockLabel: '当前库存',
    pendingLabel: '待确认', confirm: '确认',
    stockHistory: '库存历史', editItem: '编辑商品', transferStock: '转移库存',
    stockChartLabel: '库存',
    // Sidebar folders
    folderColour: '文件夹颜色', noColour: '无颜色',
    folderDeleteConfirm: '确认删除文件夹"{name}"？',
    folderDeleteConfirmItems: '删除"{name}"？{count}个商品将变为未分类。',
    folderDeleted: '文件夹已删除', failedDeleteFolder: '文件夹删除失败',
    failedUpdateColour: '颜色更新失败',
    // Auth page strings
    signInTitle: '登录', accessInventory: '访问您的云端库存。',
    rememberMe: '记住我', emailLabel: '电子邮箱', passwordLabel: '密码',
    fullNameLabel: '全名', confirmPasswordLabel2: '确认密码',
    backToLogin: '返回登录',
    loginTagline: '智能库存，\n化繁为简。',
    loginSubtext: '跨设备实时云端同步。',
    registerSubtext: '几分钟内开始管理您的库存。',
    // Password strength
    pwRuleLength: '至少8个字符', pwRuleUppercase: '大写字母 (A-Z)',
    pwRuleLowercase: '小写字母 (a-z)', pwRuleNumber: '数字 (0-9)',
    pwRuleSpecial: '特殊字符 (!@#$...)',
    pwStrengthWeak: '弱', pwStrengthFair: '一般', pwStrengthGood: '良好', pwStrengthStrong: '强',
    pwMatch: '密码匹配',
    // Tutorial
    tutorialStep1Title: '欢迎使用 LogiSync！',
    tutorialStep1Desc: '您的云端库存系统已就绪。以下是核心工作流程的快速导览，帮助您快速上手。',
    tutorialStep2Title: '添加商品',
    tutorialStep2Desc: '注册库存商品，填写名称、位置、数量、价格、SKU，并可上传图片。所有数据即时同步至云端。',
    tutorialStep2Hint: '点击顶部栏的"添加库存"创建第一件商品。',
    tutorialStep3Title: '文件夹分类管理',
    tutorialStep3Desc: '创建自定义文件夹，按类别、产品线或仓库区域对商品分组，通过侧边栏快速筛选。',
    tutorialStep3Hint: '使用左侧边栏创建和切换文件夹。',
    tutorialStep4Title: '调整库存数量',
    tutorialStep4Desc: '点击任意商品卡片打开详情视图。使用 +/− 步进器暂存数量变更，确认后写入——每次变更均会记录时间戳。',
    tutorialStep4Hint: '点击任意商品卡片打开详情视图。',
    tutorialStep5Title: '监控仪表板',
    tutorialStep5Desc: '仪表板提供实时概览：总SKU数、库存量、低库存预警和缺货商品数量——所有数据实时更新。',
    tutorialStep5Hint: '点击导航栏中的"仪表板"查看实时统计。',
    tutorialStepOf: '第 {n} 步，共 {total} 步',
    tutorialDontShow: '不再显示',
    tutorialNext: '下一步', tutorialPrev: '返回', tutorialFinish: '开始使用',
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

function parseCSVRow(row) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < row.length; i++) {
    const ch = row[i];
    if (ch === '"') { inQuotes = !inQuotes; continue; }
    if (ch === ',' && !inQuotes) { result.push(current.trim()); current = ''; continue; }
    current += ch;
  }
  result.push(current.trim());
  return result;
}

function parseImportCSV(text, folders) {
  const lines = text.split(/\r?\n/).filter(l => l.trim());
  if (lines.length < 2) return { items: [], error: 'empty' };
  const header = parseCSVRow(lines[0]).map(h => h.toLowerCase());
  const nameIdx = header.indexOf('name');
  const skuIdx = header.indexOf('sku');
  const locationIdx = header.indexOf('location');
  const qtyIdx = header.indexOf('quantity');
  const priceIdx = header.indexOf('price');
  const folderIdx = header.indexOf('folder');
  if (nameIdx === -1 || locationIdx === -1 || qtyIdx === -1) return { items: [], error: 'columns' };
  const items = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = parseCSVRow(lines[i]);
    if (!cols[nameIdx]) continue;
    const folderName = folderIdx >= 0 ? cols[folderIdx] : '';
    const folder = folders.find(f => f.name.toLowerCase() === folderName?.toLowerCase());
    items.push({
      name: cols[nameIdx] || '',
      sku: skuIdx >= 0 ? (cols[skuIdx] || '') : '',
      location: cols[locationIdx] || '',
      quantity: parseInt(cols[qtyIdx]) || 0,
      price: priceIdx >= 0 && cols[priceIdx] ? parseFloat(cols[priceIdx]) : null,
      folderId: folder?.id || '',
      photoUrl: '',
      lowStockThreshold: 5,
    });
  }
  return { items, error: null };
}

const EyeOn = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
  </svg>
);

const EyeOff = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"/>
  </svg>
);

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
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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
  const [prefillSku, setPrefillSku] = useState('');
  const [showScanner, setShowScanner] = useState(false);
  const [importing, setImporting] = useState(false);
  const importInputRef = useRef(null);
  const [showTutorial, setShowTutorial] = useState(() => localStorage.getItem('logisync_tutorial_seen') !== 'true');
  const [dashFolderName, setDashFolderName] = useState('');
  const [dashFolderOpen, setDashFolderOpen] = useState(false);
  const [dashColorFolderId, setDashColorFolderId] = useState(null);
  const [dashSwatchPos, setDashSwatchPos] = useState({ top: 0, left: 0 });
  const [statsStuck, setStatsStuck] = useState(false);
  const mainRef = useRef(null);

  const t = key => translations[language]?.[key] ?? translations.en[key] ?? key;

  const pwRules = [
    { key: 'length',  met: password.length >= 8,          label: t('pwRuleLength') },
    { key: 'upper',   met: /[A-Z]/.test(password),        label: t('pwRuleUppercase') },
    { key: 'lower',   met: /[a-z]/.test(password),        label: t('pwRuleLowercase') },
    { key: 'number',  met: /\d/.test(password),            label: t('pwRuleNumber') },
    { key: 'special', met: /[^A-Za-z0-9]/.test(password), label: t('pwRuleSpecial') },
  ];
  const pwScore = pwRules.filter(r => r.met).length;
  const pwStrength = pwScore <= 1
    ? { label: t('pwStrengthWeak'),   color: 'var(--danger)' }
    : pwScore <= 3
    ? { label: t('pwStrengthFair'),   color: 'var(--warning)' }
    : pwScore === 4
    ? { label: t('pwStrengthGood'),   color: '#84cc16' }
    : { label: t('pwStrengthStrong'), color: 'var(--success)' };

  useEffect(() => { localStorage.setItem('app_lang', language); }, [language]);
  useEffect(() => {
    localStorage.setItem('app_theme', theme);
    document.documentElement.classList.toggle('light', theme === 'light');
  }, [theme]);
  useEffect(() => { localStorage.setItem('app_layout_grid', isGridView); }, [isGridView]);
  useEffect(() => onAuthStateChanged(auth, u => { setUser(u); setLoading(false); }), []);

  useEffect(() => {
    const root = mainRef.current;
    if (!root) return;
    const handleScroll = () => {
      const sentinel = root.querySelector('[data-folders-end]');
      if (!sentinel) { setStatsStuck(false); return; }
      const rootRect = root.getBoundingClientRect();
      setStatsStuck(sentinel.getBoundingClientRect().bottom < rootRect.top);
    };
    root.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => root.removeEventListener('scroll', handleScroll);
  }, [user, currentTab, selectedItem]);

  useEffect(() => {
    if (!user) return;
    return onSnapshot(doc(db, 'users', user.uid), snap => {
      if (snap.exists()) setProfileName(snap.data().name || '');
    });
  }, [user]);

  useEffect(() => {
    if (!user) return;
    return onSnapshot(query(collection(db, 'folders'), where('uid', '==', user.uid)), snap =>
      setFolders(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
  }, [user]);

  useEffect(() => {
    if (!user) return;
    return onSnapshot(query(collection(db, 'inventory'), where('uid', '==', user.uid)), snap =>
      setItems(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
  }, [user]);

  // Sync selectedItem when items update
  useEffect(() => {
    if (selectedItem) {
      const fresh = items.find(i => i.id === selectedItem.id);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (fresh) setSelectedItem(fresh);
    }
  }, [items, selectedItem]);

  const handleAuth = async (e) => {
    e.preventDefault();
    setAuthError('');
    if (isSignUp && password !== confirmPassword) { setAuthError(t('passwordMismatch')); return; }
    if (isSignUp && pwScore < 5) return;
    setAuthLoading(true);
    try {
      if (isSignUp) {
        const { user: u } = await createUserWithEmailAndPassword(auth, email, password);
        await setDoc(doc(db, 'users', u.uid), { email: u.email, createdAt: serverTimestamp(), role: 'operator', name: fullName.trim() });
        await sendEmailVerification(u);
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

  const openDashColorPicker = (e, folderId) => {
    e.stopPropagation();
    if (dashColorFolderId === folderId) { setDashColorFolderId(null); return; }
    const rect = e.currentTarget.getBoundingClientRect();
    setDashSwatchPos({ top: rect.bottom + 6, left: rect.left - 8 });
    setDashColorFolderId(folderId);
  };

  const handleDashColorChange = async (folderId, color) => {
    try {
      await updateDoc(doc(db, 'folders', folderId), { color: color ?? null });
    } catch (err) { console.error(err); }
    setDashColorFolderId(null);
  };

  const handleDashCreateFolder = async (e) => {
    e.preventDefault();
    if (!dashFolderName.trim()) return;
    try {
      await addDoc(collection(db, 'folders'), { name: dashFolderName.trim(), uid: user.uid, createdBy: user.uid, createdAt: serverTimestamp() });
      setDashFolderName('');
      setDashFolderOpen(false);
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

  const handleImportCSV = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    setImporting(true);
    try {
      const text = await file.text();
      const { items: parsed, error } = parseImportCSV(text, folders);
      if (error === 'empty' || error === 'columns') {
        toast(t('importCSVError'), 'error');
        return;
      }
      await Promise.all(parsed.map(item =>
        addDoc(collection(db, 'inventory'), { ...item, uid: user.uid })
      ));
      toast(t('importCSVSuccess').replace('{n}', parsed.length));
    } catch {
      toast(t('importCSVError'), 'error');
    } finally {
      setImporting(false);
    }
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

  /* ── Email verification gate ── */
  if (user && !user.emailVerified) {
    return (
      <EmailVerificationScreen
        user={user}
        t={t}
        onVerified={() => setUser({ ...auth.currentUser })}
        onLogout={handleLogout}
      />
    );
  }

  /* ── Auth top controls (lang + theme) ── */
  const AuthTopControls = (
    <div className="fixed top-4 right-4 z-50 flex items-center gap-2">
      <div className="flex rounded-xl overflow-hidden"
        style={{ border: '1px solid var(--border-strong)', background: 'var(--surface)' }}>
        <button onClick={() => setLanguage('en')}
          className="px-3 h-9 text-[11px] font-bold transition-colors"
          style={{ background: language === 'en' ? 'var(--primary)' : 'transparent', color: language === 'en' ? '#09090b' : 'var(--text-3)' }}>
          EN
        </button>
        <div style={{ width: 1, alignSelf: 'stretch', background: 'var(--border-strong)' }} />
        <button onClick={() => setLanguage('zh')}
          className="px-3 h-9 text-[11px] font-bold transition-colors"
          style={{ background: language === 'zh' ? 'var(--primary)' : 'transparent', color: language === 'zh' ? '#09090b' : 'var(--text-3)' }}>
          中文
        </button>
      </div>
      <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        className="w-9 h-9 flex items-center justify-center rounded-xl transition-all hover:scale-105 active:scale-95"
        style={{ background: 'var(--surface)', border: '1px solid var(--border-strong)', color: 'var(--text-2)' }}>
        {theme === 'dark'
          ? <svg className="w-[17px] h-[17px]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M17.657 17.657l-.707-.707M6.343 6.343l-.707-.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"/></svg>
          : <svg className="w-[17px] h-[17px]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"/></svg>
        }
      </button>
    </div>
  );

  /* ── Auth ── */
  if (!user) {
    /* Register */
    if (isSignUp) {
      const pwOk = pwScore === 5 && password === confirmPassword;
      return (
        <div className="min-h-screen flex items-center justify-center relative overflow-hidden"
          style={{ background: 'var(--bg)' }}>

          {AuthTopControls}

          {/* Blob shapes */}
          <div className="absolute pointer-events-none" style={{ top: '-15%', left: '-12%', width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(20,184,166,0.35) 0%, rgba(13,148,136,0.1) 60%, transparent 80%)', filter: 'blur(80px)' }} />
          <div className="absolute pointer-events-none" style={{ bottom: '-20%', right: '-10%', width: 520, height: 520, borderRadius: '50%', background: 'radial-gradient(circle, rgba(56,189,248,0.25) 0%, rgba(3,105,161,0.1) 60%, transparent 80%)', filter: 'blur(90px)' }} />
          <div className="absolute pointer-events-none" style={{ top: '40%', right: '20%', width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, rgba(20,184,166,0.15) 0%, transparent 70%)', filter: 'blur(60px)' }} />

          <div className="relative z-10 flex flex-col lg:flex-row items-center gap-12 lg:gap-20 px-6 py-12 w-full max-w-4xl mx-auto">
            {/* Left text */}
            <div className="hidden lg:flex flex-col gap-5">
              <LogoMark size={52} />
              <h1 className="text-5xl font-black leading-tight" style={{ color: 'var(--text)' }}>Join<br/>LogiSync</h1>
              <p className="text-base font-medium max-w-[220px]" style={{ color: 'var(--text-3)' }}>{t('registerSubtext')}</p>
            </div>

            {/* Form card */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}
              className="w-full max-w-sm rounded-2xl p-8 flex flex-col gap-5"
              style={{ background: 'var(--surface-overlay)', backdropFilter: 'blur(20px)', border: '1px solid var(--border-strong)' }}>

              {/* Mobile logo */}
              <div className="flex items-center gap-2.5 mb-1 lg:hidden">
                <LogoMark size={24} />
                <span className="font-bold text-base" style={{ color: 'var(--text)' }}>LogiSync</span>
              </div>

              <form onSubmit={handleAuth} className="flex flex-col gap-4">
                {/* Name */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-2)' }}>{t('fullNameLabel')}</label>
                  <input id="reg-name" type="text" required placeholder={t('fullNameLabel')} value={fullName}
                    onChange={e => setFullName(e.target.value)} className="field w-full px-4 py-3 text-sm" />
                </div>
                {/* Email */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-2)' }}>{t('emailLabel')}</label>
                  <input id="reg-email" type="email" required placeholder="you@company.com" value={email}
                    onChange={e => setEmail(e.target.value)} className="field w-full px-4 py-3 text-sm" />
                </div>
                {/* Password */}
                <div className="flex flex-col gap-2">
                  <label className="block text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-2)' }}>{t('passwordLabel')}</label>
                  <div className="relative">
                    <input id="reg-pw" type={showPassword ? 'text' : 'password'} required placeholder="••••••••" value={password}
                      onChange={e => setPassword(e.target.value)} autoComplete="new-password"
                      className="field w-full px-4 py-3 pr-11 text-sm" />
                    <button type="button" onClick={() => setShowPassword(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                      style={{ color: 'var(--text-3)' }}>
                      {showPassword ? <EyeOff /> : <EyeOn />}
                    </button>
                  </div>
                  {/* Strength bar */}
                  {password.length > 0 && (
                    <>
                      <div className="flex gap-1 mt-0.5">
                        {[1,2,3,4,5].map(i => (
                          <div key={i} className="flex-1 h-1 rounded-full transition-all duration-300"
                            style={{ background: i <= pwScore ? pwStrength.color : 'var(--border-strong)' }} />
                        ))}
                      </div>
                      <p className="text-[10px] font-bold tracking-wide" style={{ color: pwStrength.color }}>
                        {pwStrength.label}
                      </p>
                    </>
                  )}
                </div>
                {/* Confirm password */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-2)' }}>{t('confirmPasswordLabel')}</label>
                  <div className="relative">
                    <input id="reg-cpw" type={showConfirmPassword ? 'text' : 'password'} required placeholder="••••••••" value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)} autoComplete="new-password"
                      className="field w-full px-4 py-3 pr-11 text-sm" />
                    <button type="button" onClick={() => setShowConfirmPassword(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                      style={{ color: 'var(--text-3)' }}>
                      {showConfirmPassword ? <EyeOff /> : <EyeOn />}
                    </button>
                  </div>
                  {confirmPassword && (
                    <p className="text-[10px] mt-1.5 font-medium"
                      style={{ color: password === confirmPassword ? 'var(--success)' : 'var(--danger)' }}>
                      {password === confirmPassword ? `✓ ${t('pwMatch')}` : `✕ ${t('passwordMismatch')}`}
                    </p>
                  )}
                </div>

                {/* Rules checklist */}
                {password.length > 0 && (
                  <div className="grid grid-cols-1 gap-1.5 p-3 rounded-xl"
                    style={{ background: 'var(--input-bg)', border: '1px solid var(--border)' }}>
                    {pwRules.map(({ key, met, label }) => (
                      <div key={key} className="flex items-center gap-2">
                        <span className="w-3.5 h-3.5 rounded-full flex items-center justify-center text-[8px] font-black shrink-0 transition-all"
                          style={{ background: met ? 'var(--success-bg)' : 'var(--border-strong)', color: met ? 'var(--success)' : 'transparent' }}>
                          {met ? '✓' : ''}
                        </span>
                        <span className="text-[11px] font-medium transition-colors"
                          style={{ color: met ? 'var(--text-2)' : 'var(--text-3)' }}>
                          {label}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                <AnimatePresence>
                  {authError && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                      <div className="px-4 py-3 rounded-xl badge-danger text-xs font-medium">{authError}</div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <button id="auth-submit-btn" type="submit"
                  disabled={authLoading || !pwOk}
                  className="btn-primary w-full py-3 text-sm mt-1 disabled:opacity-50 flex items-center justify-center gap-2">
                  {authLoading && <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />}
                  {t('signupSubmit')}
                </button>
              </form>

              <div className="text-center">
                <button onClick={() => { setIsSignUp(false); setAuthError(''); setShowPassword(false); setShowConfirmPassword(false); }}
                  className="text-sm text-[var(--text-2)] font-medium transition-colors hover:text-[var(--primary)] underline underline-offset-2">
                  {t('backToLogin')}
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      );
    }

    /* Login */
    return (
      <div className="min-h-screen flex relative">
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
            <h2 className="text-3xl font-black text-white mb-2 leading-tight" style={{ whiteSpace: 'pre-line' }}>{t('loginTagline')}</h2>
            <p className="text-sm text-white/40">{t('loginSubtext')}</p>
          </div>
        </div>

        {AuthTopControls}

        {/* Right form panel */}
        <div className="flex-1 flex items-center justify-center p-8 relative overflow-hidden" style={{ background: 'var(--bg)' }}>
          <div className="absolute pointer-events-none" style={{ top: '-20%', right: '-15%', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(20,184,166,0.28) 0%, rgba(13,148,136,0.08) 60%, transparent 80%)', filter: 'blur(70px)' }} />
          <div className="absolute pointer-events-none" style={{ bottom: '-15%', left: '-10%', width: 420, height: 420, borderRadius: '50%', background: 'radial-gradient(circle, rgba(56,189,248,0.18) 0%, rgba(3,105,161,0.07) 60%, transparent 80%)', filter: 'blur(80px)' }} />
          <div className="absolute pointer-events-none" style={{ top: '55%', right: '30%', width: 260, height: 260, borderRadius: '50%', background: 'radial-gradient(circle, rgba(20,184,166,0.12) 0%, transparent 70%)', filter: 'blur(55px)' }} />
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}
            className="w-full max-w-sm">
            {/* Mobile logo */}
            <div className="flex items-center gap-2.5 mb-8 lg:hidden">
              <LogoMark size={28} />
              <span className="text-[var(--text)] font-bold text-base tracking-tight">LogiSync</span>
            </div>

            <h2 className="text-2xl font-bold text-[var(--text)] mb-1">{t('signInTitle')}</h2>
            <p className="text-sm text-[var(--text-2)] mb-8">{t('accessInventory')}</p>

            <form onSubmit={handleAuth} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[var(--text-2)] uppercase tracking-wider mb-1.5">{t('emailLabel')}</label>
                <input id="auth-email-input" type="email" required className="field w-full px-4 py-3 text-sm"
                  placeholder="you@company.com" value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[var(--text-2)] uppercase tracking-wider mb-1.5">{t('passwordLabel')}</label>
                <div className="relative">
                  <input id="auth-password-input" type={showPassword ? 'text' : 'password'} required className="field w-full px-4 py-3 pr-11 text-sm"
                    placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} autoComplete="current-password" />
                  <button type="button" onClick={() => setShowPassword(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                    style={{ color: 'var(--text-3)' }}>
                    {showPassword
                      ? <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"/></svg>
                      : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                    }
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-2.5 pt-1">
                <input type="checkbox" id="remember-me" className="w-4 h-4 rounded accent-[#14b8a6]" />
                <label htmlFor="remember-me" className="text-sm text-[var(--text-2)] font-medium cursor-pointer select-none">{t('rememberMe')}</label>
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
                {t('loginSubmit')}
              </button>
            </form>

            <div className="mt-6 text-center">
              <button onClick={() => { setIsSignUp(true); setAuthError(''); }}
                className="text-sm text-[var(--text-2)] hover:text-[var(--primary)] transition-colors font-medium underline underline-offset-2">
                {t('switchSignup')}
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
    <div className="h-screen flex text-[var(--text)] overflow-hidden" style={{ background: 'var(--bg)' }}>
      <AnimatePresence>
        {showTutorial && (
          <TutorialModal onClose={() => setShowTutorial(false)} t={t} />
        )}
      </AnimatePresence>
      {showScanner && (
        <BarcodeScanner
          t={t}
          items={items}
          onClose={() => setShowScanner(false)}
          onOpenItem={(item) => { setSelectedItem(item); setCurrentTab('dashboard'); }}
          onAddWithSku={(sku) => { setPrefillSku(sku); setEditingItem(null); setIsModalOpen(true); }}
        />
      )}
      <Sidebar
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

        {/* Mobile nav bar — hidden on desktop (sidebar handles nav there) */}
        <div className="lg:hidden sticky top-0 z-30 border-b border-[var(--border)]"
          style={{ background: 'var(--header)', backdropFilter: 'blur(20px) saturate(160%)', WebkitBackdropFilter: 'blur(20px) saturate(160%)' }}>
          <div className="flex items-center gap-3 px-4 sm:px-6 h-14">
            <button onClick={() => setMobileMenuOpen(v => !v)}
              className="w-9 h-9 flex items-center justify-center rounded-xl bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--text-2)] shrink-0">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div className="flex items-center gap-2">
              <LogoMark size={22} />
              <span className="font-bold text-sm text-[var(--text)]">LogiSync</span>
            </div>
          </div>
        </div>

        {/* Stats bar — lives outside main so it sticks flush below the nav bar with no padding gap */}
        {currentTab === 'dashboard' && !selectedItem && (
          <div className="border-b border-[var(--border)] z-20 shrink-0" style={{ background: 'var(--bg)' }}>
            <DashboardStats items={items} compact={true} stuck={statsStuck} t={t} />
          </div>
        )}

        {/* Page */}
        <main ref={mainRef} className="flex-1 px-4 sm:px-6 py-6 pb-12 overflow-y-auto">
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

                    {/* Scan barcode */}
                    <button onClick={() => setShowScanner(true)}
                      className="btn-ghost px-3 py-2 text-xs font-semibold flex items-center gap-1.5" title={t('scanBarcode')}>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                      </svg>
                      <span className="hidden sm:inline">{t('scanBarcode')}</span>
                    </button>

                    {/* Export CSV */}
                    <button onClick={() => exportToCSV(filteredItems, folders)}
                      className="btn-ghost px-3 py-2 text-xs font-semibold flex items-center gap-1.5" title={t('exportCSV')}>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span className="hidden sm:inline">{t('exportCSV')}</span>
                    </button>

                    {/* Import CSV */}
                    <input ref={importInputRef} type="file" accept=".csv,text/csv" className="sr-only"
                      onChange={handleImportCSV} />
                    <button onClick={() => importInputRef.current?.click()} disabled={importing}
                      className="btn-ghost px-3 py-2 text-xs font-semibold flex items-center gap-1.5 disabled:opacity-50" title={t('importCSV')}>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                      </svg>
                      <span className="hidden sm:inline">{importing ? '…' : t('importCSV')}</span>
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

                {/* Folders section */}
                <div className="glass rounded-2xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-bold uppercase tracking-wider text-[var(--text-2)]">{t('folders')}</p>
                    <span className="text-[10px] text-[var(--text-3)]">{folders.length} {t('customFolders').toLowerCase()}</span>
                  </div>

                  <div className="flex flex-wrap gap-2 items-center">
                    {/* System chips: All Stock + Uncategorized */}
                    {[
                      { id: 'all', label: t('allStock'), count: items.length },
                      { id: 'uncategorized', label: t('uncategorized'), count: items.filter(i => !i.folderId).length },
                    ].map(({ id, label, count }) => {
                      const active = activeFolderId === id;
                      return (
                        <button key={id} onClick={() => setActiveFolderId(id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all"
                          style={active ? {
                            background: 'var(--primary-glow)', color: 'var(--primary)',
                            borderColor: 'var(--primary)', boxShadow: '0 0 8px var(--primary)25',
                          } : { background: 'var(--input-bg)', color: 'var(--text-3)', borderColor: 'var(--input-border)' }}>
                          <span className="max-w-[120px] truncate">{label}</span>
                          <span className="opacity-50 font-normal tabular-nums">{count}</span>
                        </button>
                      );
                    })}

                    {/* Custom folder chips: color dot (opens picker) + label (filters) */}
                    {folders.map(folder => {
                      const count = items.filter(i => i.folderId === folder.id).length;
                      const active = activeFolderId === folder.id;
                      const color = folder.color || null;
                      const chipStyle = active ? {
                        color: color || 'var(--primary)',
                        borderColor: color ? `${color}50` : 'var(--primary)',
                        background: color ? `${color}18` : 'var(--primary-glow)',
                        boxShadow: `0 0 8px ${color || 'var(--primary)'}25`,
                      } : { background: 'var(--input-bg)', color: 'var(--text-3)', borderColor: 'var(--input-border)' };
                      return (
                        <div key={folder.id} className="flex items-center rounded-xl border text-xs font-semibold overflow-hidden transition-all"
                          style={chipStyle}>
                          {/* Color dot → opens picker */}
                          <button type="button"
                            onClick={e => openDashColorPicker(e, folder.id)}
                            title={t('folderColour')}
                            className="pl-2.5 pr-1 py-1.5 flex items-center hover:opacity-70 transition-opacity">
                            <span className="w-2.5 h-2.5 rounded-full shrink-0 transition-transform hover:scale-125"
                              style={{ background: color || 'var(--border-strong)', boxShadow: color ? `0 0 4px ${color}` : 'none' }} />
                          </button>
                          {/* Label → filters inventory */}
                          <button type="button" onClick={() => setActiveFolderId(folder.id)}
                            className="flex items-center gap-1 pr-2.5 py-1.5">
                            <span className="max-w-[100px] truncate">{folder.name}</span>
                            <span className="opacity-50 font-normal tabular-nums">{count}</span>
                          </button>
                        </div>
                      );
                    })}

                    {/* New folder inline */}
                    {dashFolderOpen ? (
                      <form onSubmit={handleDashCreateFolder} className="flex items-center gap-1.5">
                        <input autoFocus type="text" placeholder={t('folderPlaceholder')}
                          value={dashFolderName} onChange={e => setDashFolderName(e.target.value)}
                          className="field px-3 py-1.5 text-xs rounded-xl w-32" />
                        <button type="submit"
                          className="w-7 h-7 rounded-lg btn-primary flex items-center justify-center shrink-0">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
                          </svg>
                        </button>
                        <button type="button" onClick={() => { setDashFolderOpen(false); setDashFolderName(''); }}
                          className="w-7 h-7 rounded-lg btn-ghost flex items-center justify-center shrink-0 text-[var(--text-3)]">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </form>
                    ) : (
                      <button onClick={() => setDashFolderOpen(true)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border-dashed border"
                        style={{ borderColor: 'var(--border-strong)', color: 'var(--text-3)' }}>
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
                        </svg>
                        {t('createNewFolder')}
                      </button>
                    )}
                  </div>

                  {/* Dashboard color picker */}
                  {dashColorFolderId && (
                    <>
                      <div className="fixed inset-0 z-[90]" onClick={() => setDashColorFolderId(null)} />
                      <ColorSwatch
                        currentColor={folders.find(f => f.id === dashColorFolderId)?.color || null}
                        position={dashSwatchPos}
                        onSelect={c => handleDashColorChange(dashColorFolderId, c)}
                        t={t}
                      />
                    </>
                  )}
                  {/* Sentinel: when this scrolls above main's top, stats bar collapses to slim */}
                  <div data-folders-end />
                </div>

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
        onClose={() => { setIsModalOpen(false); setPrefillSku(''); }}
        editingItem={editingItem}
        folders={folders}
        user={user}
        activeFolderId={activeFolderId}
        prefillSku={prefillSku}
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
