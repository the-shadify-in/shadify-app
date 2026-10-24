import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "-apple-system", "sans-serif"],
        serif: ["var(--font-serif)", "Georgia", "serif"],
        cinzel: ["var(--font-cinzel)", "Georgia", "serif"],
      },
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        ui: {
          canvas: "var(--ui-canvas)",
          surface: "var(--ui-surface)",
          border: "var(--ui-border)",
          primary: "var(--ui-primary)",
          onPrimary: "var(--ui-on-primary)",
          accent: "var(--ui-accent)",
          onAccent: "var(--ui-on-accent)",
          text: {
            primary: "var(--ui-text-primary)",
            muted: "var(--ui-text-muted)",
          },
        },
        theme: {
          primary: "var(--theme-primary)",
          onPrimary: "var(--theme-on-primary)",
          accent: "var(--theme-accent)",
          onAccent: "var(--theme-on-accent)",
          bg: "var(--theme-bg)",
          surface: "var(--theme-surface)",
          text: {
            primary: "var(--theme-text-primary)",
            muted: "var(--theme-text-muted)",
          },
          envelope: "var(--theme-envelope-bg)",
          wax: "var(--theme-wax-seal)",
        },
        brand: {
          primary: "var(--brand-primary)",
          marigold: "var(--brand-marigold)",
          teal: "var(--brand-teal)",
          indigo: "var(--brand-indigo)",
          ground: "var(--brand-ground)",
          ink: "var(--brand-ink)",
          surface: "var(--brand-surface)",
          border: "var(--brand-border)",
          tint: "var(--brand-tint)",
        },
        studio: {
          canvas: "var(--studio-canvas, #0A0B10)",
          surface: "var(--studio-surface, #12141D)",
          surfaceElevated: "var(--studio-surface-elevated, #1A1D2B)",
          surfaceHighlight: "var(--studio-surface-highlight, #252A3B)",
          border: "var(--studio-border, rgba(255, 255, 255, 0.14))",
          borderStrong: "var(--studio-border-strong, rgba(255, 255, 255, 0.22))",
          borderSubtle: "var(--studio-border-subtle, rgba(255, 255, 255, 0.14))",
          champagne: "var(--studio-champagne, #C5A059)",
          champagneLight: "var(--studio-champagne-light, #E5C07B)",
          ruby: "var(--studio-ruby, #B91C1C)",
          success: "var(--studio-success, #34D399)",
          warning: "var(--studio-warning, #FBBF24)",
          danger: "var(--studio-danger, #F87171)",
          focusRing: "var(--studio-focus-ring, #E5C07B)",
          text: {
            primary: "var(--studio-text-primary, #F8FAFC)",
            muted: "var(--studio-text-muted, #B0BACB)",
            subtle: "var(--studio-text-subtle, #94A3B8)",
          },
        },
      },
    },
  },
  plugins: [],
};
export default config;
