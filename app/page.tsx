"use client";

import { useState, useEffect, useCallback } from "react";
import { AM_STOPS, PM_STOPS, type BusStop } from "./data";

interface ArrivalInfo {
  eta: string;
  minutes: number;
  load: string;
}

interface StopArrival {
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

export default function Home() {
  const [direction, setDirection] = useState<"AM" | "PM">("AM");
  const [arrivals, setArrivals] = useState<Map<string, StopArrival>>(new Map());
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  const stops = direction === "AM" ? AM_STOPS : PM_STOPS;

  const fetchStop = useCallback(async (code: string) => {
    setArrivals((prev) => {
      const next = new Map(prev);
      next.set(code, { arrivals: [], loading: true });
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

      setArrivals((prev) => {
        const next = new Map(prev);
        next.set(code, { arrivals: list, loading: false });
        return next;
      });
    } catch {
      setArrivals((prev) => {
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
    <main className="max-w-md mx-auto px-5 py-8 font-[system-ui]">
      <header className="mb-8">
        <h1 className="text-lg font-semibold tracking-tight text-gray-900">
          678
        </h1>
        <p className="text-[13px] text-gray-400 mt-0.5">
          Punggol — CBD · Weekdays only
        </p>
      </header>

      {/* Direction */}
      <div className="flex border-b border-gray-200 mb-6">
        <button
          onClick={() => setDirection("AM")}
          className={`pb-2 mr-6 text-sm font-medium border-b-2 transition-colors ${
            direction === "AM"
              ? "border-gray-900 text-gray-900"
              : "border-transparent text-gray-400 hover:text-gray-600"
          }`}
        >
          To CBD
        </button>
        <button
          onClick={() => setDirection("PM")}
          className={`pb-2 text-sm font-medium border-b-2 transition-colors ${
            direction === "PM"
              ? "border-gray-900 text-gray-900"
              : "border-transparent text-gray-400 hover:text-gray-600"
          }`}
        >
          To Punggol
        </button>
      </div>

      {/* Route */}
      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-[3px] top-2 bottom-2 w-px bg-gray-200" />

        <div className="space-y-0">
          {stops.map((stop, i) => {
            const data = arrivals.get(stop.code);
            const isExpanded = expanded === stop.code;
            const first = data?.arrivals?.[0];
            const isFirst = i === 0;
            const isLast = i === stops.length - 1;

            return (
              <div
                key={stop.code}
                className="relative pl-7 cursor-pointer group"
                onClick={() => setExpanded(isExpanded ? null : stop.code)}
              >
                {/* Dot on the line */}
                <div
                  className={`absolute left-0 top-3 w-[7px] h-[7px] rounded-full border-2 border-white z-10 ${
                    isFirst || isLast
                      ? "bg-gray-900"
                      : "bg-gray-300 group-hover:bg-gray-500"
                  }`}
                />

                <div
                  className={`py-2.5 ${
                    isExpanded ? "" : "border-b border-gray-100"
                  }`}
                >
                  <div className="flex items-baseline justify-between">
                    <div className="min-w-0">
                      <span
                        className={`text-sm ${
                          isFirst || isLast
                            ? "font-medium text-gray-900"
                            : "text-gray-700"
                        }`}
                      >
                        {stop.name}
                      </span>
                      <span className="text-xs text-gray-400 ml-2">
                        {stop.road}
                      </span>
                    </div>

                    <div className="flex-shrink-0 ml-4">
                      {data?.loading ? (
                        <span className="text-xs text-gray-300">—</span>
                      ) : first ? (
                        <div className="flex items-center gap-1.5">
                          <span
                            className="w-1.5 h-1.5 rounded-full"
                            style={{ backgroundColor: loadDot(first.load) }}
                          />
                          <span className="text-sm tabular-nums text-gray-900 font-medium">
                            {first.eta}
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-300">—</span>
                      )}
                    </div>
                  </div>

                  {/* Expanded: show all arrivals */}
                  {isExpanded && data && !data.loading && (
                    <div className="mt-2 mb-1 flex gap-4">
                      {data.arrivals.length > 0 ? (
                        data.arrivals.map((a, j) => (
                          <div key={j} className="flex items-center gap-1.5">
                            <span
                              className="w-1.5 h-1.5 rounded-full"
                              style={{ backgroundColor: loadDot(a.load) }}
                            />
                            <span className="text-xs tabular-nums text-gray-500">
                              {a.eta}
                            </span>
                          </div>
                        ))
                      ) : (
                        <span className="text-xs text-gray-400">
                          Not operating
                        </span>
                      )}
                      <span className="text-xs text-gray-300 ml-auto">
                        {stop.code}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer */}
      <div className="mt-8 flex items-center justify-between text-xs text-gray-400">
        <span>
          {lastRefresh ? lastRefresh.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—"}
        </span>
        <button
          onClick={refresh}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          Refresh
        </button>
      </div>
    </main>
  );
}
