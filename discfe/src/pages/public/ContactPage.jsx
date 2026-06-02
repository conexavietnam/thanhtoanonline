import { useState, useEffect } from "react";
import { Mail, Phone, MapPin, Clock, MessageCircle, Send, Facebook, Youtube } from "lucide-react";
import toast from "react-hot-toast";
import { publicSettingsAPI } from "../../lib/api";
import { DEFAULT_COMPANY_INFO } from "../../constants/companyInfo.js";

const ContactPage = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [settings, setSettings] = useState({
    companyName: DEFAULT_COMPANY_INFO.companyName,
    companyAddress: DEFAULT_COMPANY_INFO.companyAddress,
    contactEmail: "",
    contactPhone: DEFAULT_COMPANY_INFO.contactPhone,
    contactZalo: DEFAULT_COMPANY_INFO.contactZalo,
    socialFacebook: "",
    socialYoutube: "",
    siteName: "DISCWAKE"
  });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data } = await publicSettingsAPI.getGeneral();
        setSettings(prev => ({
          ...prev,
          ...data
        }));
      } catch (error) {
        console.error("Failed to load settings", error);
      }
    };
    fetchSettings();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    // Simulate API call
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      toast.success("Đã gửi tin nhắn thành công!");
      setFormData({ name: "", email: "", subject: "", message: "" });
    } catch (error) {
      toast.error("Có lỗi xảy ra, vui lòng thử lại.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <div className="min-h-screen bg-base-200/30 py-12 px-4 selection:bg-primary/20 selection:text-primary">
      <div className="container mx-auto max-w-6xl">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="inline-flex items-center justify-center p-2 bg-primary/10 rounded-full mb-4">
            <span className="bg-primary text-primary-content text-xs font-bold px-3 py-1 rounded-full">LIÊN HỆ</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-base-content mb-4 tracking-tight">
            Chúng tôi luôn lắng nghe
          </h1>
          <p className="text-lg text-base-content/70">
            Bạn có thắc mắc về {settings.companyName || settings.siteName} hoặc cần hỗ trợ? Đội ngũ của chúng tôi sẵn sàng giải đáp mọi câu hỏi của bạn.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-start">
          {/* Contact Info (Left Column) */}
          <div className="space-y-8">
            <div className="grid gap-6">
              {settings.contactEmail && (
                <div className="flex items-start gap-4 p-6 bg-base-100 rounded-3xl shadow-sm border border-base-200 transition-all hover:shadow-md hover:border-primary/20 group">
                  <div className="p-3 bg-blue-100 text-blue-600 rounded-2xl group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    <Mail className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-base-content">Email Hỗ Trợ</h3>
                    <p className="text-base-content/60 text-sm mb-1">Gửi email cho chúng tôi bất cứ lúc nào</p>
                    <a href={`mailto:${settings.contactEmail}`} className="text-primary font-semibold hover:underline">
                      {settings.contactEmail}
                    </a>
                  </div>
                </div>
              )}

              {/* Hotline Card */}
              <div className="flex items-start gap-4 p-6 bg-base-100 rounded-3xl shadow-sm border border-base-200 transition-all hover:shadow-md hover:border-primary/20 group">
                <div className="p-3 bg-green-100 text-green-600 rounded-2xl group-hover:bg-green-600 group-hover:text-white transition-colors">
                  <Phone className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-base-content">Hotline</h3>
                  <p className="text-base-content/60 text-sm mb-1">Hỗ trợ 24/7 (Thứ 2 - Thứ 7)</p>
                  <a href={`tel:${settings.contactPhone}`} className="text-primary font-semibold hover:underline">
                    {settings.contactPhone}
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-4 p-6 bg-base-100 rounded-3xl shadow-sm border border-base-200 transition-all hover:shadow-md hover:border-primary/20 group">
                <div className="p-3 bg-cyan-100 text-cyan-600 rounded-2xl group-hover:bg-cyan-600 group-hover:text-white transition-colors">
                  <MessageCircle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-base-content">Zalo</h3>
                  <p className="text-base-content/60 text-sm mb-1">Kết nối nhanh qua Zalo tư vấn</p>
                  <a href={`https://zalo.me/${settings.contactZalo}`} target="_blank" rel="noopener noreferrer" className="text-primary font-semibold hover:underline">
                    {settings.contactZalo}
                  </a>
                </div>
              </div>

              {/* Address Card */}
              <div className="flex items-start gap-4 p-6 bg-base-100 rounded-3xl shadow-sm border border-base-200 transition-all hover:shadow-md hover:border-primary/20 group">
                <div className="p-3 bg-purple-100 text-purple-600 rounded-2xl group-hover:bg-purple-600 group-hover:text-white transition-colors">
                  <MapPin className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-base-content">Văn phòng</h3>
                  <p className="text-base-content/60 text-sm mb-1">Đến trực tiếp văn phòng của chúng tôi</p>
                  <p className="font-medium text-base-content/90">
                    {settings.companyAddress}
                  </p>
                </div>
              </div>

              {/* Working Hours Card */}
              <div className="flex items-start gap-4 p-6 bg-base-100 rounded-3xl shadow-sm border border-base-200 transition-all hover:shadow-md hover:border-primary/20 group">
                <div className="p-3 bg-orange-100 text-orange-600 rounded-2xl group-hover:bg-orange-600 group-hover:text-white transition-colors">
                  <Clock className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-base-content">Giờ làm việc</h3>
                  <p className="text-base-content/60 text-sm mb-2">Thời gian làm việc hành chính</p>
                  <div className="space-y-1 text-sm font-medium text-base-content/90">
                    <div className="flex justify-between gap-8">
                      <span>Thứ 2 - Thứ 6:</span>
                      <span>8:00 - 17:00</span>
                    </div>
                    <div className="flex justify-between gap-8">
                      <span>Thứ 7:</span>
                      <span>8:00 - 12:00</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Social Media Links if available */}
            {(settings.socialFacebook || settings.socialYoutube) && (
              <div className="flex gap-4 justify-center md:justify-start">
                {settings.socialFacebook && (
                  <a href={settings.socialFacebook} target="_blank" rel="noopener noreferrer" className="btn btn-circle btn-primary btn-outline">
                    <Facebook className="w-5 h-5" />
                  </a>
                )}
                {settings.socialYoutube && (
                  <a href={settings.socialYoutube} target="_blank" rel="noopener noreferrer" className="btn btn-circle btn-error btn-outline">
                    <Youtube className="w-5 h-5" />
                  </a>
                )}
              </div>
            )}

          </div>

          {/* Contact Form (Right Column) */}
          <div className="bg-base-100 rounded-[2rem] shadow-xl border border-base-200 p-8 lg:p-10 sticky top-24">
            <h2 className="text-2xl font-bold text-base-content mb-2">Gửi tin nhắn</h2>
            <p className="text-base-content/60 mb-8">Điền thông tin bên dưới, chúng tôi sẽ phản hồi trong vòng 24h.</p>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid md:grid-cols-2 gap-5">
                <div className="form-control w-full">
                  <label className="label">
                    <span className="label-text font-medium text-base-content/80">Họ và tên</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    placeholder="Nguyễn Văn A"
                    className="input input-bordered w-full focus:input-primary bg-base-200/30 transition-all"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="form-control w-full">
                  <label className="label">
                    <span className="label-text font-medium text-base-content/80">Email</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    placeholder="example@gmail.com"
                    className="input input-bordered w-full focus:input-primary bg-base-200/30 transition-all"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="form-control w-full">
                <label className="label">
                  <span className="label-text font-medium text-base-content/80">Tiêu đề</span>
                </label>
                <input
                  type="text"
                  name="subject"
                  placeholder="Vấn đề cần hỗ trợ..."
                  className="input input-bordered w-full focus:input-primary bg-base-200/30 transition-all"
                  value={formData.subject}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-control w-full">
                <label className="label">
                  <span className="label-text font-medium text-base-content/80">Nội dung</span>
                </label>
                <textarea
                  name="message"
                  className="textarea textarea-bordered h-32 w-full focus:textarea-primary bg-base-200/30 transition-all resize-none text-base"
                  placeholder="Nhập nội dung tin nhắn của bạn..."
                  value={formData.message}
                  onChange={handleChange}
                  required
                ></textarea>
              </div>

              <button
                type="submit"
                className="btn btn-primary w-full btn-lg mt-4 shadow-lg shadow-primary/30"
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <span className="loading loading-spinner"></span>
                    Đang gửi...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5 mr-2" />
                    Gửi tin nhắn
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactPage;
