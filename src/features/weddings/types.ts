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
  coverImage?: string;
}

export interface VipEntryDto {
  group: string;
  name: string;
  tagline: string;
}

export interface LoveStoryMilestoneDto {
  year: string;
  title: string;
  description: string;
}

export interface LoveStoryDto {
  headline: string;
  tagline: string;
  storyP1: string;
  storyP2: string;
  togetherSinceYear: string;
  coupleImage: string;
  milestones: LoveStoryMilestoneDto[];
}

export interface GalleryPhotoDto {
  url: string;
  caption: string;
  aspect?: "tall" | "wide" | "square";
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
  invocation?: string;
  isDemo?: boolean;
  heroImage?: string;
  loveStory?: LoveStoryDto;
  gallery?: GalleryPhotoDto[];
  events: WeddingEventDto[];
  vips: VipEntryDto[];
  hasPrivatePin?: boolean;
  isLocked?: boolean;
}
