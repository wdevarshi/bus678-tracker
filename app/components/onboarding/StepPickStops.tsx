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

export default function StepPickStops({ service, routes, stops, onConfirm, onBack }: Props) {
  const route = routes[service];
  const directions = Object.keys(route.directions).map(Number).sort();
  const [direction, setDirection] = useState(directions[0] || 1);
  const [selected, setSelected] = useState<Map<string, boolean>>(new Map()); // code -> isBoarding

  const routeStops = route.directions[direction] || [];

  function directionLabel(dir: number): string {
    const dirStops = route.directions[dir];
    if (!dirStops || dirStops.length === 0) return `Dir ${dir}`;
    const first = stops[dirStops[0].stopCode]?.name || dirStops[0].stopCode;
    const last = stops[dirStops[dirStops.length - 1].stopCode]?.name || dirStops[dirStops.length - 1].stopCode;
    return `${first} → ${last}`;
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
      // Clear all boarding
      for (const [k] of next) {
        next.set(k, false);
      }
      // If not selected, add it
      if (!next.has(code)) {
        next.set(code, true);
      } else {
        next.set(code, true);
      }
      return next;
    });
  }

  function handleDirectionChange(dir: number) {
    setDirection(dir);
    setSelected(new Map());
  }

  function handleConfirm() {
    const result: TrackedStop[] = [];
    // Maintain route order
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

  function formatTime(t: string): string {
    if (!t || t === "-") return "-";
    // Format "0725" to "7:25"
    const h = parseInt(t.substring(0, 2), 10);
    const m = t.substring(2);
    return `${h}:${m}`;
  }

  return (
    <div>
      <button onClick={onBack} className="text-sm text-gray-400 hover:text-gray-600 transition-colors mb-4">
        ← Back
      </button>

      <h2 className="text-lg font-semibold text-gray-900 mb-1">Bus {service}</h2>
      <p className="text-sm text-gray-400 mb-4">
        Tap stops to track · Long press to set boarding stop
      </p>

      {/* Direction toggle */}
      {directions.length > 1 && (
        <div className="mb-4 space-y-1">
          {directions.map((dir) => (
            <button
              key={dir}
              onClick={() => handleDirectionChange(dir)}
              className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-colors ${
                direction === dir
                  ? "bg-gray-900 text-white"
                  : "bg-gray-50 text-gray-400 hover:bg-gray-100"
              }`}
            >
              <span className="font-medium">Dir {dir}</span>
              <span className="ml-2">{directionLabel(dir)}</span>
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
              className={`w-full text-left px-3 py-2.5 rounded-lg transition-colors flex items-center gap-3 ${
                isBoarding
                  ? "bg-gray-900 text-white"
                  : isSelected
                  ? "bg-gray-100 text-gray-900"
                  : "hover:bg-gray-50 text-gray-600"
              }`}
            >
              {/* Sequence dot */}
              <div className="flex flex-col items-center min-w-[1.5rem]">
                <div className={`w-2 h-2 rounded-full ${
                  isBoarding ? "bg-white" : isSelected ? "bg-gray-900" : "bg-gray-300"
                }`} />
                {i < routeStops.length - 1 && (
                  <div className={`w-px h-3 mt-0.5 ${
                    isBoarding ? "bg-white/30" : "bg-gray-200"
                  }`} />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2">
                  <span className={`text-sm font-medium truncate ${
                    isBoarding ? "text-white" : isSelected ? "text-gray-900" : "text-gray-700"
                  }`}>
                    {info?.name || rs.stopCode}
                  </span>
                  {isBoarding && (
                    <span className="text-[10px] font-medium bg-white/20 px-1.5 py-0.5 rounded">
                      BOARDING
                    </span>
                  )}
                </div>
                <div className={`text-xs ${
                  isBoarding ? "text-white/60" : "text-gray-400"
                }`}>
                  {info?.road || ""} · {rs.stopCode}
                  {rs.firstBus && rs.firstBus !== "-" && (
                    <span className="ml-2">{formatTime(rs.firstBus)}–{formatTime(rs.lastBus)}</span>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Tip for mobile: tap = select, tap selected boarding icon = mark boarding */}
      {hasSelection && !hasBoarding && (
        <p className="text-xs text-gray-400 mb-3">
          Tip: long-press (or right-click) a selected stop to mark it as your boarding stop
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
        {hasSelection ? `Continue with ${selected.size} stop${selected.size > 1 ? "s" : ""}` : "Select stops to track"}
      </button>
    </div>
  );
}
