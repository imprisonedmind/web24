import { Hono } from "hono";

import { getWritingRecordMap } from "../services/writing";

const writingRoutes = new Hono();

writingRoutes.get("/:id", async c => {
  const id = c.req.param("id");
  if (!id) {
    return c.json({ recordMap: null }, 400);
  }

  try {
    const recordMap = await getWritingRecordMap(id);
    return c.json({ recordMap }, 200);
  } catch (error) {
    console.error("[api/writing/:id] failed", error);
    return c.json({ recordMap: null }, 500);
  }
});

export { writingRoutes };
