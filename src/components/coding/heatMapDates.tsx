import { HeatMapDate } from "@/components/coding/heatMapDate";

export default function HeatMapDates() {
  return (
    <ul className={"grid grid-rows-[7] gap-[3px] p-[2px]"}>
      <HeatMapDate title={"S"} />
      <HeatMapDate title={"M"} />
      <HeatMapDate title={"T"} />
      <HeatMapDate title={"W"} />
      <HeatMapDate title={"T"} />
      <HeatMapDate title={"F"} />
      <HeatMapDate title={"S"} />
    </ul>
  );
}
