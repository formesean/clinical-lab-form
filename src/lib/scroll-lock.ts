/**
 * Removes stale body/html scroll-lock styles that modal libraries (e.g. Radix)
 * may leave behind after a dialog closes.
 *
 * Call this after a dialog transitions to closed, deferred with
 * requestAnimationFrame so active close animations finish first.
 */
export function cleanupStaleScrollLock(): void {
  // Check whether any Radix dialog (or generic [role="dialog"]) is still open.
  const hasOpenDialog = document.querySelector('[role="dialog"]') !== null;
  if (hasOpenDialog) return;

  // Remove inline overflow/pointer-events lock styles set by Radix scroll-lock.
  const body = document.body;
  const html = document.documentElement;

  body.style.removeProperty("overflow");
  body.style.removeProperty("pointer-events");
  body.style.removeProperty("padding-right"); // compensate-for-scrollbar offset

  html.style.removeProperty("overflow");

  // Remove data attributes used by some Radix versions to signal locked state.
  body.removeAttribute("data-scroll-locked");
  html.removeAttribute("data-scroll-locked");
}
