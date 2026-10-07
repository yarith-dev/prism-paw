/** Small helpers shared by the game and the bosses. */
export const PAINT = ['#ff4f6d', '#ffd23f', '#7ef0c8', '#62a8ff', '#ff8fb1', '#c6a8ff', '#ff9a3d'];
export const GREYS = ['#8d939c', '#b9bec6', '#4f545d'];
export const PLAYER_R = 0.9;

/** Rotate `from` toward `to` (radians) by at most `maxStep`. */
export const angleTo = (from, to, maxStep) => {
  let d = to - from;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return from + Math.max(-maxStep, Math.min(maxStep, d));
};

export const pick = (arr) => arr[(Math.random() * arr.length) | 0];
