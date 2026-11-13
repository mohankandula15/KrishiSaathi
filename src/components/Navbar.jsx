import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Sprout, 
  FileText, 
  Bot, 
  BarChart3, 
  UploadCloud, 
  Menu, 
  X, 
  User, 
  Globe, 
  LogOut,
  ChevronDown
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSoil } from '../context/SoilContext';
import { SUPPORTED_LANGUAGES } from '../data/sampleSoilReports';

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, language, setLanguage } = useAuth();
  const { setIsUploadModalOpen } = useSoil();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);

  const isActive = (path) => location.pathname === path;

  const navLinks = [
    { name: "Home", path: "/" },
    { name: "Farmer Dashboard", path: "/dashboard" },
    { name: "Soil Analysis", path: "/soil-analysis" },
    { name: "AI Assistant", path: "/ai-assistant", badge: "Voice" },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-emerald-900/10 shadow-xs">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-600 to-green-800 flex items-center justify-center text-white shadow-md shadow-emerald-900/20 group-hover:scale-105 transition-transform">
              <Sprout className="w-7 h-7 text-emerald-100" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-black tracking-tight text-emerald-950">
                  Krishi<span className="text-emerald-600">Saathi</span>
                </span>
                <span className="text-xs font-semibold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-300">
                  AI 2.0
                </span>
              </div>
              <p className="text-xs text-stone-500 font-medium tracking-wide">
                AI Soil Intelligence & Crop Advisory
              </p>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`relative px-4 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${
                  isActive(link.path)
                    ? "bg-emerald-50 text-emerald-800 font-bold border border-emerald-200 shadow-xs"
                    : "text-stone-700 hover:text-emerald-800 hover:bg-stone-50"
                }`}
              >
                <span>{link.name}</span>
                {link.badge && (
                  <span className="bg-amber-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md uppercase tracking-wider">
                    {link.badge}
                  </span>
                )}
              </Link>
            ))}
          </div>

          {/* Right Action Buttons */}
          <div className="hidden md:flex items-center gap-3">
            {/* Language Selector */}
            <div className="relative">
              <button
                onClick={() => setLangDropdownOpen(!langDropdownOpen)}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-xl transition"
                title="Select Language"
              >
                <Globe className="w-4 h-4 text-emerald-700" />
                <span>{SUPPORTED_LANGUAGES.find(l => l.code === language)?.name.split(' ')[0] || 'English'}</span>
                <ChevronDown className="w-3.5 h-3.5 text-stone-500" />
              </button>

              {langDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-stone-200 py-1 z-50 animate-in fade-in slide-in-from-top-2">
                  <div className="px-3 py-1.5 text-[11px] font-bold text-stone-500 uppercase tracking-wider border-b border-stone-100">
                    Select Language
                  </div>
                  {SUPPORTED_LANGUAGES.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => {
                        setLanguage(lang.code);
                        setLangDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-emerald-50 ${
                        language === lang.code ? 'font-bold text-emerald-700 bg-emerald-50/70' : 'text-stone-700'
                      }`}
                    >
                      {lang.name}
                      {language === lang.code && <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Upload Soil Report Quick Button */}
            <button
              onClick={() => setIsUploadModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-stone-950 shadow-md shadow-amber-500/20 transition-all hover:scale-[1.02] active:scale-95"
            >
              <UploadCloud className="w-4 h-4 text-stone-950" />
              <span>Upload Soil Report</span>
            </button>

            {/* User Profile or Login */}
            {user ? (
              <div className="flex items-center gap-2 pl-2 border-l border-stone-200">
                <Link
                  to="/dashboard"
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-900 border border-emerald-200 hover:bg-emerald-100 transition"
                >
                  <div className="w-8 h-8 rounded-lg bg-emerald-700 text-white flex items-center justify-center font-bold text-sm">
                    {user.name.charAt(0)}
                  </div>
                  <div className="text-left text-xs">
                    <p className="font-bold leading-tight">{user.name}</p>
                    <p className="text-[10px] text-emerald-700 leading-tight">{user.district}, {user.state}</p>
                  </div>
                </Link>
                <button
                  onClick={logout}
                  title="Logout"
                  className="p-2 text-stone-400 hover:text-red-600 rounded-lg hover:bg-stone-100 transition"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-4 py-2 rounded-xl text-xs font-bold text-emerald-900 hover:bg-emerald-50 border border-emerald-300 transition"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white shadow-sm transition"
                >
                  Register
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex items-center gap-2 md:hidden">
            <button
              onClick={() => setIsUploadModalOpen(true)}
              className="p-2 text-stone-900 bg-amber-500 rounded-lg text-xs font-bold"
              title="Upload Soil Report"
            >
              <UploadCloud className="w-5 h-5" />
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-stone-700 hover:bg-stone-100 focus:outline-hidden"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-stone-200 bg-white px-4 pt-3 pb-6 space-y-3 animate-in slide-in-from-top-4">
          <div className="space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-4 py-3 rounded-xl text-base font-semibold ${
                  isActive(link.path)
                    ? "bg-emerald-50 text-emerald-900 border border-emerald-200"
                    : "text-stone-700 hover:bg-stone-50"
                }`}
              >
                <div className="flex justify-between items-center">
                  <span>{link.name}</span>
                  {link.badge && (
                    <span className="bg-amber-500 text-white text-xs px-2 py-0.5 rounded-full font-bold">
                      {link.badge}
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>

          <div className="pt-3 border-t border-stone-100 flex flex-col gap-2">
            <button
              onClick={() => {
                setIsUploadModalOpen(true);
                setMobileMenuOpen(false);
              }}
              className="w-full py-3 px-4 rounded-xl bg-amber-500 text-stone-950 font-bold text-center flex items-center justify-center gap-2 shadow-xs"
            >
              <UploadCloud className="w-5 h-5" />
              <span>Upload Soil Report</span>
            </button>

            {user ? (
              <div className="flex items-center justify-between p-3 bg-stone-50 rounded-xl mt-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-700 text-white flex items-center justify-center font-bold">
                    {user.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-bold text-sm text-stone-800">{user.name}</p>
                    <p className="text-xs text-stone-500">{user.village}, {user.district}</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    logout();
                    setMobileMenuOpen(false);
                  }}
                  className="px-3 py-1.5 text-xs text-red-600 font-bold border border-red-200 rounded-lg hover:bg-red-50"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 pt-2">
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="py-2.5 text-center text-sm font-bold border border-emerald-600 text-emerald-800 rounded-xl"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="py-2.5 text-center text-sm font-bold bg-emerald-700 text-white rounded-xl"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
