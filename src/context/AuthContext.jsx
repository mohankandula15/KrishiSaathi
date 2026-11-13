import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

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
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return DEMO_FARMER;
      }
    }
    return DEMO_FARMER;
  });

  const [language, setLanguage] = useState(() => {
    return localStorage.getItem('krishisaathi_preferred_lang') || localStorage.getItem('krishisaathi_lang') || 'en';
  });

  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user) {
      localStorage.setItem('krishisaathi_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('krishisaathi_user');
      localStorage.removeItem('krishisaathi_token');
    }
  }, [user]);

  useEffect(() => {
    localStorage.setItem('krishisaathi_lang', language);
    localStorage.setItem('krishisaathi_preferred_lang', language);
  }, [language]);

  // Check if token exists on mount and refresh profile from backend
  useEffect(() => {
    const token = localStorage.getItem('krishisaathi_token');
    if (token) {
      api.auth.getMe()
        .then(farmer => {
          if (farmer) {
            setUser(farmer);
            if (farmer.preferred_language) {
              setLanguage(farmer.preferred_language);
            }
          }
        })
        .catch(err => {
          console.log("Using cached/demo user session:", err.message);
        });
    }
  }, []);

  const login = async (mobile, password) => {
    setIsLoading(true);
    try {
      const res = await api.auth.login(mobile, password);
      if (res && res.farmer) {
        setUser(res.farmer);
        if (res.farmer.preferred_language) {
          setLanguage(res.farmer.preferred_language);
        }
        return res.farmer;
      }
    } catch (err) {
      console.warn("Backend login error, falling back to local session:", err.message);
      // Fallback for offline demo
      const loggedUser = {
        ...DEMO_FARMER,
        mobile_number: mobile || "9876543210",
        name: mobile === "9876543210" ? "Ramesh Kumar" : "Kisan Mitr"
      };
      setUser(loggedUser);
      return loggedUser;
    } finally {
      setIsLoading(false);
    }
  };

  const demoLogin = async (profileKey = 'punjab') => {
    setIsLoading(true);
    try {
      const mobile = profileKey === 'maharashtra' ? "9812345678" : "9876543210";
      const name = profileKey === 'maharashtra' ? "Suresh Patil" : "Ramesh Kumar";
      const district = profileKey === 'maharashtra' ? "Pune" : "Ludhiana";
      const state = profileKey === 'maharashtra' ? "Maharashtra" : "Punjab";
      const lang = profileKey === 'maharashtra' ? "mr" : "en";

      // Try registering/logging in via backend
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
      } catch (e) {
        // If already exists, login
        await api.auth.login(mobile, "DemoPassword123");
      }

      const farmerProfile = await api.auth.getMe();
      setUser(farmerProfile);
      setLanguage(farmerProfile.preferred_language || lang);
    } catch (err) {
      // Fallback
      if (profileKey === 'maharashtra') {
        const mhUser = {
          id: "demo-farmer-mh",
          name: "Suresh Patil",
          nameHindi: "सुरेश पाटिल",
          mobile_number: "9812345678",
          village: "Baramati",
          district: "Pune",
          state: "Maharashtra",
          preferred_language: "mr",
          landSize: "4.2 Acres",
          primaryCrop: "Cotton & Soybean"
        };
        setUser(mhUser);
        setLanguage('mr');
      } else {
        setUser(DEMO_FARMER);
        setLanguage('en');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (farmerData) => {
    setIsLoading(true);
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
        if (res.farmer.preferred_language) {
          setLanguage(res.farmer.preferred_language);
        }
        return res.farmer;
      }
    } catch (err) {
      console.warn("Backend register error, saving locally:", err.message);
      const newUser = {
        id: `farmer-${Date.now()}`,
        name: farmerData.name || "Farmer",
        mobile_number: farmerData.mobile,
        village: farmerData.village || "Village",
        district: farmerData.district || "District",
        state: farmerData.state || "State",
        preferred_language: farmerData.preferredLanguage || "en",
        landSize: farmerData.landSize || "2.0 Acres",
        primaryCrop: farmerData.primaryCrop || "Wheat"
      };
      setUser(newUser);
      if (farmerData.preferredLanguage) {
        setLanguage(farmerData.preferredLanguage);
      }
      return newUser;
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
        isAuthenticated: !!user
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
