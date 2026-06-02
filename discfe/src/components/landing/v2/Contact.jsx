import React from 'react';

const Contact = ({ config }) => {
    const [formData, setFormData] = React.useState({
        name: '',
        phone: '',
        email: '',
        organization: '',
        message: ''
    });
    const [loading, setLoading] = React.useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        // Telegram configuration
        const BOT_TOKEN = "8327768604:AAE9MB8Kf8FQg8r6xVyNm9WUkk6VZ53hq4g"; // Placeholder - should be in env
        const CHAT_ID = "-5084671915"; // Placeholder - should be in env

        const text = `
🔥 **ĐĂNG KÝ TƯ VẤN MỚI** 🔥

👤 **Họ tên:** ${formData.name}
📱 **SĐT:** ${formData.phone}
📧 **Email:** ${formData.email}
🏢 **Đơn vị:** ${formData.organization}
📝 **Nội dung:** ${formData.message || "Không có"}

Time: ${new Date().toLocaleString('vi-VN')}
        `;

        try {
            const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    chat_id: CHAT_ID,
                    text: text,
                    parse_mode: 'Markdown'
                })
            });

            if (response.ok) {
                alert("Đăng ký thành công! Chúng tôi sẽ liên hệ lại sớm.");
                setFormData({
                    name: '',
                    phone: '',
                    email: '',
                    organization: '',
                    message: ''
                });
            } else {
                alert("Có lỗi xảy ra. Vui lòng thử lại sau.");
            }
        } catch (error) {
            console.error("Error sending telegram:", error);
            alert("Có lỗi xảy ra. Vui lòng kiểm tra kết nối mạng.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <section id="contact" className="py-20 md:py-32 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-teal-900"></div>
            <div className="absolute inset-0 opacity-10">
                <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '30px 30px' }}></div>
            </div>
            <div className="container mx-auto px-4 relative z-10">
                <div className="max-w-4xl mx-auto text-center mb-12 transition-all duration-1000 opacity-100 translate-y-0">
                    <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">{config?.title || "Đừng để con bạn, nhân viên, đối tác của bạn"}</h2>
                    <p className="text-2xl md:text-3xl text-orange-400 font-bold mb-8">{config?.subtitle || "đi xa thêm trên con đường không phù hợp"}</p>
                    <div className="space-y-3 text-lg text-white/90">
                        <div className="flex items-center justify-center gap-2">
                            <i className="ri-arrow-right-line text-orange-400"></i>
                            <span>Đăng ký tư vấn chương trình DISC</span>
                        </div>
                        <div className="flex items-center justify-center gap-2">
                            <i className="ri-arrow-right-line text-orange-400"></i>
                            <span>Nhận đề cương &amp; báo giá chi tiết</span>
                        </div>
                        <div className="flex items-center justify-center gap-2">
                            <i className="ri-arrow-right-line text-orange-400"></i>
                            <span>Liên hệ ngay để được hỗ trợ</span>
                        </div>
                    </div>
                </div>
                <div className="max-w-xl mx-auto">
                    <div className="bg-white rounded-2xl shadow-2xl p-8 md:p-10 transition-all duration-1000 delay-300 opacity-100 translate-y-0">
                        <form onSubmit={handleSubmit}>
                            <div className="space-y-5">
                                <div>
                                    <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-2">Họ và tên <span className="text-red-500">*</span></label>
                                    <input
                                        id="name"
                                        required
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                                        placeholder="Nhập họ và tên của bạn"
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                    />
                                </div>
                                <div>
                                    <label htmlFor="phone" className="block text-sm font-semibold text-gray-700 mb-2">Số điện thoại <span className="text-red-500">*</span></label>
                                    <input
                                        id="phone"
                                        required
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                                        placeholder="Nhập số điện thoại"
                                        type="tel"
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleChange}
                                    />
                                </div>
                                <div>
                                    <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">Email <span className="text-red-500">*</span></label>
                                    <input
                                        id="email"
                                        required
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                                        placeholder="Nhập địa chỉ email"
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                    />
                                </div>
                                <div>
                                    <label htmlFor="organization" className="block text-sm font-semibold text-gray-700 mb-2">Đơn vị (Trường/Công ty) <span className="text-red-500">*</span></label>
                                    <input
                                        id="organization"
                                        required
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                                        placeholder="Nhập tên trường hoặc công ty"
                                        type="text"
                                        name="organization"
                                        value={formData.organization}
                                        onChange={handleChange}
                                    />
                                </div>
                                <div>
                                    <label htmlFor="message" className="block text-sm font-semibold text-gray-700 mb-2">Nội dung cần tư vấn</label>
                                    <textarea
                                        id="message"
                                        name="message"
                                        rows="4"
                                        maxLength="500"
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all resize-none"
                                        placeholder="Nhập nội dung bạn muốn tư vấn (tối đa 500 ký tự)"
                                        value={formData.message}
                                        onChange={handleChange}
                                    >
                                    </textarea>
                                    <div className="text-right text-xs text-gray-500 mt-1">{formData.message.length}/500</div>
                                </div>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full px-10 py-5 bg-gradient-to-r from-teal-500 to-emerald-500 text-white rounded-xl font-bold text-xl hover:shadow-2xl hover:shadow-teal-500/50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 whitespace-nowrap"
                                >
                                    {loading ? 'Đang gửi...' : 'Đăng ký ngay'}
                                </button>
                            </div>
                        </form>
                    </div>
                    <div className="text-center mt-8 transition-all duration-1000 delay-500 opacity-100 translate-y-0">
                        <p className="text-white/80 text-sm">Hoặc liên hệ trực tiếp: <a href="mailto:info@ticavi.vn" className="text-white font-semibold hover:underline cursor-pointer">info@ticavi.vn</a></p>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Contact;
