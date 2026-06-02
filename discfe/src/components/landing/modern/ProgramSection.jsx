import FadeInUp from "../../common/FadeInUp";

const ProgramSection = () => {
    return (
        <section className="py-20 md:py-28 bg-gradient-to-br from-gray-50 to-gray-100" id="curriculum">
            <div className="container mx-auto px-4">
                <FadeInUp className="max-w-4xl mx-auto text-center mb-16">
                    <div className="inline-block mb-4">
                        <span className="px-6 py-2 bg-gradient-to-r from-teal-100 to-orange-100 border border-teal-200 rounded-full text-teal-700 text-sm font-bold tracking-wider uppercase">
                            Nội dung đào tạo
                        </span>
                    </div>
                    <h2 className="text-4xl md:text-5xl font-bold text-gray-700 mb-6">Nội dung chương trình</h2>
                </FadeInUp>

                <div className="max-w-6xl mx-auto space-y-8 mb-16">
                    <FadeInUp delay={0.1} className="bg-white rounded-2xl shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-700">
                        <div className="bg-gradient-to-r from-teal-500 to-teal-600 p-6">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 flex items-center justify-center bg-white/20 backdrop-blur-sm rounded-xl">
                                    <span className="text-2xl font-black text-white">1</span>
                                </div>
                                <h3 className="text-2xl md:text-3xl font-bold text-white">Buổi 1: Hiểu DISC – Hiểu Mình – Hiểu Người</h3>
                            </div>
                        </div>
                        <div className="p-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    {[
                                        "DISC là gì & vì sao DISC không phải trắc nghiệm tính cách thông thường",
                                        "Nhận diện 4 nhóm DISC trong học tập – công việc – gia đình",
                                        "Cách đọc & hiểu kết quả DISC cá nhân",
                                        "Những sai lầm phổ biến khi áp dụng DISC"
                                    ].map((item, idx) => (
                                        <div key={idx} className="flex items-start gap-3">
                                            <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center bg-teal-100 rounded-full mt-1">
                                                <i className="ri-arrow-right-s-line text-sm text-teal-600"></i>
                                            </div>
                                            <p className="text-base text-gray-700 flex-1">{item}</p>
                                        </div>
                                    ))}
                                </div>
                                <div className="w-full h-64 rounded-xl overflow-hidden bg-gray-200 flex items-center justify-center">
                                    <span className="text-gray-400">Hình ảnh minh họa Buổi 1</span>
                                </div>
                            </div>
                        </div>
                    </FadeInUp>

                    <FadeInUp delay={0.2} className="bg-white rounded-2xl shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-700">
                        <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-6">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 flex items-center justify-center bg-white/20 backdrop-blur-sm rounded-xl">
                                    <span className="text-2xl font-black text-white">2</span>
                                </div>
                                <h3 className="text-2xl md:text-3xl font-bold text-white">Buổi 2: Ứng dụng DISC vào cuộc sống</h3>
                            </div>
                        </div>
                        <div className="p-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="w-full h-64 rounded-xl overflow-hidden bg-gray-200 flex items-center justify-center order-2 md:order-1">
                                    <span className="text-gray-400">Hình ảnh minh họa Buổi 2</span>
                                </div>
                                <div className="space-y-4 order-1 md:order-2">
                                    {[
                                        "DISC trong giao tiếp học đường / doanh nghiệp",
                                        "DISC trong học tập hiệu quả & làm việc nhóm",
                                        "DISC & định hướng nghề nghiệp",
                                        "Gợi ý lộ trình phát triển cá nhân theo từng nhóm tính cách"
                                    ].map((item, idx) => (
                                        <div key={idx} className="flex items-start gap-3">
                                            <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center bg-orange-100 rounded-full mt-1">
                                                <i className="ri-arrow-right-s-line text-sm text-orange-600"></i>
                                            </div>
                                            <p className="text-base text-gray-700 flex-1">{item}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </FadeInUp>
                </div>

                <FadeInUp delay={0.4} className="max-w-4xl mx-auto bg-white rounded-2xl p-8 shadow-lg mb-12">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
                        {[
                            { icon: "ri-time-line", title: "Thời lượng", text: "2 buổi – 4 giờ", color: "teal" },
                            { icon: "ri-computer-line", title: "Hình thức", text: "Trực tiếp / Online", color: "orange" },
                            { icon: "ri-team-line", title: "Phương thức", text: "Workshop tương tác", color: "indigo" }
                        ].map((item, idx) => (
                            <div key={idx} className="flex flex-col items-center">
                                <div className={`w-16 h-16 flex items-center justify-center bg-${item.color}-100 rounded-full mb-4`}>
                                    <i className={`${item.icon} text-3xl text-${item.color}-600`}></i>
                                </div>
                                <p className="text-lg font-bold text-gray-700 mb-1">{item.title}</p>
                                <p className="text-gray-600">{item.text}</p>
                            </div>
                        ))}
                    </div>
                </FadeInUp>

                <div className="max-w-5xl mx-auto">
                    <FadeInUp className="mb-8">
                        <h3 className="text-3xl md:text-4xl font-bold text-gray-700 text-center">Phương pháp đào tạo khác biệt</h3>
                    </FadeInUp>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                        <FadeInUp delay={0.1} className="bg-red-50 border-2 border-red-200 rounded-xl p-6">
                            <div className="flex items-start gap-3">
                                <i className="ri-close-circle-line text-2xl text-red-600 mt-1"></i>
                                <div>
                                    <p className="text-lg font-semibold text-red-900 mb-1">Không giảng lý thuyết khô cứng</p>
                                </div>
                            </div>
                        </FadeInUp>
                        <FadeInUp delay={0.1} className="bg-red-50 border-2 border-red-200 rounded-xl p-6">
                            <div className="flex items-start gap-3">
                                <i className="ri-close-circle-line text-2xl text-red-600 mt-1"></i>
                                <div>
                                    <p className="text-lg font-semibold text-red-900">Không áp đặt khuôn mẫu</p>
                                </div>
                            </div>
                        </FadeInUp>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                        {[
                            { icon: "ri-file-list-3-line", text: "Trắc nghiệm DISC cá nhân" },
                            { icon: "ri-lightbulb-line", text: "Phân tích tình huống thực tế" },
                            { icon: "ri-discuss-line", text: "Thảo luận – khai vấn – phản hồi trực tiếp" },
                            { icon: "ri-file-text-line", text: "Có slide – handout – form tư vấn kèm theo" }
                        ].map((item, idx) => (
                            <FadeInUp key={idx} delay={0.2 + idx * 0.1} className="bg-gradient-to-br from-teal-50 to-cyan-50 border-2 border-teal-200 rounded-xl p-6 hover:shadow-lg transition-all duration-300">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 flex items-center justify-center bg-teal-500 rounded-xl">
                                        <i className={`${item.icon} text-2xl text-white`}></i>
                                    </div>
                                    <p className="text-lg font-semibold text-gray-700 flex-1">{item.text}</p>
                                </div>
                            </FadeInUp>
                        ))}
                    </div>

                    <FadeInUp delay={0.5} className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl p-8 text-center shadow-xl">
                        <div className="flex items-center justify-center gap-3">
                            <i className="ri-arrow-right-line text-3xl text-white"></i>
                            <p className="text-2xl font-bold text-white">Người học hiểu – nhớ – áp dụng được ngay</p>
                        </div>
                    </FadeInUp>
                </div>
            </div>
        </section>
    );
};

export default ProgramSection;
