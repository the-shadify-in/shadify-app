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
          canvas: "#0A0B10",
          surface: "#12141D",
          surfaceElevated: "#1A1D2B",
          surfaceHighlight: "#222638",
          border: "rgba(255, 255, 255, 0.08)",
          borderSubtle: "rgba(255, 255, 255, 0.12)",
          champagne: "#C5A059",
          champagneLight: "#D8B570",
          ruby: "#B91C1C",
          text: {
            primary: "#F8FAFC",
            muted: "#94A3B8",
            subtle: "#64748B",
          },
        },
      },
    },
  },
  plugins: [],
};
export default config;
