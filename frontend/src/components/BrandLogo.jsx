/**
 * Rehab360 wordmark — uses /rehab360-logo.svg from public/.
 * variant "onDark": light logo for dark backgrounds (e.g. zinc-900 boxes)
 * variant "onLight": default colors for light backgrounds
 */
export default function BrandLogo({ variant = "onLight", size = "md", className = "" }) {
  const sizes = { sm: "h-7 w-7", md: "h-9 w-9", lg: "h-10 w-10", xs: "h-6 w-6" };
  const dim = sizes[size] || sizes.md;
  const tone =
    variant === "onDark" ? "brightness-0 invert" : "";
  return (
    <img
      src="/rehab360-logo.svg"
      alt="Rehab360"
      className={`${dim} object-contain ${tone} ${className}`.trim()}
    />
  );
}
