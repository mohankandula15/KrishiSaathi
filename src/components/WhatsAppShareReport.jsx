import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Copy, 
  Check, 
  Volume2, 
  VolumeX, 
  User, 
  MapPin, 
  AlertCircle, 
  WifiOff, 
  FileText, 
  ChevronDown, 
  ChevronUp,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { formatSoilReportText } from '../engine/icarEngine';
import { API_BASE_URL } from '../services/api';

// Official WhatsApp icon SVG for clear branding
function WhatsAppIcon({ className = "w-4 h-4" }) {
  return (
    <svg 
      className={className} 
      viewBox="0 0 24 24" 
      fill="currentColor"
    >
      <path d="M12.031 2C6.511 2 2.015 6.496 2.015 12.016c0 1.968.567 3.805 1.554 5.372L2 22l4.781-1.536a9.98 9.98 0 0 0 5.25 1.552h.004c5.517 0 10.015-4.496 10.015-10.016A9.99 9.99 0 0 0 12.031 2zm5.882 14.207c-.244.685-1.42 1.258-1.956 1.341-.536.082-1.229.117-3.957-.962-3.29-1.302-5.412-4.664-5.576-4.882-.164-.218-1.334-1.776-1.334-3.388 0-1.612.846-2.404 1.147-2.732.301-.328.656-.41.874-.41.218 0 .437.002.628.012.203.01.474-.078.742.565.273.655.928 2.268 1.01 2.432.082.164.137.355.027.573-.11.219-.164.356-.328.547-.164.191-.345.427-.492.573-.164.164-.336.342-.144.67.191.328.851 1.404 1.826 2.273 1.256 1.119 2.316 1.467 2.643 1.631.328.164.519.137.71-.082.191-.219.82-0.957 1.039-1.285.218-.328.437-.273.738-.164.3.11 1.912.902 2.24 1.066.328.164.547.246.628.383.082.137.082.793-.162 1.478z" />
    </svg>
  );
}

