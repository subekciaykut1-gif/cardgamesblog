export default function AdBannerSlot({ position }: { position: "top" | "bottom" }) {
  return (
    <div className="ad-banner" aria-label={`Advertisement — ${position}`}>
      🎯 Ad Banner
    </div>
  );
}
