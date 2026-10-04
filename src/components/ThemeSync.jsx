import { useEffect } from "react";
import { settings } from "../services/content";
import useContent from "../hooks/useContent";

const DEFAULTS = {
  theme_accent: "#e0a531",
  theme_accent_deep: "#666666",
  theme_dark: "#000000",
  theme_deeper: "#000000",
  theme_light: "#f4f6f5",
  theme_ink: "#000000",
  theme_gradient_start: "#e0a531",
  theme_gradient_end: "#666666",
  theme_header: "#000000",
  theme_footer: "#000000",
  theme_backtop: "#e0a531",
};

const LEGACY_DEFAULTS = {
  theme_accent: "#9dc1c8",
  theme_accent_deep: "#4e7c86",
  theme_dark: "#151c21",
  theme_deeper: "#0f1418",
  theme_ink: "#212a31",
  theme_gradient_start: "#9dc1c8",
  theme_gradient_end: "#4e7c86",
  theme_header: "#151c21",
  theme_footer: "#0f1418",
  theme_backtop: "#9dc1c8",
};

const THEME_VARIABLES = {
  theme_accent: ["--accent", "--accent-light"],
  theme_accent_deep: ["--accent-deep", "--accent-darker", "--accent-strong"],
  theme_dark: ["--deep", "--deep-2", "--deep-3"],
  theme_deeper: ["--deeper"],
  theme_light: ["--light", "--light-2"],
  theme_ink: ["--ink", "--ink-2", "--ink-soft"],
  theme_gradient_start: ["--gradient-start"],
  theme_gradient_end: ["--gradient-end"],
  theme_header: ["--header-bg"],
  theme_footer: ["--footer-bg"],
  theme_backtop: ["--backtop-bg"],
};

function isHex(value) {
  return /^#[0-9a-f]{6}$/i.test(String(value || ""));
}

export function resolveThemeValue(key, value) {
  const normalized = String(value || "").toLowerCase();
  return normalized === LEGACY_DEFAULTS[key] ? DEFAULTS[key] : value || DEFAULTS[key];
}

function rgba(hex, alpha) {
  const value = hex.slice(1);
  const red = Number.parseInt(value.slice(0, 2), 16);
  const green = Number.parseInt(value.slice(2, 4), 16);
  const blue = Number.parseInt(value.slice(4, 6), 16);
  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}

export default function ThemeSync() {
  const { data } = useContent(settings.map, null);

  useEffect(() => {
    const root = document.documentElement;
    Object.entries(THEME_VARIABLES).forEach(([key, variables]) => {
      const value = data?.[key]?.value;
      const resolved = resolveThemeValue(key, value);
      const color = isHex(resolved) ? resolved : DEFAULTS[key];
      variables.forEach((variable) => root.style.setProperty(variable, color));
    });
    const accentValue = resolveThemeValue("theme_accent", data?.theme_accent?.value);
    const accentDeepValue = resolveThemeValue("theme_accent_deep", data?.theme_accent_deep?.value);
    const gradientStartValue = resolveThemeValue("theme_gradient_start", data?.theme_gradient_start?.value);
    const gradientEndValue = resolveThemeValue("theme_gradient_end", data?.theme_gradient_end?.value);
    const accent = isHex(accentValue) ? accentValue : DEFAULTS.theme_accent;
    const accentDeep = isHex(accentDeepValue) ? accentDeepValue : DEFAULTS.theme_accent_deep;
    const gradientStart = isHex(gradientStartValue) ? gradientStartValue : DEFAULTS.theme_gradient_start;
    const gradientEnd = isHex(gradientEndValue) ? gradientEndValue : DEFAULTS.theme_gradient_end;
    const headerValue = resolveThemeValue("theme_header", data?.theme_header?.value);
    const header = isHex(headerValue) ? headerValue : DEFAULTS.theme_header;
    root.style.setProperty("--accent-soft", rgba(accent, 0.12));
    root.style.setProperty("--accent-glow", rgba(accent, 0.28));
    root.style.setProperty("--header-bg-transparent", rgba(header, 0.84));
    root.style.setProperty("--grad-accent", `linear-gradient(135deg, ${gradientStart} 0%, ${gradientEnd} 100%)`);
    root.style.setProperty("--grad-accent-soft", `linear-gradient(135deg, ${rgba(gradientStart, 0.9)} 0%, ${rgba(gradientEnd, 0.9)} 100%)`);
    root.style.setProperty("--shadow-accent", `0 20px 45px -20px ${rgba(accentDeep, 0.55)}`);
  }, [data]);

  return null;
}

export { DEFAULTS as THEME_DEFAULTS };
