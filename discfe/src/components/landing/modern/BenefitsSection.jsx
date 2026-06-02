import FadeInUp from "../../common/FadeInUp";

const BenefitsSection = () => {
    return (
        <section className="py-20 md:py-32 bg-gradient-to-b from-white to-gray-50 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-teal-200/30 to-orange-200/30 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-80 h-80 bg-gradient-to-tr from-orange-200/30 to-teal-200/30 rounded-full blur-3xl"></div>

            <div className="container mx-auto px-4 relative z-10">
                <FadeInUp className="text-center mb-16">
                    <div className="inline-block mb-4">
                        <span className="px-6 py-2 bg-gradient-to-r from-teal-100 to-cyan-100 border border-teal-200 rounded-full text-teal-700 text-sm font-bold tracking-wider uppercase">
                            Lợi ích thực tế
                        </span>
                    </div>
                    <h2 className="text-4xl md:text-5xl font-black text-gray-900 leading-tight">
                        DISC giúp gì cho <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-600 to-cyan-600">mọi mối quan hệ?</span>
                    </h2>
                </FadeInUp>

                <div className="max-w-7xl mx-auto">
                    <div className="grid lg:grid-cols-2 gap-8">
                        <FadeInUp className="bg-gradient-to-br from-white to-teal-50 rounded-3xl shadow-2xl p-10 border-2 border-teal-100 hover:shadow-3xl hover:border-teal-300 transition-all duration-500 h-full">
                            <div className="flex items-center gap-4 mb-8">
                                <div className="w-16 h-16 flex items-center justify-center bg-gradient-to-br from-teal-500 to-cyan-500 rounded-2xl shadow-lg">
                                    <i className="ri-user-heart-line text-3xl text-white"></i>
                                </div>
                                <h3 className="text-2xl md:text-3xl font-black text-gray-700">
                                    Với cá nhân<br />
                                    <span className="text-teal-600 text-xl md:text-2xl">(Con cái, Học sinh, Nhân viên)</span>
                                </h3>
                            </div>

                            <div className="space-y-4">
                                {[
                                    "Hiểu rõ mình là ai – phù hợp với môi trường, công việc nào",
                                    "Học và làm việc đúng cách theo tính cách, không ép mình trở thành người khác",
                                    "Tự tin hơn khi lựa chọn ngành nghề, vị trí công việc",
                                    "Giảm áp lực, lo lắng, hoang mang về tương lai và công việc"
                                ].map((item, idx) => (
                                    <div key={idx} className="flex items-start gap-3">
                                        <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center bg-teal-500 rounded-full mt-1">
                                            <i className="ri-check-line text-sm text-white"></i>
                                        </div>
                                        <p className="text-gray-700 text-lg leading-relaxed">{item}</p>
                                    </div>
                                ))}
                            </div>
                        </FadeInUp>

                        <FadeInUp delay={0.2} className="bg-gradient-to-br from-white to-orange-50 rounded-3xl shadow-2xl p-10 border-2 border-orange-100 hover:shadow-3xl hover:border-orange-300 transition-all duration-500 h-full">
                            <div className="flex items-center gap-4 mb-8">
                                <div className="w-16 h-16 flex items-center justify-center bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl shadow-lg">
                                    <i className="ri-team-line text-3xl text-white"></i>
                                </div>
                                <h3 className="text-2xl md:text-3xl font-black text-gray-700">
                                    Với người quản lý<br />
                                    <span className="text-orange-600 text-xl md:text-2xl">(Phụ huynh, Sếp, Đối tác)</span>
                                </h3>
                            </div>

                            <div className="space-y-4">
                                {[
                                    "Hiểu con, hiểu nhân viên, hiểu đối tác thay vì áp đặt",
                                    "Giao tiếp nhẹ nhàng – ít xung đột – hiệu quả hơn",
                                    "Đồng hành, hỗ trợ đúng cách – đúng thời điểm",
                                    "Yên tâm khi họ tự đưa ra lựa chọn có cơ sở và phù hợp"
                                ].map((item, idx) => (
                                    <div key={idx} className="flex items-start gap-3">
                                        <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center bg-orange-500 rounded-full mt-1">
                                            <i className="ri-check-line text-sm text-white"></i>
                                        </div>
                                        <p className="text-gray-700 text-lg leading-relaxed">{item}</p>
                                    </div>
                                ))}
                            </div>
                        </FadeInUp>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default BenefitsSection;
