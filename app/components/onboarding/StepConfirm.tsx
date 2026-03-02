"use client";

import type { BusStopsData, TrackedStop } from "../../types";

interface Props {
  service: string;
  direction: number;
  selectedStops: TrackedStop[];
  stops: BusStopsData;
  onConfirm: () => void;
  onBack: () => void;
}

export default function StepConfirm({ service, direction, selectedStops, stops, onConfirm, onBack }: Props) {
  return (
    <div>
      <button onClick={onBack} className="text-sm text-gray-400 hover:text-gray-600 transition-colors mb-4">
        ← Back
      </button>

      <h2 className="text-lg font-semibold text-gray-900 mb-1">Confirm setup</h2>
      <p className="text-sm text-gray-400 mb-6">Here's what you'll be tracking</p>

      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <div className="flex items-baseline gap-3 mb-3">
          <span className="text-2xl font-semibold text-gray-900">{service}</span>
          <span className="text-xs text-gray-400">Direction {direction}</span>
        </div>

        <div className="space-y-2">
          {selectedStops.map((ts) => {
            const info = stops[ts.code];
            return (
              <div key={ts.code} className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${
                  ts.boarding ? "bg-gray-900" : "bg-gray-300"
                }`} />
                <span className={`text-sm ${
                  ts.boarding ? "font-medium text-gray-900" : "text-gray-600"
                }`}>
                  {info?.name || ts.code}
                </span>
                {ts.boarding && (
                  <span className="text-[10px] font-medium text-gray-400 bg-gray-200 px-1.5 py-0.5 rounded">
                    BOARDING
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
        Start tracking
      </button>
    </div>
  );
}
