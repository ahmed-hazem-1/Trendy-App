import { resolveDbImage } from "./providers/dbImageProvider";
import { resolveCategoryImage } from "./providers/categoryImageProvider";

const IMAGE_PROVIDERS = [resolveDbImage, resolveCategoryImage];

export function resolvePostImageView(input = {}) {
  for (const provider of IMAGE_PROVIDERS) {
    const image = provider(input);
    if (image?.src) {
      return image;
    }
  }

  return resolveCategoryImage(input);
}
