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

function loadLabel(load: string): { text: string; color: string; bg: string } {
  switch (load) {
    case "SEA": return { text: "Seats", color: "#16a34a", bg: "#f0fdf4" };
    case "SDA": return { text: "Standing", color: "#ca8a04", bg: "#fefce8" };
    case "LSD": return { text: "Full", color: "#dc2626", bg: "#fef2f2" };
    default: return { text: "", color: "#9ca3af", bg: "#f9fafb" };
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
    <main className="min-h-screen bg-gray-50 px-4 py-8 font-[system-ui]">
      <div className="w-full max-w-md mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-3xl font-bold tracking-tight text-gray-900">Bus 678</span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setDirection("am")}
                className={`text-sm font-medium px-4 py-1.5 rounded-full transition-colors ${
                  direction === "am"
                    ? "bg-gray-900 text-white"
                    : "bg-white text-gray-500 border border-gray-200 hover:bg-gray-100"
                }`}
              >
                AM
              </button>
              <button
                onClick={() => setDirection("pm")}
                className={`text-sm font-medium px-4 py-1.5 rounded-full transition-colors ${
                  direction === "pm"
                    ? "bg-gray-900 text-white"
                    : "bg-white text-gray-500 border border-gray-200 hover:bg-gray-100"
                }`}
              >
                PM
              </button>
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-1">{label} · Weekdays only</p>
        </div>

        {/* Stops */}
        <div className="space-y-3">
          {stops.map((stop) => {
            const data = stopData.get(stop.code);
            const isHighlight = stop.highlight;

            return (
              <div
                key={stop.code}
                className={`rounded-xl p-4 ${
                  isHighlight
                    ? "bg-white border-2 border-gray-900 shadow-sm"
                    : "bg-white border border-gray-200"
                }`}
              >
                {/* Stop header */}
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className={`text-base ${isHighlight ? "font-semibold text-gray-900" : "font-medium text-gray-800"}`}>
                      {stop.name}
                    </p>
                    <p className="text-sm text-gray-500">{stop.road} · {stop.code}</p>
                  </div>
                  {isHighlight && (
                    <span className="text-xs font-medium bg-gray-900 text-white px-2 py-0.5 rounded-full">
                      Your stop
                    </span>
                  )}
                </div>

                {/* Scheduled times */}
                {stop.scheduled && (
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Scheduled</span>
                    <div className="flex gap-2">
                      {stop.scheduled.map((time, i) => (
                        <span key={i} className="text-sm font-semibold text-gray-700 bg-gray-100 px-2.5 py-0.5 rounded-md">
                          {time}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Live arrivals */}
                {data?.loading && data.arrivals.length === 0 ? (
                  <p className="text-sm text-gray-400">Checking...</p>
                ) : data && data.arrivals.length > 0 ? (
                  <div>
                    <p className="text-xs font-medium text-green-700 uppercase tracking-wide mb-2">Live</p>
                    <div className="flex gap-3">
                      {data.arrivals.map((a, j) => {
                        const { text, color, bg } = loadLabel(a.load);
                        return (
                          <div
                            key={j}
                            className="flex items-center gap-2 px-3 py-1.5 rounded-lg"
                            style={{ backgroundColor: bg }}
                          >
                            <span className="text-lg font-bold" style={{ color }}>
                              {a.eta}
                            </span>
                            {text && (
                              <span className="text-xs" style={{ color }}>
                                {text}
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : data && !data.loading ? (
                  <p className="text-sm text-gray-400">Not running right now</p>
                ) : null}
              </div>
            );
          })}
        </div>

        {/* Refresh bar */}
        <div className="mt-6 flex items-center justify-between">
          <span className="text-sm text-gray-500">
            {lastRefresh
              ? `Updated ${lastRefresh.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
              : "—"}
          </span>
          <button
            onClick={refresh}
            className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
          >
            ↻ Refresh
          </button>
        </div>

        {/* Info toggle */}
        <div className="mt-6 border-t border-gray-200 pt-4">
          <button
            onClick={() => setShowInfo(!showInfo)}
            className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
          >
            {showInfo ? "Hide details ↑" : "About this bus ↓"}
          </button>

          {showInfo && (
            <div className="mt-4 bg-white rounded-xl border border-gray-200 p-4 text-sm text-gray-600 space-y-4 leading-relaxed">
              <div>
                <p className="font-semibold text-gray-900 mb-1">Bus 678 — City Direct</p>
                <p>
                  Express service between Punggol and the CBD.
                  Weekday peak hours only — no service on weekends or public holidays.
                </p>
              </div>

              <div>
                <p className="font-semibold text-gray-900 mb-2">Schedule</p>
                <p className="mb-2">2 trips each way:</p>
                <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2">
                  <span className="font-medium text-gray-500">AM</span>
                  <div>
                    <p>Trip 1: <span className="font-semibold text-gray-900">7:28 River Isles</span> → <span className="font-semibold text-gray-900">7:45 Riviera</span></p>
                    <p>Trip 2: <span className="font-semibold text-gray-900">7:43 River Isles</span> → <span className="font-semibold text-gray-900">8:00 Riviera</span></p>
                  </div>
                  <span className="font-medium text-gray-500">PM</span>
                  <div>
                    <p>Trip 1: 6:00 Suntec → <span className="font-semibold text-gray-900">6:27 your stop</span> → 6:53 Punggol</p>
                    <p>Trip 2: 6:15 Suntec → <span className="font-semibold text-gray-900">6:42 your stop</span> → 7:08 Punggol</p>
                  </div>
                </div>
              </div>

              <div>
                <p className="font-semibold text-gray-900 mb-2">Load indicator</p>
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-green-500" />
                    <span>Seats available</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-yellow-500" />
                    <span>Standing room</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-red-500" />
                    <span>Full</span>
                  </div>
                </div>
              </div>

              <p className="text-gray-400 text-xs pt-1">
                Data from LTA DataMall · 30s auto-refresh
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
