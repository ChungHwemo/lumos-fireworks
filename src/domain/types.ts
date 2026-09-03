export type RainPolicy = "hold" | "cancel" | "postpone" | "unknown";
export type Confirmation = "confirmed" | "unconfirmed";

export type Coord = {
  lng: number;
  lat: number;
};

export type Festival = {
  id: string;
  seriesId: string;
  date: string;
  prefecture: string;
  city: string;
  confirmation: Confirmation;
  paidSeats: boolean;
  rainPolicy: RainPolicy;
  launch: Coord | null;
};

export type FestivalQuery = {
  from: string;
  confirmation: Confirmation;
  rainPolicy?: RainPolicy;
  paidSeats?: boolean;
};

export type ControlKind =
  | "launch_perimeter"
  | "vehicle"
  | "pedestrian"
  | "station"
  | "paid_gate";

export type ControlZone = {
  id: string;
  festivalId: string;
  kind: ControlKind;
  radiusMeters: number | null;
  center: Coord | null;
  spotIds: string[] | "*";
};

export type SpotAccess = {
  crowFlyMeters: number | null;
  walkMeters: number | null;
  insidePerimeter: boolean;
  vehicleRestricted: boolean;
  pedestrianBlocked: boolean;
  ticketRequired: boolean;
  stationControlled: boolean;
  reachable: boolean;
  controlIds: string[];
};

export type SortableSpot = {
  id: string;
  distanceMeters: number | null;
  reachable: boolean;
};

export type FestivalRecord = Festival & {
  nameKo: string;
  nameJa: string;
  startTime: string;
  endTime: string;
  timeZone: "Asia/Tokyo";
  venueKo: string;
  venueJa: string;
  rainNoteKo: string;
  officialUrl: string;
  shellsApprox: number | null;
  nearestStationKo: string;
  disclaimerKo: string;
};

export type SpotRecord = Coord & {
  id: string;
  festivalId: string;
  nameKo: string;
  nameJa: string;
  aliases: string[];
  descriptionKo: string;
  viewingKo: string;
  restroomKo: string;
  foodKo: string;
  transitKo: string;
  crowdKo: string;
  distanceMeters: number | null;
  walkMeters: number | null;
  isViewpoint: true;
  paid: boolean;
  accessNoticeKo: string;
  visibilityNoteKo?: string;
  updatedAt: string;
};

export type ControlRecord = ControlZone & {
  titleKo: string;
  scheduleKo: string;
  detailKo: string;
  officialUrl: string | null;
};

export type PaidSeat = {
  festivalId: string;
  zoneKo: string;
  priceJpy: number | null;
  noteKo: string;
  ticketUrl: string | null;
};

export type ResearchLink = {
  id: string;
  url: string;
  kind: string;
  fallbackTitle: string;
  note: string;
  spotIds: string[] | "*";
};
