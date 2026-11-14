import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Bot, 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  Send,
  Globe, 
  User, 
  Trash2,
  ShieldCheck,
  Radio,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSoil } from '../context/SoilContext';
import { api, API_BASE_URL } from '../services/api';

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
  const [loadingStatus, setLoadingStatus] = useState(null);
  const [availableVoices, setAvailableVoices] = useState([]);
  const [voiceNotice, setVoiceNotice] = useState('');
  const [micNotice, setMicError] = useState('');
  const currentAudioRef = useRef(null);

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
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
    }
    setSpeakingMessageId(null);
    setVoiceNotice('');
    setMicError('');

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
  const getWelcomeText = useCallback((lang) => {
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
  }, [user, activeReport]);

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

  // When language changes, immediately re-render the welcome message even if chat history exists
  useEffect(() => {
    setMessages(prev => {
      const welcome = {
        id: 1,
        sender: 'bot',
        text: getWelcomeText(selectedLang),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        lang: selectedLang
      };
      if (!prev || prev.length === 0) {
        return [welcome];
      }
      const hasWelcome = prev[0]?.id === 1;
      const rest = hasWelcome ? prev.slice(1) : prev;
      return [welcome, ...rest];
    });
  }, [selectedLang, getWelcomeText]);

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

  // Clean up speech synthesis, audio & recognition on unmount
  useEffect(() => {
    return () => {
      if (currentAudioRef.current) {
        currentAudioRef.current.pause();
        currentAudioRef.current = null;
      }
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
      }
    };
  }, []);

  // Text-To-Speech (Speaker Button & Auto-Speak)
  const speakText = async (text, langCode = selectedLang, messageId = null) => {
    // 1. Support stop/toggle on the same message
    if (speakingMessageId && speakingMessageId === messageId) {
      if (currentAudioRef.current) {
        currentAudioRef.current.pause();
        currentAudioRef.current = null;
      }
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      setSpeakingMessageId(null);
      return;
    }

    // Stop any currently playing audio or speech
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
    }
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    if (messageId) setSpeakingMessageId(messageId);
    setVoiceNotice('');

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

    let targetLang = langCode || selectedLang || 'te';
    if (/[\u0C00-\u0C7F]/.test(cleanText)) {
      targetLang = 'te';
    } else if (/[\u0900-\u097F]/.test(cleanText)) {
      targetLang = 'hi';
    }

    // 2. Call backend TTS endpoint with fetch (includes auth header)
    try {
      const token = localStorage.getItem('krishisaathi_token');
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
      const ttsUrl = `${API_BASE_URL}/chat/tts?text=${encodeURIComponent(cleanText.slice(0, 500))}&lang=${encodeURIComponent(targetLang)}`;

      const res = await fetch(ttsUrl, { headers });
      if (!res.ok) {
        throw new Error(`TTS server responded with ${res.status}`);
      }

      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const audio = new Audio(blobUrl);
      currentAudioRef.current = audio;

      audio.onended = () => {
        URL.revokeObjectURL(blobUrl);
        if (currentAudioRef.current === audio) {
          currentAudioRef.current = null;
        }
        setSpeakingMessageId(null);
      };

      audio.onerror = () => {
        URL.revokeObjectURL(blobUrl);
        if (currentAudioRef.current === audio) {
          currentAudioRef.current = null;
        }
        setSpeakingMessageId(null);
      };

      await audio.play();
      return;
    } catch (ttsErr) {
      console.warn("Backend TTS endpoint failed, attempting browser voice fallback:", ttsErr.message);
    }

    // 3. Fall back to speechSynthesis ONLY when a voice for that language exists
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const voices = (window.speechSynthesis.getVoices && window.speechSynthesis.getVoices().length > 0)
        ? window.speechSynthesis.getVoices()
        : availableVoices;
      const targetFamily = targetLang === 'te' ? 'te' : (targetLang === 'hi' ? 'hi' : 'en');

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
        const utterance = new SpeechSynthesisUtterance(cleanText);
        utterance.voice = matchedVoice;
        utterance.lang = matchedVoice.lang || (targetFamily === 'te' ? 'te-IN' : (targetFamily === 'hi' ? 'hi-IN' : 'en-IN'));
        utterance.rate = 0.95;
        utterance.pitch = 1.0;
        utterance.onend = () => setSpeakingMessageId(null);
        utterance.onerror = () => setSpeakingMessageId(null);
        window.speechSynthesis.speak(utterance);
        return;
      }
    }

    // 4. Voice not available for this language
    setSpeakingMessageId(null);
    setVoiceNotice("Voice not available for this language");
    setTimeout(() => setVoiceNotice(''), 4000);
  };

  // Localized microphone error messages
  const getMicErrorMessage = (errorType, lang) => {
    switch (errorType) {
      case 'not-allowed':
      case 'service-not-allowed':
      case 'NotAllowedError':
      case 'PermissionDeniedError':
        if (lang === 'te') {
          return "మైక్రోఫోన్ అనుమతి నిరాకరించబడింది. దయచేసి బ్రౌజర్ సెట్టింగ్స్‌లో మైక్ అనుమతించండి.";
        }
        if (lang === 'hi') {
          return "माइक्रोफ़ोन की अनुमति अस्वीकृत है। कृपया ब्राउज़र सेटिंग्स में माइक की अनुमति दें।";
        }
        return "Microphone permission denied. Please allow microphone access in your browser settings.";

      case 'no-speech':
        if (lang === 'te') {
          return "మాటలు వినబడలేదు. దయచేసి మైక్ నొక్కి మళ్లీ స్పష్టంగా మాట్లాడండి.";
        }
        if (lang === 'hi') {
          return "कोई आवाज सुनाई नहीं दी। कृपया माइक दबाकर पुनः स्पष्ट बोलें।";
        }
        return "No speech detected. Please tap the mic and speak clearly.";

      case 'network':
        if (lang === 'te') {
          return "వాయిస్ రికగ్నిషన్ నెట్‌వర్క్ లోపం. దయచేసి ఇంటర్నెట్ కనెక్షన్ తనిఖీ చేయండి.";
        }
        if (lang === 'hi') {
          return "आवाज पहचान में नेटवर्क त्रुटि। कृपया इंटरनेट कनेक्शन जांचें।";
        }
        return "Voice recognition network error. Please check your internet connection.";

      case 'audio-capture':
        if (lang === 'te') {
          return "మైక్రోఫోన్ పరికరం దొరకలేదు లేదా పనిచేయడం లేదు. మైక్రోఫోన్ తనిఖీ చేయండి.";
        }
        if (lang === 'hi') {
          return "माइक्रोफ़ोन डिवाइस नहीं मिला या काम नहीं कर रहा है।";
        }
        return "No microphone detected or audio capture failed. Check your microphone.";

      case 'language-not-supported':
        if (lang === 'te') {
          return "ఈ భాషకు వాయిస్ రికగ్నిషన్ సపోర్ట్ లేదు. దయచేసి టైప్ చేయండి లేదా వేరే భాష ఎంచుకోండి.";
        }
        if (lang === 'hi') {
          return "इस भाषा के लिए आवाज पहचान समर्थित नहीं है। कृपया लिखकर पूछें।";
        }
        return "Voice recognition is not supported for this language on your browser. Please type your query.";

      default:
        if (lang === 'te') {
          return "వాయిస్ రికగ్నిషన్ లోపం. దయచేసి మీ ప్రశ్నను టైప్ చేయండి.";
        }
        if (lang === 'hi') {
          return "आवाज पहचान में समस्या आई। कृपया अपना सवाल लिखकर पूछें।";
        }
        return "Voice recognition error. Please type your question.";
    }
  };

  // Speech-To-Text (Microphone Button)
  const toggleListening = async () => {
    setMicError('');

    if (isListening) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
      }
      setIsListening(false);
      setInterimText('');
      return;
    }

    const SpeechRecognition = typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition);

    if (!SpeechRecognition) {
      setMicError("Voice input needs Chrome on Android/desktop. Please type your question.");
      return;
    }

    // Request mic permission with getUserMedia and stop tracks
    if (typeof navigator !== 'undefined' && navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach(track => track.stop());
      } catch (err) {
        console.warn("Microphone permission denied:", err);
        setMicError(getMicErrorMessage('not-allowed', selectedLang));
        setIsListening(false);
        return;
      }
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
        setMicError('');
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

      recognition.onerror = (event) => {
        console.warn("Speech recognition error:", event.error);
        setIsListening(false);
        setInterimText('');
        setMicError(getMicErrorMessage(event.error, selectedLang));
      };

      recognition.onend = () => {
        setIsListening(false);
        setInterimText('');
      };

      recognition.start();
    } catch (err) {
      console.warn("Speech recognition initialization failed:", err);
      setIsListening(false);
      setInterimText('');
      setMicError(getMicErrorMessage(err.name || 'error', selectedLang));
    }
  };

  // Process and send message
  const handleSendMessage = async (textToSend = null, explicitLang = null) => {
    const text = (textToSend || inputMessage).trim();
    if (!text || isSending) return;

    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
    }
    setSpeakingMessageId(null);
    setMicError('');
    setVoiceNotice('');

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
    setLoadingStatus(null);

    // Helper to send with 25s timeout
    const sendWithTimeout = async (msgText, lang, timeoutMs = 25000) => {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);
      try {
        const res = await api.chat.send(msgText, lang, { signal: controller.signal });
        clearTimeout(timer);
        return res;
      } catch (err) {
        clearTimeout(timer);
        if (err.name === 'AbortError') {
          const timeoutErr = new Error('Request timed out (25s)');
          timeoutErr.isTimeout = true;
          timeoutErr.isNetworkError = true;
          throw timeoutErr;
        }
        throw err;
      }
    };

    let backendRes = null;
    let sendError = null;

    try {
      backendRes = await sendWithTimeout(text, detectedLang, 25000);
    } catch (firstErr) {
      console.warn("First chat attempt failed/timed out:", firstErr.message);
      sendError = firstErr;

      // Show clear "server is waking up, retrying" message
      const wakingMsg = detectedLang === 'te'
        ? "సర్వర్ మేల్కొంటోంది, మళ్లీ ప్రయత్నిస్తోంది... (Server is waking up, retrying...)"
        : (detectedLang === 'hi'
            ? "सर्वर शुरू हो रहा है, पुनः प्रयास जारी है... (Server is waking up, retrying...)"
            : "Server is waking up, retrying...");
      setLoadingStatus(wakingMsg);

      // One automatic retry with another 25-second timeout
      try {
        backendRes = await sendWithTimeout(text, detectedLang, 25000);
        sendError = null;
      } catch (retryErr) {
        console.warn("Second chat attempt failed:", retryErr.message);
        sendError = retryErr;
      }
    }

    setLoadingStatus(null);

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

    // Determine the real reason in the user's language (network error vs 401 vs 500)
    const isNetwork = 
      sendError?.isNetworkError ||
      sendError?.name === 'TypeError' ||
      (typeof navigator !== 'undefined' && !navigator.onLine) ||
      /network|fetch|connection|failed to fetch/i.test(sendError?.message || '');

    const is401 = 
      sendError?.status === 401 ||
      /401|unauthorized|session expired/i.test(sendError?.message || '');

    const is500 = 
      (typeof sendError?.status === 'number' && sendError.status >= 500) ||
      /500|502|503|504|internal server error|server error/i.test(sendError?.message || '');

    let offlineMessage = "Assistant is offline, please retry.";
    if (is401) {
      if (detectedLang === 'te') {
        offlineMessage = "సహాయకుడు ఆఫ్‌లైన్‌లో ఉన్నారు: మీ లాగిన్ సెషన్ గడువు ముగిసింది (401). దయచేసి మళ్లీ లాగిన్ అవ్వండి.";
      } else if (detectedLang === 'hi') {
        offlineMessage = "सहायक ऑफ़लाइन है: सत्र समाप्त हो गया (401)। कृपया पुनः लॉगिन करें।";
      } else {
        offlineMessage = "Assistant is offline: Session expired (401). Please log in again.";
      }
    } else if (is500) {
      if (detectedLang === 'te') {
        offlineMessage = "సహాయకుడు ఆఫ్‌లైన్‌లో ఉన్నారు: సర్వర్ లోపం (500). దయచేసి కాసేపటి తర్వాత మళ్లీ ప్రయత్నించండి.";
      } else if (detectedLang === 'hi') {
        offlineMessage = "सहायक ऑफ़लाइन है: सर्वर त्रुटि (500)। कृपया थोड़ी देर बाद पुनः प्रयास करें।";
      } else {
        offlineMessage = "Assistant is offline: Server error (500). Please retry in a moment.";
      }
    } else if (isNetwork) {
      if (detectedLang === 'te') {
        offlineMessage = "సహాయకుడు ఆఫ్‌లైన్‌లో ఉన్నారు: నెట్‌వర్క్ లోపం. దయచేసి మీ ఇంటర్నెట్ కనెక్షన్ తనిఖీ చేసి మళ్లీ ప్రయత్నించండి.";
      } else if (detectedLang === 'hi') {
        offlineMessage = "सहायक ऑफ़लाइन है: नेटवर्क त्रुटि। कृपया अपना इंटरनेट कनेक्शन जांचें और पुनः प्रयास करें।";
      } else {
        offlineMessage = "Assistant is offline: Network error. Please check your connection and retry.";
      }
    } else {
      if (detectedLang === 'te') {
        offlineMessage = "సహాయకుడు ఆఫ్‌లైన్‌లో ఉన్నారు, దయచేసి మళ్లీ ప్రయత్నించండి.";
      } else if (detectedLang === 'hi') {
        offlineMessage = "सहायक ऑफ़लाइन है, कृपया पुनः प्रयास करें।";
      }
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
    } catch {}

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
                  {loadingStatus || (
                    selectedLang === 'te' 
                      ? "కృషిసాథి AI మీ నేల కార్డును విశ్లేషిస్తోంది... (Analyzing soil data...)"
                      : (selectedLang === 'hi' 
                          ? "कृषिशाथी AI आपकी मिट्टी के आंकड़ों का विश्लेषण कर रहा है..." 
                          : "KrishiSaathi AI is analyzing your soil test data...")
                  )}
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
          
          {/* Voice Synthesis Notification Banner */}
          {voiceNotice && (
            <div className="p-2.5 px-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs font-semibold text-amber-900 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>{voiceNotice}</span>
              </div>
              <button 
                type="button" 
                onClick={() => setVoiceNotice('')}
                className="text-amber-600 hover:text-amber-800 text-xs px-1 cursor-pointer"
              >
                ✕
              </button>
            </div>
          )}

          {/* Speech-To-Text Warning / Error Banner */}
          {micNotice && (
            <div className="p-2.5 px-3.5 rounded-xl bg-red-50 border border-red-200 text-xs font-semibold text-red-800 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{micNotice}</span>
              </div>
              <button 
                type="button" 
                onClick={() => setMicError('')}
                className="text-red-500 hover:text-red-700 text-xs px-1 cursor-pointer"
              >
                ✕
              </button>
            </div>
          )}

          {/* Big Voice Microphone Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 rounded-2xl bg-gradient-to-r from-[#F8FAF7] to-[#E8F0E7] border border-[#D4E3D3]">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              {/* Large Animated Microphone Button - Touch target min 56px */}
              <button
                type="button"
                onClick={toggleListening}
                className={`relative w-14 h-14 min-w-[56px] min-h-[56px] rounded-full flex items-center justify-center transition shadow-md active:scale-95 cursor-pointer shrink-0 z-10 ${
                  isListening 
                    ? "bg-red-600 text-white ring-4 ring-red-300 animate-pulse" 
                    : "bg-[#245C3A] hover:bg-[#1B462C] text-white ring-4 ring-[#E8F0E7]"
                }`}
                aria-label={isListening ? "Stop voice listening" : "Start voice listening"}
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

              <div className="flex-1 min-w-0">
                <p className="text-xs font-black text-[#26332B] truncate">
                  {isListening 
                    ? (selectedLang === 'te' ? "🔴 వింటున్నాను... మాట్లాడండి" : (selectedLang === 'hi' ? "🔴 सुन रहा हूँ... बोलिए" : "🔴 Listening... Speak clearly"))
                    : (selectedLang === 'te' ? "మైక్ నొక్కి తెలుగులో మాట్లాడండి" : (selectedLang === 'hi' ? "माइक दबाकर हिंदी में बोलें" : "Tap mic to speak your question in English"))}
                </p>
                <p className="text-[11px] text-[#5C6E63] truncate">
                  {isListening 
                    ? (selectedLang === 'te' ? "పూర్తయ్యాక మైక్ మళ్లీ నొక్కండి" : "Tap mic again to finish") 
                    : (selectedLang === 'te' ? "వాయిస్ రికగ్నిషన్ ఆటోమేటిక్‌గా సమాధానం ఇస్తుంది" : "Automatic speech recognition & voice answer")}
                </p>
              </div>
            </div>

            <span className="text-[11px] font-bold text-[#245C3A] bg-white px-3 py-1 rounded-full border border-[#D4E3D3] self-start sm:self-auto shrink-0">
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
