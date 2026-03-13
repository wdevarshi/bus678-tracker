"use client";

import { useState } from "react";
import type { TrackedBus, BusStopsData, BusRoutesData, ArrivalInfo, StopArrivalData } from "../../types";

interface Props {
  bus: TrackedBus;
  busIndex: number;
  stopsData: BusStopsData;
  routesData: BusRoutesData;
  arrivals: Map<string, StopArrivalData>;
  onEdit: (index: number) => void;
  onRemove: (index: number) => void;
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

export default function BusCard({ bus, busIndex, stopsData, routesData, arrivals, onEdit, onRemove }: Props) {
  const [aboutOpen, setAboutOpen] = useState(false);
  const [showActions, setShowActions] = useState(false);

  const route = routesData[bus.service];
  const dirStops = route?.directions[bus.direction] || [];

  // Direction labels
  function dirLabel(dir: number): string {
    const ds = route?.directions[dir];
    if (!ds || ds.length === 0) return "";
    const first = stopsData[ds[0].stopCode]?.name || ds[0].stopCode;
    const last = stopsData[ds[ds.length - 1].stopCode]?.name || ds[ds.length - 1].stopCode;
    return `${first} → ${last}`;
  }

  return (
    <div className="mb-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-baseline gap-2">
          <h2 className="text-2xl font-semibold text-gray-900">{bus.service}</h2>
          <span className="text-xs text-gray-300">Dir {bus.direction}</span>
        </div>
        <div className="relative">
          <button
            onClick={() => setShowActions(!showActions)}
            className="text-gray-300 hover:text-gray-500 transition-colors p-1"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <circle cx="8" cy="3" r="1.5" fill="currentColor"/>
              <circle cx="8" cy="8" r="1.5" fill="currentColor"/>
              <circle cx="8" cy="13" r="1.5" fill="currentColor"/>
            </svg>
          </button>
          {showActions && (
            <div className="absolute right-0 top-8 bg-white border border-gray-200 rounded-lg shadow-sm py-1 z-10 min-w-[8rem]">
              <button
                onClick={() => { setShowActions(false); onEdit(busIndex); }}
                className="w-full text-left px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Edit stops
              </button>
              <button
                onClick={() => { setShowActions(false); onRemove(busIndex); }}
                className="w-full text-left px-3 py-2 text-sm text-red-500 hover:bg-gray-50 transition-colors"
              >
                Remove
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Tracked stops with arrivals */}
      <div className="space-y-6">
        {bus.stops.map((ts) => {
          const info = stopsData[ts.code];
          const data = arrivals.get(`${bus.service}:${ts.code}`);
          const isBoarding = ts.boarding;

          return (
            <div key={ts.code}>
              <div className="mb-1">
                <span className={`text-base font-medium text-gray-900`}>
                  {info?.name || ts.code}
                </span>
              </div>

              {/* Live arrivals */}
              {data?.loading && data.arrivals.length === 0 ? (
                <div className="text-sm text-gray-300">—</div>
              ) : data && data.arrivals.length > 0 ? (
                <div className="flex items-baseline gap-4">
                  {data.arrivals.map((a, j) => (
                    <div key={j} className="flex items-center gap-1.5">
                      <span
                        className={`w-2 h-2 rounded-full ${a.estimated ? "border border-current" : ""}`}
                        style={{
                          backgroundColor: a.estimated ? "transparent" : loadDot(a.load),
                          borderColor: a.estimated ? loadDot(a.load) : undefined,
                        }}
                      />
                      <span className={`tabular-nums ${
                        a.estimated
                          ? "text-sm text-gray-300 italic"
                          : isBoarding && j === 0
                          ? "text-2xl font-semibold text-gray-900"
                          : isBoarding
                          ? "text-sm text-gray-400"
                          : j === 0
                          ? "text-lg font-medium text-gray-700"
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

      {/* About this bus */}
      <details className="mt-6" open={aboutOpen} onToggle={(e) => setAboutOpen((e.target as HTMLDetailsElement).open)}>
        <summary className="text-xs text-gray-400 cursor-pointer hover:text-gray-500 transition-colors">
          About this bus
        </summary>
        <div className="mt-3 text-xs text-gray-400 leading-relaxed">
          <p className="mb-2">{dirLabel(bus.direction)}</p>
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="text-left text-gray-500">
                <th className="pb-1.5 font-medium pr-2">Stop</th>
                <th className="pb-1.5 font-medium text-right pr-2">First</th>
                <th className="pb-1.5 font-medium text-right">Last</th>
              </tr>
            </thead>
            <tbody className="text-gray-400">
              {dirStops.map((rs) => {
                const sInfo = stopsData[rs.stopCode];
                const isTracked = bus.stops.some((s) => s.code === rs.stopCode);
                return (
                  <tr key={rs.stopCode} className={`border-t border-gray-100 ${isTracked ? "text-gray-600" : ""}`}>
                    <td className="py-1 pr-2 truncate max-w-[10rem]">
                      {sInfo?.name || rs.stopCode}
                    </td>
                    <td className="py-1 text-right pr-2 tabular-nums">{formatTime(rs.firstBus)}</td>
                    <td className="py-1 text-right tabular-nums">{formatTime(rs.lastBus)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}
