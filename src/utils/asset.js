// Resolves a public/ asset path against the Vite base URL so assets work
// under subpaths (e.g. GitHub Pages project sites like /<repo>/).
const base = import.meta.env.BASE_URL;

export function asset(path) {
  const clean = path.replace(/^\/+/, "");
  return `${base}${clean}`;
}

export const LOGO = {
  gif: asset("logo/Trendy-GIF.gif"),
  withText: asset("logo/Trendy-logo-with-text.png"),
  noText: asset("logo/Trendy-logo-no-text.png"),
};
