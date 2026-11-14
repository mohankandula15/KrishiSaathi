import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  X, 
  UploadCloud, 
  CheckCircle2, 
  Sparkles, 
  Camera, 
  ArrowRight,
  Layers,
  AlertCircle,
  Edit3,
  ShieldCheck,
  Check,
  RotateCcw,
  FileText
} from 'lucide-react';
import { useSoil } from '../context/SoilContext';
import { SAMPLE_SOIL_REPORTS } from '../data/sampleSoilReports';
import { api } from '../services/api';
import { classifyLive, analyzeSoil } from '../engine/icarEngine';

export default function SoilUploadModal() {
  const { isUploadModalOpen, setIsUploadModalOpen, addReport } = useSoil();
  const navigate = useNavigate();

  // Modal Step: 'upload' | 'processing' | 'validation' | 'error'
  const [modalStep, setModalStep] = useState('upload');
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileError, setFileError] = useState(null);
  const [processingStep, setProcessingStep] = useState(0);

  // Extracted data state for validation & editing
  const [reportTitle, setReportTitle] = useState("North Field Soil Health Card");
  const [fileUrl, setFileUrl] = useState(null);
  const [confidence, setConfidence] = useState(0.92);
  const [requiresConfirmation, setRequiresConfirmation] = useState(false);
  const [missingCore, setMissingCore] = useState([]);

  // Editable parameters state
  const [params, setParams] = useState({
    nitrogen: 185.0,
    phosphorus: 18.4,
    potassium: 295.0,
    ph: 7.20,
    organicCarbon: 0.48,
    ec: 0.38,
    zinc: 0.45,
    sulphur: 12.5,
    iron: 5.4,
    boron: 0.52,
    copper: 0.78,
    manganese: 3.8
  });

  // Track which parameters were missing from the document
  const [missingFlags, setMissingFlags] = useState({});

  if (!isUploadModalOpen) return null;

  const extractionSteps = [
    "Uploading document to secure storage...",
    "Scanning Soil Health Card document with OCR engine...",
    "Extracting NPK, pH, and organic carbon values...",
    "Computing soil nutrient deficiency benchmarks..."
  ];

  const resetModal = () => {
    setModalStep('upload');
    setSelectedFile(null);
    setFileError(null);
    setProcessingStep(0);
    setIsUploadModalOpen(false);
  };

  const validateFile = (file) => {
    if (!file) return "Please select a file to upload.";
    const validExtensions = ['pdf', 'jpg', 'jpeg', 'png'];
    const fileNameParts = file.name.split('.');
    const fileExt = fileNameParts.length > 1 ? fileNameParts.pop().toLowerCase() : '';
    if (!validExtensions.includes(fileExt)) {
      return "Invalid file type. Only PDF, JPG, JPEG, and PNG files are supported.";
    }
    const maxSizeBytes = 15 * 1024 * 1024; // 15MB
    if (file.size > maxSizeBytes) {
      return "File size exceeds 15MB limit. Please choose a file under 15MB.";
    }
    return null;
  };

  const handleFileSelection = (file) => {
    const error = validateFile(file);
    if (error) {
      setFileError(error);
      setSelectedFile(null);
    } else {
      setFileError(null);
      setSelectedFile(file);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelection(e.target.files[0]);
    }
  };

  const handleTryAgain = () => {
    setModalStep('upload');
  };

  const handleEnterManually = () => {
    setReportTitle(selectedFile ? selectedFile.name.replace(/\.[^/.]+$/, "").replace(/_/g, " ") : "Soil Health Card");
    setFileUrl(null);
    setConfidence(0);
    setRequiresConfirmation(true);
    setMissingCore(["N", "P", "K", "pH"]);
    setMissingFlags({});
    setParams({
      nitrogen: '',
      phosphorus: '',
      potassium: '',
      ph: '',
      organicCarbon: '',
      ec: '',
      zinc: '',
      sulphur: '',
      iron: '',
      boron: '',
      copper: '',
      manganese: ''
    });
    setModalStep('validation');
  };

  const handleStartExtraction = async (presetData = null) => {
    // If preloaded preset card is clicked
    if (presetData) {
      setModalStep('processing');
      setProcessingStep(0);
      setTimeout(() => {
        setReportTitle(presetData.title);
        setParams({
          nitrogen: presetData.nutrients.nitrogen.value,
          phosphorus: presetData.nutrients.phosphorus.value,
          potassium: presetData.nutrients.potassium.value,
          ph: presetData.ph.value,
          organicCarbon: presetData.organicCarbon.value,
          ec: presetData.ec.value,
          zinc: presetData.secondaryNutrients?.zinc?.value || 0.45,
          sulphur: presetData.secondaryNutrients?.sulphur?.value || 12.5,
          iron: presetData.secondaryNutrients?.iron?.value || 5.4,
          boron: presetData.secondaryNutrients?.boron?.value || 0.52,
          copper: 0.78,
          manganese: 3.8
        });
        setConfidence(0.96);
        setRequiresConfirmation(false);
        setMissingFlags({});
        setModalStep('validation');
      }, 900);
      return;
    }

    if (!selectedFile) {
      setModalStep('error');
      return;
    }

    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      setFileError("Card OCR scan requires an internet connection to reach the backend. Please connect to the internet or enter soil values manually offline.");
      return;
    }

    setModalStep('processing');
    setProcessingStep(0);

    // Call real backend extraction endpoint
    let backendExtraction = null;
    let timer = null;
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      
      // Progress ticker
      timer = setInterval(() => {
        setProcessingStep(prev => (prev < extractionSteps.length - 1 ? prev + 1 : prev));
      }, 500);

      backendExtraction = await api.soilReports.extract(formData);
    } catch (err) {
      console.warn("Backend extraction error:", err.message);
    } finally {
      if (timer) clearInterval(timer);
    }

    if (backendExtraction && backendExtraction.extracted_soil_data) {
      const ext = backendExtraction.extracted_soil_data;
      setReportTitle(backendExtraction.report_name || selectedFile.name.replace(/\.[^/.]+$/, ""));
      setFileUrl(backendExtraction.file_url);
      setConfidence(backendExtraction.avg_confidence || 0.88);
      setRequiresConfirmation(backendExtraction.requires_confirmation);
      setMissingCore(backendExtraction.missing_core || []);

      const missObj = {};
      if (ext.nitrogen?.is_missing) missObj.nitrogen = true;
      if (ext.phosphorus?.is_missing) missObj.phosphorus = true;
      if (ext.potassium?.is_missing) missObj.potassium = true;
      if (ext.ph?.is_missing) missObj.ph = true;
      if (ext.organic_carbon?.is_missing) missObj.organicCarbon = true;
      if (ext.ec?.is_missing) missObj.ec = true;
      
      const micro = ext.micronutrients || {};
      if (micro.zinc?.is_missing) missObj.zinc = true;
      if (micro.sulphur?.is_missing) missObj.sulphur = true;
      if (micro.iron?.is_missing) missObj.iron = true;
      if (micro.boron?.is_missing) missObj.boron = true;

      setMissingFlags(missObj);

      setParams({
        nitrogen: ext.nitrogen?.value ?? '',
        phosphorus: ext.phosphorus?.value ?? '',
        potassium: ext.potassium?.value ?? '',
        ph: ext.ph?.value ?? '',
        organicCarbon: ext.organic_carbon?.value ?? '',
        ec: ext.ec?.value ?? '',
        zinc: micro.zinc?.value ?? '',
        sulphur: micro.sulphur?.value ?? '',
        iron: micro.iron?.value ?? '',
        boron: micro.boron?.value ?? '',
        copper: micro.copper?.value ?? 0.78,
        manganese: micro.manganese?.value ?? 3.8
      });
      setModalStep('validation');
    } else {
      setModalStep('error');
    }
  };

  const handleConfirmAndSave = async () => {
    // Build confirmed structured report payload
    const n = parseFloat(params.nitrogen) || 0;
    const p = parseFloat(params.phosphorus) || 0;
    const k = parseFloat(params.potassium) || 0;
    const ph = parseFloat(params.ph) || 7.0;
    const oc = parseFloat(params.organicCarbon) || 0;
    const ec = parseFloat(params.ec) || 0;
    const zn = parseFloat(params.zinc) || 0;
    const s = parseFloat(params.sulphur) || 0;

    const nClass = classifyLive('nitrogen', n) || { label: 'Medium', color: 'bg-emerald-50 text-[#245C3A] border-emerald-200' };
    const pClass = classifyLive('phosphorus', p) || { label: 'Medium', color: 'bg-emerald-50 text-[#245C3A] border-emerald-200' };
    const kClass = classifyLive('potassium', k) || { label: 'Medium', color: 'bg-emerald-50 text-[#245C3A] border-emerald-200' };
    const phClass = classifyLive('ph', ph) || { label: 'Neutral', color: 'bg-emerald-50 text-[#245C3A] border-emerald-200' };
    const ocClass = classifyLive('organicCarbon', oc) || { label: 'Medium', color: 'bg-emerald-50 text-[#245C3A] border-emerald-200' };
    const ecClass = classifyLive('ec', ec) || { label: 'Normal', color: 'bg-emerald-50 text-[#245C3A] border-emerald-200' };

    // Calculate score
    const healthScore = Math.min(Math.max(Math.round((n / 350) * 20 + (p / 22) * 20 + (k / 240) * 20 + (oc / 0.75) * 20 + (20 - Math.abs(ph - 7) * 8)), 35), 98);

    const verifiedPayload = {
      title: reportTitle,
      file_url: fileUrl,
      healthScore,
      overallStatus: `${phClass.label} Soil • ${nClass.label} Nitrogen • ${kClass.label} Potassium`,
      soilType: ph < 7.6 ? "Alluvial Sandy Loam" : "Medium Black Clay Soil",
      extracted_soil_data: {
        healthScore,
        overallStatus: `${phClass.label} Soil • ${nClass.label} Nitrogen`,
        soilType: ph < 7.6 ? "Alluvial Sandy Loam" : "Medium Black Clay Soil",
        nitrogen: { symbol: "N", value: n, unit: "kg/ha", rating: nClass.label, benchmark: 350 },
        phosphorus: { symbol: "P", value: p, unit: "kg/ha", rating: pClass.label, benchmark: 22 },
        potassium: { symbol: "K", value: k, unit: "kg/ha", rating: kClass.label, benchmark: 240 },
        ph: { value: ph, rating: phClass.label, idealRange: "6.5 - 7.5" },
        organic_carbon: { value: oc, unit: "%", rating: ocClass.label },
        ec: { value: ec, unit: "dS/m", rating: ecClass.label },
        zinc: { symbol: "Zn", value: zn, unit: "ppm", rating: zn < 0.6 ? "Low" : "Sufficient" },
        sulphur: { symbol: "S", value: s, unit: "ppm", rating: s < 10 ? "Low" : "Medium" },
        iron: { symbol: "Fe", value: parseFloat(params.iron) || 5.4, unit: "ppm", rating: "Sufficient" },
        boron: { symbol: "B", value: parseFloat(params.boron) || 0.52, unit: "ppm", rating: "Medium" }
      },
      ph: { value: ph, rating: phClass.label, idealRange: "6.5 - 7.5", advisory: "Optimal range for cereals." },
      ec: { value: ec, unit: "dS/m", rating: ecClass.label },
      organicCarbon: { value: oc, unit: "%", rating: ocClass.label, advisory: "Apply FYM/compost." },
      nutrients: {
        nitrogen: { symbol: "N", name: "Available Nitrogen", value: n, unit: "kg/ha", rating: nClass.label, benchmark: 350 },
        phosphorus: { symbol: "P", name: "Available Phosphorus", value: p, unit: "kg/ha", rating: pClass.label, benchmark: 22 },
        potassium: { symbol: "K", name: "Available Potassium", value: k, unit: "kg/ha", rating: kClass.label, benchmark: 240 }
      },
      secondaryNutrients: {
        zinc: { symbol: "Zn", value: zn, unit: "ppm", rating: zn < 0.6 ? "Low" : "Sufficient" },
        sulphur: { symbol: "S", value: s, unit: "ppm", rating: s < 10 ? "Low" : "Medium" },
        iron: { symbol: "Fe", value: parseFloat(params.iron) || 5.4, unit: "ppm", rating: "Sufficient" },
        boron: { symbol: "B", value: parseFloat(params.boron) || 0.52, unit: "ppm", rating: "Medium" }
      }
    };

    // Run deterministic ICAR agronomy analysis (works 100% offline)
    const localAnalysis = analyzeSoil(verifiedPayload);
    verifiedPayload.healthScore = localAnalysis.healthScore;
    verifiedPayload.overallStatus = localAnalysis.overallStatus;
    verifiedPayload.fertilizerPlan = [
      {
        fertilizer: localAnalysis.fertilizerPlan.urea.fertilizer,
        bagsPerAcre: localAnalysis.fertilizerPlan.urea.bagsPerAcre,
        totalKg: localAnalysis.fertilizerPlan.urea.kgPerAcre,
        timing: localAnalysis.fertilizerPlan.urea.timing,
        estimatedCost: `₹${Math.round(localAnalysis.fertilizerPlan.urea.bagsPerAcre * 266.5)}`,
        savingTip: localAnalysis.fertilizerPlan.urea.dapDeductionNote || "Calibrated N splits prevent lodging."
      },
      {
        fertilizer: localAnalysis.fertilizerPlan.phosphorusSource.fertilizer,
        bagsPerAcre: localAnalysis.fertilizerPlan.phosphorusSource.bagsPerAcre,
        totalKg: localAnalysis.fertilizerPlan.phosphorusSource.kgPerAcre,
        timing: localAnalysis.fertilizerPlan.phosphorusSource.timing,
        estimatedCost: `₹${Math.round(localAnalysis.fertilizerPlan.phosphorusSource.bagsPerAcre * 1350)}`,
        savingTip: "100% basal drilling 5cm below seed."
      },
      {
        fertilizer: localAnalysis.fertilizerPlan.mop.fertilizer,
        bagsPerAcre: localAnalysis.fertilizerPlan.mop.bagsPerAcre,
        totalKg: localAnalysis.fertilizerPlan.mop.kgPerAcre,
        timing: localAnalysis.fertilizerPlan.mop.timing,
        estimatedCost: `₹${Math.round(localAnalysis.fertilizerPlan.mop.bagsPerAcre * 1700)}`,
        savingTip: k > 280 ? "Saved input costs by cutting MOP dose by 50%!" : "Supports stem strength and drought resistance."
      },
      ...(localAnalysis.fertilizerPlan.zinc ? [{
        fertilizer: localAnalysis.fertilizerPlan.zinc.fertilizer,
        bagsPerAcre: 0.4,
        totalKg: localAnalysis.fertilizerPlan.zinc.kgPerAcre,
        timing: localAnalysis.fertilizerPlan.zinc.timing,
        estimatedCost: "₹420",
        savingTip: "Critical prevention for Khaira disease (DO NOT mix with DAP)."
      }] : [])
    ];
    verifiedPayload.cropRecommendations = localAnalysis.cropSuggestions.slice(0, 3).map(c => ({
      crop: c.crop,
      suitability: c.suitability,
      season: "Kharif / Rabi",
      soilMatch: c.suitability > 80 ? "Excellent" : "Good",
      waterNeed: c.waterNeed,
      expectedYield: "High potential under recommended practices",
      rationale: c.rationale
    }));

    await addReport(verifiedPayload, selectedFile);
    resetModal();
    navigate('/soil-analysis');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs animate-in fade-in overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-[#E2EBE2] overflow-hidden text-[#26332B] my-8 max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="bg-[#245C3A] text-white p-5 sm:p-6 flex justify-between items-start shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 text-emerald-100 border border-white/20 flex items-center justify-center font-black shadow-xs">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black">
                  {modalStep === 'validation' ? "Validate & Confirm Soil Data" : (modalStep === 'error' ? "Extraction Error" : "Upload Soil Health Card")}
                </h3>
                <span className="text-[10px] uppercase font-bold bg-[#E8F0E7] text-[#245C3A] px-2 py-0.5 rounded-full">
                  {modalStep === 'validation' ? "Step 2 of 2" : (modalStep === 'error' ? "Notice" : "Step 1 of 2")}
                </span>
              </div>
              <p className="text-emerald-100 text-xs mt-0.5">
                {modalStep === 'validation' 
                  ? "Verify extracted values. Correct any inaccuracies or missing items below." 
                  : (modalStep === 'error'
                      ? "Unable to extract data from this file."
                      : "Supports PDF, JPG, JPEG, and PNG soil testing documents."
                    )
                }
              </p>
            </div>
          </div>
          <button
            onClick={resetModal}
            className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          
          {/* STEP 1: UPLOAD SCREEN */}
          {modalStep === 'upload' && (
            <>
              {/* Offline Warning & Manual Entry Prompt */}
              {typeof navigator !== 'undefined' && !navigator.onLine && (
                <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start justify-between gap-3 shadow-xs">
                  <div className="flex items-start gap-2.5">
                    <AlertCircle className="w-4 h-4 shrink-0 text-amber-700 mt-0.5" />
                    <div>
                      <p className="font-bold text-amber-950">Offline Mode Active</p>
                      <p className="text-[#5C6E63] mt-0.5">Card OCR scan requires an internet connection. Enter your soil test values manually to run the offline ICAR analysis engine.</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleEnterManually}
                    className="shrink-0 text-xs font-bold text-[#245C3A] bg-white px-3 py-1.5 rounded-xl border border-amber-300 hover:bg-[#E8F0E7] shadow-xs transition cursor-pointer"
                  >
                    Enter Manually
                  </button>
                </div>
              )}

              {/* Dropzone */}
              <div
                onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                onDragLeave={() => setDragActive(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragActive(false);
                  if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                    handleFileSelection(e.dataTransfer.files[0]);
                  }
                }}
                className={`border-2 border-dashed rounded-2xl p-6 sm:p-8 text-center transition-all ${
                  dragActive 
                    ? "border-[#245C3A] bg-[#E8F0E7]/60" 
                    : selectedFile 
                      ? "border-[#245C3A] bg-[#E8F0E7]/30" 
                      : "border-[#E2EBE2] hover:border-[#245C3A] bg-[#F8FAF7]"
                }`}
              >
                <input
                  type="file"
                  id="soil-card-file-input"
                  accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/*"
                  className="hidden"
                  onChange={handleFileChange}
                />

                {selectedFile ? (
                  <div className="space-y-3">
                    <div className="w-12 h-12 mx-auto rounded-full bg-[#E8F0E7] text-[#245C3A] flex items-center justify-center">
                      <CheckCircle2 className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="font-bold text-[#26332B] text-sm">{selectedFile.name}</p>
                      <p className="text-xs text-[#5C6E63]">{(selectedFile.size / 1024).toFixed(1)} KB • Ready for OCR Extraction</p>
                    </div>
                    <label
                      htmlFor="soil-card-file-input"
                      className="inline-block text-xs text-[#245C3A] font-bold hover:underline cursor-pointer"
                    >
                      Choose a different file
                    </label>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="w-12 h-12 mx-auto rounded-2xl bg-white shadow-xs border border-[#E2EBE2] text-[#245C3A] flex items-center justify-center">
                      <Camera className="w-6 h-6" />
                    </div>
                    <div>
                      <label
                        htmlFor="soil-card-file-input"
                        className="cursor-pointer text-sm font-black text-[#245C3A] hover:underline"
                      >
                        Browse Document or Take Photo
                      </label>
                      <p className="text-xs text-[#5C6E63] mt-1">
                        Accepts PDF, JPG, JPEG, and PNG (Max 15MB)
                      </p>
                    </div>
                    <p className="text-[11px] text-[#5C6E63]">
                      Drag and drop your Soil Health Card or lab certificate here
                    </p>
                  </div>
                )}
              </div>

              {/* Inline File Validation Error Message */}
              {fileError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                  <span>{fileError}</span>
                </div>
              )}

              {/* Manual Entry Action Link */}
              <div className="flex items-center justify-between text-xs text-[#5C6E63] px-1 py-1">
                <span>Working offline or don't have a document file?</span>
                <button
                  type="button"
                  onClick={handleEnterManually}
                  className="font-bold text-[#245C3A] hover:underline cursor-pointer flex items-center gap-1.5"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Enter values manually</span>
                </button>
              </div>

              {/* Start Extraction button */}
              {selectedFile && (
                <button
                  type="button"
                  onClick={() => handleStartExtraction(null)}
                  className="w-full py-3.5 px-4 rounded-xl bg-[#245C3A] hover:bg-[#1B462C] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-xs active:scale-98 transition cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 text-emerald-100" />
                  <span>Extract Soil Parameters</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}

              {/* Preset Demo Cards for Rapid Testing */}
              <div className="pt-3 border-t border-[#E2EBE2]">
                <div className="flex items-center gap-2 text-xs font-bold text-[#5C6E63] uppercase tracking-wide mb-3">
                  <Layers className="w-4 h-4 text-[#245C3A]" />
                  <span>Or Test with Preloaded Benchmark Cards</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => handleStartExtraction(SAMPLE_SOIL_REPORTS[0])}
                    className="text-left p-3 rounded-xl border border-[#E2EBE2] hover:border-[#245C3A] hover:bg-[#E8F0E7]/40 transition group cursor-pointer"
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-bold text-xs text-[#26332B] group-hover:text-[#245C3A]">
                        🌾 Punjab - Alluvial Soil Card
                      </span>
                      <span className="text-[10px] bg-[#E8F0E7] text-[#245C3A] font-bold px-1.5 py-0.5 rounded">
                        Wheat/Paddy
                      </span>
                    </div>
                    <p className="text-[11px] text-[#5C6E63] line-clamp-1">
                      Low Nitrogen (185), High Potash (295), Low Zinc (0.45)
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleStartExtraction(SAMPLE_SOIL_REPORTS[1])}
                    className="text-left p-3 rounded-xl border border-[#E2EBE2] hover:border-[#245C3A] hover:bg-[#E8F0E7]/40 transition group cursor-pointer"
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-bold text-xs text-[#26332B] group-hover:text-[#245C3A]">
                        🌱 Maharashtra - Black Soil Card
                      </span>
                      <span className="text-[10px] bg-amber-50 text-amber-900 border border-amber-200 font-bold px-1.5 py-0.5 rounded">
                        Cotton/Soybean
                      </span>
                    </div>
                    <p className="text-[11px] text-[#5C6E63] line-clamp-1">
                      Alkaline (pH 8.1), Low P (14.2), High K (310)
                    </p>
                  </button>
                </div>
              </div>
            </>
          )}

          {/* STEP 2: PROCESSING / SCANNING SCREEN */}
          {modalStep === 'processing' && (
            <div className="py-12 px-4 text-center space-y-6">
              <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
                <div className="absolute inset-0 rounded-full border-4 border-[#E8F0E7] border-t-[#245C3A] animate-spin"></div>
                <Sparkles className="w-8 h-8 text-[#245C3A] animate-pulse" />
              </div>

              <div>
                <h4 className="text-base font-bold text-[#26332B] mb-1">
                  Parsing Soil Health Document...
                </h4>
                <p className="text-xs font-semibold text-[#245C3A] h-5">
                  {extractionSteps[processingStep]}
                </p>
              </div>

              <div className="w-full bg-[#E2EBE2] rounded-full h-2.5 overflow-hidden">
                <div 
                  className="bg-[#245C3A] h-full transition-all duration-500 rounded-full"
                  style={{ width: `${((processingStep + 1) / extractionSteps.length) * 100}%` }}
                ></div>
              </div>
            </div>
          )}

          {/* STEP: ERROR SCREEN */}
          {modalStep === 'error' && (
            <div className="py-10 px-4 text-center space-y-6">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center">
                <AlertCircle className="w-8 h-8" />
              </div>

              <div className="space-y-2 max-w-md mx-auto">
                <h4 className="text-base font-bold text-[#26332B]">
                  Extraction Failed
                </h4>
                <p className="text-sm text-[#5C6E63]">
                  Could not read this card. Check your connection or enter values manually
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleTryAgain}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-[#E2EBE2] hover:bg-[#F8FAF7] text-[#26332B] font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4 text-[#5C6E63]" />
                  <span>Try again</span>
                </button>

                <button
                  type="button"
                  onClick={handleEnterManually}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#245C3A] hover:bg-[#1B462C] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition cursor-pointer"
                >
                  <Edit3 className="w-4 h-4" />
                  <span>Enter values manually</span>
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: DATA VALIDATION & CONFIRMATION SCREEN (FEATURE 3) */}
          {modalStep === 'validation' && (
            <div className="space-y-5">
              
              {/* Confidence Alert Strip */}
              {requiresConfirmation || confidence < 0.75 || Object.keys(missingFlags).length > 0 ? (
                <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-2.5">
                  <AlertCircle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                  <div>
                    <strong className="block font-black text-amber-950">Manual Verification Recommended</strong>
                    <span>
                      Some parameters were missing or detected with moderate confidence ({Math.round(confidence * 100)}%). Please review the fields highlighted below and enter values from your card if available.
                    </span>
                  </div>
                </div>
              ) : (
                <div className="p-3.5 rounded-2xl bg-[#E8F0E7] border border-[#D4E3D3] text-xs text-[#245C3A] flex items-center gap-2.5">
                  <ShieldCheck className="w-5 h-5 text-[#245C3A] shrink-0" />
                  <span>
                    <strong>High Confidence Extraction ({Math.round(confidence * 100)}%):</strong> All primary nutrients extracted and validated against ICAR benchmarks.
                  </span>
                </div>
              )}

              {/* Report Title */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#5C6E63] mb-1">
                  Report / Field Title
                </label>
                <input
                  type="text"
                  value={reportTitle}
                  onChange={(e) => setReportTitle(e.target.value)}
                  className="w-full py-2 px-3 bg-[#F8FAF7] rounded-xl border border-[#E2EBE2] text-xs font-bold text-[#26332B] focus:ring-2 focus:ring-[#245C3A] focus:outline-hidden"
                />
              </div>

              {/* 1. Primary Parameters Table */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-wider text-[#5C6E63]">
                    Primary Nutrients & Soil Chemistry
                  </span>
                  <span className="text-[11px] text-[#5C6E63]">Values editable</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  
                  {/* Nitrogen */}
                  <div className={`p-3 rounded-xl border transition-all ${missingFlags.nitrogen ? "bg-amber-50/50 border-amber-300" : "bg-[#F8FAF7] border-[#E2EBE2]"}`}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-[#5C6E63]">Available Nitrogen (N)</span>
                      {classifyLive('nitrogen', params.nitrogen) && (
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${classifyLive('nitrogen', params.nitrogen).color}`}>
                          {classifyLive('nitrogen', params.nitrogen).label}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        step="0.1"
                        value={params.nitrogen}
                        onChange={(e) => setParams({ ...params, nitrogen: e.target.value })}
                        placeholder="e.g. 185"
                        className="w-full py-1.5 px-2.5 bg-white rounded-lg border border-[#E2EBE2] font-black text-sm text-[#26332B]"
                      />
                      <span className="text-xs text-[#5C6E63] font-bold shrink-0">kg/ha</span>
                    </div>
                    {missingFlags.nitrogen && (
                      <span className="text-[10px] text-amber-700 font-bold block mt-1">⚠ Missing in report</span>
                    )}
                  </div>

                  {/* Phosphorus */}
                  <div className={`p-3 rounded-xl border transition-all ${missingFlags.phosphorus ? "bg-amber-50/50 border-amber-300" : "bg-[#F8FAF7] border-[#E2EBE2]"}`}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-[#5C6E63]">Available Phosphorus (P)</span>
                      {classifyLive('phosphorus', params.phosphorus) && (
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${classifyLive('phosphorus', params.phosphorus).color}`}>
                          {classifyLive('phosphorus', params.phosphorus).label}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        step="0.1"
                        value={params.phosphorus}
                        onChange={(e) => setParams({ ...params, phosphorus: e.target.value })}
                        placeholder="e.g. 18.4"
                        className="w-full py-1.5 px-2.5 bg-white rounded-lg border border-[#E2EBE2] font-black text-sm text-[#26332B]"
                      />
                      <span className="text-xs text-[#5C6E63] font-bold shrink-0">kg/ha</span>
                    </div>
                    {missingFlags.phosphorus && (
                      <span className="text-[10px] text-amber-700 font-bold block mt-1">⚠ Missing in report</span>
                    )}
                  </div>

                  {/* Potassium */}
                  <div className={`p-3 rounded-xl border transition-all ${missingFlags.potassium ? "bg-amber-50/50 border-amber-300" : "bg-[#F8FAF7] border-[#E2EBE2]"}`}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-[#5C6E63]">Available Potassium (K)</span>
                      {classifyLive('potassium', params.potassium) && (
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${classifyLive('potassium', params.potassium).color}`}>
                          {classifyLive('potassium', params.potassium).label}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        step="0.1"
                        value={params.potassium}
                        onChange={(e) => setParams({ ...params, potassium: e.target.value })}
                        placeholder="e.g. 295"
                        className="w-full py-1.5 px-2.5 bg-white rounded-lg border border-[#E2EBE2] font-black text-sm text-[#26332B]"
                      />
                      <span className="text-xs text-[#5C6E63] font-bold shrink-0">kg/ha</span>
                    </div>
                    {missingFlags.potassium && (
                      <span className="text-[10px] text-amber-700 font-bold block mt-1">⚠ Missing in report</span>
                    )}
                  </div>

                  {/* Soil pH */}
                  <div className={`p-3 rounded-xl border transition-all ${missingFlags.ph ? "bg-amber-50/50 border-amber-300" : "bg-[#F8FAF7] border-[#E2EBE2]"}`}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-[#5C6E63]">Soil Reaction (pH)</span>
                      {classifyLive('ph', params.ph) && (
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${classifyLive('ph', params.ph).color}`}>
                          {classifyLive('ph', params.ph).label}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        step="0.05"
                        value={params.ph}
                        onChange={(e) => setParams({ ...params, ph: e.target.value })}
                        placeholder="e.g. 7.2"
                        className="w-full py-1.5 px-2.5 bg-white rounded-lg border border-[#E2EBE2] font-black text-sm text-[#26332B]"
                      />
                      <span className="text-xs text-[#5C6E63] font-bold shrink-0">0-14</span>
                    </div>
                    {missingFlags.ph && (
                      <span className="text-[10px] text-amber-700 font-bold block mt-1">⚠ Missing in report</span>
                    )}
                  </div>

                  {/* Organic Carbon */}
                  <div className={`p-3 rounded-xl border transition-all ${missingFlags.organicCarbon ? "bg-amber-50/50 border-amber-300" : "bg-[#F8FAF7] border-[#E2EBE2]"}`}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-[#5C6E63]">Organic Carbon (OC)</span>
                      {classifyLive('organicCarbon', params.organicCarbon) && (
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${classifyLive('organicCarbon', params.organicCarbon).color}`}>
                          {classifyLive('organicCarbon', params.organicCarbon).label}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        step="0.01"
                        value={params.organicCarbon}
                        onChange={(e) => setParams({ ...params, organicCarbon: e.target.value })}
                        placeholder="e.g. 0.48"
                        className="w-full py-1.5 px-2.5 bg-white rounded-lg border border-[#E2EBE2] font-black text-sm text-[#26332B]"
                      />
                      <span className="text-xs text-[#5C6E63] font-bold shrink-0">%</span>
                    </div>
                  </div>

                  {/* Electrical Conductivity */}
                  <div className={`p-3 rounded-xl border transition-all ${missingFlags.ec ? "bg-amber-50/50 border-amber-300" : "bg-[#F8FAF7] border-[#E2EBE2]"}`}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-[#5C6E63]">Electrical Conductivity (EC)</span>
                      {classifyLive('ec', params.ec) && (
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${classifyLive('ec', params.ec).color}`}>
                          {classifyLive('ec', params.ec).label}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        step="0.01"
                        value={params.ec}
                        onChange={(e) => setParams({ ...params, ec: e.target.value })}
                        placeholder="e.g. 0.38"
                        className="w-full py-1.5 px-2.5 bg-white rounded-lg border border-[#E2EBE2] font-black text-sm text-[#26332B]"
                      />
                      <span className="text-xs text-[#5C6E63] font-bold shrink-0">dS/m</span>
                    </div>
                  </div>

                </div>
              </div>

              {/* 2. Secondary & Micronutrients (Foldable / Quick Grid) */}
              <div className="space-y-3 pt-2">
                <span className="text-xs font-black uppercase tracking-wider text-[#5C6E63] block">
                  Micronutrients (ppm)
                </span>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                  
                  {/* Zinc */}
                  <div className="p-2.5 rounded-xl bg-[#F8FAF7] border border-[#E2EBE2]">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-bold text-[#5C6E63]">Zinc (Zn)</span>
                      {classifyLive('zinc', params.zinc) && (
                        <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${classifyLive('zinc', params.zinc).color}`}>
                          {classifyLive('zinc', params.zinc).label}
                        </span>
                      )}
                    </div>
                    <input
                      type="number"
                      step="0.01"
                      value={params.zinc}
                      onChange={(e) => setParams({ ...params, zinc: e.target.value })}
                      placeholder="ppm"
                      className="w-full py-1 px-2 bg-white rounded border border-[#E2EBE2] font-bold text-xs"
                    />
                  </div>

                  {/* Sulphur */}
                  <div className="p-2.5 rounded-xl bg-[#F8FAF7] border border-[#E2EBE2]">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-bold text-[#5C6E63]">Sulphur (S)</span>
                      {classifyLive('sulphur', params.sulphur) && (
                        <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${classifyLive('sulphur', params.sulphur).color}`}>
                          {classifyLive('sulphur', params.sulphur).label}
                        </span>
                      )}
                    </div>
                    <input
                      type="number"
                      step="0.1"
                      value={params.sulphur}
                      onChange={(e) => setParams({ ...params, sulphur: e.target.value })}
                      placeholder="ppm"
                      className="w-full py-1 px-2 bg-white rounded border border-[#E2EBE2] font-bold text-xs"
                    />
                  </div>

                  {/* Iron */}
                  <div className="p-2.5 rounded-xl bg-[#F8FAF7] border border-[#E2EBE2]">
                    <span className="font-bold text-[#5C6E63] block mb-1">Iron (Fe)</span>
                    <input
                      type="number"
                      step="0.1"
                      value={params.iron}
                      onChange={(e) => setParams({ ...params, iron: e.target.value })}
                      placeholder="ppm"
                      className="w-full py-1 px-2 bg-white rounded border border-[#E2EBE2] font-bold text-xs"
                    />
                  </div>

                  {/* Boron */}
                  <div className="p-2.5 rounded-xl bg-[#F8FAF7] border border-[#E2EBE2]">
                    <span className="font-bold text-[#5C6E63] block mb-1">Boron (B)</span>
                    <input
                      type="number"
                      step="0.01"
                      value={params.boron}
                      onChange={(e) => setParams({ ...params, boron: e.target.value })}
                      placeholder="ppm"
                      className="w-full py-1 px-2 bg-white rounded border border-[#E2EBE2] font-bold text-xs"
                    />
                  </div>

                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-[#E2EBE2] flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setModalStep('upload')}
                  className="px-4 py-2.5 rounded-xl bg-[#F8FAF7] hover:bg-[#E8F0E7] text-[#5C6E63] hover:text-[#26332B] text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Re-upload</span>
                </button>

                <button
                  type="button"
                  onClick={handleConfirmAndSave}
                  className="px-6 py-2.5 rounded-xl bg-[#245C3A] hover:bg-[#1B462C] text-white font-bold text-xs flex items-center gap-2 shadow-xs transition active:scale-98 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Confirm & Save Soil Health Card</span>
                </button>
              </div>

            </div>
          )}

        </div>

        {/* Footer info */}
        <div className="px-6 py-3 bg-[#F8FAF7] border-t border-[#E2EBE2] flex items-center justify-between text-xs text-[#5C6E63] shrink-0">
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-[#245C3A]" />
            ICAR Scientific Standards Verified
          </span>
          <span className="font-semibold text-[#245C3A]">KrishiSaathi AI Engine</span>
        </div>

      </div>
    </div>
  );
}
