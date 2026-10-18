export interface WeddingEventDto {
  id: string;
  title: string;
  tag: string;
  time: string;
  date: string;
  venue: string;
  address: string;
  mapUrl: string;
  dressCode: string;
  startTimeIso?: string;
  endTimeIso?: string;
}

export interface VipEntryDto {
  group: string;
  name: string;
  tagline: string;
}

export interface WeddingDataDto {
  slug: string;
  bride: string;
  groom: string;
  date: string;
  weddingDateIso?: string;
  hostingUntil?: string | null;
  venueCity: string;
  monogram: string;
  upiVpa: string;
  showBranding: boolean;
  events: WeddingEventDto[];
  vips: VipEntryDto[];
}
