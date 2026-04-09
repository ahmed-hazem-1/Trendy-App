const STATUS_LABELS_AR = {
  VERIFIED: "متحقق",
  TRUE: "متحقق",
  FAKE: "مزيف",
  FALSE: "مزيف",
  MISLEADING: "مضلل",
  UNVERIFIED: "غير متحقق",
  INCONCLUSIVE: "غير حاسم",
};

function normalizeStatus(status) {
  if (typeof status !== "string") return "";
  return status.trim().toUpperCase();
}

function normalizeSummary(text) {
  if (typeof text !== "string") return "";
  return text.replace(/\s+/g, " ").trim();
}

function trimTrailingSlash(url) {
  return String(url || "").replace(/\/+$/, "");
}

function normalizeHashtagToken(value) {
  if (typeof value !== "string") return "";

  return value
    .replace(/^#+/, "")
    .trim()
    .replace(/\s+/g, "_")
    .replace(/[^\p{L}\p{N}_]/gu, "");
}

function buildShareHashtags({ category, statusLabel }) {
  const tags = ["TrendyAI", "تحقق_الأخبار"];

  const categoryTag = normalizeHashtagToken(category);
  if (categoryTag) tags.push(categoryTag);

  const statusTag = normalizeHashtagToken(statusLabel);
  if (statusTag) tags.push(statusTag);

  return [...new Set(tags)].slice(0, 5).map((tag) => `#${tag}`);
}

function formatConfidence(confidence) {
  if (typeof confidence !== "number" || !Number.isFinite(confidence)) {
    return "";
  }
  return `${Math.max(0, Math.min(100, Math.round(confidence)))}%`;
}

function truncateText(text, maxLength = 180) {
  if (!text || text.length <= maxLength) return text;
  return `${text.slice(0, maxLength - 1)}…`;
}

function buildFallbackTrackedUrl(postUrl, options) {
  const source = options.source || "direct";
  const medium = options.medium || "social_share";
  const campaign = options.campaign || "trendy_share";
  const content =
    options.postId != null
      ? `post_${String(options.postId)}`
      : options.content || "post";

  const params = [
    `utm_source=${encodeURIComponent(source)}`,
    `utm_medium=${encodeURIComponent(medium)}`,
    `utm_campaign=${encodeURIComponent(campaign)}`,
    `utm_content=${encodeURIComponent(content)}`,
  ].join("&");

  const separator = postUrl.includes("?") ? "&" : "?";
  return `${postUrl}${separator}${params}`;
}

export function isLikelyLocalUrl(url) {
  if (!url || typeof url !== "string") return false;

  try {
    const parsed = new URL(url, window.location.origin);
    const host = (parsed.hostname || "").toLowerCase();

    if (host === "localhost" || host === "127.0.0.1" || host === "::1") {
      return true;
    }

    if (host.endsWith(".local")) {
      return true;
    }

    return /^192\.168\.|^10\.|^172\.(1[6-9]|2\d|3[0-1])\./.test(host);
  } catch {
    return false;
  }
}

function drawRoundedRect(ctx, x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + width - r, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + r);
  ctx.lineTo(x + width, y + height - r);
  ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
  ctx.lineTo(x + r, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function wrapText(ctx, text, maxWidth, maxLines) {
  const words = (text || "").split(" ");
  const lines = [];
  let currentLine = "";

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const measured = ctx.measureText(testLine).width;

    if (measured <= maxWidth) {
      currentLine = testLine;
      continue;
    }

    if (currentLine) lines.push(currentLine);
    currentLine = word;

    if (lines.length === maxLines) break;
  }

  if (currentLine && lines.length < maxLines) {
    lines.push(currentLine);
  }

  if (lines.length === maxLines && words.length > 0) {
    const lastIndex = lines.length - 1;
    lines[lastIndex] = truncateText(lines[lastIndex], Math.max(12, lines[lastIndex].length - 1));
  }

  return lines;
}

function isCanvasSafeImageSource(imageSrc) {
  if (!imageSrc || typeof imageSrc !== "string") return false;

  if (
    imageSrc.startsWith("/") ||
    imageSrc.startsWith("data:") ||
    imageSrc.startsWith("blob:")
  ) {
    return true;
  }

  try {
    const url = new URL(imageSrc, window.location.origin);
    return url.origin === window.location.origin;
  } catch {
    return false;
  }
}

function loadImage(imageSrc) {
  return new Promise((resolve) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = () => resolve(null);
    image.src = imageSrc;
  });
}

