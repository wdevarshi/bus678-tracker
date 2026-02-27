"use client";

import { useState, useEffect, useCallback } from "react";
import { AM_STOPS, PM_STOPS, type BusStop } from "./data";

interface ArrivalInfo {
  eta: string;
  minutes: number;
  load: string;
}

interface StopData {
  arrivals: ArrivalInfo[];
  loading: boolean;
}

function parseArrival(isoStr: string): { eta: string; minutes: number } {
  const diff = Math.round((new Date(isoStr).getTime() - Date.now()) / 60000);
  if (diff <= 0) return { eta: "Arr", minutes: 0 };
  return { eta: `${diff}m`, minutes: diff };
}

function loadLabel(load: string): { text: string; color: string } {
  switch (load) {
    case "SEA": return { text: "Seats", color: "#22c55e" };
    case "SDA": return { text: "Standing", color: "#eab308" };
    case "LSD": return { text: "Full", color: "#ef4444" };
    default: return { text: "", color: "#d1d5db" };
  }
}

type Direction = "am" | "pm";

export default function Home() {
  const [stopData, setStopData] = useState<Map<string, StopData>>(new Map());
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [showInfo, setShowInfo] = useState(false);

  const hour = new Date().getHours();
  const autoDirection: Direction = hour < 14 ? "am" : "pm";
  const [direction, setDirection] = useState<Direction>(autoDirection);

  const stops = direction === "am" ? AM_STOPS : PM_STOPS;
  const label = direction === "am" ? "To CBD" : "To Punggol";
  const otherLabel = direction === "am" ? "PM" : "AM";
  const otherDirection: Direction = direction === "am" ? "pm" : "am";

  const fetchStop = useCallback(async (code: string) => {
    setStopData((prev) => {
      const next = new Map(prev);
      next.set(code, { arrivals: prev.get(code)?.arrivals || [], loading: true });
      return next;
    });

    try {
      const res = await fetch(`/api/arrivals?stop=${code}`);
      const data = await res.json();
      const svc = (data.Services || []).find(
        (s: { ServiceNo: string }) => s.ServiceNo === "678"
      );

      const list: ArrivalInfo[] = [];
      if (svc) {
        for (const key of ["NextBus", "NextBus2", "NextBus3"]) {
          const bus = svc[key];
          if (bus?.EstimatedArrival) {
            const { eta, minutes } = parseArrival(bus.EstimatedArrival);
            list.push({ eta, minutes, load: bus.Load || "" });
          }
        }
      }

      setStopData((prev) => {
        const next = new Map(prev);
        next.set(code, { arrivals: list, loading: false });
        return next;
      });
    } catch {
      setStopData((prev) => {
        const next = new Map(prev);
        next.set(code, { arrivals: [], loading: false });
        return next;
      });
    }
  }, []);

  const refresh = useCallback(() => {
    stops.forEach((s) => fetchStop(s.code));
    setLastRefresh(new Date());
  }, [stops, fetchStop]);

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, 30000);
    return () => clearInterval(id);
  }, [refresh]);

  return (
    <main className="flex items-center justify-center min-h-screen bg-white px-5 font-[system-ui]">
      <div className="w-full max-w-sm">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-baseline justify-between">
            <div className="flex items-baseline gap-3">
              <span className="text-4xl font-bold tracking-tight text-gray-900">678</span>
              <span className="text-sm text-gray-400">{label}</span>
            </div>
            <button
              onClick={() => setDirection(otherDirection)}
              className="text-xs text-gray-400 hover:text-gray-600 border border-gray-200 rounded-full px-3 py-1 transition-colors"
            >
              {otherLabel} →
            </button>
          </div>
        </div>

        {/* Stops */}
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-[3px] top-2 bottom-2 w-px bg-gray-200" />

          <div className="space-y-0">
            {stops.map((stop, i) => {
              const data = stopData.get(stop.code);
              const first = data?.arrivals?.[0];
              const isFirst = i === 0;
              const isLast = i === stops.length - 1;
              const isHighlight = stop.highlight;

              return (
                <div key={stop.code} className="relative pl-7">
                  {/* Dot */}
                  <div
                    className={`absolute left-0 top-3 w-[7px] h-[7px] rounded-full border-2 border-white z-10 ${
                      isHighlight || isFirst || isLast
                        ? "bg-gray-900"
                        : "bg-gray-300"
                    }`}
                  />

                  <div className={`py-3 ${!isLast ? "border-b border-gray-100" : ""}`}>
                    {/* Stop name + first arrival */}
                    <div className="flex items-baseline justify-between">
                      <div className="min-w-0">
                        <span
                          className={`text-sm ${
                            isHighlight
                              ? "font-medium text-gray-900"
                              : "text-gray-600"
                          }`}
                        >
                          {stop.name}
                        </span>
                        <span className="text-xs text-gray-300 ml-2">
                          {stop.code}
                        </span>
                      </div>

                      <div className="flex-shrink-0 ml-4">
                        {data?.loading && !first ? (
                          <span className="text-xs text-gray-300">—</span>
                        ) : first ? (
                          <div className="flex items-center gap-1.5">
                            <span
                              className="w-1.5 h-1.5 rounded-full"
                              style={{ backgroundColor: loadLabel(first.load).color }}
                            />
                            <span className={`tabular-nums font-semibold ${
                              isHighlight ? "text-xl text-gray-900" : "text-sm text-gray-700"
                            }`}>
                              {first.eta}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-300">—</span>
                        )}
                      </div>
                    </div>

                    {/* All arrivals for highlighted stop */}
                    {isHighlight && data && !data.loading && data.arrivals.length > 1 && (
                      <div className="mt-1.5 flex gap-4">
                        {data.arrivals.slice(1).map((a, j) => (
                          <div key={j} className="flex items-center gap-1.5">
                            <span
                              className="w-1.5 h-1.5 rounded-full"
                              style={{ backgroundColor: loadLabel(a.load).color }}
                            />
                            <span className="text-xs tabular-nums text-gray-400">
                              {a.eta}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Scheduled times */}
                    {stop.scheduled && (
                      <p className="text-xs text-gray-400 mt-1">
                        Scheduled: {stop.scheduled[0]} · {stop.scheduled[1]}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-10 flex items-center justify-between text-xs text-gray-300">
          <span>
            {lastRefresh
              ? lastRefresh.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : "—"}
          </span>
          <button
            onClick={refresh}
            className="text-gray-300 hover:text-gray-500 transition-colors"
          >
            Refresh
          </button>
        </div>

        {/* Info toggle */}
        <div className="mt-8 border-t border-gray-100 pt-4">
          <button
            onClick={() => setShowInfo(!showInfo)}
            className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
          >
            {showInfo ? "Hide details ↑" : "About this bus ↓"}
          </button>

          {showInfo && (
            <div className="mt-4 text-xs text-gray-500 space-y-3 leading-relaxed">
              <div>
                <p className="font-medium text-gray-700 mb-1">Bus 678 — City Direct</p>
                <p>
                  Express service between Punggol and the CBD.
                  Weekday peak hours only — no service on weekends or public holidays.
                </p>
              </div>

              <div>
                <p className="font-medium text-gray-700 mb-1">Schedule</p>
                <p className="mb-1">Weekdays only · 2 trips each way</p>
                <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 mt-2">
                  <span className="text-gray-400">AM</span>
                  <div>
                    <p>Trip 1: <span className="font-medium">7:28 Blks 187/188</span> → <span className="font-medium">7:45 Riviera</span></p>
                    <p>Trip 2: <span className="font-medium">7:43 Blks 187/188</span> → <span className="font-medium">8:00 Riviera</span></p>
                  </div>
                  <span className="text-gray-400">PM</span>
                  <div>
                    <p>Trip 1: 6:00 Suntec → <span className="font-medium">6:27 your stop</span> → 6:53 Punggol</p>
                    <p>Trip 2: 6:15 Suntec → <span className="font-medium">6:42 your stop</span> → 7:08 Punggol</p>
                  </div>
                </div>
              </div>

              <div>
                <p className="font-medium text-gray-700 mb-1">Load indicator</p>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-500" />
                    <span>Seats available</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-yellow-500" />
                    <span>Standing room</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-red-500" />
                    <span>Full</span>
                  </div>
                </div>
              </div>

              <p className="text-gray-300 pt-1">
                Data from LTA DataMall · 30s auto-refresh
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
