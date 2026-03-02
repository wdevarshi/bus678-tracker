"use client";

import { useState, useEffect } from "react";
import type { BusTrackerConfig, BusRoutesData, BusStopsData } from "./types";
import { getConfig, saveConfig, migrateExisting678, markVisited } from "./lib/storage";
import { loadRoutes, loadStops } from "./lib/data-loader";
import Onboarding from "./components/onboarding/Onboarding";
import TrackerView from "./components/tracker/TrackerView";

type View = "loading" | "onboarding" | "tracker";

export default function Home() {
  const [view, setView] = useState<View>("loading");
  const [config, setConfig] = useState<BusTrackerConfig | null>(null);
  const [routes, setRoutes] = useState<BusRoutesData | null>(null);
  const [stops, setStops] = useState<BusStopsData | null>(null);

  // Load static data and determine initial view
  useEffect(() => {
    async function init() {
      const [r, s] = await Promise.all([loadRoutes(), loadStops()]);
      setRoutes(r);
      setStops(s);

      // Try migration for returning users
      migrateExisting678();
      markVisited();

      const cfg = getConfig();
      if (cfg) {
        setConfig(cfg);
        setView("tracker");
      } else {
        setView("onboarding");
      }
    }
    init();
  }, []);

  function handleOnboardingComplete() {
    const cfg = getConfig();
    setConfig(cfg);
    setView("tracker");
  }

  function handleAddBus() {
    setView("onboarding");
  }

  function handleEditBus(index: number) {
    // For editing, we remove the bus and go through onboarding again
    // The user can re-add with their preferences
    const cfg = getConfig();
    if (cfg) {
      cfg.buses.splice(index, 1);
      saveConfig(cfg);
    }
    setView("onboarding");
  }

  function handleConfigChange() {
    const cfg = getConfig();
    if (cfg && cfg.buses.length > 0) {
      setConfig(cfg);
      setView("tracker");
    } else {
      setView("onboarding");
    }
  }

  if (view === "loading" || !routes || !stops) {
    return (
      <main className="flex items-center justify-center min-h-screen bg-white px-6 font-[system-ui]">
        <div className="text-sm text-gray-300">Loading...</div>
      </main>
    );
  }

  if (view === "onboarding") {
    return (
      <Onboarding
        routes={routes}
        stops={stops}
        onComplete={handleOnboardingComplete}
      />
    );
  }

  if (view === "tracker" && config) {
    return (
      <TrackerView
        config={config}
        routes={routes}
        stops={stops}
        onAddBus={handleAddBus}
        onEditBus={handleEditBus}
        onConfigChange={handleConfigChange}
      />
    );
  }

  return null;
}
