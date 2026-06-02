import React from 'react';

const Solution = ({ config }) => {
    return (
        <section className="py-20 md:py-32 bg-white relative overflow-hidden">
            <div className="absolute inset-0 opacity-5">
                <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgb(20, 184, 166) 1px, transparent 0px)', backgroundSize: '48px 48px' }}></div>
            </div>
            <div className="container mx-auto px-4 relative z-10">
                <div className="text-center mb-16 transition-all duration-1000 opacity-100 translate-y-0">
                    <div className="inline-block mb-4">
                        <span className="px-6 py-2 bg-gradient-to-r from-teal-100 to-orange-100 border border-teal-200 rounded-full text-teal-700 text-sm font-bold tracking-wider uppercase">Giải pháp khoa học</span>
                    </div>
                    <h2 className="text-4xl md:text-5xl font-black text-gray-700 mb-6">
                        {config?.title || <><span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-600 to-orange-600">DISC</span> – Hiểu đúng con người để phát triển đúng hướng</>}
                    </h2>
                    <p className="text-xl text-gray-600 max-w-4xl mx-auto leading-relaxed">
                        DISC là mô hình khoa học giúp nhận diện cách một người suy nghĩ – phản ứng – giao tiếp – ra quyết định dựa trên 4 nhóm tính cách
                    </p>
                </div>
                <div className="max-w-6xl mx-auto mb-20">
                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className="group relative transition-all duration-700 opacity-100 translate-y-0" style={{ transitionDelay: '0ms' }}>
                            <div className="bg-red-50 border-red-200 border-2 rounded-3xl p-8 hover:shadow-2xl transition-all duration-300 hover:scale-105 h-full">
                                <div className="w-20 h-20 flex items-center justify-center rounded-2xl bg-gradient-to-br from-red-500 to-red-600 shadow-lg mb-6 mx-auto group-hover:scale-110 transition-transform duration-300">
                                    <span className="text-4xl font-black text-white">D</span>
                                </div>
                                <div className="text-center mb-4">
                                    <i className="ri-flashlight-line text-4xl text-gray-700"></i>
                                </div>
                                <h3 className="text-xl font-bold text-gray-700 text-center mb-2">Dominance</h3>
                                <p className="text-gray-600 text-center text-sm leading-relaxed">Quyết đoán, hành động nhanh</p>
                            </div>
                        </div>
                        <div className="group relative transition-all duration-700 opacity-100 translate-y-0" style={{ transitionDelay: '150ms' }}>
                            <div className="bg-yellow-50 border-yellow-200 border-2 rounded-3xl p-8 hover:shadow-2xl transition-all duration-300 hover:scale-105 h-full">
                                <div className="w-20 h-20 flex items-center justify-center rounded-2xl bg-gradient-to-br from-yellow-500 to-orange-500 shadow-lg mb-6 mx-auto group-hover:scale-110 transition-transform duration-300">
                                    <span className="text-4xl font-black text-white">I</span>
                                </div>
                                <div className="text-center mb-4">
                                    <i className="ri-star-smile-line text-4xl text-gray-700"></i>
                                </div>
                                <h3 className="text-xl font-bold text-gray-700 text-center mb-2">Influence</h3>
                                <p className="text-gray-600 text-center text-sm leading-relaxed">Giao tiếp, truyền cảm hứng</p>
                            </div>
                        </div>
                        <div className="group relative transition-all duration-700 opacity-100 translate-y-0" style={{ transitionDelay: '300ms' }}>
                            <div className="bg-green-50 border-green-200 border-2 rounded-3xl p-8 hover:shadow-2xl transition-all duration-300 hover:scale-105 h-full">
                                <div className="w-20 h-20 flex items-center justify-center rounded-2xl bg-gradient-to-br from-green-500 to-teal-500 shadow-lg mb-6 mx-auto group-hover:scale-110 transition-transform duration-300">
                                    <span className="text-4xl font-black text-white">S</span>
                                </div>
                                <div className="text-center mb-4">
                                    <i className="ri-heart-line text-4xl text-gray-700"></i>
                                </div>
                                <h3 className="text-xl font-bold text-gray-700 text-center mb-2">Steadiness</h3>
                                <p className="text-gray-600 text-center text-sm leading-relaxed">Ổn định, hỗ trợ, kiên trì</p>
                            </div>
                        </div>
                        <div className="group relative transition-all duration-700 opacity-100 translate-y-0" style={{ transitionDelay: '450ms' }}>
                            <div className="bg-blue-50 border-blue-200 border-2 rounded-3xl p-8 hover:shadow-2xl transition-all duration-300 hover:scale-105 h-full">
                                <div className="w-20 h-20 flex items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-500 shadow-lg mb-6 mx-auto group-hover:scale-110 transition-transform duration-300">
                                    <span className="text-4xl font-black text-white">C</span>
                                </div>
                                <div className="text-center mb-4">
                                    <i className="ri-bar-chart-box-line text-4xl text-gray-700"></i>
                                </div>
                                <h3 className="text-xl font-bold text-gray-700 text-center mb-2">Compliance</h3>
                                <p className="text-gray-600 text-center text-sm leading-relaxed">Phân tích, hệ thống, chính xác</p>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="max-w-4xl mx-auto mb-16 transition-all duration-1000 delay-500 opacity-100 translate-y-0">
                    <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-3xl p-10 md:p-12 shadow-2xl text-center">
                        <div className="flex items-center justify-center gap-3 mb-6">
                            <i className="ri-shield-check-line text-4xl text-teal-400"></i>
                            <p className="text-2xl md:text-3xl font-bold text-white">DISC không dán nhãn – không phán xét – không đúng sai</p>
                        </div>
                    </div>
                </div>
                <div className="max-w-5xl mx-auto transition-all duration-1000 delay-700 opacity-100 translate-y-0">
                    <div className="text-center mb-10">
                        <h3 className="text-3xl md:text-4xl font-bold text-gray-700 mb-4">DISC giúp bạn</h3>
                    </div>
                    <div className="grid md:grid-cols-3 gap-6">
                        <div className="group bg-gradient-to-br from-teal-50 to-orange-50 rounded-2xl p-8 border-2 border-teal-100 hover:border-teal-300 hover:shadow-xl transition-all duration-300 hover:scale-105">
                            <div className="w-16 h-16 flex items-center justify-center bg-gradient-to-br from-teal-500 to-orange-500 rounded-2xl mb-6 mx-auto group-hover:scale-110 transition-transform duration-300">
                                <i className="ri-user-heart-line text-3xl text-white"></i>
                            </div>
                            <p className="text-gray-700 text-center leading-relaxed font-medium">Hiểu điểm mạnh – điểm hạn chế bẩm sinh</p>
                        </div>
                        <div className="group bg-gradient-to-br from-teal-50 to-orange-50 rounded-2xl p-8 border-2 border-teal-100 hover:border-teal-300 hover:shadow-xl transition-all duration-300 hover:scale-105">
                            <div className="w-16 h-16 flex items-center justify-center bg-gradient-to-br from-teal-500 to-orange-500 rounded-2xl mb-6 mx-auto group-hover:scale-110 transition-transform duration-300">
                                <i className="ri-settings-3-line text-3xl text-white"></i>
                            </div>
                            <p className="text-gray-700 text-center leading-relaxed font-medium">Điều chỉnh cách học – cách làm – cách giao tiếp</p>
                        </div>
                        <div className="group bg-gradient-to-br from-teal-50 to-orange-50 rounded-2xl p-8 border-2 border-teal-100 hover:border-teal-300 hover:shadow-xl transition-all duration-300 hover:scale-105">
                            <div className="w-16 h-16 flex items-center justify-center bg-gradient-to-br from-teal-500 to-orange-500 rounded-2xl mb-6 mx-auto group-hover:scale-110 transition-transform duration-300">
                                <i className="ri-road-map-line text-3xl text-white"></i>
                            </div>
                            <p className="text-gray-700 text-center leading-relaxed font-medium">Chọn con đường phù hợp nhất, không phải con đường "được cho là tốt"</p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Solution;
