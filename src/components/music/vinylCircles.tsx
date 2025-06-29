import { FC } from "react";
import Image from "next/image";

interface VinylCirclesProps {
  albumImageUrl: string;
}

export const VinylCircles: FC<VinylCirclesProps> = ({ albumImageUrl }) => {
  return (
    <div
      className="
        spinner group relative aspect-square h-full w-auto transform-gpu
        rounded-full bg-neutral-800
      "
    >
      <div
        className="
          absolute left-1/2 top-1/2 z-10 h-32 w-32 -translate-x-[50%]
          -translate-y-[50%] rounded-full border border-neutral-900 
          bg-neutral-700
        "
      />
      <div
        className="
          absolute left-1/2 top-1/2 z-10 h-32 w-32 -translate-x-[50%]
          -translate-y-[50%] rounded-full border border-neutral-900 
          bg-neutral-700
        "
      />
      <div
        className="
          absolute left-1/2 top-1/2 z-10 h-26 w-26 -translate-x-[50%]
          -translate-y-[50%] rounded-full border border-neutral-900 
          bg-neutral-700
        "
      />
      <div
        className="
          absolute left-1/2 top-1/2 z-10 h-24 w-24 -translate-x-[50%]
          -translate-y-[50%] rounded-full border border-neutral-900 
          bg-neutral-900
        "
      />
      <div
        className="
          absolute z-10 aspect-square h-full w-auto rounded-full 
          bg-gradient-to-t from-neutral-200 via-neutral-900 to-neutral-200 
          mix-blend-multiply
        "
      />

      {/*Inner Circle*/}
      <div
        className="
          absolute left-1/2 top-1/2 z-10 h-12 w-12 -translate-x-[50%]
          -translate-y-[50%] overflow-hidden rounded-full bg-white transition 
          duration-150 ease-in-out group-hover:scale-[1.5]
        "
      >
        <Image
          src={albumImageUrl}
          alt={"bolt"}
          fill={true}
          priority={true}
          sizes={"20vw"}
          className={
            "bg-neutral-800 object-cover opacity-[0.8] mix-blend-multiply"
          }
        />
      </div>
      {/*Numb*/}
      <div
        className="
          absolute left-1/2 top-1/2 z-10 h-2 w-2 -translate-x-[50%] 
          -translate-y-[50%] rounded-full bg-gradient-to-t from-neutral-900 
          to-neutral-200
        "
      />
      {/*Numb Circle*/}
      <div
        className="
          absolute left-1/2 top-1/2 z-10 h-4 w-4 -translate-x-[50%]
          -translate-y-[50%] rounded-full border border-neutral-300
        "
      />
    </div>
  );
};
