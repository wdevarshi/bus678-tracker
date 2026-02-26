"use client";

import { useState, useEffect, useCallback } from "react";
import { AM_STOPS, PM_STOPS, type BusStop } from "./data";

interface ArrivalInfo {
  estimatedArrival: string;
  load: string;
  type: string;
}

interface StopArrival {
  code: string;
  arrivals: ArrivalInfo[];
  loading: boolean;
  error?: string;
}

function formatEta(isoStr: string): string {
  const diff = Math.round((new Date(isoStr).getTime() - Date.now()) / 60000);
  if (diff <= 0) return "Arr";
  return `${diff} min`;
}

function loadLabel(load: string): { text: string; color: string } {
  switch (load) {
    case "SEA":
      return { text: "Seats", color: "text-green-600" };
    case "SDA":
      return { text: "Standing", color: "text-yellow-600" };
    case "LSD":
      return { text: "Full", color: "text-red-600" };
    default:
      return { text: "—", color: "text-gray-400" };
  }
}

function typeLabel(type: string): string {
  switch (type) {
    case "SD":
      return "🚌";
    case "DD":
      return "🚌🚌";
    case "BD":
      return "🚍";
    default:
      return "🚌";
  }
}

export default function Home() {
  const [direction, setDirection] = useState<"AM" | "PM">("AM");
  const [arrivals, setArrivals] = useState<Map<string, StopArrival>>(new Map());
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [selectedStop, setSelectedStop] = useState<string | null>(null);

  const stops = direction === "AM" ? AM_STOPS : PM_STOPS;

  const fetchArrivals = useCallback(
    async (stopCode: string) => {
      setArrivals((prev) => {
        const next = new Map(prev);
        next.set(stopCode, { code: stopCode, arrivals: [], loading: true });
        return next;
      });

      try {
        const res = await fetch(`/api/arrivals?stop=${stopCode}`);
        const data = await res.json();

        const services = data.Services || [];
        const svc = services.find(
          (s: { ServiceNo: string }) => s.ServiceNo === "678"
        );

        const busArrivals: ArrivalInfo[] = [];
        if (svc) {
          for (const key of ["NextBus", "NextBus2", "NextBus3"]) {
            const bus = svc[key];
            if (bus && bus.EstimatedArrival) {
              busArrivals.push({
                estimatedArrival: bus.EstimatedArrival,
                load: bus.Load || "",
                type: bus.Type || "",
              });
            }
          }
        }

        setArrivals((prev) => {
          const next = new Map(prev);
          next.set(stopCode, {
            code: stopCode,
            arrivals: busArrivals,
            loading: false,
          });
          return next;
        });
      } catch {
        setArrivals((prev) => {
          const next = new Map(prev);
          next.set(stopCode, {
            code: stopCode,
            arrivals: [],
            loading: false,
            error: "Failed",
          });
          return next;
        });
      }
    },
    []
  );

  const fetchAll = useCallback(() => {
    stops.forEach((s) => fetchArrivals(s.code));
    setLastRefresh(new Date());
  }, [stops, fetchArrivals]);

  // Auto-refresh every 30s
  useEffect(() => {
    fetchAll();
    const id = setInterval(fetchAll, 30000);
    return () => clearInterval(id);
  }, [fetchAll]);

  return (
    <main className="max-w-lg mx-auto px-4 py-6">
      <header className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">
          🚌 Bus 678 Tracker
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          City Direct · Punggol ↔ CBD · Weekday peak only
        </p>
      </header>

      {/* Direction toggle */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setDirection("AM")}
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
            direction === "AM"
              ? "bg-blue-600 text-white"
              : "bg-gray-200 text-gray-600 hover:bg-gray-300"
          }`}
        >
          🌅 AM → CBD
        </button>
        <button
          onClick={() => setDirection("PM")}
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
            direction === "PM"
              ? "bg-blue-600 text-white"
              : "bg-gray-200 text-gray-600 hover:bg-gray-300"
          }`}
        >
          🌇 PM → Punggol
        </button>
      </div>

      {/* Refresh bar */}
      <div className="flex items-center justify-between mb-4 text-xs text-gray-500">
        <span>
          {lastRefresh
            ? `Updated ${lastRefresh.toLocaleTimeString()}`
            : "Loading..."}
        </span>
        <button
          onClick={fetchAll}
          className="text-blue-600 hover:text-blue-800 font-medium"
        >
          ↻ Refresh
        </button>
      </div>

      {/* Stop list */}
      <div className="space-y-2">
        {stops.map((stop, i) => {
          const data = arrivals.get(stop.code);
          const isSelected = selectedStop === stop.code;

          return (
            <div
              key={stop.code}
              className={`rounded-xl border transition-all cursor-pointer ${
                isSelected
                  ? "border-blue-300 bg-blue-50"
                  : "border-gray-200 bg-white hover:border-gray-300"
              }`}
              onClick={() =>
                setSelectedStop(isSelected ? null : stop.code)
              }
            >
              <div className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center font-medium">
                    {i + 1}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">
                      {stop.name}
                    </p>
                    <p className="text-xs text-gray-500">{stop.road}</p>
                  </div>
                </div>

                <div className="flex-shrink-0 ml-3">
                  {data?.loading ? (
                    <span className="text-xs text-gray-400 animate-pulse">
                      ...
                    </span>
                  ) : data?.arrivals && data.arrivals.length > 0 ? (
                    <span className="text-sm font-semibold text-blue-600">
                      {formatEta(data.arrivals[0].estimatedArrival)}
                    </span>
                  ) : (
                    <span className="text-xs text-gray-400">No bus</span>
                  )}
                </div>
              </div>

              {/* Expanded detail */}
              {isSelected && data && !data.loading && (
                <div className="px-4 pb-3 border-t border-gray-100 pt-2">
                  <p className="text-xs text-gray-400 mb-2">
                    Stop {stop.code}
                  </p>
                  {data.arrivals.length > 0 ? (
                    <div className="space-y-1.5">
                      {data.arrivals.map((a, j) => {
                        const load = loadLabel(a.load);
                        return (
                          <div
                            key={j}
                            className="flex items-center justify-between text-sm"
                          >
                            <span>
                              {typeLabel(a.type)} Bus {j + 1}
                            </span>
                            <div className="flex items-center gap-3">
                              <span className={`text-xs ${load.color}`}>
                                {load.text}
                              </span>
                              <span className="font-medium w-14 text-right">
                                {formatEta(a.estimatedArrival)}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400">
                      No buses at this stop right now
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <footer className="mt-8 text-center text-xs text-gray-400">
        Data from LTA DataMall · Auto-refreshes every 30s
      </footer>
    </main>
  );
}