export default function WhatsAppShareReport({ 
  report, 
  defaultFarmerName = '', 
  defaultVillage = '', 
  className = '' 
}) {
  const { t } = useTranslation();
  const { user, language, setLanguage } = useAuth();

  // Active language derived from AuthContext
  const currentLang = (language && ['te', 'hi', 'en'].includes(language)) ? language : 'en';

  // Mobile number input (10 digits)
  const [mobileNumber, setMobileNumber] = useState('');
  
  // Customizable recipient details
  const [farmerName, setFarmerName] = useState(() => {
    return defaultFarmerName || report?.farmerName || report?.farmer?.name || report?.extracted_soil_data?.farmerName || user?.name || '';
  });
  const [village, setVillage] = useState(() => {
    return defaultVillage || report?.location || report?.village || report?.extracted_soil_data?.village || '';
  });

  // UI state
  const [copied, setCopied] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioNotice, setAudioNotice] = useState('');
  const [offlineNotice, setOfflineNotice] = useState('');
  const [showPreview, setShowPreview] = useState(true);
  const [availableVoices, setAvailableVoices] = useState([]);

  const currentAudioRef = useRef(null);

  // Keep farmer/village in sync if props change
  useEffect(() => {
    if (defaultFarmerName || report?.farmerName) {
      setFarmerName(defaultFarmerName || report?.farmerName || report?.farmer?.name || report?.extracted_soil_data?.farmerName || user?.name || '');
    }
    if (defaultVillage || report?.location) {
      setVillage(defaultVillage || report?.location || report?.village || report?.extracted_soil_data?.village || '');
    }
  }, [report, defaultFarmerName, defaultVillage, user]);

  // Load voices for local speech synthesis
  useEffect(() => {
    const updateVoices = () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        const v = window.speechSynthesis.getVoices();
        if (v && v.length > 0) {
          setAvailableVoices(v);
        }
      }
    };

    updateVoices();
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.onvoiceschanged = updateVoices;
    }
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.onvoiceschanged = null;
      }
    };
  }, []);

  // Cleanup audio & speech on unmount
  useEffect(() => {
    return () => {
      if (currentAudioRef.current) {
        currentAudioRef.current.pause();
        currentAudioRef.current = null;
      }
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Generate plain text report using local ICAR engine (100% offline, pure JS)
  const reportText = useMemo(() => {
    return formatSoilReportText(report, {
      lang: currentLang,
      farmerName: farmerName.trim(),
      village: village.trim(),
    });
  }, [report, currentLang, farmerName, village]);

  // Sanitize and format phone number for WhatsApp
  // Indian standard: 10 digits prefixed with 91
  const getWhatsAppTarget = () => {
    const raw = mobileNumber.trim();
    if (!raw) return { url: `https://wa.me/?text=${encodeURIComponent(reportText)}`, valid: true };

    const digits = raw.replace(/\D/g, '');
    let target = '';

    if (digits.length === 10) {
      target = `91${digits}`;
    } else if (digits.length === 12 && digits.startsWith('91')) {
      target = digits;
    } else if (digits.length === 11 && digits.startsWith('0')) {
      target = `91${digits.slice(1)}`;
    } else {
      // Return false if user entered an incomplete number
      return { url: '', valid: false, error: 'Please enter a valid 10-digit mobile number, or leave empty to choose any contact.' };
    }

    return { url: `https://wa.me/${target}?text=${encodeURIComponent(reportText)}`, valid: true };
  };

  // 1. SEND ON WHATSAPP HANDLER
  const handleSendWhatsApp = () => {
    setOfflineNotice('');
    setAudioNotice('');

    // Offline check: generating works offline, but opening wa.me requires internet
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      setOfflineNotice(t("whatsapp.offlineWarning", 'Internet connection required to open WhatsApp. You can still copy the report text or listen to it offline.'));
      return;
    }

    const target = getWhatsAppTarget();
    if (!target.valid) {
      setOfflineNotice(target.error);
      return;
    }

    try {
      window.open(target.url, '_blank', 'noopener,noreferrer');
    } catch {
      window.location.href = target.url;
    }
  };

  // 2. COPY TEXT REPORT HANDLER
  const handleCopyText = async () => {
    setOfflineNotice('');
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(reportText);
      } else {
        // Fallback for older browsers or sandboxed contexts
        const textArea = document.createElement('textarea');
        textArea.value = reportText;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.warn('Could not copy report text:', err);
    }
  };

  // 3. LISTEN (AUDIO / VOICE PLAYBACK) HANDLER
  const handleToggleListen = async () => {
    setOfflineNotice('');
    setAudioNotice('');

    // Toggle stop if already playing
    if (isPlaying) {
      if (currentAudioRef.current) {
        currentAudioRef.current.pause();
        currentAudioRef.current = null;
      }
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      setIsPlaying(false);
      return;
    }

    // Prepare clean text for TTS (strip emojis, asterisks, URLs, bullet symbols)
    const cleanText = reportText
      .replace(/[*#•_`~]/g, '')
      .replace(/https?:\/\/\S+/g, '')
      .replace(/🌾|👤|📅|🏆|📊|⚠️|📦|🌱|ℹ️|•/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    if (!cleanText) return;

    // STEP 1: Use local speechSynthesis if a voice exists for this language (works 100% offline)
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const voices = (window.speechSynthesis.getVoices && window.speechSynthesis.getVoices().length > 0)
        ? window.speechSynthesis.getVoices()
        : availableVoices;

      const targetFamily = currentLang === 'te' ? 'te' : (currentLang === 'hi' ? 'hi' : 'en');
      const matchedVoice = voices.find(v => {
        const vLang = (v.lang || '').toLowerCase().replace('_', '-');
        const vName = (v.name || '').toLowerCase();
        if (targetFamily === 'te') {
          return vLang === 'te-in' || vLang.startsWith('te') || vName.includes('telugu');
        } else if (targetFamily === 'hi') {
          return vLang === 'hi-in' || vLang.startsWith('hi') || vName.includes('hindi');
        } else {
          return vLang === 'en-in' || vName.includes('india') || vLang.startsWith('en');
        }
      });

      if (matchedVoice) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(cleanText);
        utterance.voice = matchedVoice;
        utterance.lang = matchedVoice.lang || (targetFamily === 'te' ? 'te-IN' : (targetFamily === 'hi' ? 'hi-IN' : 'en-IN'));
        utterance.rate = 0.95;
        utterance.pitch = 1.0;
        utterance.onend = () => setIsPlaying(false);
        utterance.onerror = () => setIsPlaying(false);
        window.speechSynthesis.speak(utterance);
        setIsPlaying(true);
        return;
      }
    }

    // STEP 2: If no local voice for te/hi, fall back to server TTS endpoint when online
    const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
    if (isOnline) {
      try {
        const token = localStorage.getItem('krishisaathi_token');
        const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
        const ttsUrl = `${API_BASE_URL}/chat/tts?text=${encodeURIComponent(cleanText.slice(0, 500))}&lang=${encodeURIComponent(currentLang)}`;

        const res = await fetch(ttsUrl, { headers });
        if (!res.ok) {
          throw new Error(`TTS server responded with ${res.status}`);
        }

        const blob = await res.blob();
        const blobUrl = URL.createObjectURL(blob);
        const audio = new Audio(blobUrl);
        currentAudioRef.current = audio;

        audio.onended = () => {
          setIsPlaying(false);
          currentAudioRef.current = null;
        };
        audio.onerror = () => {
          setIsPlaying(false);
          currentAudioRef.current = null;
          setAudioNotice(t("whatsapp.audioNotice", 'Unable to play audio stream.'));
        };

        setIsPlaying(true);
        await audio.play();
        return;
      } catch (err) {
        console.warn('Backend TTS failed:', err.message);
      }
    }

    // If both local voice and server TTS failed or unavailable offline
    setIsPlaying(false);
    if (!isOnline) {
      setAudioNotice('Voice for this language is not installed locally on this device. Connect to internet for online speech synthesis.');
    } else {
      setAudioNotice('Voice synthesis not available for this language on your browser.');
    }
  };

  return (
    <div className={`bg-white rounded-3xl border border-[#E2EBE2] shadow-xs overflow-hidden ${className}`}>
      
      {/* Header Banner */}
      <div className="bg-linear-to-r from-[#245C3A] via-[#1E4D30] to-[#128C7E] text-white p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center text-white shrink-0 shadow-inner">
              <WhatsAppIcon className="w-6 h-6 text-[#25D366]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black tracking-tight">
                  {t("whatsapp.title", "Send Advisory on WhatsApp")}
                </h3>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-white/20 text-emerald-100 px-2.5 py-0.5 rounded-full border border-white/20">
                  {t("whatsapp.fpoBadge", "FPO Tool")}
                </span>
              </div>
              <p className="text-xs text-emerald-100/90 mt-0.5">
                {t("whatsapp.subtitle", "Instant ICAR plain-text report for farmers, relatives, or field agents (under 1500 chars)")}
              </p>
            </div>
          </div>

          {/* Language Selector Pills */}
          <div className="flex items-center gap-1.5 bg-black/20 p-1 rounded-2xl border border-white/10 self-start sm:self-auto">
            {[
              { code: 'te', label: 'తెలుగు' },
              { code: 'hi', label: 'हिंदी' },
              { code: 'en', label: 'English' }
            ].map((l) => (
              <button
                key={l.code}
                type="button"
                onClick={() => {
                  if (setLanguage) setLanguage(l.code);
                  if (isPlaying) {
                    if (currentAudioRef.current) currentAudioRef.current.pause();
                    if (window.speechSynthesis) window.speechSynthesis.cancel();
                    setIsPlaying(false);
                  }
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer ${
                  currentLang === l.code
                    ? 'bg-white text-[#245C3A] shadow-xs'
                    : 'text-white/80 hover:text-white hover:bg-white/10'
                }`}
              >
                {l.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="p-5 sm:p-6 space-y-5">
        
        {/* Recipient Details & Phone Input Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          
          {/* Mobile Number Input */}
          <div className="sm:col-span-1 space-y-1.5">
            <label className="block text-xs font-bold text-[#5C6E63] uppercase tracking-wider">
              {t("whatsapp.mobileLabel", "Farmer / Relative Mobile")}
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-xs font-bold text-[#245C3A] border-r border-[#E2EBE2] pr-2.5 my-1.5">
                +91
              </div>
              <input
                type="tel"
                maxLength={10}
                value={mobileNumber}
                onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, ''))}
                placeholder={t("whatsapp.mobilePlaceholder", "98765 43210 (Optional)")}
                className="w-full pl-14 pr-3 py-2.5 rounded-xl border border-[#E2EBE2] bg-[#F8FAF7] text-xs font-bold text-[#26332B] placeholder:text-[#5C6E63]/60 focus:bg-white focus:ring-2 focus:ring-[#245C3A] focus:outline-hidden transition"
              />
            </div>
            <p className="text-[10px] text-[#5C6E63]">
              {t("whatsapp.mobileHelp", "Leave empty to pick any contact in WhatsApp.")}
            </p>
          </div>

          {/* Farmer Name Input */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-[#5C6E63] uppercase tracking-wider">
              {t("whatsapp.nameLabel", "Farmer Name")}
            </label>
            <div className="relative">
              <User className="w-3.5 h-3.5 text-[#5C6E63] absolute left-3 top-3 pointer-events-none" />
              <input
                type="text"
                value={farmerName}
                onChange={(e) => setFarmerName(e.target.value)}
                placeholder={t("whatsapp.nameLabel", "Farmer Name")}
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-[#E2EBE2] bg-[#F8FAF7] text-xs font-bold text-[#26332B] placeholder:text-[#5C6E63]/60 focus:bg-white focus:ring-2 focus:ring-[#245C3A] focus:outline-hidden transition"
              />
            </div>
            <p className="text-[10px] text-[#5C6E63]">{t("whatsapp.shownOnAdvisory", "Shown on advisory header")}</p>
          </div>

          {/* Village Input */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-[#5C6E63] uppercase tracking-wider">
              {t("whatsapp.villageLabel", "Village / Location")}
            </label>
            <div className="relative">
              <MapPin className="w-3.5 h-3.5 text-[#5C6E63] absolute left-3 top-3 pointer-events-none" />
              <input
                type="text"
                value={village}
                onChange={(e) => setVillage(e.target.value)}
                placeholder={t("whatsapp.villageLabel", "Village / Location")}
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-[#E2EBE2] bg-[#F8FAF7] text-xs font-bold text-[#26332B] placeholder:text-[#5C6E63]/60 focus:bg-white focus:ring-2 focus:ring-[#245C3A] focus:outline-hidden transition"
              />
            </div>
            <p className="text-[10px] text-[#5C6E63]">{t("whatsapp.shownOnAdvisory", "Shown on advisory header")}</p>
          </div>

        </div>

        {/* Offline / Audio Alerts */}
        {offlineNotice && (
          <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-2.5 animate-in fade-in">
            <WifiOff className="w-4 h-4 shrink-0 text-amber-700 mt-0.5" />
            <div>
              <p className="font-bold text-amber-950">{t("common.notice", "Notice")}</p>
              <p className="text-amber-900 mt-0.5">{offlineNotice}</p>
            </div>
          </div>
        )}

        {audioNotice && (
          <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200 text-xs text-stone-800 flex items-start gap-2.5 animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 text-stone-600 mt-0.5" />
            <div>
              <p className="font-bold text-stone-900">{t("whatsapp.audioNotice", "Audio Notice")}</p>
              <p className="text-stone-700 mt-0.5">{audioNotice}</p>
            </div>
          </div>
        )}

        {/* Action Buttons Row */}
        <div className="flex flex-wrap items-center gap-3 pt-1">
          
          {/* Main Action: Send on WhatsApp */}
          <button
            type="button"
            onClick={handleSendWhatsApp}
            className="flex-1 sm:flex-none px-5 py-3 rounded-2xl bg-[#25D366] hover:bg-[#20BA56] active:scale-98 text-white font-black text-xs flex items-center justify-center gap-2.5 shadow-xs transition cursor-pointer"
          >
            <WhatsAppIcon className="w-4 h-4" />
            <span>{t("whatsapp.sendBtn", "Send on WhatsApp")}</span>
          </button>

          {/* Copy Text Report */}
          <button
            type="button"
            onClick={handleCopyText}
            className={`px-4 py-3 rounded-2xl border font-bold text-xs flex items-center gap-2 transition cursor-pointer active:scale-98 ${
              copied
                ? 'bg-emerald-50 border-emerald-300 text-[#245C3A]'
                : 'bg-white border-[#E2EBE2] hover:bg-[#F2F7F1] text-[#26332B]'
            }`}
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-600" />
                <span className="text-emerald-700 font-black">{t("whatsapp.copied", "Copied to Clipboard!")}</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-[#5C6E63]" />
                <span>{t("whatsapp.copyBtn", "Copy Text Report")}</span>
              </>
            )}
          </button>

          {/* Listen (Voice Audio) */}
          <button
            type="button"
            onClick={handleToggleListen}
            className={`px-4 py-3 rounded-2xl border font-bold text-xs flex items-center gap-2 transition cursor-pointer active:scale-98 ${
              isPlaying
                ? 'bg-rose-50 border-rose-300 text-rose-700 animate-pulse'
                : 'bg-white border-[#E2EBE2] hover:bg-[#F2F7F1] text-[#26332B]'
            }`}
          >
            {isPlaying ? (
              <>
                <VolumeX className="w-4 h-4 text-rose-600" />
                <span>{t("whatsapp.stopListenBtn", "Stop Listening")}</span>
              </>
            ) : (
              <>
                <Volume2 className="w-4 h-4 text-[#245C3A]" />
                <span>{t("whatsapp.listenBtn", "Listen Report")}</span>
              </>
            )}
          </button>

          {/* Toggle Preview Button */}
          <button
            type="button"
            onClick={() => setShowPreview(!showPreview)}
            className="ml-auto px-3 py-3 rounded-2xl text-[#5C6E63] hover:text-[#26332B] hover:bg-[#F8FAF7] text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>{showPreview ? t('whatsapp.hidePreview', 'Hide Preview') : t('whatsapp.showPreview', 'Show Preview')}</span>
            {showPreview ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

        </div>

        {/* Collapsible Report Text Preview Card */}
        {showPreview && (
          <div className="p-4 rounded-2xl bg-[#F8FAF7] border border-[#E2EBE2] space-y-3">
            <div className="flex items-center justify-between text-xs text-[#5C6E63] border-b border-[#E2EBE2] pb-2">
              <span className="font-bold uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#245C3A]" />
                {t("whatsapp.previewTitle", "WhatsApp Message Preview")}
              </span>
              <span className="font-mono text-[11px] bg-white px-2 py-0.5 rounded-md border border-[#E2EBE2]">
                {reportText.length} / 1500 {t('whatsapp.charCount', 'characters')}
              </span>
            </div>

            <pre className="text-xs font-sans text-[#26332B] whitespace-pre-wrap leading-relaxed max-h-64 overflow-y-auto selection:bg-[#E8F0E7]">
              {reportText}
            </pre>
          </div>
        )}

      </div>

    </div>
  );
}
