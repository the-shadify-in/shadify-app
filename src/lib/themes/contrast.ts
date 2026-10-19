// src/lib/themes/contrast.ts
export type ThemeColors = {
  canvas: string; // page background
  surface: string; // cards / panels
  text: string; // body text
  textMuted: string; // secondary text
  primary: string; // button / key fill
  onPrimary: string; // text on primary fill
  accent: string; // ornament, badge fill, borders (text only if it passes)
  onAccent: string; // text on accent fill
};

const HEX = /^#[0-9a-fA-F]{6}$/;

function toRgb(hex: string): [number, number, number] {
  if (!HEX.test(hex)) throw new Error(`Invalid hex color: ${hex}`);
  const h = hex.slice(1);
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

function toLinear(v: number): number {
  const c = v / 255;
  return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

export function luminance(hex: string): number {
  const rgb = toRgb(hex);
  const r = toLinear(rgb[0]);
  const g = toLinear(rgb[1]);
  const b = toLinear(rgb[2]);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrast(a: string, b: string): number {
  const lumA = luminance(a);
  const lumB = luminance(b);
  const hi = Math.max(lumA, lumB);
  const lo = Math.min(lumA, lumB);
  return (hi + 0.05) / (lo + 0.05);
}

// Colour of `fg` drawn at `opacity` over `bg`, as an opaque hex.
export function blend(fg: string, bg: string, opacity: number): string {
  const f = toRgb(fg);
  const g = toRgb(bg);
  const r = Math.round(f[0] * opacity + g[0] * (1 - opacity));
  const gr = Math.round(f[1] * opacity + g[1] * (1 - opacity));
  const b = Math.round(f[2] * opacity + g[2] * (1 - opacity));
  return "#" + [r, gr, b].map((v) => v.toString(16).padStart(2, "0")).join("");
}

type Rule = {
  id: string;
  fg: keyof ThemeColors;
  bg: keyof ThemeColors;
  min: number;
  message: string;
};

// Every foreground/background pair the components actually render.
export const ERROR_RULES: Rule[] = [
  {
    id: "text-canvas",
    fg: "text",
    bg: "canvas",
    min: 4.5,
    message: "Body text unreadable on page background",
  },
  {
    id: "text-surface",
    fg: "text",
    bg: "surface",
    min: 4.5,
    message: "Body text unreadable on cards",
  },
  {
    id: "muted-canvas",
    fg: "textMuted",
    bg: "canvas",
    min: 4.5,
    message: "Secondary text unreadable on page background",
  },
  {
    id: "muted-surface",
    fg: "textMuted",
    bg: "surface",
    min: 4.5,
    message: "Secondary text unreadable on cards",
  },
  {
    id: "onprimary-primary",
    fg: "onPrimary",
    bg: "primary",
    min: 4.5,
    message: "Button label unreadable on primary fill",
  },
  {
    id: "onaccent-accent",
    fg: "onAccent",
    bg: "accent",
    min: 4.5,
    message: "Badge label unreadable on accent fill",
  },
];

export const FOOTER_OPACITY = 0.7;

export type ContrastReport = {
  ok: boolean; // false if any ERROR rule fails
  errors: { id: string; ratio: number; min: number; message: string }[];
  warnings: string[];
  accentTextAllowed: boolean; // accent may style reading text only if true
  primaryNeedsBorder: boolean; // draw a border on primary buttons when true
  ratios: Record<string, number>;
};

export function validateContrast(c: ThemeColors): ContrastReport {
  const ratios: Record<string, number> = {};
  const errors: ContrastReport["errors"] = [];

  for (const r of ERROR_RULES) {
    const ratio = contrast(c[r.fg], c[r.bg]);
    const roundedRatio = Math.round(ratio * 100) / 100;
    ratios[r.id] = roundedRatio;
    if (ratio < r.min)
      errors.push({ id: r.id, ratio: roundedRatio, min: r.min, message: r.message });
  }

  const accentCanvas = contrast(c.accent, c.canvas);
  const accentSurface = contrast(c.accent, c.surface);
  ratios["accent-canvas"] = Math.round(accentCanvas * 100) / 100;
  ratios["accent-surface"] = Math.round(accentSurface * 100) / 100;
  const accentTextAllowed = accentCanvas >= 4.5 && accentSurface >= 4.5;

  const primaryCanvas = contrast(c.primary, c.canvas);
  ratios["primary-canvas"] = Math.round(primaryCanvas * 100) / 100;
  const primaryNeedsBorder = primaryCanvas < 3;

  const warnings: string[] = [];
  if (!accentTextAllowed)
    warnings.push(
      "Accent is below 4.5:1 on canvas/surface: use for borders, dividers and fills only, never reading text.",
    );
  if (primaryNeedsBorder) {
    const edge = contrast(c.accent, c.canvas) >= 3 ? "accent" : "text";
    warnings.push(
      `Primary fill is below 3:1 against canvas: renderer must draw a ${edge}-colored border on primary buttons.`,
    );
  }
  const footer = contrast(blend(c.textMuted, c.canvas, FOOTER_OPACITY), c.canvas);
  ratios["footer-effective"] = Math.round(footer * 100) / 100;
  if (footer < 3)
    warnings.push(
      `Footer mark at ${FOOTER_OPACITY * 100}% opacity is below 3:1; raise opacity for this theme.`,
    );

  return {
    ok: errors.length === 0,
    errors,
    warnings,
    accentTextAllowed,
    primaryNeedsBorder,
    ratios,
  };
}
