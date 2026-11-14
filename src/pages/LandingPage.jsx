import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Sprout, 
  UploadCloud, 
  Sparkles, 
  CheckCircle2, 
  ArrowRight, 
  ShieldCheck, 
  TrendingUp, 
  Mic, 
  FileCheck, 
  Droplets, 
  ChevronRight
} from 'lucide-react';
import { useSoil } from '../context/SoilContext';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';

export default function LandingPage() {
  const { t } = useTranslation();
  const { setIsUploadModalOpen } = useSoil();
  const { user } = useAuth();

  return (
    <div className="flex flex-col min-h-screen bg-stone-50">
      
      {/* 1. HERO SECTION */}
      <section className="relative overflow-hidden pt-12 pb-20 lg:pt-20 lg:pb-28 bg-gradient-to-b from-emerald-900 via-emerald-800 to-green-900 text-white">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#86efac_1px,transparent_1px)] [background-size:24px_24px]"></div>
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 rounded-full bg-emerald-500/20 blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-96 h-96 rounded-full bg-amber-500/20 blur-3xl pointer-events-none"></div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left Column: Heading and CTAs */}
            <div className="lg:col-span-7 space-y-8 text-center lg:text-left">
              
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-700/80 border border-emerald-500/40 text-emerald-200 text-xs sm:text-sm font-semibold backdrop-blur-xs">
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>{t('landing.heroTag', 'AI-Powered Soil Health Intelligence & Advisory')}</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-tight">
                {t('landing.heroTitle', 'Understand Your Soil.')} <br className="hidden sm:inline" />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 via-green-200 to-amber-300">
                  {t('landing.heroTitleHighlight', 'Grow Better. Earn More.')}
                </span>
              </h1>

              <p className="text-base sm:text-lg text-emerald-100/90 leading-relaxed max-w-2xl mx-auto lg:mx-0">
                {t('landing.heroSubtitle', 'KrishiSaathi empowers farmers to unlock the true potential of their land.')}
              </p>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 justify-center lg:justify-start pt-2">
                <Link
                  to={user ? "/dashboard" : "/register"}
                  className="px-8 py-4 rounded-2xl bg-amber-400 hover:bg-amber-500 text-stone-950 font-black text-lg shadow-xl shadow-amber-400/25 flex items-center justify-center gap-3 transition-all hover:scale-[1.02] active:scale-95 group"
                >
                  <span>{t('landing.ctaDemo', 'Get Started')}</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>

                <button
                  type="button"
                  onClick={() => setIsUploadModalOpen(true)}
                  className="px-8 py-4 rounded-2xl bg-white/10 hover:bg-white/20 border-2 border-white/40 text-white font-bold text-lg backdrop-blur-xs flex items-center justify-center gap-3 transition-all hover:scale-[1.02] active:scale-95"
                >
                  <UploadCloud className="w-6 h-6 text-emerald-300" />
                  <span>{t('landing.ctaUpload', 'Upload Soil Report')}</span>
                </button>
              </div>

              {/* Trust Badges */}
              <div className="pt-4 grid grid-cols-3 gap-4 border-t border-emerald-700/60 max-w-lg mx-auto lg:mx-0 text-left">
                <div>
                  <p className="text-2xl font-black text-white">{t('landing.stats.cardsCount', '120,000+')}</p>
                  <p className="text-xs text-emerald-200 font-medium">{t('landing.stats.cards', 'Soil Cards Analyzed')}</p>
                </div>
                <div>
                  <p className="text-2xl font-black text-amber-300">{t('landing.stats.savingsValue', '₹3,500/acre')}</p>
                  <p className="text-xs text-emerald-200 font-medium">{t('landing.stats.savings', 'Average Input Savings')}</p>
                </div>
                <div>
                  <p className="text-2xl font-black text-white">{t('landing.stats.languagesCount', '10+ Languages')}</p>
                  <p className="text-xs text-emerald-200 font-medium">{t('landing.stats.languages', 'AI Voice Assistant')}</p>
                </div>
              </div>
            </div>

            {/* Right Column: Interactive Card Preview */}
            <div className="lg:col-span-5">
              <div className="relative mx-auto max-w-md bg-white rounded-3xl p-6 shadow-2xl text-stone-900 border-4 border-white/20">
                <div className="absolute -top-4 -right-4 bg-amber-500 text-stone-950 px-4 py-1.5 rounded-full font-black text-xs shadow-lg uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" /> {t('landing.preview.badge', 'Live AI Preview')}
                </div>

                <div className="flex items-center justify-between pb-4 border-b border-stone-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                      <FileCheck className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-black text-stone-900 text-sm">{t('landing.preview.cardTitle', 'Soil Health Card')}</h4>
                      <p className="text-xs text-stone-500">{t('landing.preview.cardId', 'Card ID')}: SHC-PB-2025-0891</p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-black">
                    {t('landing.preview.score', 'Score: 74/100')}
                  </span>
                </div>

                <div className="py-4 space-y-3">
                  <div className="bg-stone-50 p-3 rounded-2xl flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-stone-500">{t('nutrients.nitrogen', 'Nitrogen (N)')}</span>
                      <p className="text-sm font-black text-red-600">{t('landing.preview.nVal', '185 kg/ha • Low')}</p>
                    </div>
                    <span className="text-xs font-bold text-red-700 bg-red-100 px-2 py-0.5 rounded-lg">
                      {t('landing.preview.nAction', 'Urea 2.2 bags/acre')}
                    </span>
                  </div>

                  <div className="bg-stone-50 p-3 rounded-2xl flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-stone-500">{t('nutrients.potassium', 'Potassium (K₂O)')}</span>
                      <p className="text-sm font-black text-emerald-700">{t('landing.preview.kVal', '295 kg/ha • Sufficient')}</p>
                    </div>
                    <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-lg">
                      {t('landing.preview.kAction', 'Reduce MOP by 50%')}
                    </span>
                  </div>

                  <div className="bg-stone-50 p-3 rounded-2xl flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-stone-500">{t('nutrients.ph', 'Soil pH')}</span>
                      <p className="text-sm font-black text-stone-800">{t('landing.preview.phVal', '7.2 • Optimal Neutral')}</p>
                    </div>
                    <span className="text-xs font-bold text-stone-700 bg-stone-200 px-2 py-0.5 rounded-lg">
                      {t('landing.preview.phAction', 'Ideal for Wheat/Paddy')}
                    </span>
                  </div>
                </div>

                <div className="bg-emerald-900 text-white p-3.5 rounded-2xl flex items-center justify-between gap-3 shadow-inner">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-emerald-700 flex items-center justify-center text-amber-300">
                      <Mic className="w-4 h-4 animate-pulse" />
                    </div>
                    <p className="text-xs font-semibold text-emerald-100 line-clamp-1">
                      {t('landing.preview.sampleQuestion', '"When and how much Urea should I apply?"')}
                    </p>
                  </div>
                  <Link
                    to="/ai-assistant"
                    className="text-xs font-black text-amber-300 hover:text-white shrink-0 flex items-center gap-1"
                  >
                    {t('landing.preview.askAi', 'Ask AI')} <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

                <div className="pt-4">
                  <Link
                    to="/soil-analysis"
                    className="w-full py-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm flex items-center justify-center gap-2 transition"
                  >
                    <span>{t('landing.preview.viewAnalysis', 'View Full Soil Analysis')}</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 2. HOW IT WORKS SECTION */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
            <span className="text-emerald-700 font-bold text-sm tracking-wider uppercase bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
              {t('landing.howItWorks.tag', 'Simple 4-Step Process')}
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-stone-900">
              {t('landing.howItWorks.title', 'How KrishiSaathi Works')}
            </h2>
            <p className="text-stone-600 text-base sm:text-lg">
              {t('landing.howItWorks.subtitle', 'Turn your complex soil lab test into actionable farming decisions in under two minutes.')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="bg-stone-50 rounded-3xl p-6 border border-stone-200 hover:border-emerald-500 hover:shadow-xl transition-all group">
              <div className="w-14 h-14 rounded-2xl bg-emerald-700 text-white flex items-center justify-center font-black text-xl mb-5 shadow-lg shadow-emerald-700/20 group-hover:scale-110 transition-transform">
                1
              </div>
              <h3 className="text-lg font-black text-stone-900 mb-2">
                {t('landing.howItWorks.step1Title', 'Upload Soil Report')}
              </h3>
              <p className="text-xs font-bold text-emerald-700 mb-2 uppercase">{t('landing.howItWorks.step1Sub', 'Step 1: Document Upload')}</p>
              <p className="text-sm text-stone-600 leading-relaxed">
                {t('landing.howItWorks.step1Desc', 'Take a photo or upload a PDF of your government Soil Health Card or lab test report.')}
              </p>
            </div>

            <div className="bg-stone-50 rounded-3xl p-6 border border-stone-200 hover:border-emerald-500 hover:shadow-xl transition-all group">
              <div className="w-14 h-14 rounded-2xl bg-emerald-700 text-white flex items-center justify-center font-black text-xl mb-5 shadow-lg shadow-emerald-700/20 group-hover:scale-110 transition-transform">
                2
              </div>
              <h3 className="text-lg font-black text-stone-900 mb-2">
                {t('landing.howItWorks.step2Title', 'AI Diagnostic Engine')}
              </h3>
              <p className="text-xs font-bold text-emerald-700 mb-2 uppercase">{t('landing.howItWorks.step2Sub', 'Step 2: Instant Analysis')}</p>
              <p className="text-sm text-stone-600 leading-relaxed">
                {t('landing.howItWorks.step2Desc', 'Our platform extracts N, P, K, pH, organic carbon, and micronutrients like Zinc and Sulphur automatically.')}
              </p>
            </div>

            <div className="bg-stone-50 rounded-3xl p-6 border border-stone-200 hover:border-emerald-500 hover:shadow-xl transition-all group">
              <div className="w-14 h-14 rounded-2xl bg-emerald-700 text-white flex items-center justify-center font-black text-xl mb-5 shadow-lg shadow-emerald-700/20 group-hover:scale-110 transition-transform">
                3
              </div>
              <h3 className="text-lg font-black text-stone-900 mb-2">
                {t('landing.howItWorks.step3Title', 'Balanced Fertilizer Plan')}
              </h3>
              <p className="text-xs font-bold text-emerald-700 mb-2 uppercase">{t('landing.howItWorks.step3Sub', 'Step 3: Precise Dosages')}</p>
              <p className="text-sm text-stone-600 leading-relaxed">
                {t('landing.howItWorks.step3Desc', 'Get exact bag quantities per acre for Urea, DAP, and MOP with application timings tailored to your plot size.')}
              </p>
            </div>

            <div className="bg-stone-50 rounded-3xl p-6 border border-stone-200 hover:border-emerald-500 hover:shadow-xl transition-all group">
              <div className="w-14 h-14 rounded-2xl bg-emerald-700 text-white flex items-center justify-center font-black text-xl mb-5 shadow-lg shadow-emerald-700/20 group-hover:scale-110 transition-transform">
                4
              </div>
              <h3 className="text-lg font-black text-stone-900 mb-2">
                {t('landing.howItWorks.step4Title', 'Voice AI Consultation')}
              </h3>
              <p className="text-xs font-bold text-emerald-700 mb-2 uppercase">{t('landing.howItWorks.step4Sub', 'Step 4: Interactive Assistant')}</p>
              <p className="text-sm text-stone-600 leading-relaxed">
                {t('landing.howItWorks.step4Desc', 'Tap the microphone to ask questions in your language and listen to audio responses from your agricultural AI assistant.')}
              </p>
            </div>
          </div>

          <div className="mt-12 text-center">
            <button
              onClick={() => setIsUploadModalOpen(true)}
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-base shadow-md transition"
            >
              <UploadCloud className="w-5 h-5" />
              <span>{t('landing.howItWorks.uploadBtn', 'Upload Soil Report to Get Started')}</span>
            </button>
          </div>
        </div>
      </section>

      {/* 3. FEATURES SECTION */}
      <section className="py-20 bg-stone-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
            <span className="text-amber-700 font-bold text-sm tracking-wider uppercase bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
              {t('landing.features.tag', 'Platform Features')}
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-stone-900">
              {t('landing.features.title', 'Comprehensive Soil & Agronomy Intelligence')}
            </h2>
            <p className="text-stone-600 text-base sm:text-lg">
              {t('landing.features.subtitle', 'Combining modern data science with agricultural standards to maximize harvest yield and lower input costs.')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-white rounded-3xl p-8 border border-stone-200/80 shadow-xs hover:shadow-xl transition-all">
              <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center mb-6">
                <FileCheck className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-black text-stone-900 mb-2">
                {t('landing.features.card1Title', 'Soil Card Digitization')}
              </h3>
              <p className="text-xs font-bold text-emerald-700 mb-3">{t('landing.features.card1Sub', 'Instant Automated Parameter Extraction')}</p>
              <p className="text-sm text-stone-600 leading-relaxed">
                {t('landing.features.card1Desc', 'Digitize paper Soil Health Cards in seconds without tedious manual data entry.')}
              </p>
            </div>

            <div className="bg-white rounded-3xl p-8 border border-stone-200/80 shadow-xs hover:shadow-xl transition-all">
              <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center mb-6">
                <TrendingUp className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-black text-stone-900 mb-2">
                {t('landing.features.card2Title', 'NPK Balanced Calculator')}
              </h3>
              <p className="text-xs font-bold text-amber-700 mb-3">{t('landing.features.card2Sub', 'Prevent Fertilizer Over-Application')}</p>
              <p className="text-sm text-stone-600 leading-relaxed">
                {t('landing.features.card2Desc', 'Avoid unnecessary expenditure on fertilizers like Potash when soil reserves are already ample, saving ₹2,000 to ₹4,000 per acre.')}
              </p>
            </div>

            <div className="bg-white rounded-3xl p-8 border border-stone-200/80 shadow-xs hover:shadow-xl transition-all">
              <div className="w-14 h-14 rounded-2xl bg-green-100 text-green-800 flex items-center justify-center mb-6">
                <Sprout className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-black text-stone-900 mb-2">
                {t('landing.features.card3Title', 'Crop Suitability Matcher')}
              </h3>
              <p className="text-xs font-bold text-green-700 mb-3">{t('landing.features.card3Sub', 'Data-Backed Crop Selection')}</p>
              <p className="text-sm text-stone-600 leading-relaxed">
                {t('landing.features.card3Desc', 'Recommends certified seed varieties matching your soil pH, texture, and seasonal water availability.')}
              </p>
            </div>

            <div className="bg-white rounded-3xl p-8 border border-stone-200/80 shadow-xs hover:shadow-xl transition-all">
              <div className="w-14 h-14 rounded-2xl bg-sky-100 text-sky-800 flex items-center justify-center mb-6">
                <Mic className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-black text-stone-900 mb-2">
                {t('landing.features.card4Title', 'Multilingual Voice AI')}
              </h3>
              <p className="text-xs font-bold text-sky-700 mb-3">{t('landing.features.card4Sub', 'Speak and Listen in Your Language')}</p>
              <p className="text-sm text-stone-600 leading-relaxed">
                {t('landing.features.card4Desc', 'Designed for accessibility. Ask questions via voice input and listen to synthesized audio advice.')}
              </p>
            </div>

            <div className="bg-white rounded-3xl p-8 border border-stone-200/80 shadow-xs hover:shadow-xl transition-all">
              <div className="w-14 h-14 rounded-2xl bg-purple-100 text-purple-800 flex items-center justify-center mb-6">
                <Droplets className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-black text-stone-900 mb-2">
                {t('landing.features.card5Title', 'Micronutrient Defect Alarm')}
              </h3>
              <p className="text-xs font-bold text-purple-700 mb-3">{t('landing.features.card5Sub', 'Early Deficiency Warnings')}</p>
              <p className="text-sm text-stone-600 leading-relaxed">
                {t('landing.features.card5Desc', 'Identifies critical Zinc, Sulphur, and Boron shortages before yield losses or crop diseases occur.')}
              </p>
            </div>

            <div className="bg-white rounded-3xl p-8 border border-stone-200/80 shadow-xs hover:shadow-xl transition-all">
              <div className="w-14 h-14 rounded-2xl bg-orange-100 text-orange-800 flex items-center justify-center mb-6">
                <ShieldCheck className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-black text-stone-900 mb-2">
                {t('landing.features.card6Title', 'ICAR Agronomy Rules')}
              </h3>
              <p className="text-xs font-bold text-orange-700 mb-3">{t('landing.features.card6Sub', 'Scientifically Verified Standards')}</p>
              <p className="text-sm text-stone-600 leading-relaxed">
                {t('landing.features.card6Desc', 'All fertilizer ratios and crop parameters align with verified agronomic standards.')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. WHY CHOOSE KRISHISAATHI SECTION */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            <div className="lg:col-span-6 space-y-6">
              <span className="text-emerald-700 font-bold text-sm tracking-wider uppercase bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                {t('landing.whyChoose.tag', 'Why Choose KrishiSaathi')}
              </span>
              <h2 className="text-3xl sm:text-4xl font-black text-stone-900 leading-tight">
                {t('landing.whyChoose.title', 'Built for Farmers, Rooted in Agricultural Realities')}
              </h2>
              <p className="text-stone-600 text-base leading-relaxed">
                {t('landing.whyChoose.subtitle', 'Generic agricultural software often gives theoretical recommendations in complex units. KrishiSaathi translates soil data into practical bags per acre, saving costs and preserving long-term soil health.')}
              </p>

              <div className="space-y-4 pt-2">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-stone-900">{t('landing.whyChoose.point1Title', 'Practical Bag Dosages')}</h4>
                    <p className="text-sm text-stone-600">{t('landing.whyChoose.point1Desc', 'Calculates exact commercial fertilizer bags (45 kg Urea, 50 kg DAP) per acre directly tailored to your plot size.')}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-stone-900">{t('landing.whyChoose.point2Title', 'Preserves Soil Fertility')}</h4>
                    <p className="text-sm text-stone-600">{t('landing.whyChoose.point2Desc', 'Recommends organic carbon enhancements (FYM and green manure) alongside chemical fertilizers to rebuild soil biology.')}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-stone-900">{t('landing.whyChoose.point3Title', 'Zero Literacy Barrier')}</h4>
                    <p className="text-sm text-stone-600">{t('landing.whyChoose.point3Desc', 'Voice-guided AI allows farmers to speak their doubts and receive spoken audio replies.')}</p>
                  </div>
                </div>
              </div>

              <div className="pt-4">
                <Link
                  to="/soil-analysis"
                  className="px-6 py-3.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm inline-flex items-center gap-2 transition"
                >
                  <span>{t('landing.whyChoose.viewSample', 'View Sample Analysis')}</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            {/* Testimonials */}
            <div className="lg:col-span-6 space-y-4">
              <div className="bg-emerald-50/70 rounded-3xl p-6 border border-emerald-200/80">
                <p className="text-stone-800 text-sm sm:text-base italic leading-relaxed mb-4">
                  {t('landing.testimonials.quote1', '"Previously, we used to apply 4 bags of urea per acre indiscriminately. When we scanned our soil card with KrishiSaathi, we discovered our potash was already high and nitrogen was lacking. We saved ₹4,200 on inputs and saw higher wheat yields!"')}
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-emerald-700 text-white flex items-center justify-center font-bold text-base">
                    G
                  </div>
                  <div>
                    <h5 className="font-bold text-stone-900">{t('landing.testimonials.author1', 'Gurpreet Singh')}</h5>
                    <p className="text-xs text-stone-500">{t('landing.testimonials.role1', 'Ludhiana, Punjab • 12 Acres')}</p>
                  </div>
                </div>
              </div>

              <div className="bg-amber-50/70 rounded-3xl p-6 border border-amber-200/80">
                <p className="text-stone-800 text-sm sm:text-base italic leading-relaxed mb-4">
                  {t('landing.testimonials.quote2', '"Using the voice assistant in my regional language made everything straightforward. The app identified acute zinc deficiency in my black soil before cotton sowing, and the recommended spray saved our harvest."')}
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-amber-700 text-white flex items-center justify-center font-bold text-base">
                    S
                  </div>
                  <div>
                    <h5 className="font-bold text-stone-900">{t('landing.testimonials.author2', 'Suresh Patil')}</h5>
                    <p className="text-xs text-stone-500">{t('landing.testimonials.role2', 'Baramati, Maharashtra • 6 Acres')}</p>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* CTA Bottom Banner */}
      <section className="py-16 bg-gradient-to-r from-emerald-800 to-green-950 text-white text-center">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-3xl sm:text-4xl font-black mb-4">
            {t('landing.bottomCta.title', 'Understand Your Soil & Maximize Yield Today')}
          </h2>
          <p className="text-emerald-100 text-base sm:text-lg mb-8 max-w-2xl mx-auto">
            {t('landing.bottomCta.subtitle', 'Experience the power of precision agronomy with KrishiSaathi.')}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/register"
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-amber-400 hover:bg-amber-500 text-stone-950 font-black text-lg transition shadow-xl"
            >
              {t('landing.bottomCta.registerBtn', 'Register Free Account')}
            </Link>
            <button
              onClick={() => setIsUploadModalOpen(true)}
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/30 text-white font-bold text-lg transition"
            >
              {t('landing.ctaUpload', 'Upload Soil Report')}
            </button>
          </div>
        </div>
      </section>

    </div>
  );
}
