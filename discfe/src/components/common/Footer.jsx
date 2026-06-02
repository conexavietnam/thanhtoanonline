import { useSettings } from "../../context/SettingsContext.jsx";
import { Link } from "react-router";
import { DEFAULT_COMPANY_INFO } from "../../constants/companyInfo.js";

const normalizeExternalUrl = (value) => {
  if (!value || typeof value !== "string") return "";

  const trimmed = value.trim();
  if (!trimmed || trimmed === "#") return "";

  try {
    return new URL(trimmed.startsWith("http") ? trimmed : `https://${trimmed}`).toString();
  } catch {
    return "";
  }
};

const Footer = () => {
  const { settings } = useSettings();
  const siteName = settings?.siteName || "DISCWAKE";
  const logoUrl = settings?.logoUrl || "/logo.png";
  const companyName = settings?.companyName || DEFAULT_COMPANY_INFO.companyName;
  const companyAddress = settings?.companyAddress || DEFAULT_COMPANY_INFO.companyAddress;
  const description = settings?.footerDescription || "Nền tảng đánh giá tính cách DISC hàng đầu Việt Nam. Giúp bạn thấu hiểu bản thân và định hướng sự nghiệp.";
  const phone = settings?.contactPhone || DEFAULT_COMPANY_INFO.contactPhone;
  const zalo = settings?.contactZalo || DEFAULT_COMPANY_INFO.contactZalo;
  const email = settings?.contactEmail || "";
  const facebookUrl = normalizeExternalUrl(settings?.socialFacebook);
  const youtubeUrl = normalizeExternalUrl(settings?.socialYoutube);

  // Quốc Trí: chỉ giữ các link public đang có route thật để footer không đẩy người dùng sang trang 404.
  const navigationLinks = [
    { to: "/about", label: "Giới thiệu" },
    { to: "/plans", label: "Mua gói DISC" },
    { to: "/test", label: "Làm bài test" },
    { to: "/contact", label: "Liên hệ" },
  ];

  return (
    <footer className="bg-base-100 border-t border-base-200">
      <div className="container mx-auto px-4 py-16">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-4">
            <h3 className="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent inline-block">
              <img src={logoUrl} alt={siteName} className="h-10 w-auto object-contain" />
            </h3>
            <p className="text-sm font-semibold text-base-content max-w-sm">
              {companyName}
            </p>
            <p className="text-base-content/70 text-sm leading-relaxed max-w-xs">
              {description}
            </p>
            <p className="text-base-content/60 text-sm leading-relaxed max-w-xs">
              {companyAddress}
            </p>
            <div className="flex gap-4 pt-2">
              {facebookUrl && (
                <a href={facebookUrl} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-base-200 flex items-center justify-center hover:bg-primary hover:text-white transition-all">
                  <span className="sr-only">Facebook</span>
                  <svg fill="currentColor" className="w-5 h-5" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>
                </a>
              )}
              {youtubeUrl && (
                <a href={youtubeUrl} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-base-200 flex items-center justify-center hover:bg-primary hover:text-white transition-all">
                  <span className="sr-only">Youtube</span>
                  <svg fill="currentColor" className="w-5 h-5" viewBox="0 0 24 24"><path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" /></svg>
                </a>
              )}
            </div>
          </div>

          <div>
            <h4 className="font-bold text-base-content mb-4">Điều hướng</h4>
            <ul className="space-y-2 text-sm">
              {navigationLinks.map((item) => (
                <li key={item.to}>
                  <Link to={item.to} className="text-base-content/70 hover:text-primary transition-colors">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-base-content mb-4">Hỗ trợ</h4>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2 text-base-content/70 mt-4">
                <span>📞</span> <span>{phone}</span>
              </li>
              <li className="flex items-center gap-2 text-base-content/70">
                <span>Z</span> <span>{zalo}</span>
              </li>
              {email && (
                <li className="flex items-center gap-2 text-base-content/70">
                  <span>✉️</span> <span>{email}</span>
                </li>
              )}
              <li className="flex items-start gap-2 text-base-content/70">
                <span>📍</span> <span>{companyAddress}</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-16 pt-8 border-t border-base-200 text-center text-sm text-base-content/60">
          <p>© {new Date().getFullYear()} {siteName}. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
