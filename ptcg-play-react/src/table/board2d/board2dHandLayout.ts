/** Compress spacing first; never shrink card faces or hide overflow cards. */
export function handLayout(count: number, availableWidth: number, cardWidth: number, minStep: number, maxStep: number) {
  const fittedStep = count > 1 ? (Math.max(0, availableWidth) - cardWidth) / (count - 1) : maxStep;
  const step = Math.max(minStep, Math.min(maxStep, fittedStep));
  const contentWidth = count > 0 ? cardWidth + Math.max(0, count - 1) * step : 0;
  return { step, contentWidth, overflow: contentWidth > availableWidth + 1 };
}
