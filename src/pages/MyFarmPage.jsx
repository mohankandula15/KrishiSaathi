import React from 'react';
import { Link } from 'react-router-dom';
import { 
  MapPin, 
  Sprout, 
  Calendar, 
  CloudSun, 
  Droplets, 
  ShieldCheck, 
  FileText, 
  UploadCloud, 
  ChevronRight,
  User,
  Plus
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSoil } from '../context/SoilContext';

export default function MyFarmPage() {
  const { user } = useAuth();
  const { reports, activeReport, setActiveReportId, setIsUploadModalOpen } = useSoil();

  const farmerName = user?.name || "Ramesh Kumar";
  const mobile = user?.mobile_number || "9876543210";
  const farmLocation = `${user?.village || "Kila Raipur"}, ${user?.district || "Ludhiana"}, ${user?.state || "Punjab"}`;
  const farmSize = user?.landSize || "3.5 Acres";
  const primaryCrop = user?.primaryCrop || "Wheat & Paddy";

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      
      {/* Header Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E2EBE2] shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-[#E2EBE2]">
          
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#245C3A] bg-[#E8F0E7] px-3 py-1 rounded-full border border-[#D4E3D3]">
                Farm Management
              </span>
              <span className="text-xs bg-[#F8FAF7] text-[#5C6E63] font-mono px-2.5 py-0.5 rounded-full border border-[#E2EBE2]">
                Farmer ID: {user?.id || "DEMO-001"}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-[#26332B] tracking-tight">
              {farmerName}'s Farm Profile
            </h1>

            <p className="text-xs text-[#5C6E63] flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-[#245C3A]" />
              <span>{farmLocation} • Total Landholding: <strong>{farmSize}</strong></span>
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsUploadModalOpen(true)}
              className="px-5 py-2.5 rounded-xl bg-[#245C3A] hover:bg-[#1B462C] text-white font-bold text-xs flex items-center gap-2 transition shadow-xs cursor-pointer"
            >
              <UploadCloud className="w-4 h-4 text-emerald-100" />
              <span>Upload Soil Report</span>
            </button>

            <Link
              to="/settings"
              className="px-4 py-2.5 rounded-xl bg-[#F8FAF7] hover:bg-[#E8F0E7] border border-[#E2EBE2] text-[#245C3A] font-bold text-xs transition"
            >
              Edit Details
            </Link>
          </div>

        </div>

        {/* Key Metrics Strip */}
        <div className="pt-6 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div className="p-4 rounded-2xl bg-[#F8FAF7] border border-[#E2EBE2]">
            <span className="text-[#5C6E63] block text-[11px]">Cultivated Area</span>
            <p className="text-xl font-black text-[#26332B] mt-0.5">{farmSize}</p>
            <p className="text-[10px] text-[#5C6E63] mt-0.5">2 Active Field Parcels</p>
          </div>

          <div className="p-4 rounded-2xl bg-[#F8FAF7] border border-[#E2EBE2]">
            <span className="text-[#5C6E63] block text-[11px]">Soil Type</span>
            <p className="text-xl font-black text-[#245C3A] mt-0.5">{activeReport?.soilType || "Alluvial Loam"}</p>
            <p className="text-[10px] text-[#5C6E63] mt-0.5">High Water Retention</p>
          </div>

          <div className="p-4 rounded-2xl bg-[#F8FAF7] border border-[#E2EBE2]">
            <span className="text-[#5C6E63] block text-[11px]">Primary Crops</span>
            <p className="text-xl font-black text-[#26332B] mt-0.5">{primaryCrop}</p>
            <p className="text-[10px] text-[#5C6E63] mt-0.5">Rabi / Kharif Cycle</p>
          </div>

          <div className="p-4 rounded-2xl bg-[#F8FAF7] border border-[#E2EBE2]">
            <span className="text-[#5C6E63] block text-[11px]">Irrigation Source</span>
            <p className="text-xl font-black text-[#245C3A] mt-0.5">Tubewell & Canal</p>
            <p className="text-[10px] text-[#5C6E63] mt-0.5">Submersible Pump</p>
          </div>
        </div>

      </div>

      {/* Field Parcels List */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E2EBE2] shadow-xs space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-[#E2EBE2]">
          <div>
            <h2 className="text-lg font-black text-[#26332B] flex items-center gap-2">
              <Sprout className="w-5 h-5 text-[#245C3A]" />
              <span>Field Parcels & Land Tracts</span>
            </h2>
            <p className="text-xs text-[#5C6E63]">
              Individual plots registered under your farmer survey credentials
            </p>
          </div>
          <span className="text-xs font-bold text-[#245C3A] bg-[#E8F0E7] px-3 py-1 rounded-full">
            2 Plots
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Parcel 1 */}
          <div className="p-6 rounded-2xl bg-[#F8FAF7] border border-[#245C3A]/50 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-[#245C3A] bg-[#E8F0E7] px-2.5 py-0.5 rounded-full">
                Parcel #1 • Active Analysis
              </span>
              <span className="text-xs font-mono text-[#5C6E63]">Khasra 142/8</span>
            </div>

            <div>
              <h3 className="text-base font-black text-[#26332B]">North Field (3.5 Acres)</h3>
              <p className="text-xs text-[#5C6E63] mt-0.5">Location: Ludhiana PAU Perimeter</p>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-[#E2EBE2]">
              <div>
                <span className="text-[#5C6E63] text-[11px] block">Current Crop</span>
                <strong className="text-[#26332B]">Wheat (HD 3086)</strong>
              </div>
              <div>
                <span className="text-[#5C6E63] text-[11px] block">Health Score</span>
                <strong className="text-[#245C3A]">74 / 100 (Moderate)</strong>
              </div>
            </div>

            <Link
              to="/soil-analysis"
              className="w-full py-2.5 rounded-xl bg-white border border-[#E2EBE2] hover:bg-[#E8F0E7] text-[#245C3A] text-xs font-bold flex items-center justify-center gap-1.5 transition"
            >
              <span>View Active Report</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Parcel 2 */}
          <div className="p-6 rounded-2xl bg-[#F8FAF7] border border-[#E2EBE2] space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-[#5C6E63] bg-white px-2.5 py-0.5 rounded-full border border-[#E2EBE2]">
                Parcel #2 • Secondary
              </span>
              <span className="text-xs font-mono text-[#5C6E63]">Khasra 143/2</span>
            </div>

            <div>
              <h3 className="text-base font-black text-[#26332B]">South Field (2.0 Acres)</h3>
              <p className="text-xs text-[#5C6E63] mt-0.5">Location: Kila Raipur Canal Bank</p>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-[#E2EBE2]">
              <div>
                <span className="text-[#5C6E63] text-[11px] block">Current Crop</span>
                <strong className="text-[#26332B]">Mustard (Pusa Bold)</strong>
              </div>
              <div>
                <span className="text-[#5C6E63] text-[11px] block">Health Score</span>
                <strong className="text-[#245C3A]">68 / 100 (Fertile)</strong>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsUploadModalOpen(true)}
              className="w-full py-2.5 rounded-xl bg-white border border-[#E2EBE2] hover:bg-[#E8F0E7] text-[#245C3A] text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
            >
              <span>Upload Soil Report for Parcel #2</span>
              <UploadCloud className="w-3.5 h-3.5" />
            </button>
          </div>

        </div>
      </div>

      {/* Soil Health Cards Repository */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E2EBE2] shadow-xs space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-[#E2EBE2]">
          <div>
            <h2 className="text-lg font-black text-[#26332B] flex items-center gap-2">
              <FileText className="w-5 h-5 text-[#245C3A]" />
              <span>Registered Soil Health Cards Repository</span>
            </h2>
            <p className="text-xs text-[#5C6E63]">
              Official Soil Health Cards tested by authorized state soil laboratories
            </p>
          </div>
          <span className="text-xs font-bold text-[#245C3A] bg-[#E8F0E7] px-3 py-1 rounded-full">
            {reports.length} Cards
          </span>
        </div>

        <div className="space-y-3">
          {reports.map((report) => (
            <div 
              key={report.id}
              className="p-4 rounded-2xl bg-[#F8FAF7] border border-[#E2EBE2] flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-black text-sm text-[#26332B] truncate">{report.title}</span>
                  <span className="font-mono text-xs text-[#5C6E63]">({report.id})</span>
                  {report.id === activeReport.id && (
                    <span className="text-[10px] font-bold bg-[#245C3A] text-white px-2 py-0.5 rounded-full">
                      Active
                    </span>
                  )}
                </div>
                <p className="text-xs text-[#5C6E63]">
                  Tested on {report.sampleDate} • Laboratory: {report.labName} • Soil Health Score: <strong>{report.healthScore}/100</strong>
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {report.id !== activeReport.id && (
                  <button
                    type="button"
                    onClick={() => setActiveReportId(report.id)}
                    className="px-3.5 py-1.5 rounded-xl bg-white border border-[#E2EBE2] hover:bg-[#E8F0E7] text-[#245C3A] font-bold text-xs transition cursor-pointer"
                  >
                    Select Active
                  </button>
                )}
                <Link
                  to="/soil-analysis"
                  onClick={() => setActiveReportId(report.id)}
                  className="px-4 py-1.5 rounded-xl bg-[#245C3A] hover:bg-[#1B462C] text-white font-bold text-xs transition"
                >
                  View Diagnosis
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
