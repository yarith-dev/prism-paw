/** Player settings. Stored apart from the save so "New game" keeps them. */
const KEY = 'prism-paw-settings-v1';
const DEFAULTS = { music: 0.7, sfx: 0.8, shake: true, textSpeed: 'normal', musicTheme: 'original' };

/** Comic caption typing speed in characters per 22 ms tick (0 = show at once). */
export const TEXT_SPEEDS = { slow: 1, normal: 2, fast: 4, instant: 0 };

export const settings = {
  ...DEFAULTS,
  listeners: [],
  load() {
    try { Object.assign(this, DEFAULTS, JSON.parse(localStorage.getItem(KEY) || '{}')); } catch { /* keep defaults */ }
    if (!(this.textSpeed in TEXT_SPEEDS)) this.textSpeed = DEFAULTS.textSpeed;
  },
  set(key, value) {
    this[key] = value;
    try { localStorage.setItem(KEY, JSON.stringify(Object.fromEntries(Object.keys(DEFAULTS).map((k) => [k, this[k]])))); } catch { /* private mode */ }
    this.listeners.forEach((fn) => fn(key, value));
  },
  onChange(fn) { this.listeners.push(fn); },
};
settings.load();
