import { ArrowUp } from "lucide-react";
import { useState, useEffect } from "react";

export default function ScrollToTop() {
  const [showScrollUp, setShowScrollUp] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Show button if scrolled down slightly (e.g., 300px)
      if (window.scrollY > 300) {
        setShowScrollUp(true);
      } else {
        setShowScrollUp(false);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div
      className={`fixed bottom-[96px] lg:bottom-12 right-6 lg:right-10 z-50 transition-all duration-300 ${
        showScrollUp
          ? "opacity-100 translate-y-0"
          : "opacity-0 translate-y-4 pointer-events-none"
      }`}
    >
      <button
        onClick={scrollToTop}
        className="pointer-events-auto h-12 w-12 bg-white/90 backdrop-blur-md text-teal-600 rounded-full shadow-xl flex items-center justify-center border border-gray-200 hover:bg-white hover:text-teal-700 hover:scale-105 active:scale-95 transition-all cursor-pointer"
        aria-label="Scroll to top"
      >
        <ArrowUp className="h-6 w-6" strokeWidth={2.5} />
      </button>
    </div>
  );
}