export const SITE_NAME = "DineLink 約飯";
export const SITE_ORIGIN = "https://dinelink-ok6woqkb.manus.space";

export function absoluteUrl(path = "/") {
  return new URL(path, SITE_ORIGIN).toString();
}
