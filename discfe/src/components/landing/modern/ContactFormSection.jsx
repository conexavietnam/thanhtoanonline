import React from "react";
import FadeInUp from "../../common/FadeInUp";
import toast from "react-hot-toast";

const ContactFormSection = () => {
    const [formData, setFormData] = React.useState({
        name: "",
        phone: "",
        email: "",
        organization: "",
        message: ""
    });
    const [loading, setLoading] = React.useState(false);

    const handleChange = (e) => {
        const { id, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [id]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        // TODO: Validate required fields

        // Format message for Telegram
        const text = `
🔥 *NEW LEAD REGISTRATION* 🔥
---------------------------
👤 *Name:* ${formData.name}
📱 *Phone:* ${formData.phone}
📧 *Email:* ${formData.email}
🏢 *Org:* ${formData.organization}
💬 *Message:* ${formData.message || "N/A"}
---------------------------
`;

        // TELEGRAM CONFIG (Temporary)
        // TODO: Move these to .env or backend
        const BOT_TOKEN = "6707173628:AAEiFlHwO-XY2_TQ_A63Uu9EDciJ32CPXTA"; // PLACEHOLDER
        const CHAT_ID = "-4914739656"; // PLACEHOLDER - Replace with your Chat ID

        try {
            // Check if tokens are placeholders (alert user if so)
            if (BOT_TOKEN.includes("e.g.") || !BOT_TOKEN) {
                // Fallback: Open Telegram Link if no token
                window.open(`https://t.me/discwake_support?start=${encodeURIComponent(formData.phone)}`, '_blank');
                toast.success("Cảm ơn bạn đã đăng ký! Chúng tôi sẽ liên hệ lại sớm.");
                return;
            }

            const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    chat_id: CHAT_ID,
                    text: text,
                    parse_mode: "Markdown"
                }),
            });

            if (response.ok) {
                toast.success("Đăng ký thành công! Chúng tôi sẽ liên hệ với bạn sớm nhất.");
                setFormData({ name: "", phone: "", email: "", organization: "", message: "" });
            } else {
                console.error("Telegram Error:", await response.text());
                toast.error("Có lỗi xảy ra. Vui lòng liên hệ trực tiếp qua Hotline/Email.");
            }
        } catch (error) {
            console.error("Submission Error:", error);
            toast.error("Có lỗi xảy ra. Xin thử lại sau.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <section id="contact-section" className="py-20 md:py-32 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-teal-900"></div>
            <div className="absolute inset-0 opacity-10">
                <div className="absolute inset-0" style={{ backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)", backgroundSize: "30px 30px" }}></div>
            </div>

            <div className="container mx-auto px-4 relative z-10">
                <FadeInUp className="max-w-4xl mx-auto text-center mb-12">
                    <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">Đừng để con bạn, nhân viên, đối tác của bạn</h2>
                    <p className="text-2xl md:text-3xl text-orange-400 font-bold mb-8">đi xa thêm trên con đường không phù hợp</p>
                    <div className="space-y-3 text-lg text-white/90">
                        {[
                            "Đăng ký tư vấn chương trình DISC",
                            "Nhận đề cương & báo giá chi tiết",
                            "Liên hệ ngay để được hỗ trợ"
                        ].map((text, idx) => (
                            <div key={idx} className="flex items-center justify-center gap-2">
                                <i className="ri-arrow-right-line text-orange-400"></i>
                                <span>{text}</span>
                            </div>
                        ))}
                    </div>
                </FadeInUp>

                <FadeInUp delay={0.2} className="max-w-xl mx-auto">
                    <div className="bg-white rounded-2xl shadow-2xl p-8 md:p-10">
                        <form onSubmit={handleSubmit}>
                            <div className="space-y-5">
                                {[
                                    { id: "name", label: "Họ và tên", type: "text", required: true },
                                    { id: "phone", label: "Số điện thoại", type: "tel", required: true },
                                    { id: "email", label: "Email", type: "email", required: true },
                                    { id: "organization", label: "Đơn vị (Trường/Công ty)", type: "text", required: true }
                                ].map((field) => (
                                    <div key={field.id}>
                                        <label htmlFor={field.id} className="block text-sm font-semibold text-gray-700 mb-2">
                                            {field.label} {field.required && <span className="text-red-500">*</span>}
                                        </label>
                                        <input
                                            id={field.id}
                                            type={field.type}
                                            required={field.required}
                                            value={formData[field.id]}
                                            onChange={handleChange}
                                            className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                                            placeholder={`Nhập ${field.label.toLowerCase()}`}
                                        />
                                    </div>
                                ))}

                                <div>
                                    <label htmlFor="message" className="block text-sm font-semibold text-gray-700 mb-2">Nội dung cần tư vấn</label>
                                    <textarea
                                        id="message"
                                        rows="4"
                                        maxLength="500"
                                        value={formData.message}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all resize-none"
                                        placeholder="Nhập nội dung bạn muốn tư vấn (tối đa 500 ký tự)"
                                    ></textarea>
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full px-10 py-5 bg-gradient-to-r from-teal-500 to-emerald-500 text-white rounded-xl font-bold text-xl hover:shadow-2xl hover:shadow-teal-500/50 transition-all duration-300 hover:scale-105 whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {loading ? "Đang gửi..." : "Đăng ký ngay"}
                                </button>
                            </div>
                        </form>
                    </div>
                    <div className="text-center mt-8">
                        <p className="text-white/80 text-sm">
                            Hoặc liên hệ trực tiếp: <a href="mailto:support@discwake.local" className="text-white font-semibold hover:underline">support@discwake.local</a>
                        </p>
                    </div>
                </FadeInUp>
            </div>
        </section>
    );
};

export default ContactFormSection;
