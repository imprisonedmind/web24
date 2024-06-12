import React, { FC, ReactNode } from "react";
import Link from "next/link";

interface SongLinkWrapperProps {
  songUrl: string;
  children: ReactNode;
}

export const SongLinkWrapper: FC<SongLinkWrapperProps> = ({
  songUrl,
  children,
}) => {
  return (
    <Link
      href={songUrl}
      className="
        relative flex h-72 w-full cursor-pointer items-center justify-center 
        overflow-hidden rounded-lg bg-gradient-to-t from-gray-400 to-gray-200
        p-4
      "
    >
      {children}
    </Link>
  );
};
