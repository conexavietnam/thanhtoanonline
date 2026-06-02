import FadeInUp from "../../common/FadeInUp";

const ProblemSection = () => {
    return (
        <section className="py-20 md:py-32 bg-gradient-to-b from-slate-50 to-white relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full opacity-5">
                <div className="absolute top-20 left-10 w-64 h-64 bg-red-500 rounded-full blur-3xl"></div>
                <div className="absolute bottom-20 right-10 w-80 h-80 bg-orange-500 rounded-full blur-3xl"></div>
            </div>

            <div className="container mx-auto px-4 relative z-10">
                <FadeInUp className="text-center mb-16">
                    <div className="inline-block mb-4">
                        <span className="px-6 py-2 bg-gradient-to-r from-red-100 to-orange-100 border border-red-200 rounded-full text-red-700 text-sm font-bold tracking-wider uppercase">
                            Vấn đề cần giải quyết
                        </span>
                    </div>
                    <h2 className="text-4xl md:text-5xl font-black text-gray-700 mb-6 leading-tight">
                        Bạn có đang gặp <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-orange-600">những trăn trở này?</span>
                    </h2>
                </FadeInUp>

                <div className="max-w-5xl mx-auto mb-16">
                    <div className="grid md:grid-cols-2 gap-6">
                        {[
                            { icon: "ri-question-line", color: "from-red-500 to-orange-500", text: "Con cái học nhiều nhưng không biết mình giỏi gì – thích gì" },
                            { icon: "ri-chat-delete-line", color: "from-orange-500 to-amber-500", text: "Phụ huynh và con, sếp và nhân viên nói chuyện không hiểu nhau" },
                            { icon: "ri-emotion-unhappy-line", color: "from-amber-500 to-yellow-500", text: "Chọn ngành, chọn việc theo trào lưu → chán nản, bỏ dở" },
                            { icon: "ri-compass-3-line", color: "from-red-600 to-pink-500", text: "Nhân sự, đối tác thiếu định hướng → nhảy việc, mất động lực" },
                            { icon: "ri-radar-line", color: "from-orange-600 to-red-600", text: "Giao tiếp trong gia đình, công ty, đối tác dễ xung đột, hiểu lầm" },
                        ].map((item, index) => (
                            <FadeInUp
                                key={index}
                                delay={index * 0.1}
                                className="group bg-white rounded-3xl p-8 shadow-lg hover:shadow-2xl border border-gray-100 hover:border-orange-200 transition-all duration-300"
                            >
                                <div className="flex items-start gap-4">
                                    <div className={`flex-shrink-0 w-14 h-14 flex items-center justify-center rounded-2xl bg-gradient-to-br ${item.color} shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                                        <i className={`${item.icon} text-2xl text-white`}></i>
                                    </div>
                                    <p className="text-gray-700 text-lg leading-relaxed flex-1 pt-2">
                                        {item.text}
                                    </p>
                                </div>
                            </FadeInUp>
                        ))}
                    </div>
                </div>

                <FadeInUp delay={0.5} className="max-w-4xl mx-auto text-center">
                    <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl p-10 shadow-2xl">
                        <div className="flex items-center justify-center gap-3 mb-4">
                            <i className="ri-lightbulb-flash-line text-4xl text-white"></i>
                            <h3 className="text-2xl md:text-3xl font-bold text-white">Gốc rễ vấn đề</h3>
                        </div>
                        <p className="text-xl text-white/95 leading-relaxed">
                            Không nằm ở năng lực – mà ở sự <strong>không thấu hiểu tính cách</strong> và <strong>không biết cách làm việc phù hợp</strong> với từng người
                        </p>
                    </div>
                </FadeInUp>
            </div>
        </section>
    );
};

export default ProblemSection;
