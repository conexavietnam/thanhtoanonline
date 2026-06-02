import React from 'react';

const Testimonials = () => {
    return (
        <section className="py-20 md:py-32 bg-gradient-to-b from-slate-50 to-white relative overflow-hidden">
            <div className="absolute inset-0 opacity-5">
                <div className="absolute top-20 left-20 w-96 h-96 bg-teal-500 rounded-full blur-3xl"></div>
                <div className="absolute bottom-20 right-20 w-80 h-80 bg-orange-500 rounded-full blur-3xl"></div>
            </div>
            <div className="container mx-auto px-4 relative z-10">
                <div className="text-center mb-16 transition-all duration-1000 opacity-100 translate-y-0">
                    <div className="inline-block mb-4">
                        <span className="px-6 py-2 bg-gradient-to-r from-teal-100 to-orange-100 border border-teal-200 rounded-full text-teal-700 text-sm font-bold tracking-wider uppercase">Phản hồi từ học viên</span>
                    </div>
                    <h2 className="text-4xl md:text-6xl font-black text-gray-700">
                        Những chia sẻ<span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-600 to-orange-600"> chân thực</span>
                    </h2>
                </div>
                <div className="grid md:grid-cols-3 gap-6 mb-6 max-w-7xl mx-auto">
                    <div className="transition-all duration-1000 delay-200 opacity-100 translate-y-0">
                        <div className="group bg-white rounded-3xl p-8 border-2 border-teal-100 hover:border-teal-300 shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 h-full">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center text-white font-bold shadow-lg group-hover:scale-110 transition-transform duration-300">TH</div>
                                <div>
                                    <div className="font-bold text-gray-700 text-lg">Cô Thu Hà</div>
                                    <div className="text-sm text-gray-600">Giáo viên THPT</div>
                                </div>
                            </div>
                            <i className="ri-double-quotes-l text-5xl text-teal-200 mb-4 block"></i>
                            <p className="text-gray-700 leading-relaxed">"Chương trình giúp tôi hiểu học sinh hơn và biết cách giao tiếp phù hợp với từng em. Các em cũng tự tin hơn khi hiểu rõ điểm mạnh của bản thân."</p>
                        </div>
                    </div>
                    <div className="transition-all duration-1000 delay-300 opacity-100 translate-y-0">
                        <div className="group bg-white rounded-3xl p-8 border-2 border-orange-100 hover:border-orange-300 shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 h-full">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center text-white font-bold shadow-lg group-hover:scale-110 transition-transform duration-300">ML</div>
                                <div>
                                    <div className="font-bold text-gray-700 text-lg">Chị Mai Linh</div>
                                    <div className="text-sm text-gray-600">Phụ huynh</div>
                                </div>
                            </div>
                            <i className="ri-double-quotes-l text-5xl text-orange-200 mb-4 block"></i>
                            <p className="text-gray-700 leading-relaxed">"Sau khóa học, tôi không còn áp đặt con theo ý mình nữa. Hiểu con đúng cách giúp gia đình tôi hòa thuận hơn rất nhiều."</p>
                        </div>
                    </div>
                    <div className="transition-all duration-1000 delay-400 opacity-100 translate-y-0">
                        <div className="group rounded-3xl overflow-hidden relative h-full shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105">
                            <div className="h-full min-h-[320px]">
                                <img alt="Học viên" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" src="https://readdy.ai/api/search-image?query=Professional%20Asian%20female%20teacher%20or%20parent%20smiling%20confidently%20portrait%20shot%20bright%20natural%20lighting%20warm%20expression%20showing%20satisfaction%20and%20happiness%20simple%20clean%20background&width=400&height=500&seq=testimonial-person-new-001&orientation=portrait" />
                            </div>
                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-gray-900/95 via-gray-900/80 to-transparent p-6">
                                <div className="font-bold text-white text-xl">Cô Phương Anh</div>
                                <div className="text-white/80">Cố vấn học đường</div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="grid md:grid-cols-[1.5fr,1fr] gap-6 max-w-7xl mx-auto">
                    <div className="transition-all duration-1000 delay-500 opacity-100 translate-y-0">
                        <div className="group rounded-3xl overflow-hidden relative min-h-[350px] shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105">
                            <img alt="Học sinh" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" src="https://readdy.ai/api/search-image?query=Happy%20Asian%20high%20school%20student%20smiling%20with%20books%20in%20modern%20school%20environment%20confident%20expression%20showing%20personal%20growth%20and%20self%20understanding%20bright%20natural%20lighting%20simple%20clean%20background&width=800&height=500&seq=student-testimonial-new-002&orientation=landscape" />
                            <div className="absolute bottom-0 left-0 bg-gradient-to-r from-teal-900/95 to-teal-900/85 p-10 max-w-lg rounded-tr-3xl">
                                <div className="font-bold text-white text-2xl mb-2">Minh Khang</div>
                                <div className="text-white/80 mb-4 text-lg">Học sinh lớp 11</div>
                                <p className="text-white/90 leading-relaxed">"Em hiểu mình hơn và biết mình phù hợp với ngành nào. Không còn bị bố mẹ ép học theo ý họ nữa."</p>
                            </div>
                        </div>
                    </div>
                    <div className="flex flex-col gap-6">
                        <div className="transition-all duration-1000 delay-600 opacity-100 translate-y-0">
                            <div className="group bg-white rounded-3xl p-8 border-2 border-teal-100 hover:border-teal-300 shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 flex-1">
                                <i className="ri-double-quotes-l text-4xl text-teal-200 mb-4 block"></i>
                                <p className="text-gray-700 leading-relaxed mb-6">"Đội ngũ nhân sự của chúng tôi làm việc hiệu quả hơn nhiều sau khi áp dụng DISC."</p>
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center text-white font-bold shadow-lg group-hover:scale-110 transition-transform duration-300">AT</div>
                                    <div>
                                        <div className="font-bold text-gray-700">Anh Tuấn</div>
                                        <div className="text-sm text-gray-600">Giám đốc HR</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="transition-all duration-1000 delay-700 opacity-100 translate-y-0">
                            <div className="group bg-white rounded-3xl p-8 border-2 border-orange-100 hover:border-orange-300 shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 flex-1">
                                <i className="ri-double-quotes-l text-4xl text-orange-200 mb-4 block"></i>
                                <p className="text-gray-700 leading-relaxed mb-6">"Chương trình rất thực tế và dễ áp dụng. Không khô khan lý thuyết."</p>
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center text-white font-bold shadow-lg group-hover:scale-110 transition-transform duration-300">HN</div>
                                    <div>
                                        <div className="font-bold text-gray-700">Hương Ngân</div>
                                        <div className="text-sm text-gray-600">Quản lý đào tạo</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Testimonials;
