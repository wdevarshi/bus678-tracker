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

function loadDot(load: string): string {
  switch (load) {
    case "SEA": return "#22c55e";
    case "SDA": return "#eab308";
    case "LSD": return "#ef4444";
    default: return "#d1d5db";
  }
}

type Direction = "am" | "pm";

export default function Home() {
  const [stopData, setStopData] = useState<Map<string, StopData>>(new Map());
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const hour = new Date().getHours();
  const autoDirection: Direction = (hour >= 9 && hour < 20) ? "pm" : "am";
  const [direction, setDirection] = useState<Direction>(autoDirection);

  const stops = direction === "am" ? AM_STOPS : PM_STOPS;

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
    <main className="flex items-center justify-center min-h-screen bg-white px-6 font-[system-ui]">
      <div className="w-full max-w-xs">
        {/* Header */}
        <div className="flex items-center justify-between mb-10">
          <h1 className="text-2xl font-semibold text-gray-900">678</h1>
          <div className="flex text-sm">
            <button
              onClick={() => setDirection("am")}
              className={`px-3 py-1 rounded-l-full border transition-colors ${
                direction === "am"
                  ? "bg-gray-900 text-white border-gray-900"
                  : "bg-white text-gray-400 border-gray-200"
              }`}
            >AM</button>
            <button
              onClick={() => setDirection("pm")}
              className={`px-3 py-1 rounded-r-full border-t border-b border-r transition-colors ${
                direction === "pm"
                  ? "bg-gray-900 text-white border-gray-900"
                  : "bg-white text-gray-400 border-gray-200"
              }`}
            >PM</button>
          </div>
        </div>

        {/* Stops */}
        <div className="space-y-8">
          {stops.map((stop) => {
            const data = stopData.get(stop.code);

            return (
              <div key={stop.code}>
                <div className="mb-1">
                  <span className="text-base font-medium text-gray-900">{stop.name}</span>
                </div>

                {/* Scheduled */}
                {stop.scheduled && (
                  <p className="text-lg tabular-nums text-gray-600 mb-3">
                    {stop.scheduled[0]} <span className="text-gray-300 mx-0.5">·</span> {stop.scheduled[1]}
                  </p>
                )}

                {/* Live */}
                {data?.loading && data.arrivals.length === 0 ? (
                  <div className="text-sm text-gray-300">—</div>
                ) : data && data.arrivals.length > 0 ? (
                  <div className="flex items-baseline gap-4">
                    {data.arrivals.map((a, j) => (
                      <div key={j} className="flex items-center gap-1.5">
                        <span
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: loadDot(a.load) }}
                        />
                        <span className={`tabular-nums ${
                          j === 0 ? "text-2xl font-semibold text-gray-900" : "text-sm text-gray-400"
                        }`}>
                          {a.eta}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="mt-12 flex items-center justify-between text-xs text-gray-400">
          <span>
            {lastRefresh
              ? lastRefresh.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
              : ""}
          </span>
          <button onClick={refresh} className="hover:text-gray-600 transition-colors">
            Refresh
          </button>
        </div>

        {/* About */}
        <details className="mt-8 mb-6">
          <summary className="text-xs text-gray-400 cursor-pointer hover:text-gray-500 transition-colors">
            About this bus
          </summary>
          <div className="mt-3 text-xs text-gray-400 space-y-2 leading-relaxed">
            <p>
              Bus 678 is a City Direct service between Punggol and the CBD.
              Weekdays only, peak hours.
            </p>
            <div className="space-y-1">
              <p><span className="text-gray-500">AM</span> — 2 trips from Punggol: ~7:25 &amp; ~7:40</p>
              <p className="pl-8">Riviera Stn Exit A: ~7:45 &amp; ~8:00</p>
              <p><span className="text-gray-500">PM</span> — 2 trips from CBD: ~6:00 &amp; ~6:15</p>
            </div>
            <p>No service on weekends &amp; public holidays.</p>
          </div>
        </details>
      </div>
    </main>
  );
}
