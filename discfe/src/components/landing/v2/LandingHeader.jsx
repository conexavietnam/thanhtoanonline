
import { Link, NavLink } from "react-router";
import { useAuth } from "../../../context/AuthContext.jsx";
import { useBranding } from "../../../context/BrandingContext.jsx";
import { useSettings } from "../../../context/SettingsContext.jsx";
import { useState, useEffect } from "react";

const LandingHeader = () => {
    const { isAuthenticated, user } = useAuth();
    const { customization } = useBranding();
    const { settings } = useSettings();
    const [scrolled, setScrolled] = useState(false);

    // Prioritize brandName from BrandingContext
    const brandName = customization?.brandName || settings?.siteName || "DISC Insight";
    const logoUrl = customization?.logoUrl || settings?.logoUrl || "/logo.png";

    // Handle scroll effect
    useEffect(() => {
        const handleScroll = () => {
            const isScrolled = window.scrollY > 20;
            setScrolled(isScrolled);
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const scrollToSection = (e, sectionId) => {
        e.preventDefault();
        const element = document.getElementById(sectionId);
        if (element) {
            // Adjust offset for fixed header
            const headerOffset = 80;
            const elementPosition = element.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

            window.scrollTo({
                top: offsetPosition,
                behavior: "smooth"
            });
        }
    };

    const navLinks = [
        { id: "problems", label: "Vấn đề" },
        { id: "solution", label: "Giải pháp" },
        { id: "benefits", label: "Lợi ích" },
        { id: "curriculum", label: "Lộ trình" },
        { id: "testimonials", label: "Đánh giá" },
    ];

    return (
        <header
            className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled
                ? "bg-white/80 backdrop-blur-2xl shadow-sm border-b border-gray-200/50 py-3"
                : "bg-transparent py-6"
                }`}
        >
            <div className="container mx-auto px-6 h-full flex items-center justify-between">
                {/* Logo */}
                <Link to="/" className="flex items-center gap-2.5 group relative z-50">
                    <div className="relative">
                        <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        <img src={logoUrl} alt={brandName} className="relative h-9 w-auto object-contain" />
                    </div>
                    <span className={`text-xl font-bold tracking-tight transition-colors duration-300 ${scrolled ? "text-gray-900" : "text-white"
                        }`}>
                        {brandName}
                    </span>
                </Link>

                {/* Desktop Navigation */}
                <nav className={`hidden lg:flex items-center gap-8 ${scrolled ? "" : ""
                    }`}>
                    {navLinks.map((link) => (
                        <a
                            key={link.id}
                            href={`#${link.id}`}
                            onClick={(e) => scrollToSection(e, link.id)}
                            className="group relative px-1 py-2 text-[15px] font-medium transition-colors"
                        >
                            <span className={`relative z-10 transition-colors duration-300 ${scrolled ? "text-gray-600 group-hover:text-primary" : "text-white/90 group-hover:text-white"
                                }`}>
                                {link.label}
                            </span>
                            <span className={`absolute bottom-0 left-0 w-0 h-0.5 rounded-full transition-all duration-300 group-hover:w-full opacity-100 ${scrolled ? "bg-primary" : "bg-white"
                                }`}></span>
                        </a>
                    ))}
                </nav>

                {/* Right Actions */}
                <div className="flex items-center gap-4">
                    {isAuthenticated ? (
                        <Link
                            to="/dashboard"
                            className="btn btn-primary rounded-full px-6 min-h-[44px] h-[44px] shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:-translate-y-0.5 border-none bg-gradient-to-r from-primary to-primary/90 transition-all duration-300 font-semibold text-white tracking-wide"
                        >
                            Dashboard
                        </Link>
                    ) : (
                        <>
                            <div className="hidden md:flex items-center gap-4">
                                <Link
                                    to="/login"
                                    className={`font-semibold transition-colors hover:text-primary ${scrolled ? "text-gray-700" : "text-white hover:text-white/80"}`}
                                >
                                    Đăng nhập
                                </Link>
                                <span className={`w-px h-4 ${scrolled ? "bg-gray-300" : "bg-white/30"}`}></span>
                                <Link
                                    to="/register"
                                    className={`font-semibold transition-colors hover:text-primary ${scrolled ? "text-gray-700" : "text-white hover:text-white/80"}`}
                                >
                                    Đăng ký
                                </Link>
                            </div>
                            <Link
                                to="/test"
                                className="btn btn-primary rounded-full px-6 min-h-[44px] h-[44px] shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:-translate-y-0.5 border-none bg-gradient-to-r from-primary to-primary/90 transition-all duration-300 font-semibold text-white tracking-wide"
                            >
                                Làm Test Ngay
                            </Link>
                        </>
                    )}

                    {/* Mobile Menu Button - Styled */}
                    <div className="dropdown dropdown-end lg:hidden ml-2">
                        <div tabIndex={0} role="button" className={`btn btn-circle btn-ghost ${scrolled ? "text-gray-900" : "text-white"}`}>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 6h16M4 12h16M4 18h7" />
                            </svg>
                        </div>
                        <ul tabIndex={0} className="menu menu-lg dropdown-content mt-4 z-[100] p-4 shadow-2xl bg-white/95 backdrop-blur-2xl rounded-3xl w-72 border border-gray-100 origin-top-right transform transition-all duration-200">
                            {navLinks.map((link) => (
                                <li key={link.id}>
                                    <a onClick={(e) => {
                                        scrollToSection(e, link.id);
                                    }} className="font-semibold text-gray-700 active:bg-primary/5 active:text-primary rounded-xl py-3 px-4">
                                        {link.label}
                                    </a>
                                </li>
                            ))}
                            <div className="divider my-2"></div>
                            <li><Link to="/login" className="font-semibold text-gray-700 active:text-primary rounded-xl py-3 px-4">Đăng nhập</Link></li>
                            <li><Link to="/register" className="font-semibold text-white bg-primary hover:bg-primary/90 rounded-xl py-3 px-4 mt-2">Đăng ký</Link></li>
                        </ul>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default LandingHeader;
