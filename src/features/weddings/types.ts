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
  venueCity: string;
  monogram: string;
  upiVpa: string;
  showBranding: boolean;
  events: WeddingEventDto[];
  vips: VipEntryDto[];
}
