export type CfImageOptions = {
  width?: number;
  quality?: number;
  fit?: "scale-down" | "contain" | "cover" | "crop" | "pad";
};

function isAbsoluteUrl(src: string) {
  return /^https?:\/\//i.test(src);
}

export function canTransformCfImage(src: string) {
  if (!src) return false;
  if (import.meta.env.DEV) return false;
  if (src.startsWith("/cdn-cgi/image/")) return false;
  if (isAbsoluteUrl(src)) return false;
  return src.startsWith("/");
}

export function cfImage(src: string, options: CfImageOptions = {}) {
  if (!canTransformCfImage(src)) {
    return src;
  }

  const params = [
    options.width ? `width=${options.width}` : null,
    options.quality ? `quality=${options.quality}` : null,
    options.fit ? `fit=${options.fit}` : null,
    "format=auto",
  ].filter(Boolean);

  return `/cdn-cgi/image/${params.join(",")}${src}`;
}
