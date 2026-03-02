import type { BusRoutesData, BusStopsData } from "../types";

let routesCache: BusRoutesData | null = null;
let stopsCache: BusStopsData | null = null;

export async function loadRoutes(): Promise<BusRoutesData> {
  if (routesCache) return routesCache;
  const res = await fetch("/data/bus-routes.json");
  routesCache = await res.json();
  return routesCache!;
}

export async function loadStops(): Promise<BusStopsData> {
  if (stopsCache) return stopsCache;
  const res = await fetch("/data/bus-stops.json");
  stopsCache = await res.json();
  return stopsCache!;
}
