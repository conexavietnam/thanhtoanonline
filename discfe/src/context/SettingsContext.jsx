import { createContext, useContext, useEffect, useState, useCallback } from "react";
import axios from "axios";
import { API_BASE_URL, buildAssetUrl } from "../lib/api.js";
import { DEFAULT_COMPANY_INFO } from "../constants/companyInfo.js";
import { cloneHomepageSlides } from "../constants/homepageSlides.js";

const SettingsContext = createContext(null);
const DEFAULT_SITE_NAME = "ticavi.vn";
// Quốc Trí: keep the fallback brand name in one place so unauthenticated pages stay consistent before settings load.

export const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState({
    siteName: DEFAULT_SITE_NAME,
    siteDescription: "Hệ thống đánh giá DISC",
    primaryColor: null,
    secondaryColor: null,
    logoUrl: null,
    customHomepageHtml: null,
    footerDescription: null,
    companyName: DEFAULT_COMPANY_INFO.companyName,
    companyAddress: DEFAULT_COMPANY_INFO.companyAddress,
    contactPhone: DEFAULT_COMPANY_INFO.contactPhone,
    contactZalo: DEFAULT_COMPANY_INFO.contactZalo,
    contactEmail: null,
    socialFacebook: null,
    socialYoutube: null,
    homepageSlides: [],
    landingPageConfig: {},
  });
  const [loading, setLoading] = useState(true);

  // Tính màu tương phản (đen hoặc trắng)
  const getContrastColor = (hexColor) => {
    if (!hexColor) return "#ffffff";
    const r = parseInt(hexColor.slice(1, 3), 16);
    const g = parseInt(hexColor.slice(3, 5), 16);
    const b = parseInt(hexColor.slice(5, 7), 16);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness > 128 ? "#000000" : "#ffffff";
  };

  // Áp dụng màu sắc từ settings
  const applyColors = useCallback((primaryColor, secondaryColor) => {
    const root = document.documentElement;

    if (primaryColor) {
      root.style.setProperty("--brand-primary-color", primaryColor);
      root.style.setProperty("--color-primary", primaryColor);

      const primaryContent = getContrastColor(primaryColor);
      root.style.setProperty("--brand-primary-content-color", primaryContent);
      root.style.setProperty("--color-primary-content", primaryContent);
    } else {
      // Reset về mặc định nếu không có màu
      root.style.removeProperty("--brand-primary-color");
      root.style.removeProperty("--color-primary");
      root.style.removeProperty("--brand-primary-content-color");
      root.style.removeProperty("--color-primary-content");
    }

    if (secondaryColor) {
      root.style.setProperty("--brand-secondary-color", secondaryColor);
      root.style.setProperty("--color-secondary", secondaryColor);

      const secondaryContent = getContrastColor(secondaryColor);
      root.style.setProperty("--brand-secondary-content-color", secondaryContent);
      root.style.setProperty("--color-secondary-content", secondaryContent);
    } else {
      // Reset về mặc định nếu không có màu
      root.style.removeProperty("--brand-secondary-color");
      root.style.removeProperty("--color-secondary");
      root.style.removeProperty("--brand-secondary-content-color");
      root.style.removeProperty("--color-secondary-content");
    }
  }, []);

  const loadSettings = useCallback(async () => {
    try {
      // Tạo một axios instance riêng không có interceptor để gọi public endpoint
      const publicApi = axios.create({
        baseURL: API_BASE_URL,
        headers: {
          "Content-Type": "application/json",
        },
      });

      const { data } = await publicApi.get("/public/settings/general");

      const newSiteName = data.siteName || DEFAULT_SITE_NAME;
      const newSiteDescription = data.siteDescription || "Hệ thống đánh giá DISC";
      const newPrimaryColor = data.primaryColor || null;
      const newSecondaryColor = data.secondaryColor || null;
      const newCustomHomepageHtml = data.customHomepageHtml || null;

      const newFooterDescription = data.footerDescription || null;
      const newCompanyName = data.companyName || DEFAULT_COMPANY_INFO.companyName;
      const newCompanyAddress = data.companyAddress || DEFAULT_COMPANY_INFO.companyAddress;
      const newContactPhone = data.contactPhone || DEFAULT_COMPANY_INFO.contactPhone;
      const newContactZalo = data.contactZalo || DEFAULT_COMPANY_INFO.contactZalo;
      const newContactEmail = data.contactEmail || null;
      const newSocialFacebook = data.socialFacebook || null;
      const newSocialYoutube = data.socialYoutube || null;
      const newHomepageSlides = Array.isArray(data.homepageSlides)
        ? data.homepageSlides
        : cloneHomepageSlides();
      const newLandingPageConfig = data.landingPageConfig || {};
      const newLogoUrl = buildAssetUrl(data.logoUrl) || null;

      setSettings({
        siteName: newSiteName,
        siteDescription: newSiteDescription,
        primaryColor: newPrimaryColor,
        secondaryColor: newSecondaryColor,
        logoUrl: newLogoUrl,
        customHomepageHtml: newCustomHomepageHtml,
        footerDescription: newFooterDescription,
        companyName: newCompanyName,
        companyAddress: newCompanyAddress,
        contactPhone: newContactPhone,
        contactZalo: newContactZalo,
        contactEmail: newContactEmail,
        socialFacebook: newSocialFacebook,
        socialYoutube: newSocialYoutube,
        homepageSlides: newHomepageSlides,
        landingPageConfig: newLandingPageConfig,
      });

      // Áp dụng màu sắc từ settings (ưu tiên hơn partner branding)
      applyColors(newPrimaryColor, newSecondaryColor);

      // Cập nhật document title
      // BrandingContext sẽ override title nếu có branding (nó chạy sau SettingsContext)
      // Nếu title hiện tại là mặc định hoặc là siteName cũ, thì update
      const currentTitle = document.title;
      if (newSiteName && (currentTitle === DEFAULT_SITE_NAME || currentTitle === settings.siteName)) {
        document.title = newSiteName;
      }
    } catch (error) {
      console.error("Failed to load settings:", error);
      // Giữ giá trị mặc định nếu không load được
    } finally {
      setLoading(false);
    }
  }, [settings.siteName, applyColors]);

  useEffect(() => {
    loadSettings();

    // Reload settings mỗi 5 phút để cập nhật nếu có thay đổi
    const interval = setInterval(loadSettings, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [loadSettings]);

  /* Dark Mode Logic */
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "light");

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  }, []);

  const value = {
    settings,
    loading,
    reload: loadSettings,
    theme,
    toggleTheme,
  };

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return context;
};
