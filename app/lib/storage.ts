import type { BusTrackerConfig, TrackedBus } from "../types";

const STORAGE_KEY = "busTracker";

// Default 678 config matching the original app's AM/PM stops
const DEFAULT_678_CONFIG: TrackedBus[] = [
  {
    service: "678",
    direction: 1,
    stops: [
      { code: "65279", boarding: true },
      { code: "65239", boarding: false },
    ],
  },
  {
    service: "678",
    direction: 2,
    stops: [
      { code: "03217", boarding: true },
    ],
  },
];

export function getConfig(): BusTrackerConfig | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as BusTrackerConfig;
    if (parsed.buses && parsed.buses.length > 0) return parsed;
    return null;
  } catch {
    return null;
  }
}

export function saveConfig(config: BusTrackerConfig): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
}

export function addBus(bus: TrackedBus): void {
  const config = getConfig() || { buses: [] };
  config.buses.push(bus);
  saveConfig(config);
}

export function removeBus(index: number): void {
  const config = getConfig();
  if (!config) return;
  config.buses.splice(index, 1);
  saveConfig(config);
}

export function updateBus(index: number, bus: TrackedBus): void {
  const config = getConfig();
  if (!config) return;
  config.buses[index] = bus;
  saveConfig(config);
}

/**
 * Migrate returning users — if they have no config, set up the default 678 config.
 * Returns true if migration was performed (user should see tracker, not onboarding).
 */
export function migrateExisting678(): boolean {
  if (typeof window === "undefined") return false;
  // If they already have config, no migration needed
  if (getConfig()) return true;
  // Check if this looks like a returning user (they may have visited before)
  // We'll auto-create 678 config for first-time users too, matching original behavior
  // Actually, per spec: only migrate if "existing 678 config detected (or first load for returning users)"
  // Let's check for any sign of previous visit
  const visited = localStorage.getItem("bus678_visited");
  if (visited) {
    saveConfig({ buses: DEFAULT_678_CONFIG });
    return true;
  }
  return false;
}

export function markVisited(): void {
  if (typeof window === "undefined") return;
  localStorage.setItem("bus678_visited", "1");
}
