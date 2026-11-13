import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  Menu, 
  UploadCloud, 
  Globe, 
  ChevronDown, 
  Bot, 
  FileText, 
  Check, 
  Sparkles,
  MapPin
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSoil } from '../context/SoilContext';
import { SUPPORTED_LANGUAGES } from '../data/sampleSoilReports';

export default function DashboardHeader({ setMobileOpen }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, language, setLanguage } = useAuth();
  const { reports, activeReport, setActiveReportId, setIsUploadModalOpen } = useSoil();

  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const [reportMenuOpen, setReportMenuOpen] = useState(false);

  // Derive title from current path
  const getPageInfo = () => {
    switch (location.pathname) {
      case '/dashboard':
        return { title: "Farm Dashboard", subtitle: "Real-time soil health & farm intelligence" };
      case '/soil-analysis':
        return { title: "Soil Health Analysis", subtitle: "NPK diagnostics, pH scale & micronutrient metrics" };
      case '/crop-recommendations':
        return { title: "Crop Recommendations", subtitle: "Soil-matched high-yield crop varieties" };
      case '/fertilizer-calculator':
        return { title: "Fertilizer Calculator", subtitle: "Precision acreage-based dosage & cost optimizer" };
      case '/ai-assistant':
        return { title: "AI Agronomy Assistant", subtitle: "Multilingual voice & conversational guidance" };
      case '/my-farm':
        return { title: "My Farm Profile", subtitle: "Field parcels, soil history & micro-climate" };
      case '/settings':
        return { title: "Account & Preferences", subtitle: "Profile parameters, language & notifications" };
      default:
        return { title: "Dashboard", subtitle: "KrishiSaathi SaaS" };
    }
  };

  const pageInfo = getPageInfo();
  const currentLangObj = SUPPORTED_LANGUAGES.find(l => l.code === language) || SUPPORTED_LANGUAGES[0];

  return (
    <header className="sticky top-0 z-20 bg-white/90 backdrop-blur-md border-b border-[#E2EBE2] px-4 sm:px-6 lg:px-8 py-3.5 transition-all">
      <div className="flex items-center justify-between gap-4">
        
        {/* Left: Mobile hamburger & Page Breadcrumb */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="md:hidden p-2 rounded-xl text-[#5C6E63] hover:text-[#26332B] hover:bg-[#F2F7F1] transition cursor-pointer"
            aria-label="Open Navigation Menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="min-w-0">
            <h1 className="text-base sm:text-lg font-black text-[#26332B] truncate tracking-tight">
              {pageInfo.title}
            </h1>
            <p className="hidden sm:block text-xs text-[#5C6E63] truncate">
              {pageInfo.subtitle}
            </p>
          </div>
        </div>

        {/* Right: Actions, Soil Card Switcher, Upload, Language */}
        <div className="flex items-center gap-2 sm:gap-3">
          
          {/* Active Soil Health Card Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setReportMenuOpen(!reportMenuOpen);
                setLangMenuOpen(false);
              }}
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#F8FAF7] hover:bg-[#E8F0E7] border border-[#E2EBE2] text-xs font-semibold text-[#26332B] transition cursor-pointer"
              title="Active Soil Report"
            >
              <FileText className="w-4 h-4 text-[#245C3A]" />
              <span className="hidden md:inline font-bold">Card:</span>
              <span className="truncate max-w-[100px] sm:max-w-[140px] font-mono font-medium">
                {activeReport?.id}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-[#5C6E63]" />
            </button>

            {reportMenuOpen && (
              <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-[#E2EBE2] py-2 z-50 animate-in fade-in slide-in-from-top-2">
                <div className="px-3.5 py-1.5 border-b border-[#E2EBE2] flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#5C6E63]">
                    Switch Soil Card
                  </span>
                  <span className="text-[10px] bg-[#E8F0E7] text-[#245C3A] font-bold px-2 py-0.5 rounded-full">
                    {reports.length} Available
                  </span>
                </div>
                <div className="max-h-60 overflow-y-auto py-1">
                  {reports.map((rep) => (
                    <button
                      key={rep.id}
                      type="button"
                      onClick={() => {
                        setActiveReportId(rep.id);
                        setReportMenuOpen(false);
                      }}
                      className={`w-full text-left px-3.5 py-2.5 text-xs flex items-center justify-between hover:bg-[#F2F7F1] transition cursor-pointer ${
                        rep.id === activeReport?.id ? "bg-[#E8F0E7] text-[#245C3A] font-bold" : "text-[#26332B]"
                      }`}
                    >
                      <div className="min-w-0">
                        <p className="font-bold truncate">{rep.title}</p>
                        <p className="text-[11px] text-[#5C6E63] font-mono">{rep.id} • Score: {rep.healthScore}/100</p>
                      </div>
                      {rep.id === activeReport?.id && (
                        <Check className="w-4 h-4 text-[#245C3A] shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Upload Button */}
          <button
            type="button"
            onClick={() => setIsUploadModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#245C3A] hover:bg-[#1B462C] text-white text-xs font-bold shadow-xs hover:shadow-md transition active:scale-98 cursor-pointer"
          >
            <UploadCloud className="w-4 h-4 text-emerald-100" />
            <span className="hidden sm:inline">Upload Report</span>
          </button>

          {/* Quick AI Trigger */}
          <button
            type="button"
            onClick={() => navigate('/ai-assistant')}
            className="hidden lg:flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#E8F0E7] hover:bg-[#D4E3D3] text-[#245C3A] text-xs font-bold transition cursor-pointer"
            title="Ask AI Assistant"
          >
            <Bot className="w-4 h-4 text-[#245C3A]" />
            <span>AI Advisor</span>
          </button>

          {/* Language Selector */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setLangMenuOpen(!langMenuOpen);
                setReportMenuOpen(false);
              }}
              className="flex items-center gap-1.5 p-2 sm:px-3 sm:py-2 rounded-xl bg-[#F8FAF7] hover:bg-[#E8F0E7] border border-[#E2EBE2] text-xs font-semibold text-[#26332B] transition cursor-pointer"
              title="Change Language"
            >
              <Globe className="w-4 h-4 text-[#245C3A]" />
              <span className="hidden sm:inline">{currentLangObj.name.split(' ')[0]}</span>
              <ChevronDown className="w-3 h-3 text-[#5C6E63]" />
            </button>

            {langMenuOpen && (
              <div className="absolute right-0 mt-2 w-52 bg-white rounded-2xl shadow-xl border border-[#E2EBE2] py-2 z-50 animate-in fade-in slide-in-from-top-2">
                <div className="px-3.5 py-1.5 border-b border-[#E2EBE2] text-[11px] font-bold uppercase tracking-wider text-[#5C6E63]">
                  Select Language
                </div>
                <div className="max-h-60 overflow-y-auto py-1">
                  {SUPPORTED_LANGUAGES.map((lang) => (
                    <button
                      key={lang.code}
                      type="button"
                      onClick={() => {
                        setLanguage(lang.code);
                        setLangMenuOpen(false);
                      }}
                      className={`w-full text-left px-3.5 py-2 text-xs flex items-center justify-between hover:bg-[#F2F7F1] transition cursor-pointer ${
                        language === lang.code ? "bg-[#E8F0E7] text-[#245C3A] font-bold" : "text-[#26332B]"
                      }`}
                    >
                      <span>{lang.name}</span>
                      {language === lang.code && (
                        <Check className="w-4 h-4 text-[#245C3A]" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

        </div>

      </div>
    </header>
  );
}
