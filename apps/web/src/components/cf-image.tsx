import type { ImgHTMLAttributes } from "react";

import { canTransformCfImage, cfImage, type CfImageOptions } from "../lib/cf-image";
import { imagePresets, type ImagePresetName } from "../lib/image-presets";

type CFImageProps = Omit<ImgHTMLAttributes<HTMLImageElement>, "src"> &
  CfImageOptions & {
    src: string;
    widths?: number[];
    preset?: ImagePresetName;
    unoptimized?: boolean;
  };

export function CFImage({
  src,
  alt,
  preset,
  widths,
  sizes,
  width,
  height,
  quality = 85,
  fit,
  loading,
  decoding,
  fetchPriority,
  unoptimized = false,
  ...imgProps
}: CFImageProps) {
  const presetConfig = preset ? imagePresets[preset] : undefined;
  const resolvedWidths = widths ?? presetConfig?.widths;
  const resolvedSizes = sizes ?? presetConfig?.sizes;
  const resolvedWidth = width ?? presetConfig?.width;
  const resolvedHeight = height ?? presetConfig?.height;
  const fallbackWidth =
    resolvedWidth ?? (resolvedWidths?.length ? resolvedWidths[resolvedWidths.length - 1] : undefined);
  const resolvedQuality = quality ?? presetConfig?.quality ?? 85;
  const resolvedFit = fit ?? presetConfig?.fit;
  const resolvedFetchPriority = fetchPriority ?? presetConfig?.fetchPriority;
  const shouldTransform = !unoptimized && canTransformCfImage(src);
  const resolvedSrc = shouldTransform
    ? cfImage(src, { width: fallbackWidth, quality: resolvedQuality, fit: resolvedFit })
    : src;
  const srcSet =
    shouldTransform && resolvedWidths?.length
      ? resolvedWidths
          .map(
            candidateWidth =>
              `${cfImage(src, {
                width: candidateWidth,
                quality: resolvedQuality,
                fit: resolvedFit,
              })} ${candidateWidth}w`
          )
          .join(", ")
      : undefined;

  return (
    <img
      {...imgProps}
      src={resolvedSrc}
      srcSet={srcSet}
      sizes={srcSet ? resolvedSizes : undefined}
      width={resolvedWidth}
      height={resolvedHeight}
      alt={alt}
      loading={loading ?? (resolvedFetchPriority === "high" ? "eager" : "lazy")}
      decoding={decoding ?? "async"}
      fetchPriority={resolvedFetchPriority}
    />
  );
}
