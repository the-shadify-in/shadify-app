import type { WeddingDataDto } from "@/features/weddings";
import type { ThemeConfig } from "@/lib/themes/tokens";

export type GuestSectionId = "hero" | "events" | "vips" | "rsvp" | "shagun";

export interface GuestSectionProps {
  wedding: WeddingDataDto;
  theme: ThemeConfig;
  onOpenRsvp?: (event: WeddingDataDto["events"][number]) => void;
  onOpenShagun?: () => void;
}

export interface SectionRegistryItem {
  id: GuestSectionId;
  label: string;
  isEnabled: (theme: ThemeConfig) => boolean;
}

export const GUEST_SECTIONS_CONFIG: SectionRegistryItem[] = [
  {
    id: "hero",
    label: "Namaste & Welcome Hero",
    isEnabled: () => true,
  },
  {
    id: "events",
    label: "Ceremony Itinerary",
    isEnabled: () => true,
  },
  {
    id: "vips",
    label: "Meet the VIPs",
    isEnabled: (theme) => theme.sections.showVips,
  },
  {
    id: "rsvp",
    label: "Digital RSVP",
    isEnabled: () => true,
  },
  {
    id: "shagun",
    label: "Direct UPI Shagun Blessing",
    isEnabled: (theme) => theme.sections.showShagun,
  },
];
