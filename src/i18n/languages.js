// Language configuration and locale helper for KrishiSaathi
// Single source of truth for supported languages, roadmap languages, and locale formatting

export const LANGUAGES = [
  { 
    code: 'en', 
    name: 'English', 
    nativeName: 'English', 
    supported: true, 
    voiceTag: 'Voice',
    speechLocale: 'en-IN'
  },
  { 
    code: 'hi', 
    name: 'हिन्दी (Hindi)', 
    nativeName: 'हिन्दी', 
    supported: true, 
    voiceTag: 'आवाज़',
    speechLocale: 'hi-IN'
  },
  { 
    code: 'te', 
    name: 'తెలుగు (Telugu)', 
    nativeName: 'తెలుగు', 
    supported: true, 
    voiceTag: 'వాయిస్',
    speechLocale: 'te-IN'
  },
  { 
    code: 'pa', 
    name: 'ਪੰਜਾਬੀ (Punjabi)', 
    nativeName: 'ਪੰਜਾਬੀ', 
    supported: false,
    speechLocale: 'pa-IN'
  },
  { 
    code: 'mr', 
    name: 'मराठी (Marathi)', 
    nativeName: 'मराठी', 
    supported: false,
    speechLocale: 'mr-IN'
  },
  { 
    code: 'ta', 
    name: 'தமிழ் (Tamil)', 
    nativeName: 'தமிழ்', 
    supported: false,
    speechLocale: 'ta-IN'
  },
  { 
    code: 'gu', 
    name: 'ગુજરાતી (Gujarati)', 
    nativeName: 'ગુજરાતી', 
    supported: false,
    speechLocale: 'gu-IN'
  },
  { 
    code: 'kn', 
    name: 'ಕನ್ನಡ (Kannada)', 
    nativeName: 'ಕನ್ನಡ', 
    supported: false,
    speechLocale: 'kn-IN'
  },
  { 
    code: 'bn', 
    name: 'বাংলা (Bengali)', 
    nativeName: 'বাংলা', 
    supported: false,
    speechLocale: 'bn-IN'
  },
  { 
    code: 'or', 
    name: 'ଓଡ଼ିଆ (Odia)', 
    nativeName: 'ଓଡ଼ିଆ', 
    supported: false,
    speechLocale: 'or-IN'
  },
  { 
    code: 'ml', 
    name: 'മലയാളം (Malayalam)', 
    nativeName: 'മലയാളം', 
    supported: false,
    speechLocale: 'ml-IN'
  }
];

export const SUPPORTED_LANGUAGE_CODES = ['en', 'hi', 'te'];
export const SUPPORTED_LANGUAGES = LANGUAGES.filter(l => l.supported);

export function isSupportedLanguage(code) {
  return typeof code === 'string' && SUPPORTED_LANGUAGE_CODES.includes(code.toLowerCase());
}

export function sanitizeLanguage(code) {
  if (isSupportedLanguage(code)) {
    return code.toLowerCase();
  }
  return 'en';
}

export function getLocaleForLanguage(lang) {
  switch (lang?.toLowerCase()) {
    case 'te': return 'te-IN';
    case 'hi': return 'hi-IN';
    case 'en':
    default:
      return 'en-IN';
  }
}

/**
 * Format date using Intl.DateTimeFormat with active regional locale (te-IN, hi-IN, en-IN)
 */
export function formatLocalDate(dateInput, lang = 'en', options = null) {
  if (!dateInput) return '';

  let dateObj;
  if (dateInput instanceof Date) {
    dateObj = dateInput;
  } else if (typeof dateInput === 'number') {
    dateObj = new Date(dateInput);
  } else if (typeof dateInput === 'string') {
    // Try standard parsing
    const parsed = Date.parse(dateInput);
    if (!isNaN(parsed)) {
      dateObj = new Date(parsed);
    } else {
      // Check if it matches formats like "15 Oct 2025"
      const parts = dateInput.trim().split(/\s+/);
      if (parts.length === 3) {
        const monthNames = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
        const day = parseInt(parts[0], 10);
        const mIdx = monthNames.indexOf(parts[1].toLowerCase().slice(0, 3));
        const year = parseInt(parts[2], 10);
        if (!isNaN(day) && mIdx >= 0 && !isNaN(year)) {
          dateObj = new Date(year, mIdx, day);
        }
      }
    }
  }

  if (!dateObj || isNaN(dateObj.getTime())) {
    return String(dateInput);
  }

  const locale = getLocaleForLanguage(lang);
  const defaultOptions = options || { day: 'numeric', month: 'short', year: 'numeric' };

  try {
    return new Intl.DateTimeFormat(locale, defaultOptions).format(dateObj);
  } catch {
    return String(dateInput);
  }
}

// Ensure localStorage does not hold unsupported language
if (typeof localStorage !== 'undefined') {
  const currentSaved = localStorage.getItem('krishisaathi_lang');
  if (currentSaved && !isSupportedLanguage(currentSaved)) {
    localStorage.setItem('krishisaathi_lang', 'en');
    localStorage.setItem('krishisaathi_preferred_lang', 'en');
  }
}
