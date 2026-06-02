import { Link } from "react-router";
import { motion } from "framer-motion";

const HeroSection = ({ config }) => {
  const badgeText = config?.badgeText || "DISC SaaS Platform #1 Việt Nam";
  const title = config?.title || "Thấu hiểu bản thân";
  const highlightedText = config?.highlightedText || "Định hướng tương lai";
  const description = config?.description || "Khám phá tiềm năng của bạn qua bài trắc nghiệm DISC chuẩn quốc tế. Nhận báo cáo chi tiết về tính cách, nghề nghiệp phù hợp và lộ trình phát triển.";
  const primaryCtaText = config?.primaryCtaText || "Làm bài test miễn phí";
  const secondaryCtaText = config?.secondaryCtaText || "Xem các gói dịch vụ";

  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden py-20">
      {/* Background Blobs */}
      <div className="absolute top-0 -left-40 w-96 h-96 bg-primary/20 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob"></div>
      <div className="absolute top-0 -right-40 w-96 h-96 bg-secondary/20 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000"></div>
      <div className="absolute -bottom-40 left-20 w-96 h-96 bg-accent/20 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-4000"></div>

      <div className="container mx-auto px-4 z-10 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-4xl mx-auto space-y-8"
        >
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/50 backdrop-blur border border-white/60 text-primary text-sm font-semibold shadow-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            {badgeText}
          </span>

          <h1 className="text-5xl md:text-7xl font-bold leading-tight tracking-tight text-base-content">
            {title} <br />
            <span className="text-gradient">{highlightedText}</span>
          </h1>

          <p className="text-xl text-base-content/70 max-w-2xl mx-auto leading-relaxed">
            {description}
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <a
              href="#lam-bai-test"
              className="btn btn-primary btn-lg rounded-full px-8 shadow-lg shadow-primary/20 hover:scale-105 transition-transform"
            >
              {primaryCtaText}
            </a>
            <Link
              to="/plans"
              className="btn btn-ghost btn-lg rounded-full px-8 hover:bg-white/50"
            >
              {secondaryCtaText}
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
            </Link>
          </div>

          <div className="pt-12 grid grid-cols-2 md:grid-cols-4 gap-8 opacity-80">
            <div>
              <p className="text-3xl font-bold text-primary">50k+</p>
              <p className="text-sm font-medium text-base-content/60">Người dùng</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-secondary">95%</p>
              <p className="text-sm font-medium text-base-content/60">Hài lòng</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-accent">20+</p>
              <p className="text-sm font-medium text-base-content/60">Đối tác</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-info">24/7</p>
              <p className="text-sm font-medium text-base-content/60">Hỗ trợ</p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;
