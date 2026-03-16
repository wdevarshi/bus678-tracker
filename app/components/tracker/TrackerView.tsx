"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import type { BusTrackerConfig, BusRoutesData, BusStopsData, ArrivalInfo, StopArrivalData } from "../../types";
import { removeService } from "../../lib/storage";
import BusCard from "./BusCard";

interface Props {
  config: BusTrackerConfig;
  routes: BusRoutesData;
  stops: BusStopsData;
  onAddBus: () => void;
  onConfigChange: () => void;
}

function parseArrival(isoStr: string): { eta: string; minutes: number } {
  const diff = Math.round((new Date(isoStr).getTime() - Date.now()) / 60000);
  if (diff <= 0) return { eta: "Arr", minutes: 0 };
  return { eta: `${diff}m`, minutes: diff };
}

/**
 * Get the origin stop code for a service+direction from route data.
 */
function getOriginStop(routes: BusRoutesData, service: string, direction: number): string | null {
  const route = routes[service];
  if (!route) return null;
  const dirStops = route.directions[direction];
  if (!dirStops || dirStops.length === 0) return null;
  return dirStops[0].stopCode;
}

/**
 * Get the scheduled travel time (minutes) from origin to a stop.
 */
function getScheduledOffset(routes: BusRoutesData, service: string, direction: number, stopCode: string): number | null {
  const route = routes[service];
  if (!route) return null;
  const dirStops = route.directions[direction];
  if (!dirStops || dirStops.length === 0) return null;

  const originStop = dirStops[0];
  const targetStop = dirStops.find(s => s.stopCode === stopCode);
  if (!originStop || !targetStop) return null;

  const parseHHMM = (t: string): number | null => {
    if (!t || t.length < 4) return null;
    const h = parseInt(t.substring(0, 2), 10);
    const m = parseInt(t.substring(2), 10);
    if (isNaN(h) || isNaN(m)) return null;
    return h * 60 + m;
  };

  const originMin = parseHHMM(originStop.firstBus);
  const targetMin = parseHHMM(targetStop.firstBus);
  if (originMin === null || targetMin === null) return null;

  return targetMin - originMin;
}

/**
 * Group buses by service number, preserving order of first appearance.
 */
function groupByService(config: BusTrackerConfig): { service: string; entries: typeof config.buses }[] {
  const groups = new Map<string, typeof config.buses>();
  const order: string[] = [];

  for (const bus of config.buses) {
    if (!groups.has(bus.service)) {
      groups.set(bus.service, []);
      order.push(bus.service);
    }
    groups.get(bus.service)!.push(bus);
  }

  return order.map(service => ({
    service,
    entries: groups.get(service)!,
  }));
}

