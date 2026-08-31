import { NextResponse } from "next/server";
import { readJourneyHome } from "@/lib/server/journey-home";
import { listJourneys } from "@/lib/server/journeys";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const home = readJourneyHome();
  return NextResponse.json(
    {
      items: listJourneys({ publicOnly: true }),
      home: home?.isPublic ? home : null,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
