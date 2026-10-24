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
          canvas: "var(--studio-canvas, #FBF9F5)",
          surface: "var(--studio-surface, #FFFFFF)",
          surfaceElevated: "var(--studio-surface-elevated, #F7F4EE)",
          surfaceHighlight: "var(--studio-surface-highlight, #EFEBE1)",
          border: "var(--studio-border, #E8E2D5)",
          borderStrong: "var(--studio-border-strong, #D4CBB9)",
          borderSubtle: "var(--studio-border-subtle, #F2ECE0)",
          champagne: "var(--studio-champagne, #9C7C38)",
          champagneLight: "var(--studio-champagne-light, #B38E46)",
          champagneSoft: "var(--studio-champagne-soft, #F7F2E7)",
          champagneBorder: "var(--studio-champagne-border, #E2D5BA)",
          ruby: "var(--studio-ruby, #991B1B)",
          success: "var(--studio-success, #2D5442)",
          warning: "var(--studio-warning, #92400E)",
          danger: "var(--studio-danger, #991B1B)",
          info: "var(--studio-info, #1E3A5F)",
          focusRing: "var(--studio-focus-ring, #9C7C38)",
          text: {
            primary: "var(--studio-text-primary, #1C1917)",
            muted: "var(--studio-text-muted, #57534E)",
            subtle: "var(--studio-text-subtle, #78716C)",
          },
        },
      },
    },
  },
  plugins: [],
};
export default config;
