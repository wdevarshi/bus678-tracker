"use client";

import { useState } from "react";
import type { TrackedBus, BusStopsData, BusRoutesData, ArrivalInfo, StopArrivalData } from "../../types";

interface Props {
  service: string;
  entries: TrackedBus[];
  stopsData: BusStopsData;
  routesData: BusRoutesData;
  arrivals: Map<string, StopArrivalData>;
  onRemove: (service: string) => void;
}

function loadDot(load: string): string {
  switch (load) {
    case "SEA": return "#22c55e";
    case "SDA": return "#eab308";
    case "LSD": return "#ef4444";
    default: return "#d1d5db";
  }
}

function formatTime(t: string): string {
  if (!t || t === "-") return "-";
  const h = parseInt(t.substring(0, 2), 10);
  const m = t.substring(2);
  return `${h}:${m}`;
}

/**
 * Determine a human-readable period label from direction stops' first/last bus times.
 */
function getPeriodLabel(routeStops: { firstBus: string }[]): string {
  if (!routeStops || routeStops.length === 0) return "";
  const first = routeStops[0]?.firstBus;
  if (!first || first.length < 4) return "";
  const hour = parseInt(first.substring(0, 2), 10);
  if (hour >= 5 && hour < 12) return "AM";
  if (hour >= 12 && hour < 17) return "PM";
  if (hour >= 17 && hour < 22) return "PM";
  return "";
}

function getTerminus(
  routeStops: { stopCode: string }[],
  stopsData: BusStopsData,
): string {
  if (!routeStops || routeStops.length === 0) return "";
  const last = routeStops[routeStops.length - 1];
  return stopsData[last.stopCode]?.name || last.stopCode;
}

export default function BusCard({ service, entries, stopsData, routesData, arrivals, onRemove }: Props) {
  const [showRoute, setShowRoute] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);

  const route = routesData[service];

  return (
    <div className="mb-10">
      {/* Service header */}
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-3xl font-light tracking-tight text-gray-900">{service}</h2>
        {confirmRemove ? (
          <div className="flex items-center gap-2">
            <button
              onClick={() => onRemove(service)}
              className="text-xs text-red-500 hover:text-red-600 transition-colors"
            >
              Remove
            </button>
            <button
              onClick={() => setConfirmRemove(false)}
              className="text-xs text-gray-400 hover:text-gray-500 transition-colors"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirmRemove(true)}
            className="text-gray-200 hover:text-gray-400 transition-colors p-1"
            aria-label="Remove bus"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
              <line x1="3" y1="3" x2="11" y2="11" />
              <line x1="11" y1="3" x2="3" y2="11" />
            </svg>
          </button>
        )}
      </div>

      {/* Direction sections */}
      {entries.map((entry) => {
        const dirStops = route?.directions[entry.direction] || [];
        const period = getPeriodLabel(dirStops);
        const towards = getTerminus(dirStops, stopsData);

        return (
          <div key={entry.direction} className="mb-6 last:mb-0">
            {/* Direction label — only show if multiple directions */}
            {entries.length > 1 && (
              <div className="flex items-center gap-2 mb-3">
                {period && (
                  <span className="text-[10px] font-semibold tracking-widest uppercase text-gray-400">
                    {period}
                  </span>
                )}
                <span className="text-[10px] text-gray-300">
                  → {towards}
                </span>
              </div>
            )}

            {/* Tracked stops */}
            <div className="space-y-4">
              {entry.stops.map((ts) => {
                const info = stopsData[ts.code];
                const data = arrivals.get(`${service}:${ts.code}`);
                const isBoarding = ts.boarding;

                return (
                  <div key={ts.code}>
                    <div className={`text-sm mb-1 ${isBoarding ? "font-medium text-gray-900" : "text-gray-500"}`}>
                      {info?.name || ts.code}
                    </div>

                    {data?.loading && data.arrivals.length === 0 ? (
                      <div className="text-sm text-gray-200">—</div>
                    ) : data && data.arrivals.length > 0 ? (
                      <div className="flex items-baseline gap-4">
                        {data.arrivals.map((a, j) => (
                          <div key={j} className="flex items-center gap-1.5">
                            <span
                              className="w-1.5 h-1.5 rounded-full"
                              style={{
                                backgroundColor: a.estimated ? "transparent" : loadDot(a.load),
                                border: a.estimated ? `1.5px solid ${loadDot(a.load)}` : "none",
                              }}
                            />
                            <span className={`tabular-nums ${
                              a.estimated
                                ? "text-sm text-gray-300"
                                : isBoarding && j === 0
                                ? "text-2xl font-light text-gray-900"
                                : isBoarding
                                ? "text-sm text-gray-400"
                                : j === 0
                                ? "text-base text-gray-600"
                                : "text-sm text-gray-400"
                            }`}>
                              {a.eta}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : data && !data.loading ? (
                      <div className="text-sm text-gray-300">No buses</div>
                    ) : null}
                  </div>
                );
              })}
            </div>

            {/* Thin separator between directions */}
            {entries.length > 1 && entry !== entries[entries.length - 1] && (
              <div className="border-t border-gray-100 mt-5" />
            )}
          </div>
        );
      })}

      {/* Expandable route details */}
      <button
        onClick={() => setShowRoute(!showRoute)}
        className="text-[11px] text-gray-300 hover:text-gray-400 transition-colors mt-2"
      >
        {showRoute ? "Hide route" : "Route details"}
      </button>

      {showRoute && entries.map((entry) => {
        const dirStops = route?.directions[entry.direction] || [];
        const period = getPeriodLabel(dirStops);

        return (
          <div key={`route-${entry.direction}`} className="mt-3">
            {entries.length > 1 && (
              <div className="text-[10px] font-semibold tracking-widest uppercase text-gray-400 mb-2">
                {period || `Dir ${entry.direction}`}
              </div>
            )}
            <table className="w-full text-[11px] border-collapse">
              <thead>
                <tr className="text-left text-gray-400">
                  <th className="pb-1 font-normal pr-2">Stop</th>
                  <th className="pb-1 font-normal text-right pr-2">First</th>
                  <th className="pb-1 font-normal text-right">Last</th>
                </tr>
              </thead>
              <tbody className="text-gray-300">
                {dirStops.map((rs) => {
                  const sInfo = stopsData[rs.stopCode];
                  const isTracked = entry.stops.some((s) => s.code === rs.stopCode);
                  return (
                    <tr key={rs.stopCode} className={isTracked ? "text-gray-500" : ""}>
                      <td className="py-0.5 pr-2 truncate max-w-[10rem]">
                        {sInfo?.name || rs.stopCode}
                      </td>
                      <td className="py-0.5 text-right pr-2 tabular-nums">{formatTime(rs.firstBus)}</td>
                      <td className="py-0.5 text-right tabular-nums">{formatTime(rs.lastBus)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        );
      })}
    </div>
  );
}
