import type { ReactNode } from "react";

interface IconTextProps {
  icon: ReactNode;
  text: string;
  className?: string;
}

export function IconText({ icon, text, className = "" }: IconTextProps) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {icon}
      <p className="font-doto text-lg font-bold text-white">{text}</p>
    </div>
  );
}
