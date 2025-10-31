"use client";

import { Header } from "@/components/header";
import { IoIosInformationCircleOutline } from "react-icons/io";
import React, { useRef, useState } from "react";
import { createPortal } from "react-dom";
import { TelevisionModal } from "@/components/activity/televisionModal";

export default function TelevisionHeader() {
  const [open, setOpen] = useState(false);
  const modalRoot = useRef<HTMLSpanElement | null>(null);

  return (
    <div className="relative">
      {open &&
        modalRoot.current &&
        createPortal(
          <TelevisionModal callBack={() => setOpen(false)} />,
          modalRoot.current
        )}
      <span className="flex flex-row items-center justify-between">
        <Header title="television" />

        <span
          ref={modalRoot}
          onClick={() => setOpen(!open)}
          className="ml-4 h-fit w-fit"
        >
          <IoIosInformationCircleOutline className="cursor-pointer text-neutral-300" />
        </span>
      </span>
    </div>
  );
}

