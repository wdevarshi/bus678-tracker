export interface BusStop {
  code: string;
  name: string;
  road: string;
}

// AM direction: Punggol Central → Temasek Boulevard
export const AM_STOPS: BusStop[] = [
  { code: "65269", name: "Blk 162B", road: "Punggol Ctrl" },
  { code: "65279", name: "Bet Blks 187/188", road: "Punggol Ctrl" },
  { code: "65381", name: "Punggol Sec Sch", road: "Edgefield Plains" },
  { code: "65391", name: "Blk 672A", road: "Edgefield Plains" },
  { code: "65581", name: "Opp Blk 683A", road: "Punggol North Ave" },
  { code: "65591", name: "Opp Blk 662A", road: "Punggol North Ave" },
  { code: "65569", name: "Blk 656A", road: "Punggol East" },
  { code: "65799", name: "Blk 654D", road: "Punggol East" },
  { code: "65189", name: "Bef Punggol Ctrl", road: "Punggol East" },
  { code: "65239", name: "Riviera Stn Exit A", road: "Punggol East" },
  { code: "65529", name: "Aft Punggol Field", road: "Punggol East" },
  { code: "67529", name: "Opp Blk 157A", road: "Sengkang East Dr" },
  { code: "03222", name: "Hub Synergy Pt", road: "Anson Rd" },
  { code: "03223", name: "Tanjong Pagar Stn", road: "Anson Rd" },
  { code: "03151", name: "Aft Telok Ayer St", road: "Cecil St" },
  { code: "03381", name: "The Sail", road: "Marina Blvd" },
  { code: "03391", name: "Marina Bay Financial Ctr", road: "Marina Blvd" },
  { code: "03511", name: "Aft Bayfront Stn", road: "Bayfront Ave" },
  { code: "03501", name: "Marina Bay Sands Theatre", road: "Bayfront Ave" },
  { code: "02169", name: "Promenade Stn Exit B", road: "Temasek Ave" },
  { code: "02141", name: "Suntec Twr Two", road: "Temasek Blvd" },
];

// PM direction: Temasek Boulevard → Punggol Central
export const PM_STOPS: BusStop[] = [
  { code: "02149", name: "Suntec Twr Three", road: "Temasek Blvd" },
  { code: "02161", name: "Aft Promenade Stn", road: "Temasek Ave" },
  { code: "02171", name: "Opp The Ritz-Carlton", road: "Temasek Ave" },
  { code: "03509", name: "Bayfront Stn Exit B/MBS", road: "Bayfront Ave" },
  { code: "03519", name: "Bayfront Stn Exit A", road: "Bayfront Ave" },
  { code: "03539", name: "Marina Bay Stn", road: "Central Blvd" },
  { code: "03529", name: "Downtown Stn Exit E", road: "Central Blvd" },
  { code: "03129", name: "UIC Bldg", road: "Shenton Way" },
  { code: "03217", name: "Aft Straits Blvd", road: "Shenton Way" },
  { code: "67521", name: "Blk 160", road: "Sengkang East Dr" },
  { code: "65521", name: "Waterwoods", road: "Punggol East" },
  { code: "65231", name: "Riviera Stn Exit B", road: "Punggol East" },
  { code: "65181", name: "Aft Punggol Ctrl", road: "Punggol East" },
  { code: "65561", name: "Blk 659A", road: "Punggol East" },
  { code: "65599", name: "Blk 662A", road: "Punggol North Ave" },
  { code: "65589", name: "Blk 683A", road: "Punggol North Ave" },
  { code: "65399", name: "Blk 670A", road: "Edgefield Plains" },
  { code: "65389", name: "Opp Punggol Sec Sch", road: "Edgefield Plains" },
  { code: "65271", name: "Opp Blk 188", road: "Punggol Ctrl" },
  { code: "65261", name: "Blk 649", road: "Punggol Ctrl" },
];
