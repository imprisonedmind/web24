import { FC } from "react";

interface SongDescriptionProps {
  artist: string;
  title: string;
}

export const SongDescription: FC<SongDescriptionProps> = ({
  artist,
  title,
}) => {
  return (
    <div
      className={"flex items-center justify-between text-sm text-neutral-800 "}
    >
      <p className={"max-w-[150px] truncate"}>{artist}</p>
      <p
        className={
          "max-w-[150px] truncate rounded-full bg-neutral-100 p-1 px-2 text-xs"
        }
      >
        {title}
      </p>
    </div>
  );
};
