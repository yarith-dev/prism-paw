/**
 * The loading screen: a title, a progress bar and the step under way. Everything slow that the
 * game would otherwise do the first time something appears (compiling shaders, uploading
 * geometry and textures, drawing portraits) happens behind it instead of in the middle of play.
 */

/**
 * Let the browser paint (so the bar moves) before the next step. A hidden tab gets no animation
 * frames, so a timer carries on there.
 */
export function nextFrame() {
  return new Promise((resolve) => {
    let done = false;
    const go = () => { if (!done) { done = true; resolve(); } };
    requestAnimationFrame(() => setTimeout(go, 0));
    setTimeout(go, 100);
  });
}

export class Loading {
  constructor(main) {
    this.el = main.querySelector('#loading');
    this.title = this.el.querySelector('.ld-title');
    this.bar = this.el.querySelector('.ld-bar i');
    this.step = this.el.querySelector('.ld-step');
    this.busy = false;
  }

  get open() { return !this.el.classList.contains('hidden'); }

  /**
   * Run `steps`, each [label, weight, fn], behind the loading screen. `fn` may be async and gets a
   * `progress(0..1)` callback for long steps.
   */
  async run(title, steps) {
    this.busy = true;
    this.title.textContent = title;
    this.el.classList.remove('hidden');
    const total = steps.reduce((sum, s) => sum + s[1], 0);
    const show = (done) => { this.bar.style.width = `${Math.round((done / total) * 100)}%`; };
    let done = 0;
    show(0);
    this.times = []; // [label, ms] of the last run, for tuning
    try {
      for (const [label, weight, fn] of steps) {
        this.step.textContent = label;
        show(done);
        await nextFrame();
        const start = done, t = performance.now();
        await fn((f) => show(start + weight * Math.min(1, f)));
        this.times.push([label, Math.round(performance.now() - t)]);
        done += weight;
      }
      show(total);
      await nextFrame();
    } finally {
      this.el.classList.add('hidden');
      this.busy = false;
    }
  }
}
