import React from 'react';

const Footer = () => {
    return (
        <footer className="relative bg-gray-900 rounded-t-3xl mx-5 overflow-hidden">
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="text-[120px] md:text-[180px] font-black text-gray-800/30 select-none">DISC TRAINING</div>
            </div>
            <div className="relative z-10 container mx-auto px-8 py-16">
                <div className="grid md:grid-cols-4 gap-12">
                    <div>
                        <div className="flex items-center gap-3 mb-4">
                            {/* Using a placeholder for the logo or text if image is missing */}
                            <div className="h-12 w-auto flex items-center text-white font-bold text-2xl">DISC</div>
                        </div>
                        <h3 className="text-4xl font-black text-white mb-2">DISC</h3>
                        <p className="text-white/70 text-lg">Hiểu Con Đúng Cách</p>
                    </div>
                    <div>
                        <h4 className="text-white font-bold mb-6">Liên Kết</h4>
                        <ul className="space-y-3">
                            <li><a href="#" className="text-gray-400 hover:text-white transition-colors text-sm">Về DISC</a></li>
                            <li><a href="#" className="text-gray-400 hover:text-white transition-colors text-sm">Chương trình</a></li>
                            <li><a href="#" className="text-gray-400 hover:text-white transition-colors text-sm">Đối tượng</a></li>
                            <li><a href="#" className="text-gray-400 hover:text-white transition-colors text-sm">Giá trị</a></li>
                            <li><a href="#contact" className="text-gray-400 hover:text-white transition-colors text-sm">Liên hệ</a></li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="text-white font-bold mb-6">Kết Nối</h4>
                        <ul className="space-y-3">
                            <li><a href="#" className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm"><i className="ri-facebook-fill text-lg"></i>Facebook</a></li>
                            <li><a href="#" className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm"><i className="ri-youtube-fill text-lg"></i>YouTube</a></li>
                            <li><a href="#" className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm"><i className="ri-phone-fill text-lg"></i>Zalo</a></li>
                        </ul>
                    </div>
                    <div>
                        <p className="text-white text-sm mb-2">Nhận thông tin mới nhất</p>
                        <p className="text-white text-sm mb-4">về chương trình DISC</p>
                        <div className="relative">
                            <input placeholder="Email của bạn" className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-full text-white placeholder-gray-500 focus:outline-none focus:border-gray-600 pr-12" type="email" />
                            <button className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors">
                                <i className="ri-arrow-right-line text-gray-900"></i>
                            </button>
                        </div>
                    </div>
                </div>
                <div className="mt-16 pt-8 border-t border-gray-800">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                        <p className="text-gray-500 text-sm">© 2024 DISC Training. All rights reserved.</p>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
