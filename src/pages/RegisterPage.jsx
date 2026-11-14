import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Sprout, 
  User, 
  Lock, 
  MapPin, 
  ArrowRight, 
  ShieldCheck
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { INDIAN_STATES } from '../data/sampleSoilReports';
import { LANGUAGES } from '../i18n/languages';

export default function RegisterPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { register } = useAuth();

  const [formData, setFormData] = useState({
    name: '',
    mobile: '',
    password: '',
    village: '',
    district: '',
    state: 'Punjab',
    preferredLanguage: 'en',
    landSize: '3-5 Acres'
  });

  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'mobile' ? value.replace(/\D/g, '') : value
    }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError(t('register.nameValidation', 'Please enter your full name'));
      return;
    }
    if (!formData.mobile || formData.mobile.length < 10) {
      setError(t('register.phoneValidation', 'Please enter a valid 10-digit mobile number'));
      return;
    }
    if (!formData.password || formData.password.length < 4) {
      setError(t('register.passwordMinValidation', 'Password must be at least 4 characters'));
      return;
    }
    if (!formData.district.trim()) {
      setError(t('register.districtValidation', 'Please enter your district name'));
      return;
    }

    try {
      await register(formData);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || t('register.failed', 'Registration failed. Please try again.'));
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-lg text-center px-4">
        <Link to="/" className="inline-flex items-center gap-2.5 mb-4 group">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-600 to-green-800 flex items-center justify-center text-white shadow-lg shadow-emerald-900/20 group-hover:scale-105 transition-transform">
            <Sprout className="w-7 h-7" />
          </div>
          <span className="text-3xl font-black text-emerald-950 tracking-tight">
            Krishi<span className="text-emerald-600">Saathi</span>
          </span>
        </Link>
        
        <h2 className="text-2xl sm:text-3xl font-black text-stone-900">
          {t('register.farmerRegistration', 'Farmer Registration')}
        </h2>
        <p className="mt-2 text-sm text-stone-600">
          {t('register.createAccountSub', 'Create an account to start tracking soil health and receiving AI recommendations')}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-xl px-4">
        <div className="bg-white py-8 px-6 sm:px-10 rounded-3xl shadow-xl border border-stone-200">
          
          {error && (
            <div className="mb-5 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Farmer Name */}
            <div>
              <label className="block text-xs font-black text-stone-800 uppercase tracking-wider mb-1.5">
                {t('register.fullName', 'Farmer Full Name *')}
              </label>
              <div className="relative rounded-2xl shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                  <User className="w-5 h-5" />
                </div>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder={t('register.namePlaceholder', 'e.g. Ramesh Kumar')}
                  className="block w-full pl-11 pr-4 py-3 rounded-2xl border border-stone-300 text-stone-900 text-sm font-semibold placeholder-stone-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Mobile & Password Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-black text-stone-800 uppercase tracking-wider mb-1.5">
                  {t('register.mobileNumber', 'Mobile Number *')}
                </label>
                <div className="relative rounded-2xl shadow-xs">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-500 font-bold text-xs">
                    +91
                  </div>
                  <input
                    type="tel"
                    name="mobile"
                    maxLength={10}
                    value={formData.mobile}
                    onChange={handleChange}
                    placeholder="9876543210"
                    className="block w-full pl-12 pr-4 py-3 rounded-2xl border border-stone-300 text-stone-900 text-sm font-semibold placeholder-stone-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-stone-800 uppercase tracking-wider mb-1.5">
                  {t('register.password', 'Password *')}
                </label>
                <div className="relative rounded-2xl shadow-xs">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder={t('register.passwordHint', 'Minimum 4 characters')}
                    className="block w-full pl-10 pr-4 py-3 rounded-2xl border border-stone-300 text-stone-900 text-sm font-semibold placeholder-stone-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
              </div>
            </div>

            {/* Village & District Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-black text-stone-800 uppercase tracking-wider mb-1.5">
                  {t('register.village', 'Village')}
                </label>
                <div className="relative rounded-2xl shadow-xs">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    name="village"
                    value={formData.village}
                    onChange={handleChange}
                    placeholder={t('register.villagePlaceholder', 'e.g. Kila Raipur')}
                    className="block w-full pl-10 pr-4 py-3 rounded-2xl border border-stone-300 text-stone-900 text-sm font-semibold placeholder-stone-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-stone-800 uppercase tracking-wider mb-1.5">
                  {t('register.district', 'District *')}
                </label>
                <div className="relative rounded-2xl shadow-xs">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    name="district"
                    value={formData.district}
                    onChange={handleChange}
                    placeholder={t('register.districtPlaceholder', 'e.g. Ludhiana')}
                    className="block w-full pl-10 pr-4 py-3 rounded-2xl border border-stone-300 text-stone-900 text-sm font-semibold placeholder-stone-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
              </div>
            </div>

            {/* State & Language Dropdowns */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-black text-stone-800 uppercase tracking-wider mb-1.5">
                  {t('register.state', 'State *')}
                </label>
                <select
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                  className="block w-full py-3 px-3.5 rounded-2xl border border-stone-300 text-stone-900 text-sm font-semibold bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 cursor-pointer"
                >
                  {INDIAN_STATES.map((st) => (
                    <option key={st} value={st}>{st}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-black text-stone-800 uppercase tracking-wider mb-1.5">
                  {t('register.preferredLanguage', 'Preferred Language *')}
                </label>
                <div className="relative rounded-2xl shadow-xs">
                  <select
                    name="preferredLanguage"
                    value={formData.preferredLanguage}
                    onChange={handleChange}
                    className="block w-full py-3 px-3.5 rounded-2xl border border-stone-300 text-stone-900 text-sm font-semibold bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 cursor-pointer"
                  >
                    {LANGUAGES.map((lang) => (
                      <option key={lang.code} value={lang.code} disabled={!lang.supported}>
                        {lang.nativeName} ({lang.name}){lang.supported ? '' : ` — ${t('common.comingSoon', 'Coming soon')}`}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Farm Acreage */}
            <div>
              <label className="block text-xs font-black text-stone-800 uppercase tracking-wider mb-1.5">
                {t('register.landSize', 'Approximate Land Size')}
              </label>
              <div className="grid grid-cols-4 gap-2">
                {["1-2 Acres", "3-5 Acres", "5-10 Acres", "10+ Acres"].map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, landSize: size }))}
                    className={`py-2 px-1 text-center text-xs font-bold rounded-xl border transition cursor-pointer ${
                      formData.landSize === size 
                        ? 'bg-emerald-100 border-emerald-600 text-emerald-900' 
                        : 'bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100'
                    }`}
                  >
                    {size.replace('Acres', t('common.acres', 'Acres'))}
                  </button>
                ))}
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                className="w-full py-4 px-4 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white font-black text-base shadow-lg shadow-emerald-700/20 flex items-center justify-center gap-2 transition active:scale-98 cursor-pointer"
              >
                <span>{t('register.createBtn', 'Create Account & Continue')}</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </form>

          {/* Already registered */}
          <div className="mt-6 text-center pt-4 border-t border-stone-100">
            <p className="text-sm text-stone-600">
              {t('register.alreadyRegistered', 'Already registered?')}{' '}
              <Link to="/login" className="font-bold text-emerald-700 hover:text-emerald-800 hover:underline">
                {t('register.signInHere', 'Sign in here')}
              </Link>
            </p>
          </div>

        </div>

        <div className="mt-6 text-center flex items-center justify-center gap-2 text-xs text-stone-500">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>{t('register.dataPrivacyNotice', 'Your data is securely stored and never shared with third parties.')}</span>
        </div>
      </div>
    </div>
  );
}
