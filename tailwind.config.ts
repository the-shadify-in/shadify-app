import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
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
      },
    },
  },
  plugins: [],
};
export default config;
