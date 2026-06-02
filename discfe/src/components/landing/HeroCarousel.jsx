import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { buildAssetUrl } from "../../lib/api.js";

const HeroCarousel = ({ slides }) => {
    const [currentSlide, setCurrentSlide] = useState(0);

    useEffect(() => {
        if (!slides || slides.length <= 1) return;
        const timer = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % slides.length);
        }, 5000);
        return () => clearInterval(timer);
    }, [slides]);

    if (!slides || slides.length === 0) return null;

    const currentSlideData = slides[currentSlide];
    const slideImage = (
        <img
            src={buildAssetUrl(currentSlideData.imageUrl)}
            alt={currentSlideData.altText || currentSlideData.title || "Slide"}
            className="block h-full w-full object-cover"
        />
    );

    return (
        <section className="relative isolate w-full overflow-hidden bg-base-100">
            <div className="absolute inset-0 bg-gradient-to-b from-slate-950/10 via-transparent to-slate-950/10 z-10 pointer-events-none" />

            <AnimatePresence mode="wait">
                <motion.div
                    key={currentSlide}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.5 }}
                    className="relative z-0 h-[42vw] min-h-[320px] max-h-[720px] w-full"
                >
                    {currentSlideData?.imageUrl && (
                        <div className="h-full w-full">
                            {currentSlideData.link ? (
                                <a
                                    href={currentSlideData.link}
                                    className="block h-full w-full"
                                    target="_blank"
                                    rel="noreferrer"
                                >
                                    {slideImage}
                                </a>
                            ) : slideImage}
                        </div>
                    )}
                </motion.div>
            </AnimatePresence>

            {/* Navigation Dots */}
            {slides.length > 1 && (
                <div className="absolute bottom-6 left-1/2 z-20 flex -translate-x-1/2 gap-2 rounded-full bg-white/70 px-3 py-2 shadow-lg backdrop-blur">
                    {slides.map((_, index) => (
                        <button
                            key={index}
                            onClick={() => setCurrentSlide(index)}
                            className={`h-3 w-3 rounded-full transition-all ${currentSlide === index ? "bg-primary w-8" : "bg-slate-300 hover:bg-primary/50"
                                }`}
                        />
                    ))}
                </div>
            )}
        </section>
    );
};

export default HeroCarousel;
