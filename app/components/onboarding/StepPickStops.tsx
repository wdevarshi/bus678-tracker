"use client";

import { useState } from "react";
import type { BusRoutesData, BusStopsData, TrackedStop } from "../../types";

interface Props {
  service: string;
  routes: BusRoutesData;
  stops: BusStopsData;
  onConfirm: (direction: number, selectedStops: TrackedStop[]) => void;
  onBack: () => void;
}

function formatTime(t: string): string {
  if (!t || t === "-") return "-";
  const h = parseInt(t.substring(0, 2), 10);
  const m = t.substring(2);
  return `${h}:${m}`;
}

export default function StepPickStops({ service, routes, stops, onConfirm, onBack }: Props) {
  const route = routes[service];
  const directions = Object.keys(route.directions).map(Number).sort();
  const [direction, setDirection] = useState(directions[0] || 1);
  const [selected, setSelected] = useState<Map<string, boolean>>(new Map());

  const routeStops = route.directions[direction] || [];

  function directionLabel(dir: number): string {
    const dirStops = route.directions[dir];
    if (!dirStops || dirStops.length === 0) return `Direction ${dir}`;
    const last = stops[dirStops[dirStops.length - 1].stopCode]?.name || dirStops[dirStops.length - 1].stopCode;
    return `→ ${last}`;
  }

  function toggleStop(code: string) {
    setSelected((prev) => {
      const next = new Map(prev);
      if (next.has(code)) {
        next.delete(code);
      } else {
        next.set(code, false);
      }
      return next;
    });
  }

  function setBoarding(code: string) {
    setSelected((prev) => {
      const next = new Map(prev);
      for (const [k] of next) next.set(k, false);
      if (!next.has(code)) next.set(code, true);
      else next.set(code, true);
      return next;
    });
  }

  function handleDirectionChange(dir: number) {
    setDirection(dir);
    setSelected(new Map());
  }

  function handleConfirm() {
    const result: TrackedStop[] = [];
    for (const rs of routeStops) {
      if (selected.has(rs.stopCode)) {
        result.push({
          code: rs.stopCode,
          boarding: selected.get(rs.stopCode) || false,
        });
      }
    }
    onConfirm(direction, result);
  }

  const hasSelection = selected.size > 0;
  const hasBoarding = Array.from(selected.values()).some((v) => v);

  return (
    <div>
      <button onClick={onBack} className="text-sm text-gray-400 hover:text-gray-600 transition-colors mb-4">
        ← Back
      </button>

      <h2 className="text-lg font-medium text-gray-900 mb-1">Bus {service}</h2>
      <p className="text-sm text-gray-400 mb-4">
        Tap to track · Long press for boarding stop
      </p>

      {/* Direction toggle */}
      {directions.length > 1 && (
        <div className="flex gap-1.5 mb-5">
          {directions.map((dir) => (
            <button
              key={dir}
              onClick={() => handleDirectionChange(dir)}
              className={`flex-1 text-left px-3 py-2 rounded-lg text-[11px] transition-colors ${
                direction === dir
                  ? "bg-gray-900 text-white"
                  : "bg-gray-50 text-gray-400 hover:bg-gray-100"
              }`}
            >
              {directionLabel(dir)}
            </button>
          ))}
        </div>
      )}

      {/* Stop list */}
      <div className="max-h-72 overflow-y-auto -mx-1 mb-4">
        {routeStops.map((rs, i) => {
          const info = stops[rs.stopCode];
          const isSelected = selected.has(rs.stopCode);
          const isBoarding = selected.get(rs.stopCode) === true;

          return (
            <button
              key={rs.stopCode}
              onClick={() => toggleStop(rs.stopCode)}
              onContextMenu={(e) => {
                e.preventDefault();
                setBoarding(rs.stopCode);
              }}
              className={`w-full text-left px-3 py-2 rounded-lg transition-colors flex items-center gap-3 ${
                isBoarding
                  ? "bg-gray-900 text-white"
                  : isSelected
                  ? "bg-gray-100 text-gray-900"
                  : "hover:bg-gray-50 text-gray-500"
              }`}
            >
              <div className="flex flex-col items-center min-w-[1rem]">
                <div className={`w-1.5 h-1.5 rounded-full ${
                  isBoarding ? "bg-white" : isSelected ? "bg-gray-900" : "bg-gray-300"
                }`} />
                {i < routeStops.length - 1 && (
                  <div className={`w-px h-3 mt-0.5 ${
                    isBoarding ? "bg-white/20" : "bg-gray-200"
                  }`} />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <span className={`text-sm truncate block ${
                  isBoarding ? "text-white font-medium" : isSelected ? "text-gray-900" : "text-gray-600"
                }`}>
                  {info?.name || rs.stopCode}
                </span>
                <span className={`text-[10px] ${
                  isBoarding ? "text-white/50" : "text-gray-300"
                }`}>
                  {rs.stopCode}
                  {rs.firstBus && rs.firstBus !== "-" && (
                    <span className="ml-1.5">{formatTime(rs.firstBus)}–{formatTime(rs.lastBus)}</span>
                  )}
                </span>
              </div>

              {isBoarding && (
                <span className="text-[9px] tracking-wide uppercase text-white/60">
                  boarding
                </span>
              )}
            </button>
          );
        })}
      </div>

      {hasSelection && !hasBoarding && (
        <p className="text-[11px] text-gray-300 mb-3">
          Long-press a stop to mark your boarding stop
        </p>
      )}

      <button
        onClick={handleConfirm}
        disabled={!hasSelection}
        className={`w-full py-2.5 rounded-lg text-sm font-medium transition-colors ${
          hasSelection
            ? "bg-gray-900 text-white hover:bg-gray-800"
            : "bg-gray-100 text-gray-300 cursor-not-allowed"
        }`}
      >
        {hasSelection ? `Continue with ${selected.size} stop${selected.size > 1 ? "s" : ""}` : "Select stops"}
      </button>
    </div>
  );
}
