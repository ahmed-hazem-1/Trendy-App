import politicsImage from "../../images/Politics.png";
import economyImage from "../../images/Economy.png";
import religionImage from "../../images/Religion.png";
import localNewsImage from "../../images/Local News.png";
import technologyImage from "../../images/Technology.png";
import sportsImage from "../../images/Sports.png";
import healthImage from "../../images/Health.png";
import entertainmentImage from "../../images/Entertainment.png";
import otherImage from "../../images/Other.png";
import fashionImage from "../../images/Fashion.png";

const CATEGORY_IMAGE_ASSETS = {
  politics: politicsImage,
  economy: economyImage,
  religion: religionImage,
  localnews: localNewsImage,
  technology: technologyImage,
  sports: sportsImage,
  health: healthImage,
  entertainment: entertainmentImage,
  fashion: fashionImage,
  other: otherImage,
};

const CATEGORY_ALIASES = {
  politics: ["politics", "political", "policy"],
  economy: ["economy", "economic", "business", "finance"],
  religion: ["religion", "religious"],
  localnews: ["localnews", "local", "localstories"],
  technology: ["technology", "tech"],
  sports: ["sports", "sport"],
  health: ["health", "medical"],
  entertainment: ["entertainment", "movies", "music", "culture"],
  fashion: ["fashion", "style", "clothing", "apparel"],
  other: ["other", "general", "unknown", "all"],
};

function normalizeCategoryToken(value) {
  if (typeof value !== "string") return "";
  return value.trim().toLowerCase().replace(/[\s_-]+/g, "");
}

const tokenToCategoryKey = Object.entries(CATEGORY_ALIASES).reduce(
  (acc, [categoryKey, aliases]) => {
    aliases.forEach((alias) => {
      acc[normalizeCategoryToken(alias)] = categoryKey;
    });
    return acc;
  },
  {},
);

function resolveCategoryKey({ category, categorySlug } = {}) {
  const candidates = [categorySlug, category].map(normalizeCategoryToken);

  for (const token of candidates) {
    if (!token) continue;

    if (tokenToCategoryKey[token]) {
      return tokenToCategoryKey[token];
    }

    if (CATEGORY_IMAGE_ASSETS[token]) {
      return token;
    }
  }

  return "other";
}

export function resolveCategoryImage(input = {}) {
  const key = resolveCategoryKey(input);

  return {
    src: CATEGORY_IMAGE_ASSETS[key] || CATEGORY_IMAGE_ASSETS.other,
    key,
    source: "local-category-assets",
  };
}
