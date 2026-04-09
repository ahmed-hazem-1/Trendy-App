const ROOT_RELATIVE_URL_PATTERN = /^\//;
const ABSOLUTE_URL_PATTERN = /^https?:\/\//i;

function normalizeImageUrl(value) {
  if (typeof value !== "string") return "";
  return value.trim();
}

function isValidImageUrl(url) {
  if (!url) return false;
  return ABSOLUTE_URL_PATTERN.test(url) || ROOT_RELATIVE_URL_PATTERN.test(url);
}

export function resolveDbImage(input = {}) {
  const normalizedUrl = normalizeImageUrl(input.imageUrl);

  if (!isValidImageUrl(normalizedUrl)) {
    return null;
  }

  return {
    src: normalizedUrl,
    key: "db",
    source: "db-image-url",
  };
}
