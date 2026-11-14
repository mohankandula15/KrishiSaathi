import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Sprout, 
  Calendar, 
  Droplets, 
  TrendingUp, 
  ShieldCheck, 
  ArrowRight, 
  Filter, 
  Sparkles,
  Info,
  CheckCircle2,
  MapPin,
  AlertTriangle,
  Layers,
  ChevronRight
} from 'lucide-react';
import { useSoil } from '../context/SoilContext';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { api } from '../services/api';
import { getCardDisplayName, getTranslatedCropName, getTranslatedSeason } from '../i18n/dataLookups';

export default function CropRecommendationsPage() {
  const { t } = useTranslation();
  const { activeReport } = useSoil();
  const { user } = useAuth();
  const navigate = useNavigate();

  // Filters & Parameters
  const [selectedState, setSelectedState] = useState(user?.state || "Andhra Pradesh");
  const [selectedDistrict, setSelectedDistrict] = useState(user?.district || "Guntur");
  const [selectedSeason, setSelectedSeason] = useState("All");
  const [waterAvailability, setWaterAvailability] = useState("Medium");
  const [isLoading, setIsLoading] = useState(false);
  const [cropResult, setCropResult] = useState(null);

  // Andhra Pradesh Districts
  const AP_DISTRICTS = [
    "Guntur", "Anantapur", "Kurnool", "Krishna", "Prakasam", 
    "East Godavari", "West Godavari", "Chittoor", "YSR Kadapa", "Nellore", "Srikakulam", "Vizianagaram"
  ];

  const OTHER_STATES = [
    "Andhra Pradesh", "Telangana", "Punjab", "Haryana", "Maharashtra", 
    "Madhya Pradesh", "Karnataka", "Rajasthan", "Uttar Pradesh", "Tamil Nadu"
  ];

  // Fetch or calculate crops
  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    const payload = {
      soil_report_id: activeReport?.id?.startsWith('SHC-') ? null : activeReport?.id,
      state: selectedState,
      district: selectedDistrict,
      water_availability: waterAvailability,
      season: selectedSeason,
      soil_data: {
        ph: activeReport?.ph,
        nitrogen: activeReport?.nutrients?.nitrogen,
        phosphorus: activeReport?.nutrients?.phosphorus,
        potassium: activeReport?.nutrients?.potassium,
        organic_carbon: activeReport?.organicCarbon,
        soilType: activeReport?.soilType
      }
    };

    api.recommendations.calculateCrops(payload)
      .then(res => {
        if (isMounted && res) {
          setCropResult(res);
        }
      })
      .catch(err => {
        console.warn("Using local crop ranking fallback:", err.message);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => { isMounted = false; };
  }, [activeReport, selectedState, selectedDistrict, selectedSeason, waterAvailability]);

  const crops = cropResult?.recommended_crops || [];

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      
      {/* 1. Header Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E2EBE2] shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-[#E2EBE2]">
          
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#245C3A] bg-[#E8F0E7] px-3 py-1 rounded-full border border-[#D4E3D3]">
                {t('cropRec.agronomicIntelligence', 'Agronomic Intelligence')}
              </span>
              <span className="text-xs bg-[#F8FAF7] text-[#5C6E63] font-mono px-2.5 py-0.5 rounded-full border border-[#E2EBE2]">
                {t('common.card', 'Card')}: {getCardDisplayName(activeReport, t)}
              </span>
              <span className="text-xs bg-emerald-50 text-[#245C3A] font-medium px-2.5 py-0.5 rounded-full border border-emerald-200">
                {selectedState}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-[#26332B] tracking-tight">
              {t('cropRec.title', 'Intelligent Regional Crop Suitability Recommender')}
            </h1>

            <p className="text-xs text-[#5C6E63] max-w-2xl leading-relaxed">
              {t('cropRec.subtitle', 'Analyzes your soil reaction, available macronutrients, and texture to rank compatible crops.')}
            </p>
          </div>

          <div className="flex items-center gap-2 self-start lg:self-auto">
            <span className="text-xs font-bold text-[#245C3A] bg-[#E8F0E7] px-3.5 py-2 rounded-xl border border-[#D4E3D3] flex items-center gap-1.5">
              <Sprout className="w-4 h-4 text-[#245C3A]" />
              <span>{crops.length} {t('cropRec.filters.all', 'Suitable Crops Ranked')}</span>
            </span>
          </div>

        </div>

        {/* 2. Controls: State, District, Season, Water Availability */}
        <div className="pt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          
          {/* State Selector */}
          <div className="p-3.5 rounded-2xl bg-[#F8FAF7] border border-[#E2EBE2] space-y-1.5">
            <label className="font-bold uppercase tracking-wider text-[#5C6E63] block text-[10px]">
              {t('cropRec.stateRegion', 'State / Region')}
            </label>
            <select
              value={selectedState}
              onChange={(e) => {
                setSelectedState(e.target.value);
                if (e.target.value === "Andhra Pradesh") setSelectedDistrict("Guntur");
                else setSelectedDistrict("District Central");
              }}
              className="w-full py-1.5 px-2 bg-white rounded-xl border border-[#E2EBE2] font-bold text-[#26332B] focus:ring-2 focus:ring-[#245C3A] focus:outline-hidden cursor-pointer"
            >
              {OTHER_STATES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* District Selector */}
          <div className="p-3.5 rounded-2xl bg-[#F8FAF7] border border-[#E2EBE2] space-y-1.5">
            <label className="font-bold uppercase tracking-wider text-[#5C6E63] block text-[10px]">
              {t('cropRec.district', 'District')}
            </label>
            {selectedState === "Andhra Pradesh" ? (
              <select
                value={selectedDistrict}
                onChange={(e) => setSelectedDistrict(e.target.value)}
                className="w-full py-1.5 px-2 bg-white rounded-xl border border-[#E2EBE2] font-bold text-[#26332B] focus:ring-2 focus:ring-[#245C3A] focus:outline-hidden cursor-pointer"
              >
                {AP_DISTRICTS.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                value={selectedDistrict}
                onChange={(e) => setSelectedDistrict(e.target.value)}
                placeholder={t('cropRec.enterDistrict', 'Enter District')}
                className="w-full py-1.5 px-2 bg-white rounded-xl border border-[#E2EBE2] font-bold text-[#26332B] focus:ring-2 focus:ring-[#245C3A] focus:outline-hidden"
              />
            )}
          </div>

          {/* Season Selector */}
          <div className="p-3.5 rounded-2xl bg-[#F8FAF7] border border-[#E2EBE2] space-y-1.5">
            <label className="font-bold uppercase tracking-wider text-[#5C6E63] block text-[10px]">
              {t('cropRec.growingSeason', 'Growing Season')}
            </label>
            <select
              value={selectedSeason}
              onChange={(e) => setSelectedSeason(e.target.value)}
              className="w-full py-1.5 px-2 bg-white rounded-xl border border-[#E2EBE2] font-bold text-[#26332B] focus:ring-2 focus:ring-[#245C3A] focus:outline-hidden cursor-pointer"
            >
              <option value="All">{t('cropRec.filters.all', 'All Seasons')}</option>
              <option value="Kharif">{t('data.seasons.kharif', 'Kharif (Monsoon)')}</option>
              <option value="Rabi">{t('data.seasons.rabi', 'Rabi (Winter)')}</option>
              <option value="Summer">{t('data.seasons.zaid', 'Summer / Zaid')}</option>
            </select>
          </div>

          {/* Water Availability */}
          <div className="p-3.5 rounded-2xl bg-[#F8FAF7] border border-[#E2EBE2] space-y-1.5">
            <label className="font-bold uppercase tracking-wider text-[#5C6E63] block text-[10px]">
              {t('cropRec.irrigationWater', 'Irrigation / Water Availability')}
            </label>
            <select
              value={waterAvailability}
              onChange={(e) => setWaterAvailability(e.target.value)}
              className="w-full py-1.5 px-2 bg-white rounded-xl border border-[#E2EBE2] font-bold text-[#26332B] focus:ring-2 focus:ring-[#245C3A] focus:outline-hidden cursor-pointer"
            >
              <option value="High">{t('cropRec.waterHigh', 'High (Canal / Perennial Supply)')}</option>
              <option value="Medium">{t('cropRec.waterMedium', 'Medium (Tubewell / Borewell)')}</option>
              <option value="Low">{t('cropRec.waterLow', 'Low (Rainfed / Drought Prone)')}</option>
            </select>
          </div>

        </div>

        {/* 3. Statutory Agronomic Disclaimer Banner */}
        <div className="mt-6 p-4 rounded-2xl bg-[#F8FAF7] border border-[#E2EBE2] text-xs text-[#5C6E63] flex items-start gap-3">
          <Info className="w-4 h-4 text-[#245C3A] shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong>{t('cropRec.disclaimerNotice', 'Agronomic Advisory Notice:')}</strong> {t('cropRec.disclaimerBody', 'Crop suitability rankings are calculated using scientific soil parameters, regional climatic benchmarks, and water availability models. KrishiSaathi does not guarantee yields or incomes, as actual harvest outcomes depend upon micro-weather fluctuations, timely irrigation, pest management, and market prices.')}
          </p>
        </div>

      </div>

      {/* 4. Crop Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {crops.map((crop, idx) => (
          <div 
            key={crop.id || idx}
            className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E2EBE2] shadow-xs hover:border-[#245C3A]/50 transition flex flex-col justify-between space-y-6"
          >
            <div>
              {/* Header */}
              <div className="flex items-start justify-between gap-4 pb-4 border-b border-[#E2EBE2]">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#5C6E63] bg-[#F8FAF7] px-2.5 py-0.5 rounded-full border border-[#E2EBE2]">
                      {getTranslatedSeason(Array.isArray(crop.seasons) ? crop.seasons.join(" / ") : crop.season, t)}
                    </span>
                    <span className="text-[10px] font-bold bg-[#E8F0E7] text-[#245C3A] px-2.5 py-0.5 rounded-full">
                      {crop.badge || crop.category}
                    </span>
                  </div>

                  <h3 className="text-xl font-black text-[#26332B] pt-1">
                    {getTranslatedCropName(crop.name || crop.crop, t)}
                  </h3>
                </div>

                <div className="text-right shrink-0">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-2xl bg-[#E8F0E7] text-[#245C3A] font-black text-sm border border-[#D4E3D3]">
                    <Sparkles className="w-4 h-4 text-[#245C3A]" />
                    <span>{crop.suitability}% {t('cropRec.matchScore', 'Match')}</span>
                  </div>
                </div>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-2 gap-3 py-4 text-xs">
                <div className="p-3 rounded-xl bg-[#F8FAF7] border border-[#E2EBE2]">
                  <span className="text-[#5C6E63] block text-[11px]">{t('cropRec.expectedYield', 'Potential Agronomic Yield')}</span>
                  <strong className="text-[#26332B] text-xs block mt-0.5">{crop.potential_yield || crop.expectedYield}</strong>
                </div>

                <div className="p-3 rounded-xl bg-[#F8FAF7] border border-[#E2EBE2]">
                  <span className="text-[#5C6E63] block text-[11px]">{t('cropRec.economicReturns', 'Indicative Gross Return')}</span>
                  <strong className="text-[#245C3A] text-xs block mt-0.5">{crop.indicative_return || crop.indicativeReturn || "Based on MSP"}</strong>
                </div>
              </div>

              {/* Recommended High-Yielding Varieties */}
              {(crop.recommended_varieties || crop.recommendedVarieties) && (
                <div className="space-y-1.5 text-xs">
                  <span className="text-[#5C6E63] font-bold block uppercase tracking-wider text-[11px]">
                    {t('cropRec.recommendedCultivars', 'Recommended Regional Cultivars:')}
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {(crop.recommended_varieties || crop.recommendedVarieties).map((v, i) => (
                      <span key={i} className="px-2.5 py-1 rounded-xl bg-[#F8FAF7] border border-[#E2EBE2] text-[#26332B] font-medium text-xs">
                        🌱 {v}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Soil Suitability Rationale */}
              <div className="mt-4 p-3.5 rounded-2xl bg-[#F8FAF7] border border-[#E2EBE2] text-xs space-y-1.5">
                <p className="text-[#26332B] leading-relaxed">
                  <strong>{t('cropRec.soilFitReason', 'Agronomic Suitability')}:</strong> {crop.soil_compatibility || "Well suited for active soil characteristics."}
                </p>
                <p className="text-[#5C6E63] pt-1">
                  <strong>{t('cropRec.waterNeed', 'Water Schedule')}:</strong> {crop.water_requirement || crop.waterRequirement}
                </p>
              </div>

              {/* Important Precautions */}
              {crop.precautions && crop.precautions.length > 0 && (
                <div className="mt-3 p-3 rounded-2xl bg-amber-50/70 border border-amber-200/80 text-xs text-amber-900 space-y-1">
                  <strong className="flex items-center gap-1 font-bold text-[11px]">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-700" />
                    <span>{t('cropRec.farmingPrecautions', 'Key Farming Precautions:')}</span>
                  </strong>
                  <ul className="list-disc list-inside space-y-0.5 text-[11px] text-[#5C6E63]">
                    {crop.precautions.slice(0, 2).map((p, i) => (
                      <li key={i}>{p}</li>
                    ))}
                  </ul>
                </div>
              )}

            </div>

            {/* Bottom Actions */}
            <div className="pt-4 border-t border-[#E2EBE2] flex items-center justify-between gap-3">
              <span className="text-xs text-[#5C6E63] truncate">
                {t('cropRec.season', 'Season')}: {crop.sowing_window || "Seasonal Window"}
              </span>

              <Link
                to="/fertilizer-calculator"
                className="px-4 py-2.5 rounded-xl bg-[#245C3A] hover:bg-[#1B462C] text-white font-bold text-xs flex items-center gap-1.5 transition shrink-0 shadow-2xs"
              >
                <span>{t('cropRec.actionPlan', 'Calculate Fertilizer Plan')}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* 5. Bottom AI Assistance Callout */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E2EBE2] shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h3 className="font-black text-base text-[#26332B]">
            {t('cropRec.needSowingAdvice', 'Need sowing advice for your specific village or field?')}
          </h3>
          <p className="text-xs text-[#5C6E63]">
            {t('cropRec.askVoiceAssistant', 'Ask our AI Voice Assistant for seed treatment formulas, sowing depth, and pest scouting advice.')}
          </p>
        </div>

        <Link
          to="/ai-assistant"
          className="px-6 py-3 rounded-2xl bg-[#E8F0E7] hover:bg-[#D4E3D3] text-[#245C3A] font-bold text-xs flex items-center gap-2 transition shrink-0"
        >
          <Sprout className="w-4 h-4 text-[#245C3A]" />
          <span>{t('dashboard.actions.askAi', 'Ask AI Agronomist')}</span>
        </Link>
      </div>

    </div>
  );
}
