import React from 'react';

const TargetAudience = () => {
    return (
        <section className="py-20 md:py-32 bg-gradient-to-b from-gray-50 to-white">
            <div className="container mx-auto px-4">
                <div className="max-w-5xl mx-auto">
                    <div className="rounded-3xl overflow-hidden mb-14 shadow-2xl transition-all duration-1000 opacity-100 translate-y-0">
                        <img alt="Đối tượng tham gia" className="w-full h-full object-cover" src="https://readdy.ai/api/search-image?query=Collage%20showing%20three%20groups%20of%20people%20high%20school%20students%20parents%20and%20teachers%20or%20business%20professionals%20in%20modern%20educational%20and%20office%20settings%20diverse%20Asian%20people%20collaborative%20atmosphere&width=1200&height=600&seq=target-audience-collage-001&orientation=landscape" />
                    </div>
                    <div className="text-center mb-12 transition-all duration-1000 delay-200 opacity-100 translate-y-0">
                        <h2 className="text-3xl md:text-4xl font-bold text-gray-700 leading-relaxed mb-8">
                            Dành cho <span className="text-gray-400 italic">Học sinh THCS-THPT</span>, <span className="text-gray-400 italic">Sinh viên</span>, <span className="text-gray-400 italic">Phụ huynh</span>, <span className="text-gray-400 italic">Giáo viên</span>, và <span className="text-gray-400 italic">Doanh nghiệp</span> muốn phát triển nhân sự
                        </h2>
                    </div>
                    <div className="text-center transition-all duration-1000 delay-400 opacity-100 translate-y-0">
                        <button className="inline-flex items-center justify-center px-14 py-5 text-lg font-medium text-white bg-gray-700 rounded-full hover:bg-gray-600 transition-colors duration-300 shadow-lg hover:shadow-xl cursor-pointer whitespace-nowrap">
                            Liên Hệ Tư Vấn
                        </button>
                    </div>
                    <div className="grid md:grid-cols-2 gap-8 mt-20">
                        <div className="bg-white rounded-2xl p-8 shadow-lg border-2 border-gray-100 hover:shadow-2xl hover:border-teal-200 transition-all duration-500 opacity-100 translate-y-0" style={{ transitionDelay: '600ms' }}>
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                                    <i className="ri-school-line text-blue-600 text-2xl"></i>
                                </div>
                                <h3 className="text-2xl font-bold text-gray-700">Đối với Trường học</h3>
                            </div>
                            <ul className="space-y-3">
                                <li className="flex items-center gap-3 text-gray-700">
                                    <i className="ri-arrow-right-s-line text-blue-600"></i>
                                    <span>Học sinh THCS – THPT</span>
                                </li>
                                <li className="flex items-center gap-3 text-gray-700">
                                    <i className="ri-arrow-right-s-line text-blue-600"></i>
                                    <span>Sinh viên</span>
                                </li>
                                <li className="flex items-center gap-3 text-gray-700">
                                    <i className="ri-arrow-right-s-line text-blue-600"></i>
                                    <span>Phụ huynh</span>
                                </li>
                                <li className="flex items-center gap-3 text-gray-700">
                                    <i className="ri-arrow-right-s-line text-blue-600"></i>
                                    <span>Giáo viên, cố vấn học đường</span>
                                </li>
                            </ul>
                        </div>
                        <div className="bg-white rounded-2xl p-8 shadow-lg border-2 border-gray-100 hover:shadow-2xl hover:border-orange-200 transition-all duration-500 opacity-100 translate-y-0" style={{ transitionDelay: '800ms' }}>
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center">
                                    <i className="ri-building-line text-orange-600 text-2xl"></i>
                                </div>
                                <h3 className="text-2xl font-bold text-gray-700">Đối với Doanh nghiệp</h3>
                            </div>
                            <ul className="space-y-3">
                                <li className="flex items-center gap-3 text-gray-700">
                                    <i className="ri-arrow-right-s-line text-orange-600"></i>
                                    <span>Nhân sự trẻ</span>
                                </li>
                                <li className="flex items-center gap-3 text-gray-700">
                                    <i className="ri-arrow-right-s-line text-orange-600"></i>
                                    <span>Quản lý cấp trung</span>
                                </li>
                                <li className="flex items-center gap-3 text-gray-700">
                                    <i className="ri-arrow-right-s-line text-orange-600"></i>
                                    <span>Bộ phận nhân sự (HR)</span>
                                </li>
                                <li className="flex items-center gap-3 text-gray-700">
                                    <i className="ri-arrow-right-s-line text-orange-600"></i>
                                    <span>Đội ngũ sale, tư vấn, lãnh đạo</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default TargetAudience;