function drawCoverImage(ctx, image, dx, dy, dWidth, dHeight) {
  const sourceRatio = image.width / image.height;
  const targetRatio = dWidth / dHeight;

  let sx = 0;
  let sy = 0;
  let sWidth = image.width;
  let sHeight = image.height;

  if (sourceRatio > targetRatio) {
    sWidth = image.height * targetRatio;
    sx = (image.width - sWidth) / 2;
  } else {
    sHeight = image.width / targetRatio;
    sy = (image.height - sHeight) / 2;
  }

  ctx.drawImage(image, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight);
}

function drawShareCard(ctx, payload, image) {
  const width = ctx.canvas.width;
  const height = ctx.canvas.height;
  const title = payload.title || "خبر جديد من Trendy";
  const summary = truncateText(normalizeSummary(payload.summary), 240);
  const category = payload.category || "عام";
  const statusLabel = getShareStatusLabel(payload.status);
  const confidence =
    typeof payload.confidence === "number" && Number.isFinite(payload.confidence)
      ? Math.max(0, Math.min(100, Math.round(payload.confidence)))
      : null;
  const url = payload.url || "";

  const bgGradient = ctx.createLinearGradient(0, 0, width, height);
  bgGradient.addColorStop(0, "#0f766e");
  bgGradient.addColorStop(0.55, "#0ea5e9");
  bgGradient.addColorStop(1, "#111827");
  ctx.fillStyle = bgGradient;
  ctx.fillRect(0, 0, width, height);

  if (image) {
    ctx.save();
    ctx.globalAlpha = 0.24;
    drawCoverImage(ctx, image, 0, 0, width, height);
    ctx.restore();
  }

  const cardX = 72;
  const cardY = 90;
  const cardWidth = width - cardX * 2;
  const cardHeight = height - 170;

  ctx.save();
  drawRoundedRect(ctx, cardX, cardY, cardWidth, cardHeight, 46);
  ctx.clip();
  ctx.fillStyle = "rgba(255, 255, 255, 0.92)";
  ctx.fillRect(cardX, cardY, cardWidth, cardHeight);
  ctx.restore();

  const topBandHeight = 300;
  ctx.save();
  drawRoundedRect(ctx, cardX, cardY, cardWidth, topBandHeight, 46);
  ctx.clip();

  if (image) {
    drawCoverImage(ctx, image, cardX, cardY, cardWidth, topBandHeight);
    const topOverlay = ctx.createLinearGradient(0, cardY, 0, cardY + topBandHeight);
    topOverlay.addColorStop(0, "rgba(15, 23, 42, 0.24)");
    topOverlay.addColorStop(1, "rgba(15, 23, 42, 0.72)");
    ctx.fillStyle = topOverlay;
    ctx.fillRect(cardX, cardY, cardWidth, topBandHeight);
  } else {
    const fallbackBand = ctx.createLinearGradient(cardX, cardY, cardX + cardWidth, cardY + topBandHeight);
    fallbackBand.addColorStop(0, "#115e59");
    fallbackBand.addColorStop(1, "#0f766e");
    ctx.fillStyle = fallbackBand;
    ctx.fillRect(cardX, cardY, cardWidth, topBandHeight);
  }

  ctx.restore();

  const chipY = cardY + 22;
  const statusChipWidth = 210;
  const categoryChipWidth = 170;

  drawRoundedRect(ctx, cardX + cardWidth - statusChipWidth - 26, chipY, statusChipWidth, 44, 22);
  ctx.fillStyle = "rgba(255, 255, 255, 0.92)";
  ctx.fill();

  drawRoundedRect(
    ctx,
    cardX + cardWidth - statusChipWidth - categoryChipWidth - 42,
    chipY,
    categoryChipWidth,
    44,
    22,
  );
  ctx.fillStyle = "rgba(20, 184, 166, 0.14)";
  ctx.fill();

  ctx.textAlign = "right";
  ctx.fillStyle = "#0f172a";
  ctx.font = "700 23px Cairo, Tajawal, sans-serif";
  ctx.fillText(statusLabel, cardX + cardWidth - 44, chipY + 30);

  ctx.fillStyle = "#0f766e";
  ctx.font = "700 22px Cairo, Tajawal, sans-serif";
  ctx.fillText(category, cardX + cardWidth - statusChipWidth - 64, chipY + 30);

  const titleY = cardY + topBandHeight + 90;
  ctx.fillStyle = "#0f172a";
  ctx.font = "700 49px Cairo, Tajawal, sans-serif";
  const titleLines = wrapText(ctx, title, cardWidth - 100, 3);
  titleLines.forEach((line, index) => {
    ctx.fillText(line, cardX + cardWidth - 50, titleY + index * 64);
  });

  let bodyY = titleY + titleLines.length * 64 + 28;

  if (confidence != null) {
    ctx.fillStyle = "#334155";
    ctx.font = "700 30px Cairo, Tajawal, sans-serif";
    ctx.fillText(`درجة الثقة: ${confidence}%`, cardX + cardWidth - 50, bodyY);
    bodyY += 54;
  }

  if (summary) {
    ctx.fillStyle = "#334155";
    ctx.font = "500 30px Cairo, Tajawal, sans-serif";
    const summaryLines = wrapText(ctx, summary, cardWidth - 100, 5);
    summaryLines.forEach((line, index) => {
      ctx.fillText(line, cardX + cardWidth - 50, bodyY + index * 46);
    });
    bodyY += summaryLines.length * 46 + 10;
  }

  if (url) {
    ctx.fillStyle = "#0d9488";
    ctx.font = "600 22px Cairo, Tajawal, sans-serif";
    const shareUrlText = truncateText(url, 84);
    ctx.fillText(shareUrlText, cardX + cardWidth - 50, cardY + cardHeight - 62);
  }

  ctx.fillStyle = "#0f172a";
  ctx.font = "700 28px Cairo, Tajawal, sans-serif";
  ctx.fillText("Trendy AI", cardX + cardWidth - 50, cardY + cardHeight - 20);
}

