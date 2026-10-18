/**
 * Shadify Brand Design Tokens (Namespace: --brand-*)
 * Strictly restricted to Platform Marketing, Staff Admin, and Empty/Error States.
 * NEVER injected into client/guest wedding pages.
 */

export const brandTokens = {
  name: "Shadify",
  palette: {
    primary: "#D6246E",    // Rani Pink: Primary actions, links, logo mark
    secondary: {
      marigold: "#F5A524", // Festive highlights, badges (use with midnight text)
      teal: "#0E9F8E",     // Peacock Teal: Supporting accents, charts
      indigo: "#3D3BC4",   // Royal Indigo: Technical info states, gradients
    },
    neutral: {
      ground: "#FFFBF5",   // Ivory Ground: Marketing & admin surface backgrounds
      ink: "#1F1A2E",      // Midnight Ink: High-contrast typography & sidebar
      surface: "#FFFFFF",  // Card and panel backgrounds
      border: "#EADDCF",   // Subtle borders and dividers
      tint: "#FFF1F6",     // Lotus Tint: Hover states & active selection highlights
    },
    status: {
      success: "#15803D",  // Forest Green (Distinct from brand teal)
      warning: "#B45309",  // Deep Amber
      error: "#B91C1C",    // Crimson Red
      info: "#1D4ED8",     // Cobalt Blue
    },
  },
  typography: {
    sans: 'var(--font-geist-sans), -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    serif: 'Playfair Display, Georgia, serif',
  },
} as const;

/**
 * Returns CSS variables string for platform pages (--brand-*)
 */
export function getBrandCssVariables(): string {
  return `
    --brand-primary: ${brandTokens.palette.primary};
    --brand-marigold: ${brandTokens.palette.secondary.marigold};
    --brand-teal: ${brandTokens.palette.secondary.teal};
    --brand-indigo: ${brandTokens.palette.secondary.indigo};
    --brand-ground: ${brandTokens.palette.neutral.ground};
    --brand-ink: ${brandTokens.palette.neutral.ink};
    --brand-surface: ${brandTokens.palette.neutral.surface};
    --brand-border: ${brandTokens.palette.neutral.border};
    --brand-tint: ${brandTokens.palette.neutral.tint};
    --brand-status-success: ${brandTokens.palette.status.success};
    --brand-status-warning: ${brandTokens.palette.status.warning};
    --brand-status-error: ${brandTokens.palette.status.error};
  `;
}
