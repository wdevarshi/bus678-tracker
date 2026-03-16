"use client";

import type { BusStopsData, TrackedStop } from "../../types";
import { findDuplicate } from "../../lib/storage";

interface Props {
  service: string;
  direction: number;
  selectedStops: TrackedStop[];
  stops: BusStopsData;
  onConfirm: () => void;
  onBack: () => void;
}

export default function StepConfirm({ service, direction, selectedStops, stops, onConfirm, onBack }: Props) {
  const existing = findDuplicate(service, direction);

  return (
    <div>
      <button onClick={onBack} className="text-sm text-gray-400 hover:text-gray-600 transition-colors mb-4">
        ← Back
      </button>

      <h2 className="text-lg font-medium text-gray-900 mb-1">Confirm</h2>
      <p className="text-sm text-gray-400 mb-6">You'll be tracking</p>

      {existing && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 mb-4">
          <p className="text-sm text-amber-700">
            You're already tracking Bus {service} in this direction.
            Adding again will create a duplicate.
          </p>
        </div>
      )}

      <div className="rounded-lg p-4 bg-gray-50 mb-6">
        <div className="flex items-baseline gap-3 mb-3">
          <span className="text-2xl font-light text-gray-900">{service}</span>
        </div>

        <div className="space-y-2">
          {selectedStops.map((ts) => {
            const info = stops[ts.code];
            return (
              <div key={ts.code} className="flex items-center gap-2">
                <div className={`w-1.5 h-1.5 rounded-full ${
                  ts.boarding ? "bg-gray-900" : "bg-gray-300"
                }`} />
                <span className={`text-sm ${
                  ts.boarding ? "font-medium text-gray-900" : "text-gray-500"
                }`}>
                  {info?.name || ts.code}
                </span>
                {ts.boarding && (
                  <span className="text-[10px] tracking-wide uppercase text-gray-400">
                    boarding
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <button
        onClick={onConfirm}
        className="w-full py-2.5 rounded-lg text-sm font-medium bg-gray-900 text-white hover:bg-gray-800 transition-colors"
      >
        {existing ? "Add anyway" : "Start tracking"}
      </button>
    </div>
  );
}
