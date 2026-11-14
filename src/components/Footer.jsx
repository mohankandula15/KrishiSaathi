import React from 'react';
import { Link } from 'react-router-dom';
import { Sprout, ShieldCheck } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { LANGUAGES } from '../i18n/languages';

export default function Footer() {
  const { t } = useTranslation();

  return (
    <footer className="bg-emerald-950 text-stone-300 pt-12 pb-10 border-t border-emerald-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-10 border-b border-emerald-900/60">
          {/* Brand Info */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-bold">
                <Sprout className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-black text-white tracking-tight">
                Krishi<span className="text-emerald-400">Saathi</span>
              </span>
            </div>
            <p className="text-sm text-stone-300 leading-relaxed max-w-md">
              {t('footer.description', 'KrishiSaathi is an advanced agricultural intelligence platform that analyzes Soil Health Cards to deliver precision nutrient diagnostics, balanced fertilizer recommendations, and high-profit crop advice.')}
            </p>
            <div className="flex items-center gap-2 text-xs text-emerald-300 bg-emerald-900/60 px-3 py-2 rounded-xl border border-emerald-800 w-fit">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{t('footer.standardized', 'Standardized with ICAR & Soil Health Card Agronomy Rules')}</span>
            </div>
          </div>

          {/* Quick Platform Links */}
          <div>
            <h4 className="text-white font-bold text-sm mb-4 flex items-center gap-2 uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              {t('footer.navigation', 'Navigation')}
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/" className="text-stone-300 hover:text-white transition">{t('nav.home', 'Home')}</Link>
              </li>
              <li>
                <Link to="/dashboard" className="text-stone-300 hover:text-white transition">{t('nav.dashboard', 'Farmer Dashboard')}</Link>
              </li>
              <li>
                <Link to="/soil-analysis" className="text-stone-300 hover:text-white transition">{t('nav.soilAnalysis', 'Soil Analysis')}</Link>
              </li>
              <li>
                <Link to="/ai-assistant" className="text-stone-300 hover:text-white transition">{t('nav.aiAssistant', 'AI Voice Assistant')}</Link>
              </li>
              <li>
                <Link to="/register" className="text-stone-300 hover:text-white transition">{t('nav.register', 'Farmer Registration')}</Link>
              </li>
            </ul>
          </div>

          {/* Multilingual Support */}
          <div>
            <h4 className="text-white font-bold text-sm mb-4 flex items-center gap-2 uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-amber-400"></span>
              {t('footer.supportedLanguagesTitle', 'Supported Languages')}
            </h4>
            <p className="text-xs text-stone-400 mb-3">
              {t('footer.supportedLanguagesDesc', 'Voice and text assistance available across Indian regional languages:')}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {LANGUAGES.map((lang) => (
                <span key={lang.code} className="text-xs bg-emerald-900/80 text-emerald-200 px-2 py-1 rounded-lg border border-emerald-800">
                  {lang.name}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom copyright banner */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-stone-400 gap-3">
          <p>© {new Date().getFullYear()} KrishiSaathi. {t('common.allRightsReserved', 'All rights reserved.')}</p>
          <div className="flex items-center gap-2 text-stone-400">
            <span>{t('common.aiSustainable', 'AI for Sustainable Agriculture')}</span>
            <span>•</span>
            <span className="flex items-center gap-1 text-emerald-300">
              {t('common.madeForFarmers', 'Made with ❤️ for Farmers')}
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
