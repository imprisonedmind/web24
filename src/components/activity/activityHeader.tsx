import { Header } from "@/components/header";
import React from "react";

export default function ActivityHeader() {

  return (
    <div className={"relative"}>
      <span className={"flex flex-row items-center justify-between"}>
        <Header title={"activity"} seeAll={true} link={"activity"} />
      </span>
    </div>
  );
}
