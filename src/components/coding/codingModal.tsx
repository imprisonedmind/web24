import React, { FC, useEffect, useRef } from "react";
import Link from "next/link";

interface CodingModalProps {
  callBack: () => void;
}

export const CodingModal: FC<CodingModalProps> = ({ callBack }) => {
  const dialog = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (event: { target: any }) => {
      if (dialog.current && !dialog.current.contains(event.target)) {
        callBack();
      }
    };

    document.addEventListener("click", handleOutsideClick, true);

    return () => {
      document.removeEventListener("click", handleOutsideClick, true);
    };
  }, []);

  return (
    <div
      ref={dialog}
      className={`
        absolute right-5 top-1 z-[500] w-[350px] divide-y divide-neutral-100 rounded-md 
        border border-neutral-100 bg-white shadow-md
      `}
    >
      <p className={"p-2 text-sm font-medium"}>Code Tracking</p>
      <p className={"p-2 text-xs text-neutral-500"}>
        Utilizing the{" "}
        <Link
          href={"https://wakatime.com/"}
          className={"font-medium italic text-blue-500"}
          target={"_blank"}
        >
          WakaTime
        </Link>{" "}
        API to fetch coding activity data obtained via the JetBrains IDEs
        plugin. This data provides insights into coding metrics like time spent
        per language, project, and overall productivity.
      </p>
    </div>
  );
};
