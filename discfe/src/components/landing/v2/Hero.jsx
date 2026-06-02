import React from 'react';
import { Link } from 'react-router';

const Hero = ({ config }) => {
    return (
        <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-gray-900 via-slate-800 to-teal-900">
            <div className="absolute inset-0 opacity-10">
                <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0px)', backgroundSize: '40px 40px' }}></div>
            </div>
            <div className="absolute top-20 left-10 w-72 h-72 bg-orange-500/20 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute bottom-20 right-10 w-96 h-96 bg-teal-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
            <div className="container mx-auto px-4 relative z-10">
                <div className="max-w-5xl mx-auto text-center">
                    <div className="transition-all duration-1000 opacity-100 translate-y-0">

                        <h1 className="text-5xl md:text-7xl font-black text-white mb-6 leading-tight">
                            {config?.title || <><span className="block">Hiểu Người Đúng Cách</span><span>Giúp Họ Chọn Đường Đúng</span></>}
                        </h1>
                    </div>
                    <div className="transition-all duration-1000 delay-200 opacity-100 translate-y-0">

                        <p className="text-2xl md:text-3xl text-teal-300 font-semibold mb-8">
                            {config?.subtitle || "DISC – Chìa khóa thấu hiểu tính cách & định hướng tương lai bền vững"}
                        </p>
                    </div>
                    <div className="max-w-3xl mx-auto mb-12 transition-all duration-1000 delay-300 opacity-100 translate-y-0">
                        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20">

                            <p className="text-xl text-white/95 leading-relaxed whitespace-pre-line">
                                {config?.description || "Không phải họ kém cỏi, không tài năng.\nCó thể họ chỉ đang đi sai con đường phù hợp với tính cách của mình."}
                            </p>
                        </div>
                    </div>
                    <div className="grid md:grid-cols-3 gap-6 mb-12 transition-all duration-1000 delay-500 opacity-100 translate-y-0">
                        <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10 hover:bg-white/10 transition-all">
                            <i className="ri-team-line text-4xl text-orange-400 mb-3"></i>
                            <p className="text-white/90">Dành cho con cái, nhân viên, đồng nghiệp, đối tác, khách hàng</p>
                        </div>
                        <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10 hover:bg-white/10 transition-all">
                            <i className="ri-award-line text-4xl text-orange-400 mb-3"></i>
                            <p className="text-white/90">Chương trình đào tạo &amp; tư vấn DISC ứng dụng thực tiễn</p>
                        </div>
                        <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10 hover:bg-white/10 transition-all">
                            <i className="ri-user-star-line text-4xl text-orange-400 mb-3"></i>
                            <p className="text-white/90">Đồng hành bởi chuyên gia hơn 20 năm kinh nghiệm</p>
                        </div>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center items-center transition-all duration-1000 delay-900 opacity-100 translate-y-0">
                        <a href="#contact" className="group relative px-10 py-5 bg-gradient-to-r from-teal-400 to-emerald-400 text-gray-900 rounded-full font-bold text-xl hover:shadow-2xl hover:shadow-teal-500/50 transition-all duration-300 hover:scale-110 whitespace-nowrap">
                            <span className="relative z-10">{config?.ctaText || "Đăng ký tư vấn miễn phí"}</span>
                            <div className="absolute inset-0 bg-gradient-to-r from-teal-300 to-emerald-300 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        </a>
                        <Link to="/test" className="px-10 py-5 bg-white/10 backdrop-blur-sm text-white rounded-full font-bold text-xl border-2 border-white/30 hover:bg-white/20 hover:border-white/50 transition-all duration-300 hover:scale-105 whitespace-nowrap">
                            Làm bài Test
                        </Link>
                    </div>
                </div>
            </div>
            <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
                <div className="w-6 h-10 border-2 border-white/30 rounded-full flex items-start justify-center p-2">
                    <div className="w-1 h-2 bg-white/50 rounded-full"></div>
                </div>
            </div>
        </section>
    );
};

export default Hero;
