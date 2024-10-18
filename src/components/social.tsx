import { Header } from "@/components/header";
import { SmallLink } from "@/components/smallLink";

export default function Social() {
  return (
    <div>
      <Header title={"social"} />
      <div className={"flex flex-col"}>
        <SmallLink
          target={true}
          title={"thecrag.com"}
          link={"https://www.thecrag.com/climber/luke6"}
        />
        <SmallLink
          target={true}
          title={"twitter.com"}
          link={"https://twitter.com/lukey_stephens"}
        />
        <SmallLink
          target={true}
          title={"layers.to"}
          link={"https://layers.to/lukey"}
        />
        <SmallLink
          target={true}
          title={"github.com"}
          link={"https://github.com/imprisonedmind"}
        />
      </div>
    </div>
  );
}
