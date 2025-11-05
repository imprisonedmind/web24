import { forwardRef, type CSSProperties } from "react";

import { cn } from "@/lib/utils";

const MAX_WIDTH_MAP = {
  default: "var(--page-max-width)",
  narrow: "600px",
  wide: "960px"
} as const;

type NamedMaxWidth = keyof typeof MAX_WIDTH_MAP;

type PageContainerProps = React.HTMLAttributes<HTMLDivElement> & {
  maxWidth?: NamedMaxWidth | number | string;
};

export const PageContainer = forwardRef<HTMLDivElement, PageContainerProps>(
  ({ className, maxWidth = "default", style, ...props }, ref) => {
    const resolvedMaxWidth =
      typeof maxWidth === "string" && maxWidth in MAX_WIDTH_MAP
        ? MAX_WIDTH_MAP[maxWidth as NamedMaxWidth]
        : typeof maxWidth === "number"
          ? `${maxWidth}px`
          : maxWidth;

    const inlineStyle =
      resolvedMaxWidth && resolvedMaxWidth !== "var(--page-max-width)"
        ? ({
            "--page-max-width": resolvedMaxWidth
          } as CSSProperties)
        : undefined;

    return (
      <div
        ref={ref}
        style={{
          ...inlineStyle,
          ...style
        }}
        className={cn("mx-auto w-full max-w-[var(--page-max-width)]", className)}
        {...props}
      />
    );
  }
);

PageContainer.displayName = "PageContainer";
