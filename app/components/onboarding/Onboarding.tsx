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

const STEPS: Step[] = ["pick-bus", "pick-stops", "confirm"];

export default function Onboarding({ routes, stops, onComplete }: Props) {
  const [step, setStep] = useState<Step>("pick-bus");
  const [selectedService, setSelectedService] = useState("");
  const [selectedDirection, setSelectedDirection] = useState(1);
  const [selectedStops, setSelectedStops] = useState<TrackedStop[]>([]);

  function handlePickBus(service: string) {
    setSelectedService(service);
    setStep("pick-stops");
  }

  function handlePickStops(direction: number, pickedStops: TrackedStop[]) {
    setSelectedDirection(direction);
    setSelectedStops(pickedStops);
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

  const currentIndex = STEPS.indexOf(step);

  return (
    <main className="flex items-center justify-center min-h-screen bg-white px-6 font-[system-ui]">
      <div className="w-full max-w-xs py-10">
        {/* Step indicator */}
        <div className="flex gap-1 mb-8">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`h-px flex-1 transition-colors ${
                i <= currentIndex ? "bg-gray-900" : "bg-gray-200"
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
