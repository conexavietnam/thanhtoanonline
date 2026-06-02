import { createContext, useContext, useEffect, useState, useCallback } from "react";
import api from "../lib/api.js";

const BrandingContext = createContext(null);

export const BrandingProvider = ({ children }) => {
  const [customization, setCustomization] = useState(null);
  const [loading, setLoading] = useState(true);

  const getDomain = () => {
    if (typeof window === "undefined") return null;
    return window.location.hostname;
  };

  const loadBranding = useCallback(async () => {
    const domain = getDomain();
    if (!domain) {
      setLoading(false);
      return;
    }

    try {
      const { data } = await api.get("/public/branding/by-domain", {
        params: { domain },
      });
      setCustomization(data);
      applyBranding(data);
    } catch (error) {
      // Nếu không tìm thấy customization, sử dụng mặc định
      setCustomization(null);
      resetBranding();
    } finally {
      setLoading(false);
    }
  }, []);

  const applyBranding = (branding) => {
    if (!branding || !branding.active) {
      resetBranding();
      return;
    }

    const root = document.documentElement;
    
    // Không áp dụng màu sắc từ partner nữa - màu sắc được quản lý trong Settings
    // Chỉ áp dụng logo và brand name

    // Áp dụng logo nếu có
    if (branding.logoUrl) {
      root.style.setProperty("--brand-logo-url", `url(${branding.logoUrl})`);
    }

    // Lưu brand name
    if (branding.brandName) {
      document.title = branding.brandName;
    }
  };

  const resetBranding = () => {
    const root = document.documentElement;
    
    // Chỉ xóa màu nếu không có màu từ Settings
    // SettingsContext sẽ tự quản lý màu sắc của nó
    // Chỉ xóa logo và các thuộc tính khác của partner
    root.style.removeProperty("--brand-logo-url");
    
    // Không reset title ở đây, để SettingsContext quản lý title
    // Không reset màu sắc vì SettingsContext sẽ quản lý
  };

  // Tính màu tương phản (đen hoặc trắng)
  const getContrastColor = (hexColor) => {
    // Nếu là màu sáng -> dùng đen, nếu là màu tối -> dùng trắng
    const r = parseInt(hexColor.slice(1, 3), 16);
    const g = parseInt(hexColor.slice(3, 5), 16);
    const b = parseInt(hexColor.slice(5, 7), 16);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness > 128 ? "#000000" : "#ffffff";
  };

  useEffect(() => {
    loadBranding();
    
    // Reload khi domain thay đổi (nếu cần)
    const handleLocationChange = () => {
      loadBranding();
    };
    
    // Lắng nghe popstate event cho SPA navigation
    window.addEventListener("popstate", handleLocationChange);
    
    return () => {
      window.removeEventListener("popstate", handleLocationChange);
    };
  }, [loadBranding]);

  const value = {
    customization,
    loading,
    reload: loadBranding,
  };

  return <BrandingContext.Provider value={value}>{children}</BrandingContext.Provider>;
};

export const useBranding = () => {
  const context = useContext(BrandingContext);
  if (!context) {
    throw new Error("useBranding must be used within a BrandingProvider");
  }
  return context;
};
