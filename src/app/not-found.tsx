import Image from "next/image";
import Link from "next/link";

export default function NotFound() {
  return (
    <div
      className="
        flex h-[100svh] w-[100svw] flex-col items-center justify-center gap-2
      "
    >
      <Image
        src={
          "https://media0.giphy.com/media/v1.Y2lkPTc5MGI3NjExcDFkN2V3enByeWNkNzk0YnkxaWFkZGp0d3Q5azF3YmZwNDZpbGZxdCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/3o7aTskHEUdgCQAXde/giphy.gif"
        }
        alt={"404 not found"}
        width={400}
        height={400}
        className={"h-50 w-72 object-cover"}
      />
      <Link href={"/"} className="underline underline-offset-4">
        you're lost, go home.
      </Link>
    </div>
  );
}
