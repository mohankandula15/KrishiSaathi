import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  FlaskConical, 
  Sprout, 
  Calculator, 
  Bot, 
  MapPin, 
  Settings, 
  UploadCloud, 
  LogOut, 
  X,
  FileText,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSoil } from '../context/SoilContext';

export default function DashboardSidebar({ mobileOpen, setMobileOpen }) {
  const { user, logout } = useAuth();
  const { activeReport, setIsUploadModalOpen } = useSoil();
  const navigate = useNavigate();

  const farmerName = user?.name || "Ramesh Kumar";
  const initials = farmerName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || "RK";
  const farmLocation = `${user?.village || "Kila Raipur"}, ${user?.district || "Ludhiana"}`;

  const navItems = [
    { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
    { name: "Soil Analysis", path: "/soil-analysis", icon: FlaskConical },
    { name: "Crop Recommendations", path: "/crop-recommendations", icon: Sprout },
    { name: "Fertilizer Calculator", path: "/fertilizer-calculator", icon: Calculator },
    { name: "AI Voice Assistant", path: "/ai-assistant", icon: Bot, badge: "AI" },
    { name: "My Farm", path: "/my-farm", icon: MapPin },
    { name: "Settings", path: "/settings", icon: Settings },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white border-r border-[#E2EBE2] text-[#26332B]">
      
      {/* Brand Header */}
      <div className="p-6 border-b border-[#E2EBE2] flex items-center justify-between">
        <NavLink to="/dashboard" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-[#245C3A] text-white flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
            <Sprout className="w-6 h-6 text-emerald-100" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xl font-black tracking-tight text-[#245C3A]">
                Krishi<span className="text-[#26332B]">Saathi</span>
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider bg-[#E8F0E7] text-[#245C3A] px-1.5 py-0.5 rounded border border-[#D4E3D3]">
                SaaS
              </span>
            </div>
            <p className="text-[11px] font-medium text-[#5C6E63] tracking-tight">
              Farm & Soil Intelligence
            </p>
          </div>
        </NavLink>

        {/* Mobile close button */}
        {mobileOpen && (
          <button 
            onClick={() => setMobileOpen(false)}
            className="md:hidden p-2 rounded-xl text-[#5C6E63] hover:bg-[#F2F7F1] transition"
            aria-label="Close Sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Main Navigation Links */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-1.5">
        <div className="px-3 pb-2 text-[11px] font-bold uppercase tracking-wider text-[#5C6E63]">
          Platform Navigation
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) => `
                flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150
                ${isActive 
                  ? 'bg-[#E8F0E7] text-[#245C3A] font-bold border-l-4 border-[#245C3A] shadow-xs' 
                  : 'text-[#5C6E63] hover:text-[#26332B] hover:bg-[#F2F7F1]'
                }
              `}
            >
              <div className="flex items-center gap-3">
                <Icon className="w-5 h-5 shrink-0" />
                <span>{item.name}</span>
              </div>
              {item.badge && (
                <span className="text-[10px] font-black bg-[#245C3A] text-white px-1.5 py-0.5 rounded tracking-wider">
                  {item.badge}
                </span>
              )}
            </NavLink>
          );
        })}

        {/* Active Soil Health Card Widget in Sidebar */}
        <div className="mt-6 pt-6 border-t border-[#E2EBE2]">
          <div className="px-3 pb-2 text-[11px] font-bold uppercase tracking-wider text-[#5C6E63] flex items-center justify-between">
            <span>Active Soil Card</span>
            <ShieldCheck className="w-3.5 h-3.5 text-[#245C3A]" />
          </div>

          <div className="p-3.5 rounded-2xl bg-[#F8FAF7] border border-[#E2EBE2] hover:border-[#245C3A]/40 transition">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-black text-[#26332B] truncate max-w-[130px]">
                {activeReport?.id || "SHC-Active"}
              </span>
              <span className="text-[10px] font-bold bg-[#E8F0E7] text-[#245C3A] px-2 py-0.5 rounded-full">
                {activeReport?.healthScore || 74}/100 Score
              </span>
            </div>
            <p className="text-[11px] text-[#5C6E63] truncate mb-2.5">
              {activeReport?.title || "Field Report"}
            </p>
            <NavLink
              to="/soil-analysis"
              onClick={() => setMobileOpen(false)}
              className="text-xs font-bold text-[#245C3A] hover:underline flex items-center gap-1"
            >
              <span>View Full Diagnosis</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </NavLink>
          </div>
        </div>

        {/* Upload Action in Sidebar */}
        <div className="pt-3">
          <button
            type="button"
            onClick={() => {
              setMobileOpen(false);
              setIsUploadModalOpen(true);
            }}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-[#245C3A] hover:bg-[#1B462C] text-white text-xs font-bold shadow-xs hover:shadow-md transition active:scale-98 cursor-pointer"
          >
            <UploadCloud className="w-4 h-4 text-emerald-100" />
            <span>Upload Soil Report</span>
          </button>
        </div>
      </div>

      {/* Farmer Profile & Logout Footer */}
      <div className="p-4 border-t border-[#E2EBE2] bg-[#F8FAF7]">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-full bg-[#245C3A] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-[#26332B] truncate">
                {farmerName}
              </p>
              <p className="text-[11px] text-[#5C6E63] truncate">
                {farmLocation}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            title="Log out"
            className="p-2 rounded-xl text-[#5C6E63] hover:text-red-700 hover:bg-red-50 transition cursor-pointer"
            aria-label="Log Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden md:block w-64 lg:w-72 shrink-0 h-screen sticky top-0 z-30">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div 
            className="fixed inset-0 bg-stone-900/50 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative w-72 max-w-[85vw] h-full shadow-2xl z-10 animate-in slide-in-from-left duration-200">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}
