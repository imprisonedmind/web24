import {ReactElement} from "react";

export default function Layout({children} : {children: ReactElement}) {
  return (
    <div className={`mt-4`}>
			{children}
    </div>
  );
};