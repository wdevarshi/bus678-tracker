// Shared types for the bus tracker

export interface RouteStop {
  stopCode: string;
  sequence: number;
  firstBus: string;
  lastBus: string;
  distance: number;
}

export interface RouteEntry {
  directions: Record<number, RouteStop[]>;
}

export interface BusStopInfo {
  name: string;
  road: string;
  lat: number;
  lng: number;
}

export type BusRoutesData = Record<string, RouteEntry>;
export type BusStopsData = Record<string, BusStopInfo>;

// localStorage schema
export interface TrackedStop {
  code: string;
  boarding: boolean;
}

export interface TrackedBus {
  service: string;
  direction: number;
  stops: TrackedStop[];
}

export interface BusTrackerConfig {
  buses: TrackedBus[];
}

// Arrival data from API
export interface ArrivalInfo {
  eta: string;
  minutes: number;
  load: string;
  estimated?: boolean; // true if calculated from origin stop data
}

export interface StopArrivalData {
  arrivals: ArrivalInfo[];
  loading: boolean;
}
