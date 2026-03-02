"use client";

import { useState, useEffect, useCallback } from "react";
import type { BusTrackerConfig, BusRoutesData, BusStopsData, ArrivalInfo, StopArrivalData } from "../../types";
import { getConfig, saveConfig, removeBus as removeStoredBus } from "../../lib/storage";
import BusCard from "./BusCard";

interface Props {
  config: BusTrackerConfig;
  routes: BusRoutesData;
  stops: BusStopsData;
  onAddBus: () => void;
  onEditBus: (index: number) => void;
  onConfigChange: () => void;
}

function parseArrival(isoStr: string): { eta: string; minutes: number } {
  const diff = Math.round((new Date(isoStr).getTime() - Date.now()) / 60000);
  if (diff <= 0) return { eta: "Arr", minutes: 0 };
  return { eta: `${diff}m`, minutes: diff };
}

export default function TrackerView({ config, routes, stops, onAddBus, onEditBus, onConfigChange }: Props) {
  const [arrivals, setArrivals] = useState<Map<string, StopArrivalData>>(new Map());
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const fetchArrivals = useCallback(async () => {
    // Collect all unique stop+service combos
    const fetches: { service: string; stopCode: string }[] = [];
    for (const bus of config.buses) {
      for (const ts of bus.stops) {
        fetches.push({ service: bus.service, stopCode: ts.code });
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

    // Fetch each unique stop (batch by stop code to reduce API calls)
    const stopServices = new Map<string, Set<string>>();
    for (const f of fetches) {
      if (!stopServices.has(f.stopCode)) {
        stopServices.set(f.stopCode, new Set());
      }
      stopServices.get(f.stopCode)!.add(f.service);
    }

    for (const [stopCode, services] of stopServices) {
      try {
        const res = await fetch(`/api/arrivals?stop=${stopCode}&_t=${Date.now()}`, {
          cache: "no-store",
        });
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

          setArrivals((prev) => {
            const next = new Map(prev);
            next.set(key, { arrivals: list, loading: false });
            return next;
          });
        }
      } catch {
        for (const svcNo of services) {
          const key = `${svcNo}:${stopCode}`;
          setArrivals((prev) => {
            const next = new Map(prev);
            next.set(key, { arrivals: [], loading: false });
            return next;
          });
        }
      }
    }

    setLastRefresh(new Date());
  }, [config]);

  useEffect(() => {
    fetchArrivals();
    const id = setInterval(fetchArrivals, 30000);
    return () => clearInterval(id);
  }, [fetchArrivals]);

  function handleRemove(index: number) {
    removeStoredBus(index);
    onConfigChange();
  }

  return (
    <main className="flex items-center justify-center min-h-screen bg-white px-6 font-[system-ui]">
      <div className="w-full max-w-xs py-8">
        {config.buses.map((bus, i) => (
          <BusCard
            key={`${bus.service}-${bus.direction}-${i}`}
            bus={bus}
            busIndex={i}
            stopsData={stops}
            routesData={routes}
            arrivals={arrivals}
            onEdit={onEditBus}
            onRemove={handleRemove}
          />
        ))}

        {/* Footer */}
        <div className="mt-4 flex items-center justify-between text-xs text-gray-400">
          <span>
            {lastRefresh
              ? lastRefresh.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
              : ""}
          </span>
          <button onClick={fetchArrivals} className="hover:text-gray-600 transition-colors">
            Refresh
          </button>
        </div>

        {/* Add bus button */}
        <button
          onClick={onAddBus}
          className="w-full mt-8 py-2.5 rounded-lg text-sm font-medium border border-dashed border-gray-200 text-gray-400 hover:border-gray-400 hover:text-gray-600 transition-colors"
        >
          + Add bus
        </button>
      </div>
    </main>
  );
}
