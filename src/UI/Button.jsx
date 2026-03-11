import { Loader } from "lucide-react";

const variants = {
  primary: "bg-teal-600 text-white font-semibold hover:bg-teal-700",
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
      className={`w-full flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm transition disabled:opacity-60 disabled:cursor-not-allowed ${variants[variant]} ${className}`}
      {...props}
    >
      {isLoading ? <Loader className="h-4 w-4 animate-spin" /> : children}
    </button>
  );
}
