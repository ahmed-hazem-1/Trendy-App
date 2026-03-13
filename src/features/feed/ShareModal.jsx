import { X, Copy, Check, Link } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";

const SOCIAL_PLATFORMS = [
  {
    name: "فيسبوك",
    key: "facebook",
    color: "#1877F2",
    icon: (
      <svg viewBox="0 0 24 24" className="h-6 w-6 fill-white">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      </svg>
    ),
  },
  {
    name: "واتساب",
    key: "whatsapp",
    color: "#25D366",
    icon: (
      <svg viewBox="0 0 24 24" className="h-6 w-6 fill-white">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
      </svg>
    ),
  },
  {
    name: "تيليجرام",
    key: "telegram",
    color: "#0088CC",
    icon: (
      <svg viewBox="0 0 24 24" className="h-6 w-6 fill-white">
        <path d="M11.944 0A12 12 0 000 12a12 12 0 0012 12 12 12 0 0012-12A12 12 0 0012 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 01.171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.479.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
      </svg>
    ),
  },
  {
    name: "إكس",
    key: "twitter",
    color: "#000000",
    icon: (
      <svg viewBox="0 0 24 24" className="h-6 w-6 fill-white">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
  },
  {
    name: "لينكدإن",
    key: "linkedin",
    color: "#0A66C2",
    icon: (
      <svg viewBox="0 0 24 24" className="h-6 w-6 fill-white">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
      </svg>
    ),
  },
  {
    name: "بريد إلكتروني",
    key: "email",
    color: "#EA4335",
    icon: (
      <svg viewBox="0 0 24 24" className="h-6 w-6 fill-white">
        <path d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 010 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L5.455 4.64 12 9.548l6.545-4.91 1.528-1.145C21.69 2.28 24 3.434 24 5.457z" />
      </svg>
    ),
  },
];

function buildShareUrl(platform, postUrl, title) {
  const encodedUrl = encodeURIComponent(postUrl);
  const encodedTitle = encodeURIComponent(title);

  switch (platform) {
    case "facebook":
      return `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
    case "whatsapp":
      return `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`;
    case "telegram":
      return `https://t.me/share/url?url=${encodedUrl}&text=${encodedTitle}`;
    case "twitter":
      return `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`;
    case "linkedin":
      return `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`;
    case "email":
      return `mailto:?subject=${encodedTitle}&body=${encodedUrl}`;
    default:
      return "#";
  }
}

export default function ShareModal({ isOpen, onClose, postUrl, postTitle }) {
  const [copied, setCopied] = useState(false);
  const modalRef = useRef(null);

  // Close on Escape key
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === "Escape") onClose();
    }
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  function handleBackdropClick(e) {
    if (modalRef.current && !modalRef.current.contains(e.target)) {
      onClose();
    }
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(postUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
      const input = document.createElement("input");
      input.value = postUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  function handleShare(platform) {
    const url = buildShareUrl(platform, postUrl, postTitle);
    if (platform === "email") {
      const a = document.createElement("a");
      a.href = url;
      a.click();
    } else {
      window.open(url, "_blank", "noopener,noreferrer");
    }
  }

  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-0 sm:px-4"
      onClick={handleBackdropClick}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 share-backdrop-enter" />

      {/* Modal */}
      <div
        ref={modalRef}
        className="relative w-full max-w-full sm:max-w-md bg-white rounded-t-2xl sm:rounded-2xl share-modal-enter overflow-hidden max-h-[85vh] sm:max-h-[90vh] flex flex-col"
      >
        {/* Mobile drag handle */}
        <div className="flex justify-center pt-2.5 pb-0 sm:hidden">
          <div className="w-10 h-1 rounded-full bg-gray-300" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-5 py-3 sm:py-4 border-b border-gray-100">
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
          <h3 className="text-sm sm:text-base font-bold text-gray-800">
            مشاركة المنشور
          </h3>
          <div className="w-8" /> {/* spacer for centering */}
        </div>

        {/* Social Grid */}
        <div className="px-4 sm:px-5 py-4 sm:py-5 overflow-y-auto">
          <div className="grid grid-cols-3 gap-3 sm:gap-4">
            {SOCIAL_PLATFORMS.map((platform) => (
              <button
                key={platform.key}
                onClick={() => handleShare(platform.key)}
                className="flex flex-col items-center gap-1.5 sm:gap-2 group cursor-pointer active:scale-95 transition-transform"
              >
                <div
                  className="h-12 w-12 sm:h-14 sm:w-14 rounded-full flex items-center justify-center transition-transform group-hover:scale-110"
                  style={{ backgroundColor: platform.color }}
                >
                  <span className="[&>svg]:h-5 [&>svg]:w-5 sm:[&>svg]:h-6 sm:[&>svg]:w-6">
                    {platform.icon}
                  </span>
                </div>
                <span className="text-[11px] sm:text-xs font-medium text-gray-600 group-hover:text-gray-900 transition">
                  {platform.name}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Copy Link Section */}
        <div className="px-4 sm:px-5 pb-4 sm:pb-5">
          <div className="flex flex-col xs:flex-row items-stretch xs:items-center gap-2 rounded-xl bg-gray-50 border border-gray-200 px-3 py-2.5">
            <div className="flex items-center gap-2 min-w-0 flex-1 order-1 xs:order-none">
              <Link className="h-4 w-4 text-gray-400 shrink-0" />
              <p
                className="text-xs sm:text-sm text-gray-500 truncate flex-1 text-left"
                dir="ltr"
              >
                {postUrl}
              </p>
            </div>
            <button
              onClick={handleCopy}
              className={`shrink-0 px-3 py-2 sm:py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer order-2 xs:order-none ${
                copied
                  ? "bg-green-500 text-white"
                  : "bg-teal-500 hover:bg-teal-600 active:bg-teal-700 text-white"
              }`}
            >
              {copied ? (
                <span className="flex items-center justify-center gap-1">
                  <Check className="h-3.5 w-3.5" />
                  تم النسخ
                </span>
              ) : (
                <span className="flex items-center justify-center gap-1">
                  <Copy className="h-3.5 w-3.5" />
                  نسخ الرابط
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Bottom safe-area for mobile */}
        <div className="h-[env(safe-area-inset-bottom,8px)] sm:h-0" />
      </div>
    </div>,
    document.body,
  );
}
