import { useEffect, useState } from "react";
import { Navigate, Outlet, useLocation } from "react-router";
import { useAuth } from "../../context/AuthContext.jsx";
import axios from "axios";
import { API_BASE_URL } from "../../lib/api.js";

const MaintenanceGuard = () => {
  const [isMaintenanceMode, setIsMaintenanceMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const location = useLocation();

  useEffect(() => {
    const checkMaintenanceMode = async () => {
      try {
        // Tạo một axios instance riêng không có interceptor để gọi public endpoint
        const publicApi = axios.create({
          baseURL: API_BASE_URL,
          headers: {
            "Content-Type": "application/json",
          },
        });
        
        const response = await publicApi.get("/public/settings/maintenance-mode");
        
        const maintenanceMode = response.data?.maintenanceMode || false;
        setIsMaintenanceMode(maintenanceMode);
      } catch (error) {
        console.error("Failed to check maintenance mode:", error);
        // Nếu không thể check, giả sử không có maintenance mode để tránh block toàn bộ
        setIsMaintenanceMode(false);
      } finally {
        setLoading(false);
      }
    };

    checkMaintenanceMode();
    
    // Check lại mỗi 30 giây để cập nhật trạng thái
    const interval = setInterval(checkMaintenanceMode, 30000);
    
    return () => clearInterval(interval);
  }, []);

  // Nếu đang loading, hiển thị loading spinner
  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <span className="loading loading-spinner loading-lg text-primary" />
      </div>
    );
  }

  // Nếu đang ở chế độ bảo trì
  if (isMaintenanceMode) {
    // Cho phép truy cập maintenance page
    if (location.pathname === "/maintenance") {
      return <Outlet />;
    }
    
    // Cho phép truy cập trang login để SUPER_ADMIN có thể đăng nhập
    if (location.pathname === "/login") {
      return <Outlet />;
    }
    
    // Cho phép SUPER_ADMIN truy cập admin routes ngay cả trong chế độ bảo trì
    const isAdminRoute = location.pathname.startsWith("/admin");
    const isSuperAdmin = user?.roles?.includes("SUPER_ADMIN");
    
    // Nếu là SUPER_ADMIN và đang ở trang admin, cho phép truy cập
    if (isAdminRoute && isSuperAdmin) {
      return <Outlet />;
    }
    
    // Tất cả các routes khác đều redirect đến maintenance page (kể cả trang chủ)
    return <Navigate to="/maintenance" replace />;
  }

  // Nếu không có maintenance mode hoặc đã được phép truy cập, render children
  return <Outlet />;
};

export default MaintenanceGuard;
