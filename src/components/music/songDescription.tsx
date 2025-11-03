import { FC } from "react";

interface SongDescriptionProps {
  artist: string;
  album: string;
  title: string;
  listenedAgo?: string | null;
}

export const SongDescription: FC<SongDescriptionProps> = ({
  artist,
  album,
  title,
  listenedAgo,
}) => {
  const chipLabel = listenedAgo ? `${listenedAgo} ago` : album;

  return (
    <div
      className={"flex items-center justify-between text-sm text-neutral-800 "}
    >
      <p className={"max-w-[150px] truncate"}>{title}</p>
      <p
        className={
          "max-w-[150px] truncate rounded-full bg-neutral-100 p-1 px-2 text-xs"
        }
      >
        {chipLabel}
      </p>
    </div>
  );
};
