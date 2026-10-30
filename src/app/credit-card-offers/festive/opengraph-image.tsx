import { ImageResponse } from "next/og";
import { CARDS, EYEBROW, HEADLINE } from "../_data/festive";

export const alt = HEADLINE;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Share preview for WhatsApp / social: headline plus the five vouchers. */
export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 72,
          color: "white",
          backgroundColor: "#171717",
          backgroundImage:
            "radial-gradient(70% 70% at 15% 0%, rgba(243,90,19,0.45), transparent 70%)",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 28, color: "#F35A13", fontWeight: 600 }}>{EYEBROW}</div>
          <div style={{ fontSize: 76, fontWeight: 700, lineHeight: 1.05, marginTop: 20, maxWidth: 980 }}>
            {HEADLINE}
          </div>
        </div>
        <div style={{ display: "flex", gap: 16 }}>
          {CARDS.map((c) => (
            <div
              key={c.slug}
              style={{
                display: "flex",
                flexDirection: "column",
                padding: "18px 20px",
                borderRadius: 18,
                width: 196,
                background: `linear-gradient(135deg, ${c.face.from}, ${c.face.to})`,
                border: "1px solid rgba(255,255,255,0.15)",
              }}
            >
              <div style={{ fontSize: 20, fontWeight: 600 }}>{c.name}</div>
              <div style={{ fontSize: 22, marginTop: 14, color: "#FDBA74", fontWeight: 700 }}>
                {/* One text node (Satori), and "Rs" because its fallback font has no ₹. */}
                {`Rs ${c.voucher.toLocaleString("en-IN")} ${c.joiningFee > 0 ? "back" : "voucher"}`}
              </div>
            </div>
          ))}
        </div>
        <div style={{ fontSize: 26, color: "rgba(255,255,255,0.6)" }}>FiSense</div>
      </div>
    ),
    size,
  );
}
