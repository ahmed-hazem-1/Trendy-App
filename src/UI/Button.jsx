import { Loader } from "lucide-react";

const variants = {
  primary: "bg-gray-900 text-white font-semibold shadow-lg hover:bg-teal-600 border border-gray-800",
  admin: "bg-teal-600 text-white font-semibold hover:bg-teal-700 shadow-md",
  outline: "border border-gray-300 bg-white text-gray-700 font-medium hover:bg-gray-50 shadow-sm",
  ghost:
    "border border-gray-200 bg-gray-50 text-gray-700 font-medium hover:bg-gray-100",
};

export default function Button({
  children,
  variant = "primary",
  isLoading = false,
  className = "",
  ...props
}) {
  return (
    <button
      disabled={isLoading || props.disabled}
      className={`w-full flex items-center justify-center gap-2 rounded-full py-2.5 text-sm transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed ${variants[variant]} ${className}`}
      {...props}
    >
      {isLoading ? <Loader className="h-4 w-4 animate-spin" /> : children}
    </button>
  );
}
