/**
 * @typedef {"tick" | "light" | "medium" | "heavy"} HapticPattern
 */

export function isIOS() {
  if (typeof window === "undefined") return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
}

/**
 * @param {HapticPattern} pattern
 */
export function haptic(pattern = "tick") {
  if (typeof navigator === "undefined") return;

  if ("vibrate" in navigator && typeof navigator.vibrate === "function") {
    const ms =
      pattern === "tick" ? 10 :
      pattern === "light" ? 15 :
      pattern === "medium" ? 25 :
      35;
    navigator.vibrate(ms);
  }
}
