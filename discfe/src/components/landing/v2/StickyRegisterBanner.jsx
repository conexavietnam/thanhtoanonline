import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { motion, AnimatePresence } from 'framer-motion';

const StickyRegisterBanner = () => {
    const [isVisible, setIsVisible] = useState(false);
    const [isDismissed, setIsDismissed] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            if (isDismissed) return;

            // Show when user has scrolled 40% of the page
            const scrollPercentage = (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100;

            if (scrollPercentage > 20) {
                setIsVisible(true);
            } else {
                setIsVisible(false);
            }
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, [isDismissed]);

    if (isDismissed) return null;

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 100, opacity: 0 }}
                    transition={{ duration: 0.5, type: 'spring', bounce: 0.2 }}
                    className="fixed bottom-0 left-0 right-0 z-40 p-4"
                >
                    <div className="mx-auto max-w-4xl bg-white/90 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl p-4 md:p-5 flex flex-col md:flex-row items-center justify-between gap-4 relative overflow-hidden">
                        {/* Decorative background glow */}
                        <div className="absolute top-0 left-1/4 w-1/2 h-full bg-primary/5 blur-3xl rounded-full -z-10"></div>

                        {/* Content */}
                        <div className="flex items-center gap-4 z-10">
                            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-primary">
                                    <path fillRule="evenodd" d="M9 4.5a.75.75 0 0 1 .721.544l.813 2.846a3.75 3.75 0 0 0 2.576 2.576l2.846.813a.75.75 0 0 1 0 1.442l-2.846.813a3.75 3.75 0 0 0-2.576 2.576l-.813 2.846a.75.75 0 0 1-1.442 0l-.813-2.846a3.75 3.75 0 0 0-2.576-2.576l-2.846-.813a.75.75 0 0 1 0-1.442l2.846-.813a3.75 3.75 0 0 0 2.576-2.576l.813-2.846A.75.75 0 0 1 9 4.5ZM6.97 11.03a.75.75 0 1 1 1.06-1.06l.75.75a.75.75 0 0 1-1.06 1.06l-.75-.75Z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <div className="text-center md:text-left">
                                <h3 className="text-lg font-bold text-gray-900">Khám phá bản thân ngay hôm nay</h3>
                                <p className="text-sm text-gray-600">Làm bài test DISC miễn phí chỉ trong 20 phút</p>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-3 w-full md:w-auto z-10">
                            <Link
                                to="/register"
                                className="btn btn-primary rounded-xl flex-1 md:flex-none shadow-lg shadow-primary/20 hover:shadow-primary/40 border-none bg-gradient-to-r from-primary to-primary/90 text-white font-bold"
                            >
                                Đăng ký ngay
                            </Link>
                            <button
                                onClick={() => setIsDismissed(true)}
                                className="btn btn-circle btn-ghost btn-sm hover:bg-gray-100/50"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default StickyRegisterBanner;
