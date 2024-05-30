import { Header } from "@/components/header";
import { Chunk } from "@/components/coding/chunk";

const getCodingData = async () => {
  const data = await fetch(
    "https://wakatime.com/share/@018c620c-4d0b-4835-a919-aefff3d87af2/c68e7bc4-65b4-4421-914f-3e1e404c199d.json",
    {
      method: "GET",
      headers: {
        dataType: "jsonp",
      },
    },
  );
  return await data.json();
};

export default async function Coding() {
  const data = await getCodingData();

  function chunkArray(array: any, chunkSize: number) {
    const chunks = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  }

  return (
    <section className={"flex flex-col gap-1 px-4 sm:p-0"}>
      <Header title={"coding"} />
      <div className={"rounded-lg bg-white pl-1 shadow-sm"}>
        <div
          className="
            flex w-full flex-nowrap justify-end overflow-x-clip p-2
          "
        >
          {chunkArray(data.days, 7).map((chunk, index) => {
            return <Chunk key={index} chunk={chunk} />;
          })}
        </div>
      </div>
      {/*<div className="rounded-lg bg-white p-4 pl-3 shadow-sm">*/}
      {/*  <figure className={"flex w-full justify-end overflow-clip"}>*/}
      {/*    <embed src="https://wakatime.com/share/@018c620c-4d0b-4835-a919-aefff3d87af2/f2b48019-3e6d-4fc5-82dd-84d819b68684.svg"></embed>*/}
      {/*  </figure>*/}
      {/*</div>*/}
    </section>
  );
}
