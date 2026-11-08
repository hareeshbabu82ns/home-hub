"use client";

import { AnimatePresence, MotionConfig, motion, useSpring, useTransform } from "motion/react";
import Link from "next/link";
import { useEffect, type ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * Ranked list whose rows glide to their new position when the order changes,
 * with bars that grow/shrink and numbers that count to their new value.
 * Respects the user's reduced-motion setting.
 */

export interface LeaderboardItem {
  id: string;
  label: string;
  href?: string;
  sublabel?: string;
  /** Ranking value; bar length is value / max. */
  value: number;
  /** Optional split of `value` (e.g. download vs upload) drawn as two segments. */
  split?: [number, number];
  /** Extra content on the right (badges…). */
  extra?: ReactNode;
}

const SPRING = { type: "spring", stiffness: 380, damping: 34, mass: 0.8 } as const;

/** A number that springs to new values; `format` renders it. */
export function AnimatedNumber({ value, format }: { value: number; format: (value: number) => string }) {
  const spring = useSpring(value, { stiffness: 140, damping: 24 });
  const text = useTransform(spring, (current) => format(current));
  useEffect(() => {
    spring.set(value);
  }, [spring, value]);
  return <motion.span className="tabular-nums">{text}</motion.span>;
}

export function AnimatedLeaderboard({
  items,
  format,
  formatSplit,
  splitLabels = ["", ""],
  emptyText,
  limit = 10,
  className,
}: {
  items: LeaderboardItem[];
  format: (value: number) => string;
  /** Formats each split segment (defaults to `format`). */
  formatSplit?: (value: number) => string;
  splitLabels?: [string, string];
  emptyText: string;
  limit?: number;
  className?: string;
}) {
  const ranked = [...items].sort((a, b) => b.value - a.value).slice(0, limit);
  const max = Math.max(1, ...ranked.map((item) => item.value));

  if (ranked.length === 0) {
    return <p className="text-muted-foreground text-sm">{emptyText}</p>;
  }

  return (
    <MotionConfig reducedMotion="user">
      <motion.ol layout className={cn("space-y-2", className)}>
        <AnimatePresence initial={false} mode="popLayout">
          {ranked.map((item, index) => {
            const share = (item.value / max) * 100;
            const [a, b] = item.split ?? [item.value, 0];
            const total = a + b || 1;
            return (
              <motion.li
                key={item.id}
                layout="position"
                initial={{ opacity: 0, y: 8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, x: -12, transition: { duration: 0.15 } }}
                transition={SPRING}
                className="bg-card relative overflow-hidden rounded-lg border p-3"
              >
                {/* Relative-size bar behind the row content. */}
                <motion.div
                  aria-hidden
                  className="absolute inset-y-0 left-0 flex overflow-hidden opacity-[0.12]"
                  initial={false}
                  animate={{ width: `${share}%` }}
                  transition={{ type: "spring", stiffness: 120, damping: 22 }}
                >
                  <div className="h-full bg-sky-500" style={{ width: `${(a / total) * 100}%` }} />
                  {item.split && <div className="h-full bg-teal-500" style={{ width: `${(b / total) * 100}%` }} />}
                </motion.div>

                <div className="relative flex items-center gap-3">
                  <motion.span
                    layout="position"
                    className={cn(
                      "flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold tabular-nums",
                      index === 0 ? "bg-amber-400/90 text-amber-950" : "bg-muted text-muted-foreground",
                    )}
                  >
                    {index + 1}
                  </motion.span>
                  <div className="min-w-0 flex-1">
                    {item.href ? (
                      <Link href={item.href} className="block truncate font-medium hover:underline">
                        {item.label}
                      </Link>
                    ) : (
                      <p className="truncate font-medium">{item.label}</p>
                    )}
                    {item.sublabel && (
                      <p className="text-muted-foreground truncate font-mono text-xs">{item.sublabel}</p>
                    )}
                  </div>
                  {item.extra}
                  <div className="shrink-0 text-right text-sm">
                    {item.split ? (
                      <>
                        <p className="font-medium">
                          {splitLabels[0]} <AnimatedNumber value={a} format={formatSplit ?? format} />
                        </p>
                        <p className="text-muted-foreground text-xs">
                          {splitLabels[1]} <AnimatedNumber value={b} format={formatSplit ?? format} />
                        </p>
                      </>
                    ) : (
                      <p className="font-medium">
                        <AnimatedNumber value={item.value} format={format} />
                      </p>
                    )}
                  </div>
                </div>
              </motion.li>
            );
          })}
        </AnimatePresence>
      </motion.ol>
    </MotionConfig>
  );
}
