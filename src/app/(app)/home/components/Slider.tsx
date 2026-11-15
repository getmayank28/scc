import { useRef, useState } from "react";

/** Must match the phone gap between slides in `.hm-slider` (homeStyles). */
const GAP = 12;

/**
 * Desktop: renders `className`'s own layout (a stack, a grid). Phones: a
 * swipeable row with the next slide peeking in, and dots for position. The
 * swiping is CSS scroll-snap; the only JS keeps the dots in step.
 */
const Slider = ({
  className,
  count,
  label,
  children,
}: {
  className: string;
  count: number;
  /** Names the dots for screen readers: "Card 2 of 4" under this label. */
  label: string;
  children: React.ReactNode;
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  const onScroll = () => {
    const el = ref.current;
    const first = el?.firstElementChild as HTMLElement | null;
    if (!el || !first) return;
    setActive(Math.min(count - 1, Math.round(el.scrollLeft / (first.offsetWidth + GAP))));
  };

  const goTo = (i: number) => {
    const el = ref.current;
    const first = el?.children[0] as HTMLElement | undefined;
    const slide = el?.children[i] as HTMLElement | undefined;
    if (el && first && slide) el.scrollTo({ left: slide.offsetLeft - first.offsetLeft, behavior: "smooth" });
  };

  return (
    <>
      <div
        ref={ref}
        className={`${className} hm-slider${count === 1 ? " is-single" : ""}`}
        onScroll={onScroll}
      >
        {children}
      </div>
      {count > 1 && (
        <div className="hm-dots" role="tablist" aria-label={label}>
          {Array.from({ length: count }).map((_, i) => (
            <button
              key={i}
              type="button"
              role="tab"
              aria-selected={i === active}
              aria-label={`${i + 1} of ${count}`}
              className={`hm-dot${i === active ? " is-on" : ""}`}
              onClick={() => goTo(i)}
            />
          ))}
        </div>
      )}
    </>
  );
};

export default Slider;
