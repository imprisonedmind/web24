import { CFImage } from "../cf-image";
import { ActivityIcon, Footprints, Heart, HeartPulse } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

import { homeHeroHealthStatsQueryOptions } from "../../lib/api";
import { IconText } from "./icon-text";

interface HeroImageProps {
  src: string;
  alt: string;
}

export function HeroImage({ src, alt }: HeroImageProps) {
  const { data } = useQuery(homeHeroHealthStatsQueryOptions);
  const heartRateText = data?.heartRateBpm
    ? Math.round(data.heartRateBpm).toString()
    : "--";
  const stepsText =
    data?.steps !== null && data?.steps !== undefined
      ? data.steps.toLocaleString()
      : "--";

  return (
    <div className="relative overflow-clip rounded-2xl">
      <div className="absolute left-0 top-0 h-full w-full bg-gradient-to-t from-neutral-950/90 via-neutral-950/0 to-neutral-950/0" />

      <div className="absolute bottom-0 left-0 w-full px-3 pb-2">
        <div className="flex w-full items-center justify-between">
          <IconText
            icon={<ActivityIcon size={16} className="text-white" />}
            text={heartRateText}
          />
          <IconText
            icon={<Footprints size={16} className="text-white" />}
            text={stepsText}
          />
        </div>
      </div>

      <CFImage
        className="mx-auto hidden max-h-[400px] max-w-[300px]  object-cover md:flex"
        src={src}
        alt={alt}
        preset="heroPortrait"
      />
    </div>
  );
}
