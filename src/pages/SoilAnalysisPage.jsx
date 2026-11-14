import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Sprout, 
  UploadCloud, 
  AlertCircle, 
  CheckCircle2, 
  Calculator, 
  Bot, 
  Printer, 
  ChevronRight,
  ArrowRight,
  ShieldCheck,
  FileText,
  Activity,
  Layers,
  Sparkles,
  Info
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend 
} from 'recharts';
import { useSoil } from '../context/SoilContext';
import WhatsAppShareReport from '../components/WhatsAppShareReport';

export default function SoilAnalysisPage() {
  const { reports, activeReport, setActiveReportId, setIsUploadModalOpen } = useSoil();

  // NPK comparison chart data
  const npkChartData = [
    {
      name: "Nitrogen (N)",
      Current: activeReport?.nutrients?.nitrogen?.value || 185,
      Benchmark: activeReport?.nutrients?.nitrogen?.benchmark || 350,
      unit: "kg/ha",
      status: activeReport?.nutrients?.nitrogen?.rating || "Low"
    },
    {
      name: "Phosphorus (P)",
      Current: activeReport?.nutrients?.phosphorus?.value || 18.4,
      Benchmark: activeReport?.nutrients?.phosphorus?.benchmark || 22,
      unit: "kg/ha",
      status: activeReport?.nutrients?.phosphorus?.rating || "Medium"
    },
    {
      name: "Potassium (K)",
      Current: activeReport?.nutrients?.potassium?.value || 295,
      Benchmark: activeReport?.nutrients?.potassium?.benchmark || 240,
      unit: "kg/ha",
      status: activeReport?.nutrients?.potassium?.rating || "High"
    }
  ];

  // Helper for pH position indicator (0 to 14 scale)
  const phValue = activeReport?.ph?.value || 7.2;
  const phPercentage = Math.min(Math.max(((phValue - 0) / 14) * 100, 0), 100);

  // Helper for Organic Carbon indicator (0 to 1.5% scale)
  const ocValue = activeReport?.organicCarbon?.value || 0.48;
  const ocPercentage = Math.min(Math.max((ocValue / 1.0) * 100, 5), 100);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      
      {/* Top Header Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E2EBE2] shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-[#E2EBE2]">
          
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#245C3A] bg-[#E8F0E7] px-3 py-1 rounded-full border border-[#D4E3D3]">
                Soil Health Diagnosis
              </span>
              <span className="text-xs bg-[#F8FAF7] text-[#5C6E63] font-mono px-2.5 py-0.5 rounded-full border border-[#E2EBE2]">
                Card ID: {activeReport?.id}
              </span>
              <span className="text-xs bg-emerald-50 text-[#245C3A] font-bold px-2.5 py-0.5 rounded-full border border-emerald-200">
                Score: {activeReport?.healthScore || 74}/100
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-[#26332B] tracking-tight">
              {activeReport?.title}
            </h1>

            <p className="text-xs text-[#5C6E63]">
              Location: <strong>{activeReport?.location}</strong> • Tested: <strong>{activeReport?.sampleDate}</strong> • Laboratory: <strong>{activeReport?.labName}</strong>
            </p>
          </div>

          {/* Quick Actions & Report Switcher */}
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={activeReport?.id}
              onChange={(e) => setActiveReportId(e.target.value)}
              className="py-2.5 px-3.5 rounded-xl border border-[#E2EBE2] bg-[#F8FAF7] text-[#26332B] font-bold text-xs focus:ring-2 focus:ring-[#245C3A] focus:outline-hidden cursor-pointer"
            >
              {reports.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.title} ({r.id})
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-2.5 rounded-xl border border-[#E2EBE2] bg-white hover:bg-[#F2F7F1] text-[#26332B] font-bold text-xs flex items-center gap-2 transition cursor-pointer"
            >
              <Printer className="w-4 h-4 text-[#5C6E63]" />
              <span>Print Report</span>
            </button>

            <button
              type="button"
              onClick={() => setIsUploadModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-[#245C3A] hover:bg-[#1B462C] text-white font-bold text-xs flex items-center gap-2 transition shadow-xs cursor-pointer"
            >
              <UploadCloud className="w-4 h-4 text-emerald-100" />
              <span>Upload New Card</span>
            </button>
          </div>

        </div>

        {/* Diagnosis Status Bar */}
        <div className="pt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#E8F0E7] text-[#245C3A] flex items-center justify-center font-bold shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-[#5C6E63] uppercase tracking-wider">Overall Diagnostic Assessment</p>
              <p className="text-sm font-black text-[#245C3A]">{activeReport?.overallStatus || "Moderate Soil Fertility"}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/crop-recommendations"
              className="px-3.5 py-2 rounded-xl bg-[#F8FAF7] hover:bg-[#E8F0E7] text-[#245C3A] text-xs font-bold transition flex items-center gap-1.5"
            >
              <Sprout className="w-4 h-4" />
              <span>View Recommended Crops</span>
            </Link>

            <Link
              to="/fertilizer-calculator"
              className="px-3.5 py-2 rounded-xl bg-[#E8F0E7] hover:bg-[#D4E3D3] text-[#245C3A] text-xs font-bold transition flex items-center gap-1.5"
            >
              <Calculator className="w-4 h-4" />
              <span>Fertilizer Calculator</span>
            </Link>
          </div>
        </div>
      </div>

      {/* FPO WhatsApp Report Sharing & Voice Advisory */}
      <WhatsAppShareReport report={activeReport} />

      {/* SECTION 1: Primary Macronutrients (NPK) with Chart & Detailed Metric Cards */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E2EBE2] shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-[#E2EBE2]">
          <div>
            <h2 className="text-lg font-black text-[#26332B] flex items-center gap-2">
              <Activity className="w-5 h-5 text-[#245C3A]" />
              <span>Primary Macronutrients (N - P - K)</span>
            </h2>
            <p className="text-xs text-[#5C6E63]">
              Available nutrient concentrations in kg/hectare compared against ICAR soil fertility standards
            </p>
          </div>
          <span className="text-xs font-bold text-[#245C3A] bg-[#E8F0E7] px-3 py-1 rounded-full self-start sm:self-auto">
            Lab Calibrated
          </span>
        </div>

        {/* Recharts Bar Chart */}
        <div className="p-4 sm:p-6 rounded-2xl bg-[#F8FAF7] border border-[#E2EBE2]">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-[#5C6E63]">
              Nutrient Level Comparison (Current vs ICAR Benchmark)
            </span>
            <div className="flex items-center gap-4 text-xs">
              <span className="flex items-center gap-1.5 text-[#26332B] font-bold">
                <span className="w-3 h-3 rounded-sm bg-[#245C3A]"></span>
                Current Soil Level
              </span>
              <span className="flex items-center gap-1.5 text-[#5C6E63] font-medium">
                <span className="w-3 h-3 rounded-sm bg-[#D4E3D3]"></span>
                ICAR Benchmark
              </span>
            </div>
          </div>

          <div className="h-64 sm:h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={npkChartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2EBE2" />
                <XAxis dataKey="name" stroke="#5C6E63" fontSize={12} tickLine={false} />
                <YAxis stroke="#5C6E63" fontSize={12} tickLine={false} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#FFFFFF', 
                    borderRadius: '16px', 
                    border: '1px solid #E2EBE2',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                    fontSize: '12px',
                    color: '#26332B'
                  }}
                  formatter={(val, name) => [`${val} kg/ha`, name === 'Current' ? 'Soil Value' : 'Standard Benchmark']}
                />
                <Bar dataKey="Current" fill="#245C3A" radius={[8, 8, 0, 0]} maxBarSize={45} />
                <Bar dataKey="Benchmark" fill="#D4E3D3" radius={[8, 8, 0, 0]} maxBarSize={45} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Detailed NPK Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
          
          {/* Nitrogen */}
          <div className="p-5 rounded-2xl bg-[#F8FAF7] border border-[#E2EBE2] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-[#5C6E63]">
                Nitrogen (N)
              </span>
              <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-900 border border-amber-200">
                {activeReport?.nutrients?.nitrogen?.rating || "Low"}
              </span>
            </div>

            <div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-3xl font-black text-[#26332B]">
                  {activeReport?.nutrients?.nitrogen?.value}
                </span>
                <span className="text-xs font-bold text-[#5C6E63]">kg/ha</span>
              </div>
              <p className="text-[11px] text-[#5C6E63] mt-0.5">
                Ideal Range: 280 - 560 kg/ha • Deficit: ~165 kg/ha
              </p>
            </div>

            <div className="pt-2 border-t border-[#E2EBE2] space-y-1.5 text-xs">
              <p className="text-[#5C6E63]">
                <strong className="text-[#26332B]">Crop Symptom:</strong> Reduced tillering, pale yellowing of older lower leaves.
              </p>
              <p className="text-[#245C3A] font-semibold">
                <strong>Agronomic Protocol:</strong> Apply Neem-coated Urea in 3 split doses (sowing, CRI stage, tillering).
              </p>
            </div>
          </div>

          {/* Phosphorus */}
          <div className="p-5 rounded-2xl bg-[#F8FAF7] border border-[#E2EBE2] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-[#5C6E63]">
                Phosphorus (P)
              </span>
              <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-emerald-50 text-[#245C3A] border border-emerald-200">
                {activeReport?.nutrients?.phosphorus?.rating || "Medium"}
              </span>
            </div>

            <div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-3xl font-black text-[#26332B]">
                  {activeReport?.nutrients?.phosphorus?.value}
                </span>
                <span className="text-xs font-bold text-[#5C6E63]">kg/ha</span>
              </div>
              <p className="text-[11px] text-[#5C6E63] mt-0.5">
                Ideal Range: 14 - 28 kg/ha • Status: Normal
              </p>
            </div>

            <div className="pt-2 border-t border-[#E2EBE2] space-y-1.5 text-xs">
              <p className="text-[#5C6E63]">
                <strong className="text-[#26332B]">Crop Role:</strong> Stimulates vigorous root elongation and early grain filling.
              </p>
              <p className="text-[#245C3A] font-semibold">
                <strong>Agronomic Protocol:</strong> Apply 45-50 kg DAP per acre through seed drill at sowing time.
              </p>
            </div>
          </div>

          {/* Potassium */}
          <div className="p-5 rounded-2xl bg-[#F8FAF7] border border-[#E2EBE2] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-[#5C6E63]">
                Potassium (K)
              </span>
              <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-sky-50 text-sky-900 border border-sky-200">
                {activeReport?.nutrients?.potassium?.rating || "High"}
              </span>
            </div>

            <div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-3xl font-black text-[#26332B]">
                  {activeReport?.nutrients?.potassium?.value}
                </span>
                <span className="text-xs font-bold text-[#5C6E63]">kg/ha</span>
              </div>
              <p className="text-[11px] text-[#5C6E63] mt-0.5">
                Ideal Range: 135 - 280 kg/ha • Status: Abundant
              </p>
            </div>

            <div className="pt-2 border-t border-[#E2EBE2] space-y-1.5 text-xs">
              <p className="text-[#5C6E63]">
                <strong className="text-[#26332B]">Crop Role:</strong> Provides stalk strength, drought resistance, and grain weight.
              </p>
              <p className="text-[#245C3A] font-semibold">
                <strong>Agronomic Protocol:</strong> Reduce MOP by 50% to save ₹1,200/acre without sacrificing yield.
              </p>
            </div>
          </div>

        </div>
      </div>

      {/* SECTION 2: Physical & Chemical Parameters (pH, OC, EC) */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E2EBE2] shadow-xs space-y-6">
        <div className="pb-4 border-b border-[#E2EBE2]">
          <h2 className="text-lg font-black text-[#26332B] flex items-center gap-2">
            <Layers className="w-5 h-5 text-[#245C3A]" />
            <span>Soil Chemical & Physical Parameters</span>
          </h2>
          <p className="text-xs text-[#5C6E63]">
            Key indicators that govern soil nutrient availability, root growth, and microbial fertility
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Soil pH Card with Visual Scale */}
          <div className="p-6 rounded-2xl bg-[#F8FAF7] border border-[#E2EBE2] space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-[#5C6E63]">Soil pH Scale</span>
              <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-emerald-50 text-[#245C3A] border border-emerald-200">
                {activeReport?.ph?.rating || "Neutral"}
              </span>
            </div>

            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-[#26332B]">{phValue}</span>
                <span className="text-xs text-[#5C6E63] font-medium">Optimal: 6.5 - 7.5</span>
              </div>
            </div>

            {/* 0 to 14 pH visual spectrum */}
            <div className="space-y-1.5">
              <div className="relative w-full h-3 rounded-full bg-gradient-to-r from-red-500 via-emerald-500 to-purple-600">
                <div 
                  className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white border-2 border-[#26332B] rounded-full shadow-md transition-all"
                  style={{ left: `calc(${phPercentage}% - 8px)` }}
                  title={`pH ${phValue}`}
                />
              </div>
              <div className="flex justify-between text-[10px] text-[#5C6E63] font-bold">
                <span>0 (Acidic)</span>
                <span>7.0 (Neutral)</span>
                <span>14 (Alkaline)</span>
              </div>
            </div>

            <p className="text-xs text-[#5C6E63] leading-relaxed pt-2 border-t border-[#E2EBE2]">
              {activeReport?.ph?.advisory || "Soil pH is in the best range for cereal and pulse crops. No liming or gypsum required."}
            </p>
          </div>

          {/* Organic Carbon Card */}
          <div className="p-6 rounded-2xl bg-[#F8FAF7] border border-[#E2EBE2] space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-[#5C6E63]">Organic Carbon (OC)</span>
              <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-900 border border-amber-200">
                {activeReport?.organicCarbon?.rating || "Low"}
              </span>
            </div>

            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-[#26332B]">{ocValue}%</span>
                <span className="text-xs text-[#5C6E63] font-medium">Ideal: 0.50% - 0.75%</span>
              </div>
            </div>

            {/* OC Progress Bar */}
            <div className="space-y-1.5">
              <div className="w-full h-3 rounded-full bg-[#E2EBE2] overflow-hidden">
                <div 
                  className="h-full bg-[#245C3A] rounded-full transition-all duration-500"
                  style={{ width: `${ocPercentage}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-[#5C6E63] font-bold">
                <span>0% (Poor)</span>
                <span>0.5% (Benchmark)</span>
                <span>1.0%+ (Rich)</span>
              </div>
            </div>

            <p className="text-xs text-[#5C6E63] leading-relaxed pt-2 border-t border-[#E2EBE2]">
              {activeReport?.organicCarbon?.advisory || "Add 4 to 5 tonnes of well-decomposed Farm Yard Manure (FYM) or vermicompost per acre before next sowing."}
            </p>
          </div>

          {/* Electrical Conductivity (EC) Card */}
          <div className="p-6 rounded-2xl bg-[#F8FAF7] border border-[#E2EBE2] space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-[#5C6E63]">Electrical Conductivity</span>
              <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-emerald-50 text-[#245C3A] border border-emerald-200">
                {activeReport?.ec?.rating || "Normal"}
              </span>
            </div>

            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-[#26332B]">{activeReport?.ec?.value || 0.38}</span>
                <span className="text-xs text-[#5C6E63] font-medium">dS/m (Ideal: &lt; 1.0)</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="w-full h-3 rounded-full bg-[#E2EBE2] overflow-hidden">
                <div 
                  className="h-full bg-emerald-600 rounded-full"
                  style={{ width: '38%' }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-[#5C6E63] font-bold">
                <span>0 (Non-saline)</span>
                <span>1.0 dS/m (Safe Limit)</span>
                <span>4.0+ (Saline)</span>
              </div>
            </div>

            <p className="text-xs text-[#5C6E63] leading-relaxed pt-2 border-t border-[#E2EBE2]">
              Soil salinity is well within the safe range. No salt stress on germinating seeds or vegetative roots.
            </p>
          </div>

        </div>
      </div>

      {/* SECTION 3: Micronutrients & Trace Minerals */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E2EBE2] shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-[#E2EBE2]">
          <div>
            <h2 className="text-lg font-black text-[#26332B] flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#245C3A]" />
              <span>Secondary Nutrients & Micronutrients</span>
            </h2>
            <p className="text-xs text-[#5C6E63]">
              Trace minerals critical for chlorophyll synthesis, disease resistance, and enzyme activation
            </p>
          </div>
          <span className="text-xs font-bold text-[#245C3A] bg-[#E8F0E7] px-3 py-1 rounded-full self-start sm:self-auto">
            Parts Per Million (ppm)
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          
          {/* Zinc (Deficient Alert) */}
          <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-[#5C6E63]">Zinc (Zn)</span>
              <span className="text-[10px] font-black bg-amber-200 text-amber-900 px-1.5 py-0.5 rounded">
                Deficient
              </span>
            </div>
            <p className="text-xl font-black text-amber-950">0.45 <span className="text-[11px] font-normal text-[#5C6E63]">ppm</span></p>
            <p className="text-[10px] text-amber-800 font-medium">Critical: &lt; 0.60 ppm</p>
          </div>

          {/* Sulphur */}
          <div className="p-4 rounded-2xl bg-[#F8FAF7] border border-[#E2EBE2] space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-[#5C6E63]">Sulphur (S)</span>
              <span className="text-[10px] font-black bg-[#E8F0E7] text-[#245C3A] px-1.5 py-0.5 rounded">
                Medium
              </span>
            </div>
            <p className="text-xl font-black text-[#26332B]">12.5 <span className="text-[11px] font-normal text-[#5C6E63]">ppm</span></p>
            <p className="text-[10px] text-[#5C6E63]">Adequate for oilseeds</p>
          </div>

          {/* Iron */}
          <div className="p-4 rounded-2xl bg-[#F8FAF7] border border-[#E2EBE2] space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-[#5C6E63]">Iron (Fe)</span>
              <span className="text-[10px] font-black bg-[#E8F0E7] text-[#245C3A] px-1.5 py-0.5 rounded">
                Sufficient
              </span>
            </div>
            <p className="text-xl font-black text-[#26332B]">5.4 <span className="text-[11px] font-normal text-[#5C6E63]">ppm</span></p>
            <p className="text-[10px] text-[#5C6E63]">Benchmark: &gt; 4.5 ppm</p>
          </div>

          {/* Copper */}
          <div className="p-4 rounded-2xl bg-[#F8FAF7] border border-[#E2EBE2] space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-[#5C6E63]">Copper (Cu)</span>
              <span className="text-[10px] font-black bg-[#E8F0E7] text-[#245C3A] px-1.5 py-0.5 rounded">
                Sufficient
              </span>
            </div>
            <p className="text-xl font-black text-[#26332B]">0.78 <span className="text-[11px] font-normal text-[#5C6E63]">ppm</span></p>
            <p className="text-[10px] text-[#5C6E63]">Benchmark: &gt; 0.20 ppm</p>
          </div>

          {/* Manganese */}
          <div className="p-4 rounded-2xl bg-[#F8FAF7] border border-[#E2EBE2] space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-[#5C6E63]">Manganese</span>
              <span className="text-[10px] font-black bg-[#E8F0E7] text-[#245C3A] px-1.5 py-0.5 rounded">
                Sufficient
              </span>
            </div>
            <p className="text-xl font-black text-[#26332B]">3.8 <span className="text-[11px] font-normal text-[#5C6E63]">ppm</span></p>
            <p className="text-[10px] text-[#5C6E63]">Benchmark: &gt; 2.0 ppm</p>
          </div>

          {/* Boron */}
          <div className="p-4 rounded-2xl bg-[#F8FAF7] border border-[#E2EBE2] space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-[#5C6E63]">Boron (B)</span>
              <span className="text-[10px] font-black bg-[#E8F0E7] text-[#245C3A] px-1.5 py-0.5 rounded">
                Medium
              </span>
            </div>
            <p className="text-xl font-black text-[#26332B]">0.52 <span className="text-[11px] font-normal text-[#5C6E63]">ppm</span></p>
            <p className="text-[10px] text-[#5C6E63]">Benchmark: &gt; 0.50 ppm</p>
          </div>

        </div>

        {/* Micronutrient Advisory Banner */}
        <div className="p-4 rounded-2xl bg-[#E8F0E7] border border-[#D4E3D3] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-[#245C3A]">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>
              <strong>Zinc Correction Notice:</strong> Apply 10 kg Zinc Sulphate (21%) per acre during final plowing. Do not mix Zinc directly with DAP.
            </span>
          </div>

          <Link
            to="/fertilizer-calculator"
            className="px-4 py-2 rounded-xl bg-[#245C3A] text-white font-bold text-xs hover:bg-[#1B462C] transition shrink-0 text-center"
          >
            Calculate Micro Dosage
          </Link>
        </div>
      </div>

      {/* SECTION 4: Next Steps & Quick Navigation Footer */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E2EBE2] shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h3 className="font-black text-base text-[#26332B]">
            Ready to apply recommendations?
          </h3>
          <p className="text-xs text-[#5C6E63]">
            Proceed to the interactive Fertilizer Calculator or explore recommended crop varieties.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Link
            to="/crop-recommendations"
            className="flex-1 sm:flex-none px-5 py-3 rounded-xl bg-[#F8FAF7] hover:bg-[#E8F0E7] text-[#245C3A] border border-[#E2EBE2] font-bold text-xs text-center transition"
          >
            Recommended Crops
          </Link>
          <Link
            to="/fertilizer-calculator"
            className="flex-1 sm:flex-none px-6 py-3 rounded-xl bg-[#245C3A] hover:bg-[#1B462C] text-white font-bold text-xs flex items-center justify-center gap-2 transition"
          >
            <span>Fertilizer Calculator</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

    </div>
  );
}
