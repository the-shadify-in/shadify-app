import React from "react";
import { describe, it, expect, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { RsvpSection } from "@/components/guest/RsvpSection";
import { DigitalShagunModal } from "@/components/guest/DigitalShagunModal";
import { GallerySection } from "@/components/guest/GallerySection";
import { MusicToggle } from "@/components/guest/MusicToggle";
import { mapWeddingToDto } from "@/features/weddings/queries";
import { buildAskAnswers } from "@/features/ask/answers";

// Render Radix dialog portal inline for static markup evaluation
vi.mock("@radix-ui/react-dialog", async () => {
  const actual =
    await vi.importActual<typeof import("@radix-ui/react-dialog")>("@radix-ui/react-dialog");
  return {
    ...actual,
    Portal: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="dialog-portal">{children}</div>
    ),
  };
});

vi.mock("@/components/ui/turnstile", () => ({
  TurnstileWidget: () => <div data-testid="mock-turnstile" />,
}));

describe("Demo Readiness Polish Regression Suite", () => {
  describe("1. RSVP External Link vs Native Form Precedence", () => {
    it("renders external RSVP button and callout when a valid https externalRsvpUrl is configured", () => {
      const html = renderToStaticMarkup(
        <RsvpSection
          weddingSlug="test-wedding"
          onToast={() => {}}
          externalRsvpUrl="https://docs.google.com/forms/d/e/1FAIpQLSc-demo/viewform"
          coupleNames="Priya &amp; Rahul"
        />,
      );

      // External RSVP Callout Elements
      expect(html).toContain("Official RSVP Form");
      expect(html).toContain("Open Official RSVP Form");
      expect(html).toContain("https://docs.google.com/forms/d/e/1FAIpQLSc-demo/viewform");
      expect(html).toContain("docs.google.com");
      expect(html).toContain('target="_blank"');
      expect(html).toContain('rel="noopener noreferrer"');

      // Native Form inputs should NOT be rendered when external URL has precedence
      expect(html).not.toContain('name="guestName"');
      expect(html).not.toContain("Attendance Confirmation");
    });

    it("renders native RSVP form when externalRsvpUrl is not provided", () => {
      const html = renderToStaticMarkup(
        <RsvpSection weddingSlug="test-wedding" onToast={() => {}} />,
      );

      // Native form elements present
      expect(html).toContain("Will You");
      expect(html).toContain("Attendance Confirmation");
      expect(html).toContain("Joyfully Attending");
      expect(html).toContain("Regretfully Declining");
      expect(html).not.toContain("Open Official RSVP Form");
    });

    it("strictly rejects insecure http: external RSVP URL and falls back to native form", () => {
      const html = renderToStaticMarkup(
        <RsvpSection
          weddingSlug="test-wedding"
          onToast={() => {}}
          externalRsvpUrl="http://insecure-forms.example.com/rsvp"
        />,
      );

      // Insecure HTTP rejected; native form rendered
      expect(html).toContain("Attendance Confirmation");
      expect(html).not.toContain("Open Official RSVP Form");
      expect(html).not.toContain("insecure-forms.example.com");
    });

    it("displays prominent demo mode notice banner when isDemo is true on native form", () => {
      const html = renderToStaticMarkup(
        <RsvpSection weddingSlug="test-wedding" onToast={() => {}} isDemo={true} />,
      );

      expect(html).toContain("Demo Mode:");
      expect(html).toContain(
        "Responses are simulated for demonstration and never saved to the database.",
      );
    });

    it("safely falls back to native form if an unsafe scheme (e.g. javascript:) is supplied", () => {
      const html = renderToStaticMarkup(
        <RsvpSection
          weddingSlug="test-wedding"
          onToast={() => {}}
          externalRsvpUrl="javascript:alert('malicious')"
        />,
      );

      // Unsafe scheme rejected; native form rendered
      expect(html).toContain("Attendance Confirmation");
      expect(html).not.toContain("Open Official RSVP Form");
    });

    it("strictly rejects external URLs with embedded user credentials (user:pass@)", () => {
      const html = renderToStaticMarkup(
        <RsvpSection
          weddingSlug="test-wedding"
          onToast={() => {}}
          externalRsvpUrl="https://attacker:secret123@forms.example.com/rsvp"
        />,
      );

      expect(html).toContain("Attendance Confirmation");
      expect(html).not.toContain("Open Official RSVP Form");
      expect(html).not.toContain("attacker");
    });

    it("strictly rejects non-FQDN hostnames like localhost or intranet hosts", () => {
      const htmlLocalhost = renderToStaticMarkup(
        <RsvpSection
          weddingSlug="test-wedding"
          onToast={() => {}}
          externalRsvpUrl="https://localhost/rsvp"
        />,
      );
      expect(htmlLocalhost).toContain("Attendance Confirmation");
      expect(htmlLocalhost).not.toContain("Open Official RSVP Form");

      const htmlIntranet = renderToStaticMarkup(
        <RsvpSection
          weddingSlug="test-wedding"
          onToast={() => {}}
          externalRsvpUrl="https://internalrsvp/form"
        />,
      );
      expect(htmlIntranet).toContain("Attendance Confirmation");
      expect(htmlIntranet).not.toContain("Open Official RSVP Form");
    });
  });

  describe("2. Digital Shagun Demo Warning & Payment Protection", () => {
    it("renders prominent DEMO UPI — DO NOT PAY warning and disables payment button when isDemo is true", () => {
      const html = renderToStaticMarkup(
        <DigitalShagunModal
          open={true}
          onOpenChange={() => {}}
          bride="Priya"
          groom="Rahul"
          upiVpa="priyarahul@upi"
          isDemo={true}
        />,
      );

      // Demo Warning Banner
      expect(html).toContain("DEMO UPI — DO NOT PAY");
      expect(html).toContain(
        "This is a demonstration invitation. Real payment processing is disabled.",
      );

      // Payment CTA is disabled in demo mode
      expect(html).toContain("PAYMENTS DISABLED (DEMO MODE)");
      expect(html).toContain("disabled");

      // Dummy safe VPA is shown instead of real recipient
      expect(html).toContain("demo.only.do.not.pay@okhdfcbank");
      expect(html).not.toContain("priyarahul@upi");
    });

    it("renders active UPI payment button and original VPA when isDemo is false", () => {
      const html = renderToStaticMarkup(
        <DigitalShagunModal
          open={true}
          onOpenChange={() => {}}
          bride="Ananya"
          groom="Vikram"
          upiVpa="ananyavikram@okaxis"
          isDemo={false}
        />,
      );

      // Live payment elements
      expect(html).not.toContain("DEMO — DO NOT PAY");
      expect(html).toContain("SEND ₹2,101 VIA UPI APP");
      expect(html).toContain("upi://pay?pa=ananyavikram%40okaxis");
      expect(html).toContain("ananyavikram@okaxis");
    });
  });

  describe("3. Photo Gallery Static Demo Asset & Lightbox Rendering", () => {
    it("returns null when gallery is empty or undefined", () => {
      const emptyHtml = renderToStaticMarkup(<GallerySection gallery={[]} />);
      expect(emptyHtml).toBe("");
    });

    it("renders photo cards and captions when demo gallery items are provided", () => {
      const demoGallery = [
        {
          url: "/demo/couple.jpg",
          caption: "Our Journey by Lake Pichola",
          aspect: "tall" as const,
        },
        {
          url: "/demo/mandap.jpg",
          caption: "Sacred Vows & Auspicious Pheras",
          aspect: "wide" as const,
        },
      ];

      const html = renderToStaticMarkup(<GallerySection gallery={demoGallery} />);

      expect(html).toContain("Our Moments");
      expect(html).toContain("Our Journey by Lake Pichola");
      expect(html).toContain("Sacred Vows &amp; Auspicious Pheras");
      // next/image encodes the URL in src
      expect(html).toContain("demo%2Fcouple.jpg");
      expect(html).toContain("demo%2Fmandap.jpg");
    });
  });

  describe("4. Background Audio User-Controlled Playback (No Auto-Play)", () => {
    it("renders floating music control in muted state on initial load without autoplay", () => {
      const html = renderToStaticMarkup(
        <MusicToggle
          audio={{
            enabled: true,
            mode: "preset",
            title: "Shehnai & Sitar Raga",
            url: "/audio/shehnai.mp3",
          }}
          isEnvelopeOpened={false}
        />,
      );

      // Floating button exists and is in muted state
      expect(html).toContain("Play Shehnai &amp; Sitar Raga");
      expect(html).toContain("Shehnai &amp; Sitar Raga (Muted)");
      expect(html).toContain("lucide-volume-x");
      expect(html).not.toContain("lucide-volume-2");
    });
  });

  describe("5. mapWeddingToDto Feature Mapping & Gating", () => {
    it("populates static demo gallery and sets demo flags when themeConfig.isDemo is explicitly true", () => {
      const mockWeddingRecord = {
        slug: "demo-showcase",
        brideName: "Priya",
        groomName: "Rahul",
        weddingDate: new Date("2026-11-20"),
        themeConfig: {
          isDemo: true,
          invocation: "Shree Ganeshay Namah",
        },
        events: [],
        vips: [],
        showBranding: true,
        monogramText: "P & R",
        upiVpa: "priyarahul@upi",
        entitlement: null,
        contentExpiresAt: null,
      } as unknown as Parameters<typeof mapWeddingToDto>[0];

      const dto = mapWeddingToDto(mockWeddingRecord);

      expect(dto.isDemo).toBe(true);
      expect(dto.shagunEnabled).toBe(true);
      expect(dto.gallery).toBeDefined();
      expect(dto.gallery?.length).toBe(5);
      expect(dto.gallery![0]!.url).toBe("/demo/couple.jpg");
      expect(dto.gallery![1]!.url).toBe("/demo/mandap.jpg");
    });

    it("does NOT set demo flag based on slug alone when themeConfig.isDemo is missing", () => {
      const mockSlugOnlyWedding = {
        slug: "priya-rahul",
        brideName: "Priya",
        groomName: "Rahul",
        weddingDate: new Date("2026-11-20"),
        themeConfig: {},
        events: [],
        vips: [],
        showBranding: true,
        monogramText: "P & R",
        upiVpa: "priyarahul@upi",
        entitlement: null,
        contentExpiresAt: null,
      } as unknown as Parameters<typeof mapWeddingToDto>[0];

      const dto = mapWeddingToDto(mockSlugOnlyWedding);

      expect(dto.isDemo).toBe(false);
      expect(dto.gallery).toEqual([]);
    });

    it("preserves shagunEnabled as true for real weddings with configured upiVpa", () => {
      const mockRealWeddingWithUpi = {
        slug: "ananya-kabir",
        brideName: "Ananya",
        groomName: "Kabir",
        weddingDate: new Date("2026-12-15"),
        themeConfig: {}, // No explicit shagunEnabled flag
        events: [],
        vips: [],
        showBranding: true,
        monogramText: "A & K",
        upiVpa: "ananya@okaxis", // Configured payment details
        entitlement: null,
        contentExpiresAt: null,
      } as unknown as Parameters<typeof mapWeddingToDto>[0];

      const dto = mapWeddingToDto(mockRealWeddingWithUpi);

      expect(dto.isDemo).toBe(false);
      // Real wedding payment settings must NOT be silently disabled
      expect(dto.shagunEnabled).toBe(true);
      expect(dto.gallery).toEqual([]);
    });

    it("disables shagunEnabled when upiVpa is missing or rawConfig.shagunEnabled is explicitly false", () => {
      const mockWeddingNoUpi = {
        slug: "rohit-simran",
        brideName: "Simran",
        groomName: "Rohit",
        weddingDate: new Date("2026-12-15"),
        themeConfig: {},
        events: [],
        vips: [],
        showBranding: true,
        monogramText: "R & S",
        upiVpa: "", // Empty UPI
        entitlement: null,
        contentExpiresAt: null,
      } as unknown as Parameters<typeof mapWeddingToDto>[0];

      const dtoNoUpi = mapWeddingToDto(mockWeddingNoUpi);
      expect(dtoNoUpi.shagunEnabled).toBe(false);

      const mockWeddingExplicitOff = {
        slug: "rohit-simran",
        brideName: "Simran",
        groomName: "Rohit",
        weddingDate: new Date("2026-12-15"),
        themeConfig: { shagunEnabled: false },
        events: [],
        vips: [],
        showBranding: true,
        monogramText: "R & S",
        upiVpa: "rohit@upi",
        entitlement: null,
        contentExpiresAt: null,
      } as unknown as Parameters<typeof mapWeddingToDto>[0];

      const dtoExplicitOff = mapWeddingToDto(mockWeddingExplicitOff);
      expect(dtoExplicitOff.shagunEnabled).toBe(false);
    });

    it("rejects insecure http: externalRsvpUrl in mapWeddingToDto", () => {
      const mockInsecureExternal = {
        slug: "test-insecure",
        brideName: "Bride",
        groomName: "Groom",
        weddingDate: new Date("2027-01-10"),
        themeConfig: {
          externalRsvpUrl: "http://insecure-forms.com/rsvp",
        },
        events: [],
        vips: [],
        showBranding: true,
        upiVpa: "",
        entitlement: null,
        contentExpiresAt: null,
      } as unknown as Parameters<typeof mapWeddingToDto>[0];

      const dto = mapWeddingToDto(mockInsecureExternal);
      expect(dto.externalRsvpUrl).toBeUndefined();
    });

    it("sanitizes and parses valid externalRsvpUrl from themeConfig", () => {
      const mockWeddingWithExternalRsvp = {
        slug: "siddharth-meera",
        brideName: "Meera",
        groomName: "Siddharth",
        weddingDate: new Date("2027-01-10"),
        themeConfig: {
          externalRsvpUrl: "https://forms.gle/wedding123",
          shagunEnabled: true,
        },
        events: [],
        vips: [],
        showBranding: true,
        monogramText: "M & S",
        upiVpa: "meera@upi",
        entitlement: null,
        contentExpiresAt: null,
      } as unknown as Parameters<typeof mapWeddingToDto>[0];

      const dto = mapWeddingToDto(mockWeddingWithExternalRsvp);

      expect(dto.externalRsvpUrl).toBe("https://forms.gle/wedding123");
      expect(dto.shagunEnabled).toBe(true);
    });

    it("masks UPI address in buildAskAnswers when isDemo is true", () => {
      const mockDemoWedding = {
        slug: "priya-rahul",
        bride: "Priya",
        groom: "Rahul",
        date: "2026-11-20",
        weddingDate: new Date("2026-11-20"),
        themeConfig: {},
        events: [],
        vips: [],
        showBranding: true,
        monogramText: "P & R",
        upiVpa: "priyarahul@upi",
        isDemo: true,
        shagunEnabled: true,
        venueName: "Palace",
        venueCity: "Udaipur",
      } as unknown as Parameters<typeof buildAskAnswers>[0];

      const answers = buildAskAnswers(mockDemoWedding);

      expect(answers.hasGiftsUpi).toBe(true);
      expect(answers.upiVpa).toBe("demo.only.do.not.pay@okhdfcbank");
      expect(answers.upiVpa).not.toBe("priyarahul@upi");
    });

    it("hides gifts/shagun in buildAskAnswers when shagunEnabled is false", () => {
      const mockNoShagunWedding = {
        slug: "ananya-kabir",
        bride: "Ananya",
        groom: "Kabir",
        date: "2026-12-15",
        weddingDate: new Date("2026-12-15"),
        themeConfig: {},
        events: [],
        vips: [],
        showBranding: true,
        monogramText: "A & K",
        upiVpa: "ananya@upi",
        isDemo: false,
        shagunEnabled: false,
        venueName: "Resort",
        venueCity: "Jaipur",
      } as unknown as Parameters<typeof buildAskAnswers>[0];

      const answers = buildAskAnswers(mockNoShagunWedding);

      expect(answers.hasGiftsUpi).toBe(false);
      expect(answers.upiVpa).toBeNull();
    });
  });
});
