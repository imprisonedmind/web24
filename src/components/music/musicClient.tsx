"use client";
import { FC, useEffect, useState } from "react";
import { Header } from "@/components/header";
import Link from "next/link";
import Image from "next/image";
import { songData } from "@/lib/types";

const getSongData = async () => {
  const res = await fetch("/api/currentlyPlaying");
  return await res.json();
};

interface MusicClientProps {
  initialSongData: songData;
}

export const MusicClient: FC<MusicClientProps> = ({ initialSongData }) => {
  const [songData, setSongData] = useState<songData | null>(initialSongData);

  const fetchSongData = async () => {
    const data = await getSongData();
    setSongData(data);
  };

  useEffect(() => {
    // fetchSongData(); // Initial fetch
    const interval = setInterval(() => {
      fetchSongData();
    }, 30000); // Fetch every 30 seconds

    return () => clearInterval(interval); // Cleanup interval on component unmount
  }, []);

  if (!songData?.isPlaying) return null;

  return (
    <div className={"flex w-full flex-col gap-1"}>
      <Header title={"listening"} />
      <div
        className={
          "flex w-full flex-col gap-2 rounded-xl bg-white p-2 shadow-sm xs:w-[300px]"
        }
      >
        <Link
          href={songData.songUrl}
          className={
            "relative flex h-72 w-full rounded-lg bg-gradient-to-t from-gray-400 p-4 " +
            "cursor-pointer overflow-hidden to-gray-200"
          }
        >
          {/*ARM THINGY*/}
          <div
            className={
              "absolute left-1/2 z-10 h-36 w-3 translate-x-[91px] -rotate-[12deg]" +
              " -top-[60px] rounded-full bg-neutral-800 p-2 drop-shadow-md" +
              " transition duration-150 ease-in-out hover:-rotate-[18deg]"
            }
          >
            <div
              className={
                "absolute bottom-1/2 left-1/2 h-3/4 w-1 -translate-x-[50%] bg-neutral-600" +
                " translate-y-[50%] rounded-full"
              }
            />

            <div
              className={
                "absolute -bottom-[6px] -right-[2px] z-20 h-4 w-8 bg-neutral-800" +
                " -rotate-45 rounded-r-full"
              }
            >
              <div
                className={
                  "absolute -left-[6px] top-1/2 z-0 h-3 w-3 rotate-45 bg-neutral-800" +
                  " -translate-y-[50%] rounded-sm"
                }
              />
              <div
                className={
                  "absolute bottom-1/2 right-1/2 z-20 h-1 w-6 translate-y-[50%]" +
                  " mr-[4px] translate-x-[50%] rounded-full bg-neutral-600"
                }
              />
            </div>
          </div>

          {/*Circles*/}
          <div
            className={
              "spinner relative aspect-square h-full w-auto rounded-full bg-neutral-800" +
              " group mx-auto"
            }
          >
            <div
              className={
                "absolute top-1/2 z-10 h-60 w-60 rounded-full border border-neutral-900" +
                " left-1/2 -translate-x-[50%] -translate-y-[50%] bg-neutral-700" +
                " bg-neutral-700"
              }
            />
            <div
              className={
                "absolute top-1/2 z-10 h-52 w-52 rounded-full border border-neutral-900" +
                " left-1/2 -translate-x-[50%] -translate-y-[50%] bg-neutral-700" +
                " bg-neutral-700"
              }
            />
            <div
              className={
                "absolute top-1/2 z-10 h-44 w-44 rounded-full border border-neutral-900" +
                " left-1/2 -translate-x-[50%] -translate-y-[50%] bg-neutral-700" +
                " bg-neutral-700"
              }
            />
            <div
              className={
                "absolute top-1/2 z-10 h-36 w-36 rounded-full border border-neutral-900" +
                " left-1/2 -translate-x-[50%] -translate-y-[50%] bg-neutral-900"
              }
            />
            <div
              className={
                "absolute z-10 aspect-square h-full w-auto rounded-full bg-gradient-to-t" +
                " from-neutral-200 via-neutral-900 to-neutral-200 mix-blend-multiply"
              }
            />

            {/*Inner Circle*/}
            <div
              className={
                "absolute left-1/2 top-1/2 z-10 h-24 w-24 rounded-full bg-white" +
                " -translate-x-[50%] -translate-y-[50%] overflow-hidden" +
                " transition duration-150 ease-in-out group-hover:scale-[1.5]"
              }
            >
              <Image
                src={songData.albumImageUrl}
                alt={"bolt"}
                fill={true}
                className={"object-cover opacity-[0.8] mix-blend-multiply"}
              />
            </div>
            {/*Numb*/}
            <div
              className={
                "absolute left-1/2 top-1/2 z-10 h-2 w-2 -translate-x-[50%] rounded-full" +
                " -translate-y-[50%] bg-gradient-to-t from-neutral-900 to-neutral-200"
              }
            />
            {/*Numb Circle*/}
            <div
              className={
                "absolute top-1/2 z-10 h-8 w-8 rounded-full border border-neutral-300" +
                " left-1/2 -translate-x-[50%] -translate-y-[50%]"
              }
            />
          </div>
        </Link>
        <div
          className={
            "flex items-center justify-between text-sm text-neutral-800 "
          }
        >
          <p className={"max-w-[150px] truncate"}>{songData.artist}</p>
          <p
            className={
              "max-w-[150px] truncate rounded-full bg-neutral-100 p-1 px-2 text-xs"
            }
          >
            {songData.title}
          </p>
        </div>
      </div>
    </div>
  );
};