export default function TrackerView({ config, routes, stops, onAddBus, onConfigChange }: Props) {
  const [arrivals, setArrivals] = useState<Map<string, StopArrivalData>>(new Map());
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const grouped = useMemo(() => groupByService(config), [config]);

  const fetchArrivals = useCallback(async () => {
    const fetches: { service: string; stopCode: string; direction: number }[] = [];
    for (const bus of config.buses) {
      for (const ts of bus.stops) {
        fetches.push({ service: bus.service, stopCode: ts.code, direction: bus.direction });
      }
    }

    // Collect origin stops for supplementary data
    const originStops = new Map<string, { service: string; direction: number; originCode: string }>();
    for (const bus of config.buses) {
      const originCode = getOriginStop(routes, bus.service, bus.direction);
      if (originCode) {
        const alreadyTracked = bus.stops.some(s => s.code === originCode);
        if (!alreadyTracked) {
          const key = `${bus.service}:${bus.direction}`;
          originStops.set(key, { service: bus.service, direction: bus.direction, originCode });
        }
      }
    }

    // Set loading
    setArrivals((prev) => {
      const next = new Map(prev);
      for (const f of fetches) {
        const key = `${f.service}:${f.stopCode}`;
        next.set(key, { arrivals: prev.get(key)?.arrivals || [], loading: true });
      }
      return next;
    });

    // Build stop→services lookup
    const stopServices = new Map<string, Set<string>>();
    for (const f of fetches) {
      if (!stopServices.has(f.stopCode)) stopServices.set(f.stopCode, new Set());
      stopServices.get(f.stopCode)!.add(f.service);
    }
    for (const [, info] of originStops) {
      if (!stopServices.has(info.originCode)) stopServices.set(info.originCode, new Set());
      stopServices.get(info.originCode)!.add(info.service);
    }

    // Fetch all stops
    const rawArrivals = new Map<string, ArrivalInfo[]>();

    for (const [stopCode, services] of stopServices) {
      try {
        const res = await fetch(`/api/arrivals?stop=${stopCode}&_t=${Date.now()}`, { cache: "no-store" });
        const data = await res.json();
        const allServices = data.Services || [];

        for (const svcNo of services) {
          const key = `${svcNo}:${stopCode}`;
          const svc = allServices.find((s: { ServiceNo: string }) => s.ServiceNo === svcNo);
          const list: ArrivalInfo[] = [];
          if (svc) {
            for (const busKey of ["NextBus", "NextBus2", "NextBus3"]) {
              const bus = svc[busKey];
              if (bus?.EstimatedArrival) {
                const { eta, minutes } = parseArrival(bus.EstimatedArrival);
                list.push({ eta, minutes, load: bus.Load || "" });
              }
            }
          }
          rawArrivals.set(key, list);
        }
      } catch {
        for (const svcNo of services) {
          rawArrivals.set(`${svcNo}:${stopCode}`, []);
        }
      }
    }

    // Augment with origin data
    for (const f of fetches) {
      const key = `${f.service}:${f.stopCode}`;
      const stopArrivals = rawArrivals.get(key) || [];

      const originInfo = originStops.get(`${f.service}:${f.direction}`);
      if (originInfo) {
        const originKey = `${f.service}:${originInfo.originCode}`;
        const originArrivals = rawArrivals.get(originKey) || [];
        const offset = getScheduledOffset(routes, f.service, f.direction, f.stopCode);

        if (originArrivals.length > stopArrivals.length && offset !== null) {
          for (let i = stopArrivals.length; i < originArrivals.length; i++) {
            const originBus = originArrivals[i];
            const estimatedMinutes = originBus.minutes + offset;
            if (estimatedMinutes > 0) {
              stopArrivals.push({
                eta: `~${estimatedMinutes}m`,
                minutes: estimatedMinutes,
                load: originBus.load,
                estimated: true,
              });
            }
          }
        }
      }

      setArrivals((prev) => {
        const next = new Map(prev);
        next.set(key, { arrivals: stopArrivals, loading: false });
        return next;
      });
    }

    setLastRefresh(new Date());
  }, [config, routes]);

  useEffect(() => {
    fetchArrivals();
    const id = setInterval(fetchArrivals, 30000);
    return () => clearInterval(id);
  }, [fetchArrivals]);

  function handleRemove(service: string) {
    removeService(service);
    onConfigChange();
  }

  return (
    <main className="flex items-center justify-center min-h-screen bg-white px-6 font-[system-ui]">
      <div className="w-full max-w-xs py-10">
        {grouped.map(({ service, entries }) => (
          <BusCard
            key={service}
            service={service}
            entries={entries}
            stopsData={stops}
            routesData={routes}
            arrivals={arrivals}
            onRemove={handleRemove}
          />
        ))}

        {/* Footer */}
        <div className="flex items-center justify-between text-[11px] text-gray-300 mt-2">
          <span>
            {lastRefresh
              ? lastRefresh.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
              : ""}
          </span>
          <button onClick={fetchArrivals} className="hover:text-gray-500 transition-colors">
            Refresh
          </button>
        </div>

        <button
          onClick={onAddBus}
          className="w-full mt-8 py-2.5 rounded-lg text-sm border border-dashed border-gray-200 text-gray-400 hover:border-gray-300 hover:text-gray-500 transition-colors"
        >
          + Add bus
        </button>
      </div>
    </main>
  );
}
