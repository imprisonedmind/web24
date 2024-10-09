"use client";
import { createPortal } from "react-dom";
import { Header } from "@/components/header";
import { IoIosInformationCircleOutline } from "react-icons/io";
import React, { useRef, useState } from "react";
import { CodingModal } from "@/components/coding/codingModal";

export default function CodingHeader() {
  const [active, setActive] = useState(false);
  const modalTing = useRef(null);

  return (
    <div className={"relative"}>
      {active &&
        modalTing.current &&
        createPortal(
          <CodingModal callBack={() => setActive(false)} />,
          modalTing.current,
        )}
      <span className={"flex flex-row items-center justify-between"}>
        <Header title={"activity"} />

        <span
          ref={modalTing}
          onClick={() => setActive(!active)}
          className={"relative h-fit w-fit"}
        >
          <IoIosInformationCircleOutline
            className={"cursor-pointer text-neutral-300"}
          />
        </span>
      </span>
    </div>
  );
}
