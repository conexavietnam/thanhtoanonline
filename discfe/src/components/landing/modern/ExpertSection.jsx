import FadeInUp from "../../common/FadeInUp";

const ExpertSection = () => {
    return (
        <section className="py-20 md:py-28 bg-white">
            <div className="container mx-auto px-4">
                <div className="max-w-5xl mx-auto mb-20">
                    <FadeInUp className="text-center mb-12">
                        <div className="inline-block mb-4">
                            <span className="px-6 py-2 bg-gradient-to-r from-teal-100 to-orange-100 border border-teal-200 rounded-full text-teal-700 text-sm font-bold tracking-wider uppercase">
                                Chuyên gia
                            </span>
                        </div>
                        <h2 className="text-4xl md:text-5xl font-bold text-gray-700 mb-6">Chuyên gia đồng hành</h2>
                    </FadeInUp>

                    <FadeInUp className="bg-gradient-to-br from-teal-50 to-cyan-50 rounded-2xl p-8 md:p-12 shadow-xl hover:shadow-2xl transition-all duration-700">
                        <div className="grid grid-cols-1 md:grid-cols-5 gap-8 items-center">
                            <div className="md:col-span-2">
                                <div className="w-full aspect-square rounded-2xl overflow-hidden shadow-lg bg-gray-200 flex items-center justify-center">
                                    <span className="text-gray-400">Hình ảnh Chuyên gia</span>
                                </div>
                            </div>
                            <div className="md:col-span-3">
                                <h3 className="text-3xl font-bold text-gray-700 mb-2">Luật sư – Coach Đào Thúy Hoàn</h3>
                                <div className="w-20 h-1 bg-gradient-to-r from-orange-500 to-orange-600 mb-6"></div>
                                <div className="space-y-4 mb-6">
                                    {[
                                        "Hơn 20 năm kinh nghiệm tư vấn & đào tạo",
                                        "Chuyên gia huấn luyện phát triển con người",
                                        "Đồng hành cùng nhiều trường học & doanh nghiệp trên toàn quốc",
                                        "Tác giả nhiều chương trình về gia đình – giáo dục – nhân sự"
                                    ].map((item, idx) => (
                                        <div key={idx} className="flex items-start gap-3">
                                            <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center bg-teal-500 rounded-full mt-1">
                                                <i className="ri-check-line text-sm text-white"></i>
                                            </div>
                                            <p className="text-base text-gray-700 flex-1">{item}</p>
                                        </div>
                                    ))}
                                </div>
                                <div className="bg-white rounded-xl p-6 shadow-md border-l-4 border-orange-500">
                                    <i className="ri-double-quotes-l text-3xl text-orange-500 mb-3 block"></i>
                                    <p className="text-lg italic text-gray-800 font-medium">"Hiểu đúng con người là nền tảng của mọi sự phát triển bền vững."</p>
                                </div>
                            </div>
                        </div>
                    </FadeInUp>
                </div>

                <div className="max-w-6xl mx-auto">
                    <FadeInUp className="text-center mb-12">
                        <h2 className="text-4xl md:text-5xl font-bold text-gray-700 mb-6">Hình thức hợp tác linh hoạt</h2>
                    </FadeInUp>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                        {[
                            { icon: "ri-presentation-line", title: "Workshop tại trường / doanh nghiệp", text: "Tổ chức buổi đào tạo trực tiếp tại địa điểm của bạn" },
                            { icon: "ri-calendar-check-line", title: "Đào tạo định kỳ", text: "Chương trình đào tạo liên tục theo lộ trình" },
                            { icon: "ri-user-heart-line", title: "Tư vấn cá nhân / nhóm", text: "Tư vấn chuyên sâu cho từng cá nhân hoặc nhóm nhỏ" },
                            { icon: "ri-hand-heart-line", title: "Đồng hành dài hạn", text: "Hợp tác lâu dài theo nhu cầu của đơn vị" }
                        ].map((item, idx) => (
                            <FadeInUp key={idx} delay={idx * 0.1} className="bg-gradient-to-br from-gray-50 to-white border-2 border-gray-200 rounded-xl p-8 hover:shadow-xl hover:border-teal-300 transition-all duration-500">
                                <div className="flex items-start gap-4">
                                    <div className="flex-shrink-0 w-14 h-14 flex items-center justify-center bg-gradient-to-br from-teal-500 to-teal-600 rounded-xl shadow-lg">
                                        <i className={`${item.icon} text-2xl text-white`}></i>
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-xl font-bold text-gray-700 mb-2">{item.title}</h3>
                                        <p className="text-gray-600">{item.text}</p>
                                    </div>
                                </div>
                            </FadeInUp>
                        ))}
                    </div>
                    <FadeInUp delay={0.4} className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl p-8 text-center shadow-xl">
                        <div className="flex items-center justify-center gap-2 mb-2">
                            <i className="ri-information-line text-2xl text-white"></i>
                            <p className="text-xl font-bold text-white">Nội dung & chi phí được thiết kế riêng theo từng đơn vị</p>
                        </div>
                    </FadeInUp>
                </div>
            </div>
        </section>
    );
};

export default ExpertSection;
