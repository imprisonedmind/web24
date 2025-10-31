interface ArmThingyProps {
  isPlaying?: boolean;
}

export default function ArmThingy({ isPlaying = true }: ArmThingyProps) {
  const rotation = isPlaying ? "-rotate-[12deg]" : "-rotate-[2deg]";

  return (
    <div
      className={`
        absolute -top-[60px] left-1/2 z-10 h-36 w-3 translate-x-[91px]
        ${rotation} rounded-full bg-neutral-800 p-2 drop-shadow-md
        transition duration-150 ease-in-out hover:-rotate-[18deg]
      `}
    >
      <div
        className="
          absolute bottom-1/2 left-1/2 h-3/4 w-1 -translate-x-[50%]
          translate-y-[50%] rounded-full bg-neutral-600
        "
      />

      <div
        className="
          absolute -bottom-[6px] -right-[2px] z-20 h-4 w-8 -rotate-45
          rounded-r-full bg-neutral-800
        "
      >
        <div
          className="
            absolute -left-[6px] top-1/2 z-0 h-3 w-3 -translate-y-[50%]
            rotate-45 rounded-sm bg-neutral-800
          "
        />
        <div
          className="
            absolute bottom-1/2 right-1/2 z-20 mr-[4px] h-1 w-6
            translate-x-[50%] translate-y-[50%] rounded-full bg-neutral-600
         "
        />
      </div>
    </div>
  );
}
