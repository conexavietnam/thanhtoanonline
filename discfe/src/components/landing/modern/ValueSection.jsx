import FadeInUp from "../../common/FadeInUp";

const ValueSection = () => {
    return (
        <section className="py-20 md:py-32 bg-gradient-to-b from-white to-slate-50 relative overflow-hidden">
            <div className="absolute inset-0 opacity-5">
                <div className="absolute top-20 right-20 w-96 h-96 bg-teal-500 rounded-full blur-3xl"></div>
                <div className="absolute bottom-20 left-20 w-80 h-80 bg-orange-500 rounded-full blur-3xl"></div>
            </div>

            <div className="container mx-auto px-4 relative z-10">
                <FadeInUp className="text-center mb-16">
                    <div className="inline-block mb-4">
                        <span className="px-6 py-2 bg-gradient-to-r from-teal-100 to-orange-100 border border-teal-200 rounded-full text-teal-700 text-sm font-bold tracking-wider uppercase">
                            Giá trị mang lại
                        </span>
                    </div>
                    <h2 className="text-4xl md:text-6xl font-black text-gray-700">
                        Giá trị cho Trường học & Doanh nghiệp
                    </h2>
                </FadeInUp>

                <div className="max-w-7xl mx-auto">
                    <div className="grid lg:grid-cols-2 gap-8">
                        <FadeInUp className="group relative bg-gradient-to-br from-teal-500 to-teal-600 rounded-3xl shadow-2xl hover:shadow-3xl transition-all duration-500 overflow-hidden h-full p-10">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
                            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full blur-2xl"></div>

                            <div className="relative z-10">
                                <div className="flex items-center gap-4 mb-8">
                                    <div className="w-20 h-20 flex items-center justify-center bg-white/20 backdrop-blur-sm rounded-2xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                                        <i className="ri-school-line text-4xl text-white"></i>
                                    </div>
                                    <h3 className="text-3xl font-black text-white">Đối với Trường học</h3>
                                </div>

                                <div className="space-y-5">
                                    {[
                                        "Nâng cao chất lượng hướng nghiệp – tư vấn học đường",
                                        "Tăng sự gắn kết giữa nhà trường – phụ huynh – học sinh",
                                        "Giảm mâu thuẫn, áp lực tâm lý",
                                        "Góp phần xây dựng môi trường giáo dục tích cực – nhân văn"
                                    ].map((item, idx) => (
                                        <div key={idx} className="flex items-start gap-4 group/item">
                                            <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-white/20 backdrop-blur-sm rounded-lg group-hover/item:bg-white/30 transition-colors duration-300">
                                                <i className="ri-check-line text-lg text-white"></i>
                                            </div>
                                            <p className="text-white/95 text-lg leading-relaxed flex-1">{item}</p>
                                        </div>
                                    ))}
                                </div>

                                <div className="mt-8 pt-8 border-t border-white/20">
                                    <div className="flex items-center gap-2 text-white/80">
                                        <i className="ri-star-line text-xl"></i>
                                        <p className="text-sm font-medium">Môi trường giáo dục tích cực & nhân văn</p>
                                    </div>
                                </div>
                            </div>
                        </FadeInUp>

                        <FadeInUp delay={0.2} className="group relative bg-gradient-to-br from-orange-500 to-orange-600 rounded-3xl shadow-2xl hover:shadow-3xl transition-all duration-500 overflow-hidden h-full p-10">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
                            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full blur-2xl"></div>

                            <div className="relative z-10">
                                <div className="flex items-center gap-4 mb-8">
                                    <div className="w-20 h-20 flex items-center justify-center bg-white/20 backdrop-blur-sm rounded-2xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                                        <i className="ri-building-line text-4xl text-white"></i>
                                    </div>
                                    <h3 className="text-3xl font-black text-white">Đối với Doanh nghiệp</h3>
                                </div>

                                <div className="space-y-5">
                                    {[
                                        "Phân bổ nhân sự đúng người – đúng việc",
                                        "Cải thiện giao tiếp nội bộ",
                                        "Phát triển đội ngũ kế cận bền vững",
                                        "Giảm chi phí tuyển dụng – đào tạo lại"
                                    ].map((item, idx) => (
                                        <div key={idx} className="flex items-start gap-4 group/item">
                                            <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-white/20 backdrop-blur-sm rounded-lg group-hover/item:bg-white/30 transition-colors duration-300">
                                                <i className="ri-check-line text-lg text-white"></i>
                                            </div>
                                            <p className="text-white/95 text-lg leading-relaxed flex-1">{item}</p>
                                        </div>
                                    ))}
                                </div>

                                <div className="mt-8 pt-8 border-t border-white/20">
                                    <div className="flex items-center gap-2 text-white/80">
                                        <i className="ri-star-line text-xl"></i>
                                        <p className="text-sm font-medium">Văn hóa tổ chức tích cực & bền vững</p>
                                    </div>
                                </div>
                            </div>
                        </FadeInUp>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default ValueSection;
