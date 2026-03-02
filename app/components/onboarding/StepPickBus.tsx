"use client";

import { useState, useMemo } from "react";
import type { BusRoutesData, BusStopsData } from "../../types";

interface Props {
  routes: BusRoutesData;
  stops: BusStopsData;
  onSelect: (service: string) => void;
}

export default function StepPickBus({ routes, stops, onSelect }: Props) {
  const [query, setQuery] = useState("");

  const serviceList = useMemo(() => {
    const list = Object.keys(routes).sort((a, b) => {
      const an = parseInt(a, 10);
      const bn = parseInt(b, 10);
      if (!isNaN(an) && !isNaN(bn)) return an - bn;
      return a.localeCompare(b);
    });
    return list;
  }, [routes]);

  const filtered = useMemo(() => {
    if (!query) return serviceList;
    const q = query.toLowerCase();
    return serviceList.filter((s) => s.toLowerCase().includes(q));
  }, [serviceList, query]);

  function getRouteInfo(service: string): string {
    const route = routes[service];
    if (!route) return "";
    const dir1 = route.directions[1];
    if (!dir1 || dir1.length === 0) return "";
    const first = dir1[0];
    const last = dir1[dir1.length - 1];
    const fromName = stops[first.stopCode]?.name || first.stopCode;
    const toName = stops[last.stopCode]?.name || last.stopCode;
    return `${fromName} → ${toName}`;
  }

  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-900 mb-1">Pick your bus</h2>
      <p className="text-sm text-gray-400 mb-6">Search by service number</p>

      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="e.g. 678, 14, NR1"
        autoFocus
        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder-gray-300 focus:outline-none focus:border-gray-400 transition-colors mb-4"
      />

      <div className="max-h-80 overflow-y-auto -mx-1">
        {filtered.length === 0 && (
          <p className="text-sm text-gray-300 px-1">No matches</p>
        )}
        {filtered.slice(0, 50).map((svc) => (
          <button
            key={svc}
            onClick={() => onSelect(svc)}
            className="w-full text-left px-3 py-3 rounded-lg hover:bg-gray-50 transition-colors flex items-baseline gap-3"
          >
            <span className="text-base font-semibold text-gray-900 min-w-[3rem]">{svc}</span>
            <span className="text-xs text-gray-400 truncate">{getRouteInfo(svc)}</span>
          </button>
        ))}
        {filtered.length > 50 && (
          <p className="text-xs text-gray-300 px-3 py-2">
            {filtered.length - 50} more — keep typing to narrow down
          </p>
        )}
      </div>
    </div>
  );
}
