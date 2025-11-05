import Link from "next/link";
import React, { FC, useEffect, useRef } from "react";

interface TelevisionModalProps {
  callBack: () => void;
}

export const TelevisionModal: FC<TelevisionModalProps> = ({ callBack }) => {
  const dialog = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (dialog.current && !dialog.current.contains(event.target as Node)) {
        callBack();
      }
    };

    document.addEventListener("click", handleOutsideClick, true);

    return () => {
      document.removeEventListener("click", handleOutsideClick, true);
    };
  }, [callBack]);

  return (
    <div
      ref={dialog}
      className={`
        absolute right-5 top-1 z-[500] w-[350px] divide-y divide-neutral-100 rounded-md
        border border-neutral-100 bg-white shadow-md
      `}
    >
      <p className="p-2 text-sm font-medium">Watching Tracking</p>
      <p className="p-2 text-xs text-neutral-500">
        Watching activity is sourced from the{" "}
        <Link
          href="https://trakt.tv/"
          className="font-medium italic text-blue-500"
          target="_blank"
        >
          Trakt
        </Link>{" "}
        API. The integration pulls my personal history to capture movies and
        episodes watched across services, then aggregates the runtimes per day.
      </p>
    </div>
  );
};
