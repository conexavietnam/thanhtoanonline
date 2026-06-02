import { NavLink, Outlet, useNavigate } from "react-router";
import { useAuth } from "../../context/AuthContext";
import { useBranding } from "../../context/BrandingContext";
import { useSettings } from "../../context/SettingsContext";

const AgentLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { customization } = useBranding();
  const { settings } = useSettings();
  
  const logoUrl = customization?.logoUrl || settings?.logoUrl || "/logo.png";
  const brandName = customization?.brandName || settings?.siteName || "DISC Agent";

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleBackToDashboard = () => {
    navigate('/');
  };

  const menuItems = [
    { to: "/agent", label: "Tổng quan", end: true, icon: "📊" },
  ];

  const SidebarContent = () => (
    <>
      <div className="flex items-center justify-center h-20 bg-gradient-to-r from-green-600 via-green-700 to-emerald-700 shadow-lg">
        <div className="flex items-center justify-center gap-3 px-4">
          <img 
            src={logoUrl} 
            alt={brandName} 
            className="h-10 w-auto object-contain max-w-[120px]"
          />
          <div className="text-center">
            <h1 className="text-xl font-bold text-white">{brandName}</h1>
            <p className="text-xs text-green-100 mt-0.5">Tổng quan Agent</p>
          </div>
        </div>
      </div>

      <div className="p-5 bg-gradient-to-br from-gray-50 to-gray-100 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="avatar placeholder">
            <div className="bg-green-500 text-white rounded-full w-12 h-12 flex items-center justify-center">
              <span className="text-lg font-bold">
                {(user?.fullName || user?.email || 'A')[0].toUpperCase()}
              </span>
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-900 truncate text-sm">
              {user?.fullName || user?.email || 'Agent'}
            </p>
            <span className="badge badge-xs bg-green-100 text-green-700 border-0">Đại lý</span>
          </div>
        </div>
      </div>
      
      <nav className="flex-1 overflow-y-auto p-4 space-y-1 bg-white">
        {menuItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-all duration-200 ${
                isActive 
                  ? "bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-md shadow-green-500/50 scale-[1.02]" 
                  : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
              }`
            }
          >
            <span className="text-xl flex-shrink-0">{item.icon}</span>
            <span className="flex-1">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-gray-200 bg-gray-50 space-y-2">
        <button 
          onClick={handleBackToDashboard}
          className="btn btn-sm btn-ghost w-full justify-start gap-2 text-gray-700 hover:bg-gray-200"
        >
          <span>🏠</span>
          <span>Về Tổng quan</span>
        </button>
        <button 
          onClick={handleLogout}
          className="btn btn-sm btn-error w-full justify-start gap-2 text-white hover:bg-red-600"
        >
          <span>🚪</span>
          <span>Đăng xuất</span>
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="hidden lg:flex min-h-screen">
        <aside className="flex flex-col w-72 fixed inset-y-0 z-50 bg-white border-r border-gray-200 shadow-lg">
          <SidebarContent />
        </aside>
        <div className="flex-1 w-full ml-72">
          <div className="min-h-screen bg-gray-50">
            <div className="p-6 lg:p-8">
              <Outlet />
            </div>
          </div>
        </div>
      </div>

      <div className="drawer lg:hidden">
        <input id="agent-drawer" type="checkbox" className="drawer-toggle" />
        <div className="drawer-content flex flex-col">
          <div className="w-full navbar bg-white shadow-md sticky top-0 z-30">
            <div className="flex-none">
              <label htmlFor="agent-drawer" className="btn btn-square btn-ghost">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="inline-block w-6 h-6 stroke-current">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path>
                </svg>
              </label>
            </div>
            <div className="flex-1 px-2 mx-2 font-bold text-gray-800 flex items-center gap-2">
              {logoUrl ? (
                <img 
                  src={logoUrl} 
                  alt={brandName} 
                  className="h-6 w-auto object-contain"
                />
              ) : (
                <span>🏢</span>
              )}
              <span>{brandName}</span>
            </div>
            <div className="flex-none">
              <button onClick={handleLogout} className="btn btn-ghost btn-sm">Đăng xuất</button>
            </div>
          </div>
          
          <div className="flex-1 p-4 bg-gray-50">
            <Outlet />
          </div>
        </div>

        <div className="drawer-side z-50">
          <label htmlFor="agent-drawer" aria-label="close sidebar" className="drawer-overlay"></label>
          <aside className="bg-white w-72 min-h-full flex flex-col border-r border-gray-200">
            <SidebarContent />
          </aside>
        </div>
      </div>
    </div>
  );
};

export default AgentLayout;
