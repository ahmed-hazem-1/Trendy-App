import { X } from "lucide-react";
import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";

export default function PostImagePreviewModal({
  isOpen,
  imageSrc,
  imageAlt,
  title,
  postPath,
  category,
  description,
  onClose,
}) {
  const modalRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return undefined;

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        onClose?.();
      }
    }

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  function handleBackdropClick(event) {
    if (modalRef.current && !modalRef.current.contains(event.target)) {
      onClose?.();
    }
  }

  if (!isOpen || !imageSrc) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center p-3 sm:p-5"
      onClick={handleBackdropClick}
    >
      <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" />

      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        className="relative z-10 w-full max-w-5xl overflow-hidden rounded-2xl bg-white shadow-2xl"
      >
        <div className="relative bg-black">
          <img
            src={imageSrc}
            alt={imageAlt || "معاينة الصورة"}
            className="max-h-[72vh] w-full object-contain bg-black"
            loading="eager"
            decoding="async"
          />

          <button
            onClick={onClose}
            className="absolute left-3 top-3 rounded-full bg-black/50 p-2 text-white hover:bg-black/70 transition cursor-pointer"
            title="إغلاق"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-4 py-4 sm:px-6 sm:py-5 text-right">
          <div className="mb-2 flex flex-wrap items-center justify-end gap-2">
            <span className="rounded-full bg-gray-100 px-2.5 py-1 text-[11px] font-semibold text-gray-600">
              معاينة الصورة
            </span>
            {category ? (
              <span className="rounded-full bg-teal-50 px-2.5 py-1 text-[11px] font-semibold text-teal-700">
                {category}
              </span>
            ) : null}
          </div>

          {title ? (
            postPath ? (
              <Link
                to={postPath}
                onClick={onClose}
                className="block text-sm sm:text-base font-bold text-gray-900 leading-snug mb-2 hover:text-teal-700 hover:underline transition"
                title="الانتقال إلى صفحة الخبر"
              >
                {title}
              </Link>
            ) : (
              <h3 className="text-sm sm:text-base font-bold text-gray-900 leading-snug mb-2">
                {title}
              </h3>
            )
          ) : null}

          {description ? (
            <p className="text-xs sm:text-sm text-gray-600 leading-relaxed line-clamp-4">
              {description}
            </p>
          ) : null}
        </div>
      </div>
    </div>,
    document.body,
  );
}
