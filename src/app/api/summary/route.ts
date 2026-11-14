import { z } from "zod";
import { writeParentSummary } from "@/lib/ai/parent-summary";

const text = (max: number) => z.string().max(max);

const FactsSchema = z.object({
  childName: text(40),
  grade: z.number().int().min(1).max(4),
  season: z.enum(["fall", "winter", "spring"]),
  usedLaterSeason: z.boolean(),
  wcpm: z.number().int().min(0).max(400),
  accuracyPercent: z.number().int().min(0).max(100),
  median: z.number().int(),
  percentile25: z.number().int(),
  band: text(20),
  gapToMedian: z.number().int(),
  verdict: z.enum(["onTrack", "practice", "talkToTeacher"]),
  patterns: z
    .array(z.object({ title: text(80), seen: text(200), tip: text(300), examples: z.array(text(80)).max(3) }))
    .max(6),
  weeklyGrowth: z.number().min(0).max(10),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const facts = FactsSchema.safeParse(body);
  if (!facts.success) return Response.json({ error: "Invalid result" }, { status: 400 });
  return Response.json(await writeParentSummary(facts.data));
}
