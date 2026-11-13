import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { SoilProvider } from './context/SoilContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import SoilUploadModal from './components/SoilUploadModal';
import DashboardLayout from './layouts/DashboardLayout';

import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import SoilAnalysisPage from './pages/SoilAnalysisPage';
import CropRecommendationsPage from './pages/CropRecommendationsPage';
import FertilizerCalculatorPage from './pages/FertilizerCalculatorPage';
import AIAssistantPage from './pages/AIAssistantPage';
import MyFarmPage from './pages/MyFarmPage';
import SettingsPage from './pages/SettingsPage';

// Scroll to top on route change
function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

// Public layout with Landing Navbar & Footer
function PublicLayout() {
  return (
    <div className="flex flex-col min-h-screen font-sans bg-[#F8FAF7] text-[#26332B] selection:bg-[#E8F0E7] selection:text-[#245C3A]">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <SoilUploadModal />
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <SoilProvider>
          <ScrollToTop />
          <Routes>
            {/* Public Pre-Login Pages */}
            <Route element={<PublicLayout />}>
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
            </Route>

            {/* Redesigned Post-Login SaaS Dashboard Suite */}
            <Route element={<DashboardLayout />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/soil-analysis" element={<SoilAnalysisPage />} />
              <Route path="/crop-recommendations" element={<CropRecommendationsPage />} />
              <Route path="/fertilizer-calculator" element={<FertilizerCalculatorPage />} />
              <Route path="/ai-assistant" element={<AIAssistantPage />} />
              <Route path="/my-farm" element={<MyFarmPage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </SoilProvider>
      </AuthProvider>
    </Router>
  );
}
