import { motion } from "framer-motion";

// Quốc Trí: chuyển testimonials mặc định sang ngữ cảnh phụ huynh nhận xét về phần mềm.
const testimonials = [
    {
        name: "Chị Thu Hà",
        role: "Phụ huynh học sinh lớp 9",
        content: "Phần mềm giúp tôi hiểu rõ điểm mạnh và cách tiếp cận phù hợp với con. Sau khi xem báo cáo, gia đình trao đổi với con dễ hơn và có định hướng học tập rõ ràng hơn.",
        avatar: "https://ui-avatars.com/api/?name=Chi+Thu+Ha&background=6366f1&color=fff"
    },
    {
        name: "Anh Minh Quân",
        role: "Phụ huynh học sinh THPT",
        content: "Giao diện phần mềm dễ dùng, nội dung báo cáo rõ ràng và sát thực tế. Tôi có thể cùng con làm bài, rồi dựa vào kết quả để hiểu con phù hợp với môi trường học tập nào.",
        avatar: "https://ui-avatars.com/api/?name=Anh+Minh+Quan&background=ec4899&color=fff"
    },
    {
        name: "Chị Ngọc Lan",
        role: "Phụ huynh học sinh lớp 12",
        content: "Nhờ phần mềm này, tôi bớt lo hơn khi cùng con chọn hướng đi tương lai. Các phân tích dễ hiểu, giúp phụ huynh nắm được tính cách của con để đồng hành đúng cách hơn.",
        avatar: "https://ui-avatars.com/api/?name=Chi+Ngoc+Lan&background=14b8a6&color=fff"
    }
];

const TestimonialsSection = ({ config }) => {
    const title = config?.title || "Phụ huynh nhận xét gì về phần mềm?";
    const subtitle = config?.subtitle || "Những chia sẻ thực tế từ phụ huynh sau khi đồng hành cùng con và sử dụng báo cáo DISC.";

    return (
        <section className="relative overflow-hidden py-24 bg-base-200/50">
            {/* Decor */}
            <div className="absolute top-1/2 left-0 w-64 h-64 bg-primary/5 rounded-full filter blur-3xl"></div>
            <div className="absolute bottom-0 right-0 w-64 h-64 bg-secondary/5 rounded-full filter blur-3xl"></div>

            <div className="container mx-auto px-4 relative z-10">
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <h2 className="text-4xl font-bold mb-4 text-base-content">{title}</h2>
                    <p className="text-lg text-base-content/70">
                        {subtitle}
                    </p>
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                    {testimonials.map((item, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, scale: 0.9 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.1 }}
                            className="bg-base-100 rounded-2xl p-8 shadow-sm border border-base-200"
                        >
                            <div className="flex items-center gap-4 mb-6">
                                <img src={item.avatar} alt={item.name} className="w-12 h-12 rounded-full" />
                                <div>
                                    <h4 className="font-bold text-base-content">{item.name}</h4>
                                    <p className="text-sm text-base-content/60">{item.role}</p>
                                </div>
                            </div>
                            <p className="text-base-content/80 italic">"{item.content}"</p>
                            <div className="flex text-yellow-400 mt-4 gap-1">
                                {[...Array(5)].map((_, i) => (
                                    <span key={i}>★</span>
                                ))}
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default TestimonialsSection;
