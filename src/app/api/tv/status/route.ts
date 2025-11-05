import { NextResponse } from "next/server";

import { getCurrentlyWatching } from "@/app/activity/actions/getCurrentlyWatching";
import { getLastWatched } from "@/app/activity/actions/getLastWatched";

export const revalidate = 0;
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [currentlyWatching, lastWatched] = await Promise.all([
      getCurrentlyWatching(),
      getLastWatched()
    ]);

    return NextResponse.json(
      {
        currentlyWatching,
        lastWatched
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[tv/status] failed to fetch status", error);
    return NextResponse.json(
      { currentlyWatching: null, lastWatched: null },
      { status: 500 }
    );
  }
}
