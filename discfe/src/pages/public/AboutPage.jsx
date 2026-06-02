import { useSettings } from "../../context/SettingsContext.jsx";
import { DEFAULT_COMPANY_INFO } from "../../constants/companyInfo.js";

const AboutPage = () => {
  const { settings } = useSettings();
  const siteName = settings?.siteName || "DISCWAKE";
  const companyName = settings?.companyName || DEFAULT_COMPANY_INFO.companyName;
  const companyAddress = settings?.companyAddress || DEFAULT_COMPANY_INFO.companyAddress;
  const contactPhone = settings?.contactPhone || DEFAULT_COMPANY_INFO.contactPhone;
  const contactZalo = settings?.contactZalo || DEFAULT_COMPANY_INFO.contactZalo;
  const contactEmail = settings?.contactEmail || "";

  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <h1 className="text-4xl font-bold mb-8">Về Chúng Tôi</h1>
      
      <div className="prose prose-lg max-w-none">
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Giới thiệu về {companyName}</h2>
          <p className="text-base-content/80 leading-relaxed">
            {siteName} là nền tảng đánh giá tính cách hàng đầu Việt Nam, sử dụng phương pháp DISC được công nhận quốc tế.
            Chúng tôi giúp cá nhân và tổ chức hiểu rõ hơn về tính cách, điểm mạnh và cơ hội phát triển.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Sứ mệnh</h2>
          <p className="text-base-content/80 leading-relaxed">
            "Giúp mỗi người Việt hiểu rõ bản thân qua DISC, và mỗi người giới thiệu DISC đều có thể kiếm thêm thu nhập từ nó."
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Phương pháp DISC</h2>
          <div className="space-y-4">
            <div className="card bg-base-200">
              <div className="card-body">
                <h3 className="font-semibold">D - Dominance (Sự Quyết Đoán)</h3>
                <p>Tập trung vào kết quả, thích thách thức và hành động</p>
              </div>
            </div>
            <div className="card bg-base-200">
              <div className="card-body">
                <h3 className="font-semibold">I - Influence (Sự Ảnh Hưởng)</h3>
                <p>Tập trung vào con người, nhiệt tình và lạc quan</p>
              </div>
            </div>
            <div className="card bg-base-200">
              <div className="card-body">
                <h3 className="font-semibold">S - Steadiness (Sự Ổn Định)</h3>
                <p>Tập trung vào sự hòa hợp, kiên nhẫn và hỗ trợ</p>
              </div>
            </div>
            <div className="card bg-base-200">
              <div className="card-body">
                <h3 className="font-semibold">C - Compliance (Sự Tuân Thủ)</h3>
                <p>Tập trung vào chất lượng, cẩn thận và chính xác</p>
              </div>
            </div>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Liên hệ</h2>
          <div className="space-y-2 text-base-content/80">
            {contactEmail && <p>📧 Email: {contactEmail}</p>}
            <p>📱 Hotline: {contactPhone}</p>
            <p>Zalo: {contactZalo}</p>
            <p>🏢 Địa chỉ: {companyAddress}</p>
          </div>
        </section>
      </div>
    </div>
  );
};

export default AboutPage;
