import type { FC, ReactNode } from "react"
import { SkipBack, SkipForward, Play } from "lucide-react"

interface IPodContainerProps {
  children: ReactNode
}

export const IPodContainer: FC<IPodContainerProps> = ({ children }) => {
  return (
    <div className="relative rounded-lg">
      {/* iPod Body */}
      <div className="w-auto h-72 bg-gradient-to-b from-gray-300 via-gray-400 to-gray-500 shadow-2xl rounded-lg border border-gray-400 relative overflow-hidden">
        {/* Subtle highlight on top edge */}
        <div className="absolute top-0 left-4 right-4 h-1 bg-gradient-to-r from-transparent via-white/40 to-transparent"></div>

        {/* Screen Area */}
        <div className="absolute top-2 left-2 right-2 h-32 bg-black rounded-lg border-2 border-gray-700 overflow-hidden shadow-inner">
          {/* Screen bezel */}
          <div className="absolute inset-1 bg-gradient-to-b from-gray-900 to-black rounded-md">
            {/* Screen content area */}
            <div className="w-full h-full relative">{children}</div>
          </div>
        </div>

        {/* Click Wheel */}
        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 scale-[0.8]">
          <div className="w-36 h-36 bg-gradient-to-b from-white via-gray-50 to-gray-200 rounded-full shadow-lg border border-gray-300 relative">
            {/* Outer touch ring */}
            <div className="absolute inset-1 border border-gray-300 rounded-full bg-gradient-to-b from-gray-50 to-gray-100">
              {/* Menu text */}
              <div className="absolute top-3 left-1/2 transform -translate-x-1/2 text-[10px] font-medium text-gray-600 tracking-wide">
                MENU
              </div>

              {/* Control buttons */}
              <div className="absolute top-1/2 left-3 transform -translate-y-1/2">
                <SkipBack className="w-3 h-3 text-gray-600" />
              </div>
              <div className="absolute top-1/2 right-3 transform -translate-y-1/2">
                <SkipForward className="w-3 h-3 text-gray-600" />
              </div>
              <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2">
                <div className="flex items-center gap-0.5">
                  <Play className="w-2.5 h-2.5 text-gray-600 fill-current" />
                  <div className="w-0.5 h-2.5 bg-gray-600 rounded-full"></div>
                  <div className="w-0.5 h-2.5 bg-gray-600 rounded-full"></div>
                </div>
              </div>
            </div>

            {/* Center button */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-14 h-14 bg-gradient-to-b from-gray-100 via-gray-200 to-gray-300 rounded-full border border-gray-300 shadow-inner"></div>
          </div>
        </div>

        {/* Bottom highlight */}
        <div className="absolute bottom-0 left-4 right-4 h-1 bg-gradient-to-r from-transparent via-black/20 to-transparent rounded-full"></div>
      </div>

      {/* Reflection effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/30 via-transparent rounded-lg to-transparent pointer-events-none"></div>
    </div>
  )
}
