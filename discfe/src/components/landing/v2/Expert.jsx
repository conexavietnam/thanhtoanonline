import React from 'react';

const Expert = ({ config }) => {
    return (
        <section className="py-20 md:py-28 bg-white">
            <div className="container mx-auto px-4">
                <div className="max-w-5xl mx-auto mb-20">
                    <div className="text-center mb-12 transition-all duration-1000 opacity-100 translate-y-0">
                        <div className="inline-block mb-4">
                            <span className="px-6 py-2 bg-gradient-to-r from-teal-100 to-orange-100 border border-teal-200 rounded-full text-teal-700 text-sm font-bold tracking-wider uppercase">Chuyên gia</span>
                        </div>
                        <h2 className="text-4xl md:text-5xl font-bold text-gray-700 mb-6">{config?.role || "Chuyên gia đồng hành"}</h2>
                    </div>
                    <div className="bg-gradient-to-br from-teal-50 to-cyan-50 rounded-2xl p-8 md:p-12 shadow-xl hover:shadow-2xl transition-all duration-700 opacity-100 translate-y-0" style={{ transitionDelay: '200ms' }}>
                        <div className="grid grid-cols-1 md:grid-cols-5 gap-8 items-center">
                            <div className="md:col-span-2">
                                <div className="w-full aspect-square rounded-2xl overflow-hidden shadow-lg">
                                    <img alt={config?.name || "Coach Đào Thúy Hoàn"} className="w-full h-full object-cover object-top" src={config?.image || "/avartar.jpg"} />
                                </div>
                            </div>
                            <div className="md:col-span-3">
                                <h3 className="text-3xl font-bold text-gray-700 mb-2">{config?.name || "Coach Đào Thúy Hoàn"}</h3>
                                <div className="w-20 h-1 bg-gradient-to-r from-orange-500 to-orange-600 mb-6"></div>
                                <div className="space-y-4 mb-6">
                                    <div className="flex items-start gap-3">
                                        <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center bg-teal-500 rounded-full mt-1">
                                            <i className="ri-check-line text-sm text-white"></i>
                                        </div>
                                        <p className="text-base text-gray-700 flex-1">Hơn 20 năm kinh nghiệm tư vấn &amp; đào tạo</p>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center bg-teal-500 rounded-full mt-1">
                                            <i className="ri-check-line text-sm text-white"></i>
                                        </div>
                                        <p className="text-base text-gray-700 flex-1">Chuyên gia huấn luyện phát triển con người</p>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center bg-teal-500 rounded-full mt-1">
                                            <i className="ri-check-line text-sm text-white"></i>
                                        </div>
                                        <p className="text-base text-gray-700 flex-1">Đồng hành cùng nhiều trường học &amp; doanh nghiệp trên toàn quốc</p>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center bg-teal-500 rounded-full mt-1">
                                            <i className="ri-check-line text-sm text-white"></i>
                                        </div>
                                        <p className="text-base text-gray-700 flex-1">Tác giả nhiều chương trình về gia đình – giáo dục – nhân sự</p>
                                    </div>
                                </div>
                                <div className="bg-white rounded-xl p-6 shadow-md border-l-4 border-orange-500">
                                    <i className="ri-double-quotes-l text-3xl text-orange-500 mb-3 block"></i>
                                    <p className="text-lg italic text-gray-800 font-medium">"{config?.quote || 'Hiểu đúng con người là nền tảng của mọi sự phát triển bền vững.'}"</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-12 transition-all duration-1000 delay-400 opacity-100 translate-y-0">
                        <h2 className="text-4xl md:text-5xl font-bold text-gray-700 mb-6">Hình thức hợp tác linh hoạt</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                        <div className="bg-gradient-to-br from-gray-50 to-white border-2 border-gray-200 rounded-xl p-8 hover:shadow-xl hover:border-teal-300 transition-all duration-500 opacity-100 translate-y-0" style={{ transitionDelay: '600ms' }}>
                            <div className="flex items-start gap-4">
                                <div className="flex-shrink-0 w-14 h-14 flex items-center justify-center bg-gradient-to-br from-teal-500 to-teal-600 rounded-xl shadow-lg">
                                    <i className="ri-presentation-line text-2xl text-white"></i>
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-xl font-bold text-gray-700 mb-2">Workshop tại trường / doanh nghiệp</h3>
                                    <p className="text-gray-600">Tổ chức buổi đào tạo trực tiếp tại địa điểm của bạn</p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-gradient-to-br from-gray-50 to-white border-2 border-gray-200 rounded-xl p-8 hover:shadow-xl hover:border-teal-300 transition-all duration-500 opacity-100 translate-y-0" style={{ transitionDelay: '750ms' }}>
                            <div className="flex items-start gap-4">
                                <div className="flex-shrink-0 w-14 h-14 flex items-center justify-center bg-gradient-to-br from-teal-500 to-teal-600 rounded-xl shadow-lg">
                                    <i className="ri-calendar-check-line text-2xl text-white"></i>
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-xl font-bold text-gray-700 mb-2">Đào tạo định kỳ</h3>
                                    <p className="text-gray-600">Chương trình đào tạo liên tục theo lộ trình</p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-gradient-to-br from-gray-50 to-white border-2 border-gray-200 rounded-xl p-8 hover:shadow-xl hover:border-teal-300 transition-all duration-500 opacity-100 translate-y-0" style={{ transitionDelay: '900ms' }}>
                            <div className="flex items-start gap-4">
                                <div className="flex-shrink-0 w-14 h-14 flex items-center justify-center bg-gradient-to-br from-teal-500 to-teal-600 rounded-xl shadow-lg">
                                    <i className="ri-user-heart-line text-2xl text-white"></i>
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-xl font-bold text-gray-700 mb-2">Tư vấn cá nhân / nhóm</h3>
                                    <p className="text-gray-600">Tư vấn chuyên sâu cho từng cá nhân hoặc nhóm nhỏ</p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-gradient-to-br from-gray-50 to-white border-2 border-gray-200 rounded-xl p-8 hover:shadow-xl hover:border-teal-300 transition-all duration-500 opacity-100 translate-y-0" style={{ transitionDelay: '1050ms' }}>
                            <div className="flex items-start gap-4">
                                <div className="flex-shrink-0 w-14 h-14 flex items-center justify-center bg-gradient-to-br from-teal-500 to-teal-600 rounded-xl shadow-lg">
                                    <i className="ri-hand-heart-line text-2xl text-white"></i>
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-xl font-bold text-gray-700 mb-2">Đồng hành dài hạn</h3>
                                    <p className="text-gray-600">Hợp tác lâu dài theo nhu cầu của đơn vị</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl p-8 text-center shadow-xl transition-all duration-1000 delay-1000 opacity-100 translate-y-0">
                        <div className="flex items-center justify-center gap-2 mb-2">
                            <i className="ri-information-line text-2xl text-white"></i>
                            <p className="text-xl font-bold text-white">Nội dung &amp; chi phí được thiết kế riêng theo từng đơn vị</p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Expert;
