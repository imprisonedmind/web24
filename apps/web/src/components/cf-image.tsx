import type { ImgHTMLAttributes } from "react";

import { canTransformCfImage, cfImage, type CfImageOptions } from "../lib/cf-image";

type CFImageProps = Omit<ImgHTMLAttributes<HTMLImageElement>, "src"> &
  CfImageOptions & {
    src: string;
    widths?: number[];
    unoptimized?: boolean;
  };

export function CFImage({
  src,
  alt,
  widths,
  sizes,
  width,
  quality = 85,
  fit,
  loading,
  decoding,
  fetchPriority,
  unoptimized = false,
  ...imgProps
}: CFImageProps) {
  const shouldTransform = !unoptimized && canTransformCfImage(src);
  const resolvedSrc = shouldTransform ? cfImage(src, { width, quality, fit }) : src;
  const srcSet =
    shouldTransform && widths?.length
      ? widths
          .map(candidateWidth => `${cfImage(src, { width: candidateWidth, quality, fit })} ${candidateWidth}w`)
          .join(", ")
      : undefined;

  return (
    <img
      {...imgProps}
      src={resolvedSrc}
      srcSet={srcSet}
      sizes={srcSet ? sizes : undefined}
      alt={alt}
      loading={loading ?? (fetchPriority === "high" ? "eager" : "lazy")}
      decoding={decoding ?? "async"}
      fetchPriority={fetchPriority}
    />
  );
}
