import { useState, useRef, useEffect } from "react";
import { ChevronDown, Search, Check } from "lucide-react";

export default function FormSelect({
  icon: Icon,
  placeholder,
  options = [],
  error,
  value,
  onChange,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [highlightIdx, setHighlightIdx] = useState(-1);
  const containerRef = useRef(null);
  const listRef = useRef(null);
  const searchRef = useRef(null);

  const selected = options.find((o) => o.value === value) || null;

  /* ── close on outside click ── */
  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
        setSearch("");
        setHighlightIdx(-1);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  /* ── auto-focus search when opened ── */
  useEffect(() => {
    if (isOpen && searchRef.current) searchRef.current.focus();
  }, [isOpen]);

  /* ── filtered list ── */
  const filtered = options.filter(
    (opt) =>
      opt.label.includes(search) ||
      opt.value.toLowerCase().includes(search.toLowerCase()),
  );

  /* ── scroll highlighted item into view ── */
  useEffect(() => {
    if (highlightIdx >= 0 && listRef.current) {
      const el = listRef.current.children[highlightIdx];
      if (el) el.scrollIntoView({ block: "nearest" });
    }
  }, [highlightIdx]);

  /* ── select handler ── */
  const handleSelect = (opt) => {
    onChange(opt.value);
    setIsOpen(false);
    setSearch("");
    setHighlightIdx(-1);
  };

  /* ── keyboard navigation ── */
  const handleKeyDown = (e) => {
    if (!isOpen) {
      if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown") {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlightIdx((i) => (i < filtered.length - 1 ? i + 1 : 0));
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlightIdx((i) => (i > 0 ? i - 1 : filtered.length - 1));
        break;
      case "Enter":
        e.preventDefault();
        if (highlightIdx >= 0 && filtered[highlightIdx]) {
          handleSelect(filtered[highlightIdx]);
        }
        break;
      case "Escape":
        setIsOpen(false);
        setSearch("");
        setHighlightIdx(-1);
        break;
      default:
        break;
    }
  };

  return (
    <div ref={containerRef} className="relative" onKeyDown={handleKeyDown}>
      {/* ── Trigger Button ── */}
      <button
        type="button"
        onClick={() => {
          setIsOpen((o) => !o);
          setSearch("");
          setHighlightIdx(-1);
        }}
        className={`flex w-full items-center rounded-lg border bg-gray-50 py-2.5 text-sm outline-none ring-0 transition-all duration-200 ${
          isOpen
            ? "border-teal-400 ring-2 ring-teal-200/60 shadow-sm"
            : error
              ? "border-red-400"
              : "border-gray-200 hover:border-gray-300"
        } ${Icon ? "ps-10 pe-9" : "ps-4 pe-9"}`}
      >
        {Icon && (
          <Icon
            className={`absolute inset-s-3 top-1/2 -translate-y-1/2 h-4 w-4 transition-colors ${
              isOpen ? "text-teal-500" : "text-gray-400"
            }`}
          />
        )}
        <span
          className={`truncate text-start ${selected ? "text-gray-900" : "text-gray-400"}`}
        >
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown
          className={`absolute inset-e-3 top-1/2 -translate-y-1/2 h-4 w-4 transition-transform duration-200 ${
            isOpen ? "rotate-180 text-teal-500" : "text-gray-400"
          }`}
        />
      </button>

      {/* ── Dropdown Panel ── */}
      <div
        className={`absolute bottom-full z-50 mb-1.5 w-full origin-bottom rounded-xl border border-gray-200 bg-white shadow-lg shadow-black/8 transition-all duration-200 ${
          isOpen
            ? "scale-y-100 opacity-100"
            : "pointer-events-none scale-y-95 opacity-0"
        }`}
      >
        {/* Search bar */}
        {options.length > 5 && (
          <div className="relative border-b border-gray-100 p-2">
            <Search className="absolute inset-s-4 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
            <input
              ref={searchRef}
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setHighlightIdx(0);
              }}
              placeholder="ابحث..."
              className="w-full rounded-lg border border-gray-100 bg-gray-50 py-2 pe-3 ps-8 text-sm text-gray-900 placeholder-gray-400 outline-none transition focus:border-teal-300 focus:bg-white"
            />
          </div>
        )}

        {/* Options list */}
        <ul
          ref={listRef}
          className="max-h-52 overflow-y-auto overscroll-contain py-1 scrollbar-thin"
        >
          {filtered.length === 0 ? (
            <li className="px-4 py-3 text-center text-sm text-gray-400">
              لا توجد نتائج
            </li>
          ) : (
            filtered.map((opt, idx) => {
              const isSelected = value === opt.value;
              const isHighlighted = idx === highlightIdx;
              return (
                <li
                  key={opt.value}
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => handleSelect(opt)}
                  onMouseEnter={() => setHighlightIdx(idx)}
                  className={`flex cursor-pointer items-center justify-between gap-2 px-4 py-2.5 text-sm transition-colors duration-100 ${
                    isSelected
                      ? "bg-teal-50 font-medium text-teal-700"
                      : isHighlighted
                        ? "bg-gray-50 text-gray-900"
                        : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <span className="truncate">{opt.label}</span>
                  {isSelected && (
                    <Check className="h-4 w-4 shrink-0 text-teal-500" />
                  )}
                </li>
              );
            })
          )}
        </ul>
      </div>

      {/* ── Error message ── */}
      {error && <p className="mt-1 text-xs text-red-500">{error.message}</p>}
    </div>
  );
}
