import { Link, NavLink, useLocation } from "react-router";
import { useAuth } from "../../context/AuthContext.jsx";
import { useBranding } from "../../context/BrandingContext.jsx";
import { useSettings } from "../../context/SettingsContext.jsx";
import { useState } from "react";
import AuthModal from "../landing/v2/AuthModal.jsx";

const navLinkClass = ({ isActive }) =>
  `px-3 py-2 text-sm font-medium transition-colors rounded-full hover:bg-primary/10 hover:text-primary ${isActive ? "text-primary" : "text-base-content/80"
  }`;

const Navbar = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const { customization } = useBranding();
  const { settings } = useSettings();
  const location = useLocation();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState("login");
  const isHomePage = location.pathname === "/";
  const useAuthModal = isHomePage || location.pathname.startsWith("/test");
  const isUserArea = location.pathname.startsWith("/dashboard") || location.pathname.startsWith("/test");
  const roles = user?.roles ?? [];
  const isPartner = roles.includes("PARTNER");
  const isAdmin = roles.some((role) => ["SUPER_ADMIN", "CONTENT_ADMIN", "FINANCE_ADMIN", "SUPPORT_ADMIN"].includes(role));

  // Ưu tiên brandName từ BrandingContext (cho partner customization), nếu không có thì dùng siteName từ Settings
  const brandName = customization?.brandName || settings?.siteName || "DISCWAKE";
  const brandLogo = customization?.logoUrl || settings?.logoUrl || "/logo.png";
  // Quốc Trí: keep one default logo fallback so the public header stays consistent when system settings are empty.

  const baseLinks = [
    { path: "/", label: "Trang chủ", end: true },
    { path: "/plans", label: "Bảng giá" },
  ];

  const standardDashboardLinks = [
    { path: "/dashboard", label: "Tổng quan", end: true },
    { path: "/test", label: "Làm bài test" },
    { path: "/dashboard/results", label: "Kết quả DISC" },
    { path: "/dashboard/my-orders", label: "Đơn hàng" },
    { path: "/dashboard/my-subscriptions", label: "Gói dịch vụ" },
  ];

  const partnerDashboardLinks = [
    { path: "/dashboard", label: "Tổng quan", end: true },
    { path: "/test", label: "Làm bài test" },
    { path: "/dashboard/results", label: "Kết quả DISC" },
    { path: "/dashboard/my-orders", label: "Lịch sử giao dịch" },
    { path: "/dashboard/partner", label: "Affiliate", end: false },
  ];

  const userAreaLinks = isPartner ? partnerDashboardLinks : standardDashboardLinks;

  const navLinks = isAuthenticated
    ? (isUserArea ? userAreaLinks : [...baseLinks, { path: "/dashboard", label: "Bảng điều khiển" }])
    : baseLinks;

  const openAuthModal = (mode = "login") => {
    setAuthMode(mode);
    setAuthModalOpen(true);
  };

  const closeAuthModal = () => setAuthModalOpen(false);

  return (
    <div className="sticky top-0 z-50 w-full glass-effect border-b border-white/10">
      <div className="navbar container mx-auto px-4 min-h-[4rem]">
        <div className="navbar-start">
          <div className="dropdown">
            <div tabIndex={0} role="button" className="btn btn-ghost lg:hidden hover:bg-white/10">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 6h16M4 12h8m-8 6h16"
                />
              </svg>
            </div>
            <ul
              tabIndex={0}
              className="menu menu-sm dropdown-content mt-3 z-[1] p-2 shadow-lg bg-base-100 rounded-box w-52 border border-base-200"
            >
              {navLinks.map((link) => (
                <li key={link.path}>
                  <NavLink
                    to={link.path}
                    end={link.end}
                    className={({ isActive }) => isActive ? "font-bold text-primary" : ""}
                  >
                    {link.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
          <Link to="/" className="flex items-center gap-2 group">
            <img src={brandLogo} alt={brandName} className="h-8 md:h-10 w-auto object-contain transition-transform group-hover:scale-105" />
            <span className="text-xl md:text-2xl font-bold bg-gradient-to-r from-base-content to-base-content/70 bg-clip-text text-transparent group-hover:text-primary transition-colors">
              {brandName}
            </span>
          </Link>
        </div>

        <div className="navbar-center hidden lg:flex">
          <ul className="menu menu-horizontal px-1 gap-1">
            {navLinks.map((link) => (
              <li key={link.path}>
                <NavLink
                  to={link.path}
                  end={link.end}
                  className={({ isActive }) =>
                    `rounded-full px-5 py-2 transition-all hover:bg-primary/10 hover:text-primary font-medium ${isActive
                      ? "bg-primary text-white shadow-md shadow-primary/30 hover:bg-primary hover:text-white"
                      : "text-base-content/80"
                    }`
                  }
                >
                  {link.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </div>

        <div className="navbar-end gap-3">
          {isAuthenticated ? (
            <div className="dropdown dropdown-end">
              <div tabIndex={0} role="button" className="btn btn-ghost btn-circle avatar ring-2 ring-primary/20 hover:ring-primary transition-all">
                <div className="w-10 rounded-full">
                  <img
                    alt="User Avatar"
                    src={user?.avatarUrl || "https://img.daisyui.com/images/stock/photo-1534528741775-53994a69daeb.webp"}
                  />
                </div>
              </div>
              <ul
                tabIndex={0}
                className="menu menu-sm dropdown-content mt-3 z-[1] p-2 shadow-xl bg-base-100 rounded-box w-52 border border-base-200"
              >
                <li className="menu-title px-4 py-2 border-b border-base-200 mb-2">
                  <span className="text-base-content font-bold truncate block">{user?.fullName || 'User'}</span>
                  <span className="text-xs font-normal opacity-70 block truncate">{user?.email}</span>
                </li>
                <li>
                  <Link to="/dashboard/profile" className="flex justify-between">
                    Hồ sơ
                    <span className="badge badge-sm badge-primary">New</span>
                  </Link>
                </li>
                <li><Link to="/settings">Cài đặt</Link></li>
                {user?.roles?.includes('SUPER_ADMIN') && (
                  <li className="border-t border-base-200 mt-1 pt-1">
                    <Link to="/admin" className="text-primary font-semibold">Trang quản trị</Link>
                  </li>
                )}
                <li className="mt-1">
                  <button onClick={logout} className="text-error hover:bg-error/10">Đăng xuất</button>
                </li>
              </ul>
            </div>
          ) : (
            <div className="flex gap-2">
              {useAuthModal ? (
                <>
                  <button
                    type="button"
                    onClick={() => openAuthModal("register")}
                    className="btn btn-ghost rounded-full hover:bg-base-200"
                  >
                    Đăng ký
                  </button>
                  <button
                    type="button"
                    onClick={() => openAuthModal("login")}
                    className="btn btn-ghost rounded-full hover:bg-base-200"
                  >
                    Đăng nhập
                  </button>
                  <Link to="/plans" className="btn btn-primary rounded-full px-6 shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-shadow">
                    Chọn gói
                  </Link>
                </>
              ) : (
                <>
                  <Link to="/register" className="btn btn-ghost rounded-full hover:bg-base-200">
                    Đăng ký
                  </Link>
                  <Link to="/login" className="btn btn-ghost rounded-full hover:bg-base-200">
                    Đăng nhập
                  </Link>
                  <Link to="/plans" className="btn btn-primary rounded-full px-6 shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-shadow">
                    Chọn gói
                  </Link>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {useAuthModal && (
        <AuthModal
          open={authModalOpen}
          mode={authMode}
          onClose={closeAuthModal}
          onSwitchMode={setAuthMode}
        />
      )}
    </div>
  );
};

export default Navbar;
