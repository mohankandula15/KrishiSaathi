import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  Sprout, 
  Phone, 
  Lock, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  Sparkles, 
  ShieldCheck,
  Loader2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';

export default function LoginPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { login, demoLogin, isLoading: authLoading, authStatus } = useAuth();

  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Check for session expired redirect message
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const msg = params.get('message') || sessionStorage.getItem('login_message');
    if (msg) {
      setError(msg === 'Session expired, please log in again' ? t('login.sessionExpired', msg) : msg);
      sessionStorage.removeItem('login_message');
    }
  }, [location.search, t]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!mobile || mobile.length < 10) {
      setError(t('login.phoneValidation', 'Please enter a valid 10-digit mobile number'));
      return;
    }
    if (!password) {
      setError(t('login.passwordValidation', 'Please enter your password'));
      return;
    }

    setIsSubmitting(true);
    setError('');
    try {
      await login(mobile, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || t('login.failed', 'Login failed. Please check credentials.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDemoLogin = async (profileKey = 'punjab') => {
    setIsSubmitting(true);
    setError('');
    try {
      await demoLogin(profileKey);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || t('login.demoFailed', 'Demo login failed. Please retry.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const isLoading = isSubmitting || authLoading;

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center px-4">
        <Link to="/" className="inline-flex items-center gap-2.5 mb-4 group">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-600 to-green-800 flex items-center justify-center text-white shadow-lg shadow-emerald-900/20 group-hover:scale-105 transition-transform">
            <Sprout className="w-7 h-7" />
          </div>
          <span className="text-3xl font-black text-emerald-950 tracking-tight">
            Krishi<span className="text-emerald-600">Saathi</span>
          </span>
        </Link>
        
        <h2 className="text-2xl sm:text-3xl font-black text-stone-900">
          {t('login.farmerLogin', 'Farmer Login')}
        </h2>
        <p className="mt-2 text-sm text-stone-600">
          {t('login.signInSubtitle', 'Sign in with your registered mobile number')}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-white py-8 px-6 sm:px-10 rounded-3xl shadow-xl border border-stone-200">
          
          {authStatus && (
            <div className="mb-5 p-3.5 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-xs font-bold flex items-center gap-2.5 animate-pulse">
              <Loader2 className="w-4 h-4 animate-spin text-amber-700 shrink-0" />
              <span>{authStatus}</span>
            </div>
          )}

          {error && (
            <div className="mb-5 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Mobile Number */}
            <div>
              <label className="block text-xs font-black text-stone-800 uppercase tracking-wider mb-2">
                {t('login.mobileLabel', 'Mobile Number')}
              </label>
              <div className="relative rounded-2xl shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-500 font-bold text-sm">
                  <span>+91</span>
                </div>
                <input
                  type="tel"
                  maxLength={10}
                  value={mobile}
                  onChange={(e) => {
                    setMobile(e.target.value.replace(/\D/g, ''));
                    setError('');
                  }}
                  placeholder="98765 43210"
                  className="block w-full pl-14 pr-4 py-3.5 rounded-2xl border border-stone-300 text-stone-900 text-base font-semibold placeholder-stone-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
                <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-stone-400">
                  <Phone className="w-5 h-5" />
                </div>
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-xs font-black text-stone-800 uppercase tracking-wider">
                  {t('login.passwordLabel', 'Password')}
                </label>
                <button 
                  type="button" 
                  onClick={() => alert(t('login.demoCredentialsAlert', 'Demo account credentials: Phone 9876543210 / Password: password123. Or simply tap "Ramesh Kumar" below.'))} 
                  className="text-xs font-bold text-emerald-700 hover:underline cursor-pointer"
                >
                  {t('login.forgotPassword', 'Forgot password?')}
                </button>
              </div>
              <div className="relative rounded-2xl shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                  <Lock className="w-5 h-5" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError('');
                  }}
                  placeholder="••••••••"
                  className="block w-full pl-11 pr-11 py-3.5 rounded-2xl border border-stone-300 text-stone-900 text-base font-semibold placeholder-stone-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-stone-400 hover:text-stone-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-4 px-4 rounded-2xl bg-emerald-700 hover:bg-emerald-800 disabled:opacity-60 text-white font-black text-base shadow-lg shadow-emerald-700/20 flex items-center justify-center gap-2 transition active:scale-98 cursor-pointer disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>{t('login.signingIn', 'Signing In...')}</span>
                  </>
                ) : (
                  <>
                    <span>{t('login.loginBtn', 'Login')}</span>
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Quick Demo Login Section */}
          <div className="mt-8 pt-6 border-t border-stone-200">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span className="text-xs font-black uppercase text-stone-700 tracking-wider">
                {t('login.instantDemoTitle', '1-Click Instant Demo Login')}
              </span>
            </div>
            <p className="text-xs text-stone-500 mb-3">
              {t('login.instantDemoSubtitle', 'Click any profile below to test with preloaded soil and crop data:')}
            </p>

            <div className="space-y-2">
              <button
                type="button"
                disabled={isLoading}
                onClick={() => handleDemoLogin('punjab')}
                className="w-full py-2.5 px-3 rounded-xl border border-emerald-300 bg-emerald-50/70 hover:bg-emerald-100/70 disabled:opacity-50 text-left flex items-center justify-between text-xs transition cursor-pointer disabled:cursor-not-allowed"
              >
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-700 text-white flex items-center justify-center font-bold text-xs">
                    R
                  </div>
                  <div>
                    <span className="font-bold text-stone-900">Ramesh Kumar</span>
                    <p className="text-[10px] text-stone-500">{t('login.punjabProfileDesc', 'Ludhiana, Punjab • Alluvial Soil (Wheat/Paddy)')}</p>
                  </div>
                </div>
                <span className="font-bold text-emerald-800 text-[11px] bg-white px-2 py-0.5 rounded-md border border-emerald-200">
                  {t('login.loginBtn', 'Login')} →
                </span>
              </button>

              <button
                type="button"
                disabled={isLoading}
                onClick={() => handleDemoLogin('maharashtra')}
                className="w-full py-2.5 px-3 rounded-xl border border-amber-300 bg-amber-50/70 hover:bg-amber-100/70 disabled:opacity-50 text-left flex items-center justify-between text-xs transition cursor-pointer disabled:cursor-not-allowed"
              >
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-amber-700 text-white flex items-center justify-center font-bold text-xs">
                    S
                  </div>
                  <div>
                    <span className="font-bold text-stone-900">Suresh Patil</span>
                    <p className="text-[10px] text-stone-500">{t('login.maharashtraProfileDesc', 'Baramati, Maharashtra • Black Soil (Cotton/Soybean)')}</p>
                  </div>
                </div>
                <span className="font-bold text-amber-900 text-[11px] bg-white px-2 py-0.5 rounded-md border border-amber-200">
                  {t('login.loginBtn', 'Login')} →
                </span>
              </button>
            </div>
          </div>

          {/* Register Link */}
          <div className="mt-6 text-center pt-4 border-t border-stone-100">
            <p className="text-sm text-stone-600">
              {t('login.newToKrishiSaathi', 'New to KrishiSaathi?')}{' '}
              <Link to="/register" className="font-bold text-emerald-700 hover:text-emerald-800 hover:underline">
                {t('login.createAccount', 'Create an account')}
              </Link>
            </p>
          </div>

        </div>

        <div className="mt-6 text-center flex items-center justify-center gap-2 text-xs text-stone-500">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>{t('login.secureEncryption', 'Secure Farmer Data Encryption')}</span>
        </div>
      </div>
    </div>
  );
}
