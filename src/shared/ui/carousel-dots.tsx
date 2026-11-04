import { cn } from "@/lib/utils";

interface CarouselDotsProps {
  count: number;
  index: number;
  onChange: (index: number) => void;
  /** Accessible name of the dot group, e.g. "Obras em destaque". */
  label: string;
  /** Figma sizes: 7px on mobile, 8px in the desktop hero, 12px under the grid. */
  size?: "sm" | "md";
  className?: string;
}

/**
 * Figma `Carousel Dots`: filled circle for the current page, outlined for the rest.
 * They are real buttons so the prototype's static dots gain the navigation they imply.
 */
export function CarouselDots({
  count,
  index,
  onChange,
  label,
  size = "md",
  className,
}: CarouselDotsProps) {
  if (count < 2) return null;

  const dot =
    size === "sm"
      ? "size-[7px] gap-[7px] sm:size-2 sm:gap-2"
      : "size-3";
  // Figma draws the three hero dots as identical solid circles, with no hollow
  // "inactive" state; only the wider collection carousel keeps outlines.
  const solid = size === "sm";

  return (
    <div
      role="group"
      aria-label={label}
      className={cn("flex gap-[7px] sm:gap-2", className)}
    >
      {Array.from({ length: count }, (_, position) => {
        const current = position === index;
        return (
          <button
            key={position}
            type="button"
            aria-label={`${label}: item ${position + 1} de ${count}`}
            aria-current={current ? "true" : undefined}
            onClick={() => onChange(position)}
            className={cn(
              dot,
              "rounded-full border-[1.3px] transition-colors focus-visible:ring-highlight focus-visible:outline-none focus-visible:ring-2",
              solid || current
                ? "bg-primary border-primary"
                : "border-primary hover:bg-primary/40",
            )}
          />
        );
      })}
    </div>
  );
}
