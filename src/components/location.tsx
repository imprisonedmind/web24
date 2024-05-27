import { Header } from "@/components/header";
import BlueDot from "@/components/blueDot";
import Image from "next/image";

import map from "/public/map.png";
export default function Location() {
  return (
    <div className={"flex w-full flex-col gap-1"}>
      <Header title={"location"} />
      <div className={"flex flex-col gap-2 rounded-xl bg-white p-2 shadow-sm"}>
        <div className={"relative h-72 w-full overflow-hidden rounded-lg"}>
          <BlueDot />
          <Image
            src={map}
            alt={"test"}
            fill={true}
            priority={true}
            sizes={"50vw"}
            placeholder={"blur"}
            className={"scale-[1.2] object-cover"}
          />
        </div>
        <div className={"flex items-center justify-between"}>
          <p className={"text-sm text-neutral-800"}>Cape Town</p>
          <div className={"flex rounded-full bg-neutral-100 p-1 px-2 text-xs"}>
            <p>-33.93,</p>
            <p>18.47</p>
          </div>
        </div>
      </div>
    </div>
  );
}
