/**
 * Listeners on window and document go through listen(), so the game can remove them all when it
 * stops (inside the gaming gateway, whose page lives on after the game is gone).
 */
const life = new AbortController();

export function listen(target, type, fn, options = {}) {
  target.addEventListener(type, fn, { ...options, signal: life.signal });
}

export function endListeners() {
  life.abort();
}