export function getShareStatusLabel(status) {
  const normalized = normalizeStatus(status);
  if (!normalized) return "غير متحقق";
  return STATUS_LABELS_AR[normalized] || normalized;
}

export function buildTrackedUrl(postUrl, options = {}) {
  if (!postUrl || typeof postUrl !== "string") return "";

  const source = options.source || "direct";
  const medium = options.medium || "social_share";
  const campaign = options.campaign || "trendy_share";
  const content =
    options.postId != null
      ? `post_${String(options.postId)}`
      : options.content || "post";

  try {
    const url = new URL(postUrl, window.location.origin);
    url.searchParams.set("utm_source", source);
    url.searchParams.set("utm_medium", medium);
    url.searchParams.set("utm_campaign", campaign);
    url.searchParams.set("utm_content", content);
    return url.toString();
  } catch {
    return buildFallbackTrackedUrl(postUrl, {
      source,
      medium,
      campaign,
      content,
    });
  }
}

function resolveConfiguredShareBaseUrl() {
  const envBase =
    import.meta.env?.VITE_PUBLIC_SHARE_URL ||
    import.meta.env?.VITE_PUBLIC_APP_URL ||
    import.meta.env?.VITE_SITE_URL ||
    import.meta.env?.VITE_APP_URL ||
    "";

  if (!envBase) return "";

  const fallbackBase =
    typeof window !== "undefined" && window.location?.origin
      ? window.location.origin
      : undefined;

  try {
    return new URL(trimTrailingSlash(envBase), fallbackBase).origin;
  } catch {
    return "";
  }
}

export function hasPublicShareBaseUrl() {
  const configuredBase = resolveConfiguredShareBaseUrl();
  if (!configuredBase) return false;
  return !isLikelyLocalUrl(configuredBase);
}

export function getShareBaseUrl() {
  const configuredBase = resolveConfiguredShareBaseUrl();
  if (configuredBase) {
    return trimTrailingSlash(configuredBase);
  }

  const fallbackBase =
    typeof window !== "undefined" && window.location?.origin
      ? window.location.origin
      : "";

  const candidate = trimTrailingSlash(fallbackBase);
  if (!candidate) return "";

  try {
    return new URL(candidate, fallbackBase || undefined).origin;
  } catch {
    return trimTrailingSlash(fallbackBase);
  }
}

export function buildPostShareUrl(postId) {
  const baseUrl = getShareBaseUrl();
  const safeId = postId == null ? "" : String(postId).trim();
  if (!safeId) return baseUrl;
  return `${trimTrailingSlash(baseUrl)}/posts/${encodeURIComponent(safeId)}`;
}

