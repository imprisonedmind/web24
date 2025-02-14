import { Header } from "@/components/header";
import { BulletPoint } from "@/components/bulletPoint";

export default function Employment() {
  return (
    <div>
      <Header title={"employment"} />
      <div className={"flex flex-col"}>
        <p className={"text-sm text-neutral-500"}>
          Trinity Telecomms (PTY) LTD
        </p>
        <BulletPoint title={"design and research lead"} date={"'23-current"} />
        <BulletPoint title={"software designer"} date={"'21-current"} />
      </div>
      <div className={"flex flex-col"}>
        <p className={"text-sm text-neutral-500"}>Specno</p>
        <BulletPoint title={"multimedia designer"} date={"'19-20"} />
      </div>
    </div>
  );
}
