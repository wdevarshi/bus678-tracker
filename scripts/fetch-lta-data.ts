/**
 * Fetches all Singapore bus routes and stops from LTA DataMall
 * and saves them as static JSON files for the app.
 *
 * Usage: npx tsx scripts/fetch-lta-data.ts
 */

const API_BASE = "https://datamall2.mytransport.sg/ltaodataservice/";
const API_KEY = "0m5YmyR2QZ+Wx8LMLCBk2g==";

interface LTABusRoute {
  ServiceNo: string;
  Operator: string;
  Direction: number;
  StopSequence: number;
  BusStopCode: string;
  Distance: number;
  WD_FirstBus: string;
  WD_LastBus: string;
  SAT_FirstBus: string;
  SAT_LastBus: string;
  SUN_FirstBus: string;
  SUN_LastBus: string;
}

interface LTABusStop {
  BusStopCode: string;
  RoadName: string;
  Description: string;
  Latitude: number;
  Longitude: number;
}

async function fetchPaginated<T>(endpoint: string): Promise<T[]> {
  const results: T[] = [];
  let skip = 0;

  while (true) {
    const url = `${API_BASE}${endpoint}?$skip=${skip}`;
    console.log(`  Fetching ${endpoint} skip=${skip}...`);

    const res = await fetch(url, {
      headers: { AccountKey: API_KEY },
    });

    if (!res.ok) {
      throw new Error(`LTA API error: ${res.status} ${res.statusText} for ${url}`);
    }

    const data = await res.json();
    const items: T[] = data.value || [];

    if (items.length === 0) break;

    results.push(...items);
    skip += 500;

    // Small delay to be nice to the API
    await new Promise((r) => setTimeout(r, 300));
  }

  return results;
}

interface RouteStop {
  stopCode: string;
  sequence: number;
  firstBus: string;
  lastBus: string;
  distance: number;
}

interface RouteDirection {
  stops: RouteStop[];
}

interface RouteEntry {
  directions: Record<number, RouteStop[]>;
}

async function main() {
  const fs = await import("fs");
  const path = await import("path");

  const outDir = path.resolve(__dirname, "../public/data");
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  // --- Fetch Bus Stops ---
  console.log("Fetching bus stops...");
  const rawStops = await fetchPaginated<LTABusStop>("BusStops");
  console.log(`  Got ${rawStops.length} bus stops`);

  const busStops: Record<string, { name: string; road: string; lat: number; lng: number }> = {};
  for (const s of rawStops) {
    busStops[s.BusStopCode] = {
      name: s.Description,
      road: s.RoadName,
      lat: s.Latitude,
      lng: s.Longitude,
    };
  }

  const stopsPath = path.join(outDir, "bus-stops.json");
  fs.writeFileSync(stopsPath, JSON.stringify(busStops));
  console.log(`  Saved ${Object.keys(busStops).length} stops to ${stopsPath}`);

  // --- Fetch Bus Routes ---
  console.log("Fetching bus routes...");
  const rawRoutes = await fetchPaginated<LTABusRoute>("BusRoutes");
  console.log(`  Got ${rawRoutes.length} route entries`);

  const busRoutes: Record<string, RouteEntry> = {};
  for (const r of rawRoutes) {
    if (!busRoutes[r.ServiceNo]) {
      busRoutes[r.ServiceNo] = { directions: {} };
    }
    if (!busRoutes[r.ServiceNo].directions[r.Direction]) {
      busRoutes[r.ServiceNo].directions[r.Direction] = [];
    }
    busRoutes[r.ServiceNo].directions[r.Direction].push({
      stopCode: r.BusStopCode,
      sequence: r.StopSequence,
      firstBus: r.WD_FirstBus,
      lastBus: r.WD_LastBus,
      distance: r.Distance,
    });
  }

  // Sort stops by sequence within each direction
  for (const svc of Object.values(busRoutes)) {
    for (const dir of Object.keys(svc.directions)) {
      svc.directions[Number(dir)].sort((a, b) => a.sequence - b.sequence);
    }
  }

  const routesPath = path.join(outDir, "bus-routes.json");
  fs.writeFileSync(routesPath, JSON.stringify(busRoutes));
  console.log(`  Saved ${Object.keys(busRoutes).length} services to ${routesPath}`);

  console.log("Done!");
}

main().catch((err) => {
  console.error("Failed:", err);
  process.exit(1);
});
