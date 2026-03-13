import { X, Users, Settings, Megaphone } from "lucide-react";
import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";

export default function AdminModal({ isOpen, onClose }) {
  const modalRef = useRef(null);

  // Lock body scroll & close on Escape
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

  function handleItemClick() {
    onClose();
  }

  const adminPages = [
    {
      label: "إدارة المصادر والتصنيفات",
      path: "/admin/sources",
      icon: Settings,
      description: "إدارة مصادر الأخبار والتصنيفات",
    },
    {
      label: "إدارة الإعلانات",
      path: "/admin/ads",
      icon: Megaphone,
      description: "إدارة الإعلانات والحملات",
    },
    {
      label: "إدارة المستخدمين",
      path: "/admin/users",
      icon: Users,
      description: "إدارة حسابات المستخدمين",
    },
  ];

  return (
    <div
      className={`fixed inset-0 z-[60] lg:hidden transition-[opacity] duration-300 ${
        isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
      onClick={handleBackdropClick}
      aria-hidden={!isOpen}
    >
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-black/40 transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "opacity-0"
        }`}
      />

      {/* Modal — slides from bottom */}
      <div
        ref={modalRef}
        className={`absolute bottom-0 left-0 right-0 bg-white transition-transform duration-300 rounded-t-3xl max-h-[70vh] overflow-y-auto ${
          isOpen ? "translate-y-0" : "translate-y-full"
        }`}
        style={{
          borderTopLeftRadius: "1.5rem",
          borderTopRightRadius: "1.5rem",
        }}
      >
        {/* Handle bar */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-12 h-1.5 bg-gray-300 rounded-full"></div>
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <button
            onClick={onClose}
            className="text-gray-600 hover:text-gray-800 transition"
            aria-label="إغلاق"
          >
            <X className="h-5 w-5" />
          </button>
          <h3 className="text-base font-bold text-gray-800">لوحة التحكم</h3>
          <div className="w-5" />
        </div>

        {/* Admin Pages List */}
        <div className="divide-y divide-gray-100">
          {adminPages.map((page) => {
            const Icon = page.icon;
            return (
              <Link
                key={page.path}
                to={page.path}
                onClick={handleItemClick}
                className="flex items-center gap-3 px-4 py-4 hover:bg-gray-50 transition text-gray-700"
              >
                <Icon className="h-6 w-6 text-teal-600 flex-shrink-0" />
                <div className="flex flex-col gap-0.5">
                  <span className="font-medium">{page.label}</span>
                  <span className="text-xs text-gray-500">{page.description}</span>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Bottom padding */}
        <div className="h-4" />
      </div>
    </div>
  );
}