export function buildShareSummary({
  title,
  summary,
  status,
  confidence,
  category,
  url,
}) {
  const lines = [];

  if (title) {
    lines.push(`📰 ${title}`);
  }

  if (category) {
    lines.push(`📌 التصنيف: ${category}`);
  }

  const statusLabel = getShareStatusLabel(status);
  if (statusLabel) {
    lines.push(`✅ الحالة: ${statusLabel}`);
  }

  if (typeof confidence === "number" && Number.isFinite(confidence)) {
    lines.push(`🎯 درجة الثقة: ${Math.max(0, Math.min(100, Math.round(confidence)))}%`);
  }

  const normalizedSummary = normalizeSummary(summary);
  if (normalizedSummary) {
    lines.push(`💡 ${truncateText(normalizedSummary, 180)}`);
  }

  if (url) {
    lines.push(`🔗 ${url}`);
  }

  const hashtags = buildShareHashtags({ category, statusLabel });
  if (hashtags.length) {
    lines.push(hashtags.join(" "));
  }

  return lines.join("\n");
}

export function buildPlatformShareMessage({
  title,
  summary,
  status,
  confidence,
  category,
}) {
  const lines = [];
  const statusLabel = getShareStatusLabel(status);
  const confidenceLabel = formatConfidence(confidence);
  const compactSummary = truncateText(normalizeSummary(summary), 120);
  const hashtags = buildShareHashtags({ category, statusLabel }).slice(0, 4);

  if (title) {
    lines.push(title);
  }

  if (statusLabel) {
    lines.push(
      confidenceLabel
        ? `الحالة: ${statusLabel} • ثقة ${confidenceLabel}`
        : `الحالة: ${statusLabel}`,
    );
  }

  if (compactSummary) {
    lines.push(compactSummary);
  }

  if (hashtags.length) {
    lines.push(hashtags.join(" "));
  }

  return lines.join("\n");
}

export function buildPlatformShareUrl(platform, { url, title, text }) {
  const safeUrl = url || "";
  const safeTitle = title || "مشاركة من Trendy";
  const baseText = text || title || "";
  const compactText = truncateText(baseText, 260);

  const encodedUrl = encodeURIComponent(safeUrl);
  const encodedTitle = encodeURIComponent(safeTitle);
  const encodedText = encodeURIComponent(compactText);
  const encodedTwitterText = encodeURIComponent(truncateText(compactText, 180));
  const encodedWhatsappText = encodeURIComponent(
    `${compactText}${compactText ? "\n\n" : ""}${safeUrl}`,
  );
  const encodedEmailBody = encodeURIComponent(
    `${compactText}${compactText ? "\n\n" : ""}${safeUrl}`,
  );

  switch (platform) {
    case "facebook":
      return `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedText}`;
    case "whatsapp":
      return `https://api.whatsapp.com/send?text=${encodedWhatsappText}`;
    case "telegram":
      return `https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`;
    case "twitter":
      return `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTwitterText}`;
    case "linkedin":
      return `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`;
    case "email":
      return `mailto:?subject=${encodedTitle}&body=${encodedEmailBody}`;
    default:
      return "#";
  }
}

export async function downloadShareCardImage({
  postId,
  title,
  summary,
  status,
  confidence,
  category,
  imageSrc,
  url,
}) {
  try {
    const canvas = document.createElement("canvas");
    canvas.width = 1080;
    canvas.height = 1350;

    const ctx = canvas.getContext("2d");
    if (!ctx) return false;

    let image = null;
    if (isCanvasSafeImageSource(imageSrc)) {
      image = await loadImage(imageSrc);
    }

    drawShareCard(
      ctx,
      {
        title,
        summary,
        status,
        confidence,
        category,
        url,
      },
      image,
    );

    let dataUrl;
    try {
      dataUrl = canvas.toDataURL("image/png");
    } catch {
      drawShareCard(
        ctx,
        {
          title,
          summary,
          status,
          confidence,
          category,
          url,
        },
        null,
      );
      dataUrl = canvas.toDataURL("image/png");
    }

    const downloadLink = document.createElement("a");
    downloadLink.href = dataUrl;
    downloadLink.download = `trendy-share-${postId || Date.now()}.png`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    return true;
  } catch {
    return false;
  }
}
