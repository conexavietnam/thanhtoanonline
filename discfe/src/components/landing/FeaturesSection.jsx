import { motion } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBullseye, faChartLine, faUsers, faBrain, faFileContract, faShieldAlt } from "@fortawesome/free-solid-svg-icons";

const features = [
    {
        icon: faBullseye,
        title: "Độ Chính Xác Cao",
        description: "Thuật toán được xây dựng dựa trên lý thuyết DISC gốc của William Marston, đảm bảo kết quả phản ánh đúng hành vi người dùng.",
        color: "bg-primary"
    },
    {
        icon: faChartLine,
        title: "Báo Cáo Chi Tiết",
        description: "Không chỉ dừng lại ở nhóm tính cách, chúng tôi cung cấp phân tích sâu về điểm mạnh, điểm yếu và môi trường làm việc lý tưởng.",
        color: "bg-secondary"
    },
    {
        icon: faBrain,
        title: "Lộ Trình Phát Triển",
        description: "Đề xuất lộ trình phát triển bản thân (PDP) và nghề nghiệp cụ thể dựa trên hồ sơ tính cách của bạn.",
        color: "bg-accent"
    },
    {
        icon: faUsers,
        title: "Thấu Hiểu Đội Nhóm",
        description: "Công cụ tuyệt vời cho HR và quản lý để xây dựng đội ngũ, cải thiện giao tiếp và tối ưu hóa hiệu suất làm việc.",
        color: "bg-info"
    },
    {
        icon: faFileContract,
        title: "Tài Liệu Chuyên Sâu",
        description: "Thư viện tài liệu phong phú về DISC, kỹ năng mềm và quản trị nhân sự được cập nhật thường xuyên.",
        color: "bg-warning"
    },
    {
        icon: faShieldAlt,
        title: "Bảo Mật & Riêng Tư",
        description: "Dữ liệu cá nhân của bạn được mã hóa và bảo vệ theo tiêu chuẩn, cam kết không chia sẻ với bên thứ ba.",
        color: "bg-success"
    }
];

const FeaturesSection = ({ config }) => {
    const title = config?.title || "Tại sao chọn";
    const highlightedText = config?.highlightedText || "DISCWAKE?";
    const subtitle = config?.subtitle || "Hệ thống phân tích tính cách toàn diện, giúp bạn thấu hiểu bản thân và định hướng sự nghiệp vững chắc.";

    return (
        <section className="py-24 relative overflow-hidden">
            <div className="container mx-auto px-4 relative z-10">
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-4xl font-bold mb-4"
                    >
                        {title} <span className="text-gradient">{highlightedText}</span>
                    </motion.h2>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 }}
                        className="text-lg text-base-content/70"
                    >
                        {subtitle}
                    </motion.p>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {features.map((feature, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.1 }}
                            className="glass-card rounded-2xl p-8 hover:-translate-y-2"
                        >
                            <div className={`w-14 h-14 rounded-xl ${feature.color} flex items-center justify-center text-white text-2xl mb-6 shadow-lg`}>
                                <FontAwesomeIcon icon={feature.icon} />
                            </div>
                            <h3 className="text-xl font-bold mb-3 text-base-content">{feature.title}</h3>
                            <p className="text-base-content/70 leading-relaxed">
                                {feature.description}
                            </p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default FeaturesSection;
