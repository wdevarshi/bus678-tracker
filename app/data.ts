export interface BusStop {
  code: string;
  name: string;
  road: string;
  highlight?: boolean;
  scheduled?: [string, string]; // [trip1, trip2] times
}

// AM: Key stops on the route to CBD
export const AM_STOPS: BusStop[] = [
  { code: "65279", name: "Bet Blks 187/188", road: "Punggol Ctrl", highlight: true, scheduled: ["7:28", "7:43"] },
  { code: "65239", name: "Riviera Stn Exit A", road: "Punggol East", scheduled: ["7:45", "8:00"] },
];

// PM: Board near Capital Tower/International Plaza → Punggol
export const PM_STOPS: BusStop[] = [
  { code: "03217", name: "Aft Straits Blvd", road: "Shenton Way", highlight: true, scheduled: ["6:27", "6:42"] },
];
