import React, { useState } from 'react';
import { 
  Settings, 
  User, 
  Bell, 
  Check, 
  Save, 
  Lock
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { LANGUAGES } from '../i18n/languages';

export default function SettingsPage() {
  const { t } = useTranslation();
  const { user, updateProfile, language, setLanguage } = useAuth();

  const [formData, setFormData] = useState({
    name: user?.name || "Ramesh Kumar",
    mobile_number: user?.mobile_number || "9876543210",
    village: user?.village || "Kila Raipur",
    district: user?.district || "Ludhiana",
    state: user?.state || "Punjab",
    landSize: user?.landSize || "3.5 Acres",
    primaryCrop: user?.primaryCrop || "Wheat & Paddy",
    preferred_language: user?.preferred_language || language || "en"
  });

  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [notifications, setNotifications] = useState({
    smsAlerts: true,
    weatherAlerts: true,
    fertilizerReminders: true,
    pestWarnings: false
  });

  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await updateProfile(formData);
      setLanguage(formData.preferred_language);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    if (passwords.newPassword && passwords.newPassword === passwords.confirmPassword) {
      setPasswordSuccess(true);
      setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setTimeout(() => setPasswordSuccess(false), 3000);
    } else {
      alert(t('settings.passwordMismatch', 'Passwords do not match or cannot be empty.'));
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      
      {/* Header Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E2EBE2] shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#245C3A] text-white flex items-center justify-center font-bold shadow-xs">
            <Settings className="w-6 h-6 text-emerald-100" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-[#26332B] tracking-tight">
              {t('settings.title', 'Settings & Farm Preferences')}
            </h1>
            <p className="text-xs text-[#5C6E63] mt-0.5">
              {t('settings.subtitle', 'Manage your farmer profile, regional language, and farm measurement units')}
            </p>
          </div>
        </div>
      </div>

      {/* Main Settings Grid */}
      <div className="grid grid-cols-1 gap-8">
        
        {/* Profile Settings Form */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E2EBE2] shadow-xs space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-[#E2EBE2]">
            <div className="flex items-center gap-2">
              <User className="w-5 h-5 text-[#245C3A]" />
              <h2 className="text-base font-black text-[#26332B]">
                {t('settings.profileSettings', 'Farmer Profile & Land Details')}
              </h2>
            </div>
            {saveSuccess && (
              <span className="text-xs font-bold text-[#245C3A] bg-[#E8F0E7] px-3 py-1 rounded-full flex items-center gap-1.5 animate-in fade-in">
                <Check className="w-3.5 h-3.5" />
                {t('settings.savedSuccess', 'Profile Updated Successfully')}
              </span>
            )}
          </div>

          <form onSubmit={handleProfileSubmit} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs">
              
              <div>
                <label className="block text-[#5C6E63] font-bold uppercase tracking-wider mb-1.5">
                  {t('register.fullName', 'Full Farmer Name')}
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full py-2.5 px-3.5 bg-[#F8FAF7] rounded-xl border border-[#E2EBE2] text-sm text-[#26332B] font-bold focus:ring-2 focus:ring-[#245C3A] focus:outline-hidden"
                  required
                />
              </div>

              <div>
                <label className="block text-[#5C6E63] font-bold uppercase tracking-wider mb-1.5">
                  {t('login.mobileLabel', 'Mobile Number')}
                </label>
                <input
                  type="text"
                  value={formData.mobile_number}
                  readOnly
                  className="w-full py-2.5 px-3.5 bg-[#F8FAF7] rounded-xl border border-[#E2EBE2] text-sm text-[#5C6E63] font-mono cursor-not-allowed"
                  title={t('settings.mobileLocked', 'Mobile number is tied to your farmer account')}
                />
              </div>

              <div>
                <label className="block text-[#5C6E63] font-bold uppercase tracking-wider mb-1.5">
                  {t('register.village', 'Village')}
                </label>
                <input
                  type="text"
                  value={formData.village}
                  onChange={(e) => setFormData({ ...formData, village: e.target.value })}
                  className="w-full py-2.5 px-3.5 bg-[#F8FAF7] rounded-xl border border-[#E2EBE2] text-sm text-[#26332B] font-medium focus:ring-2 focus:ring-[#245C3A] focus:outline-hidden"
                  required
                />
              </div>

              <div>
                <label className="block text-[#5C6E63] font-bold uppercase tracking-wider mb-1.5">
                  {t('register.district', 'District')}
                </label>
                <input
                  type="text"
                  value={formData.district}
                  onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                  className="w-full py-2.5 px-3.5 bg-[#F8FAF7] rounded-xl border border-[#E2EBE2] text-sm text-[#26332B] font-medium focus:ring-2 focus:ring-[#245C3A] focus:outline-hidden"
                  required
                />
              </div>

              <div>
                <label className="block text-[#5C6E63] font-bold uppercase tracking-wider mb-1.5">
                  {t('register.state', 'State')}
                </label>
                <input
                  type="text"
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  className="w-full py-2.5 px-3.5 bg-[#F8FAF7] rounded-xl border border-[#E2EBE2] text-sm text-[#26332B] font-medium focus:ring-2 focus:ring-[#245C3A] focus:outline-hidden"
                  required
                />
              </div>

              <div>
                <label className="block text-[#5C6E63] font-bold uppercase tracking-wider mb-1.5">
                  {t('dashboard.farmSize', 'Total Farm Size')}
                </label>
                <input
                  type="text"
                  value={formData.landSize}
                  onChange={(e) => setFormData({ ...formData, landSize: e.target.value })}
                  placeholder={t('settings.landSizePlaceholder', 'e.g. 3.5 Acres')}
                  className="w-full py-2.5 px-3.5 bg-[#F8FAF7] rounded-xl border border-[#E2EBE2] text-sm text-[#26332B] font-medium focus:ring-2 focus:ring-[#245C3A] focus:outline-hidden"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[#5C6E63] font-bold uppercase tracking-wider mb-1.5">
                  {t('settings.languageSettings', 'Preferred Platform Language')}
                </label>
                <select
                  value={formData.preferred_language}
                  onChange={(e) => setFormData({ ...formData, preferred_language: e.target.value })}
                  className="w-full py-2.5 px-3.5 bg-[#F8FAF7] rounded-xl border border-[#E2EBE2] text-sm text-[#26332B] font-bold focus:ring-2 focus:ring-[#245C3A] focus:outline-hidden cursor-pointer"
                >
                  {LANGUAGES.map((l) => (
                    <option key={l.code} value={l.code} disabled={!l.supported}>
                      {l.nativeName} ({l.name}){l.supported ? '' : ` — ${t('common.comingSoon', 'Coming soon')}`}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-[#5C6E63] mt-1">
                  {t('settings.languageHelp', 'Select your preferred regional language across the portal and voice assistant.')}
                </p>
              </div>

            </div>

            <div className="pt-4 border-t border-[#E2EBE2] flex items-center justify-end">
              <button
                type="submit"
                disabled={isSaving}
                className="px-6 py-2.5 rounded-xl bg-[#245C3A] hover:bg-[#1B462C] text-white font-bold text-xs flex items-center gap-2 shadow-xs transition active:scale-98 cursor-pointer disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{isSaving ? t('common.loading', 'Saving...') : t('settings.saveChanges', 'Save Profile Changes')}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Notifications & Alert Preferences */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E2EBE2] shadow-xs space-y-6">
          <div className="pb-4 border-b border-[#E2EBE2] flex items-center gap-2">
            <Bell className="w-5 h-5 text-[#245C3A]" />
            <h2 className="text-base font-black text-[#26332B]">
              {t('settings.advisoryChannels', 'Agricultural Advisory & Alert Channels')}
            </h2>
          </div>

          <div className="space-y-4 text-xs">
            
            <div className="p-4 rounded-2xl bg-[#F8FAF7] border border-[#E2EBE2] flex items-center justify-between">
              <div>
                <p className="font-bold text-[#26332B]">{t('settings.weatherAlerts', 'Weather & Extreme Rain Alerts')}</p>
                <p className="text-[#5C6E63] text-[11px]">{t('settings.weatherAlertsDesc', 'Instant SMS warnings about hailstorms, heavy precipitation, and frost')}</p>
              </div>
              <input
                type="checkbox"
                checked={notifications.weatherAlerts}
                onChange={(e) => setNotifications({ ...notifications, weatherAlerts: e.target.checked })}
                className="w-4 h-4 accent-[#245C3A] cursor-pointer"
              />
            </div>

            <div className="p-4 rounded-2xl bg-[#F8FAF7] border border-[#E2EBE2] flex items-center justify-between">
              <div>
                <p className="font-bold text-[#26332B]">{t('settings.fertilizerReminders', 'Fertilizer Top Dressing Reminders')}</p>
                <p className="text-[#5C6E63] text-[11px]">{t('settings.fertilizerRemindersDesc', 'Milestone alerts at 21 days (CRI stage) and 45 days (tillering stage)')}</p>
              </div>
              <input
                type="checkbox"
                checked={notifications.fertilizerReminders}
                onChange={(e) => setNotifications({ ...notifications, fertilizerReminders: e.target.checked })}
                className="w-4 h-4 accent-[#245C3A] cursor-pointer"
              />
            </div>

            <div className="p-4 rounded-2xl bg-[#F8FAF7] border border-[#E2EBE2] flex items-center justify-between">
              <div>
                <p className="font-bold text-[#26332B]">{t('settings.pestWarnings', 'Pest & Disease Outbreak Bulletins')}</p>
                <p className="text-[#5C6E63] text-[11px]">{t('settings.pestWarningsDesc', 'Regional ICAR advisories for yellow rust, aphids, and stem borers')}</p>
              </div>
              <input
                type="checkbox"
                checked={notifications.pestWarnings}
                onChange={(e) => setNotifications({ ...notifications, pestWarnings: e.target.checked })}
                className="w-4 h-4 accent-[#245C3A] cursor-pointer"
              />
            </div>

          </div>
        </div>

        {/* Security & Password */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E2EBE2] shadow-xs space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-[#E2EBE2]">
            <div className="flex items-center gap-2">
              <Lock className="w-5 h-5 text-[#245C3A]" />
              <h2 className="text-base font-black text-[#26332B]">
                {t('settings.accountSecurity', 'Account Security & Password')}
              </h2>
            </div>
            {passwordSuccess && (
              <span className="text-xs font-bold text-[#245C3A] bg-[#E8F0E7] px-3 py-1 rounded-full flex items-center gap-1.5 animate-in fade-in">
                <Check className="w-3.5 h-3.5" />
                {t('settings.passwordUpdated', 'Password Updated')}
              </span>
            )}
          </div>

          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-[#5C6E63] font-bold uppercase tracking-wider mb-1.5">
                  {t('settings.newPassword', 'New Password')}
                </label>
                <input
                  type="password"
                  value={passwords.newPassword}
                  onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
                  placeholder={t('settings.min6Chars', 'Minimum 6 characters')}
                  className="w-full py-2.5 px-3.5 bg-[#F8FAF7] rounded-xl border border-[#E2EBE2] text-sm text-[#26332B] focus:ring-2 focus:ring-[#245C3A] focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-[#5C6E63] font-bold uppercase tracking-wider mb-1.5">
                  {t('settings.confirmPassword', 'Confirm New Password')}
                </label>
                <input
                  type="password"
                  value={passwords.confirmPassword}
                  onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })}
                  placeholder={t('settings.reenterPassword', 'Re-enter password')}
                  className="w-full py-2.5 px-3.5 bg-[#F8FAF7] rounded-xl border border-[#E2EBE2] text-sm text-[#26332B] focus:ring-2 focus:ring-[#245C3A] focus:outline-hidden"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={!passwords.newPassword}
                className="px-5 py-2.5 rounded-xl bg-[#245C3A] hover:bg-[#1B462C] disabled:opacity-40 text-white font-bold text-xs transition cursor-pointer"
              >
                {t('settings.updatePassword', 'Update Password')}
              </button>
            </div>
          </form>
        </div>

      </div>

    </div>
  );
}
