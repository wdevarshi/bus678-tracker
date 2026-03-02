"use client";

import { useState } from "react";
import type { BusRoutesData, BusStopsData, TrackedBus, TrackedStop } from "../../types";
import { addBus } from "../../lib/storage";
import StepPickBus from "./StepPickBus";
import StepPickStops from "./StepPickStops";
import StepConfirm from "./StepConfirm";

interface Props {
  routes: BusRoutesData;
  stops: BusStopsData;
  onComplete: () => void;
}

type Step = "pick-bus" | "pick-stops" | "confirm";

export default function Onboarding({ routes, stops, onComplete }: Props) {
  const [step, setStep] = useState<Step>("pick-bus");
  const [selectedService, setSelectedService] = useState("");
  const [selectedDirection, setSelectedDirection] = useState(1);
  const [selectedStops, setSelectedStops] = useState<TrackedStop[]>([]);

  function handlePickBus(service: string) {
    setSelectedService(service);
    setStep("pick-stops");
  }

  function handlePickStops(direction: number, stops: TrackedStop[]) {
    setSelectedDirection(direction);
    setSelectedStops(stops);
    setStep("confirm");
  }

  function handleConfirm() {
    const bus: TrackedBus = {
      service: selectedService,
      direction: selectedDirection,
      stops: selectedStops,
    };
    addBus(bus);
    onComplete();
  }

  return (
    <main className="flex items-center justify-center min-h-screen bg-white px-6 font-[system-ui]">
      <div className="w-full max-w-xs py-12">
        {/* Step indicator */}
        <div className="flex gap-1.5 mb-8">
          {["pick-bus", "pick-stops", "confirm"].map((s, i) => (
            <div
              key={s}
              className={`h-0.5 flex-1 rounded-full transition-colors ${
                i <= ["pick-bus", "pick-stops", "confirm"].indexOf(step)
                  ? "bg-gray-900"
                  : "bg-gray-200"
              }`}
            />
          ))}
        </div>

        {step === "pick-bus" && (
          <StepPickBus routes={routes} stops={stops} onSelect={handlePickBus} />
        )}
        {step === "pick-stops" && (
          <StepPickStops
            service={selectedService}
            routes={routes}
            stops={stops}
            onConfirm={handlePickStops}
            onBack={() => setStep("pick-bus")}
          />
        )}
        {step === "confirm" && (
          <StepConfirm
            service={selectedService}
            direction={selectedDirection}
            selectedStops={selectedStops}
            stops={stops}
            onConfirm={handleConfirm}
            onBack={() => setStep("pick-stops")}
          />
        )}
      </div>
    </main>
  );
}
