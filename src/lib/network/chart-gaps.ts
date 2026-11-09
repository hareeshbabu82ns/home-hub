/**
 * Inserts an empty point wherever consecutive samples are further apart than
 * `maxGapMs`, so charts break the line instead of drawing a smooth curve
 * through time when nothing was recorded (e.g. the collector was stopped).
 */
export function breakGaps<T extends { timestamp: number }>(
  rows: T[],
  maxGapMs: number,
  empty: (timestamp: number) => T,
): T[] {
  const out: T[] = [];
  for (const row of rows) {
    const previous = out.at(-1);
    if (previous && row.timestamp - previous.timestamp > maxGapMs) {
      out.push(empty(previous.timestamp + 1));
    }
    out.push(row);
  }
  return out;
}
