import Image from "next/image";
import { categories, quickMerchants } from "@/app/(app)/spend-optimizer/data";

/**
 * A merchant's logo or a category's icon, on the same fixed-size chip the
 * optimizer uses, so the home page and the optimizer read as one product.
 * Merchants without an asset fall back to their initial.
 */
const Mark = ({
  merchant,
  category,
  size = "md",
}: {
  merchant?: string | null;
  category?: string | null;
  size?: "sm" | "md";
}) => {
  const cls = `hm-mark hm-mark--${size}`;

  if (merchant) {
    const q = quickMerchants.find(
      (m) => m.label.toLowerCase() === merchant.trim().toLowerCase(),
    );
    if (q?.logo) {
      return (
        <span
          aria-hidden
          className={`${cls}${q.logoOnDark ? " is-inked" : ""}${q.logoBleed ? " is-bleed" : ""}${q.logoPortrait ? " is-portrait" : ""}${q.logoScale ? " is-wide" : ""}`}
          style={
            q.logoScale
              ? ({ "--hm-logo-scale": q.logoScale } as React.CSSProperties)
              : undefined
          }
        >
          <Image src={q.logo} alt="" width={36} height={36} className="hm-mark-img" />
        </span>
      );
    }
    return (
      <span aria-hidden className={`${cls} is-initial`}>
        {merchant.trim().charAt(0).toUpperCase()}
      </span>
    );
  }

  const Icon = categories.find((c) => c.value === category)?.icon;
  return (
    <span aria-hidden className={`${cls} is-icon`}>
      {Icon ? <Icon className="hm-mark-icon" strokeWidth={1.75} /> : null}
    </span>
  );
};

export default Mark;
