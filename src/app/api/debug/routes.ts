import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";

export async function GET() {
  try {
    const result = await db.select().from(users).limit(1);
    return Response.json({ ok: true, count: result.length, sample: result });
  } catch (err) {
    return Response.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
