import React, { createContext, useContext, useState, useEffect } from 'react';
import { SAMPLE_SOIL_REPORTS } from '../data/sampleSoilReports';
import { api } from '../services/api';
import { useAuth } from './AuthContext';

const SoilContext = createContext();

export function SoilProvider({ children }) {
  const { user } = useAuth();

  const [reports, setReports] = useState(() => {
    const saved = localStorage.getItem('krishisaathi_reports');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return SAMPLE_SOIL_REPORTS;
      }
    }
    return SAMPLE_SOIL_REPORTS;
  });

  const [activeReportId, setActiveReportId] = useState(() => {
    return reports[0]?.id || SAMPLE_SOIL_REPORTS[0].id;
  });

  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Sync reports with backend when farmer logs in
  useEffect(() => {
    const token = localStorage.getItem('krishisaathi_token');
    if (token) {
      api.soilReports.getAll()
        .then(backendReports => {
          if (backendReports && backendReports.length > 0) {
            // Map backend reports to frontend format
            const formatted = backendReports.map(rep => ({
              id: rep.id,
              title: rep.report_name,
              location: `${user?.district || 'District'}, ${user?.state || 'State'}`,
              sampleDate: new Date(rep.upload_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
              healthScore: rep.extracted_soil_data?.healthScore || 75,
              overallStatus: rep.extracted_soil_data?.overallStatus || "Balanced - Nitrogen Attention Required",
              soilType: rep.extracted_soil_data?.soilType || "Alluvial Loam",
              file_url: rep.file_url,
              ph: rep.extracted_soil_data?.ph || { value: 7.2, rating: "Neutral", idealRange: "6.5 - 7.5", description: "उदासीन एवं अनुकूल", advisory: "Best range for cereals." },
              ec: rep.extracted_soil_data?.ec || { value: 0.38, unit: "dS/m", rating: "Normal" },
              organicCarbon: rep.extracted_soil_data?.organic_carbon || { value: 0.48, unit: "%", rating: "Low", advisory: "Add 4-5 tonnes FYM per acre." },
              nutrients: {
                nitrogen: rep.extracted_soil_data?.nitrogen || { symbol: "N", name: "Available Nitrogen", nameHindi: "उपलब्ध नाइट्रोजन", value: 185, unit: "kg/ha", rating: "Low", idealMin: 280, idealMax: 560, benchmark: 350, deficiencySymptom: "Pale yellowing on leaves.", remedy: "Apply Urea in 3 split doses." },
                phosphorus: rep.extracted_soil_data?.phosphorus || { symbol: "P", name: "Available Phosphorus", nameHindi: "उपलब्ध फास्फोरस", value: 18.4, unit: "kg/ha", rating: "Medium", idealMin: 14, idealMax: 28, benchmark: 22, remedy: "Apply 45-50 kg DAP." },
                potassium: rep.extracted_soil_data?.potassium || { symbol: "K", name: "Available Potassium", nameHindi: "उपलब्ध पोटाश", value: 295, unit: "kg/ha", rating: "High", idealMin: 135, idealMax: 280, benchmark: 240, remedy: "Reduce MOP to save cost." }
              },
              secondaryNutrients: {
                sulphur: rep.extracted_soil_data?.sulphur || { symbol: "S", value: 12.5, unit: "ppm", rating: "Medium", benchmark: 15 },
                zinc: rep.extracted_soil_data?.zinc || { symbol: "Zn", value: 0.45, unit: "ppm", rating: "Deficient", benchmark: 0.60, deficiencySymptom: "Bronze patches on young leaves.", remedy: "Apply 10 kg Zinc Sulphate." },
                iron: rep.extracted_soil_data?.iron || { symbol: "Fe", value: 5.4, unit: "ppm", rating: "Sufficient", benchmark: 4.5 },
                boron: rep.extracted_soil_data?.boron || { symbol: "B", value: 0.52, unit: "ppm", rating: "Medium", benchmark: 0.50 }
              },
              fertilizerPlan: rep.extracted_soil_data?.fertilizerPlan || SAMPLE_SOIL_REPORTS[0].fertilizerPlan,
              cropRecommendations: rep.extracted_soil_data?.cropRecommendations || SAMPLE_SOIL_REPORTS[0].cropRecommendations
            }));

            // Merge with sample reports so user always has rich data
            setReports([...formatted, ...SAMPLE_SOIL_REPORTS]);
            setActiveReportId(formatted[0].id);
          }
        })
        .catch(err => {
          console.log("Using cached/sample soil reports:", err.message);
        });
    }
  }, [user]);

  useEffect(() => {
    localStorage.setItem('krishisaathi_reports', JSON.stringify(reports));
  }, [reports]);

  const activeReport = reports.find(r => r.id === activeReportId) || reports[0] || SAMPLE_SOIL_REPORTS[0];

  const addReport = async (newReportData, file = null) => {
    setIsLoading(true);
    let createdBackendReport = null;

    try {
      const token = localStorage.getItem('krishisaathi_token');
      if (token) {
        if (newReportData.extracted_soil_data) {
          // Send verified extracted data to backend
          createdBackendReport = await api.soilReports.confirm({
            report_name: newReportData.title || (file ? file.name : "Soil Health Card"),
            file_url: newReportData.file_url || null,
            extracted_soil_data: newReportData.extracted_soil_data
          });
        } else if (file) {
          const formData = new FormData();
          formData.append('file', file);
          formData.append('report_name', newReportData.title || file.name);
          createdBackendReport = await api.soilReports.upload(formData);
        }
      }
    } catch (err) {
      console.warn("Backend report save/upload fallback:", err.message);
    }

    const id = createdBackendReport?.id || `SHC-NEW-${Date.now().toString().slice(-4)}`;
    const fullReport = {
      ...SAMPLE_SOIL_REPORTS[0],
      id,
      title: newReportData.title || `Uploaded Field Report (${new Date().toLocaleDateString('en-IN')})`,
      location: newReportData.location || `${user?.district || "Local"}, ${user?.state || "State"}`,
      sampleDate: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
      ...newReportData
    };

    setReports(prev => [fullReport, ...prev]);
    setActiveReportId(id);
    setIsLoading(false);
    return fullReport;
  };

  return (
    <SoilContext.Provider
      value={{
        reports,
        activeReportId,
        setActiveReportId,
        activeReport,
        addReport,
        isUploadModalOpen,
        setIsUploadModalOpen,
        isLoading
      }}
    >
      {children}
    </SoilContext.Provider>
  );
}

export function useSoil() {
  return useContext(SoilContext);
}
