import { NextRequest, NextResponse } from "next/server";

const LTA_API = "https://datamall2.mytransport.sg/ltaodataservice/v3/BusArrival";
const API_KEY = process.env.LTA_API_KEY!;

export async function GET(req: NextRequest) {
  const stop = req.nextUrl.searchParams.get("stop");
  const service = req.nextUrl.searchParams.get("service");

  if (!stop) {
    return NextResponse.json({ error: "Missing stop parameter" }, { status: 400 });
  }

  try {
    let url = `${LTA_API}?BusStopCode=${stop}`;
    if (service) {
      url += `&ServiceNo=${service}`;
    }

    const res = await fetch(url, {
      headers: { AccountKey: API_KEY },
      next: { revalidate: 0 },
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: `LTA API returned ${res.status}` },
        { status: 502 }
      );
    }

    const data = await res.json();
    return NextResponse.json(data, {
      headers: { "Cache-Control": "no-store, max-age=0" },
    });
  } catch (e) {
    return NextResponse.json(
      { error: "Failed to fetch from LTA" },
      { status: 500 }
    );
  }
}
