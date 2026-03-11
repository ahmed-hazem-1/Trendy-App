import { Search } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";

export default function SearchBar({ fullWidth = false }) {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [inputValue, setInputValue] = useState(
    () => searchParams.get("q") || "",
  );

  // Track whether the user has actually changed the input (skip mount-time sync)
  const hasTouchedRef = useRef(false);

  // Debounce: update the URL search param after 500ms of inactivity.
  // Uses navigate() directly so all useSearchParams consumers re-render.
  // Reads from window.location.search for always-fresh params so we never
  // overwrite filter/category params set by other components.
  useEffect(() => {
    // Skip the initial mount — nothing to sync when the user hasn't typed
    if (!hasTouchedRef.current) return;

    const timer = setTimeout(() => {
      const next = new URLSearchParams(window.location.search);
      if (inputValue.trim()) {
        next.set("q", inputValue.trim());
      } else {
        next.delete("q");
      }
      next.delete("page");
      navigate("?" + next.toString(), { replace: true });
    }, 500);

    return () => clearTimeout(timer);
  }, [inputValue, navigate]);

  const handleInputChange = (e) => {
    hasTouchedRef.current = true;
    setInputValue(e.target.value);
  };

  const handleClear = () => {
    hasTouchedRef.current = true;
    setInputValue("");
    const next = new URLSearchParams(window.location.search);
    next.delete("q");
    next.delete("page");
    navigate("?" + next.toString(), { replace: true });
  };

  return (
    <div
      className={`relative ${fullWidth ? "w-full" : "w-full md:w-72 lg:w-96"}`}
    >
      <Search className="absolute inset-s-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
      <input
        type="text"
        value={inputValue}
        onChange={handleInputChange}
        placeholder="ابحث عن الأخبار، المواضيع الرائجة..."
        className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2 ps-10 pe-4 text-sm text-gray-700 placeholder-text-muted outline-none transition focus:border-focus-border focus:ring-1 focus:ring-focus-ring"
      />
      {inputValue && (
        <button
          onClick={handleClear}
          className="absolute inset-e-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
          aria-label="مسح البحث"
        >
          &times;
        </button>
      )}
    </div>
  );
}
