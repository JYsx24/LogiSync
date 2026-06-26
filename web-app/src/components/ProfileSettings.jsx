import React, { useState } from 'react';
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { auth } from '../firebase';
import { useToast } from './Toast';

function Toggle({ value, onChange }) {
  return (
    <button onClick={() => onChange(!value)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none ${value ? 'bg-[var(--primary)]' : 'bg-[var(--border-strong)]'}`}>
      <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200 ${value ? 'translate-x-6' : 'translate-x-1'}`} />
    </button>
  );
}

function EditableField({ label, value, onChange, type = 'text', disabled = false }) {
  const [editing, setEditing] = useState(false);
  return (
    <div>
      <label className="block text-[10px] font-bold text-[var(--text-3)] uppercase tracking-wider mb-1.5">{label}</label>
      <div className="relative flex items-center">
        <input
          type={type}
          value={value}
          onChange={e => onChange(e.target.value)}
          disabled={!editing || disabled}
          className={`field w-full px-4 py-2.5 pr-10 text-sm ${(!editing || disabled) ? 'opacity-70' : ''}`}
        />
        {!disabled && (
          <button onClick={() => setEditing(v => !v)}
            className="absolute right-3 text-[var(--text-3)] hover:text-[var(--primary)] transition-colors">
            {editing
              ? <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" /></svg>
              : <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
            }
          </button>
        )}
      </div>
    </div>
  );
}

export default function ProfileSettings({
  user, profileName, setProfileName, savingProfile, handleSaveProfile,
  theme, setTheme, language, setLanguage, t,
}) {
  const toast = useToast();
  const [notifStockAlerts, setNotifStockAlerts] = useState(true);
  const [notifLowStock, setNotifLowStock] = useState(true);
  const [notifSystemUpdates, setNotifSystemUpdates] = useState(true);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  const displayRole = 'Admin';
  const [emailValue] = useState(user.email);

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) { toast('Passwords do not match', 'error'); return; }
    if (newPassword.length < 6) { toast('Password must be at least 6 characters', 'error'); return; }
    setChangingPassword(true);
    try {
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(auth.currentUser, credential);
      await updatePassword(auth.currentUser, newPassword);
      toast('Password updated successfully');
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
    } catch (err) {
      toast(err.code === 'auth/wrong-password' ? 'Current password is incorrect' : 'Failed to update password', 'error');
    } finally { setChangingPassword(false); }
  };

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-[var(--text)]">Profile & Settings</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* User Profile */}
        <div className="glass rounded-2xl p-6 flex flex-col gap-5">
          <h2 className="text-sm font-bold text-[var(--text)]">User Profile</h2>

          {/* Avatar */}
          <div className="flex flex-col items-center gap-3 py-2">
            <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-teal-500 to-sky-500 flex items-center justify-center text-white text-2xl font-black uppercase shadow-lg">
              {profileName?.charAt(0) || user.email.charAt(0)}
            </div>
            <p className="text-base font-bold text-[var(--text)]">{profileName || user.email.split('@')[0]}</p>
          </div>

          {/* Fields */}
          <div className="flex flex-col gap-4">
            <EditableField label="Name" value={profileName} onChange={setProfileName} />
            <EditableField label="Email" value={emailValue} onChange={() => {}} disabled={true} type="email" />
            <EditableField label="Role" value={displayRole} onChange={() => {}} disabled={true} />
          </div>
        </div>

        {/* Notification Preferences */}
        <div className="glass rounded-2xl p-6 flex flex-col gap-5">
          <h2 className="text-sm font-bold text-[var(--text)]">Notification Preferences</h2>
          <div className="flex flex-col gap-5">
            {[
              { label: 'Stock Alerts', value: notifStockAlerts, setter: setNotifStockAlerts },
              { label: 'Low Stock Warnings', value: notifLowStock, setter: setNotifLowStock },
              { label: 'System Updates', value: notifSystemUpdates, setter: setNotifSystemUpdates },
            ].map(({ label, value, setter }) => (
              <div key={label} className="flex items-center justify-between">
                <span className="text-sm text-[var(--text-2)] font-medium">{label}</span>
                <Toggle value={value} onChange={setter} />
              </div>
            ))}
          </div>

          {/* Appearance + Language */}
          <div className="border-t border-[var(--border)] pt-4 flex flex-col gap-4">
            <div>
              <p className="text-[10px] font-bold text-[var(--text-3)] uppercase tracking-wider mb-2">Appearance</p>
              <div className="grid grid-cols-2 gap-2">
                {[['dark', '🌙 Dark'], ['light', '☀️ Light']].map(([val, label]) => (
                  <button key={val} onClick={() => setTheme(val)}
                    className={`py-1.5 px-3 rounded-lg text-xs font-semibold transition-all ${theme === val ? 'bg-[var(--primary)] text-[#09090b]' : 'btn-ghost'}`}>
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-[10px] font-bold text-[var(--text-3)] uppercase tracking-wider mb-2">Language</p>
              <div className="grid grid-cols-2 gap-2">
                {[['en', 'English'], ['zh', '中文']].map(([val, label]) => (
                  <button key={val} onClick={() => setLanguage(val)}
                    className={`py-1.5 px-3 rounded-lg text-xs font-semibold transition-all ${language === val ? 'bg-[var(--primary)] text-[#09090b]' : 'btn-ghost'}`}>
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Security */}
        <div className="glass rounded-2xl p-6 flex flex-col gap-5">
          <h2 className="text-sm font-bold text-[var(--text)]">Security</h2>
          <form onSubmit={handleChangePassword} className="flex flex-col gap-4">
            <div>
              <label className="block text-[10px] font-bold text-[var(--text-3)] uppercase tracking-wider mb-1.5">Current Password</label>
              <input type="password" placeholder="••••••••"
                value={currentPassword} onChange={e => setCurrentPassword(e.target.value)}
                className="field w-full px-4 py-2.5 text-sm" autoComplete="current-password" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-[var(--text-3)] uppercase tracking-wider mb-1.5">New Password</label>
              <input type="password" placeholder="••••••••"
                value={newPassword} onChange={e => setNewPassword(e.target.value)}
                className="field w-full px-4 py-2.5 text-sm" autoComplete="new-password" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-[var(--text-3)] uppercase tracking-wider mb-1.5">Confirm Password</label>
              <input type="password" placeholder="••••••••"
                value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                className="field w-full px-4 py-2.5 text-sm" autoComplete="new-password" />
            </div>
            <button type="submit" disabled={changingPassword || !currentPassword || !newPassword || !confirmPassword}
              className="btn-primary py-2.5 text-sm font-bold disabled:opacity-50 flex items-center justify-center gap-2 mt-auto">
              {changingPassword && <span className="w-3.5 h-3.5 border-2 border-black/30 border-t-black rounded-full animate-spin" />}
              Update Password
            </button>
          </form>
        </div>
      </div>

      {/* Save Changes */}
      <button onClick={handleSaveProfile}
        disabled={savingProfile}
        className="btn-primary w-full py-3.5 text-base font-bold disabled:opacity-60 flex items-center justify-center gap-2">
        {savingProfile && <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />}
        Save Changes
      </button>
    </div>
  );
}
