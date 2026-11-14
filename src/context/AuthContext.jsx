import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';
import i18n from '../i18n';

const AuthContext = createContext();

export const DEMO_FARMER = {
  id: "demo-farmer-punjab",
  name: "Ramesh Kumar",
  nameHindi: "रमेश कुमार",
  mobile_number: "9876543210",
  village: "Kila Raipur",
  district: "Ludhiana",
  state: "Punjab",
  preferred_language: "en",
  landSize: "3.5 Acres",
  primaryCrop: "Wheat & Paddy"
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('krishisaathi_user');
    const token = localStorage.getItem('krishisaathi_token');
    if (saved && token) {
      try {
        return JSON.parse(saved);
      } catch {
        return null;
      }
    }
    return null;
  });

  const [language, setLanguageState] = useState(() => {
    const local = localStorage.getItem('krishisaathi_lang');
    if (local && ['en', 'te', 'hi'].includes(local)) return local;
    return 'en';
  });

  const [isLoading, setIsLoading] = useState(false);
  const [authStatus, setAuthStatus] = useState(null);
  const [authError, setAuthError] = useState(null);

  // setLanguage: the single source of truth for language changes
  const setLanguage = (newLang) => {
    if (!newLang) return;
    const targetLang = ['en', 'te', 'hi'].includes(newLang) ? newLang : newLang;
    setLanguageState(targetLang);
    localStorage.setItem('krishisaathi_lang', targetLang);
    localStorage.setItem('krishisaathi_preferred_lang', targetLang);
    if (typeof document !== 'undefined') {
      document.documentElement.lang = targetLang;
    }
    i18n.changeLanguage(targetLang).catch(() => {});

    // Sync to profile in background if user is authenticated
    const token = localStorage.getItem('krishisaathi_token');
    if (token && api.farmers && api.farmers.updateProfile) {
      api.farmers.updateProfile({ preferred_language: targetLang }).catch(e => {
        console.warn("Could not sync language preference to profile:", e.message);
      });
    }
  };

  useEffect(() => {
    if (user) {
      localStorage.setItem('krishisaathi_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('krishisaathi_user');
      localStorage.removeItem('krishisaathi_token');
    }
  }, [user]);

  // Keep i18n & HTML lang in sync with state
  useEffect(() => {
    if (language) {
      localStorage.setItem('krishisaathi_lang', language);
      localStorage.setItem('krishisaathi_preferred_lang', language);
      if (typeof document !== 'undefined') {
        document.documentElement.lang = language;
      }
      i18n.changeLanguage(language).catch(() => {});
    }
  }, [language]);

  // Check if token exists on mount and refresh profile from backend
  useEffect(() => {
    const token = localStorage.getItem('krishisaathi_token');
    if (token) {
      api.auth.getMe()
        .then(farmer => {
          if (farmer) {
            setUser(farmer);
            // Do NOT overwrite a language already saved locally
            const saved = localStorage.getItem('krishisaathi_lang');
            if (!saved && farmer.preferred_language) {
              setLanguage(farmer.preferred_language);
            }
          }
        })
        .catch(err => {
          console.log("Profile refresh error:", err.message);
        });
    }
  }, []);

  const login = async (mobile, password) => {
    setIsLoading(true);
    setAuthStatus(null);
    setAuthError(null);
    try {
      const res = await api.auth.login(mobile, password);
      if (res && res.farmer) {
        setUser(res.farmer);
        // Do NOT overwrite a language already saved locally
        const saved = localStorage.getItem('krishisaathi_lang');
        if (!saved && res.farmer.preferred_language) {
          setLanguage(res.farmer.preferred_language);
        }
        return res.farmer;
      }
      const me = await api.auth.getMe();
      if (me) {
        setUser(me);
        const saved = localStorage.getItem('krishisaathi_lang');
        if (!saved && me.preferred_language) {
          setLanguage(me.preferred_language);
        }
        return me;
      }
    } catch (err) {
      console.warn("Backend login error:", err.message);
      setAuthError(err.message || "Invalid mobile number or password");
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const demoLogin = async (profileKey = 'punjab', onStatusUpdate = null) => {
    setIsLoading(true);
    setAuthStatus(null);
    setAuthError(null);

    const updateStatus = (msg) => {
      setAuthStatus(msg);
      if (typeof onStatusUpdate === 'function') {
        onStatusUpdate(msg);
      }
    };

    const maxRetries = 3;
    const retryDelay = 5000;
    const mobile = profileKey === 'maharashtra' ? "9812345678" : "9876543210";
    const name = profileKey === 'maharashtra' ? "Suresh Patil" : "Ramesh Kumar";
    const district = profileKey === 'maharashtra' ? "Pune" : "Ludhiana";
    const state = profileKey === 'maharashtra' ? "Maharashtra" : "Punjab";
    const lang = profileKey === 'maharashtra' ? "mr" : "en";

    let lastError = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        if (attempt > 0) {
          updateStatus("Server is waking up, retrying...");
        }

        // Try login first (trying DemoPassword123 then password123)
        let loginSuccess = false;
        try {
          const res = await api.auth.login(mobile, "DemoPassword123");
          if (res?.access_token) loginSuccess = true;
        } catch {
          try {
            const res = await api.auth.login(mobile, "password123");
            if (res?.access_token) loginSuccess = true;
          } catch {
            loginSuccess = false;
          }
        }

        // If not logged in, try registering
        if (!loginSuccess) {
          try {
            await api.auth.register({
              name,
              mobile_number: mobile,
              password: "DemoPassword123",
              village: profileKey === 'maharashtra' ? "Baramati" : "Kila Raipur",
              district,
              state,
              preferred_language: lang
            });
          } catch {
            // If already registered, attempt login one more time
            await api.auth.login(mobile, "DemoPassword123");
          }
        }

        const farmerProfile = await api.auth.getMe();
        if (!farmerProfile) {
          throw new Error("Unable to retrieve farmer profile from server");
        }

        setUser(farmerProfile);
        const saved = localStorage.getItem('krishisaathi_lang');
        if (!saved && farmerProfile.preferred_language) {
          setLanguage(farmerProfile.preferred_language);
        }
        updateStatus(null);
        setAuthError(null);
        setIsLoading(false);
        return farmerProfile;
      } catch (err) {
        lastError = err;
        console.warn(`Backend login/register attempt ${attempt + 1} failed:`, err.message);
        if (attempt < maxRetries) {
          updateStatus("Server is waking up, retrying...");
          await new Promise(res => setTimeout(res, retryDelay));
        }
      }
    }

    // Only show a final error after retries. No silent fake-user fallback.
    setIsLoading(false);
    updateStatus(null);
    const finalErrorMessage = lastError?.message || "Server is waking up, retrying... failed. Server unreachable.";
    setAuthError(finalErrorMessage);
    throw new Error(finalErrorMessage);
  };

  const register = async (farmerData) => {
    setIsLoading(true);
    setAuthStatus(null);
    setAuthError(null);
    try {
      const payload = {
        name: farmerData.name,
        mobile_number: farmerData.mobile,
        password: farmerData.password || "Farmer123",
        village: farmerData.village || "Village",
        district: farmerData.district,
        state: farmerData.state,
        preferred_language: farmerData.preferredLanguage || "en"
      };

      const res = await api.auth.register(payload);
      if (res && res.farmer) {
        setUser(res.farmer);
        const saved = localStorage.getItem('krishisaathi_lang');
        if (!saved && res.farmer.preferred_language) {
          setLanguage(res.farmer.preferred_language);
        }
        return res.farmer;
      }
      const me = await api.auth.getMe();
      if (me) {
        setUser(me);
        const saved = localStorage.getItem('krishisaathi_lang');
        if (!saved && me.preferred_language) {
          setLanguage(me.preferred_language);
        }
        return me;
      }
    } catch (err) {
      console.warn("Backend register error:", err.message);
      setAuthError(err.message || "Registration failed");
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('krishisaathi_user');
    localStorage.removeItem('krishisaathi_token');
  };

  const updateProfile = async (updates) => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('krishisaathi_token');
      if (token) {
        const updated = await api.farmers.updateProfile(updates);
        if (updated) {
          setUser(prev => ({ ...prev, ...updated }));
          return updated;
        }
      }
    } catch (e) {
      console.warn("Backend update error, updating local user:", e.message);
    } finally {
      setIsLoading(false);
    }
    setUser(prev => ({ ...prev, ...updates }));
    return updates;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        language,
        setLanguage,
        login,
        demoLogin,
        register,
        updateProfile,
        logout,
        isLoading,
        authStatus,
        authError,
        isAuthenticated: !!user && !!localStorage.getItem('krishisaathi_token')
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
