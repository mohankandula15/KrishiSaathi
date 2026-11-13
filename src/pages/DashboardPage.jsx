import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Sprout, 
  UploadCloud, 
  FileText, 
  Bot, 
  TrendingUp, 
  AlertCircle, 
  ArrowRight, 
  Mic, 
  Calendar, 
  MapPin, 
  CloudSun, 
  Plus, 
  CheckCircle2, 
  ChevronRight,
  ShieldCheck,
  Sparkles,
  Calculator
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSoil } from '../context/SoilContext';

export default function DashboardPage() {
  const { user } = useAuth();
  const { reports, activeReport, setActiveReportId, setIsUploadModalOpen } = useSoil();
  const navigate = useNavigate();

  const farmerName = user?.name || "Ramesh Kumar";
  const locationText = `${user?.village || "Kila Raipur"}, ${user?.district || "Ludhiana"}, ${user?.state || "Punjab"}`;
  const farmSize = user?.landSize || "3.5 Acres";
  const primaryCrop = user?.primaryCrop || "Wheat & Paddy";

  // Calculate SVG circular score progress
  const healthScore = activeReport?.healthScore || 74;
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (healthScore / 100) * circumference;

  // Simple nutrient statuses for the simplified display
  const nitrogenRating = activeReport?.nutrients?.nitrogen?.rating || "Low";
  const phosphorusRating = activeReport?.nutrients?.phosphorus?.rating || "Optimal";
  const potassiumRating = activeReport?.nutrients?.potassium?.rating || "High";

  const getStatusBadge = (rating) => {
    switch (rating?.toLowerCase()) {
      case 'low':
      case 'deficient':
        return {
          label: "Low",
          pillClass: "bg-amber-50 text-amber-900 border-amber-200",
          dotClass: "bg-amber-600"
        };
      case 'optimal':
      case 'medium':
      case 'normal':
      case 'sufficient':
        return {
          label: "Optimal",
          pillClass: "bg-emerald-50 text-[#245C3A] border-emerald-200",
          dotClass: "bg-[#245C3A]"
        };
      case 'high':
      case 'rich':
        return {
          label: "High",
          pillClass: "bg-sky-50 text-sky-900 border-sky-200",
          dotClass: "bg-sky-600"
        };
      default:
        return {
          label: rating || "Normal",
          pillClass: "bg-stone-50 text-stone-800 border-stone-200",
          dotClass: "bg-stone-500"
        };
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      
      {/* 1. Spacious Welcome & Farm Summary Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E2EBE2] shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          
          <div className="space-y-2.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E8F0E7] text-[#245C3A] text-xs font-bold border border-[#D4E3D3]">
              <span className="w-2 h-2 rounded-full bg-[#245C3A] animate-pulse"></span>
              <span>Farm Management Dashboard</span>
            </div>
            
            <h1 className="text-2xl sm:text-3xl font-black text-[#26332B] tracking-tight">
              Welcome back, {farmerName} 👋
            </h1>
            
            <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-[#5C6E63] font-medium">
              <span className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#245C3A]" />
                {locationText}
              </span>
              <span>•</span>
              <span>Farm Size: <strong className="text-[#26332B]">{farmSize}</strong></span>
              <span>•</span>
              <span>Primary Crop: <strong className="text-[#26332B]">{primaryCrop}</strong></span>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsUploadModalOpen(true)}
              className="px-5 py-3 rounded-2xl bg-[#245C3A] hover:bg-[#1B462C] text-white font-bold text-xs shadow-xs hover:shadow-md transition active:scale-98 flex items-center gap-2 cursor-pointer"
            >
              <UploadCloud className="w-4 h-4 text-emerald-100" />
              <span>Upload Soil Report</span>
            </button>

            <Link
              to="/ai-assistant"
              className="px-4 py-3 rounded-2xl bg-[#E8F0E7] hover:bg-[#D4E3D3] text-[#245C3A] font-bold text-xs transition flex items-center gap-2"
            >
              <Bot className="w-4 h-4 text-[#245C3A]" />
              <span>Voice Advisor</span>
            </Link>
          </div>

        </div>

        {/* Ambient Farm Indicators */}
        <div className="mt-6 pt-6 border-t border-[#E2EBE2] grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="flex items-center gap-3 p-3 rounded-2xl bg-[#F8FAF7] border border-[#E2EBE2]">
            <CloudSun className="w-6 h-6 text-amber-700 shrink-0" />
            <div>
              <p className="font-bold text-[#26332B]">Weather: 24°C • Clear Sky</p>
              <p className="text-[#5C6E63] text-[11px]">Humidity: 58% • Rain Probability: 5%</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-2xl bg-[#F8FAF7] border border-[#E2EBE2]">
            <Calendar className="w-6 h-6 text-[#245C3A] shrink-0" />
            <div>
              <p className="font-bold text-[#26332B]">Current Season: Rabi Season</p>
              <p className="text-[#5C6E63] text-[11px]">CRI Stage window for wheat irrigation & top dressing</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-2xl bg-[#F8FAF7] border border-[#E2EBE2]">
            <ShieldCheck className="w-6 h-6 text-[#245C3A] shrink-0" />
            <div>
              <p className="font-bold text-[#26332B]">Active Card: {activeReport?.id}</p>
              <p className="text-[#5C6E63] text-[11px]">Tested: {activeReport?.sampleDate} • {activeReport?.soilType}</p>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Visual Soil Health Overview Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E2EBE2] shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 pb-6 border-b border-[#E2EBE2]">
          
          <div className="space-y-3 max-w-xl">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#245C3A] bg-[#E8F0E7] px-3 py-1 rounded-full border border-[#D4E3D3]">
                Soil Health Overview
              </span>
              <span className="text-xs bg-[#F2F7F1] text-[#5C6E63] font-medium px-2.5 py-0.5 rounded-full border border-[#E2EBE2]">
                Card: {activeReport?.id}
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl font-black text-[#26332B]">
              {activeReport?.title}
            </h2>

            <p className="text-xs text-[#5C6E63] leading-relaxed">
              Tested at <strong>{activeReport?.labName}</strong> on {activeReport?.sampleDate}. Soil classification: <strong>{activeReport?.soilType}</strong>.
            </p>

            <div className="p-3.5 rounded-2xl bg-[#E8F0E7] text-[#245C3A] text-xs font-semibold flex items-center gap-2.5 border border-[#D4E3D3]">
              <AlertCircle className="w-4 h-4 text-[#245C3A] shrink-0" />
              <span>Diagnosis: <strong>{activeReport?.overallStatus || "Moderate - Action Advised"}</strong></span>
            </div>
          </div>

          {/* Visually Attractive Circular Health Score Indicator */}
          <div className="flex items-center gap-5 p-5 rounded-3xl bg-[#F8FAF7] border border-[#E2EBE2] self-start lg:self-auto">
            <div className="relative w-24 h-24 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 90 90">
                {/* Background Ring */}
                <circle
                  cx="45"
                  cy="45"
                  r={radius}
                  className="text-[#E8F0E7]"
                  strokeWidth="8"
                  stroke="currentColor"
                  fill="transparent"
                />
                {/* Progress Ring */}
                <circle
                  cx="45"
                  cy="45"
                  r={radius}
                  className="text-[#245C3A] transition-all duration-1000 ease-out"
                  strokeWidth="8"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="transparent"
                />
              </svg>
              <div className="absolute flex flex-col items-center justify-center text-center">
                <span className="text-2xl font-black text-[#26332B] leading-none">
                  {healthScore}
                </span>
                <span className="text-[10px] text-[#5C6E63] font-bold">/100</span>
              </div>
            </div>

            <div className="space-y-1">
              <p className="text-xs font-bold text-[#5C6E63] uppercase tracking-wider">
                Soil Health Index
              </p>
              <p className="text-sm font-black text-[#245C3A]">
                {healthScore >= 80 ? "Optimal Fertility" : healthScore >= 60 ? "Moderate Fertility" : "Low Fertility"}
              </p>
              <p className="text-[11px] text-[#5C6E63] max-w-[160px]">
                Fertilizer calibration can elevate score to 88+.
              </p>
            </div>
          </div>

        </div>

        {/* 3. SIMPLIFIED NUTRIENT DISPLAY (Strict Requirement) */}
        <div className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-[#5C6E63]">
                Key Nutrient Status Summary
              </h3>
              <p className="text-xs text-[#5C6E63]">
                Summary of primary elements without technical clutter
              </p>
            </div>

            <span className="text-xs font-bold text-[#245C3A] bg-[#E8F0E7] px-2.5 py-1 rounded-full">
              4 Core Indicators
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* 1. Nitrogen Status */}
            <div className="p-4 rounded-2xl bg-[#F8FAF7] border border-[#E2EBE2] flex flex-col justify-between space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#5C6E63]">Nitrogen (N)</span>
                {(() => {
                  const b = getStatusBadge(nitrogenRating);
                  return (
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold border ${b.pillClass}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${b.dotClass}`}></span>
                      {b.label}
                    </span>
                  );
                })()}
              </div>
              <p className="text-xs text-[#26332B] font-medium leading-relaxed">
                Deficient in topsoil. Split doses of Neem-coated Urea required.
              </p>
            </div>

            {/* 2. Phosphorus Status */}
            <div className="p-4 rounded-2xl bg-[#F8FAF7] border border-[#E2EBE2] flex flex-col justify-between space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#5C6E63]">Phosphorus (P)</span>
                {(() => {
                  const b = getStatusBadge(phosphorusRating);
                  return (
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold border ${b.pillClass}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${b.dotClass}`}></span>
                      {b.label}
                    </span>
                  );
                })()}
              </div>
              <p className="text-xs text-[#26332B] font-medium leading-relaxed">
                Adequate for root growth. Standard DAP basal dosage is sufficient.
              </p>
            </div>

            {/* 3. Potassium Status */}
            <div className="p-4 rounded-2xl bg-[#F8FAF7] border border-[#E2EBE2] flex flex-col justify-between space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#5C6E63]">Potassium (K)</span>
                {(() => {
                  const b = getStatusBadge(potassiumRating);
                  return (
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold border ${b.pillClass}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${b.dotClass}`}></span>
                      {b.label}
                    </span>
                  );
                })()}
              </div>
              <p className="text-xs text-[#26332B] font-medium leading-relaxed">
                Abundant natural reserves. Reduce MOP by 50% to save input cost.
              </p>
            </div>

            {/* 4. Overall Soil Health */}
            <div className="p-4 rounded-2xl bg-[#F8FAF7] border border-[#E2EBE2] flex flex-col justify-between space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#5C6E63]">Overall Soil Health</span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#E8F0E7] text-[#245C3A] border border-[#D4E3D3]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#245C3A]"></span>
                  Moderate
                </span>
              </div>
              <p className="text-xs text-[#26332B] font-medium leading-relaxed">
                Good foundation. Adding FYM/compost will raise biological activity.
              </p>
            </div>

          </div>

          {/* Prominent View Detailed Soil Report Button */}
          <div className="mt-6 pt-6 border-t border-[#E2EBE2] flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-[#5C6E63] text-center sm:text-left">
              Detailed NPK values, 0-14 pH curve, Organic Carbon % and micronutrient charts are organized on the analysis page.
            </p>

            <Link
              to="/soil-analysis"
              className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-[#245C3A] hover:bg-[#1B462C] text-white font-black text-xs flex items-center justify-center gap-2 shadow-sm hover:shadow-md transition active:scale-98 whitespace-nowrap cursor-pointer"
            >
              <span>View Detailed Soil Report</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

      </div>

      {/* 4. Middle Two-Column Grid: Recommended Crops & Fertilizer Guidance */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Recommended Crop Summary (6 cols) */}
        <div className="lg:col-span-6 bg-white rounded-3xl p-6 sm:p-8 border border-[#E2EBE2] shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-[#E2EBE2] mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#E8F0E7] text-[#245C3A] flex items-center justify-center font-bold">
                  <Sprout className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-base text-[#26332B]">
                    Recommended Crops
                  </h3>
                  <p className="text-xs text-[#5C6E63]">
                    Matched to your pH ({activeReport?.ph?.value}) and soil type
                  </p>
                </div>
              </div>

              <Link
                to="/crop-recommendations"
                className="text-xs font-bold text-[#245C3A] hover:underline flex items-center gap-1"
              >
                <span>All Crops</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="space-y-3">
              {(activeReport?.cropRecommendations || []).slice(0, 3).map((crop, idx) => (
                <div 
                  key={idx}
                  className="p-4 rounded-2xl bg-[#F8FAF7] border border-[#E2EBE2] hover:border-[#245C3A]/50 transition flex items-center justify-between gap-4"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-black text-sm text-[#26332B] truncate">{crop.crop}</span>
                      <span className="text-[10px] font-bold bg-[#E8F0E7] text-[#245C3A] px-2 py-0.5 rounded-full shrink-0">
                        {crop.suitability}% Match
                      </span>
                    </div>
                    <p className="text-xs text-[#5C6E63] truncate">
                      Expected Yield: <strong className="text-[#26332B]">{crop.expectedYield}</strong>
                    </p>
                  </div>

                  <span className="text-xs font-bold text-[#245C3A] bg-white px-2.5 py-1 rounded-xl border border-[#E2EBE2] shrink-0">
                    {crop.badge}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-5 mt-5 border-t border-[#E2EBE2]">
            <Link
              to="/crop-recommendations"
              className="w-full py-2.5 rounded-xl bg-[#F8FAF7] hover:bg-[#E8F0E7] text-[#245C3A] font-bold text-xs flex items-center justify-center gap-2 transition"
            >
              <span>Explore High-Yield Varietal Details</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Fertilizer Guidance Summary (6 cols) */}
        <div className="lg:col-span-6 bg-white rounded-3xl p-6 sm:p-8 border border-[#E2EBE2] shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-[#E2EBE2] mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#E8F0E7] text-[#245C3A] flex items-center justify-center font-bold">
                  <Calculator className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-base text-[#26332B]">
                    Fertilizer Dosage Plan
                  </h3>
                  <p className="text-xs text-[#5C6E63]">
                    Per-acre calibrated doses based on soil deficiency
                  </p>
                </div>
              </div>

              <Link
                to="/fertilizer-calculator"
                className="text-xs font-bold text-[#245C3A] hover:underline flex items-center gap-1"
              >
                <span>Calculator</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="space-y-3">
              {(activeReport?.fertilizerPlan || []).map((item, idx) => (
                <div 
                  key={idx}
                  className="p-3.5 rounded-2xl bg-[#F8FAF7] border border-[#E2EBE2] flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <p className="font-black text-xs text-[#26332B] truncate">{item.fertilizer}</p>
                    <p className="text-[11px] text-[#5C6E63] truncate">{item.timing}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-xs font-black text-[#245C3A] bg-[#E8F0E7] px-2.5 py-1 rounded-xl">
                      {item.bagsPerAcre} bags/acre
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-5 mt-5 border-t border-[#E2EBE2]">
            <div className="p-3 bg-[#E8F0E7] rounded-xl border border-[#D4E3D3] flex items-center justify-between text-xs text-[#245C3A] mb-3">
              <span className="font-bold">Estimated Cost Savings:</span>
              <span className="font-black text-sm">₹3,200 per acre</span>
            </div>

            <Link
              to="/fertilizer-calculator"
              className="w-full py-2.5 rounded-xl bg-[#245C3A] hover:bg-[#1B462C] text-white font-bold text-xs flex items-center justify-center gap-2 transition"
            >
              <span>Calculate Total Bags for {farmSize}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

      </div>

      {/* 5. Bottom Section: AI Assistant & Soil Reports History */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* AI Assistant Callout (5 cols) */}
        <div className="lg:col-span-5 bg-gradient-to-br from-[#245C3A] to-[#1B462C] text-white rounded-3xl p-6 sm:p-8 shadow-xs flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-emerald-100">
                <Bot className="w-6 h-6" />
              </div>
              <span className="text-[11px] font-bold bg-white/15 px-2.5 py-0.5 rounded-full text-emerald-200 uppercase tracking-wider">
                Voice & Text
              </span>
            </div>

            <div>
              <h3 className="text-lg font-black text-white">
                KrishiSaathi AI Agronomist
              </h3>
              <p className="text-xs text-emerald-100 mt-1 leading-relaxed">
                Ask questions anytime about top dressing timing, zinc spray formulas, or pest diagnosis in your preferred language.
              </p>
            </div>

            <div className="space-y-2">
              <button
                type="button"
                onClick={() => navigate('/ai-assistant')}
                className="w-full text-left p-2.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-xs text-emerald-100 transition cursor-pointer"
              >
                🌾 "When should I apply the first urea dose for wheat?"
              </button>
              <button
                type="button"
                onClick={() => navigate('/ai-assistant')}
                className="w-full text-left p-2.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-xs text-emerald-100 transition cursor-pointer"
              >
                ⚡ "Can I mix Zinc Sulphate and DAP together?"
              </button>
            </div>
          </div>

          <div className="pt-6">
            <Link
              to="/ai-assistant"
              className="w-full py-3 rounded-2xl bg-white text-[#245C3A] font-black text-xs flex items-center justify-center gap-2 hover:bg-emerald-50 transition active:scale-98 shadow-sm"
            >
              <Mic className="w-4 h-4 text-[#245C3A]" />
              <span>Open Voice Assistant</span>
            </Link>
          </div>
        </div>

        {/* Soil Reports History (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-8 border border-[#E2EBE2] shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-[#E2EBE2] mb-5">
              <div>
                <h3 className="font-black text-base text-[#26332B]">
                  Saved Soil Health Cards
                </h3>
                <p className="text-xs text-[#5C6E63]">
                  Switch active report to update recommendations across the dashboard
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsUploadModalOpen(true)}
                className="px-3 py-1.5 rounded-xl bg-[#E8F0E7] hover:bg-[#D4E3D3] text-[#245C3A] font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Report</span>
              </button>
            </div>

            <div className="space-y-3">
              {reports.map((report) => (
                <div 
                  key={report.id}
                  className={`p-4 rounded-2xl border transition-all flex items-center justify-between gap-4 ${
                    report.id === activeReport?.id
                      ? "bg-[#E8F0E7]/60 border-[#245C3A] shadow-xs"
                      : "bg-[#F8FAF7] border-[#E2EBE2] hover:border-[#245C3A]/40"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                      report.id === activeReport?.id ? "bg-[#245C3A] text-white" : "bg-white text-[#5C6E63] border border-[#E2EBE2]"
                    }`}>
                      <FileText className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-black text-xs text-[#26332B] truncate">{report.title}</p>
                        {report.id === activeReport?.id && (
                          <span className="text-[10px] font-bold bg-[#245C3A] text-white px-1.5 py-0.2 rounded">
                            Active
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-[#5C6E63] truncate">
                        Tested: {report.sampleDate} • Score: {report.healthScore}/100
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {report.id !== activeReport?.id && (
                      <button
                        type="button"
                        onClick={() => setActiveReportId(report.id)}
                        className="px-3 py-1.5 rounded-xl bg-white border border-[#E2EBE2] hover:bg-[#E8F0E7] text-[#26332B] text-xs font-bold transition cursor-pointer"
                      >
                        Select
                      </button>
                    )}
                    <Link
                      to="/soil-analysis"
                      onClick={() => setActiveReportId(report.id)}
                      className="p-2 rounded-xl bg-white border border-[#E2EBE2] hover:bg-[#E8F0E7] text-[#245C3A] transition"
                      title="View Report Analysis"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-[#E2EBE2] text-center">
            <span className="text-xs text-[#5C6E63]">
              All data encrypted and synchronized with your farmer ID.
            </span>
          </div>
        </div>

      </div>

    </div>
  );
}
