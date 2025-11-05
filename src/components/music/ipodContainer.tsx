import type { FC, ReactNode } from "react";
import { SkipBack, SkipForward, Play, Pause } from "lucide-react";

interface IPodContainerProps {
  children: ReactNode;
  status?: "playing" | "paused";
}

export const IPodContainer: FC<IPodContainerProps> = ({
  children,
  status = "playing",
}) => {
  const isPaused = status === "paused";

  return (
    <div className="relative grow rounded-lg">
      {/* iPod Body */}
      <div className="relative h-full w-auto overflow-hidden rounded-xl border border-gray-400 bg-gradient-to-b from-gray-300 via-gray-400 to-gray-500 shadow-2xl md:h-72">
        {/* Subtle highlight on top edge */}
        <div className="absolute left-4 right-4 top-0 h-1 bg-gradient-to-r from-transparent via-white/40 to-transparent"></div>

        {/* Screen Area */}
        <div className="absolute left-2 right-2 top-2 h-64 overflow-hidden rounded-lg border-2 border-gray-700 bg-neutral-300 md:h-32">
          <div className="relative h-full w-full">{children}</div>
        </div>

        {/* Click Wheel */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 scale-[0.8] transform">
          <div className="relative h-36 w-36 rounded-full border border-gray-300 bg-gradient-to-b from-white via-gray-50 to-gray-200 shadow-lg">
            {/* Outer touch ring */}
            <div className="absolute inset-1 rounded-full border border-gray-300 bg-gradient-to-b from-gray-50 to-gray-100">
              {/* Menu text */}
              <div className="absolute left-1/2 top-3 -translate-x-1/2 transform text-[10px] font-medium tracking-wide text-gray-600">
                MENU
              </div>

              {/* Control buttons */}
              <div className="absolute left-3 top-1/2 -translate-y-1/2 transform">
                <SkipBack className="h-3 w-3 text-gray-600" />
              </div>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 transform">
                <SkipForward className="h-3 w-3 text-gray-600" />
              </div>
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 transform">
                {isPaused ? (
                  <Play className="h-4 w-4 text-gray-600" />
                ) : (
                  <Pause className="h-4 w-4 text-gray-600" />
                )}
              </div>
            </div>

            {/* Center button */}
            <div className="absolute left-1/2 top-1/2 h-14 w-14 -translate-x-1/2 -translate-y-1/2 transform rounded-full border border-gray-300 bg-gradient-to-b from-gray-100 via-gray-200 to-gray-300 shadow-inner"></div>
          </div>
        </div>

        {/* Bottom highlight */}
        <div className="absolute bottom-0 left-4 right-4 h-1 rounded-full bg-gradient-to-r from-transparent via-black/20 to-transparent"></div>
      </div>

      {/* Reflection effect */}
      <div className="pointer-events-none absolute inset-0 rounded-lg bg-gradient-to-br from-white/30 via-transparent to-transparent"></div>
    </div>
  );
};
