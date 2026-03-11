const STATUS_CONFIG = {
  // Verdict values (from verdicts table) — keys are UPPERCASE
  TRUE: {
    label: "متحقق",
    bg: "bg-green-50",
    text: "text-green-700",
    dot: "bg-green-500",
    border: "border-green-200",
  },
  FALSE: {
    label: "خبر مزيف",
    bg: "bg-red-50",
    text: "text-red-700",
    dot: "bg-red-500",
    border: "border-red-200",
  },
  MISLEADING: {
    label: "مضلل",
    bg: "bg-orange-50",
    text: "text-orange-700",
    dot: "bg-orange-500",
    border: "border-orange-200",
  },
  UNVERIFIED: {
    label: "غير متحقق",
    bg: "bg-yellow-50",
    text: "text-yellow-700",
    dot: "bg-yellow-500",
    border: "border-yellow-200",
  },
  // Legacy / fallback aliases from news_items.verification_status
  VERIFIED: {
    label: "متحقق",
    bg: "bg-green-50",
    text: "text-green-700",
    dot: "bg-green-500",
    border: "border-green-200",
  },
  FAKE: {
    label: "خبر مزيف",
    bg: "bg-red-50",
    text: "text-red-700",
    dot: "bg-red-500",
    border: "border-red-200",
  },
  INCONCLUSIVE: {
    label: "غير حاسم",
    bg: "bg-yellow-50",
    text: "text-yellow-700",
    dot: "bg-yellow-500",
    border: "border-yellow-200",
  },
};

export { STATUS_CONFIG };

/**
 * Normalise any verdict/status string to an uppercase key that matches STATUS_CONFIG.
 */
function normalizeStatus(raw) {
  if (!raw) return "UNVERIFIED";
  const upper = raw.toUpperCase().trim();
  if (STATUS_CONFIG[upper]) return upper;
  // Handle common variations
  if (upper === "REAL" || upper === "CONFIRMED") return "TRUE";
  if (upper === "DEBUNKED") return "FALSE";
  return "UNVERIFIED";
}

export default function StatusBadge({ status }) {
  const key = normalizeStatus(status);
  const config = STATUS_CONFIG[key];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium ${config.bg} ${config.text} ${config.border}`}
    >
      {config.label}
      <span className={`h-2 w-2 rounded-full ${config.dot}`} />
    </span>
  );
}
