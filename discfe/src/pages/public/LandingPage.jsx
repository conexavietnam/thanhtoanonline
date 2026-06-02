import Navbar from "../../components/common/Navbar.jsx";
import Footer from "../../components/common/Footer.jsx";
import LandingPageLegacy from "./LandingPageLegacy.jsx";
import DiscTestPage from "../user/DiscTestPage.jsx";

const LandingPage = () => (
  <div className="flex min-h-screen flex-col bg-gradient-to-b from-base-100 to-base-200">
    <Navbar />
    <main className="flex-1">
      <LandingPageLegacy />
      <section id="lam-bai-test" className="border-t border-base-200/70 bg-base-100/80 py-20">
        <div className="container mx-auto px-4">
          <div className="mx-auto mb-10 max-w-3xl space-y-4 text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary">
              Làm Bài Test Ngay
            </p>
            <h2 className="text-3xl font-bold text-base-content sm:text-5xl">
              Vào trang chủ là có thể bắt đầu bài test DISC miễn phí.
            </h2>
            <p className="text-base leading-8 text-base-content/70 sm:text-lg">
              Người dùng không cần rời khỏi trang chủ. Chọn bài free để làm ngay, hoặc đăng nhập
              nếu muốn mở tiếp bản phân tích trả phí.
            </p>
          </div>
          <DiscTestPage embedded />
        </div>
      </section>
    </main>
    <Footer />
  </div>
);

export default LandingPage;
