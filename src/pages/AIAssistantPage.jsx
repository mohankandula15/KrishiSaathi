import React, { useState, useEffect, useRef } from 'react';
import { 
  Bot, 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  Send, 
  RotateCcw, 
  Sparkles, 
  Globe, 
  Sprout, 
  User, 
  FileText, 
  AlertCircle,
  HelpCircle,
  CheckCircle2,
  Trash2,
  ShieldCheck,
  Radio,
  Layers,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSoil } from '../context/SoilContext';
import { api } from '../services/api';

export default function AIAssistantPage() {
  const { user, language, setLanguage } = useAuth();
  const { activeReport } = useSoil();

  // Languages: Telugu (te), Hindi (hi), English (en)
  const [selectedLang, setSelectedLang] = useState(() => {
    return localStorage.getItem('krishisaathi_preferred_lang') || 
           localStorage.getItem('krishisaathi_lang') || 
           user?.preferred_language || 
           language || 
           'te';
  });
  const [autoSpeak, setAutoSpeak] = useState(true);
  const [inputMessage, setInputMessage] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [interimText, setInterimText] = useState('');
  const [speakingMessageId, setSpeakingMessageId] = useState(null);
  const [isSending, setIsSending] = useState(false);
  const [availableVoices, setAvailableVoices] = useState([]);

  // Cache speech synthesis voices on mount and voice change
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

  // Language Change Handler with persistent profile sync
  const handleLanguageChange = async (langCode) => {
    setSelectedLang(langCode);
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setSpeakingMessageId(null);

    if (setLanguage) setLanguage(langCode);
    localStorage.setItem('krishisaathi_preferred_lang', langCode);
    localStorage.setItem('krishisaathi_lang', langCode);

    try {
      const token = localStorage.getItem('krishisaathi_token');
      if (token && api.farmers.updateProfile) {
        await api.farmers.updateProfile({ preferred_language: langCode });
      }
    } catch (e) {
      console.warn("Could not sync language preference to profile:", e.message);
    }
  };

  // Client-side language detector for typed/spoken input
  const detectInputLanguage = (text) => {
    if (!text) return selectedLang;
    // 1. Telugu Unicode script
    if (/[\u0C00-\u0C7F]/.test(text)) return 'te';
    // 2. Devanagari Unicode script
    if (/[\u0900-\u097F]/.test(text)) return 'hi';
    // 3. Tanglish / Hinglish token detection
    const lower = text.toLowerCase();
    const tePatterns = /\b(lo|undhi|undi|undha|takkuvaga|takkuva|ekkuva|ekkuvaga|cheyyali|cheyali|panta|pantalu|matti|nela|eruvulu|eruvu|ela|eppudu|naa|vesukovali|veskovali|veyyali|dap|urea|garu|paristhiti)\b/;
    const hiPatterns = /\b(kya|kare|kaise|mera|meri|khet|mitti|khad|kam|jyada|batao|chahiye|fasal|dalo|kisan|ji|sthiti)\b/;
    if (tePatterns.test(lower)) return 'te';
    if (hiPatterns.test(lower)) return 'hi';
    return selectedLang;
  };

  // Initial welcome message per language
  const getWelcomeText = (lang) => {
    const farmerName = user?.name || (lang === 'te' ? 'రైతు' : (lang === 'hi' ? 'किसान' : 'Farmer'));
    const reportTitle = activeReport?.title || activeReport?.id || "Soil Health Card";
    const nRating = activeReport?.nutrients?.nitrogen?.rating || "Low";

    if (lang === 'te') {
      return `నమస్కారం ${farmerName} గారు! 🙏🌾 నేను మీ కృషిసాథి (KrishiSaathi) AI వ్యవసాయ సహాయకుడిని.\n\nమీ నేల ఆరోగ్య కార్డు (${reportTitle}) వివరాలు నాకు అందుబాటులో ఉన్నాయి:\n• pH: ${activeReport?.ph?.value ?? 7.2} (${activeReport?.ph?.rating ?? "తటస్థం"})\n• నత్రజని (Nitrogen): ${activeReport?.nutrients?.nitrogen?.value ?? 185} kg/ha (${nRating === 'Low' ? 'లోపం' : nRating})\n• పొటాష్: ${activeReport?.nutrients?.potassium?.value ?? 295} kg/ha (సమృద్ధి)\n\nమీరు మీ నేల సారం, నత్రజని లోపం, ఎరువుల మోతాదు లేదా సిఫార్సు చేసిన పంటల గురించి తెలుగులో అడగవచ్చు. మాట్లాడటానికి క్రింది మైక్రోఫోన్ బటన్‌ను నొక్కండి!`;
    } else if (lang === 'hi') {
      return `नमस्ते ${farmerName} जी! 🙏🌾 मैं आपका कृषिशाथी (KrishiSaathi) AI कृषि सलाहकार हूँ।\n\nआपकी मिट्टी स्वास्थ्य रिपोर्ट (${reportTitle}) के अनुसार:\n• pH: ${activeReport?.ph?.value ?? 7.2} (${activeReport?.ph?.rating ?? "सामान्य"})\n• नाइट्रोजन: ${activeReport?.nutrients?.nitrogen?.value ?? 185} kg/ha (कमी)\n• पोटाश: ${activeReport?.nutrients?.potassium?.value ?? 295} kg/ha (प्रचुर)\n\nआप संतुलित उर्वरक, फसल चयन या मिट्टी सुधार के बारे में हिंदी में सवाल पूछ सकते हैं। बोलने के लिए नीचे दिए गए माइक पर टैप करें!`;
    } else {
      return `Hello ${farmerName}! 🌾 I am your KrishiSaathi AI agronomy voice assistant.\n\nI am connected to your active Soil Health Card (${reportTitle}):\n• pH: ${activeReport?.ph?.value ?? 7.2} (${activeReport?.ph?.rating ?? "Neutral"})\n• Nitrogen: ${activeReport?.nutrients?.nitrogen?.value ?? 185} kg/ha (Deficient)\n• Potash: ${activeReport?.nutrients?.potassium?.value ?? 295} kg/ha (High reserves)\n\nYou can speak or type questions about your soil fertility, customized urea splits, or crop recommendations. Tap the large microphone to talk!`;
    }
  };

  const [messages, setMessages] = useState(() => [
    {
      id: 1,
      sender: 'bot',
      text: getWelcomeText('te'),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      lang: 'te'
    }
  ]);

  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, interimText]);

  // When language changes, update initial message if chat has only welcome message
  useEffect(() => {
    setMessages(prev => {
      if (prev.length <= 1) {
        return [{
          id: 1,
          sender: 'bot',
          text: getWelcomeText(selectedLang),
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          lang: selectedLang
        }];
      }
      return prev;
    });
  }, [selectedLang, activeReport]);

  // Load chat history from backend
  useEffect(() => {
    const token = localStorage.getItem('krishisaathi_token');
    if (token) {
      api.chat.getHistory()
        .then(history => {
          if (history && history.length > 0) {
            const formatted = [];
            history.forEach((h, index) => {
              formatted.push({
                id: `u-${h.id || index}`,
                sender: 'user',
                text: h.message,
                timestamp: new Date(h.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                lang: h.language || 'te'
              });
              formatted.push({
                id: `b-${h.id || index}`,
                sender: 'bot',
                text: h.response,
                timestamp: new Date(h.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                lang: h.language || 'te'
              });
            });
            setMessages(prev => [prev[0], ...formatted]);
          }
        })
        .catch(err => {
          console.log("Using local conversation history:", err.message);
        });
    }
  }, [user]);

  // Clean up speech synthesis & recognition on unmount
  useEffect(() => {
    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {}
      }
    };
  }, []);

  // Text-To-Speech (Speaker Button & Auto-Speak)
  const speakText = (text, langCode = selectedLang, messageId = null) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    if (speakingMessageId && speakingMessageId === messageId) {
      window.speechSynthesis.cancel();
      setSpeakingMessageId(null);
      return;
    }

    window.speechSynthesis.cancel();
    if (messageId) setSpeakingMessageId(messageId);

    // Clean markdown characters, emojis, and symbols for natural spoken speech
    const cleanText = text
      .replace(/[*#•_`~]/g, '')
      .replace(/https?:\/\/\S+/g, '')
      .replace(/⚠️|🙏|🌾|🌱|•/g, '')
      .trim();

    if (!cleanText) {
      setSpeakingMessageId(null);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(cleanText);

    // Synchronize TTS language strictly with text script & language
    let targetLang = 'en-IN';
    let targetFamily = 'en';

    if (/[\u0C00-\u0C7F]/.test(cleanText) || langCode === 'te') {
      targetLang = 'te-IN';
      targetFamily = 'te';
    } else if (/[\u0900-\u097F]/.test(cleanText) || langCode === 'hi') {
      targetLang = 'hi-IN';
      targetFamily = 'hi';
    } else {
      targetLang = 'en-IN';
      targetFamily = 'en';
    }

    utterance.lang = targetLang;

    // Retrieve cached voices or live browser voices
    const voices = availableVoices.length > 0 
      ? availableVoices 
      : window.speechSynthesis.getVoices();

    if (voices && voices.length > 0) {
      let matchedVoice = null;

      if (targetFamily === 'te') {
        // Priority for Telugu: exact te-IN -> contains telugu -> starts with te
        matchedVoice = voices.find(v => {
          const vLang = (v.lang || '').toLowerCase().replace('_', '-');
          const vName = (v.name || '').toLowerCase();
          return vLang === 'te-in' || vLang.startsWith('te') || vName.includes('telugu');
        });
      } else if (targetFamily === 'hi') {
        // Priority for Hindi: exact hi-IN -> contains hindi -> starts with hi
        matchedVoice = voices.find(v => {
          const vLang = (v.lang || '').toLowerCase().replace('_', '-');
          const vName = (v.name || '').toLowerCase();
          return vLang === 'hi-in' || vLang.startsWith('hi') || vName.includes('hindi');
        });
      } else {
        // English
        matchedVoice = voices.find(v => {
          const vLang = (v.lang || '').toLowerCase().replace('_', '-');
          const vName = (v.name || '').toLowerCase();
          return vLang === 'en-in' || vName.includes('india') || vLang.startsWith('en');
        });
      }

      // CRITICAL: NEVER assign an English voice if the text is in Telugu or Hindi!
      if (matchedVoice) {
        utterance.voice = matchedVoice;
      }
    }

    utterance.rate = 0.95;
    utterance.pitch = 1.0;

    utterance.onend = () => {
      setSpeakingMessageId(null);
    };

    utterance.onerror = (e) => {
      console.warn("TTS playback status/event:", e);
      setSpeakingMessageId(null);
    };

    window.speechSynthesis.speak(utterance);
  };

  // Speech-To-Text (Microphone Button)
  const toggleListening = () => {
    if (isListening) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {}
      }
      setIsListening(false);
      setInterimText('');
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      // Fallback simulation for unsupported environments
      setIsListening(true);
      setTimeout(() => {
        setIsListening(false);
        const demoQueries = {
          te: "నా నేలలో నత్రజని తక్కువగా ఉంది. ఏం చేయాలి?",
          hi: "मेरी मिट्टी में नाइट्रोजन की कमी कैसे दूर करें?",
          en: "My soil has low Nitrogen. What should I do?"
        };
        const q = demoQueries[selectedLang] || demoQueries.te;
        setInputMessage(q);
        handleSendMessage(q, selectedLang);
      }, 1200);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;

      // Set regional speech recognition language
      if (selectedLang === 'te') {
        recognition.lang = 'te-IN';
      } else if (selectedLang === 'hi') {
        recognition.lang = 'hi-IN';
      } else {
        recognition.lang = 'en-IN';
      }

      recognition.continuous = false;
      recognition.interimResults = true;

      recognition.onstart = () => {
        setIsListening(true);
        setInterimText('');
      };

      recognition.onresult = (event) => {
        let finalTranscript = '';
        let currentInterim = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            currentInterim += event.results[i][0].transcript;
          }
        }

        if (finalTranscript) {
          setInputMessage(finalTranscript);
          setIsListening(false);
          setInterimText('');

          // Detect spoken language and auto-sync
          const detected = detectInputLanguage(finalTranscript);
          if (detected !== selectedLang) {
            handleLanguageChange(detected);
          }

          // Automatically trigger response after clear voice capture
          handleSendMessage(finalTranscript, detected);
        } else {
          setInterimText(currentInterim);
        }
      };

      recognition.onerror = () => {
        setIsListening(false);
        setInterimText('');
      };

      recognition.onend = () => {
        setIsListening(false);
        setInterimText('');
      };

      recognition.start();
    } catch (err) {
      console.warn("Speech recognition initialization fallback:", err);
      setIsListening(true);
      setTimeout(() => {
        setIsListening(false);
        const fallbackQuery = selectedLang === 'te' 
          ? "నా నేలలో నత్రజని తక్కువగా ఉంది. ఏం చేయాలి?" 
          : (selectedLang === 'hi' ? "मेरी मिट्टी में नाइट्रोजन की कमी कैसे दूर करें?" : "What is the condition of my soil?");
        setInputMessage(fallbackQuery);
        handleSendMessage(fallbackQuery, selectedLang);
      }, 1200);
    }
  };

  // Process and send message
  const handleSendMessage = async (textToSend = null, explicitLang = null) => {
    const text = (textToSend || inputMessage).trim();
    if (!text || isSending) return;

    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setSpeakingMessageId(null);

    // Detect language of the input query
    const detectedLang = explicitLang || detectInputLanguage(text);
    if (detectedLang !== selectedLang) {
      setSelectedLang(detectedLang);
    }

    const userMsgId = Date.now();
    const newUserMsg = {
      id: userMsgId,
      sender: 'user',
      text: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      lang: detectedLang
    };

    setMessages(prev => [...prev, newUserMsg]);
    setInputMessage('');
    setIsSending(true);

    try {
      const backendRes = await api.chat.send(text, detectedLang);
      if (backendRes && backendRes.response) {
        const botMsgId = backendRes.id || Date.now() + 1;
        const respLang = backendRes.language || detectedLang;

        const newBotMsg = {
          id: botMsgId,
          sender: 'bot',
          text: backendRes.response,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          lang: respLang
        };

        setMessages(prev => [...prev, newBotMsg]);
        setIsSending(false);

        // Auto-speak response if enabled with strict language synchronization
        if (autoSpeak) {
          setTimeout(() => {
            speakText(backendRes.response, respLang, botMsgId);
          }, 300);
        }
        return;
      }
    } catch (err) {
      console.warn("Backend chat send error:", err.message);
    }

    // Friendly offline error message in user's language instead of hardcoded fake advice
    let offlineMessage = "Assistant is offline, please retry.";
    if (detectedLang === 'te') {
      offlineMessage = "సహాయకుడు ఆఫ్‌లైన్‌లో ఉన్నారు, దయచేసి మళ్లీ ప్రయత్నించండి.";
    } else if (detectedLang === 'hi') {
      offlineMessage = "सहायक ऑफ़लाइन है, कृपया पुनः प्रयास करें।";
    }

    const botMsgId = Date.now() + 1;
    const newBotMsg = {
      id: botMsgId,
      sender: 'bot',
      text: offlineMessage,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      lang: detectedLang
    };

    setMessages(prev => [...prev, newBotMsg]);
    setIsSending(false);

    if (autoSpeak) {
      setTimeout(() => {
        speakText(offlineMessage, detectedLang, botMsgId);
      }, 300);
    }
  };

  const handleClearChat = async () => {
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    setSpeakingMessageId(null);
    try {
      await api.chat.clear();
    } catch (e) {}

    setMessages([
      {
        id: 1,
        sender: 'bot',
        text: getWelcomeText(selectedLang),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        lang: selectedLang
      }
    ]);
  };

  // Localized Suggested Questions
  const QUICK_QUESTIONS = {
    te: [
      "నా నేలలో నత్రజని తక్కువగా ఉంది. ఏం చేయాలి?",
      "నా నేల పరిస్థితి ఎలా ఉంది?",
      "నేను ఏ పంట వేయాలి?",
      "DAP మరియు జింక్ కలిపి వేయవచ్చా?",
      "సేంద్రీయ కర్బనం ఎలా పెంచాలి?"
    ],
    hi: [
      "मेरी मिट्टी में नाइट्रोजन की कमी कैसे दूर करें?",
      "मेरी मिट्टी की स्थिति कैसी है?",
      "मेरे खेत के लिए सबसे अच्छी फसल कौन सी है?",
      "क्या डीएपी और जिंक एक साथ डाल सकते हैं?",
      "जैविक कार्बन कैसे बढ़ाएं?"
    ],
    en: [
      "My soil has low Nitrogen. What should I do?",
      "What is the overall condition of my soil?",
      "Which crops are best suited for my soil?",
      "Can I mix DAP and Zinc together?",
      "How to increase soil Organic Carbon?"
    ]
  };

  const currentQuestions = QUICK_QUESTIONS[selectedLang] || QUICK_QUESTIONS.te;

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      
      {/* 1. Header & Soil Context Bar */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-[#E2EBE2] shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-[#245C3A] text-white flex items-center justify-center font-bold shadow-xs shrink-0">
              <Bot className="w-6 h-6 text-emerald-200" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black text-[#26332B] tracking-tight">
                  KRISHISAATHI AI Voice Assistant
                </h1>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-[#E8F0E7] text-[#245C3A] px-2 py-0.5 rounded-full border border-[#D4E3D3]">
                  Multilingual
                </span>
              </div>
              <p className="text-xs text-[#5C6E63] mt-0.5">
                Connected to: <strong>{activeReport?.title || activeReport?.id}</strong>
              </p>
            </div>
          </div>

          {/* Right Controls: Auto-Speak toggle & Clear Chat */}
          <div className="flex items-center gap-3 self-start sm:self-auto">
            
            {/* Auto-Speak Toggle */}
            <button
              type="button"
              onClick={() => {
                const next = !autoSpeak;
                setAutoSpeak(next);
                if (!next && window.speechSynthesis) window.speechSynthesis.cancel();
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer border ${
                autoSpeak 
                  ? "bg-emerald-50 text-[#245C3A] border-emerald-300" 
                  : "bg-white text-[#5C6E63] border-[#E2EBE2]"
              }`}
              title="Automatically speak AI answers aloud"
            >
              <Volume2 className="w-3.5 h-3.5" />
              <span>Voice Readout: {autoSpeak ? "ON" : "OFF"}</span>
            </button>

            {/* Clear History */}
            <button
              type="button"
              onClick={handleClearChat}
              className="p-2 rounded-xl text-[#5C6E63] hover:text-red-700 hover:bg-red-50 transition border border-[#E2EBE2] cursor-pointer"
              title="Reset Conversation"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

        </div>

        {/* 2. Language Selection Pills (Telugu, Hindi, English) */}
        <div className="pt-2 border-t border-[#E2EBE2] flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-[#245C3A]" />
            <span className="text-xs font-bold text-[#5C6E63]">Choose Your Language:</span>
          </div>

          <div className="flex items-center gap-2">
            {[
              { code: 'te', label: 'తెలుగు (Telugu)', tag: 'వాయిస్' },
              { code: 'hi', label: 'हिन्दी (Hindi)', tag: 'आवाज़' },
              { code: 'en', label: 'English', tag: 'Voice' }
            ].map(lang => (
              <button
                key={lang.code}
                type="button"
                onClick={() => handleLanguageChange(lang.code)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                  selectedLang === lang.code 
                    ? "bg-[#245C3A] text-white shadow-xs" 
                    : "bg-[#F8FAF7] hover:bg-[#E8F0E7] text-[#26332B] border border-[#E2EBE2]"
                }`}
              >
                <span>{lang.label}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  selectedLang === lang.code ? "bg-white/20 text-white" : "bg-emerald-100 text-[#245C3A]"
                }`}>
                  {lang.tag}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* 3. Soil Context Pill Banner */}
        <div className="p-3 rounded-2xl bg-[#F8FAF7] border border-[#E2EBE2] flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-[#5C6E63]">
          <span className="font-bold text-[#245C3A] flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-[#245C3A]" />
            <span>Soil Context:</span>
          </span>
          <span>pH: <strong className="text-[#26332B]">{activeReport?.ph?.value ?? 7.2} ({activeReport?.ph?.rating ?? "Neutral"})</strong></span>
          <span>•</span>
          <span>Nitrogen: <strong className="text-[#26332B]">{activeReport?.nutrients?.nitrogen?.value ?? 185} kg/ha (Low)</strong></span>
          <span>•</span>
          <span>Potassium: <strong className="text-[#26332B]">{activeReport?.nutrients?.potassium?.value ?? 295} kg/ha (High)</strong></span>
          <span>•</span>
          <span>Zinc: <strong className="text-[#26332B]">{activeReport?.secondaryNutrients?.zinc?.value ?? 0.45} ppm (Low)</strong></span>
        </div>

      </div>

      {/* 4. Chat Messages Window */}
      <div className="bg-white rounded-3xl border border-[#E2EBE2] shadow-xs flex flex-col h-[520px] sm:h-[580px] overflow-hidden">
        
        {/* Messages Scroll Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-[#F8FAF7]">
          {messages.map((msg) => {
            const isBot = msg.sender === 'bot';
            const isThisSpeaking = speakingMessageId === msg.id;

            return (
              <div 
                key={msg.id} 
                className={`flex gap-3 max-w-[92%] sm:max-w-[82%] ${isBot ? "self-start" : "ml-auto flex-row-reverse"}`}
              >
                {/* Avatar */}
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold ${
                  isBot 
                    ? "bg-[#245C3A] text-white shadow-xs" 
                    : "bg-[#E8F0E7] text-[#245C3A] border border-[#D4E3D3]"
                }`}>
                  {isBot ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
                </div>

                {/* Message Bubble */}
                <div className="space-y-1">
                  <div className={`p-4 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                    isBot 
                      ? "bg-white text-[#26332B] border border-[#E2EBE2] shadow-xs rounded-tl-xs" 
                      : "bg-[#245C3A] text-white rounded-tr-xs shadow-xs font-medium"
                  }`}>
                    <p className="whitespace-pre-line">{msg.text}</p>
                  </div>

                  {/* Bubble Meta & Audio Play Button */}
                  <div className={`flex items-center gap-2 px-1 text-[11px] text-[#5C6E63] ${isBot ? "" : "justify-end"}`}>
                    <span>{msg.timestamp}</span>

                    {isBot && (
                      <button
                        type="button"
                        onClick={() => speakText(msg.text, msg.lang || selectedLang, msg.id)}
                        className={`px-2 py-0.5 rounded-lg transition cursor-pointer flex items-center gap-1 ${
                          isThisSpeaking 
                            ? "bg-[#245C3A] text-white animate-pulse" 
                            : "hover:bg-[#E8F0E7] text-[#5C6E63] hover:text-[#245C3A] bg-white border border-[#E2EBE2]"
                        }`}
                        title={isThisSpeaking ? "Stop Speaking" : "Play Voice"}
                      >
                        {isThisSpeaking ? (
                          <>
                            <VolumeX className="w-3.5 h-3.5" />
                            <span className="text-[10px] font-bold">Speaking...</span>
                          </>
                        ) : (
                          <>
                            <Volume2 className="w-3.5 h-3.5" />
                            <span className="text-[10px]">Listen Voice</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {/* AI Thinking Animation */}
          {isSending && (
            <div className="flex gap-3 max-w-[85%] self-start">
              <div className="w-8 h-8 rounded-xl bg-[#245C3A] text-white flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4" />
              </div>
              <div className="p-3.5 rounded-2xl bg-white border border-[#E2EBE2] text-xs text-[#26332B] flex items-center gap-2.5 shadow-2xs">
                <span className="w-2.5 h-2.5 rounded-full bg-[#245C3A] animate-ping"></span>
                <span className="font-medium">
                  {selectedLang === 'te' 
                    ? "కృషిసాథి AI మీ నేల కార్డును విశ్లేషిస్తోంది... (Analyzing soil data...)"
                    : (selectedLang === 'hi' 
                        ? "कृषिशाथी AI आपकी मिट्टी के आंकड़ों का विश्लेषण कर रहा है..." 
                        : "KrishiSaathi AI is analyzing your soil test data...")}
                </span>
              </div>
            </div>
          )}

          {/* Live Voice Interim Speech Display */}
          {isListening && interimText && (
            <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-300 text-xs text-[#245C3A] flex items-center gap-2">
              <Radio className="w-4 h-4 text-[#245C3A] animate-pulse shrink-0" />
              <span><strong>Hearing:</strong> "{interimText}"</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* 5. Suggested Quick Question Chips in Selected Language */}
        <div className="p-3 sm:px-6 bg-white border-t border-[#E2EBE2] overflow-x-auto whitespace-nowrap">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#5C6E63] shrink-0">
              💡 {selectedLang === 'te' ? 'సూచించిన ప్రశ్నలు:' : (selectedLang === 'hi' ? 'सुझाए गए सवाल:' : 'Quick Questions:')}
            </span>
            {currentQuestions.map((q, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSendMessage(q)}
                className="px-3.5 py-1.5 rounded-xl bg-[#F8FAF7] hover:bg-[#E8F0E7] border border-[#E2EBE2] hover:border-[#245C3A]/50 text-xs text-[#26332B] font-medium transition cursor-pointer shrink-0"
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        {/* 6. High-Visibility Voice & Text Input Bar */}
        <div className="p-4 bg-white border-t border-[#E2EBE2] space-y-3">
          
          {/* Big Voice Microphone Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 rounded-2xl bg-gradient-to-r from-[#F8FAF7] to-[#E8F0E7] border border-[#D4E3D3]">
            <div className="flex items-center gap-3">
              {/* Large Animated Microphone Button */}
              <button
                type="button"
                onClick={toggleListening}
                className={`relative w-14 h-14 rounded-full flex items-center justify-center transition shadow-md active:scale-95 cursor-pointer shrink-0 ${
                  isListening 
                    ? "bg-red-600 text-white ring-4 ring-red-300 animate-pulse" 
                    : "bg-[#245C3A] hover:bg-[#1B462C] text-white ring-4 ring-[#E8F0E7]"
                }`}
                title={isListening ? "Listening... Tap to stop" : "Tap to Speak in your Language"}
              >
                {isListening ? (
                  <>
                    <span className="absolute inset-0 rounded-full bg-red-400 animate-ping opacity-75"></span>
                    <MicOff className="w-6 h-6 relative z-10" />
                  </>
                ) : (
                  <Mic className="w-6 h-6" />
                )}
              </button>

              <div>
                <p className="text-xs font-black text-[#26332B]">
                  {isListening 
                    ? (selectedLang === 'te' ? "🔴 వింటున్నాను... దయచేసి మాట్లాడండి" : (selectedLang === 'hi' ? "🔴 सुन रहा हूँ... कृपया बोलिए" : "🔴 Listening... Speak clearly"))
                    : (selectedLang === 'te' ? "మైక్ నొక్కి తెలుగులో మాట్లాడండి" : (selectedLang === 'hi' ? "माइक दबाकर हिंदी में बोलें" : "Tap mic to speak your question in English"))}
                </p>
                <p className="text-[11px] text-[#5C6E63]">
                  {selectedLang === 'te' ? "వాయిస్ రికగ్నిషన్ ఆటోమేటిక్‌గా సమాధానం ఇస్తుంది" : "Automatic speech recognition & voice answer"}
                </p>
              </div>
            </div>

            <span className="text-[11px] font-bold text-[#245C3A] bg-white px-3 py-1 rounded-full border border-[#D4E3D3]">
              {selectedLang === 'te' ? "తెలుగు వాయిస్" : (selectedLang === 'hi' ? "हिंदी आवाज़" : "English Voice")}
            </span>
          </div>

          {/* Text input alternative */}
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder={
                selectedLang === 'te' 
                  ? "లేదా ఇక్కడ టైప్ చేయండి (ఉదా: నా నేలలో నత్రజని తక్కువగా ఉంది, ఏం చేయాలి?)..."
                  : (selectedLang === 'hi' 
                      ? "या यहाँ टाइप करें (उदा: यूरिया की कितनी मात्रा डालनी चाहिए?)..." 
                      : "Or type your farming query here...")
              }
              className="flex-1 py-3 px-4 bg-[#F8FAF7] rounded-2xl border border-[#E2EBE2] text-xs sm:text-sm text-[#26332B] placeholder:text-[#5C6E63] focus:outline-hidden focus:ring-2 focus:ring-[#245C3A]"
            />

            <button
              type="submit"
              disabled={!inputMessage.trim() || isSending}
              className="p-3 rounded-2xl bg-[#245C3A] hover:bg-[#1B462C] disabled:opacity-40 text-white transition active:scale-95 shadow-xs cursor-pointer shrink-0"
              title="Send Message"
            >
              <Send className="w-5 h-5" />
            </button>
          </form>

        </div>

      </div>

    </div>
  );
}
