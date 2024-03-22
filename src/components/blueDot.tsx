export default function BlueDot() {
  return (
		<div className={
			"absolute top-1/2 right-1/2 translate-x-[20px] -translate-y-[80px] z-10" +
			" h-10 w-10 flex justify-center items-center"
		}>
			<div className={
				"absolute h-6 w-6 rounded-full bg-blue-500 z-10 border-2 border-white"
			}/>
			<div className={
				"scaleAnimate absolute h-10 w-10 bg-blue-500 z-0 rounded-full"
			}/>
		</div>
	);
};