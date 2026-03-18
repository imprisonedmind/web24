export function BlueDot() {
  return (
    <div className="absolute right-1/2 top-1/2 z-10 flex h-10 w-10 translate-x-[20px] -translate-y-[80px] items-center justify-center">
      <div className="absolute z-10 h-6 w-6 rounded-full border-2 border-white bg-blue-500" />
      <div className="scaleAnimate absolute z-0 h-10 w-10 rounded-full bg-blue-500" />
    </div>
  );
}
