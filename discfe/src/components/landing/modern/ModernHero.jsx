import { Link } from "react-router";
import { motion } from "framer-motion";

const ModernHero = () => {
    return (
        <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-gray-900 via-slate-800 to-teal-900">
            {/* Background Effects */}
            <div className="absolute inset-0 opacity-10">
                <div
                    className="absolute inset-0"
                    style={{
                        backgroundImage: "radial-gradient(circle at 2px 2px, white 1px, transparent 0px)",
                        backgroundSize: "40px 40px"
                    }}
                ></div>
            </div>
            <div className="absolute top-20 left-10 w-72 h-72 bg-orange-500/20 rounded-full blur-3xl animate-pulse"></div>
            <div
                className="absolute bottom-20 right-10 w-96 h-96 bg-teal-500/20 rounded-full blur-3xl animate-pulse"
                style={{ animationDelay: "1s" }}
            ></div>

            <div className="container mx-auto px-4 relative z-10">
                <div className="max-w-5xl mx-auto text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 1 }}
                    >
                        <h1 className="text-5xl md:text-7xl font-black text-white mb-6 leading-tight">
                            Hiểu Người Đúng Cách<br />
                            Giúp Họ Chọn Đường Đúng
                        </h1>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 1, delay: 0.2 }}
                    >
                        <p className="text-2xl md:text-3xl text-teal-300 font-semibold mb-8">
                            DISC – Chìa khóa thấu hiểu tính cách & định hướng tương lai bền vững
                        </p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 1, delay: 0.3 }}
                        className="max-w-3xl mx-auto mb-12"
                    >
                        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20">
                            <p className="text-xl text-white/95 leading-relaxed">
                                Không phải họ kém cỏi, không tài năng.<br />
                                Có thể họ chỉ đang đi sai con đường phù hợp với tính cách của mình.
                            </p>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 1, delay: 0.5 }}
                        className="grid md:grid-cols-3 gap-6 mb-12"
                    >
                        {[
                            { icon: "ri-team-line", text: "Dành cho con cái, nhân viên, đồng nghiệp, đối tác, khách hàng" },
                            { icon: "ri-award-line", text: "Chương trình đào tạo & tư vấn DISC ứng dụng thực tiễn" },
                            { icon: "ri-user-star-line", text: "Đồng hành bởi chuyên gia hơn 20 năm kinh nghiệm" }
                        ].map((item, index) => (
                            <div key={index} className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10 hover:bg-white/10 transition-all">
                                <i className={`${item.icon} text-4xl text-orange-400 mb-3 block`}></i>
                                <p className="text-white/90">{item.text}</p>
                            </div>
                        ))}
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 1, delay: 0.9 }}
                        className="flex flex-col sm:flex-row gap-4 justify-center items-center"
                    >
                        <Link
                            to="/test"
                            className="group relative px-10 py-5 bg-gradient-to-r from-teal-400 to-emerald-400 text-gray-900 rounded-full font-bold text-xl hover:shadow-2xl hover:shadow-teal-500/50 transition-all duration-300 hover:scale-110 whitespace-nowrap overflow-hidden"
                        >
                            <span className="relative z-10">Làm bài Test</span>
                            <div className="absolute inset-0 bg-gradient-to-r from-teal-300 to-emerald-300 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        </Link>
                        <Link
                            to="/plans"
                            className="px-10 py-5 bg-white/10 backdrop-blur-sm text-white rounded-full font-bold text-xl border-2 border-white/30 hover:bg-white/20 hover:border-white/50 transition-all duration-300 hover:scale-105 whitespace-nowrap"
                        >
                            Xem các gói dịch vụ
                        </Link>
                    </motion.div>
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

export default ModernHero;
