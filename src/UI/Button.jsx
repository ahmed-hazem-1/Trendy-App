import { Loader } from "lucide-react";

const variants = {
  primary: "text-white font-semibold",
  admin: "bg-teal-600 text-white font-semibold hover:bg-teal-700",
  outline: "border border-gray-300 bg-white text-gray-700 font-medium hover:bg-gray-50",
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
  const isPrimary = variant === "primary";
  
  return (
    <button
      disabled={isLoading || props.disabled}
      className={`w-full flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm transition disabled:opacity-60 disabled:cursor-not-allowed ${variants[variant]} ${className}`}
      style={isPrimary ? {
        backgroundColor: "var(--color-button-primary)",
      } : {}}
      onMouseEnter={(e) => isPrimary && (e.target.style.backgroundColor = "var(--color-button-primary-hover)")}
      onMouseLeave={(e) => isPrimary && (e.target.style.backgroundColor = "var(--color-button-primary)")}
      {...props}
    >
      {isLoading ? <Loader className="h-4 w-4 animate-spin" /> : children}
    </button>
  );
}
