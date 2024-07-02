import { FC } from "react";

interface HeatMapDateProps {
  title: string;
}

export const HeatMapDate: FC<HeatMapDateProps> = ({ title }) => {
  return (
    <li
      className={`
        m-auto flex h-[10px] w-[10px] items-center justify-center rounded-sm 
        border-[0.5px] border-gray-200 bg-white text-[7px] font-medium shadow-sm
    `}
    >
      {title}
    </li>
  );
};
